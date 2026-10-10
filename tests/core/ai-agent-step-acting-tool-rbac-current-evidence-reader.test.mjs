import test from "node:test";
import assert from "node:assert/strict";

import {
  OperationRegistry,
  loadAIAgentStepActingToolRbacCurrentEvidence,
} from "../../dist/core/index.js";

const APPROVAL_PERMISSION = "raw.approval.permission";
const TOOL_PERMISSION = "raw.tool.permission";

const ids = Object.freeze({
  tenant:"11111111-1111-4111-8111-111111111111",
  industry:"22222222-2222-4222-8222-222222222222",
  step:"33333333-3333-4333-8333-333333333333",
  run:"44444444-4444-4444-8444-444444444444",
  definition:"55555555-5555-4555-8555-555555555555",
  toolSet:"66666666-6666-4666-8666-666666666666",
  member:"77777777-7777-4777-8777-777777777777",
  toolDefinition:"88888888-8888-4888-8888-888888888888",
  actor:"99999999-9999-4999-8999-999999999999",
  approver:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  approval:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  membership:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  approverMembership:"abababab-abab-4bab-8bab-abababababab",
  correlation:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  capability:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  actorRoleA:"12121212-1212-4212-8212-121212121212",
  actorRoleB:"13131313-1313-4313-8313-131313131313",
  approverRoleA:"14141414-1414-4414-8414-141414141414",
  approverRoleB:"15151515-1515-4515-8515-151515151515",
  policy:"16161616-1616-4616-8616-161616161616",
});

const operationId="operation.raw";
const capabilityCode="capability.raw";

function actingContext(overrides={}) {
  return Object.freeze({
    requestId:"request-actor",correlationId:"correlation-actor",
    tenantId:ids.tenant,industryContextId:ids.industry,dataHomeId:"data-home",
    regionCode:"IN-CENTRAL",principalId:ids.actor,principalType:"HUMAN",
    membershipId:ids.membership,orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([ids.actorRoleA,ids.actorRoleB]),
    permissionVersion:7,entitlementSnapshotVersion:11,scopeClass:"TENANT_INDUSTRY",
    ...overrides,
  });
}
function approverContext(overrides={}) {
  return Object.freeze({
    requestId:"request-approver",correlationId:"correlation-approver",
    tenantId:ids.tenant,industryContextId:ids.industry,dataHomeId:"data-home",
    regionCode:"IN-CENTRAL",principalId:ids.approver,principalType:"HUMAN",
    membershipId:ids.approverMembership,orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([ids.approverRoleA,ids.approverRoleB]),
    permissionVersion:13,entitlementSnapshotVersion:17,scopeClass:"TENANT_INDUSTRY",
    ...overrides,
  });
}
function step(overrides={}) {
  return Object.freeze({
    id:ids.step,runId:ids.run,ordinal:1,stepType:"TOOL",inputRef:"opaque-input",
    outputRef:"opaque-output",toolBindingId:ids.member,approvalId:ids.approval,
    status:"RUNNING",startedAt:"2026-10-04T00:00:00.000Z",completedAt:undefined,
    auditRef:"opaque-audit",...overrides,
  });
}
function run(overrides={}) {
  return Object.freeze({
    id:ids.run,agentDefinitionId:ids.definition,tenantId:ids.tenant,
    industryContextId:ids.industry,actingPrincipalId:ids.actor,membershipId:ids.membership,
    entitlementSnapshotVersion:"raw-snapshot-version",permissionVersion:"raw-permission-version",
    requestedResourceScope:Object.freeze({raw:true}),status:"WAITING_APPROVAL",
    stepBudgetClass:"raw-step-budget",tokenBudgetClass:"raw-token-budget",
    startedAt:"2026-10-04T00:00:00.000Z",correlationId:ids.correlation,...overrides,
  });
}
function definition(overrides={}) {
  return Object.freeze({
    id:ids.definition,ownerScope:"INDUSTRY",tenantId:ids.tenant,industryContextId:ids.industry,
    code:"agent.raw",objectiveClass:"raw-objective",allowedToolSetId:ids.toolSet,
    maxRiskClass:"raw-risk",approvalPolicyId:ids.approval,budgetPolicyId:ids.approval,
    version:1,status:"ACTIVE",createdAt:"2026-10-04T00:00:00.000Z",
    updatedAt:"2026-10-04T00:00:00.000Z",...overrides,
  });
}
function toolSet(overrides={}) {
  return Object.freeze({
    id:ids.toolSet,ownerScope:"INDUSTRY",tenantId:ids.tenant,industryContextId:ids.industry,
    code:"toolset.raw",version:1,status:"ACTIVE",createdAt:"2026-10-04T00:00:00.000Z",
    updatedAt:"2026-10-04T00:00:00.000Z",...overrides,
  });
}
function member(overrides={}) {
  return Object.freeze({
    id:ids.member,toolSetId:ids.toolSet,toolDefinitionId:ids.toolDefinition,
    enabled:true,constraint:Object.freeze({raw:true}),createdAt:"2026-10-04T00:00:00.000Z",
    ...overrides,
  });
}
function toolDefinition(overrides={}) {
  return Object.freeze({
    id:ids.toolDefinition,toolId:"tool.raw",capabilityCode,operationContractId:operationId,
    scopeClass:"TENANT_INDUSTRY",requiredPermission:TOOL_PERMISSION,
    requiredEntitlement:"tool.entitlement",inputSchemaVersion:1,outputSchemaVersion:1,
    sideEffectClass:"HIGH",approvalPolicyId:ids.approval,idempotencyRequired:true,
    auditClass:"TOOL_AUDIT",status:"ACTIVE",version:1,
    createdAt:"2026-10-04T00:00:00.000Z",updatedAt:"2026-10-04T00:00:00.000Z",
    ...overrides,
  });
}
function approval(overrides={}) {
  return Object.freeze({
    id:ids.approval,runId:ids.run,stepId:ids.step,tenantId:ids.tenant,
    industryContextId:ids.industry,requestedByAgent:true,approvalType:"RAW_TYPE",
    requiredPermission:APPROVAL_PERMISSION,approverPrincipalId:ids.approver,status:"APPROVED",
    requestSummarySafe:"safe summary",approvedAt:"2026-10-04T00:00:00.000Z",
    reason:"raw reason",correlationId:ids.correlation,createdAt:"2026-10-04T01:00:00.000Z",
    ...overrides,
  });
}
function capability(overrides={}) {
  return Object.freeze({
    id:ids.capability,code:capabilityCode,category:"TOOL",
    requiredEntitlement:"cap.entitlement",defaultPolicyClass:"raw-policy",
    schemaVersion:1,status:"ACTIVE",...overrides,
  });
}
function operation() {
  return Object.freeze({
    operationId,module:"RawModule",scopeClass:"TENANT_INDUSTRY",kind:"COMMAND",
    permissionCode:"operation.permission.different",entitlementRequirement:"operation.entitlement",
    inputSchemaVersion:1,outputSchemaVersion:1,idempotencyPolicy:"REQUIRED",
    rateClass:"AI_COSTED",auditClass:"OPERATION_AUDIT",domainService:"RawService.execute",
    emittedEvents:Object.freeze([]),errorCodes:Object.freeze([]),
  });
}
function authorizationState(context,permission,overrides={}) {
  const snapshotOverrides=overrides.permissionSnapshot??{};
  return Object.freeze({
    permissionSnapshot:Object.freeze({
      scopeClass:context.scopeClass,permissionVersion:context.permissionVersion,
      roleIds:context.roleIds,
      permissionSet:Object.freeze({permissions:Object.freeze([
        Object.freeze({code:permission,effect:"ALLOW"}),
      ])}),
      sourceFingerprint:"fingerprint",...snapshotOverrides,
    }),
    policies:Object.hasOwn(overrides,"policies")?overrides.policies:Object.freeze([
      Object.freeze({
        id:ids.policy,code:"raw-policy",tenantId:ids.tenant,industryContextId:ids.industry,
        permissionPattern:permission,priority:10,effect:"DENY",expressionVersion:1,
        expression:Object.freeze({op:"eq",attribute:"environment.region",value:"OUTSIDE"}),
      }),
    ]),
  });
}

function fixture(overrides={}) {
  const order=[]; const authorizationCalls=[];
  const acting=overrides.actingContext??actingContext();
  const approverCtx=overrides.approverContext??approverContext();
  const values={
    step:Object.hasOwn(overrides,"step")?overrides.step:step(),
    run:run(),definition:definition(),toolSet:toolSet(),member:member(),
    toolDefinition:Object.hasOwn(overrides,"toolDefinition")?overrides.toolDefinition:toolDefinition(),
    approval:Object.hasOwn(overrides,"approval")?overrides.approval:approval(),
    capability:capability(),
    approverState:overrides.approverState??authorizationState(approverCtx,APPROVAL_PERMISSION),
    actingState:overrides.actingState??authorizationState(acting,TOOL_PERMISSION),
  };
  const readers={
    stepReader:{async loadForContext(){order.push("step");if(overrides.stepError)throw overrides.stepError;return values.step;}},
    runReader:{async loadForContext(){order.push("run");return values.run;}},
    definitionReader:{async loadForContext(){order.push("definition");return values.definition;}},
    toolSetReader:{async loadForContext(){order.push("toolSet");return values.toolSet;}},
    memberReader:{async loadForContext(){order.push("member");return values.member;}},
    toolDefinitionReader:{async loadById(){order.push("toolDefinition");return values.toolDefinition;}},
    approvalReader:{async loadForContext(){order.push("approval");return values.approval;}},
    capabilityReader:{async loadByCode(){order.push("capability");return values.capability;}},
    authorizationReader:{async load(input){
      order.push(input.requestContext.principalId===ids.actor?"authorization:acting":"authorization:approver");
      authorizationCalls.push(input);
      if(input.requestContext.principalId===ids.actor){
        if(overrides.actingAuthorizationError)throw overrides.actingAuthorizationError;
        return values.actingState;
      }
      if(overrides.approverAuthorizationError)throw overrides.approverAuthorizationError;
      return values.approverState;
    }},
  };
  const registry=new OperationRegistry(); registry.register(operation());
  return {order,authorizationCalls,values,readers,registry,acting,approverCtx};
}
async function load(f,inputOverrides={}) {
  return loadAIAgentStepActingToolRbacCurrentEvidence(
    {requestContext:f.acting,agentStepId:ids.step,approverRequestContext:f.approverCtx,...inputOverrides},
    f.readers.stepReader,f.readers.runReader,f.readers.definitionReader,
    f.readers.toolSetReader,f.readers.memberReader,f.readers.toolDefinitionReader,
    f.readers.approvalReader,f.registry,f.readers.capabilityReader,f.readers.authorizationReader,
  );
}

test("AISTEP-ACTRBAC-BASE-001 exact DD-447 parent is established first",async()=>{
  const f=fixture(); const result=await load(f); assert.ok(result);
  assert.deepEqual(f.order,[
    "step","run","definition","toolSet","member","toolDefinition","approval","capability",
    "authorization:approver","authorization:acting",
  ]);
  assert.equal(result.parent.parent.approverRequestContext,f.approverCtx);
});

test("AISTEP-ACTRBAC-BASE-002 parent null/error precedes any new acting Authorization read",async()=>{
  const expected=new Error("parent-failed"); const f=fixture({stepError:expected});
  await assert.rejects(load(f),error=>error===expected);
  assert.deepEqual(f.order,["step"]); assert.equal(f.authorizationCalls.length,0);
});

test("AISTEP-ACTRBAC-BRANCH-001 non-TOOL performs zero new Authorization reads",async()=>{
  const f=fixture({
    step:step({stepType:"PLAN",toolBindingId:undefined,approvalId:undefined}),
    approval:null,
  });
  const result=await load(f,{approverRequestContext:undefined}); assert.ok(result);
  assert.equal(f.authorizationCalls.length,0);
  assert.equal("actingAuthorizationState" in result,false);
  assert.equal("actingPermission" in result,false);
  assert.equal(Object.isFrozen(result),true);
});

test("AISTEP-ACTRBAC-READ-001 TOOL uses exact acting context and preserved ToolDefinition.requiredPermission once",async()=>{
  const f=fixture(); const result=await load(f); assert.ok(result);
  assert.equal(f.authorizationCalls.length,2);
  const actingCall=f.authorizationCalls[1];
  assert.equal(actingCall.requestContext,f.acting);
  assert.equal(actingCall.permissionCode,TOOL_PERMISSION);
  assert.notEqual(result.parent.parent.parent.parent.operationContract.permissionCode,TOOL_PERMISSION);
  assert.notEqual(result.parent.parent.parent.parent.parent.approval.requiredPermission,TOOL_PERMISSION);
});

test("AISTEP-ACTRBAC-READ-002 acting Authorization errors propagate without alternate permission fallback",async()=>{
  const expected=new Error("acting-authorization-unavailable");
  const f=fixture({actingAuthorizationError:expected});
  await assert.rejects(load(f),error=>error===expected);
  assert.equal(f.authorizationCalls.length,2);
  assert.equal(f.authorizationCalls[1].permissionCode,TOOL_PERMISSION);
});

test("AISTEP-ACTRBAC-CUR-001 generic current Tenant floor preserves exact ALLOW reference",async()=>{
  const acting=actingContext(); const state=authorizationState(acting,TOOL_PERMISSION);
  const f=fixture({actingContext:acting,actingState:state});
  const result=await load(f); assert.ok(result);
  assert.equal(result.actingAuthorizationState,state);
  assert.equal(result.actingPermission,state.permissionSnapshot.permissionSet.permissions[0]);
});

test("AISTEP-ACTRBAC-CUR-002 stale/missing/DENY/duplicate acting RBAC evidence fails closed",async()=>{
  const base=actingContext();
  const cases=[
    {ctx:base,state:authorizationState(base,TOOL_PERMISSION,{permissionSnapshot:{scopeClass:"TENANT_CORE"}})},
    {ctx:actingContext({permissionVersion:8}),state:authorizationState(base,TOOL_PERMISSION)},
    {ctx:base,state:authorizationState(base,TOOL_PERMISSION,{permissionSnapshot:{roleIds:Object.freeze([ids.actorRoleB,ids.actorRoleA])}})},
    {ctx:base,state:authorizationState(base,TOOL_PERMISSION,{permissionSnapshot:{permissionSet:Object.freeze({permissions:Object.freeze([])})}})},
    {ctx:base,state:authorizationState(base,TOOL_PERMISSION,{permissionSnapshot:{permissionSet:Object.freeze({permissions:Object.freeze([Object.freeze({code:TOOL_PERMISSION,effect:"DENY"})])})}})},
    {ctx:base,state:authorizationState(base,TOOL_PERMISSION,{permissionSnapshot:{permissionSet:Object.freeze({permissions:Object.freeze([Object.freeze({code:TOOL_PERMISSION,effect:"ALLOW"}),Object.freeze({code:TOOL_PERMISSION,effect:"ALLOW"})])})}})},
  ];
  for(const candidate of cases){
    const f=fixture({actingContext:candidate.ctx,actingState:candidate.state});
    assert.equal(await load(f),null);
  }
});

test("AISTEP-ACTRBAC-EVID-001 TOOL success preserves exact parent/state/permission and raw nested evidence",async()=>{
  const acting=actingContext(); const state=authorizationState(acting,TOOL_PERMISSION);
  const f=fixture({actingContext:acting,actingState:state});
  const before=JSON.stringify([f.values.step,f.values.toolDefinition,f.values.approval,f.values.capability,state]);
  const result=await load(f); assert.ok(result);
  assert.equal(result.actingAuthorizationState,state);
  assert.equal(result.actingAuthorizationState.policies,state.policies);
  assert.equal(result.actingPermission,state.permissionSnapshot.permissionSet.permissions[0]);
  assert.equal(result.parent.parent.parent.capability,f.values.capability);
  assert.equal(result.parent.parent.parent.parent.operationContract.permissionCode,"operation.permission.different");
  assert.equal(result.parent.parent.parent.parent.parent.approval,f.values.approval);
  assert.equal(JSON.stringify([f.values.step,f.values.toolDefinition,f.values.approval,f.values.capability,state]),before);
});

test("AISTEP-ACTRBAC-BOUND-001 output grants no compatibility full authorization approval dispatch or execution authority",async()=>{
  const result=await load(fixture()); assert.ok(result);
  for(const forbidden of [
    "permissionCompatible","toolOperationCompatible","authorizationDecision","accessDecision",
    "decision","abacSatisfied","commercialAllowed","entitlementAllowed","resourceAllowed",
    "approvalSatisfied","approvalAuthorized","guardResult","resumeAuthorized","dispatchAuthorized",
    "mutation","eventEmitted","providerAuthorized","modelAuthorized","executionAuthorized",
  ]) assert.equal(forbidden in result,false);
});
