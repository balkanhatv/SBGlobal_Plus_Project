import type { RequestContext } from "../context/contracts.js";
import type { CommercialPreparedInitialAssessmentV1 } from "./assessment-preparation.js";
import type {
  PlanChangeAssessmentRecordV1,
  PlanChangeEvidenceService,
} from "./plan-change-evidence.js";

export type CommercialAssessmentPersistenceErrorCode =
  | "COMMERCIAL_ASSESSMENT_PERSISTENCE_SCOPE_INVALID"
  | "COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID"
  | "COMMERCIAL_ASSESSMENT_PERSISTENCE_PERSISTED_MISMATCH";

export class CommercialAssessmentPersistenceError extends Error {
  constructor(
    readonly code:CommercialAssessmentPersistenceErrorCode,
    message:string,
  ){
    super(message);
    this.name="CommercialAssessmentPersistenceError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMPACT=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const MAX_IMPACTS=64;

function fail(code:CommercialAssessmentPersistenceErrorCode,message:string):never{
  throw new CommercialAssessmentPersistenceError(code,message);
}
function uuid(value:unknown,label:string):string{
  if(typeof value!=="string" || !UUID.test(value)){
    fail("COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID","Invalid "+label+".");
  }
  return value.toLowerCase();
}
function positive(value:unknown,label:string):number{
  if(!Number.isSafeInteger(value) || Number(value)<=0){
    fail("COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID","Invalid "+label+".");
  }
  return Number(value);
}
function reference(value:unknown,label:string):string{
  if(typeof value!=="string" || value.length===0 || value.length>512){
    fail("COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID","Invalid "+label+".");
  }
  return value;
}
function fingerprint(value:unknown):string{
  if(typeof value!=="string" || value.length<16 || value.length>512){
    fail("COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID","Invalid sourceFingerprint.");
  }
  return value;
}
function blockers(value:unknown):readonly string[]{
  if(!Array.isArray(value) || value.length>MAX_IMPACTS){
    fail("COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID","Invalid blockingImpactCodes.");
  }
  const normalized=value.map((item,index)=>{
    if(typeof item!=="string" || item.length===0 || item.length>128 || !IMPACT.test(item)){
      fail(
        "COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID",
        "Invalid blockingImpactCodes["+index+"].",
      );
    }
    return item;
  });
  if(new Set(normalized).size!==normalized.length){
    fail(
      "COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID",
      "blockingImpactCodes contains duplicates.",
    );
  }
  const sorted=[...normalized].sort();
  if(sorted.some((item,index)=>item!==normalized[index])){
    fail(
      "COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID",
      "Prepared blockingImpactCodes must retain DD-076 deterministic ordering.",
    );
  }
  return Object.freeze(sorted);
}
function assertContext(context:RequestContext):void{
  if(context.scopeClass!=="TENANT_CORE" || context.industryContextId
    || !context.tenantId || !context.principalId || context.principalType!=="SERVICE"
    || !context.dataHomeId || !context.regionCode){
    fail(
      "COMMERCIAL_ASSESSMENT_PERSISTENCE_SCOPE_INVALID",
      "Initial assessment persistence requires a resolved Tenant Core service context.",
    );
  }
}
function normalizePrepared(raw:CommercialPreparedInitialAssessmentV1):
  CommercialPreparedInitialAssessmentV1{
  if(!raw || typeof raw!=="object" || raw.assessmentVersion!==1){
    fail(
      "COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID",
      "Only a DD-076 version-1 prepared assessment may be persisted.",
    );
  }
  const subscriptionId=uuid(raw.subscriptionId,"subscriptionId");
  const sourcePlanVersionId=uuid(raw.sourcePlanVersionId,"sourcePlanVersionId");
  const targetPlanVersionId=uuid(raw.targetPlanVersionId,"targetPlanVersionId");
  if(sourcePlanVersionId===targetPlanVersionId){
    fail(
      "COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID",
      "Target PlanVersion must differ from source PlanVersion.",
    );
  }
  if(raw.effectiveTiming!=="IMMEDIATE" && raw.effectiveTiming!=="NEXT_RENEWAL"){
    fail("COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID","Invalid effectiveTiming.");
  }
  if(raw.routeClass!=="SELF_SERVE" && raw.routeClass!=="SALES_ASSISTED"){
    fail("COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID","Invalid routeClass.");
  }
  const normalizedBlockers=blockers(raw.blockingImpactCodes);
  const remediationState=raw.remediationState;
  if((normalizedBlockers.length===0 && remediationState!=="NOT_REQUIRED")
    || (normalizedBlockers.length>0 && remediationState!=="PENDING")){
    fail(
      "COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID",
      "Prepared remediation state contradicts DD-076 blocker semantics.",
    );
  }
  return Object.freeze({
    assessmentVersion:1,
    subscriptionId,
    sourcePlanVersionId,
    targetPlanVersionId,
    effectiveTiming:raw.effectiveTiming,
    expectedSubscriptionVersion:positive(
      raw.expectedSubscriptionVersion,
      "expectedSubscriptionVersion",
    ),
    routeClass:raw.routeClass,
    routePolicyId:uuid(raw.routePolicyId,"routePolicyId"),
    routePolicyVersion:positive(raw.routePolicyVersion,"routePolicyVersion"),
    impactReference:reference(raw.impactReference,"impactReference"),
    entitlementDiffReference:reference(
      raw.entitlementDiffReference,
      "entitlementDiffReference",
    ),
    blockingImpactCodes:normalizedBlockers,
    remediationState,
    sourceFingerprint:fingerprint(raw.sourceFingerprint),
  });
}

function sameArray(left:readonly string[],right:readonly string[]):boolean{
  return left.length===right.length && left.every((value,index)=>value===right[index]);
}
function assertPersisted(
  record:PlanChangeAssessmentRecordV1,
  prepared:CommercialPreparedInitialAssessmentV1,
  context:RequestContext,
):PlanChangeAssessmentRecordV1{
  if(!record || typeof record!=="object"
    || typeof record.assessmentId!=="string" || !UUID.test(record.assessmentId)
    || record.tenantId!==context.tenantId
    || record.correlationId!==context.correlationId
    || record.assessmentVersion!==1
    || record.subscriptionId!==prepared.subscriptionId
    || record.sourcePlanVersionId!==prepared.sourcePlanVersionId
    || record.targetPlanVersionId!==prepared.targetPlanVersionId
    || record.effectiveTiming!==prepared.effectiveTiming
    || record.expectedSubscriptionVersion!==prepared.expectedSubscriptionVersion
    || record.routeClass!==prepared.routeClass
    || record.routePolicyId!==prepared.routePolicyId
    || record.routePolicyVersion!==prepared.routePolicyVersion
    || record.impactReference!==prepared.impactReference
    || record.entitlementDiffReference!==prepared.entitlementDiffReference
    || !Array.isArray(record.blockingImpactCodes)
    || !sameArray(record.blockingImpactCodes,prepared.blockingImpactCodes)
    || record.remediationState!==prepared.remediationState
    || record.sourceFingerprint!==prepared.sourceFingerprint
    || !(record.createdAt instanceof Date)
    || Number.isNaN(record.createdAt.getTime())){
    fail(
      "COMMERCIAL_ASSESSMENT_PERSISTENCE_PERSISTED_MISMATCH",
      "Persisted DD-066 assessment drifted from the prepared DD-076 binding.",
    );
  }

  return Object.freeze({
    assessmentId:record.assessmentId.toLowerCase(),
    assessmentVersion:1,
    tenantId:record.tenantId,
    subscriptionId:record.subscriptionId,
    sourcePlanVersionId:record.sourcePlanVersionId,
    targetPlanVersionId:record.targetPlanVersionId,
    effectiveTiming:record.effectiveTiming,
    expectedSubscriptionVersion:record.expectedSubscriptionVersion,
    routeClass:record.routeClass,
    routePolicyId:record.routePolicyId,
    routePolicyVersion:record.routePolicyVersion,
    impactReference:record.impactReference,
    entitlementDiffReference:record.entitlementDiffReference,
    blockingImpactCodes:Object.freeze([...record.blockingImpactCodes]),
    remediationState:record.remediationState,
    sourceFingerprint:record.sourceFingerprint,
    correlationId:record.correlationId,
    createdAt:new Date(record.createdAt.getTime()),
  });
}

export class CommercialInitialAssessmentPersistenceService {
  constructor(
    private readonly recorder:Pick<PlanChangeEvidenceService,"recordAssessment">,
  ){}

  async persist(input:{
    readonly requestContext:RequestContext;
    readonly prepared:CommercialPreparedInitialAssessmentV1;
  }):Promise<PlanChangeAssessmentRecordV1>{
    assertContext(input.requestContext);
    const prepared=normalizePrepared(input.prepared);
    const record=await this.recorder.recordAssessment({
      requestContext:input.requestContext,
      assessmentVersion:1,
      subscriptionId:prepared.subscriptionId,
      sourcePlanVersionId:prepared.sourcePlanVersionId,
      targetPlanVersionId:prepared.targetPlanVersionId,
      effectiveTiming:prepared.effectiveTiming,
      expectedSubscriptionVersion:prepared.expectedSubscriptionVersion,
      routeClass:prepared.routeClass,
      routePolicyId:prepared.routePolicyId,
      routePolicyVersion:prepared.routePolicyVersion,
      impactReference:prepared.impactReference,
      entitlementDiffReference:prepared.entitlementDiffReference,
      blockingImpactCodes:prepared.blockingImpactCodes,
      remediationState:prepared.remediationState,
      sourceFingerprint:prepared.sourceFingerprint,
    });
    return assertPersisted(record,prepared,input.requestContext);
  }
}
