import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIToolSetMemberParentBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  member: "11111111-1111-4111-8111-111111111111",
  toolSet: "22222222-2222-4222-8222-222222222222",
  otherToolSet: "33333333-3333-4333-8333-333333333333",
  toolDefinition: "44444444-4444-4444-8444-444444444444",
  tenant: "55555555-5555-4555-8555-555555555555",
  industry: "66666666-6666-4666-8666-666666666666",
});

const baseMember = Object.freeze({
  id: ids.member,
  toolSetId: ids.toolSet,
  toolDefinitionId: ids.toolDefinition,
  enabled: true,
  constraint: Object.freeze({opaque: true}),
  createdAt: "2026-09-26T00:00:00.000Z",
});

const baseToolSet = Object.freeze({
  id: ids.toolSet,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  code: "raw-tool-set",
  version: 7,
  status: "ACTIVE",
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
});

function member(overrides = {}) {
  return Object.freeze({...baseMember, ...overrides});
}

function toolSet(overrides = {}) {
  return Object.freeze({...baseToolSet, ...overrides});
}

test("AITOOLMEM-SET-CUR-001 exact parent ToolSet id passes", () => {
  assert.equal(
    matchesAIToolSetMemberParentBindingFloors(member(), toolSet()),
    true,
  );
});

test("AITOOLMEM-SET-CUR-002 missing ToolSet evidence fails closed", () => {
  assert.equal(matchesAIToolSetMemberParentBindingFloors(member()), false);
});

test("AITOOLMEM-SET-CUR-003 wrong parent ToolSet id fails closed", () => {
  assert.equal(
    matchesAIToolSetMemberParentBindingFloors(
      member(),
      toolSet({id: ids.otherToolSet}),
    ),
    false,
  );
});

test("AITOOLMEM-SET-CUR-004 malformed member identity or parent id fails closed", () => {
  assert.equal(
    matchesAIToolSetMemberParentBindingFloors(
      member({id: "not-a-uuid"}),
      toolSet(),
    ),
    false,
  );
  assert.equal(
    matchesAIToolSetMemberParentBindingFloors(
      member({toolSetId: "not-a-uuid"}),
      toolSet(),
    ),
    false,
  );
});

test("AITOOLMEM-SET-CUR-005 malformed ToolSet id fails closed", () => {
  assert.equal(
    matchesAIToolSetMemberParentBindingFloors(
      member(),
      toolSet({id: "not-a-uuid"}),
    ),
    false,
  );
});

test("AITOOLMEM-SET-CUR-006 ToolSet lifecycle/scope/catalog evidence remains uninterpreted", () => {
  for (const candidate of [
    toolSet({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    toolSet({ownerScope: "TENANT", tenantId: "not-interpreted", industryContextId: undefined}),
    toolSet({ownerScope: "UNKNOWN", tenantId: "bad", industryContextId: "bad"}),
    toolSet({code: "", version: -999, status: "RETIRED"}),
    toolSet({status: "DRAFT", createdAt: "raw", updatedAt: "raw"}),
  ]) {
    assert.equal(
      matchesAIToolSetMemberParentBindingFloors(member(), candidate),
      true,
    );
  }
});

test("AITOOLMEM-SET-CUR-007 unrelated member semantics remain uninterpreted and inputs are unchanged", () => {
  const candidateMember = member({
    toolDefinitionId: "not-interpreted",
    enabled: false,
    constraint: Object.freeze({
      nested: Object.freeze({anything: true}),
      list: Object.freeze([1, "two", false]),
    }),
    createdAt: "not-interpreted",
  });
  const candidateToolSet = toolSet({
    ownerScope: "UNKNOWN",
    tenantId: "not-interpreted",
    industryContextId: "not-interpreted",
    code: "",
    version: -1,
    status: "RETIRED",
    createdAt: "raw",
    updatedAt: "raw",
  });
  const beforeMember = JSON.stringify(candidateMember);
  const beforeToolSet = JSON.stringify(candidateToolSet);

  assert.equal(
    matchesAIToolSetMemberParentBindingFloors(
      candidateMember,
      candidateToolSet,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateMember), beforeMember);
  assert.equal(JSON.stringify(candidateToolSet), beforeToolSet);
});
