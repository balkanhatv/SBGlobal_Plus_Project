import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIRequestOperationCapabilityFloor,
  matchesAIRequestOperationInputSchemaFloor,
  matchesAIRequestPreRoutingPrerequisiteFloors,
  matchesAIRequestShapeFloor,
  projectAIRequest,
} from "../../dist/core/index.js";

const declaration = Object.freeze({
  operation: Object.freeze({
    operationId: "ai.chat.generate",
    module: "AI",
    scopeClass: "TENANT_CORE",
    kind: "QUERY",
    permissionCode: "ai.chat.use",
    entitlementRequirement: "ai.chat",
    inputSchemaVersion: 3,
    outputSchemaVersion: 2,
    idempotencyPolicy: "NONE",
    rateClass: "AI_COSTED",
    auditClass: "AI_STANDARD",
    domainService: "AIGateway.generate",
    emittedEvents: Object.freeze([]),
    errorCodes: Object.freeze(["PERMISSION_DENIED"]),
  }),
  ai: Object.freeze({
    apiAccessClass: "TENANT_API",
    capabilityCode: "AI.CHAT",
    streamingMode: "OPTIONAL",
    dataClassCeiling: "CONFIDENTIAL",
    residencyPolicyRef: "tenant.residency",
  }),
});

const request = Object.freeze({
  requestId: "req-1",
  capabilityCode: "AI.CHAT",
  requestContextRef: "ctx-1",
  conversationId: "conv-1",
  inputSchemaVersion: 3,
  input: Object.freeze({
    prompt: "hello",
    options: Object.freeze({temperature: 0}),
    items: Object.freeze([1, true, null]),
  }),
  sensitivityClass: "CONFIDENTIAL",
  residencyRequirement: "tenant.residency",
  groundingMode: "OPTIONAL",
  requestedOutputSchema: Object.freeze({
    type: "object",
    properties: Object.freeze({answer: Object.freeze({type: "string"})}),
  }),
  latencyClass: "INTERACTIVE",
  budgetClass: "STANDARD",
  allowedSourceScopes: Object.freeze(["TENANT", "INDUSTRY"]),
  correlationId: "corr-1",
});

test("AIREQ-SHAPE-001 valid exact DD-09 required and optional field set passes", () => {
  assert.equal(matchesAIRequestShapeFloor(request), true);
});

test("AIREQ-SHAPE-002 missing required or unknown top-level field fails closed", () => {
  const {requestId, ...missing} = request;
  assert.equal(matchesAIRequestShapeFloor(missing), false);
  assert.equal(matchesAIRequestShapeFloor({...request, tenantId: "client-claim"}), false);
  assert.equal(matchesAIRequestShapeFloor({...request, permissionCode: "ai.admin"}), false);
});

test("AIREQ-SHAPE-003 malformed required scalar version JSON or sensitivity evidence fails closed", () => {
  for (const candidate of [
    {...request, requestId: ""},
    {...request, inputSchemaVersion: 0},
    {...request, inputSchemaVersion: 1.5},
    {...request, input: {bad: undefined}},
    {...request, input: Number.POSITIVE_INFINITY},
    {...request, sensitivityClass: "SECRET"},
    {...request, residencyRequirement: ""},
    {...request, groundingMode: ""},
    {...request, correlationId: ""},
  ]) {
    assert.equal(matchesAIRequestShapeFloor(candidate), false);
  }
});

test("AIREQ-SHAPE-004 malformed optional string JSON or source-scope evidence fails closed", () => {
  for (const candidate of [
    {...request, conversationId: ""},
    {...request, requestedOutputSchema: {bad: undefined}},
    {...request, latencyClass: ""},
    {...request, budgetClass: 7},
    {...request, allowedSourceScopes: ["TENANT", ""]},
    {...request, allowedSourceScopes: ["TENANT", 7]},
  ]) {
    assert.equal(matchesAIRequestShapeFloor(candidate), false);
  }
});

test("AIREQ-PROJ-001 valid request projects exact deeply immutable DD-09 evidence", () => {
  const projected = projectAIRequest(request);
  assert.ok(projected);
  assert.deepEqual(projected, request);
  assert.equal(Object.isFrozen(projected), true);
  assert.equal(Object.isFrozen(projected.input), true);
  assert.equal(Object.isFrozen(projected.input.options), true);
  assert.equal(Object.isFrozen(projected.input.items), true);
  assert.equal(Object.isFrozen(projected.requestedOutputSchema), true);
  assert.equal(Object.isFrozen(projected.allowedSourceScopes), true);
});

test("AIREQ-PROJ-002 invalid request returns null and projection exposes no trusted or route authority", () => {
  assert.equal(projectAIRequest({...request, industryContextId: "client-claim"}), null);
  const projected = projectAIRequest(request);
  assert.ok(projected);
  for (const key of [
    "tenantId", "industryContextId", "principalId", "roleIds",
    "permissionCode", "providerId", "modelId", "routeDecisionId", "authorized",
  ]) {
    assert.equal(key in projected, false);
  }
});

test("AIREQ-CAP-001 exact request and declaration capability code passes", () => {
  assert.equal(matchesAIRequestOperationCapabilityFloor(request, declaration), true);
});

test("AIREQ-CAP-002 mismatched or malformed capability binding fails", () => {
  assert.equal(
    matchesAIRequestOperationCapabilityFloor({...request, capabilityCode: "AI.EMBED"}, declaration),
    false,
  );
  assert.equal(
    matchesAIRequestOperationCapabilityFloor(request, {...declaration, ai: {...declaration.ai, capabilityCode: ""}}),
    false,
  );
});

test("AIREQ-SCHEMA-001 exact request and declaration input schema version passes", () => {
  assert.equal(matchesAIRequestOperationInputSchemaFloor(request, declaration), true);
});

test("AIREQ-SCHEMA-002 mismatched or malformed schema binding fails", () => {
  assert.equal(
    matchesAIRequestOperationInputSchemaFloor({...request, inputSchemaVersion: 4}, declaration),
    false,
  );
  assert.equal(
    matchesAIRequestOperationInputSchemaFloor(
      request,
      {...declaration, operation: {...declaration.operation, inputSchemaVersion: 0}},
    ),
    false,
  );
});

test("AIREQ-PRE-001 all AIRequest pre-routing prerequisites pass together", () => {
  assert.equal(matchesAIRequestPreRoutingPrerequisiteFloors(request, declaration), true);
});

test("AIREQ-PRE-002 failure of any composed prerequisite denies", () => {
  for (const [candidateRequest, candidateDeclaration] of [
    [{...request, extraTrustedFact: true}, declaration],
    [{...request, capabilityCode: "AI.EMBED"}, declaration],
    [{...request, inputSchemaVersion: 4}, declaration],
  ]) {
    assert.equal(
      matchesAIRequestPreRoutingPrerequisiteFloors(candidateRequest, candidateDeclaration),
      false,
    );
  }
});

test("AIREQ-PRE-003 inputs remain unchanged and true result grants no routing or execution authority", () => {
  const before = JSON.stringify({request, declaration});
  assert.equal(matchesAIRequestPreRoutingPrerequisiteFloors(request, declaration), true);
  assert.equal(JSON.stringify({request, declaration}), before);
  const projected = projectAIRequest(request);
  assert.ok(projected);
  for (const key of ["selectedModelId", "fallbackChain", "credentialRef", "execute"]) {
    assert.equal(key in projected, false);
  }
});
