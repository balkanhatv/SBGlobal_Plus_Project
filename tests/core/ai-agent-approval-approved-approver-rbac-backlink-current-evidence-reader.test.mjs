import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIAgentApprovalApprovedApproverRbacBacklinkCurrentEvidence,
} from "../../dist/core/index.js";

const PERMISSION = "ai.agent.approval.approve";
const ids = Object.freeze({
  tenant:"11111111-1111-4111-8111-111111111111",
  foreignTenant:"12121212-1212-4212-8212-121212121212",
  industry:"22222222-2222-4222-8222-222222222222",
  approval:"33333333-3333-4333-8333-333333333333",
  otherApproval:"34343434-3434-4434-8434-343434343434",
  run:"44444444-4444-4444-8444-444444444444",
  otherRun:"45454545-4545-4545-8545-454545454545",
  step:"55555555-5555-4555-8555-555555555555",
  otherStep:"56565656-5656-4656-8656-565656565656",
  definition:"66666666-6666-4666-8666-666666666666",
  actor:"77777777-7777-4777-8777-777777777777",
  approver:"88888888-8888-4888-8888-888888888888",
  membership:"99999999-9999-4999-8999-999999999999",
  approverMembership:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  roleA:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  roleB:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  correlation:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  policy:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
});

function actingContext(overrides={}) {
  return Object.freeze({
    requestId:"acting-request",correlationId:"acting-correlation",
    tenantId:ids.tenant,industryContextId:ids.industry,dataHomeId:"home-1",
    regionCode:"IN-CENTRAL",principalId:ids.actor,principalType:"HUMAN",
    membershipId:ids.membership,orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),
    permissionVersion:7,entitlementSnapshotVersion:11,scopeClass:"TENANT_INDUSTRY",
    ...overrides,
  });
}
function approverContext(overrides={}) {
  return Object.freeze({
    requestId:"approver-request",correlationId:"approver-correlation",
    tenantId:ids.tenant,industryContextId:ids.industry,dataHomeId:"home-1",
    regionCode:"IN-CENTRAL",principalId:ids.approver,principalType:"HUMAN",
    membershipId:ids.approverMembership,orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([ids.roleA,ids.roleB]),permissionVersion:13,
    entitlementSnapshotVersion:17,scopeClass:"TENANT_INDUSTRY",...overrides,
  });
}
function approval(overrides={}) {
  return Object.freeze({
    id:ids.approval,runId:ids.run,stepId:ids.step,tenantId:ids.tenant,
    industryContextId:ids.industry,requestedByAgent:true,approvalType:"RAW_TYPE",
    requiredPermission:PERMISSION,approverPrincipalId:ids.approver,status:"APPROVED",
    requestSummarySafe:"safe summary",approvedAt:"2026-10-04T01:00:00.000Z",
    reason:"raw reason",correlationId:ids.correlation,createdAt:"2026-10-04T00:00:00.000Z",
    ...overrides,
  });
}
function run(overrides={}) {
  return Object.freeze({
    id:ids.run,agentDefinitionId:ids.definition,tenantId:ids.tenant,
    industryContextId:ids.industry,actingPrincipalId:ids.actor,membershipId:ids.membership,
    entitlementSnapshotVersion:"raw-entitlement-version",permissionVersion:"raw-permission-version",
    requestedResourceScope:Object.freeze({raw:true}),status:"WAITING_APPROVAL",
    stepBudgetClass:"raw-step-budget",tokenBudgetClass:"raw-token-budget",
    startedAt:"2026-10-04T00:00:00.000Z",completedAt:undefined,
    correlationId:ids.correlation,...overrides,
  });
}
function step(overrides={}) {
  return Object.freeze({
    id:ids.step,runId:ids.run,ordinal:7,stepType:"TOOL",inputRef:"raw-input",
    outputRef:"raw-output",toolBindingId:undefined,approvalId:ids.approval,status:"RUNNING",
    startedAt:"2026-10-04T00:00:30.000Z",completedAt:undefined,auditRef:"raw-audit",
    ...overrides,
  });
}
function authorizationState(overrides={}) {
  const snapshotOverrides=overrides.permissionSnapshot ?? {};
  const policies=Object.hasOwn(overrides,"policies") ? overrides.policies : Object.freeze([
    Object.freeze({
      id:ids.policy,code:"raw-policy",tenantId:ids.tenant,industryContextId:ids.industry,
      permissionPattern:PERMISSION,priority:10,effect:"DENY",expressionVersion:1,
      expression:Object.freeze({op:"eq",attribute:"environment.region",value:"OUTSIDE"}),
    }),
  ]);
  return Object.freeze({
    permissionSnapshot:Object.freeze({
      scopeClass:"TENANT_INDUSTRY",permissionVersion:13,
      roleIds:Object.freeze([ids.roleA,ids.roleB]),
      permissionSet:Object.freeze({permissions:Object.freeze([
        Object.freeze({code:PERMISSION,effect:"ALLOW"}),
      ])}),
      sourceFingerprint:"fingerprint-1",...snapshotOverrides,
    }),
    policies,
  });
}
function fixture(overrides={}) {
  const order=[],approvalCalls=[],runCalls=[],stepCalls=[],authorizationCalls=[];
  const values={
    approval:Object.hasOwn(overrides,"approval")?overrides.approval:approval(),
    run:Object.hasOwn(overrides,"run")?overrides.run:run(),
    step:Object.hasOwn(overrides,"step")?overrides.step:step(),
    authorizationState:Object.hasOwn(overrides,"authorizationState")
      ?overrides.authorizationState:authorizationState(),
  };
  return {
    order,approvalCalls,runCalls,stepCalls,authorizationCalls,values,
    approvalReader:{async loadForContext(input){order.push("approval");approvalCalls.push(input);if(overrides.approvalError)throw overrides.approvalError;return values.approval;}},
    runReader:{async loadForContext(input){order.push("run");runCalls.push(input);if(overrides.runError)throw overrides.runError;return values.run;}},
    stepReader:{async loadForContext(input){order.push("step");stepCalls.push(input);if(overrides.stepError)throw overrides.stepError;return values.step;}},
    authorizationReader:{async load(input){order.push("authorization");authorizationCalls.push(input);if(overrides.authorizationError)throw overrides.authorizationError;return values.authorizationState;}},
  };
}
async function load(f,inputOverrides={}) {
  return loadAIAgentApprovalApprovedApproverRbacBacklinkCurrentEvidence(
    {requestContext:actingContext(),agentApprovalId:ids.approval,approverRequestContext:approverContext(),...inputOverrides},
    f.approvalReader,f.runReader,f.stepReader,f.authorizationReader,
  );
}

test("AIAPP-RBACBACK-BASE-001 exact DD-437 parent evidence is established first with unchanged inputs/dependencies",async()=>{
  const f=fixture(); const acting=actingContext(); const current=approverContext();
  const result=await load(f,{requestContext:acting,approverRequestContext:current});
  assert.ok(result);
  assert.deepEqual(f.order,["approval","run","step","authorization"]);
  assert.equal(f.approvalCalls.length,1); assert.equal(f.runCalls.length,1);
  assert.equal(f.stepCalls.length,1); assert.equal(f.authorizationCalls.length,1);
  assert.equal(f.approvalCalls[0].requestContext,acting);
  assert.equal(f.authorizationCalls[0].requestContext,current);
  assert.equal(result.parent.parent.approverRequestContext,current);
});

test("AIAPP-RBACBACK-BASE-002 DD-437 null/error short-circuits or propagates before reciprocal-backlink evaluation",async()=>{
  const hidden=fixture({approval:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["approval"]);

  const expected=new Error("authorization-failed");
  const broken=fixture({authorizationError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["approval","run","step","authorization"]);
});

test("AIAPP-RBACBACK-BACK-001 exact reciprocal backlink passes for valid Tenant-Core and Tenant-Industry parent evidence",async()=>{
  assert.ok(await load(fixture()));

  const current=approverContext({scopeClass:"TENANT_CORE",industryContextId:undefined});
  const core=fixture({
    approval:approval({industryContextId:undefined}),
    run:run({industryContextId:undefined}),
    authorizationState:authorizationState({permissionSnapshot:{scopeClass:"TENANT_CORE"}}),
  });
  assert.ok(await load(core,{approverRequestContext:current}));
});

test("AIAPP-RBACBACK-BACK-002 unbound/wrong backlink or malformed relevant identifiers fails closed",async()=>{
  for(const candidate of [
    step({approvalId:undefined}),
    step({approvalId:ids.otherApproval}),
    step({approvalId:"not-a-uuid"}),
    step({id:"not-a-uuid"}),
  ]){
    const f=fixture({step:candidate});
    assert.equal(await load(f),null);
  }

  const wrongRun=fixture({approval:approval({runId:ids.otherRun})});
  assert.equal(await load(wrongRun),null);
  const wrongStep=fixture({approval:approval({stepId:ids.otherStep})});
  assert.equal(await load(wrongStep),null);
});

test("AIAPP-RBACBACK-BACK-003 backlink uses only already-loaded exact approval/step references with no additional reads",async()=>{
  const f=fixture(); const result=await load(f);
  assert.ok(result);
  assert.deepEqual(f.order,["approval","run","step","authorization"]);
  assert.equal(f.approvalCalls.length,1);
  assert.equal(f.runCalls.length,1);
  assert.equal(f.stepCalls.length,1);
  assert.equal(f.authorizationCalls.length,1);
  assert.equal(result.parent.parent.parent.approval,f.values.approval);
  assert.equal(result.parent.parent.parent.step,f.values.step);
});

test("AIAPP-RBACBACK-EVID-001 success preserves exact DD-437 parent and leaves all evidence unchanged",async()=>{
  const current=approverContext(); const state=authorizationState();
  const f=fixture({authorizationState:state});
  const before=JSON.stringify([f.values.approval,f.values.run,f.values.step,current,state]);
  const result=await load(f,{approverRequestContext:current});
  assert.ok(result); assert.equal(Object.isFrozen(result),true);
  assert.equal(result.parent.parent.approverRequestContext,current);
  assert.equal(result.parent.authorizationState,state);
  assert.equal(result.parent.parent.parent.approval,f.values.approval);
  assert.equal(result.parent.parent.parent.run,f.values.run);
  assert.equal(result.parent.parent.parent.step,f.values.step);
  assert.equal(JSON.stringify([f.values.approval,f.values.run,f.values.step,current,state]),before);
});

test("AIAPP-RBACBACK-BOUND-001 result exposes no full authorization approval transition dispatch mutation routing or execution authority",async()=>{
  const result=await load(fixture()); assert.ok(result);
  for(const forbidden of [
    "authorizationDecision","accessDecision","decision","abacSatisfied","commercialAllowed",
    "entitlementAllowed","resourceAllowed","approvalSatisfied","approvalAuthorized",
    "guardResult","resumeAuthorized","cancelAuthorized","dispatchAuthorized","mutation",
    "eventEmitted","providerAuthorized","modelAuthorized","executionAuthorized",
  ]) assert.equal(forbidden in result,false);
});
