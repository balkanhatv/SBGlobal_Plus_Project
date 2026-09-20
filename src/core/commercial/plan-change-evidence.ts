import type { RequestContext } from "../context/contracts.js";

export type PlanChangeEffectiveTiming = "IMMEDIATE" | "NEXT_RENEWAL";
export type PlanChangeRouteClass = "SELF_SERVE" | "SALES_ASSISTED";
export type PlanChangeRemediationState = "NOT_REQUIRED" | "PENDING" | "SATISFIED";
export type PlanChangeResolutionState = "PENDING" | "SATISFIED" | "REJECTED";
export type PlanChangeResolutionProducer = "Billing" | "Workflow";

export interface PlanChangeAssessmentRecordV1 {
  readonly assessmentId:string;
  readonly assessmentVersion:number;
  readonly tenantId:string;
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
  readonly remediationState:PlanChangeRemediationState;
  readonly sourceFingerprint:string;
  readonly correlationId:string;
  readonly createdAt:Date;
}

export interface PlanChangeRemediationEvidenceV1 {
  readonly id:string;
  readonly tenantId:string;
  readonly assessmentId:string;
  readonly assessmentVersion:number;
  readonly evidenceVersion:number;
  readonly remediationState:"SATISFIED";
  readonly evidenceReference:string;
  readonly producerModule:"Commercial";
  readonly correlationId:string;
  readonly resolvedAt:Date;
  readonly createdAt:Date;
}

export interface PlanChangeRouteResolutionV1 {
  readonly id:string;
  readonly tenantId:string;
  readonly assessmentId:string;
  readonly assessmentVersion:number;
  readonly routeClass:PlanChangeRouteClass;
  readonly resolutionState:PlanChangeResolutionState;
  readonly evidenceReference?:string;
  readonly billingPreviewReference?:string;
  readonly effectiveAt?:Date;
  readonly producerModule:PlanChangeResolutionProducer;
  readonly evidenceVersion:number;
  readonly resolvedAt?:Date;
  readonly correlationId:string;
  readonly createdAt:Date;
}

export type PlanChangeEvidenceErrorCode =
  | "PLAN_CHANGE_EVIDENCE_SCOPE_INVALID"
  | "PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID"
  | "PLAN_CHANGE_EVIDENCE_STATE_UNAVAILABLE";

export class PlanChangeEvidenceError extends Error {
  constructor(
    readonly code:PlanChangeEvidenceErrorCode,
    message:string,
  ){
    super(message);
    this.name="PlanChangeEvidenceError";
  }
}

export interface PlanChangeAssessmentStorePort {
  recordAssessment(input:{
    readonly requestContext:RequestContext;
    readonly assessment:PlanChangeAssessmentRecordV1;
  }):Promise<PlanChangeAssessmentRecordV1>;
}

export interface PlanChangeRemediationStorePort {
  recordRemediation(input:{
    readonly requestContext:RequestContext;
    readonly evidence:PlanChangeRemediationEvidenceV1;
  }):Promise<PlanChangeRemediationEvidenceV1>;
}

export interface PlanChangeResolutionStorePort {
  recordResolution(input:{
    readonly requestContext:RequestContext;
    readonly resolution:PlanChangeRouteResolutionV1;
  }):Promise<PlanChangeRouteResolutionV1>;
}

export interface PlanChangeEvidenceIdPort { nextId():string; }
export interface PlanChangeEvidenceRuntimePort { now():Date; }

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMPACT=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const MAX_IMPACTS=64;

function fail(code:PlanChangeEvidenceErrorCode,message:string):never{
  throw new PlanChangeEvidenceError(code,message);
}
function uuid(value:unknown,label:string):string{
  if(typeof value!=="string" || !UUID.test(value)){
    fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return value.toLowerCase();
}
function positive(value:unknown,label:string):number{
  if(!Number.isSafeInteger(value) || Number(value)<=0){
    fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return Number(value);
}
function reference(value:unknown,label:string):string{
  if(typeof value!=="string" || value.length===0 || value.length>512){
    fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return value;
}
function optionalReference(value:unknown,label:string):string|undefined{
  return value===undefined ? undefined : reference(value,label);
}
function fingerprint(value:unknown):string{
  if(typeof value!=="string" || value.length<16 || value.length>512){
    fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Invalid source fingerprint.");
  }
  return value;
}
function date(value:unknown,label:string):Date{
  if(!(value instanceof Date) || Number.isNaN(value.getTime())){
    fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return new Date(value.getTime());
}
function impacts(values:readonly string[]):readonly string[]{
  if(!Array.isArray(values) || values.length>MAX_IMPACTS){
    fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Blocking impact set exceeds v1 bounds.");
  }
  const output=values.map((value,index)=>{
    if(typeof value!=="string" || value.length===0 || value.length>128 || !IMPACT.test(value)){
      fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Invalid blockingImpactCodes["+index+"].");
    }
    return value;
  });
  if(new Set(output).size!==output.length){
    fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Blocking impact codes contain duplicates.");
  }
  return Object.freeze([...output].sort());
}
function assertContext(context:RequestContext):string{
  if(context.scopeClass!=="TENANT_CORE" || context.industryContextId
    || !context.tenantId || !context.principalId || context.principalType!=="SERVICE"
    || !context.dataHomeId || !context.regionCode){
    fail(
      "PLAN_CHANGE_EVIDENCE_SCOPE_INVALID",
      "Plan-change evidence requires a resolved Tenant Core service context.",
    );
  }
  return context.tenantId;
}
function nextId(ids:PlanChangeEvidenceIdPort):string{
  return uuid(ids.nextId(),"generated evidence id");
}

export class PlanChangeEvidenceService {
  constructor(private readonly ports:{
    readonly assessmentStore:PlanChangeAssessmentStorePort;
    readonly remediationStore:PlanChangeRemediationStorePort;
    readonly billingResolutionStore:PlanChangeResolutionStorePort;
    readonly workflowResolutionStore:PlanChangeResolutionStorePort;
    readonly ids:PlanChangeEvidenceIdPort;
    readonly runtime:PlanChangeEvidenceRuntimePort;
  }){}

  async recordAssessment(input:{
    readonly requestContext:RequestContext;
    readonly assessmentId?:string;
    readonly assessmentVersion:number;
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
    readonly remediationState:PlanChangeRemediationState;
    readonly sourceFingerprint:string;
  }):Promise<PlanChangeAssessmentRecordV1>{
    const tenantId=assertContext(input.requestContext);
    const assessmentVersion=positive(input.assessmentVersion,"assessmentVersion");
    const assessmentId=input.assessmentId===undefined
      ? (assessmentVersion===1
        ? nextId(this.ports.ids)
        : fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Later assessment versions require assessmentId."))
      : uuid(input.assessmentId,"assessmentId");
    const blockingImpactCodes=impacts(input.blockingImpactCodes);
    if((blockingImpactCodes.length===0 && input.remediationState==="PENDING")
      || (blockingImpactCodes.length>0 && input.remediationState!=="PENDING")
      || (assessmentVersion===1 && input.remediationState==="SATISFIED")){
      fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Assessment remediation state is inconsistent with impact evidence.");
    }
    const sourcePlanVersionId=uuid(input.sourcePlanVersionId,"sourcePlanVersionId");
    const targetPlanVersionId=uuid(input.targetPlanVersionId,"targetPlanVersionId");
    if(sourcePlanVersionId===targetPlanVersionId){
      fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Target PlanVersion must differ from source PlanVersion.");
    }
    const createdAt=date(this.ports.runtime.now(),"assessment time");
    const assessment:Object.freeze extends never ? never : PlanChangeAssessmentRecordV1=Object.freeze({
      assessmentId,
      assessmentVersion,
      tenantId,
      subscriptionId:uuid(input.subscriptionId,"subscriptionId"),
      sourcePlanVersionId,
      targetPlanVersionId,
      effectiveTiming:input.effectiveTiming,
      expectedSubscriptionVersion:positive(input.expectedSubscriptionVersion,"expectedSubscriptionVersion"),
      routeClass:input.routeClass,
      routePolicyId:uuid(input.routePolicyId,"routePolicyId"),
      routePolicyVersion:positive(input.routePolicyVersion,"routePolicyVersion"),
      impactReference:reference(input.impactReference,"impactReference"),
      entitlementDiffReference:reference(input.entitlementDiffReference,"entitlementDiffReference"),
      blockingImpactCodes,
      remediationState:input.remediationState,
      sourceFingerprint:fingerprint(input.sourceFingerprint),
      correlationId:uuid(input.requestContext.correlationId,"correlationId"),
      createdAt,
    });
    return this.ports.assessmentStore.recordAssessment({requestContext:input.requestContext,assessment});
  }

  async recordRemediationSatisfied(input:{
    readonly requestContext:RequestContext;
    readonly assessmentId:string;
    readonly assessmentVersion:number;
    readonly evidenceVersion:number;
    readonly evidenceReference:string;
  }):Promise<PlanChangeRemediationEvidenceV1>{
    const tenantId=assertContext(input.requestContext);
    const now=date(this.ports.runtime.now(),"remediation evidence time");
    const evidence=Object.freeze({
      id:nextId(this.ports.ids),
      tenantId,
      assessmentId:uuid(input.assessmentId,"assessmentId"),
      assessmentVersion:positive(input.assessmentVersion,"assessmentVersion"),
      evidenceVersion:positive(input.evidenceVersion,"evidenceVersion"),
      remediationState:"SATISFIED" as const,
      evidenceReference:reference(input.evidenceReference,"evidenceReference"),
      producerModule:"Commercial" as const,
      correlationId:uuid(input.requestContext.correlationId,"correlationId"),
      resolvedAt:now,
      createdAt:now,
    });
    return this.ports.remediationStore.recordRemediation({requestContext:input.requestContext,evidence});
  }

  async recordSelfServeResolution(input:{
    readonly requestContext:RequestContext;
    readonly assessmentId:string;
    readonly assessmentVersion:number;
    readonly evidenceVersion:number;
    readonly resolutionState:PlanChangeResolutionState;
    readonly evidenceReference?:string;
    readonly billingPreviewReference?:string;
    readonly effectiveAt?:Date;
  }):Promise<PlanChangeRouteResolutionV1>{
    return this.recordResolution({
      ...input,
      routeClass:"SELF_SERVE",
      producerModule:"Billing",
      store:this.ports.billingResolutionStore,
    });
  }

  async recordSalesAssistedResolution(input:{
    readonly requestContext:RequestContext;
    readonly assessmentId:string;
    readonly assessmentVersion:number;
    readonly evidenceVersion:number;
    readonly resolutionState:PlanChangeResolutionState;
    readonly evidenceReference?:string;
    readonly effectiveAt?:Date;
  }):Promise<PlanChangeRouteResolutionV1>{
    return this.recordResolution({
      ...input,
      routeClass:"SALES_ASSISTED",
      producerModule:"Workflow",
      store:this.ports.workflowResolutionStore,
    });
  }

  private async recordResolution(input:{
    readonly requestContext:RequestContext;
    readonly assessmentId:string;
    readonly assessmentVersion:number;
    readonly evidenceVersion:number;
    readonly resolutionState:PlanChangeResolutionState;
    readonly evidenceReference?:string;
    readonly billingPreviewReference?:string;
    readonly effectiveAt?:Date;
    readonly routeClass:PlanChangeRouteClass;
    readonly producerModule:PlanChangeResolutionProducer;
    readonly store:PlanChangeResolutionStorePort;
  }):Promise<PlanChangeRouteResolutionV1>{
    const tenantId=assertContext(input.requestContext);
    const now=date(this.ports.runtime.now(),"route resolution time");
    const evidenceReference=optionalReference(input.evidenceReference,"evidenceReference");
    if(input.resolutionState!=="PENDING" && !evidenceReference){
      fail("PLAN_CHANGE_EVIDENCE_PAYLOAD_INVALID","Completed route resolution requires evidenceReference.");
    }
    const resolution=Object.freeze({
      id:nextId(this.ports.ids),
      tenantId,
      assessmentId:uuid(input.assessmentId,"assessmentId"),
      assessmentVersion:positive(input.assessmentVersion,"assessmentVersion"),
      routeClass:input.routeClass,
      resolutionState:input.resolutionState,
      ...(evidenceReference?{evidenceReference}:{}),
      ...(input.billingPreviewReference
        ? {billingPreviewReference:reference(input.billingPreviewReference,"billingPreviewReference")}
        : {}),
      ...(input.effectiveAt?{effectiveAt:date(input.effectiveAt,"effectiveAt")}:{ }),
      producerModule:input.producerModule,
      evidenceVersion:positive(input.evidenceVersion,"evidenceVersion"),
      ...(input.resolutionState==="PENDING"?{}:{resolvedAt:now}),
      correlationId:uuid(input.requestContext.correlationId,"correlationId"),
      createdAt:now,
    });
    return input.store.recordResolution({requestContext:input.requestContext,resolution});
  }
}
