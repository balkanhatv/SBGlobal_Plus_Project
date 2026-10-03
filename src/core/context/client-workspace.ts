import type {
  ClientWorkspaceContext,
  IndustryContextRecord,
  RequestContext,
  TenantRecord,
} from "./contracts.js";

export function toClientWorkspaceContext(
  context: RequestContext,
  tenant: TenantRecord,
  selectedIndustry?: IndustryContextRecord,
): ClientWorkspaceContext {
  if (!context.tenantId || context.tenantId !== tenant.id) {
    throw new Error("Workspace projection requires the resolved tenant context.");
  }

  if (selectedIndustry && selectedIndustry.tenantId !== tenant.id) {
    throw new Error("Workspace Industry Context must belong to the resolved tenant.");
  }

  return Object.freeze({
    tenant: Object.freeze({
      displayKey: tenant.displayKey,
      displayName: tenant.displayName,
    }),
    selectedIndustry: selectedIndustry
      ? Object.freeze({
          displayKey: selectedIndustry.displayKey,
          displayName: selectedIndustry.displayName,
        })
      : undefined,
    orgUnitId: context.orgUnitId,
    entitlementSnapshotVersion: context.entitlementSnapshotVersion,
    sessionVersion: context.sessionVersion,
  });
}
