import type { RequestContext } from "../context/contracts.js";
import type {
  CommercialEntitlementValueType,
  CommercialSubscriptionState,
} from "./current-state.js";

export type CommercialPublishedEntitlementValue =
  | boolean
  | number
  | string
  | readonly string[];

export interface CommercialCompiledSnapshotFact {
  readonly code: string;
  readonly valueType: CommercialEntitlementValueType;
  readonly value: CommercialPublishedEntitlementValue;
  readonly industryContextId?: string;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date;
}

export interface CommercialPublicationResult {
  readonly subscriptionId: string;
  readonly subscriptionVersion: number;
  readonly transitionId: string;
  readonly snapshotId: string;
  readonly snapshotVersion: number;
  readonly subscriptionEventId: string;
  readonly entitlementEventId: string;
  readonly auditId: string;
}

export type CommercialPublicationErrorCode =
  | "COMMERCIAL_PUBLICATION_SCOPE_INVALID"
  | "COMMERCIAL_PUBLICATION_PAYLOAD_INVALID"
  | "COMMERCIAL_PUBLICATION_STATE_CONFLICT"
  | "COMMERCIAL_PUBLICATION_STATE_UNAVAILABLE";

export class CommercialPublicationError extends Error {
  constructor(
    readonly code: CommercialPublicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CommercialPublicationError";
  }
}

export interface CommercialPublicationStorePort {
  publish(input: {
    readonly requestContext: RequestContext;
    readonly subscriptionId: string;
    readonly expectedSubscriptionVersion: number;
    readonly expectedSourcePlanVersionId: string;
    readonly targetPlanVersionId: string;
    readonly assessmentId: string;
    readonly assessmentVersion: number;
    readonly effectiveAt: Date;
    readonly triggerCode: string;
    readonly planChangeRequestId?: string;
    readonly reasonCode?: string;
    readonly sourceFingerprint: string;
    readonly denySet: readonly string[];
    readonly facts: readonly CommercialCompiledSnapshotFact[];
    readonly occurredAt: Date;
    readonly transitionId: string;
    readonly snapshotId: string;
    readonly subscriptionEventId: string;
    readonly entitlementEventId: string;
    readonly auditId: string;
  }): Promise<CommercialPublicationResult>;
}

export interface CommercialPublicationIdPort {
  nextId(): string;
}

export interface CommercialPublicationRuntimePort {
  now(): Date;
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const MAX_FACTS=64;
const MAX_SET=64;

function failure(code:CommercialPublicationErrorCode,message:string):never{
  throw new CommercialPublicationError(code,message);
}

function uuid(value:unknown,label:string):string{
  if(typeof value!=="string" || !UUID.test(value)){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return value.toLowerCase();
}

function positive(value:unknown,label:string):number{
  if(!Number.isSafeInteger(value) || Number(value)<=0){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return Number(value);
}

function code(value:unknown,label:string,max=256):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !CODE.test(value)){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return value;
}

function optionalCode(value:unknown,label:string,max=128):string|undefined{
  return value===undefined ? undefined : code(value,label,max);
}

function date(value:unknown,label:string):Date{
  if(!(value instanceof Date) || Number.isNaN(value.getTime())){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return new Date(value.getTime());
}

function fingerprint(value:unknown):string{
  if(typeof value!=="string" || value.length<16 || value.length>512){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid source fingerprint.");
  }
  return value;
}

function normalizedSet(values:readonly string[],label:string,max=MAX_SET):readonly string[]{
  if(!Array.isArray(values) || values.length>max){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID",label+" exceeds bounded size.");
  }
  const output=values.map((value,index)=>code(value,label+"["+index+"]"));
  if(new Set(output).size!==output.length){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID",label+" contains duplicates.");
  }
  return Object.freeze([...output].sort());
}

function factValue(
  type:CommercialEntitlementValueType,
  value:unknown,
):CommercialPublishedEntitlementValue{
  switch(type){
    case "BOOLEAN":
      if(typeof value!=="boolean") failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid BOOLEAN fact.");
      return value;
    case "INTEGER":
      if(!Number.isSafeInteger(value) || Number(value)<0){
        failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid INTEGER fact.");
      }
      return Number(value);
    case "DECIMAL":
      if(typeof value!=="number" || !Number.isFinite(value) || value<0){
        failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid DECIMAL fact.");
      }
      return value;
    case "TEXT":
      if(typeof value!=="string" || value.length>256){
        failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid TEXT fact.");
      }
      return value;
    case "SET":
      if(!Array.isArray(value)){
        failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid SET fact.");
      }
      return normalizedSet(value as readonly string[],"SET fact");
  }
  failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid entitlement value type.");
}

function normalizeFacts(input:readonly CommercialCompiledSnapshotFact[]):readonly CommercialCompiledSnapshotFact[]{
  if(!Array.isArray(input) || input.length>MAX_FACTS){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Compiled entitlement fact set exceeds v1 bounds.");
  }
  const seen=new Set<string>();
  const output=input.map((fact,index)=>{
    if(!fact || typeof fact!=="object"){
      failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Invalid compiled fact.");
    }
    const factCode=code(fact.code,"facts["+index+"].code");
    const industryContextId=fact.industryContextId===undefined
      ? undefined : uuid(fact.industryContextId,"facts["+index+"].industryContextId");
    const key=factCode+"|"+(industryContextId ?? "");
    if(seen.has(key)){
      failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Duplicate compiled entitlement scope.");
    }
    seen.add(key);
    const effectiveFrom=date(fact.effectiveFrom,"facts["+index+"].effectiveFrom");
    const effectiveTo=fact.effectiveTo===undefined
      ? undefined : date(fact.effectiveTo,"facts["+index+"].effectiveTo");
    if(effectiveTo && effectiveTo.getTime()<=effectiveFrom.getTime()){
      failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Compiled fact effective window is invalid.");
    }
    return Object.freeze({
      code:factCode,
      valueType:fact.valueType,
      value:factValue(fact.valueType,fact.value),
      ...(industryContextId?{industryContextId}:{}),
      sourceType:code(fact.sourceType,"facts["+index+"].sourceType",64),
      sourceId:uuid(fact.sourceId,"facts["+index+"].sourceId"),
      effectiveFrom,
      ...(effectiveTo?{effectiveTo}:{}),
    });
  });
  output.sort((left,right)=>{
    const byCode=left.code.localeCompare(right.code);
    if(byCode!==0) return byCode;
    return (left.industryContextId ?? "").localeCompare(right.industryContextId ?? "");
  });
  return Object.freeze(output);
}

function assertContext(context:RequestContext):void{
  if(context.scopeClass!=="TENANT_CORE"
    || context.industryContextId
    || !context.tenantId
    || !context.principalId
    || context.principalType!=="SERVICE"
    || !context.dataHomeId
    || !context.regionCode
    || !context.entitlementSnapshotId
    || !context.entitlementSnapshotVersion
    || !Number.isSafeInteger(context.entitlementSnapshotVersion)
    || context.entitlementSnapshotVersion<=0){
    failure(
      "COMMERCIAL_PUBLICATION_SCOPE_INVALID",
      "Commercial publication requires a resolved Tenant Core service context with current Commercial snapshot.",
    );
  }
}

function generatedIds(ids:CommercialPublicationIdPort):readonly string[]{
  const output=Array.from({length:5},(_,index)=>uuid(ids.nextId(),"generated id "+index));
  if(new Set(output).size!==output.length){
    failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Generated publication identifiers are not unique.");
  }
  return Object.freeze(output);
}

export class CommercialPublicationService {
  constructor(private readonly ports:{
    readonly store:CommercialPublicationStorePort;
    readonly ids:CommercialPublicationIdPort;
    readonly runtime:CommercialPublicationRuntimePort;
  }){}

  async publish(input:{
    readonly requestContext:RequestContext;
    readonly subscriptionId:string;
    readonly expectedSubscriptionVersion:number;
    readonly expectedSourcePlanVersionId:string;
    readonly targetPlanVersionId:string;
    readonly assessmentId:string;
    readonly assessmentVersion:number;
    readonly effectiveAt:Date;
    readonly triggerCode:string;
    readonly planChangeRequestId?:string;
    readonly reasonCode?:string;
    readonly sourceFingerprint:string;
    readonly denySet:readonly string[];
    readonly facts:readonly CommercialCompiledSnapshotFact[];
  }):Promise<CommercialPublicationResult>{
    assertContext(input.requestContext);
    const now=date(this.ports.runtime.now(),"publication time");
    const effectiveAt=date(input.effectiveAt,"effectiveAt");
    if(effectiveAt.getTime()>now.getTime()){
      failure(
        "COMMERCIAL_PUBLICATION_STATE_CONFLICT",
        "Commercial publication cannot apply before its server-owned effective time.",
      );
    }
    const source=uuid(input.expectedSourcePlanVersionId,"expectedSourcePlanVersionId");
    const target=uuid(input.targetPlanVersionId,"targetPlanVersionId");
    if(source===target){
      failure("COMMERCIAL_PUBLICATION_PAYLOAD_INVALID","Target PlanVersion must differ from source PlanVersion.");
    }
    const ids=generatedIds(this.ports.ids);
    return this.ports.store.publish({
      requestContext:input.requestContext,
      subscriptionId:uuid(input.subscriptionId,"subscriptionId"),
      expectedSubscriptionVersion:positive(input.expectedSubscriptionVersion,"expectedSubscriptionVersion"),
      expectedSourcePlanVersionId:source,
      targetPlanVersionId:target,
      assessmentId:uuid(input.assessmentId,"assessmentId"),
      assessmentVersion:positive(input.assessmentVersion,"assessmentVersion"),
      effectiveAt,
      triggerCode:code(input.triggerCode,"triggerCode",128),
      ...(input.planChangeRequestId
        ? {planChangeRequestId:uuid(input.planChangeRequestId,"planChangeRequestId")}
        : {}),
      ...(input.reasonCode
        ? {reasonCode:optionalCode(input.reasonCode,"reasonCode",128)}
        : {}),
      sourceFingerprint:fingerprint(input.sourceFingerprint),
      denySet:normalizedSet(input.denySet,"denySet"),
      facts:normalizeFacts(input.facts),
      occurredAt:now,
      transitionId:ids[0]!,
      snapshotId:ids[1]!,
      subscriptionEventId:ids[2]!,
      entitlementEventId:ids[3]!,
      auditId:ids[4]!,
    });
  }
}
