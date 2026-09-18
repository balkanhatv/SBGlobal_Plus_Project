import type {
  IdempotencyStoreClaimInput,
  IdempotencyStoreClaimResult,
  IdempotencyStorePort,
} from "../../core/api/idempotency.js";
import { IdempotencyRuntimeError } from "../../core/api/idempotency.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface RecordRow {
  readonly id: string;
  readonly request_fingerprint: string;
  readonly state: "IN_PROGRESS"|"SUCCEEDED"|"FAILED_RETRYABLE"|"FAILED_FINAL";
  readonly response_status: string|null;
  readonly response_reference: string|null;
  readonly expires_at: Date|string;
}

function dependency(): never {
  throw new IdempotencyRuntimeError(
    "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE",
    "Idempotency persistence is unavailable.",
  );
}

function resultFromRow(row: RecordRow): IdempotencyStoreClaimResult {
  if (row.state==="IN_PROGRESS") return Object.freeze({kind:"IN_PROGRESS",recordId:row.id});
  if (row.state==="SUCCEEDED") return Object.freeze({
    kind:"REPLAY",recordId:row.id,
    ...(row.response_status ? {responseStatus:row.response_status}:{}),
    ...(row.response_reference ? {responseReference:row.response_reference}:{}),
  });
  if (row.state==="FAILED_FINAL") return Object.freeze({
    kind:"FINAL_FAILURE",recordId:row.id,
    ...(row.response_status ? {responseStatus:row.response_status}:{}),
    ...(row.response_reference ? {responseReference:row.response_reference}:{}),
  });
  dependency();
}

export class PostgresIdempotencyStore implements IdempotencyStorePort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async claim(input: IdempotencyStoreClaimInput): Promise<IdempotencyStoreClaimResult> {
    try {
      return await this.scopedSql.withContext(input.requestContext,async(sql)=>{
        const params=[
          input.requestContext.tenantId,
          input.requestContext.industryContextId ?? null,
          input.actorId,
          input.operationId,
          input.idempotencyKeyHash,
        ] as const;

        let current=await sql.query<RecordRow>(
          `SELECT id::text,request_fingerprint,state::text,response_status,response_reference,expires_at
             FROM core_integration.idempotency_record
            WHERE tenant_id=$1::uuid
              AND industry_context_id IS NOT DISTINCT FROM $2::uuid
              AND credential_or_principal_id=$3::uuid
              AND operation_id=$4
              AND idempotency_key_hash=$5
            FOR UPDATE`,
          params,
        );

        if (current.rowCount===0) {
          const inserted=await sql.query<{id:string}>(
            `INSERT INTO core_integration.idempotency_record(
               id,tenant_id,industry_context_id,credential_or_principal_id,operation_id,
               idempotency_key_hash,request_fingerprint,state,expires_at,created_at,updated_at
             ) VALUES (
               $1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6,$7,'IN_PROGRESS',$8::timestamptz,$9::timestamptz,$9::timestamptz
             )
             ON CONFLICT DO NOTHING
             RETURNING id::text`,
            [
              input.recordId,
              input.requestContext.tenantId,
              input.requestContext.industryContextId ?? null,
              input.actorId,
              input.operationId,
              input.idempotencyKeyHash,
              input.requestFingerprint,
              input.expiresAt.toISOString(),
              input.now.toISOString(),
            ],
          );
          if (inserted.rowCount===1) {
            return Object.freeze({kind:"STARTED",recordId:input.recordId,expiresAt:input.expiresAt});
          }
          current=await sql.query<RecordRow>(
            `SELECT id::text,request_fingerprint,state::text,response_status,response_reference,expires_at
               FROM core_integration.idempotency_record
              WHERE tenant_id=$1::uuid
                AND industry_context_id IS NOT DISTINCT FROM $2::uuid
                AND credential_or_principal_id=$3::uuid
                AND operation_id=$4
                AND idempotency_key_hash=$5
              FOR UPDATE`,
            params,
          );
        }

        if (current.rowCount!==1 || !current.rows[0]) dependency();
        const row=current.rows[0];
        const rowExpiry=new Date(row.expires_at);
        if (Number.isNaN(rowExpiry.getTime())) dependency();

        if (rowExpiry.getTime()<=input.now.getTime()) {
          const reset=await sql.query<{id:string}>(
            `UPDATE core_integration.idempotency_record
                SET request_fingerprint=$2,
                    response_status=NULL,
                    response_reference=NULL,
                    state='IN_PROGRESS',
                    expires_at=$3::timestamptz,
                    created_at=$4::timestamptz,
                    updated_at=$4::timestamptz
              WHERE id=$1::uuid
              RETURNING id::text`,
            [row.id,input.requestFingerprint,input.expiresAt.toISOString(),input.now.toISOString()],
          );
          if (reset.rowCount!==1) dependency();
          return Object.freeze({kind:"STARTED",recordId:row.id,expiresAt:input.expiresAt});
        }

        if (row.request_fingerprint!==input.requestFingerprint) {
          return Object.freeze({kind:"CONFLICT",recordId:row.id});
        }

        if (row.state==="FAILED_RETRYABLE") {
          const retried=await sql.query<{id:string}>(
            `UPDATE core_integration.idempotency_record
                SET state='IN_PROGRESS',response_status=NULL,response_reference=NULL,updated_at=$2::timestamptz
              WHERE id=$1::uuid AND state='FAILED_RETRYABLE'
              RETURNING id::text`,
            [row.id,input.now.toISOString()],
          );
          if (retried.rowCount!==1) dependency();
          return Object.freeze({kind:"STARTED",recordId:row.id,expiresAt:rowExpiry});
        }

        return resultFromRow(row);
      });
    } catch (error) {
      if (error instanceof IdempotencyRuntimeError) throw error;
      dependency();
    }
  }

  async completeSuccess(input: Parameters<IdempotencyStorePort["completeSuccess"]>[0]): Promise<void> {
    await this.complete(input,"SUCCEEDED");
  }

  async completeFailure(input: Parameters<IdempotencyStorePort["completeFailure"]>[0]): Promise<void> {
    await this.complete(input,input.retryable ? "FAILED_RETRYABLE" : "FAILED_FINAL");
  }

  private async complete(
    input: {
      readonly requestContext: Parameters<IdempotencyStorePort["completeSuccess"]>[0]["requestContext"];
      readonly recordId: string;
      readonly requestFingerprint: string;
      readonly now: Date;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    },
    state: "SUCCEEDED"|"FAILED_RETRYABLE"|"FAILED_FINAL",
  ): Promise<void> {
    try {
      await this.scopedSql.withContext(input.requestContext,async(sql)=>{
        const updated=await sql.query<{id:string}>(
          `UPDATE core_integration.idempotency_record
              SET state=$3::core_integration.idempotency_state,
                  response_status=$4,
                  response_reference=$5,
                  updated_at=$6::timestamptz
            WHERE id=$1::uuid
              AND request_fingerprint=$2
              AND state='IN_PROGRESS'
            RETURNING id::text`,
          [
            input.recordId,input.requestFingerprint,state,
            input.responseStatus ?? null,input.responseReference ?? null,input.now.toISOString(),
          ],
        );
        if (updated.rowCount!==1) dependency();
      });
    } catch (error) {
      if (error instanceof IdempotencyRuntimeError) throw error;
      dependency();
    }
  }
}
