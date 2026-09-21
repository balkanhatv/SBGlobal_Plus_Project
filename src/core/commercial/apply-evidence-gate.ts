import type { RequestContext } from "../context/contracts.js";
import type {
  PlanChangeAssessmentRecordV1,
  PlanChangeRemediationEvidenceV1,
  PlanChangeRouteResolutionV1,
} from "./plan-change-evidence.js";

export type CommercialApplyEvidenceGateStatus =
  | "ALLOW_APPLY_GATE"
  | "BLOCK_REMEDIATION_PENDING"
  | "BLOCK_ROUTE_PENDING"
  | "BLOCK_ROUTE_REJECTED"
  | "BLOCK_EFFECTIVE_TIME_PENDING";

export interface CommercialApplyEvidenceBundleV1 {
  readonly assessment:PlanChangeAssessmentRecordV1;
  readonly remediationEvidence?:PlanChangeRemediationEvidenceV1;
  readonly routeResolution?:PlanChangeRouteResolutionV1;
}

export interface CommercialApplyEvidenceGateDecisionV1 {
  readonly status:CommercialApplyEvidenceGateStatus;
  readonly assessmentId:string;
  readonly assessmentVersion:number;
  readonly subscriptionId:string;
  readonly sourcePlanVersionId:string;
  readonly targetPlanVersionId:string;
  readonly routeClass:PlanChangeAssessmentRecordV1["routeClass"];
  readonly sourceFingerprint:string;
  readonly impactReference:string;
  readonly entitlementDiffReference:string;
  readonly remediationState:PlanChangeAssessmentRecordV1["remediationState"];
  readonly routeEvidenceVersion?:number;
  readonly routeEvidenceReference?:string;
  readonly billingPreviewReference?:string;
  readonly remediationEvidenceReference?:string;
  readonly effectiveAt?:Date;
}

export interface CommercialApplyEvidenceStorePort {
  load(input:{
    readonly requestContext:RequestContext;
    readonly assessmentId:string;
    readonly assessmentVersion:number;
    readonly subscriptionId:string;
    readonly expectedSubscriptionVersion:number;
    readonly sourcePlanVersionId:string;
    readonly targetPlanVersionId:string;
    readonly evaluatedAt:Date;
  }):Promise<CommercialApplyEvidenceBundleV1>;
}

export interface CommercialApplyEvidenceRuntimePort {
  now():Date;
}

export type CommercialApplyEvidenceGateErrorCode =
  | "COMMERCIAL_APPLY_EVIDENCE_SCOPE_INVALID"
  | "COMMERCIAL_APPLY_EVIDENCE_INPUT_INVALID"
  | "COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT"
  | "COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE"
  | "COMMERCIAL_APPLY_EVIDENCE_INVALID";

export class CommercialApplyEvidenceGateError extends Error {
  constructor(
    readonly code:CommercialApplyEvidenceGateErrorCode,
    message:string,
  ){
    super(message);
    this.name="CommercialApplyEvidenceGateError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function fail(code:CommercialApplyEvidenceGateErrorCode,message:string):never{
  throw new CommercialApplyEvidenceGateError(code,message);
}
function uuid(value:unknown,label:string):string{
  if(typeof value!=="string" || !UUID.test(value)){
    fail("COMMERCIAL_APPLY_EVIDENCE_INPUT_INVALID","Invalid "+label+".");
  }
  return value.toLowerCase();
}
function positive(value:unknown,label:string):number{
  if(!Number.isSafeInteger(value) || Number(value)<=0){
    fail("COMMERCIAL_APPLY_EVIDENCE_INPUT_INVALID","Invalid "+label+".");
  }
  return Number(value);
}
function date(value:unknown,label:string):Date{
  if(!(value instanceof Date) || Number.isNaN(value.getTime())){
    fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Invalid "+label+".");
  }
  return new Date(value.getTime());
}
function reference(value:unknown,label:string):string{
  if(typeof value!=="string" || value.length===0 || value.length>512){
    fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Invalid "+label+".");
  }
  return value;
}
function fingerprint(value:unknown,label="sourceFingerprint"):string{
  if(typeof value!=="string" || value.length<16 || value.length>512){
    fail("COMMERCIAL_APPLY_EVIDENCE_INPUT_INVALID","Invalid "+label+".");
  }
  return value;
}
function assertContext(context:RequestContext):void{
  if(context.scopeClass!=="TENANT_CORE" || context.industryContextId
    || !context.tenantId || !context.principalId || context.principalType!=="SERVICE"
    || !context.dataHomeId || !context.regionCode){
    fail(
      "COMMERCIAL_APPLY_EVIDENCE_SCOPE_INVALID",
      "Commercial apply-evidence gate requires a resolved Tenant Core service context.",
    );
  }
}
function exactDate(value:Date,label:string):Date{
  return date(value,label);
}
function impactCodes(values:readonly string[]):readonly string[]{
  if(!Array.isArray(values) || values.length>64){
    fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Persisted blocking impact set exceeds v1 bounds.");
  }
  const normalized=values.map((value,index)=>{
    if(typeof value!=="string" || value.length===0 || value.length>128 || !CODE.test(value)){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Invalid persisted blockingImpactCodes["+index+"].");
    }
    return value;
  });
  if(new Set(normalized).size!==normalized.length){
    fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Persisted blocking impact codes contain duplicates.");
  }
  return Object.freeze([...normalized].sort());
}
function baseDecision(
  assessment:PlanChangeAssessmentRecordV1,
  status:CommercialApplyEvidenceGateStatus,
  extras:Partial<CommercialApplyEvidenceGateDecisionV1>={},
):CommercialApplyEvidenceGateDecisionV1{
  return Object.freeze({
    status,
    assessmentId:assessment.assessmentId,
    assessmentVersion:assessment.assessmentVersion,
    subscriptionId:assessment.subscriptionId,
    sourcePlanVersionId:assessment.sourcePlanVersionId,
    targetPlanVersionId:assessment.targetPlanVersionId,
    routeClass:assessment.routeClass,
    sourceFingerprint:assessment.sourceFingerprint,
    impactReference:assessment.impactReference,
    entitlementDiffReference:assessment.entitlementDiffReference,
    remediationState:assessment.remediationState,
    ...extras,
  });
}

export class CommercialApplyEvidenceGateService {
  constructor(private readonly ports:{
    readonly store:CommercialApplyEvidenceStorePort;
    readonly runtime:CommercialApplyEvidenceRuntimePort;
  }){}

  async evaluate(input:{
    readonly requestContext:RequestContext;
    readonly assessmentId:string;
    readonly assessmentVersion:number;
    readonly subscriptionId:string;
    readonly expectedSubscriptionVersion:number;
    readonly sourcePlanVersionId:string;
    readonly targetPlanVersionId:string;
    readonly sourceFingerprint:string;
  }):Promise<CommercialApplyEvidenceGateDecisionV1>{
    assertContext(input.requestContext);
    const assessmentId=uuid(input.assessmentId,"assessmentId");
    const assessmentVersion=positive(input.assessmentVersion,"assessmentVersion");
    const subscriptionId=uuid(input.subscriptionId,"subscriptionId");
    const sourcePlanVersionId=uuid(input.sourcePlanVersionId,"sourcePlanVersionId");
    const targetPlanVersionId=uuid(input.targetPlanVersionId,"targetPlanVersionId");
    if(sourcePlanVersionId===targetPlanVersionId){
      fail("COMMERCIAL_APPLY_EVIDENCE_INPUT_INVALID","Target PlanVersion must differ from source PlanVersion.");
    }
    const expectedSubscriptionVersion=positive(
      input.expectedSubscriptionVersion,
      "expectedSubscriptionVersion",
    );
    const expectedFingerprint=fingerprint(input.sourceFingerprint);
    const evaluatedAt=date(this.ports.runtime.now(),"gate evaluation time");

    const bundle=await this.ports.store.load({
      requestContext:input.requestContext,
      assessmentId,
      assessmentVersion,
      subscriptionId,
      expectedSubscriptionVersion,
      sourcePlanVersionId,
      targetPlanVersionId,
      evaluatedAt,
    });
    if(!bundle || typeof bundle!=="object" || !bundle.assessment){
      fail("COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE","Persisted plan-change assessment is unavailable.");
    }

    const assessment=bundle.assessment;
    if(assessment.tenantId!==input.requestContext.tenantId
      || assessment.assessmentId!==assessmentId
      || assessment.assessmentVersion!==assessmentVersion
      || assessment.subscriptionId!==subscriptionId
      || assessment.sourcePlanVersionId!==sourcePlanVersionId
      || assessment.targetPlanVersionId!==targetPlanVersionId
      || assessment.expectedSubscriptionVersion!==expectedSubscriptionVersion){
      fail("COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT","Persisted assessment binding is stale or mismatched.");
    }
    if(assessment.routeClass!=="SELF_SERVE" && assessment.routeClass!=="SALES_ASSISTED"){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Persisted assessment routeClass is invalid.");
    }
    if(assessment.effectiveTiming!=="IMMEDIATE" && assessment.effectiveTiming!=="NEXT_RENEWAL"){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Persisted assessment effectiveTiming is invalid.");
    }
    uuid(assessment.routePolicyId,"persisted routePolicyId");
    positive(assessment.routePolicyVersion,"persisted routePolicyVersion");
    reference(assessment.impactReference,"persisted impactReference");
    reference(assessment.entitlementDiffReference,"persisted entitlementDiffReference");
    const blockers=impactCodes(assessment.blockingImpactCodes);
    fingerprint(assessment.sourceFingerprint,"persisted sourceFingerprint");
    exactDate(assessment.createdAt,"persisted assessment createdAt");
    if(assessment.sourceFingerprint!==expectedFingerprint){
      fail("COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT","Assessment source fingerprint does not match current compiler evidence.");
    }

    if((blockers.length>0 && assessment.remediationState!=="PENDING")
      || (blockers.length===0 && assessment.remediationState==="PENDING")){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Persisted assessment remediation state contradicts blocking impacts.");
    }

    let remediationEvidenceReference:string|undefined;
    if(assessment.remediationState==="PENDING" || blockers.length>0){
      return baseDecision(assessment,"BLOCK_REMEDIATION_PENDING");
    }
    if(assessment.remediationState==="SATISFIED"){
      if(assessmentVersion<=1 || !bundle.remediationEvidence){
        fail(
          "COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE",
          "SATISFIED assessment lacks prior Commercial remediation evidence.",
        );
      }
      const evidence=bundle.remediationEvidence;
      if(evidence.tenantId!==assessment.tenantId
        || evidence.assessmentId!==assessmentId
        || evidence.assessmentVersion!==assessmentVersion-1
        || evidence.remediationState!=="SATISFIED"
        || evidence.producerModule!=="Commercial"
        || !Number.isSafeInteger(evidence.evidenceVersion) || evidence.evidenceVersion<=0){
        fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Remediation evidence binding is invalid.");
      }
      remediationEvidenceReference=reference(
        evidence.evidenceReference,
        "remediation evidenceReference",
      );
      exactDate(evidence.resolvedAt,"remediation resolvedAt");
      exactDate(evidence.createdAt,"remediation createdAt");
    }else if(assessment.remediationState!=="NOT_REQUIRED"){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Persisted remediation state is invalid.");
    }

    const route=bundle.routeResolution;
    if(!route){
      return baseDecision(assessment,"BLOCK_ROUTE_PENDING",{
        ...(remediationEvidenceReference?{remediationEvidenceReference}:{}),
      });
    }
    if(route.tenantId!==assessment.tenantId
      || route.assessmentId!==assessmentId
      || route.assessmentVersion!==assessmentVersion
      || route.routeClass!==assessment.routeClass
      || !Number.isSafeInteger(route.evidenceVersion) || route.evidenceVersion<=0){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Route-resolution evidence binding is invalid.");
    }
    const expectedProducer=assessment.routeClass==="SELF_SERVE" ? "Billing" : "Workflow";
    if(route.producerModule!==expectedProducer){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Route-resolution producer does not match governed route.");
    }
    exactDate(route.createdAt,"route createdAt");
    if(assessment.routeClass==="SALES_ASSISTED" && route.billingPreviewReference!==undefined){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Sales-assisted route cannot carry Billing preview authority.");
    }

    if(route.resolutionState==="PENDING"){
      return baseDecision(assessment,"BLOCK_ROUTE_PENDING",{
        routeEvidenceVersion:route.evidenceVersion,
        ...(remediationEvidenceReference?{remediationEvidenceReference}:{}),
      });
    }
    if(route.resolutionState==="REJECTED"){
      const evidenceReference=reference(route.evidenceReference,"rejected route evidenceReference");
      exactDate(route.resolvedAt,"rejected route resolvedAt");
      return baseDecision(assessment,"BLOCK_ROUTE_REJECTED",{
        routeEvidenceVersion:route.evidenceVersion,
        routeEvidenceReference:evidenceReference,
        ...(remediationEvidenceReference?{remediationEvidenceReference}:{}),
      });
    }
    if(route.resolutionState!=="SATISFIED"){
      fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Route-resolution state is invalid.");
    }

    const routeEvidenceReference=reference(route.evidenceReference,"route evidenceReference");
    exactDate(route.resolvedAt,"route resolvedAt");
    const billingPreviewReference=route.billingPreviewReference===undefined
      ? undefined : reference(route.billingPreviewReference,"billingPreviewReference");

    if(assessment.effectiveTiming==="NEXT_RENEWAL"){
      if(!route.effectiveAt){
        fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","NEXT_RENEWAL SATISFIED evidence lacks effectiveAt.");
      }
      const effectiveAt=date(route.effectiveAt,"route effectiveAt");
      if(effectiveAt.getTime()<assessment.createdAt.getTime()){
        fail("COMMERCIAL_APPLY_EVIDENCE_INVALID","Route effectiveAt predates assessment.");
      }
      if(effectiveAt.getTime()>evaluatedAt.getTime()){
        return baseDecision(assessment,"BLOCK_EFFECTIVE_TIME_PENDING",{
          routeEvidenceVersion:route.evidenceVersion,
          routeEvidenceReference,
          ...(billingPreviewReference?{billingPreviewReference}:{}),
          ...(remediationEvidenceReference?{remediationEvidenceReference}:{}),
          effectiveAt,
        });
      }
      return baseDecision(assessment,"ALLOW_APPLY_GATE",{
        routeEvidenceVersion:route.evidenceVersion,
        routeEvidenceReference,
        ...(billingPreviewReference?{billingPreviewReference}:{}),
        ...(remediationEvidenceReference?{remediationEvidenceReference}:{}),
        effectiveAt,
      });
    }

    return baseDecision(assessment,"ALLOW_APPLY_GATE",{
      routeEvidenceVersion:route.evidenceVersion,
      routeEvidenceReference,
      ...(billingPreviewReference?{billingPreviewReference}:{}),
      ...(remediationEvidenceReference?{remediationEvidenceReference}:{}),
    });
  }
}
