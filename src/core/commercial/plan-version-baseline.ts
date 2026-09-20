import type { CurrentCommercialLicenseRead } from "./current-state.js";
import type { IndustryContextRecord } from "../context/contracts.js";
import type {
  PlanEntitlementTemplateV1,
  PlanEntitlementTemplateFactV1,
  PlanLimitDefinitionV1,
  PlanLimitSetV1,
  PlanVersionScopeSelectorV1,
} from "./plan-version-schema.js";

export interface PlanPreviewIndustryContextV1 {
  readonly id:string;
  readonly industryCode:string;
  readonly status:IndustryContextRecord["status"];
}

export interface ResolvedPlanEntitlementV1 {
  readonly code:string;
  readonly valueType:PlanEntitlementTemplateFactV1["valueType"];
  readonly industryContextId?:string;
  readonly grantMode:PlanEntitlementTemplateFactV1["grantMode"];
  readonly value?:PlanEntitlementTemplateFactV1["value"];
}

export interface ResolvedPlanLimitV1 {
  readonly entitlementCode:string;
  readonly meterCode:string;
  readonly industryContextId?:string;
  readonly mode:PlanLimitDefinitionV1["mode"];
  readonly value?:number;
}

export interface PlanVersionBaselinePreviewV1 {
  readonly entitlements:readonly ResolvedPlanEntitlementV1[];
  readonly limits:readonly ResolvedPlanLimitV1[];
}

export type PlanVersionBaselineErrorCode =
  | "PLAN_VERSION_BASELINE_INVALID"
  | "PLAN_VERSION_BASELINE_AMBIGUOUS";

export class PlanVersionBaselineError extends Error {
  constructor(
    readonly code:PlanVersionBaselineErrorCode,
    message:string,
  ){
    super(message);
    this.name="PlanVersionBaselineError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INDUSTRY=/^[A-Z][A-Z0-9_-]{1,15}$/;

function invalid(message:string):never{
  throw new PlanVersionBaselineError("PLAN_VERSION_BASELINE_INVALID",message);
}

function targetsFor(
  scope:PlanVersionScopeSelectorV1,
  industries:readonly PlanPreviewIndustryContextV1[],
  licensedIds:ReadonlySet<string>,
):readonly (string|undefined)[]{
  if(scope.kind==="TENANT") return Object.freeze([undefined]);

  const candidates=industries
    .filter(industry=>
      industry.status==="ACTIVE"
      && licensedIds.has(industry.id)
      && (scope.kind!=="INDUSTRY_CODE" || industry.industryCode===scope.industryCode))
    .map(industry=>industry.id)
    .sort();
  return Object.freeze(candidates);
}

function validateIndustries(
  input:readonly PlanPreviewIndustryContextV1[],
):readonly PlanPreviewIndustryContextV1[]{
  const ids=new Set<string>();
  const codes=new Map<string,string>();
  const output=input.map((industry,index)=>{
    if(!UUID.test(industry.id)) invalid("Invalid Industry Context id at index "+index+".");
    if(!INDUSTRY.test(industry.industryCode)) invalid("Invalid Industry code at index "+index+".");
    if(industry.status!=="PENDING" && industry.status!=="ACTIVE"
      && industry.status!=="SUSPENDED" && industry.status!=="DISABLED"){
      invalid("Invalid Industry status at index "+index+".");
    }
    const id=industry.id.toLowerCase();
    if(ids.has(id)) invalid("Duplicate Industry Context id.");
    ids.add(id);
    const existing=codes.get(industry.industryCode);
    if(existing && existing!==id){
      invalid("Duplicate Industry code maps to multiple Contexts.");
    }
    codes.set(industry.industryCode,id);
    return Object.freeze({...industry,id});
  });
  output.sort((a,b)=>a.id.localeCompare(b.id));
  return Object.freeze(output);
}

function effectiveIndustryLicenses(
  licenses:readonly CurrentCommercialLicenseRead[],
  industries:readonly PlanPreviewIndustryContextV1[],
):ReadonlySet<string>{
  const known=new Set(industries.map(industry=>industry.id));
  const licensed=new Set<string>();
  for(const license of licenses){
    if(license.licenseType!=="INDUSTRY" || !license.isEffective) continue;
    if(!license.industryContextId || !UUID.test(license.industryContextId)){
      invalid("Effective Industry license is missing a valid Industry Context.");
    }
    const id=license.industryContextId.toLowerCase();
    if(!known.has(id)){
      invalid("Effective Industry license references an unavailable Industry Context.");
    }
    licensed.add(id);
  }
  return licensed;
}

function entitlementKey(item:ResolvedPlanEntitlementV1):string{
  return item.code+"|"+(item.industryContextId ?? "");
}
function limitKey(item:ResolvedPlanLimitV1):string{
  return item.entitlementCode+"|"+item.meterCode+"|"+(item.industryContextId ?? "");
}

function expandEntitlements(
  template:PlanEntitlementTemplateV1,
  industries:readonly PlanPreviewIndustryContextV1[],
  licensedIds:ReadonlySet<string>,
):readonly ResolvedPlanEntitlementV1[]{
  const output:ResolvedPlanEntitlementV1[]=[];
  const seen=new Set<string>();

  for(const fact of template.facts){
    for(const industryContextId of targetsFor(fact.scope,industries,licensedIds)){
      const item:ResolvedPlanEntitlementV1=Object.freeze({
        code:fact.code,
        valueType:fact.valueType,
        ...(industryContextId?{industryContextId}:{}),
        grantMode:fact.grantMode,
        ...("value" in fact ? {value:fact.value} : {}),
      });
      const key=entitlementKey(item);
      if(seen.has(key)){
        throw new PlanVersionBaselineError(
          "PLAN_VERSION_BASELINE_AMBIGUOUS",
          "PlanVersion entitlement selectors overlap after Industry resolution.",
        );
      }
      seen.add(key);
      output.push(item);
    }
  }

  output.sort((a,b)=>{
    const codeOrder=a.code.localeCompare(b.code);
    return codeOrder!==0
      ? codeOrder
      : (a.industryContextId ?? "").localeCompare(b.industryContextId ?? "");
  });
  return Object.freeze(output);
}

function expandLimits(
  set:PlanLimitSetV1,
  industries:readonly PlanPreviewIndustryContextV1[],
  licensedIds:ReadonlySet<string>,
):readonly ResolvedPlanLimitV1[]{
  const output:ResolvedPlanLimitV1[]=[];
  const seen=new Set<string>();

  for(const limit of set.limits){
    for(const industryContextId of targetsFor(limit.scope,industries,licensedIds)){
      const item:ResolvedPlanLimitV1=Object.freeze({
        entitlementCode:limit.entitlementCode,
        meterCode:limit.meterCode,
        ...(industryContextId?{industryContextId}:{}),
        mode:limit.mode,
        ...("value" in limit ? {value:limit.value} : {}),
      });
      const key=limitKey(item);
      if(seen.has(key)){
        throw new PlanVersionBaselineError(
          "PLAN_VERSION_BASELINE_AMBIGUOUS",
          "PlanVersion limit selectors overlap after Industry resolution.",
        );
      }
      seen.add(key);
      output.push(item);
    }
  }

  output.sort((a,b)=>{
    const entitlementOrder=a.entitlementCode.localeCompare(b.entitlementCode);
    if(entitlementOrder!==0) return entitlementOrder;
    const meterOrder=a.meterCode.localeCompare(b.meterCode);
    return meterOrder!==0
      ? meterOrder
      : (a.industryContextId ?? "").localeCompare(b.industryContextId ?? "");
  });
  return Object.freeze(output);
}

export function expandPlanVersionBaselineV1(input:{
  readonly template:PlanEntitlementTemplateV1;
  readonly limitSet:PlanLimitSetV1;
  readonly industryContexts:readonly PlanPreviewIndustryContextV1[];
  readonly licenses:readonly CurrentCommercialLicenseRead[];
}):PlanVersionBaselinePreviewV1{
  const industries=validateIndustries(input.industryContexts);
  const licensedIds=effectiveIndustryLicenses(input.licenses,industries);
  return Object.freeze({
    entitlements:expandEntitlements(input.template,industries,licensedIds),
    limits:expandLimits(input.limitSet,industries,licensedIds),
  });
}
