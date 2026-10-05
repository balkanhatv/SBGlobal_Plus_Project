import type { RequestContext } from "../../core/context/contracts.js";
import type {
  IntegrationTenantResidencyEvidence,
  IntegrationTenantResidencyReadPort,
} from "../../core/integration/tenant-residency.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface IntegrationTenantResidencyRow {
  readonly id: string;
  readonly residency_region_code: string;
}

export class IntegrationTenantResidencyPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationTenantResidencyPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new IntegrationTenantResidencyPersistenceError(message);
}

function assertInput(requestContext: RequestContext, tenantId: string): void {
  if ((requestContext.scopeClass !== "TENANT_CORE"
      && requestContext.scopeClass !== "TENANT_INDUSTRY")
    || !requestContext.tenantId
    || !requestContext.principalId
    || !UUID_PATTERN.test(requestContext.tenantId)
    || !UUID_PATTERN.test(requestContext.principalId)
    || !UUID_PATTERN.test(tenantId)
    || requestContext.tenantId !== tenantId
    || (requestContext.scopeClass === "TENANT_CORE"
      && requestContext.industryContextId !== undefined)
    || (requestContext.scopeClass === "TENANT_INDUSTRY"
      && (!requestContext.industryContextId
        || !UUID_PATTERN.test(requestContext.industryContextId)))) {
    invalid("Integration Tenant residency read context is invalid.");
  }
}

function parseRow(
  row: IntegrationTenantResidencyRow,
  tenantId: string,
): IntegrationTenantResidencyEvidence {
  if (!UUID_PATTERN.test(row.id)
    || row.id !== tenantId
    || typeof row.residency_region_code !== "string"
    || row.residency_region_code.trim().length === 0) {
    invalid("Persisted Integration Tenant residency evidence is invalid.");
  }

  return Object.freeze({
    tenantId: row.id,
    residencyRegionCode: row.residency_region_code,
  });
}

/**
 * DD-519: exact current Tenant residency read under the existing fixed
 * sbg_integration_service_rw + RequestScopedSql FORCE-RLS boundary.
 */
export class PostgresIntegrationTenantResidencyStore
implements IntegrationTenantResidencyReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadCurrentForContext(input: {
    readonly requestContext: RequestContext;
    readonly tenantId: string;
  }): Promise<IntegrationTenantResidencyEvidence | null> {
    assertInput(input.requestContext, input.tenantId);

    return this.scopedSql.withContext(input.requestContext, async transaction => {
      const result = await transaction.query<IntegrationTenantResidencyRow>(
        `SELECT id::text,residency_region_code
           FROM core_tenancy.tenant
          WHERE id=$1::uuid`,
        [input.tenantId],
      );

      if (result.rowCount === 0) return null;
      if (result.rowCount !== 1 || !result.rows[0]) {
        invalid("Persisted Integration Tenant residency evidence is ambiguous.");
      }
      return parseRow(result.rows[0], input.tenantId);
    });
  }
}
