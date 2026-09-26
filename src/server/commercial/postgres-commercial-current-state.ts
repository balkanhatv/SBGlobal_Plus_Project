import type { RequestContext } from "../../core/context/contracts.js";
import {
  CommercialStateError,
  type CommercialCurrentStateRead,
  type CommercialCurrentStateReadStorePort,
  type CommercialEntitlementValueType,
  type CommercialLicenseType,
  type CommercialSubscriptionState,
  type CurrentCommercialEntitlementRead,
  type CurrentCommercialLicenseRead,
} from "../../core/commercial/current-state.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface SnapshotRow {
  readonly snapshot_id: string;
  readonly snapshot_version: string | number;
  readonly subscription_id: string;
  readonly subscription_state: string;
  readonly deny_set_json: unknown;
}

interface LicenseRow {
  readonly id: string;
  readonly license_type: string;
  readonly subject_key: string;
  readonly industry_context_id: string | null;
  readonly principal_id: string | null;
  readonly is_effective: boolean;
}

interface EntitlementRow {
  readonly entitlement_code: string;
  readonly value_type: string;
  readonly value_json: unknown;
}

const SUBSCRIPTION_STATES = new Set([
  "PENDING", "TRIAL", "ACTIVE", "GRACE", "SUSPENDED", "EXPIRED", "CANCELLED",
]);
const LICENSE_TYPES = new Set([
  "INDUSTRY", "MANAGEMENT_SYSTEM", "SEAT", "SURFACE", "API_SERVICE",
]);
const ENTITLEMENT_VALUE_TYPES = new Set([
  "BOOLEAN", "INTEGER", "DECIMAL", "TEXT", "SET",
]);

function invalid(message: string): never {
  throw new CommercialStateError("COMMERCIAL_STATE_INVALID", message);
}

function parseVersion(value: string | number): number {
  const version = Number(value);
  if (!Number.isSafeInteger(version) || version <= 0) {
    invalid("Persisted Commercial snapshot version is invalid.");
  }
  return version;
}

function parseDenySet(value: unknown): readonly string[] {
  if (!Array.isArray(value)) invalid("Persisted Commercial deny set is invalid.");
  const items = value.map((item) => {
    if (typeof item !== "string" || item.length === 0 || item.length > 256) {
      invalid("Persisted Commercial deny-set item is invalid.");
    }
    return item;
  });
  if (new Set(items).size !== items.length) {
    invalid("Persisted Commercial deny set contains duplicates.");
  }
  return Object.freeze([...items].sort());
}

function parseSubscriptionState(value: string): CommercialSubscriptionState {
  if (!SUBSCRIPTION_STATES.has(value)) invalid("Persisted subscription state is invalid.");
  return value as CommercialSubscriptionState;
}

function parseLicense(row: LicenseRow): CurrentCommercialLicenseRead {
  if (!LICENSE_TYPES.has(row.license_type)) invalid("Persisted license type is invalid.");
  if (!row.subject_key || row.subject_key.length > 256) {
    invalid("Persisted license subject is invalid.");
  }
  return Object.freeze({
    id: row.id,
    licenseType: row.license_type as CommercialLicenseType,
    subjectKey: row.subject_key,
    ...(row.industry_context_id ? { industryContextId: row.industry_context_id } : {}),
    ...(row.principal_id ? { principalId: row.principal_id } : {}),
    isEffective: row.is_effective === true,
  });
}

function parseEntitlement(row: EntitlementRow): CurrentCommercialEntitlementRead {
  if (!ENTITLEMENT_VALUE_TYPES.has(row.value_type)) {
    invalid("Persisted entitlement value type is invalid.");
  }
  if (!row.entitlement_code || row.entitlement_code.length > 256) {
    invalid("Persisted entitlement code is invalid.");
  }
  return Object.freeze({
    code: row.entitlement_code,
    valueType: row.value_type as CommercialEntitlementValueType,
    value: row.value_json,
  });
}

async function readCurrent(
  transaction: SqlTransaction,
  context: RequestContext,
): Promise<CommercialCurrentStateRead | null> {
  const snapshotResult = await transaction.query<SnapshotRow>(
    `SELECT snapshot.id AS snapshot_id,
            snapshot.version AS snapshot_version,
            subscription.id AS subscription_id,
            subscription.state::text AS subscription_state,
            snapshot.deny_set_json
       FROM core_commercial.entitlement_snapshot snapshot
       JOIN core_commercial.subscription subscription
         ON subscription.id=snapshot.source_subscription_id
        AND subscription.tenant_id=snapshot.tenant_id
        AND subscription.plan_version_id=snapshot.source_plan_version_id
       JOIN core_tenancy.tenant tenant
         ON tenant.id=snapshot.tenant_id
        AND tenant.current_subscription_id=subscription.id
      WHERE snapshot.tenant_id=$1::uuid
        AND snapshot.status='CURRENT'
        AND snapshot.valid_from<=CURRENT_TIMESTAMP
        AND (snapshot.expires_at IS NULL OR snapshot.expires_at>CURRENT_TIMESTAMP)`,
    [context.tenantId],
  );

  if (snapshotResult.rowCount === 0) return null;
  if (snapshotResult.rowCount !== 1 || !snapshotResult.rows[0]) {
    invalid("Current Commercial snapshot is ambiguous.");
  }
  const snapshot = snapshotResult.rows[0];

  const licenseResult = await transaction.query<LicenseRow>(
    `SELECT id,
            license_type::text,
            subject_key,
            industry_context_id,
            principal_id,
            (
              status='ACTIVE'
              AND valid_from<=CURRENT_TIMESTAMP
              AND (valid_until IS NULL OR valid_until>CURRENT_TIMESTAMP)
            ) AS is_effective
       FROM core_commercial.license
      WHERE tenant_id=$1::uuid
        AND subscription_id=$2::uuid
        AND (industry_context_id IS NULL OR industry_context_id IS NOT DISTINCT FROM $3::uuid)
      ORDER BY license_type, subject_key, id`,
    [context.tenantId, snapshot.subscription_id, context.industryContextId ?? null],
  );

  const entitlementResult = await transaction.query<EntitlementRow>(
    `SELECT DISTINCT ON (fact.entitlement_code)
            fact.entitlement_code,
            definition.value_type::text,
            fact.value_json
       FROM core_commercial.entitlement_snapshot_fact fact
       JOIN core_commercial.entitlement_definition definition
         ON definition.code=fact.entitlement_code
        AND definition.status='ACTIVE'
      WHERE fact.snapshot_id=$1::uuid
        AND fact.tenant_id=$3::uuid
        AND (fact.industry_context_id IS NULL OR fact.industry_context_id IS NOT DISTINCT FROM $2::uuid)
        AND fact.effective_from<=CURRENT_TIMESTAMP
        AND (fact.effective_to IS NULL OR fact.effective_to>CURRENT_TIMESTAMP)
      ORDER BY fact.entitlement_code,
               (fact.industry_context_id IS NOT NULL) DESC,
               fact.effective_from DESC`,
    [snapshot.snapshot_id, context.industryContextId ?? null, context.tenantId],
  );

  return Object.freeze({
    snapshotId: snapshot.snapshot_id,
    snapshotVersion: parseVersion(snapshot.snapshot_version),
    subscriptionId: snapshot.subscription_id,
    subscriptionState: parseSubscriptionState(snapshot.subscription_state),
    denySet: parseDenySet(snapshot.deny_set_json),
    licenses: Object.freeze(licenseResult.rows.map(parseLicense)),
    entitlements: Object.freeze(entitlementResult.rows.map(parseEntitlement)),
  });
}

export class PostgresCommercialCurrentStateStore implements CommercialCurrentStateReadStorePort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadCurrent(input: {
    readonly requestContext: RequestContext;
  }): Promise<CommercialCurrentStateRead | null> {
    const context = input.requestContext;
    if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
      || !context.tenantId
      || !context.principalId) {
      throw new CommercialStateError(
        "COMMERCIAL_SCOPE_UNSUPPORTED",
        "Commercial PostgreSQL reads require a resolved single-tenant context.",
      );
    }
    if (context.scopeClass === "TENANT_CORE" && context.industryContextId) {
      throw new CommercialStateError(
        "COMMERCIAL_SCOPE_UNSUPPORTED",
        "Tenant Core Commercial scope cannot carry an Industry Context.",
      );
    }
    if (context.scopeClass === "TENANT_INDUSTRY" && !context.industryContextId) {
      throw new CommercialStateError(
        "COMMERCIAL_SCOPE_UNSUPPORTED",
        "Tenant Industry Commercial scope requires an Industry Context.",
      );
    }

    try {
      return await this.scopedSql.withContext(
        context,
        (transaction) => readCurrent(transaction, context),
      );
    } catch (error) {
      if (error instanceof CommercialStateError) throw error;
      throw new CommercialStateError("COMMERCIAL_STATE_UNAVAILABLE");
    }
  }
}
