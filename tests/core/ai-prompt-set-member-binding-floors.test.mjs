import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIPromptSetMemberBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  member: "11111111-1111-4111-8111-111111111111",
  promptSet: "22222222-2222-4222-8222-222222222222",
  otherPromptSet: "33333333-3333-4333-8333-333333333333",
  template: "44444444-4444-4444-8444-444444444444",
  otherTemplate: "55555555-5555-4555-8555-555555555555",
  tenantA: "66666666-6666-4666-8666-666666666666",
  tenantB: "77777777-7777-4777-8777-777777777777",
  industryA: "88888888-8888-4888-8888-888888888888",
  industryB: "99999999-9999-4999-8999-999999999999",
  principal: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

const baseMember = Object.freeze({
  id: ids.member,
  promptSetId: ids.promptSet,
  promptTemplateId: ids.template,
  priority: 100,
  enabled: true,
  createdAt: "2026-09-24T06:00:00.000Z",
});

const basePromptSet = Object.freeze({
  id: ids.promptSet,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque-set",
  version: 3,
  status: "ACTIVE",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

const baseTemplate = Object.freeze({
  id: ids.template,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque-template",
  version: 8,
  systemTemplate: "opaque",
  variableSchema: Object.freeze({anything: true}),
  groundingRequired: false,
  allowedOverrideFields: Object.freeze(["x"]),
  status: "ACTIVE",
  createdBy: ids.principal,
  approvedBy: ids.principal,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

function member(overrides = {}) {
  return Object.freeze({...baseMember, ...overrides});
}

function promptSet(overrides = {}) {
  return Object.freeze({...basePromptSet, ...overrides});
}

function template(overrides = {}) {
  return Object.freeze({...baseTemplate, ...overrides});
}

test("AIPROMPTMEM-CUR-001 ACTIVE PLATFORM set requires exact ACTIVE PLATFORM template", () => {
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
      template({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    true,
  );
});

test("AIPROMPTMEM-CUR-002 TENANT set accepts PLATFORM or same-Tenant TENANT template", () => {
  const tenantSet = promptSet({ownerScope: "TENANT", industryContextId: undefined});

  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      tenantSet,
      template({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      tenantSet,
      template({ownerScope: "TENANT", industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      tenantSet,
      template({ownerScope: "TENANT", tenantId: ids.tenantB, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(member(), tenantSet, template()),
    false,
  );
});

test("AIPROMPTMEM-CUR-003 INDUSTRY set accepts broader/equal ACTIVE template only", () => {
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet(),
      template({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet(),
      template({ownerScope: "TENANT", industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(member(), promptSet(), template()),
    true,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet(),
      template({industryContextId: ids.industryB}),
    ),
    false,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet(),
      template({tenantId: ids.tenantB}),
    ),
    false,
  );
});

test("AIPROMPTMEM-CUR-004 wrong PromptSet or PromptTemplate identity fails", () => {
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet({id: ids.otherPromptSet}),
      template(),
    ),
    false,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet(),
      template({id: ids.otherTemplate}),
    ),
    false,
  );
});

test("AIPROMPTMEM-CUR-005 non-ACTIVE parent or template fails", () => {
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"]) {
    assert.equal(
      matchesAIPromptSetMemberBindingFloors(
        member(),
        promptSet({status}),
        template(),
      ),
      false,
      "set:" + status,
    );
    assert.equal(
      matchesAIPromptSetMemberBindingFloors(
        member(),
        promptSet(),
        template({status}),
      ),
      false,
      "template:" + status,
    );
  }
});

test("AIPROMPTMEM-CUR-006 malformed identity or owner shape fails closed", () => {
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member({id: "not-a-uuid"}),
      promptSet(),
      template(),
    ),
    false,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
      template({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      member(),
      promptSet(),
      template({industryContextId: "not-a-uuid"}),
    ),
    false,
  );
});

test("AIPROMPTMEM-CUR-007 priority/enabled/content/rendering evidence remains uninterpreted without mutation", () => {
  const candidateMember = member({
    priority: -999,
    enabled: false,
    createdAt: "not-interpreted",
  });
  const candidateSet = promptSet({
    code: "",
    version: -99,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const candidateTemplate = template({
    code: "",
    version: -99,
    systemTemplate: "",
    variableSchema: Object.freeze(null),
    groundingRequired: true,
    allowedOverrideFields: Object.freeze(["", "", "x"]),
    createdBy: "",
    approvedBy: undefined,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeMember = JSON.stringify(candidateMember);
  const beforeSet = JSON.stringify(candidateSet);
  const beforeTemplate = JSON.stringify(candidateTemplate);

  assert.equal(
    matchesAIPromptSetMemberBindingFloors(
      candidateMember,
      candidateSet,
      candidateTemplate,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateMember), beforeMember);
  assert.equal(JSON.stringify(candidateSet), beforeSet);
  assert.equal(JSON.stringify(candidateTemplate), beforeTemplate);
});
