import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIToolDefinitionCapabilityBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  toolDefinition: "11111111-1111-4111-8111-111111111111",
  capability: "22222222-2222-4222-8222-222222222222",
});

const baseToolDefinition = Object.freeze({
  id: ids.toolDefinition,
  toolId: "tool.raw",
  capabilityCode: "TOOL_EXECUTE",
  operationContractId: "operation.raw",
  scopeClass: "TENANT_INDUSTRY",
  requiredPermission: "raw.permission",
  requiredEntitlement: "raw.entitlement",
  inputSchemaVersion: 7,
  outputSchemaVersion: 9,
  sideEffectClass: "HIGH",
  approvalPolicyId: "approval.raw",
  idempotencyRequired: true,
  auditClass: "raw.audit",
  status: "RETIRED",
  version: 42,
  createdAt: "raw-created",
  updatedAt: "raw-updated",
});

const baseCapability = Object.freeze({
  id: ids.capability,
  code: "TOOL_EXECUTE",
  category: "TOOL",
  requiredEntitlement: "cap.raw",
  defaultPolicyClass: "raw.policy",
  schemaVersion: 13,
  status: "RETIRED",
});

function toolDefinition(overrides = {}) {
  return Object.freeze({...baseToolDefinition, ...overrides});
}

function capability(overrides = {}) {
  return Object.freeze({...baseCapability, ...overrides});
}

test("AITOOL-CAP-CUR-001 exact ToolDefinition/capability code binding passes", () => {
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition(),
      capability(),
    ),
    true,
  );
});

test("AITOOL-CAP-CUR-002 missing capability evidence or mismatched code fails closed", () => {
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(toolDefinition()),
    false,
  );
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition(),
      capability({code: "OTHER"}),
    ),
    false,
  );
});

test("AITOOL-CAP-CUR-003 code equality is exact and equal empty raw strings remain valid evidence", () => {
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition({capabilityCode: "tool_execute"}),
      capability(),
    ),
    false,
  );
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition({capabilityCode: "TOOL_EXECUTE "}),
      capability(),
    ),
    false,
  );
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition({capabilityCode: ""}),
      capability({code: ""}),
    ),
    true,
  );
});

test("AITOOL-CAP-CUR-004 malformed ToolDefinition id or capability-code type fails closed", () => {
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition({id: "bad"}),
      capability(),
    ),
    false,
  );
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition({capabilityCode: 7}),
      capability(),
    ),
    false,
  );
});

test("AITOOL-CAP-CUR-005 malformed capability id or code type fails closed", () => {
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition(),
      capability({id: "bad"}),
    ),
    false,
  );
  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition(),
      capability({code: 7}),
    ),
    false,
  );
});

test("AITOOL-CAP-CUR-006 capability lifecycle/category/entitlement/default-policy/schema semantics are not FK inputs", () => {
  const rawCapability = capability({
    category: "NOT_A_REAL_CATEGORY",
    requiredEntitlement: null,
    defaultPolicyClass: "",
    schemaVersion: -999,
    status: "DISABLED",
  });

  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      toolDefinition(),
      rawCapability,
    ),
    true,
  );
});

test("AITOOL-CAP-CUR-007 unrelated ToolDefinition semantics are uninterpreted and inputs remain unchanged", () => {
  const rawToolDefinition = Object.freeze({
    ...toolDefinition(),
    toolId: "",
    operationContractId: "",
    scopeClass: "UNKNOWN",
    requiredPermission: "",
    requiredEntitlement: null,
    inputSchemaVersion: -999,
    outputSchemaVersion: -999,
    sideEffectClass: "UNKNOWN",
    approvalPolicyId: null,
    idempotencyRequired: false,
    auditClass: "",
    status: "DISABLED",
    version: -999,
    createdAt: "",
    updatedAt: "",
  });
  const rawCapability = capability();
  const beforeTool = JSON.stringify(rawToolDefinition);
  const beforeCapability = JSON.stringify(rawCapability);

  assert.equal(
    matchesAIToolDefinitionCapabilityBindingFloors(
      rawToolDefinition,
      rawCapability,
    ),
    true,
  );
  assert.equal(JSON.stringify(rawToolDefinition), beforeTool);
  assert.equal(JSON.stringify(rawCapability), beforeCapability);
});
