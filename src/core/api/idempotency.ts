import type { OperationContract } from "./operation-contract.js";
import type { RequestContext } from "../context/contracts.js";

export type IdempotencyRuntimeErrorCode =
  | "IDEMPOTENCY_REQUIRED"
  | "IDEMPOTENCY_CONFLICT"
  | "IDEMPOTENCY_CONTRACT_INVALID"
  | "IDEMPOTENCY_SCOPE_UNSUPPORTED"
  | "IDEMPOTENCY_INPUT_INVALID"
  | "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE";

export class IdempotencyRuntimeError extends Error {
  readonly code: IdempotencyRuntimeErrorCode;
  constructor(code: IdempotencyRuntimeErrorCode, message: string) {
    super(message);
    this.name="IdempotencyRuntimeError";
    this.code=code;
  }
}

export interface IdempotencyStarted {
  readonly kind: "STARTED";
  readonly recordId: string;
  readonly requestFingerprint: string;
  readonly expiresAt: string;
}

export type IdempotencyBeginResult =
  | { readonly kind: "BYPASS" }
  | IdempotencyStarted
  | { readonly kind: "IN_PROGRESS"; readonly recordId: string }
  | {
      readonly kind: "REPLAY";
      readonly recordId: string;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    }
  | {
      readonly kind: "FINAL_FAILURE";
      readonly recordId: string;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    };

export interface IdempotencyDigestPort {
  sha256(value: string): string;
}

export interface IdempotencyRuntimePort {
  now(): Date;
  nextId(): string;
}

export interface IdempotencyWindowPort {
  expiresAt(input: { readonly now: Date; readonly operation: OperationContract }): Date;
}

export interface IdempotencyStoreClaimInput {
  readonly requestContext: RequestContext;
  readonly recordId: string;
  readonly actorId: string;
  readonly operationId: string;
  readonly idempotencyKeyHash: string;
  readonly requestFingerprint: string;
  readonly now: Date;
  readonly expiresAt: Date;
}

export type IdempotencyStoreClaimResult =
  | { readonly kind: "STARTED"; readonly recordId: string; readonly expiresAt: Date }
  | { readonly kind: "IN_PROGRESS"; readonly recordId: string }
  | {
      readonly kind: "REPLAY";
      readonly recordId: string;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    }
  | {
      readonly kind: "FINAL_FAILURE";
      readonly recordId: string;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    }
  | { readonly kind: "CONFLICT"; readonly recordId: string };

export interface IdempotencyStorePort {
  claim(input: IdempotencyStoreClaimInput): Promise<IdempotencyStoreClaimResult>;
  completeSuccess(input: {
    readonly requestContext: RequestContext;
    readonly recordId: string;
    readonly requestFingerprint: string;
    readonly now: Date;
    readonly responseStatus?: string;
    readonly responseReference?: string;
  }): Promise<void>;
  completeFailure(input: {
    readonly requestContext: RequestContext;
    readonly recordId: string;
    readonly requestFingerprint: string;
    readonly now: Date;
    readonly retryable: boolean;
    readonly responseStatus?: string;
    readonly responseReference?: string;
  }): Promise<void>;
}

export interface IdempotencyServicePorts {
  readonly store: IdempotencyStorePort;
  readonly digest: IdempotencyDigestPort;
  readonly runtime: IdempotencyRuntimePort;
  readonly window: IdempotencyWindowPort;
}

const HEX64=/^[0-9a-f]{64}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function inputInvalid(message: string): never {
  throw new IdempotencyRuntimeError("IDEMPOTENCY_INPUT_INVALID",message);
}

function validateResponseMetadata(status?: string, reference?: string): void {
  if (status!==undefined && (status.length<1 || status.length>64)) {
    inputInvalid("Idempotency response status is invalid.");
  }
  if (reference!==undefined && (reference.length<1 || reference.length>512)) {
    inputInvalid("Idempotency response reference is invalid.");
  }
}

export class IdempotencyService {
  constructor(private readonly ports: IdempotencyServicePorts) {}

  async begin(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly idempotencyKey?: string;
    readonly canonicalValidatedInput: string;
  }): Promise<IdempotencyBeginResult> {
    const {operation,requestContext}=input;

    if (operation.idempotencyPolicy==="NONE") return Object.freeze({kind:"BYPASS" as const});
    if (operation.kind!=="COMMAND") {
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_CONTRACT_INVALID",
        "Only commands may require idempotency.",
      );
    }
    if (requestContext.scopeClass!==operation.scopeClass
      || (requestContext.scopeClass!=="TENANT_CORE" && requestContext.scopeClass!=="TENANT_INDUSTRY")
      || !requestContext.tenantId
      || (requestContext.scopeClass==="TENANT_CORE" && requestContext.industryContextId)
      || (requestContext.scopeClass==="TENANT_INDUSTRY" && !requestContext.industryContextId)) {
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_SCOPE_UNSUPPORTED",
        "Idempotency is unavailable for the current operation scope.",
      );
    }

    if (!input.idempotencyKey) {
      if (operation.idempotencyPolicy==="OPTIONAL") {
        return Object.freeze({kind:"BYPASS" as const});
      }
      throw new IdempotencyRuntimeError("IDEMPOTENCY_REQUIRED","An idempotency key is required.");
    }
    if (input.idempotencyKey.length>512 || input.idempotencyKey.trim().length===0) {
      inputInvalid("Idempotency key is invalid.");
    }
    if (typeof input.canonicalValidatedInput!=="string") {
      inputInvalid("Validated request fingerprint source is unavailable.");
    }

    const actorId=requestContext.credentialId ?? requestContext.principalId;
    if (!actorId || !UUID.test(actorId)) {
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_SCOPE_UNSUPPORTED",
        "A resolved principal or credential is required for idempotency.",
      );
    }

    const now=this.ports.runtime.now();
    const expiresAt=this.ports.window.expiresAt({now,operation});
    const recordId=this.ports.runtime.nextId();
    if (!(now instanceof Date) || Number.isNaN(now.getTime())
      || !(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())
      || expiresAt.getTime()<=now.getTime()
      || !UUID.test(recordId)) {
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE",
        "Idempotency runtime policy is unavailable.",
      );
    }

    const keyHash=this.ports.digest.sha256(`idempotency-key:v1:${input.idempotencyKey}`);
    const requestFingerprint=this.ports.digest.sha256(
      `idempotency-request:v1:${operation.operationId}:${operation.inputSchemaVersion}:${input.canonicalValidatedInput}`,
    );
    if (!HEX64.test(keyHash) || !HEX64.test(requestFingerprint)) {
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE",
        "Idempotency digest service is unavailable.",
      );
    }

    let result:IdempotencyStoreClaimResult;
    try {
      result=await this.ports.store.claim({
        requestContext,
        recordId,
        actorId,
        operationId:operation.operationId,
        idempotencyKeyHash:keyHash.toLowerCase(),
        requestFingerprint:requestFingerprint.toLowerCase(),
        now,
        expiresAt,
      });
    } catch (error) {
      if (error instanceof IdempotencyRuntimeError) throw error;
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE",
        "Idempotency state is unavailable.",
      );
    }

    if (result.kind==="CONFLICT") {
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_CONFLICT",
        "The idempotency key was already used with a different request.",
      );
    }
    if (result.kind==="STARTED") {
      return Object.freeze({
        kind:"STARTED",
        recordId:result.recordId,
        requestFingerprint:requestFingerprint.toLowerCase(),
        expiresAt:result.expiresAt.toISOString(),
      });
    }
    return Object.freeze({...result});
  }

  async completeSuccess(input: {
    readonly requestContext: RequestContext;
    readonly started: IdempotencyStarted;
    readonly responseStatus?: string;
    readonly responseReference?: string;
  }): Promise<void> {
    validateResponseMetadata(input.responseStatus,input.responseReference);
    try {
      await this.ports.store.completeSuccess({
        requestContext:input.requestContext,
        recordId:input.started.recordId,
        requestFingerprint:input.started.requestFingerprint,
        now:this.ports.runtime.now(),
        responseStatus:input.responseStatus,
        responseReference:input.responseReference,
      });
    } catch (error) {
      if (error instanceof IdempotencyRuntimeError) throw error;
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE",
        "Idempotency completion state is unavailable.",
      );
    }
  }

  async completeFailure(input: {
    readonly requestContext: RequestContext;
    readonly started: IdempotencyStarted;
    readonly retryable: boolean;
    readonly responseStatus?: string;
    readonly responseReference?: string;
  }): Promise<void> {
    validateResponseMetadata(input.responseStatus,input.responseReference);
    try {
      await this.ports.store.completeFailure({
        requestContext:input.requestContext,
        recordId:input.started.recordId,
        requestFingerprint:input.started.requestFingerprint,
        now:this.ports.runtime.now(),
        retryable:input.retryable,
        responseStatus:input.responseStatus,
        responseReference:input.responseReference,
      });
    } catch (error) {
      if (error instanceof IdempotencyRuntimeError) throw error;
      throw new IdempotencyRuntimeError(
        "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE",
        "Idempotency completion state is unavailable.",
      );
    }
  }
}
