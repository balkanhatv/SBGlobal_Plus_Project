import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  PlanChangeEvidenceError,
  PlanChangeEvidenceService,
} from "../../dist/core/index.js";

function context(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:randomUUID(),
    dataHomeId:randomUUID(),regionCode:"IN-PLAN-EVIDENCE",
    principalId:randomUUID(),principalType:"SERVICE",
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE",
  });
}

test("plan-change evidence service fixes producer ownership and normalizes assessment impacts",async()=>{
  const seen={assessment:[],billing:[],workflow:[],remediation:[]};
  const service=new PlanChangeEvidenceService({
    assessmentStore:{async recordAssessment(input){seen.assessment.push(input.assessment);return input.assessment;}},
    remediationStore:{async recordRemediation(input){seen.remediation.push(input.evidence);return input.evidence;}},
    billingResolutionStore:{async recordResolution(input){seen.billing.push(input.resolution);return input.resolution;}},
    workflowResolutionStore:{async recordResolution(input){seen.workflow.push(input.resolution);return input.resolution;}},
    ids:{nextId:randomUUID},
    runtime:{now(){return new Date("2026-09-20T02:00:00.000Z");}},
  });
  const c=context();
  const assessment=await service.recordAssessment({
    requestContext:c,assessmentVersion:1,subscriptionId:randomUUID(),
    sourcePlanVersionId:randomUUID(),targetPlanVersionId:randomUUID(),
    effectiveTiming:"NEXT_RENEWAL",expectedSubscriptionVersion:4,
    routeClass:"SELF_SERVE",routePolicyId:randomUUID(),routePolicyVersion:2,
    impactReference:"impact:immutable:1",entitlementDiffReference:"entitlement-diff:1",
    blockingImpactCodes:["SEAT_LIMIT","BRANCH_LIMIT"],remediationState:"PENDING",
    sourceFingerprint:"plan-change-source-fingerprint-v1",
  });
  assert.deepEqual(assessment.blockingImpactCodes,["BRANCH_LIMIT","SEAT_LIMIT"]);

  await service.recordRemediationSatisfied({
    requestContext:c,assessmentId:assessment.assessmentId,assessmentVersion:1,
    evidenceVersion:1,evidenceReference:"remediation:evidence:1",
  });
  await service.recordSelfServeResolution({
    requestContext:c,assessmentId:assessment.assessmentId,assessmentVersion:1,
    evidenceVersion:1,resolutionState:"SATISFIED",
    evidenceReference:"billing:payment-or-no-charge:1",
    billingPreviewReference:"billing:preview:1",
    effectiveAt:new Date("2026-10-01T00:00:00.000Z"),
  });
  await service.recordSalesAssistedResolution({
    requestContext:c,assessmentId:randomUUID(),assessmentVersion:1,
    evidenceVersion:1,resolutionState:"REJECTED",evidenceReference:"workflow:decision:1",
  });
  assert.equal(seen.remediation[0].producerModule,"Commercial");
  assert.equal(seen.billing[0].producerModule,"Billing");
  assert.equal(seen.billing[0].routeClass,"SELF_SERVE");
  assert.equal(seen.workflow[0].producerModule,"Workflow");
  assert.equal(seen.workflow[0].routeClass,"SALES_ASSISTED");
});

test("plan-change evidence service rejects unsafe scope and inconsistent authority payloads",async()=>{
  const service=new PlanChangeEvidenceService({
    assessmentStore:{async recordAssessment(input){return input.assessment;}},
    remediationStore:{async recordRemediation(input){return input.evidence;}},
    billingResolutionStore:{async recordResolution(input){return input.resolution;}},
    workflowResolutionStore:{async recordResolution(input){return input.resolution;}},
    ids:{nextId:randomUUID},
    runtime:{now(){return new Date("2026-09-20T02:00:00.000Z");}},
  });
  const c=context();
  const base={
    assessmentVersion:1,subscriptionId:randomUUID(),
    sourcePlanVersionId:randomUUID(),targetPlanVersionId:randomUUID(),
    effectiveTiming:"IMMEDIATE",expectedSubscriptionVersion:1,
    routeClass:"SELF_SERVE",routePolicyId:randomUUID(),routePolicyVersion:1,
    impactReference:"impact:1",entitlementDiffReference:"diff:1",
    blockingImpactCodes:[],remediationState:"NOT_REQUIRED",
    sourceFingerprint:"plan-change-source-fingerprint-v1",
  };
  await assert.rejects(
    service.recordAssessment({requestContext:{...c,principalType:"HUMAN"},...base}),
    e=>e instanceof PlanChangeEvidenceError && e.code==="PLAN_CHANGE_EVIDENCE_SCOPE_INVALID",
  );
  await assert.rejects(
    service.recordAssessment({
      requestContext:c,...base,blockingImpactCodes:["SEAT_LIMIT"],remediationState:"NOT_REQUIRED",
    }),
    e=>e instanceof PlanChangeEvidenceError && e.code==="PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID",
  );
  await assert.rejects(
    service.recordSelfServeResolution({
      requestContext:c,assessmentId:randomUUID(),assessmentVersion:1,evidenceVersion:1,
      resolutionState:"SATISFIED",
    }),
    e=>e instanceof PlanChangeEvidenceError && e.code==="PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID",
  );
});
