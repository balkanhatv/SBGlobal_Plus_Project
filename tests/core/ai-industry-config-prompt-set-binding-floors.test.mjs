import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIIndustryConfigDomainPromptSetBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  config: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  otherTenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  otherIndustry: "55555555-5555-4555-8555-555555555555",
  promptSet: "66666666-6666-4666-8666-666666666666",
  otherPromptSet: "77777777-7777-4777-8777-777777777777",
});

const baseConfig = Object.freeze({
  id: ids.config,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  enabled: true,
  allowedCapabilities: Object.freeze(["CAP-A"]),
  allowedProviderIds: Object.freeze(["raw-provider"]),
  allowedModelIds: Object.freeze(["raw-model"]),
  domainPromptSetId: ids.promptSet,
  countryPackRefs: Object.freeze(["raw-pack"]),
  localizationProfileRef: "raw-locale",
  version: 7,
  updatedAt: "2026-09-26T00:00:00.000Z",
});

const basePromptSet = Object.freeze({
  id: ids.promptSet,
  ownerScope: "PLATFORM",
  tenantId: undefined,
  industryContextId: undefined,
  code: "DOMAIN",
  version: 3,
  status: "ACTIVE",
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
});

function config(overrides = {}) {
  return Object.freeze({...baseConfig, ...overrides});
}

function promptSet(overrides = {}) {
  return Object.freeze({...basePromptSet, ...overrides});
}

test("AIINDCFG-PROMPT-CUR-001 unbound config requires no PromptSet evidence", () => {
  const unbound = config({domainPromptSetId: undefined});
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(unbound),
    true,
  );
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(unbound, promptSet()),
    false,
  );
});

test("AIINDCFG-PROMPT-CUR-002 exact referenced ACTIVE PLATFORM PromptSet applies", () => {
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(config(), promptSet()),
    true,
  );
});

test("AIINDCFG-PROMPT-CUR-003 ACTIVE same-Tenant TENANT PromptSet applies and foreign Tenant fails", () => {
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(
      config(),
      promptSet({ownerScope: "TENANT", tenantId: ids.tenant}),
    ),
    true,
  );
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(
      config(),
      promptSet({ownerScope: "TENANT", tenantId: ids.otherTenant}),
    ),
    false,
  );
});

test("AIINDCFG-PROMPT-CUR-004 ACTIVE exact-Industry PromptSet applies; sibling/foreign scope fails", () => {
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(
      config(),
      promptSet({
        ownerScope: "INDUSTRY",
        tenantId: ids.tenant,
        industryContextId: ids.industry,
      }),
    ),
    true,
  );
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(
      config(),
      promptSet({
        ownerScope: "INDUSTRY",
        tenantId: ids.tenant,
        industryContextId: ids.otherIndustry,
      }),
    ),
    false,
  );
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(
      config(),
      promptSet({
        ownerScope: "INDUSTRY",
        tenantId: ids.otherTenant,
        industryContextId: ids.industry,
      }),
    ),
    false,
  );
});

test("AIINDCFG-PROMPT-CUR-005 missing evidence, wrong id or non-ACTIVE raw status fails closed", () => {
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(config()),
    false,
  );
  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(
      config(),
      promptSet({id: ids.otherPromptSet}),
    ),
    false,
  );
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED", "active", "ACTIVE "]) {
    assert.equal(
      matchesAIIndustryConfigDomainPromptSetBindingFloors(
        config(),
        promptSet({status}),
      ),
      false,
      status,
    );
  }
});

test("AIINDCFG-PROMPT-CUR-006 malformed config identity/domain id or PromptSet owner shape fails closed", () => {
  for (const candidate of [
    config({id: "bad"}),
    config({tenantId: "bad"}),
    config({industryContextId: "bad"}),
    config({domainPromptSetId: "bad"}),
  ]) {
    assert.equal(
      matchesAIIndustryConfigDomainPromptSetBindingFloors(candidate, promptSet()),
      false,
    );
  }

  for (const candidate of [
    promptSet({id: "bad"}),
    promptSet({ownerScope: "PLATFORM", tenantId: ids.tenant}),
    promptSet({ownerScope: "TENANT", tenantId: undefined}),
    promptSet({ownerScope: "TENANT", tenantId: ids.tenant, industryContextId: ids.industry}),
    promptSet({ownerScope: "INDUSTRY", tenantId: ids.tenant, industryContextId: undefined}),
    promptSet({ownerScope: "UNKNOWN"}),
  ]) {
    assert.equal(
      matchesAIIndustryConfigDomainPromptSetBindingFloors(config(), candidate),
      false,
    );
  }
});

test("AIINDCFG-PROMPT-CUR-007 unrelated config/PromptSet semantics stay uninterpreted and inputs remain unchanged", () => {
  const candidateConfig = Object.freeze({
    ...config(),
    enabled: false,
    allowedCapabilities: Object.freeze([]),
    allowedProviderIds: Object.freeze(["not-interpreted"]),
    allowedModelIds: Object.freeze(["not-interpreted"]),
    countryPackRefs: Object.freeze(["not-interpreted"]),
    localizationProfileRef: "",
    version: -999,
    updatedAt: "not-interpreted",
  });
  const candidatePromptSet = Object.freeze({
    ...promptSet(),
    code: "",
    version: -999,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const beforeConfig = JSON.stringify(candidateConfig);
  const beforePromptSet = JSON.stringify(candidatePromptSet);

  assert.equal(
    matchesAIIndustryConfigDomainPromptSetBindingFloors(
      candidateConfig,
      candidatePromptSet,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateConfig), beforeConfig);
  assert.equal(JSON.stringify(candidatePromptSet), beforePromptSet);
});
