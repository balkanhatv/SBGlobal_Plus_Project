import test from "node:test";
import assert from "node:assert/strict";

import {
  OperationRegistry,
  loadAIAgentStepActingOperationRbacCurrentEvidence,
} from "../../dist/core/index.js";

const APPROVAL_PERMISSION = "raw.approval.permission";
const TOOL_PERMISSION = "raw.tool.permission";
const OPERATION_PERMISSION = "raw.operation.permission";

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

const operationId = "operation.raw";
const capabilityCode = "capability.raw";

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
function operation(overrides={}) {
  return Object.freeze({
    operationId,module:"RawModule",scopeClass:"TENANT_INDUSTRY",kind:"COMMAND",
    permissionCode:OPERATION_PERMISSION,entitlementRequirement:"operation.entitlement",
    inputSchemaVersion:1,outputSchemaVersion:1,idempotencyPolicy:"REQUIRED",
    rateClass:"AI_COSTED",auditClass:"OPERATION_AUDIT",domainService:"RawService.execute",
    emittedEvents:Object.freeze([]),errorCodes:Object.freeze([]),...overrides,
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
    operation:Object.hasOwn(overrides,"operation")?overrides.operation:operation(),
    approverState:overrides.approverState??authorizationState(approverCtx,APPROVAL_PERMISSION),
    toolState:overrides.toolState??authorizationState(acting,TOOL_PERMISSION),
    operationState:overrides.operationState??authorizationState(acting,OPERATION_PERMISSION),
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
      authorizationCalls.push(input);
      if(input.requestContext.principalId===ids.approver){
        order.push("authorization:approver");
        if(overrides.approverAuthorizationError)throw overrides.approverAuthorizationError;
        return values.approverState;
      }
      if(input.permissionCode===TOOL_PERMISSION){
        order.push("authorization:tool");
        if(overrides.toolAuthorizationError)throw overrides.toolAuthorizationError;
        return values.toolState;
      }
      if(input.permissionCode===OPERATION_PERMISSION){
        order.push("authorization:operation");
        if(overrides.operationAuthorizationError)throw overrides.operationAuthorizationError;
        return values.operationState;
      }
      throw new Error("unexpected acting permission read");
    }},
  };
  const registry=new OperationRegistry(); registry.register(values.operation);
  return {order,authorizationCalls,values,readers,registry,acting,approverCtx};
}
async function load(f,inputOverrides={}) {
  return loadAIAgentStepActingOperationRbacCurrentEvidence(
    {requestContext:f.acting,agentStepId:ids.step,approverRequestContext:f.approverCtx,...inputOverrides},
    f.readers.stepReader,f.readers.runReader,f.readers.definitionReader,
    f.readers.toolSetReader,f.readers.memberReader,f.readers.toolDefinitionReader,
    f.readers.approvalReader,f.registry,f.readers.capabilityReader,f.readers.authorizationReader,
  );
}

test("AISTEP-OPRBAC-BASE-001 exact DD-452 parent is established first",async()=>{
  const f=fixture(); const result=await load(f); assert.ok(result);
  assert.deepEqual(f.order,[
    "step","run","definition","toolSet","member","toolDefinition","approval","capability",
    "authorization:approver","authorization:tool","authorization:operation",
  ]);
  assert.equal(result.parent.parent.parent.approverRequestContext,f.approverCtx);
});

test("AISTEP-OPRBAC-BASE-002 parent null/error precedes any new OperationContract permission read",async()=>{
  const expected=new Error("parent-failed"); const f=fixture({stepError:expected});
  await assert.rejects(load(f),error=>error===expected);
  assert.deepEqual(f.order,["step"]); assert.equal(f.authorizationCalls.length,0);
});

test("AISTEP-OPRBAC-BRANCH-001 non-TOOL performs zero new OperationContract permission reads",async()=>{
  const f=fixture({
    step:step({stepType:"PLAN",toolBindingId:undefined,approvalId:undefined}),
    approval:null,
  });
  const result=await load(f,{approverRequestContext:undefined}); assert.ok(result);
  assert.equal(f.authorizationCalls.length,0);
  assert.equal("operationAuthorizationState" in result,false);
  assert.equal("operationPermission" in result,false);
  assert.equal(Object.isFrozen(result),true);
});

test("AISTEP-OPRBAC-READ-001 TOOL performs one additional exact acting-context OperationContract permission read",async()=>{
  const f=fixture(); const result=await load(f); assert.ok(result);
  assert.equal(f.authorizationCalls.length,3);
  const operationCall=f.authorizationCalls[2];
  assert.equal(operationCall.requestContext,f.acting);
  assert.equal(operationCall.permissionCode,OPERATION_PERMISSION);
  assert.equal(result.parent.actingPermission.code,TOOL_PERMISSION);
  assert.notEqual(operationCall.permissionCode,TOOL_PERMISSION);
  assert.notEqual(operationCall.permissionCode,APPROVAL_PERMISSION);
});

test("AISTEP-OPRBAC-READ-002 operation Authorization errors propagate without permission fallback",async()=>{
  const expected=new Error("operation-authorization-unavailable");
  const f=fixture({operationAuthorizationError:expected});
  await assert.rejects(load(f),error=>error===expected);
  assert.equal(f.authorizationCalls.length,3);
  assert.equal(f.authorizationCalls[2].permissionCode,OPERATION_PERMISSION);
});

test("AISTEP-OPRBAC-CUR-001 generic current Tenant floor preserves exact OperationContract ALLOW reference",async()=>{
  const acting=actingContext();
  const state=authorizationState(acting,OPERATION_PERMISSION);
  const f=fixture({actingContext:acting,operationState:state});
  const result=await load(f); assert.ok(result);
  assert.equal(result.operationAuthorizationState,state);
  assert.equal(result.operationPermission,state.permissionSnapshot.permissionSet.permissions[0]);
});

test("AISTEP-OPRBAC-CUR-002 stale/missing/DENY/duplicate OperationContract RBAC evidence fails closed",async()=>{
  const base=actingContext();
  const cases=[
    authorizationState(base,OPERATION_PERMISSION,{permissionSnapshot:{scopeClass:"TENANT_CORE"}}),
    authorizationState(base,OPERATION_PERMISSION,{permissionSnapshot:{permissionVersion:6}}),
    authorizationState(base,OPERATION_PERMISSION,{permissionSnapshot:{roleIds:Object.freeze([ids.actorRoleB,ids.actorRoleA])}}),
    authorizationState(base,OPERATION_PERMISSION,{permissionSnapshot:{permissionSet:Object.freeze({permissions:Object.freeze([])})}}),
    authorizationState(base,OPERATION_PERMISSION,{permissionSnapshot:{permissionSet:Object.freeze({permissions:Object.freeze([Object.freeze({code:OPERATION_PERMISSION,effect:"DENY"})])})}}),
    authorizationState(base,OPERATION_PERMISSION,{permissionSnapshot:{permissionSet:Object.freeze({permissions:Object.freeze([
      Object.freeze({code:OPERATION_PERMISSION,effect:"ALLOW"}),
      Object.freeze({code:OPERATION_PERMISSION,effect:"ALLOW"}),
    ])})}}),
  ];
  for(const state of cases){
    const f=fixture({operationState:state});
    assert.equal(await load(f),null);
    assert.equal(f.authorizationCalls.length,3);
  }
});

test("AISTEP-OPRBAC-EVID-001 TOOL success preserves exact parent operation state permission and raw evidence references",async()=>{
  const acting=actingContext();
  const operationState=authorizationState(acting,OPERATION_PERMISSION);
  const f=fixture({actingContext:acting,operationState});
  const before=JSON.stringify([
    f.values.step,f.values.toolDefinition,f.values.operation,f.values.approval,
    f.values.capability,f.values.toolState,operationState,
  ]);
  const result=await load(f); assert.ok(result);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(result.operationAuthorizationState,operationState);
  assert.equal(result.operationAuthorizationState.policies,operationState.policies);
  assert.equal(result.operationPermission,operationState.permissionSnapshot.permissionSet.permissions[0]);
  assert.equal(result.parent.actingAuthorizationState,f.values.toolState);
  assert.equal(result.parent.parent.parent.parent.parent.operationContract,f.values.operation);
  assert.equal(result.parent.parent.parent.parent.capability,f.values.capability);
  assert.equal(JSON.stringify([
    f.values.step,f.values.toolDefinition,f.values.operation,f.values.approval,
    f.values.capability,f.values.toolState,operationState,
  ]),before);
});

test("AISTEP-OPRBAC-BOUND-001 output grants no compatibility full authorization approval commercial dispatch or execution authority",async()=>{
  const result=await load(fixture()); assert.ok(result);
  for(const forbidden of [
    "permissionCompatible","toolOperationCompatible","authorizationDecision","accessDecision",
    "decision","abacSatisfied","commercialAllowed","entitlementAllowed","resourceAllowed",
    "approvalSatisfied","approvalAuthorized","guardResult","resumeAuthorized","dispatchAuthorized",
    "mutation","eventEmitted","providerAuthorized","modelAuthorized","executionAuthorized",
  ]) assert.equal(forbidden in result,false);
});
