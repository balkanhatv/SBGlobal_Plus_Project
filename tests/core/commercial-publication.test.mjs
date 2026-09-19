import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialPublicationError,
  CommercialPublicationService,
} from "../../dist/core/index.js";

function context(){
  return Object.freeze({
    requestId:randomUUID(),
    correlationId:randomUUID(),
    tenantId:randomUUID(),
    dataHomeId:randomUUID(),
    regionCode:"IN-COMMERCIAL-PUBLISH",
    principalId:randomUUID(),
    principalType:"SERVICE",
    entitlementSnapshotId:randomUUID(),
    entitlementSnapshotVersion:7,
    orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([]),
    scopeClass:"TENANT_CORE",
  });
}

test("Commercial publication service normalizes deterministic compiled input before store",async()=>{
  const seen=[];
  const ids=[randomUUID(),randomUUID(),randomUUID(),randomUUID(),randomUUID()];
  let index=0;
  const now=new Date("2026-09-19T12:00:00.000Z");
  const service=new CommercialPublicationService({
    store:{
      async publish(input){
        seen.push(input);
        return {
          subscriptionId:input.subscriptionId,
          subscriptionVersion:5,
          transitionId:input.transitionId,
          snapshotId:input.snapshotId,
          snapshotVersion:8,
          subscriptionEventId:input.subscriptionEventId,
          entitlementEventId:input.entitlementEventId,
          auditId:input.auditId,
        };
      },
    },
    ids:{nextId(){return ids[index++];}},
    runtime:{now(){return now;}},
  });
  const source=randomUUID(),target=randomUUID(),subscription=randomUUID(),industry=randomUUID();
  const result=await service.publish({
    requestContext:context(),
    subscriptionId:subscription,
    expectedSubscriptionVersion:4,
    expectedSourcePlanVersionId:source,
    targetPlanVersionId:target,
    effectiveAt:new Date("2026-09-19T11:59:00.000Z"),
    triggerCode:"PLAN_CHANGE_APPLIED",
    sourceFingerprint:"commercial-publication-fingerprint-v1",
    denySet:["z.denied","a.denied"],
    facts:[
      {
        code:"z.feature",valueType:"SET",value:["b","a"],industryContextId:industry,
        sourceType:"PLAN",sourceId:target,effectiveFrom:new Date("2026-09-19T11:59:00.000Z"),
      },
      {
        code:"a.feature",valueType:"BOOLEAN",value:true,
        sourceType:"PLAN",sourceId:target,effectiveFrom:new Date("2026-09-19T11:59:00.000Z"),
      },
    ],
  });
  assert.equal(result.subscriptionVersion,5);
  assert.equal(seen.length,1);
  assert.deepEqual(seen[0].denySet,["a.denied","z.denied"]);
  assert.deepEqual(seen[0].facts.map(f=>f.code),["a.feature","z.feature"]);
  assert.deepEqual(seen[0].facts[1].value,["a","b"]);
  assert.deepEqual(
    [
      seen[0].transitionId,seen[0].snapshotId,seen[0].subscriptionEventId,
      seen[0].entitlementEventId,seen[0].auditId,
    ],
    ids,
  );
});

test("Commercial publication service rejects human scope, future apply and duplicate fact scope",async()=>{
  const base=context();
  const service=new CommercialPublicationService({
    store:{async publish(){throw new Error("must not reach store");}},
    ids:{nextId:randomUUID},
    runtime:{now(){return new Date("2026-09-19T12:00:00.000Z");}},
  });
  const common={
    subscriptionId:randomUUID(),
    expectedSubscriptionVersion:4,
    expectedSourcePlanVersionId:randomUUID(),
    targetPlanVersionId:randomUUID(),
    effectiveAt:new Date("2026-09-19T11:59:00.000Z"),
    triggerCode:"PLAN_CHANGE_APPLIED",
    sourceFingerprint:"commercial-publication-fingerprint-v1",
    denySet:[],
    facts:[],
  };
  await assert.rejects(
    service.publish({requestContext:{...base,principalType:"HUMAN"},...common}),
    error=>error instanceof CommercialPublicationError
      && error.code==="COMMERCIAL_PUBLICATION_SCOPE_INVALID",
  );
  await assert.rejects(
    service.publish({...common,requestContext:base,effectiveAt:new Date("2026-09-20T12:00:00.000Z")}),
    error=>error instanceof CommercialPublicationError
      && error.code==="COMMERCIAL_PUBLICATION_STATE_CONFLICT",
  );
  const duplicate={
    code:"feature.a",valueType:"BOOLEAN",value:true,
    sourceType:"PLAN",sourceId:randomUUID(),
    effectiveFrom:new Date("2026-09-19T11:59:00.000Z"),
  };
  await assert.rejects(
    service.publish({...common,requestContext:base,facts:[duplicate,duplicate]}),
    error=>error instanceof CommercialPublicationError
      && error.code==="COMMERCIAL_PUBLICATION_PAYLOAD_INVALID",
  );
});
