import type { RequestContext } from "../../core/context/contracts.js";
import type {
  CommercialProvisioningVersionEvidence,
  CommercialProvisioningVersionReadPort,
} from "../../core/commercial/provisioning-version-evidence.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface CommercialProvisioningVersionRow {
  readonly tenant_id: string;
  readonly current_subscription_id: string | null;
  readonly subscription_id: string | null;
  readonly subscription_version: string | null;
  readonly entitlement_snapshot_id: string | null;
  readonly entitlement_snapshot_version: string | null;
}

export class CommercialProvisioningVersionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommercialProvisioningVersionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BIGINT_TEXT_PATTERN = /^(?:0|[1-9][0-9]*|-[1-9][0-9]*)$/;

function invalid(message: string): never {
  throw new CommercialProvisioningVersionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Commercial provisioning ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function optionalBigintText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string" || !BIGINT_TEXT_PATTERN.test(value)) {
    invalid(`Persisted Commercial provisioning ${field} is invalid.`);
  }
  return value;
}

function assertContext(context: RequestContext): void {
  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || !context.principalId
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId !== undefined)
    || (
      context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("Commercial provisioning version reads require a resolved single-Tenant context.");
  }
}

function parseRow(
  row: CommercialProvisioningVersionRow,
): CommercialProvisioningVersionEvidence {
  const tenantId = uuid(row.tenant_id, "Tenant id");
  const currentSubscriptionId = optionalUuid(
    row.current_subscription_id,
    "current Subscription id",
  );
  const subscriptionId = optionalUuid(row.subscription_id, "Subscription id");
  const subscriptionVersion = optionalBigintText(
    row.subscription_version,
    "Subscription version",
  );
  const entitlementSnapshotId = optionalUuid(
    row.entitlement_snapshot_id,
    "EntitlementSnapshot id",
  );
  const entitlementSnapshotVersion = optionalBigintText(
    row.entitlement_snapshot_version,
    "EntitlementSnapshot version",
  );

  if ((subscriptionId === undefined) !== (subscriptionVersion === undefined)) {
    invalid("Persisted current Subscription evidence is incomplete.");
  }
  if (subscriptionId !== undefined && subscriptionId !== currentSubscriptionId) {
    invalid("Persisted current Subscription evidence does not match the Tenant pointer.");
  }
  if (
    (entitlementSnapshotId === undefined)
    !== (entitlementSnapshotVersion === undefined)
  ) {
    invalid("Persisted CURRENT EntitlementSnapshot evidence is incomplete.");
  }

  return Object.freeze({
    tenantId,
    ...(currentSubscriptionId ? { currentSubscriptionId } : {}),
    ...(subscriptionVersion !== undefined ? { subscriptionVersion } : {}),
    ...(entitlementSnapshotId ? { entitlementSnapshotId } : {}),
    ...(entitlementSnapshotVersion !== undefined
      ? { entitlementSnapshotVersion }
      : {}),
  });
}

async function readForTenant(
  transaction: SqlTransaction,
  tenantId: string,
): Promise<CommercialProvisioningVersionEvidence | null> {
  const result = await transaction.query<CommercialProvisioningVersionRow>(
    `SELECT tenant.id::text AS tenant_id,
            tenant.current_subscription_id::text AS current_subscription_id,
            subscription.id::text AS subscription_id,
            subscription.version::text AS subscription_version,
            snapshot.id::text AS entitlement_snapshot_id,
            snapshot.version::text AS entitlement_snapshot_version
       FROM core_tenancy.tenant tenant
       LEFT JOIN core_commercial.subscription subscription
         ON subscription.tenant_id=tenant.id
        AND subscription.id=tenant.current_subscription_id
       LEFT JOIN core_commercial.entitlement_snapshot snapshot
         ON snapshot.tenant_id=tenant.id
        AND snapshot.status='CURRENT'
      WHERE tenant.id=$1::uuid`,
    [tenantId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Commercial provisioning version evidence is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresCommercialProvisioningVersionStore
implements CommercialProvisioningVersionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
  }): Promise<CommercialProvisioningVersionEvidence | null> {
    assertContext(input.requestContext);
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readForTenant(
        transaction,
        input.requestContext.tenantId!,
      ),
    );
  }
}
