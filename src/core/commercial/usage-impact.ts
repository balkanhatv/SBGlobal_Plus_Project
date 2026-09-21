import type { RequestContext } from "../context/contracts.js";
import type {
  CommercialAdjustmentPrecedencePreviewV1,
  CommercialPrecedenceLimitV1,
} from "./adjustment-precedence.js";

export interface CommercialUsageMeterMeasurementV1 {
  readonly entitlementCode:string;
  readonly meterCode:string;
  readonly industryContextId?:string;
  readonly periodKey:string;
  readonly usedValue:number;
  readonly reservedValue:number;
  readonly version:number;
}

export interface CommercialUsageMeasurementBundleV1 {
  readonly targetPlanVersionId:string;
  readonly selectionPolicyVersion:string;
  readonly evidenceReference:string;
  readonly measurements:readonly CommercialUsageMeterMeasurementV1[];
}

export interface CommercialUsageImpactSourcePort {
  load(input:{
    readonly requestContext:RequestContext;
    readonly targetPlanVersionId:string;
    readonly effectiveAt:Date;
    readonly targetLimits:readonly CommercialPrecedenceLimitV1[];
  }):Promise<CommercialUsageMeasurementBundleV1>;
}

export type CommercialUsageImpactStatusV1 =
  | "WITHIN_TARGET"
  | "EXCEEDS_TARGET"
  | "UNLIMITED";

export interface CommercialUsageImpactItemV1 {
  readonly entitlementCode:string;
  readonly meterCode:string;
  readonly industryContextId?:string;
  readonly targetMode:CommercialPrecedenceLimitV1["mode"];
  readonly targetValue?:number;
  readonly periodKey?:string;
  readonly usedValue?:number;
  readonly status:CommercialUsageImpactStatusV1;
}

export interface CommercialUsageImpactPreviewV1 {
  readonly targetPlanVersionId:string;
  readonly selectionPolicyVersion:string;
  readonly evidenceReference:string;
  readonly impacts:readonly CommercialUsageImpactItemV1[];
  readonly hasBlockingUsage:boolean;
}

export type CommercialUsageImpactErrorCode =
  | "COMMERCIAL_USAGE_IMPACT_SCOPE_INVALID"
  | "COMMERCIAL_USAGE_IMPACT_INPUT_INVALID"
  | "COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID"
  | "COMMERCIAL_USAGE_IMPACT_TARGET_INVALID"
  | "COMMERCIAL_USAGE_IMPACT_MEASUREMENT_MISSING"
  | "COMMERCIAL_USAGE_IMPACT_AMBIGUOUS"
  | "COMMERCIAL_USAGE_IMPACT_RESERVATION_UNRESOLVED";

export class CommercialUsageImpactError extends Error {
  constructor(
    readonly code:CommercialUsageImpactErrorCode,
    message:string,
  ){
    super(message);
    this.name="CommercialUsageImpactError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const TOKEN=/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;
const MAX_MEASUREMENTS=512;

function fail(code:CommercialUsageImpactErrorCode,message:string):never{
  throw new CommercialUsageImpactError(code,message);
}
function uuid(
  value:unknown,
  label:string,
  errorCode:CommercialUsageImpactErrorCode,
):string{
  if(typeof value!=="string" || !UUID.test(value)){
    fail(errorCode,"Invalid "+label+".");
  }
  return value.toLowerCase();
}
function code(
  value:unknown,
  label:string,
  errorCode:CommercialUsageImpactErrorCode,
  max=256,
):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !CODE.test(value)){
    fail(errorCode,"Invalid "+label+".");
  }
  return value;
}
function token(
  value:unknown,
  label:string,
  errorCode:CommercialUsageImpactErrorCode,
  max=512,
):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !TOKEN.test(value)){
    fail(errorCode,"Invalid "+label+".");
  }
  return value;
}
function date(value:unknown,label:string):Date{
  if(!(value instanceof Date) || Number.isNaN(value.getTime())){
    fail("COMMERCIAL_USAGE_IMPACT_INPUT_INVALID","Invalid "+label+".");
  }
  return new Date(value.getTime());
}
function nonNegative(value:unknown,label:string):number{
  if(typeof value!=="number" || !Number.isFinite(value) || value<0){
    fail("COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID","Invalid "+label+".");
  }
  return value;
}
function positiveVersion(value:unknown):number{
  if(!Number.isSafeInteger(value) || Number(value)<=0){
    fail("COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID","Invalid usage-meter version.");
  }
  return Number(value);
}
function assertContext(context:RequestContext):void{
  if(context.scopeClass!=="TENANT_CORE" || context.industryContextId
    || !context.tenantId || !context.principalId || context.principalType!=="SERVICE"
    || !context.dataHomeId || !context.regionCode){
    fail(
      "COMMERCIAL_USAGE_IMPACT_SCOPE_INVALID",
      "Commercial usage-impact evaluation requires a resolved Tenant Core service context.",
    );
  }
}
function limitKey(
  entitlementCode:string,
  meterCode:string,
  industryContextId?:string,
):string{
  return entitlementCode+"|"+meterCode+"|"+(industryContextId ?? "");
}
function normalizeTargets(
  preview:CommercialAdjustmentPrecedencePreviewV1,
):readonly CommercialPrecedenceLimitV1[]{
  if(!preview || !Array.isArray(preview.limits)){
    fail("COMMERCIAL_USAGE_IMPACT_INPUT_INVALID","DD-071 target preview limits are invalid.");
  }
  const seen=new Set<string>();
  const output:CommercialPrecedenceLimitV1[]=[];
  for(const [index,item] of preview.limits.entries()){
    const entitlementCode=code(
      item.entitlementCode,
      "target limit entitlementCode["+index+"]",
      "COMMERCIAL_USAGE_IMPACT_INPUT_INVALID",
    );
    const meterCode=code(
      item.meterCode,
      "target limit meterCode["+index+"]",
      "COMMERCIAL_USAGE_IMPACT_INPUT_INVALID",
    );
    const industryContextId=item.industryContextId===undefined
      ? undefined
      : uuid(
          item.industryContextId,
          "target limit industryContextId["+index+"]",
          "COMMERCIAL_USAGE_IMPACT_INPUT_INVALID",
        );
    if(item.mode!=="FINITE" && item.mode!=="UNLIMITED"
      && item.mode!=="NOT_INCLUDED" && item.mode!=="ADD_ON_ONLY"){
      fail("COMMERCIAL_USAGE_IMPACT_INPUT_INVALID","Invalid target limit mode.");
    }
    if(item.mode==="FINITE"){
      if(typeof item.value!=="number" || !Number.isFinite(item.value) || item.value<0){
        fail("COMMERCIAL_USAGE_IMPACT_INPUT_INVALID","Finite target limit value is invalid.");
      }
    }else if(item.value!==undefined){
      fail("COMMERCIAL_USAGE_IMPACT_INPUT_INVALID","Non-finite target limit must not carry a value.");
    }
    const key=limitKey(entitlementCode,meterCode,industryContextId);
    if(seen.has(key)){
      fail("COMMERCIAL_USAGE_IMPACT_AMBIGUOUS","Duplicate exact target limit.");
    }
    seen.add(key);
    output.push(Object.freeze({
      entitlementCode,meterCode,
      ...(industryContextId?{industryContextId}:{}),
      mode:item.mode,
      ...(item.mode==="FINITE"?{value:item.value}:{}),
    }));
  }
  output.sort((a,b)=>{
    const e=a.entitlementCode.localeCompare(b.entitlementCode);
    if(e!==0) return e;
    const m=a.meterCode.localeCompare(b.meterCode);
    return m!==0?m:(a.industryContextId??"").localeCompare(b.industryContextId??"");
  });
  return Object.freeze(output);
}
function normalizeMeasurements(
  input:CommercialUsageMeasurementBundleV1,
  targetPlanVersionId:string,
  targets:readonly CommercialPrecedenceLimitV1[],
):ReadonlyMap<string,CommercialUsageMeterMeasurementV1>{
  if(!input || input.targetPlanVersionId!==targetPlanVersionId){
    fail("COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID","Usage source target PlanVersion is stale or mismatched.");
  }
  token(input.selectionPolicyVersion,"selectionPolicyVersion","COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID",128);
  token(input.evidenceReference,"evidenceReference","COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID");
  if(!Array.isArray(input.measurements) || input.measurements.length>MAX_MEASUREMENTS){
    fail("COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID","Usage measurement set exceeds v1 bounds.");
  }

  const targetKeys=new Set(targets.map(item=>
    limitKey(item.entitlementCode,item.meterCode,item.industryContextId)
  ));
  const map=new Map<string,CommercialUsageMeterMeasurementV1>();
  for(const [index,item] of input.measurements.entries()){
    const entitlementCode=code(
      item.entitlementCode,
      "measurement entitlementCode["+index+"]",
      "COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID",
    );
    const meterCode=code(
      item.meterCode,
      "measurement meterCode["+index+"]",
      "COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID",
    );
    const industryContextId=item.industryContextId===undefined
      ? undefined
      : uuid(
          item.industryContextId,
          "measurement industryContextId["+index+"]",
          "COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID",
        );
    const key=limitKey(entitlementCode,meterCode,industryContextId);
    if(!targetKeys.has(key)){
      fail(
        "COMMERCIAL_USAGE_IMPACT_TARGET_INVALID",
        "Usage measurement target is absent from the exact DD-071 target limit set.",
      );
    }
    if(map.has(key)){
      fail(
        "COMMERCIAL_USAGE_IMPACT_AMBIGUOUS",
        "Multiple selected usage periods map to one exact target limit.",
      );
    }
    map.set(key,Object.freeze({
      entitlementCode,meterCode,
      ...(industryContextId?{industryContextId}:{}),
      periodKey:token(
        item.periodKey,
        "measurement periodKey["+index+"]",
        "COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID",
        128,
      ),
      usedValue:nonNegative(item.usedValue,"measurement usedValue["+index+"]"),
      reservedValue:nonNegative(item.reservedValue,"measurement reservedValue["+index+"]"),
      version:positiveVersion(item.version),
    }));
  }
  return map;
}

export class CommercialUsageImpactService {
  constructor(private readonly source:CommercialUsageImpactSourcePort){}

  async evaluate(input:{
    readonly requestContext:RequestContext;
    readonly targetPlanVersionId:string;
    readonly effectiveAt:Date;
    readonly preview:CommercialAdjustmentPrecedencePreviewV1;
  }):Promise<CommercialUsageImpactPreviewV1>{
    assertContext(input.requestContext);
    const targetPlanVersionId=uuid(
      input.targetPlanVersionId,
      "targetPlanVersionId",
      "COMMERCIAL_USAGE_IMPACT_INPUT_INVALID",
    );
    const effectiveAt=date(input.effectiveAt,"effectiveAt");
    const targets=normalizeTargets(input.preview);
    const source=await this.source.load({
      requestContext:input.requestContext,
      targetPlanVersionId,
      effectiveAt,
      targetLimits:targets,
    });
    const measurements=normalizeMeasurements(source,targetPlanVersionId,targets);
    const impacts:CommercialUsageImpactItemV1[]=[];
    let hasBlockingUsage=false;

    for(const target of targets){
      const key=limitKey(target.entitlementCode,target.meterCode,target.industryContextId);
      if(target.mode==="UNLIMITED"){
        impacts.push(Object.freeze({
          entitlementCode:target.entitlementCode,
          meterCode:target.meterCode,
          ...(target.industryContextId?{industryContextId:target.industryContextId}:{}),
          targetMode:"UNLIMITED",
          status:"UNLIMITED",
        }));
        continue;
      }

      const measurement=measurements.get(key);
      if(!measurement){
        fail(
          "COMMERCIAL_USAGE_IMPACT_MEASUREMENT_MISSING",
          "Authoritative selected usage measurement is missing for a bounded target limit.",
        );
      }
      if(measurement.reservedValue>0){
        fail(
          "COMMERCIAL_USAGE_IMPACT_RESERVATION_UNRESOLVED",
          "Downgrade semantics for outstanding reserved usage are not governed by the current source.",
        );
      }

      const targetValue=target.mode==="FINITE" ? target.value! : 0;
      const exceeds=measurement.usedValue>targetValue;
      if(exceeds) hasBlockingUsage=true;
      impacts.push(Object.freeze({
        entitlementCode:target.entitlementCode,
        meterCode:target.meterCode,
        ...(target.industryContextId?{industryContextId:target.industryContextId}:{}),
        targetMode:target.mode,
        targetValue,
        periodKey:measurement.periodKey,
        usedValue:measurement.usedValue,
        status:exceeds?"EXCEEDS_TARGET":"WITHIN_TARGET",
      }));
    }

    return Object.freeze({
      targetPlanVersionId,
      selectionPolicyVersion:source.selectionPolicyVersion,
      evidenceReference:source.evidenceReference,
      impacts:Object.freeze(impacts),
      hasBlockingUsage,
    });
  }
}
