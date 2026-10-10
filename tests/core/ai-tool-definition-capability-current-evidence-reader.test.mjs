import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIToolDefinitionCapabilityCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  toolDefinition: "11111111-1111-4111-8111-111111111111",
  capability: "22222222-2222-4222-8222-222222222222",
});

const baseToolDefinition = Object.freeze({
  id: ids.toolDefinition,
  toolId: "opaque.tool",
  capabilityCode: "TOOL_EXECUTE",
  operationContractId: "operation.raw",
  scopeClass: "TENANT_INDUSTRY",
  requiredPermission: "raw.permission",
  requiredEntitlement: "raw.entitlement",
  inputSchemaVersion: 7,
  outputSchemaVersion: 9,
  sideEffectClass: "HIGH",
  approvalPolicyId: "33333333-3333-4333-8333-333333333333",
  idempotencyRequired: true,
  auditClass: "raw.audit",
  status: "RETIRED",
  version: 42,
  createdAt: "raw-created",
  updatedAt: "raw-updated",
  opaqueMetadata: Object.freeze({raw: [null, "x"]}),
});

const baseCapability = Object.freeze({
  id: ids.capability,
  code: "TOOL_EXECUTE",
  category: "TOOL",
  requiredEntitlement: "cap.raw",
  defaultPolicyClass: "raw.policy",
  schemaVersion: 13,
  status: "RETIRED",
  opaqueMetadata: Object.freeze({raw: [false, "catalog"]}),
});

function toolDefinition(overrides = {}) {
  return Object.freeze({...baseToolDefinition, ...overrides});
}

function capability(overrides = {}) {
  return Object.freeze({...baseCapability, ...overrides});
}

function fixture(overrides = {}) {
  const values = {
    toolDefinition: Object.hasOwn(overrides, "toolDefinition")
      ? overrides.toolDefinition
      : toolDefinition(),
    capability: Object.hasOwn(overrides, "capability")
      ? overrides.capability
      : capability(),
  };
  const order = [], toolDefinitionCalls = [], capabilityCalls = [];
  return {
    values, order, toolDefinitionCalls, capabilityCalls,
    toolDefinitionReader: {
      async loadById(...args) {
        order.push("toolDefinition");
        toolDefinitionCalls.push(args);
        if (overrides.toolDefinitionError) throw overrides.toolDefinitionError;
        return values.toolDefinition;
      },
    },
    capabilityReader: {
      async loadByCode(...args) {
        order.push("capability");
        capabilityCalls.push(args);
        if (overrides.capabilityError) throw overrides.capabilityError;
        return values.capability;
      },
    },
  };
}

function load(f, toolDefinitionId = ids.toolDefinition) {
  return loadAIToolDefinitionCapabilityCurrentEvidence(
    {toolDefinitionId}, f.toolDefinitionReader, f.capabilityReader,
  );
}

test("AITOOL-CAPREAD-BASE-001 exact global ToolDefinition read occurs first with the supplied id", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.deepEqual(f.order, ["toolDefinition", "capability"]);
  assert.deepEqual(f.toolDefinitionCalls, [[ids.toolDefinition]]);
  assert.deepEqual(f.capabilityCalls, [["TOOL_EXECUTE"]]);
});

test("AITOOL-CAPREAD-BASE-002 missing ToolDefinition and original errors short-circuit capability access", async () => {
  for (const value of [null, undefined]) {
    const f = fixture({toolDefinition: value});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["toolDefinition"]);
    assert.equal(f.capabilityCalls.length, 0);
  }
  const error = new Error("original ToolDefinition catalog error");
  const f = fixture({toolDefinitionError: error});
  await assert.rejects(load(f), e => e === error);
  assert.deepEqual(f.order, ["toolDefinition"]);
  assert.equal(f.toolDefinitionCalls.length, 1);
  assert.equal(f.capabilityCalls.length, 0);
});

test("AITOOL-CAPREAD-CHILD-001 malformed child identity/code fails before capability access; empty raw code is preserved", async () => {
  const rows = [false, 0, "invalid", {}, []];
  for (const field of ["id"]) {
    for (const value of [undefined, null, "bad"]) rows.push(toolDefinition({[field]: value}));
  }
  for (const value of [undefined, null, 7, false, {}]) {
    rows.push(toolDefinition({capabilityCode: value}));
  }
  for (const row of rows) {
    const f = fixture({toolDefinition: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["toolDefinition"]);
    assert.equal(f.capabilityCalls.length, 0);
  }
  const raw = fixture({
    toolDefinition: toolDefinition({capabilityCode: ""}),
    capability: capability({code: ""}),
  });
  assert.ok(await load(raw));
  assert.deepEqual(raw.capabilityCalls, [[""]]);
});

test("AITOOL-CAPREAD-READ-001 performs one global lookup with the exact persisted code", async () => {
  const f = fixture({
    toolDefinition: toolDefinition({capabilityCode: " Raw Code "}),
    capability: capability({code: " Raw Code "}),
  });
  assert.ok(await load(f));
  assert.deepEqual(f.order, ["toolDefinition", "capability"]);
  assert.deepEqual(f.toolDefinitionCalls, [[ids.toolDefinition]]);
  assert.deepEqual(f.capabilityCalls, [[" Raw Code "]]);
});

test("AITOOL-CAPREAD-READ-002 missing capability and original capability errors do not retry", async () => {
  const missing = fixture({capability: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["toolDefinition", "capability"]);
  assert.deepEqual(missing.capabilityCalls, [["TOOL_EXECUTE"]]);
  const error = new Error("original capability catalog error");
  const f = fixture({capabilityError: error});
  await assert.rejects(load(f), e => e === error);
  assert.deepEqual(f.order, ["toolDefinition", "capability"]);
  assert.deepEqual(f.capabilityCalls, [["TOOL_EXECUTE"]]);
});

test("AITOOL-CAPREAD-FLOOR-001 DD-203 exact code-FK predicate fails closed without normalization", async () => {
  for (const row of [
    undefined, {}, capability({id: "bad"}), capability({id: null}),
    capability({code: undefined}), capability({code: null}),
    capability({code: "OTHER"}), capability({code: "tool_execute"}),
    capability({code: "TOOL_EXECUTE "}), capability({code: " TOOL_EXECUTE"}),
  ]) {
    const f = fixture({capability: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["toolDefinition", "capability"]);
  }
  assert.ok(await load(fixture({
    toolDefinition: toolDefinition({capabilityCode: ""}),
    capability: capability({code: ""}),
  })));
});

test("AITOOL-CAPREAD-EVID-001 frozen envelope preserves exact source references and opaque fields", async () => {
  const f = fixture();
  const before = JSON.stringify([f.values.toolDefinition, f.values.capability]);
  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.toolDefinition, f.values.toolDefinition);
  assert.equal(result.capability, f.values.capability);
  assert.equal(result.toolDefinition.opaqueMetadata, f.values.toolDefinition.opaqueMetadata);
  assert.equal(result.capability.opaqueMetadata, f.values.capability.opaqueMetadata);
  assert.equal(result.toolDefinition.createdAt, "raw-created");
  assert.equal(result.toolDefinition.version, 42);
  assert.equal(result.capability.schemaVersion, 13);
  assert.equal(JSON.stringify([f.values.toolDefinition, f.values.capability]), before);
});

test("AITOOL-CAPREAD-BOUND-001 opaque status/policy/tool metadata grants no authorization or execution fields", async () => {
  const f = fixture({
    toolDefinition: toolDefinition({
      scopeClass: "UNKNOWN", requiredPermission: "", requiredEntitlement: null,
      inputSchemaVersion: -999, outputSchemaVersion: -999,
      sideEffectClass: "UNKNOWN", approvalPolicyId: null, idempotencyRequired: false,
      auditClass: "", status: "DISABLED", version: -999, createdAt: "", updatedAt: "",
    }),
    capability: capability({
      category: "UNKNOWN", requiredEntitlement: null, defaultPolicyClass: "",
      schemaVersion: -999, status: "RETIRED",
    }),
  });
  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(Object.keys(result), ["toolDefinition", "capability"]);
  assert.equal(result.toolDefinition.status, "DISABLED");
  assert.equal(result.toolDefinition.scopeClass, "UNKNOWN");
  assert.equal(result.toolDefinition.sideEffectClass, "UNKNOWN");
  assert.equal(result.capability.status, "RETIRED");
  assert.equal(result.capability.schemaVersion, -999);
  for (const field of ["authorized", "eligible", "route", "credentials", "execution", "decision"]) {
    assert.equal(Object.hasOwn(result, field), false);
  }
});
