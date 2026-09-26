import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAITenantConfigCapabilityAllowlistFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  config: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  capChat: "33333333-3333-4333-8333-333333333333",
  capEmbed: "44444444-4444-4444-8444-444444444444",
  capOther: "55555555-5555-4555-8555-555555555555",
  provider: "66666666-6666-4666-8666-666666666666",
  model: "77777777-7777-4777-8777-777777777777",
});

const baseConfig = Object.freeze({
  id: ids.config,
  tenantId: ids.tenant,
  enabled: true,
  allowedCapabilities: Object.freeze(["CHAT", "EMBEDDING"]),
  allowedProviderIds: Object.freeze([ids.provider]),
  allowedModelIds: Object.freeze([ids.model]),
  maxSensitivityClass: "CONFIDENTIAL",
  residencyPolicyId: "residency:raw",
  monthlyBudgetPolicyRef: "budget:raw",
  retentionPolicyId: "retention:raw",
  promptOverridePolicyId: "prompt-override:raw",
  version: 9,
  updatedAt: "2026-09-26T00:00:00.000Z",
});

const baseChat = Object.freeze({
  id: ids.capChat,
  code: "CHAT",
  category: "CHAT",
  requiredEntitlement: "entitlement:raw",
  defaultPolicyClass: "policy:raw",
  schemaVersion: 7,
  status: "ACTIVE",
});

const baseEmbed = Object.freeze({
  id: ids.capEmbed,
  code: "EMBEDDING",
  category: "EMBEDDING",
  requiredEntitlement: null,
  defaultPolicyClass: "policy:other",
  schemaVersion: 3,
  status: "ACTIVE",
});

function config(overrides = {}) {
  return Object.freeze({...baseConfig, ...overrides});
}

function chat(overrides = {}) {
  return Object.freeze({...baseChat, ...overrides});
}

function embed(overrides = {}) {
  return Object.freeze({...baseEmbed, ...overrides});
}

test("AITENCFG-CAP-CUR-001 empty allowlist passes only with empty capability evidence", () => {
  const empty = config({allowedCapabilities: Object.freeze([])});
  assert.equal(matchesAITenantConfigCapabilityAllowlistFloors(empty, []), true);
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(empty, [chat()]),
    false,
  );
});

test("AITENCFG-CAP-CUR-002 complete exact ACTIVE set passes independent of evidence order", () => {
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config(),
      [chat(), embed()],
    ),
    true,
  );
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config(),
      [embed(), chat()],
    ),
    true,
  );
});

test("AITENCFG-CAP-CUR-003 missing, extra, duplicate or wrong-code evidence fails closed", () => {
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(config(), [chat()]),
    false,
  );
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config(),
      [chat(), embed(), {
        ...chat(),
        id: ids.capOther,
        code: "OCR",
        category: "OCR",
      }],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config(),
      [chat(), {...embed(), code: "CHAT"}],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config(),
      [chat(), {...embed(), code: "OCR"}],
    ),
    false,
  );
});

test("AITENCFG-CAP-CUR-004 raw status must be exactly ACTIVE without normalization", () => {
  for (const status of ["RETIRED", "active", "ACTIVE ", ""]){
    assert.equal(
      matchesAITenantConfigCapabilityAllowlistFloors(
        config(),
        [chat(), embed({status})],
      ),
      false,
    );
  }
});

test("AITENCFG-CAP-CUR-005 duplicate or malformed TenantAIConfig capability entries fail closed", () => {
  for (const allowedCapabilities of [
    ["CHAT", "CHAT"],
    ["CHAT", null],
    ["CHAT", 7],
    "CHAT",
  ]) {
    assert.equal(
      matchesAITenantConfigCapabilityAllowlistFloors(
        config({allowedCapabilities}),
        [chat(), embed()],
      ),
      false,
    );
  }
});

test("AITENCFG-CAP-CUR-006 malformed config identity or capability evidence identity/code shape fails closed", () => {
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config({id: "bad"}),
      [chat(), embed()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config({tenantId: "bad"}),
      [chat(), embed()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config(),
      [chat({id: "bad"}), embed()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config(),
      [chat({code: 7}), embed()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      config(),
      undefined,
    ),
    false,
  );
});

test("AITENCFG-CAP-CUR-007 unrelated config/catalog semantics remain uninterpreted and inputs are unchanged", () => {
  const candidateConfig = config({
    enabled: false,
    allowedProviderIds: Object.freeze(["not-interpreted"]),
    allowedModelIds: Object.freeze(["not-interpreted"]),
    maxSensitivityClass: "REGULATED",
    residencyPolicyId: "",
    monthlyBudgetPolicyRef: undefined,
    retentionPolicyId: "",
    promptOverridePolicyId: "",
    version: -999,
    updatedAt: "not-interpreted",
  });
  const candidateChat = chat({
    category: "API",
    requiredEntitlement: null,
    defaultPolicyClass: "",
    schemaVersion: -999,
  });
  const candidateEmbed = embed({
    category: "TOOL",
    requiredEntitlement: "anything",
    defaultPolicyClass: "",
    schemaVersion: 0,
  });
  const beforeConfig = JSON.stringify(candidateConfig);
  const beforeCapabilities = JSON.stringify([candidateChat, candidateEmbed]);

  assert.equal(
    matchesAITenantConfigCapabilityAllowlistFloors(
      candidateConfig,
      [candidateChat, candidateEmbed],
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateConfig), beforeConfig);
  assert.equal(
    JSON.stringify([candidateChat, candidateEmbed]),
    beforeCapabilities,
  );
});
