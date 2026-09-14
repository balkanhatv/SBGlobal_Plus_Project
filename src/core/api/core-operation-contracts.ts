import type { OperationContract } from "./operation-contract.js";

export const CORE_IDENTITY_ROLES_LIST_EFFECTIVE: OperationContract = Object.freeze({
  operationId: "core.identity.roles.listEffective",
  module: "Identity",
  scopeClass: "TENANT_CORE",
  kind: "QUERY",
  permissionCode: "core.identity.role.view",
  inputSchemaVersion: 1,
  outputSchemaVersion: 1,
  idempotencyPolicy: "NONE",
  rateClass: "AUTH_STANDARD",
  auditClass: "STANDARD",
  domainService: "IdentityRoleQueryService.listEffective",
  emittedEvents: Object.freeze([]),
  errorCodes: Object.freeze([
    "TENANT_INVALID",
    "PERMISSION_DENIED",
    "RESOURCE_NOT_FOUND",
  ]),
});
