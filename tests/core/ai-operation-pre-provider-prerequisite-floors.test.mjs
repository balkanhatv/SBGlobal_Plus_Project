import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIOperationCapabilityAdmissionFloor,
  matchesAIOperationContractDeclarationShapeFloor,
  matchesAIOperationPreProviderPrerequisiteFloors,
  matchesAIOperationRequestContextScopeFloor,
  matchesAIOperationSnapshotAdmissionFloor,
  projectAIOperationContractDeclaration,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  capability: "44444444-4444-4444-8444-444444444444",
});

const operation = Object.freeze({
  operationId: "ai.chat.generate",
  module: "AI",
  scopeClass: "TENANT_INDUSTRY",
  kind: "QUERY",
  permissionCode: "ai.chat.use",
  entitlementRequirement: "ai.chat",
  inputSchemaVersion: 1,
  outputSchemaVersion: 1,
  idempotencyPolicy: "NONE",
  rateClass: "AI_COSTED",
  auditClass: "AI_STANDARD",
  domainService: "AIGateway.generate",
  emittedEvents: Object.freeze([]),
  errorCodes: Object.freeze(["PERMISSION_DENIED", "POLICY_DENIED"]),
});

const ai = Object.freeze({
  apiAccessClass: "TENANT_API",
  capabilityCode: "AI.CHAT",
  streamingMode: "OPTIONAL",
  dataClassCeiling: "CONFIDENTIAL",
  residencyPolicyRef: "residency.in",
});

const declaration = Object.freeze({operation, ai});

const requestContext = Object.freeze({
  requestId: "request-1",
  correlationId: "correlation-1",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  principalId: "55555555-5555-4555-8555-555555555555",
  principalType: "HUMAN",
  membershipId: "66666666-6666-4666-8666-666666666666",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_INDUSTRY",
});

const capability = Object.freeze({
  id: ids.capability,
  code: "AI.CHAT",
  category: "CHAT",
  requiredEntitlement: "ai.chat",
  defaultPolicyClass: "DEFAULT",
  schemaVersion: 1,
  status: "ACTIVE",
});

const snapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  version: "31",
  subscriptionVersion: "41",
  entitlementSnapshotVersion: "51",
  industryActivationVersion: "61",
  msPackVersions: Object.freeze({}),
  countryPackVersions: Object.freeze({}),
  tenantAiConfigVersion: "71",
  allowedCapabilityIds: Object.freeze([ids.capability]),
  allowedApiClasses: Object.freeze(["TENANT_API"]),
  allowedProviderIds: Object.freeze([]),
  allowedModelClasses: Object.freeze([]),
  status: "ACTIVE",
  compiledAt: "2026-09-20T00:00:00.000Z",
  validUntil: "2026-10-20T00:00:00.000Z",
});

const evaluatedAt = "2026-09-28T19:00:00.000Z";

test("AIOP-SHAPE-001 valid canonical Core plus AI-only declaration shape passes", () => {
  assert.equal(matchesAIOperationContractDeclarationShapeFloor(declaration), true);
});

test("AIOP-SHAPE-002 malformed contract or AI-only declaration shape fails closed", () => {
  for (const candidate of [
    {operation, ai: {...ai, apiAccessClass: "tenant_api"}},
    {operation: {...operation, inputSchemaVersion: 0}, ai},
    {operation: {...operation, kind: "RUN"}, ai},
    {operation: {...operation, emittedEvents: [1]}, ai},
    {operation, ai: {...ai, streamingMode: 7}},
  ]) {
    assert.equal(matchesAIOperationContractDeclarationShapeFloor(candidate), false);
  }
});

test("AIOP-PROJ-001 DD-09 projection derives shared authority fields from Core OperationContract", () => {
  assert.deepEqual(projectAIOperationContractDeclaration(declaration), {
    apiAccessClass: "TENANT_API",
    capabilityCode: "AI.CHAT",
    requiredEntitlement: "ai.chat",
    requiredPermission: "ai.chat.use",
    scopeClass: "TENANT_INDUSTRY",
    requestSchemaVersion: 1,
    responseSchemaVersion: 1,
    streamingMode: "OPTIONAL",
    ratePolicyRef: "AI_COSTED",
    dataClassCeiling: "CONFIDENTIAL",
    residencyPolicyRef: "residency.in",
    auditClass: "AI_STANDARD",
  });
});

test("AIOP-PROJ-002 projection is immutable and invalid declarations create no parallel authority", () => {
  const projected = projectAIOperationContractDeclaration(declaration);
  assert.ok(projected);
  assert.equal(Object.isFrozen(projected), true);
  assert.equal(projectAIOperationContractDeclaration({
    operation: {...operation, outputSchemaVersion: 0},
    ai,
  }), null);
  assert.equal("tenantId" in projected, false);
  assert.equal("industryContextId" in projected, false);
});

test("AIOP-SCOPE-001 exact declared/request scope matches and mismatch fails", () => {
  assert.equal(matchesAIOperationRequestContextScopeFloor(declaration, requestContext), true);
  assert.equal(matchesAIOperationRequestContextScopeFloor(
    declaration,
    {...requestContext, scopeClass: "TENANT_CORE"},
  ), false);
  assert.equal(matchesAIOperationRequestContextScopeFloor(
    declaration,
    {...requestContext, scopeClass: "UNKNOWN"},
  ), false);
});

test("AIOP-SNAP-001 current lifecycle plus exact allowed API class passes", () => {
  assert.equal(
    matchesAIOperationSnapshotAdmissionFloor(declaration, snapshot, evaluatedAt),
    true,
  );
});

test("AIOP-SNAP-002 inactive expired or absent API class fails closed", () => {
  assert.equal(matchesAIOperationSnapshotAdmissionFloor(
    declaration,
    {...snapshot, status: "REVOKED"},
    evaluatedAt,
  ), false);
  assert.equal(matchesAIOperationSnapshotAdmissionFloor(
    declaration,
    {...snapshot, validUntil: evaluatedAt},
    evaluatedAt,
  ), false);
  assert.equal(matchesAIOperationSnapshotAdmissionFloor(
    declaration,
    {...snapshot, allowedApiClasses: ["PARTNER_API"]},
    evaluatedAt,
  ), false);
});

test("AIOP-CAP-001 exact declared code plus exact allowed ACTIVE capability passes", () => {
  assert.equal(
    matchesAIOperationCapabilityAdmissionFloor(declaration, snapshot, capability),
    true,
  );
});

test("AIOP-CAP-002 wrong code inactive or absent capability fails closed", () => {
  assert.equal(matchesAIOperationCapabilityAdmissionFloor(
    declaration,
    snapshot,
    {...capability, code: "AI.OTHER"},
  ), false);
  assert.equal(matchesAIOperationCapabilityAdmissionFloor(
    declaration,
    snapshot,
    {...capability, status: "RETIRED"},
  ), false);
  assert.equal(matchesAIOperationCapabilityAdmissionFloor(
    declaration,
    {...snapshot, allowedCapabilityIds: []},
    capability,
  ), false);
});

test("AIOP-PRE-001 all known pre-provider prerequisites pass together", () => {
  assert.equal(matchesAIOperationPreProviderPrerequisiteFloors({
    declaration,
    requestContext,
    snapshot,
    capability,
    evaluatedAt,
  }), true);
});

test("AIOP-PRE-002 any composed prerequisite failure denies the combined floor", () => {
  for (const input of [
    {declaration: {...declaration, ai: {...ai, apiAccessClass: "PARTNER_API"}}, requestContext, snapshot, capability, evaluatedAt},
    {declaration, requestContext: {...requestContext, scopeClass: "TENANT_CORE"}, snapshot, capability, evaluatedAt},
    {declaration, requestContext, snapshot: {...snapshot, status: "SUPERSEDED"}, capability, evaluatedAt},
    {declaration, requestContext, snapshot, capability: {...capability, code: "AI.OTHER"}, evaluatedAt},
  ]) {
    assert.equal(matchesAIOperationPreProviderPrerequisiteFloors(input), false);
  }
});

test("AIOP-PRE-003 helper is immutable and true result grants no route execution authority", () => {
  const before = JSON.stringify({declaration, requestContext, snapshot, capability});
  assert.equal(matchesAIOperationPreProviderPrerequisiteFloors({
    declaration,
    requestContext,
    snapshot,
    capability,
    evaluatedAt,
  }), true);
  assert.equal(JSON.stringify({declaration, requestContext, snapshot, capability}), before);
  const projected = projectAIOperationContractDeclaration(declaration);
  assert.ok(projected);
  for (const forbidden of ["providerId", "modelId", "routeDecisionId", "authorized", "execute"]) {
    assert.equal(forbidden in projected, false);
  }
});
