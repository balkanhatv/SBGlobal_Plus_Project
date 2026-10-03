import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIAgentDefinitionToolSetBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  agent: "11111111-1111-4111-8111-111111111111",
  toolSet: "22222222-2222-4222-8222-222222222222",
  otherToolSet: "33333333-3333-4333-8333-333333333333",
  tenantA: "44444444-4444-4444-8444-444444444444",
  tenantB: "55555555-5555-4555-8555-555555555555",
  industryA: "66666666-6666-4666-8666-666666666666",
  industryB: "77777777-7777-4777-8777-777777777777",
  approval: "88888888-8888-4888-8888-888888888888",
  budget: "99999999-9999-4999-8999-999999999999",
});

const baseAgent = Object.freeze({
  id: ids.agent,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque-agent",
  objectiveClass: "UNINTERPRETED",
  allowedToolSetId: ids.toolSet,
  maxRiskClass: "UNINTERPRETED",
  approvalPolicyId: ids.approval,
  budgetPolicyId: ids.budget,
  version: 7,
  status: "RETIRED",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

const baseToolSet = Object.freeze({
  id: ids.toolSet,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque-tool-set",
  version: 3,
  status: "ACTIVE",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

function agent(overrides = {}) {
  return Object.freeze({...baseAgent, ...overrides});
}

function toolSet(overrides = {}) {
  return Object.freeze({...baseToolSet, ...overrides});
}

test("AIAGENT-TOOLSET-CUR-001 ACTIVE PLATFORM ToolSet contains PLATFORM/TENANT/INDUSTRY Agents", () => {
  const platformToolSet = toolSet({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
      platformToolSet,
    ),
    true,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({ownerScope: "TENANT", industryContextId: undefined}),
      platformToolSet,
    ),
    true,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(agent(), platformToolSet),
    true,
  );
});

test("AIAGENT-TOOLSET-CUR-002 same-Tenant TENANT ToolSet contains TENANT/INDUSTRY only", () => {
  const tenantToolSet = toolSet({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({ownerScope: "TENANT", industryContextId: undefined}),
      tenantToolSet,
    ),
    true,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(agent(), tenantToolSet),
    true,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({tenantId: ids.tenantB}),
      tenantToolSet,
    ),
    false,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
      tenantToolSet,
    ),
    false,
  );
});

test("AIAGENT-TOOLSET-CUR-003 INDUSTRY ToolSet contains only exact same-Tenant Industry Agent", () => {
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(agent(), toolSet()),
    true,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({industryContextId: ids.industryB}),
      toolSet(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({ownerScope: "TENANT", industryContextId: undefined}),
      toolSet(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
      toolSet(),
    ),
    false,
  );
});

test("AIAGENT-TOOLSET-CUR-004 wrong ToolSet id fails closed", () => {
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent(),
      toolSet({id: ids.otherToolSet}),
    ),
    false,
  );
});

test("AIAGENT-TOOLSET-CUR-005 non-ACTIVE ToolSet states fail closed", () => {
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"]) {
    assert.equal(
      matchesAIAgentDefinitionToolSetBindingFloors(
        agent(),
        toolSet({status}),
      ),
      false,
      status,
    );
  }
});

test("AIAGENT-TOOLSET-CUR-006 malformed identities or owner shapes fail closed", () => {
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({id: "not-a-uuid"}),
      toolSet(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({allowedToolSetId: "not-a-uuid"}),
      toolSet(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent({ownerScope: "TENANT", industryContextId: ids.industryA}),
      toolSet({ownerScope: "TENANT", industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      agent(),
      toolSet({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    ),
    false,
  );
});

test("AIAGENT-TOOLSET-CUR-007 unrelated Agent/ToolSet semantics remain uninterpreted without mutation", () => {
  const candidateAgent = agent({
    code: "",
    objectiveClass: "",
    maxRiskClass: "",
    approvalPolicyId: "",
    budgetPolicyId: "",
    version: -99,
    status: "DRAFT",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const candidateToolSet = toolSet({
    code: "",
    version: -99,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeAgent = JSON.stringify(candidateAgent);
  const beforeToolSet = JSON.stringify(candidateToolSet);

  assert.equal(
    matchesAIAgentDefinitionToolSetBindingFloors(
      candidateAgent,
      candidateToolSet,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateAgent), beforeAgent);
  assert.equal(JSON.stringify(candidateToolSet), beforeToolSet);
});
