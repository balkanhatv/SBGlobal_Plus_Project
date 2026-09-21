import type { RequestContext } from "../context/contracts.js";
import type {
  PlanChangeEffectiveTiming,
  PlanChangeRemediationState,
  PlanChangeRouteClass,
} from "./plan-change-evidence.js";
import type { CommercialFinalTargetPreviewV1 } from "./target-preview.js";

export interface CommercialInitialAssessmentEvaluationV1 {
  readonly targetPlanVersionId:string;
  readonly routeClass:PlanChangeRouteClass;
  readonly routePolicyId:string;
  readonly routePolicyVersion:number;
  readonly impactReference:string;
  readonly entitlementDiffReference:string;
  readonly blockingImpactCodes:readonly string[];
  readonly sourceFingerprint:string;
}

export interface CommercialPreparedInitialAssessmentV1 {
  readonly assessmentVersion:1;
  readonly subscriptionId:string;
  readonly sourcePlanVersionId:string;
  readonly targetPlanVersionId:string;
  readonly effectiveTiming:PlanChangeEffectiveTiming;
  readonly expectedSubscriptionVersion:number;
  readonly routeClass:PlanChangeRouteClass;
  readonly routePolicyId:string;
  readonly routePolicyVersion:number;
  readonly impactReference:string;
  readonly entitlementDiffReference:string;
  readonly blockingImpactCodes:readonly string[];
  readonly remediationState:Extract<PlanChangeRemediationState,"NOT_REQUIRED"|"PENDING">;
  readonly sourceFingerprint:string;
}

export interface CommercialInitialAssessmentEvaluatorPort {
  evaluate(input:{
    readonly requestContext:RequestContext;
    readonly subscriptionId:string;
    readonly sourcePlanVersionId:string;
    readonly targetPlanVersionId:string;
    readonly expectedSubscriptionVersion:number;
    readonly effectiveTiming:PlanChangeEffectiveTiming;
    readonly finalPreview:CommercialFinalTargetPreviewV1;
  }):Promise<CommercialInitialAssessmentEvaluationV1>;
}

export type CommercialAssessmentPreparationErrorCode =
  | "COMMERCIAL_ASSESSMENT_PREPARATION_SCOPE_INVALID"
  | "COMMERCIAL_ASSESSMENT_PREPARATION_INPUT_INVALID"
  | "COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID"
  | "COMMERCIAL_ASSESSMENT_PREPARATION_TARGET_MISMATCH"
  | "COMMERCIAL_ASSESSMENT_PREPARATION_USAGE_BLOCKER_MISSING";

export class CommercialAssessmentPreparationError extends Error {
  constructor(
    readonly code:CommercialAssessmentPreparationErrorCode,
    message:string,
  ){
    super(message);
    this.name="CommercialAssessmentPreparationError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMPACT=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const MAX_IMPACTS=64;

function fail(code:CommercialAssessmentPreparationErrorCode,message:string):never{
  throw new CommercialAssessmentPreparationError(code,message);
}
function uuid(
  value:unknown,
  label:string,
  errorCode:CommercialAssessmentPreparationErrorCode="COMMERCIAL_ASSESSMENT_PREPARATION_INPUT_INVALID",
):string{
  if(typeof value!=="string" || !UUID.test(value)){
    fail(errorCode,"Invalid "+label+".");
  }
  return value.toLowerCase();
}
function positive(
  value:unknown,
  label:string,
  errorCode:CommercialAssessmentPreparationErrorCode="COMMERCIAL_ASSESSMENT_PREPARATION_INPUT_INVALID",
):number{
  if(!Number.isSafeInteger(value) || Number(value)<=0){
    fail(errorCode,"Invalid "+label+".");
  }
  return Number(value);
}
function reference(value:unknown,label:string):string{
  if(typeof value!=="string" || value.length===0 || value.length>512){
    fail("COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID","Invalid "+label+".");
  }
  return value;
}
function fingerprint(value:unknown):string{
  if(typeof value!=="string" || value.length<16 || value.length>512){
    fail("COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID","Invalid sourceFingerprint.");
  }
  return value;
}
function effectiveTiming(value:unknown):PlanChangeEffectiveTiming{
  if(value!=="IMMEDIATE" && value!=="NEXT_RENEWAL"){
    fail("COMMERCIAL_ASSESSMENT_PREPARATION_INPUT_INVALID","Invalid effectiveTiming.");
  }
  return value;
}
function routeClass(value:unknown):PlanChangeRouteClass{
  if(value!=="SELF_SERVE" && value!=="SALES_ASSISTED"){
    fail("COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID","Invalid routeClass.");
  }
  return value;
}
function blockers(value:unknown):readonly string[]{
  if(!Array.isArray(value) || value.length>MAX_IMPACTS){
    fail("COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID","Blocking impact set exceeds v1 bounds.");
  }
  const output=value.map((item,index)=>{
    if(typeof item!=="string" || item.length===0 || item.length>128 || !IMPACT.test(item)){
      fail("COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID","Invalid blockingImpactCodes["+index+"].");
    }
    return item;
  });
  if(new Set(output).size!==output.length){
    fail("COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID","Blocking impact codes contain duplicates.");
  }
  return Object.freeze([...output].sort());
}
function assertContext(context:RequestContext):void{
  if(context.scopeClass!=="TENANT_CORE" || context.industryContextId
    || !context.tenantId || !context.principalId || context.principalType!=="SERVICE"
    || !context.dataHomeId || !context.regionCode){
    fail(
      "COMMERCIAL_ASSESSMENT_PREPARATION_SCOPE_INVALID",
      "Initial plan-change assessment preparation requires a resolved Tenant Core service context.",
    );
  }
}
function assertPreview(
  preview:CommercialFinalTargetPreviewV1,
  targetPlanVersionId:string,
):void{
  if(!preview || typeof preview!=="object"
    || preview.targetPlanVersionId!==targetPlanVersionId
    || !Array.isArray(preview.entitlements)
    || !Array.isArray(preview.limits)
    || !Array.isArray(preview.tenantDenySet)
    || !Array.isArray(preview.appliedRestrictions)
    || !preview.usageImpact
    || preview.usageImpact.targetPlanVersionId!==targetPlanVersionId
    || typeof preview.usageImpact.hasBlockingUsage!=="boolean"
    || !preview.lifecycle
    || preview.lifecycle.dataPreservationRequired!==true){
    fail(
      "COMMERCIAL_ASSESSMENT_PREPARATION_TARGET_MISMATCH",
      "DD-075 final preview is missing or bound to a different target PlanVersion.",
    );
  }
}

function normalizeEvaluation(
  raw:CommercialInitialAssessmentEvaluationV1,
  targetPlanVersionId:string,
  preview:CommercialFinalTargetPreviewV1,
):Omit<CommercialPreparedInitialAssessmentV1,
  "assessmentVersion"|"subscriptionId"|"sourcePlanVersionId"|
  "targetPlanVersionId"|"effectiveTiming"|"expectedSubscriptionVersion">{
  if(!raw || typeof raw!=="object"){
    fail("COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID","Assessment evaluator output is invalid.");
  }
  const resolvedTarget=uuid(
    raw.targetPlanVersionId,
    "evaluator targetPlanVersionId",
    "COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID",
  );
  if(resolvedTarget!==targetPlanVersionId){
    fail(
      "COMMERCIAL_ASSESSMENT_PREPARATION_TARGET_MISMATCH",
      "Assessment evaluator target PlanVersion is stale or mismatched.",
    );
  }
  const normalizedBlockers=blockers(raw.blockingImpactCodes);
  if(preview.usageImpact.hasBlockingUsage && normalizedBlockers.length===0){
    fail(
      "COMMERCIAL_ASSESSMENT_PREPARATION_USAGE_BLOCKER_MISSING",
      "DD-073 blocking usage cannot be omitted from initial assessment blockers.",
    );
  }

  return Object.freeze({
    routeClass:routeClass(raw.routeClass),
    routePolicyId:uuid(
      raw.routePolicyId,
      "routePolicyId",
      "COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID",
    ),
    routePolicyVersion:positive(
      raw.routePolicyVersion,
      "routePolicyVersion",
      "COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID",
    ),
    impactReference:reference(raw.impactReference,"impactReference"),
    entitlementDiffReference:reference(raw.entitlementDiffReference,"entitlementDiffReference"),
    blockingImpactCodes:normalizedBlockers,
    remediationState:normalizedBlockers.length===0 ? "NOT_REQUIRED" : "PENDING",
    sourceFingerprint:fingerprint(raw.sourceFingerprint),
  });
}

export class CommercialInitialAssessmentPreparationService {
  constructor(private readonly evaluator:CommercialInitialAssessmentEvaluatorPort){}

  async prepare(input:{
    readonly requestContext:RequestContext;
    readonly subscriptionId:string;
    readonly sourcePlanVersionId:string;
    readonly targetPlanVersionId:string;
    readonly expectedSubscriptionVersion:number;
    readonly effectiveTiming:PlanChangeEffectiveTiming;
    readonly finalPreview:CommercialFinalTargetPreviewV1;
  }):Promise<CommercialPreparedInitialAssessmentV1>{
    assertContext(input.requestContext);
    const subscriptionId=uuid(input.subscriptionId,"subscriptionId");
    const sourcePlanVersionId=uuid(input.sourcePlanVersionId,"sourcePlanVersionId");
    const targetPlanVersionId=uuid(input.targetPlanVersionId,"targetPlanVersionId");
    if(sourcePlanVersionId===targetPlanVersionId){
      fail(
        "COMMERCIAL_ASSESSMENT_PREPARATION_INPUT_INVALID",
        "Target PlanVersion must differ from source PlanVersion.",
      );
    }
    const expectedSubscriptionVersion=positive(
      input.expectedSubscriptionVersion,
      "expectedSubscriptionVersion",
    );
    const timing=effectiveTiming(input.effectiveTiming);
    assertPreview(input.finalPreview,targetPlanVersionId);

    const evaluation=normalizeEvaluation(
      await this.evaluator.evaluate({
        requestContext:input.requestContext,
        subscriptionId,
        sourcePlanVersionId,
        targetPlanVersionId,
        expectedSubscriptionVersion,
        effectiveTiming:timing,
        finalPreview:input.finalPreview,
      }),
      targetPlanVersionId,
      input.finalPreview,
    );

    return Object.freeze({
      assessmentVersion:1,
      subscriptionId,
      sourcePlanVersionId,
      targetPlanVersionId,
      effectiveTiming:timing,
      expectedSubscriptionVersion,
      ...evaluation,
    });
  }
}
