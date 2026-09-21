import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialApplyEvidenceGateError,
  CommercialApplyEvidenceGateService,
} from "../../dist/core/index.js";

const id=()=>randomUUID().toLowerCase();
const now=new Date("2026-09-21T06:45:00.000Z");
function context(overrides={}){
  return {
    requestId:id(),correlationId:id(),tenantId:id(),dataHomeId:id(),regionCode:"IN-CENTRAL",
    principalId:id(),principalType:"SERVICE",orgUnitPath:[],roleIds:[],scopeClass:"TENANT_CORE",
    ...overrides,
  };
}
function assessment(binding,overrides={}){
  return {
    assessmentId:binding.assessmentId,
    assessmentVersion:binding.assessmentVersion,
    tenantId:binding.requestContext.tenantId,
    subscriptionId:binding.subscriptionId,
    sourcePlanVersionId:binding.sourcePlanVersionId,
    targetPlanVersionId:binding.targetPlanVersionId,
    effectiveTiming:"IMMEDIATE",
    expectedSubscriptionVersion:binding.expectedSubscriptionVersion,
    routeClass:"SELF_SERVE",
    routePolicyId:id(),
    routePolicyVersion:1,
    impactReference:"impact:server:1",
    entitlementDiffReference:"diff:server:1",
    blockingImpactCodes:[],
    remediationState:"NOT_REQUIRED",
    sourceFingerprint:binding.sourceFingerprint,
    correlationId:binding.requestContext.correlationId,
    createdAt:new Date(now.getTime()-60_000),
    ...overrides,
  };
}
function route(a,overrides={}){
  return {
    id:id(),tenantId:a.tenantId,assessmentId:a.assessmentId,
    assessmentVersion:a.assessmentVersion,routeClass:a.routeClass,
    resolutionState:"SATISFIED",evidenceReference:"route:evidence:1",
    producerModule:a.routeClass==="SELF_SERVE"?"Billing":"Workflow",
    evidenceVersion:1,resolvedAt:new Date(now.getTime()-10_000),
    correlationId:a.correlationId,createdAt:new Date(now.getTime()-20_000),
    ...overrides,
  };
}
function binding(overrides={}){
  const requestContext=context();
  return {
    requestContext,assessmentId:id(),assessmentVersion:1,subscriptionId:id(),
    expectedSubscriptionVersion:4,sourcePlanVersionId:id(),targetPlanVersionId:id(),
    sourceFingerprint:"0123456789abcdef0123456789abcdef",
    ...overrides,
  };
}
function serviceFor(bundle){
  return new CommercialApplyEvidenceGateService({
    store:{load:async()=>bundle},
    runtime:{now:()=>new Date(now)},
  });
}

test("ready immediate SELF_SERVE evidence allows internal apply gate",async()=>{
  const b=binding(),a=assessment(b),r=route(a,{billingPreviewReference:"billing:preview:1"});
  const result=await serviceFor({assessment:a,routeResolution:r}).evaluate(b);
  assert.equal(result.status,"ALLOW_APPLY_GATE");
  assert.equal(result.routeEvidenceReference,"route:evidence:1");
  assert.equal(result.billingPreviewReference,"billing:preview:1");
  assert.equal(result.effectiveAt,undefined);
});

test("pending remediation blocks before route evidence is considered",async()=>{
  const b=binding(),a=assessment(b,{
    blockingImpactCodes:["SEAT_LIMIT"],remediationState:"PENDING",
  });
  const result=await serviceFor({assessment:a,routeResolution:route(a)}).evaluate(b);
  assert.equal(result.status,"BLOCK_REMEDIATION_PENDING");
});

test("missing or pending route stays blocked; rejected route is explicit",async()=>{
  const b=binding(),a=assessment(b);
  assert.equal((await serviceFor({assessment:a}).evaluate(b)).status,"BLOCK_ROUTE_PENDING");
  assert.equal((await serviceFor({
    assessment:a,routeResolution:route(a,{resolutionState:"PENDING",evidenceReference:undefined,resolvedAt:undefined}),
  }).evaluate(b)).status,"BLOCK_ROUTE_PENDING");
  assert.equal((await serviceFor({
    assessment:a,routeResolution:route(a,{resolutionState:"REJECTED",evidenceReference:"billing:rejected:1"}),
  }).evaluate(b)).status,"BLOCK_ROUTE_REJECTED");
});

test("NEXT_RENEWAL waits for server-owned effectiveAt, then allows",async()=>{
  const b=binding(),a=assessment(b,{effectiveTiming:"NEXT_RENEWAL"});
  const future=new Date(now.getTime()+60_000);
  const pending=await serviceFor({
    assessment:a,routeResolution:route(a,{effectiveAt:future}),
  }).evaluate(b);
  assert.equal(pending.status,"BLOCK_EFFECTIVE_TIME_PENDING");
  assert.equal(pending.effectiveAt.toISOString(),future.toISOString());

  const past=new Date(now.getTime()-1_000);
  const ready=await serviceFor({
    assessment:a,routeResolution:route(a,{effectiveAt:past}),
  }).evaluate(b);
  assert.equal(ready.status,"ALLOW_APPLY_GATE");
  assert.equal(ready.effectiveAt.toISOString(),past.toISOString());
});

test("SATISFIED remediation requires prior Commercial evidence bound to previous assessment",async()=>{
  const b=binding({assessmentVersion:2});
  const a=assessment(b,{remediationState:"SATISFIED"});
  await assert.rejects(
    ()=>serviceFor({assessment:a,routeResolution:route(a)}).evaluate(b),
    e=>e instanceof CommercialApplyEvidenceGateError
      && e.code==="COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE",
  );
  const remediationEvidence={
    id:id(),tenantId:a.tenantId,assessmentId:a.assessmentId,assessmentVersion:1,
    evidenceVersion:1,remediationState:"SATISFIED",evidenceReference:"commercial:remediation:1",
    producerModule:"Commercial",correlationId:a.correlationId,
    resolvedAt:new Date(now.getTime()-30_000),createdAt:new Date(now.getTime()-40_000),
  };
  const ready=await serviceFor({
    assessment:a,remediationEvidence,routeResolution:route(a),
  }).evaluate(b);
  assert.equal(ready.status,"ALLOW_APPLY_GATE");
  assert.equal(ready.remediationEvidenceReference,"commercial:remediation:1");
});

test("source fingerprint and assessment binding mismatch fail closed",async()=>{
  const b=binding(),a=assessment(b);
  await assert.rejects(
    ()=>serviceFor({assessment:a,routeResolution:route(a)}).evaluate({...b,sourceFingerprint:"fedcba9876543210fedcba9876543210"}),
    e=>e instanceof CommercialApplyEvidenceGateError
      && e.code==="COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT",
  );
  await assert.rejects(
    ()=>serviceFor({assessment:{...a,targetPlanVersionId:id()},routeResolution:route(a)}).evaluate(b),
    e=>e instanceof CommercialApplyEvidenceGateError
      && e.code==="COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT",
  );
});

test("route producer/binding tampering fails closed",async()=>{
  const b=binding(),a=assessment(b);
  for(const bad of [
    route(a,{producerModule:"Workflow"}),
    route(a,{assessmentVersion:2}),
    route(a,{routeClass:"SALES_ASSISTED"}),
  ]){
    await assert.rejects(
      ()=>serviceFor({assessment:a,routeResolution:bad}).evaluate(b),
      e=>e instanceof CommercialApplyEvidenceGateError
        && e.code==="COMMERCIAL_APPLY_EVIDENCE_INVALID",
    );
  }
});

test("SALES_ASSISTED route requires Workflow and forbids Billing preview",async()=>{
  const b=binding(),a=assessment(b,{routeClass:"SALES_ASSISTED"});
  const ready=await serviceFor({
    assessment:a,routeResolution:route(a,{producerModule:"Workflow"}),
  }).evaluate(b);
  assert.equal(ready.status,"ALLOW_APPLY_GATE");
  await assert.rejects(
    ()=>serviceFor({
      assessment:a,
      routeResolution:route(a,{producerModule:"Workflow",billingPreviewReference:"forbidden"}),
    }).evaluate(b),
    e=>e instanceof CommercialApplyEvidenceGateError
      && e.code==="COMMERCIAL_APPLY_EVIDENCE_INVALID",
  );
});

test("NEXT_RENEWAL satisfied evidence without effectiveAt fails closed",async()=>{
  const b=binding(),a=assessment(b,{effectiveTiming:"NEXT_RENEWAL"});
  await assert.rejects(
    ()=>serviceFor({assessment:a,routeResolution:route(a)}).evaluate(b),
    e=>e instanceof CommercialApplyEvidenceGateError
      && e.code==="COMMERCIAL_APPLY_EVIDENCE_INVALID",
  );
});

test("HUMAN and Industry-scoped contexts cannot reach the store",async()=>{
  for(const requestContext of [
    context({principalType:"HUMAN"}),
    context({scopeClass:"TENANT_INDUSTRY",industryContextId:id()}),
  ]){
    let calls=0;
    const b=binding({requestContext});
    const service=new CommercialApplyEvidenceGateService({
      store:{load:async()=>{calls++;throw new Error("unexpected");}},
      runtime:{now:()=>new Date(now)},
    });
    await assert.rejects(
      ()=>service.evaluate(b),
      e=>e instanceof CommercialApplyEvidenceGateError
        && e.code==="COMMERCIAL_APPLY_EVIDENCE_SCOPE_INVALID",
    );
    assert.equal(calls,0);
  }
});

test("decision output is immutable and preserves opaque evidence only",async()=>{
  const b=binding(),a=assessment(b),r=route(a);
  const result=await serviceFor({assessment:a,routeResolution:r}).evaluate(b);
  assert.ok(Object.isFrozen(result));
  assert.equal(result.impactReference,"impact:server:1");
  assert.equal(result.entitlementDiffReference,"diff:server:1");
  assert.equal(result.sourceFingerprint,b.sourceFingerprint);
});
