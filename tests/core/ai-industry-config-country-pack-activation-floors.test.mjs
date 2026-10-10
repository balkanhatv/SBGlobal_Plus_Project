import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIIndustryConfigCountryPackActivationFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  config: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  foreignTenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  packA: "55555555-5555-4555-8555-555555555555",
  packB: "66666666-6666-4666-8666-666666666666",
  packOther: "77777777-7777-4777-8777-777777777777",
  activationA: "88888888-8888-4888-8888-888888888888",
  activationB: "99999999-9999-4999-8999-999999999999",
  activationOther: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

const baseIndustry = Object.freeze({
  id: ids.config,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  enabled: true,
  allowedCapabilities: Object.freeze(["CHAT"]),
  allowedProviderIds: Object.freeze([]),
  allowedModelIds: Object.freeze([]),
  domainPromptSetId: undefined,
  countryPackRefs: Object.freeze([ids.packA, ids.packB]),
  localizationProfileRef: undefined,
  version: 5,
  updatedAt: "2026-09-28T00:00:00.000Z",
});

const baseActivationA = Object.freeze({
  id: ids.activationA,
  tenantId: ids.tenant,
  countryPackId: ids.packA,
  status: "ACTIVE",
  configOverride: Object.freeze({currency: "INR"}),
  activatedAt: "2026-09-20T00:00:00.000Z",
  disabledAt: undefined,
  rowVersion: "9",
});

const baseActivationB = Object.freeze({
  ...baseActivationA,
  id: ids.activationB,
  countryPackId: ids.packB,
  configOverride: Object.freeze({locale: "en-IN"}),
});

function industry(overrides = {}) {
  return Object.freeze({...baseIndustry, ...overrides});
}

function activationA(overrides = {}) {
  return Object.freeze({...baseActivationA, ...overrides});
}

function activationB(overrides = {}) {
  return Object.freeze({...baseActivationB, ...overrides});
}

test("AIINDCFG-PACK-CUR-001 empty refs pass only with empty activation evidence", () => {
  const empty = industry({countryPackRefs: Object.freeze([])});
  assert.equal(matchesAIIndustryConfigCountryPackActivationFloors(empty, []), true);
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(empty, [activationA()]),
    false,
  );
});

test("AIINDCFG-PACK-CUR-002 exact complete same-Tenant ACTIVE set passes independent of order", () => {
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      industry(),
      [activationA(), activationB()],
    ),
    true,
  );
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      industry(),
      [activationB(), activationA()],
    ),
    true,
  );
});

test("AIINDCFG-PACK-CUR-003 missing extra duplicate or wrong-pack evidence fails closed", () => {
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(industry(), [activationA()]),
    false,
  );
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      industry(),
      [activationA(), activationB(), {
        ...activationA(),
        id: ids.activationOther,
        countryPackId: ids.packOther,
      }],
    ),
    false,
  );
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      industry(),
      [activationA(), {...activationB(), id: ids.activationA}],
    ),
    false,
  );
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      industry(),
      [activationA(), {...activationB(), countryPackId: ids.packA}],
    ),
    false,
  );
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      industry(),
      [activationA(), {...activationB(), countryPackId: ids.packOther}],
    ),
    false,
  );
});

test("AIINDCFG-PACK-CUR-004 non-ACTIVE and raw status variants fail closed", () => {
  for (const status of ["PENDING", "DISABLED", "active", "ACTIVE ", "", "RETIRED"]) {
    assert.equal(
      matchesAIIndustryConfigCountryPackActivationFloors(
        industry(),
        [activationA(), activationB({status})],
      ),
      false,
      status,
    );
  }
});

test("AIINDCFG-PACK-CUR-005 foreign-Tenant activation evidence fails", () => {
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      industry(),
      [activationA(), activationB({tenantId: ids.foreignTenant})],
    ),
    false,
  );
});

test("AIINDCFG-PACK-CUR-006 malformed Industry refs or activation identities fail closed", () => {
  const sparse = new Array(2);
  sparse[0] = ids.packA;

  for (const candidate of [
    industry({id: "bad"}),
    industry({tenantId: "bad"}),
    industry({industryContextId: "bad"}),
    industry({countryPackRefs: [ids.packA, ids.packA]}),
    industry({countryPackRefs: [ids.packA, "bad"]}),
    industry({countryPackRefs: sparse}),
    industry({countryPackRefs: "not-an-array"}),
  ]) {
    assert.equal(
      matchesAIIndustryConfigCountryPackActivationFloors(
        candidate,
        [activationA(), activationB()],
      ),
      false,
    );
  }

  for (const candidate of [
    activationA({id: "bad"}),
    activationA({tenantId: "bad"}),
    activationA({countryPackId: "bad"}),
    activationA({status: 7}),
  ]) {
    assert.equal(
      matchesAIIndustryConfigCountryPackActivationFloors(
        industry(),
        [candidate, activationB()],
      ),
      false,
    );
  }

  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(industry(), undefined),
    false,
  );
});

test("AIINDCFG-PACK-CUR-007 evidence order is irrelevant but one exact match per ref is required", () => {
  const reversedRefs = industry({
    countryPackRefs: Object.freeze([ids.packB, ids.packA]),
  });
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      reversedRefs,
      [activationA(), activationB()],
    ),
    true,
  );
  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      reversedRefs,
      [activationB(), activationA()],
    ),
    true,
  );
});

test("AIINDCFG-PACK-CUR-008 unrelated config and activation fields stay uninterpreted and inputs unchanged", () => {
  const candidateIndustry = industry({
    enabled: false,
    allowedCapabilities: Object.freeze(["not-interpreted"]),
    allowedProviderIds: Object.freeze(["not-interpreted"]),
    allowedModelIds: Object.freeze(["not-interpreted"]),
    domainPromptSetId: "not-interpreted",
    localizationProfileRef: "",
    version: -999,
    updatedAt: "not-interpreted",
  });
  const candidateA = activationA({
    configOverride: Object.freeze({raw: Object.freeze([null, ""])}),
    activatedAt: "not-interpreted",
    disabledAt: "also-not-interpreted",
    rowVersion: "-999",
  });
  const candidateB = activationB({
    configOverride: null,
    activatedAt: undefined,
    disabledAt: undefined,
    rowVersion: "not-interpreted",
  });

  const beforeIndustry = JSON.stringify(candidateIndustry);
  const beforeActivations = JSON.stringify([candidateA, candidateB]);

  assert.equal(
    matchesAIIndustryConfigCountryPackActivationFloors(
      candidateIndustry,
      [candidateA, candidateB],
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateIndustry), beforeIndustry);
  assert.equal(JSON.stringify([candidateA, candidateB]), beforeActivations);
});
