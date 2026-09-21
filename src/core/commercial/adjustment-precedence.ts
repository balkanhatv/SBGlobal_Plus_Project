import type { CommercialPreparedAdjustmentsV1 } from "./adjustment-source.js";
import type { NormalizedTenantOverrideV1 } from "./adjustment-schema.js";
import type {
  PlanPreviewIndustryContextV1,
  PlanVersionBaselinePreviewV1,
} from "./plan-version-baseline.js";
import type { PlanVersionEntitlementValueType } from "./plan-version-schema.js";

export type CommercialPrecedenceEntitlementStateV1 =
  | "VALUE"
  | "NOT_INCLUDED"
  | "ADD_ON_ONLY";

export interface CommercialPrecedenceEntitlementV1 {
  readonly code:string;
  readonly valueType:PlanVersionEntitlementValueType;
  readonly industryContextId?:string;
  readonly state:CommercialPrecedenceEntitlementStateV1;
  readonly value?:boolean|number|string|readonly string[];
}

export interface CommercialPrecedenceLimitV1 {
  readonly entitlementCode:string;
  readonly meterCode:string;
  readonly industryContextId?:string;
  readonly mode:"FINITE"|"UNLIMITED"|"NOT_INCLUDED"|"ADD_ON_ONLY";
  readonly value?:number;
}

export interface CommercialAdjustmentPrecedencePreviewV1 {
  readonly entitlements:readonly CommercialPrecedenceEntitlementV1[];
  readonly limits:readonly CommercialPrecedenceLimitV1[];
  readonly tenantDenySet:readonly string[];
}

export type CommercialAdjustmentPrecedenceErrorCode =
  | "COMMERCIAL_ADJUSTMENT_PRECEDENCE_INVALID"
  | "COMMERCIAL_ADJUSTMENT_PRECEDENCE_AMBIGUOUS";

export class CommercialAdjustmentPrecedenceError extends Error {
  constructor(
    readonly code:CommercialAdjustmentPrecedenceErrorCode,
    message:string,
  ){
    super(message);
    this.name="CommercialAdjustmentPrecedenceError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INDUSTRY=/^[A-Z][A-Z0-9_-]{1,15}$/;

function invalid(message:string):never{
  throw new CommercialAdjustmentPrecedenceError(
    "COMMERCIAL_ADJUSTMENT_PRECEDENCE_INVALID",
    message,
  );
}
function ambiguous(message:string):never{
  throw new CommercialAdjustmentPrecedenceError(
    "COMMERCIAL_ADJUSTMENT_PRECEDENCE_AMBIGUOUS",
    message,
  );
}
function entitlementKey(code:string,industryContextId?:string):string{
  return code+"|"+(industryContextId ?? "");
}
function limitKey(
  entitlementCode:string,
  meterCode:string,
  industryContextId?:string,
):string{
  return entitlementCode+"|"+meterCode+"|"+(industryContextId ?? "");
}
function overrideScopeKey(item:NormalizedTenantOverrideV1):string{
  return entitlementKey(item.entitlementCode,item.industryContextId);
}
function canonicalValue(
  type:PlanVersionEntitlementValueType,
  value:unknown,
):boolean|number|string|readonly string[]{
  switch(type){
    case "BOOLEAN":
      if(typeof value!=="boolean") invalid("BOOLEAN entitlement value is invalid.");
      return value;
    case "INTEGER":
      if(!Number.isSafeInteger(value) || Number(value)<0) invalid("INTEGER entitlement value is invalid.");
      return Number(value);
    case "DECIMAL":
      if(typeof value!=="number" || !Number.isFinite(value) || value<0) invalid("DECIMAL entitlement value is invalid.");
      return value;
    case "TEXT":
      if(typeof value!=="string") invalid("TEXT entitlement value is invalid.");
      return value;
    case "SET":
      if(!Array.isArray(value) || !value.every(item=>typeof item==="string")){
        invalid("SET entitlement value is invalid.");
      }
      return Object.freeze([...value]);
  }
}
function disabledValue(
  type:PlanVersionEntitlementValueType,
):boolean|number|string|readonly string[]{
  switch(type){
    case "BOOLEAN": return false;
    case "INTEGER": return 0;
    case "DECIMAL": return 0;
    case "TEXT": return "";
    case "SET": return Object.freeze([]);
  }
}
function numericResult(value:number,type:"INTEGER"|"DECIMAL",label:string):number{
  if(!Number.isFinite(value) || value<0) invalid(label+" must remain non-negative and finite.");
  if(type==="INTEGER" && !Number.isSafeInteger(value)){
    invalid(label+" must remain a safe integer.");
  }
  return value;
}

function normalizeBaselineEntitlements(
  baseline:PlanVersionBaselinePreviewV1,
):Map<string,CommercialPrecedenceEntitlementV1>{
  const map=new Map<string,CommercialPrecedenceEntitlementV1>();
  for(const item of baseline.entitlements){
    const id=item.industryContextId?.toLowerCase();
    const key=entitlementKey(item.code,id);
    if(map.has(key)) ambiguous("Duplicate resolved baseline entitlement.");
    if(item.grantMode==="INCLUDED"){
      if(item.value===undefined) invalid("Included baseline entitlement is missing value.");
      map.set(key,Object.freeze({
        code:item.code,valueType:item.valueType,...(id?{industryContextId:id}:{}),
        state:"VALUE",value:canonicalValue(item.valueType,item.value),
      }));
    }else{
      map.set(key,Object.freeze({
        code:item.code,valueType:item.valueType,...(id?{industryContextId:id}:{}),
        state:item.grantMode,
      }));
    }
  }
  return map;
}

function normalizeBaselineLimits(
  baseline:PlanVersionBaselinePreviewV1,
):Map<string,CommercialPrecedenceLimitV1>{
  const map=new Map<string,CommercialPrecedenceLimitV1>();
  for(const item of baseline.limits){
    const id=item.industryContextId?.toLowerCase();
    const key=limitKey(item.entitlementCode,item.meterCode,id);
    if(map.has(key)) ambiguous("Duplicate resolved baseline limit.");
    if(item.mode==="FINITE"){
      if(typeof item.value!=="number" || !Number.isFinite(item.value) || item.value<0){
        invalid("Finite baseline limit is invalid.");
      }
      map.set(key,Object.freeze({
        entitlementCode:item.entitlementCode,meterCode:item.meterCode,
        ...(id?{industryContextId:id}:{}),mode:"FINITE",value:item.value,
      }));
    }else{
      map.set(key,Object.freeze({
        entitlementCode:item.entitlementCode,meterCode:item.meterCode,
        ...(id?{industryContextId:id}:{}),mode:item.mode,
      }));
    }
  }
  return map;
}

function validateIndustryMap(
  input:readonly PlanPreviewIndustryContextV1[],
):ReadonlyMap<string,string>{
  const codes=new Map<string,string>();
  const ids=new Set<string>();
  for(const [index,item] of input.entries()){
    if(!UUID.test(item.id) || !INDUSTRY.test(item.industryCode)){
      invalid("Invalid Industry Context at index "+index+".");
    }
    if(item.status!=="PENDING" && item.status!=="ACTIVE"
      && item.status!=="SUSPENDED" && item.status!=="DISABLED"){
      invalid("Invalid Industry Context status at index "+index+".");
    }
    const id=item.id.toLowerCase();
    if(ids.has(id)) invalid("Duplicate Industry Context id.");
    ids.add(id);
    if(codes.has(item.industryCode)) invalid("Duplicate Industry code.");
    if(item.status==="ACTIVE") codes.set(item.industryCode,id);
  }
  return codes;
}

function requireEntitlement(
  entitlements:Map<string,CommercialPrecedenceEntitlementV1>,
  item:NormalizedTenantOverrideV1,
):CommercialPrecedenceEntitlementV1{
  const key=overrideScopeKey(item);
  const target=entitlements.get(key);
  if(!target) invalid("Override target is absent from the resolved PlanVersion baseline.");
  if(target.valueType!==item.valueType){
    invalid("Override value type does not match the resolved PlanVersion entitlement.");
  }
  return target;
}

function applyAccessOverrides(
  entitlements:Map<string,CommercialPrecedenceEntitlementV1>,
  overrides:readonly NormalizedTenantOverrideV1[],
  tenantDenySet:Set<string>,
):void{
  const groups=new Map<string,NormalizedTenantOverrideV1[]>();
  for(const item of overrides){
    if(item.overrideType!=="ALLOW" && item.overrideType!=="DENY") continue;
    const key=overrideScopeKey(item);
    const list=groups.get(key) ?? [];
    list.push(item);
    groups.set(key,list);
  }

  for(const [key,items] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))){
    for(const item of items) requireEntitlement(entitlements,item);
    const denies=items.filter(item=>item.overrideType==="DENY");
    if(denies.length>0){
      const target=entitlements.get(key)!;
      const industryContextId=denies[0]!.industryContextId;
      if(industryContextId){
        entitlements.set(key,Object.freeze({
          code:target.code,valueType:target.valueType,industryContextId,
          state:"VALUE",value:disabledValue(target.valueType),
        }));
      }else{
        tenantDenySet.add(target.code);
      }
      continue;
    }

    const allows=items.filter(
      (item):item is Extract<NormalizedTenantOverrideV1,{overrideType:"ALLOW"}> =>
        item.overrideType==="ALLOW",
    );
    if(allows.length!==1) ambiguous("Multiple active ALLOW overrides target the same entitlement scope.");
    const target=entitlements.get(key)!;
    entitlements.set(key,Object.freeze({
      code:target.code,valueType:target.valueType,
      ...(allows[0]!.industryContextId?{industryContextId:allows[0]!.industryContextId}:{}),
      state:"VALUE",value:allows[0]!.value,
    }));
  }
}

function findLimitTargets(
  limits:ReadonlyMap<string,CommercialPrecedenceLimitV1>,
  entitlementCode:string,
  industryContextId?:string,
):CommercialPrecedenceLimitV1[]{
  return [...limits.values()].filter(item=>
    item.entitlementCode===entitlementCode
    && item.industryContextId===industryContextId
  );
}

function applyLimitOverrides(
  entitlements:ReadonlyMap<string,CommercialPrecedenceEntitlementV1>,
  limits:Map<string,CommercialPrecedenceLimitV1>,
  overrides:readonly NormalizedTenantOverrideV1[],
):void{
  const groups=new Map<string,NormalizedTenantOverrideV1[]>();
  for(const item of overrides){
    if(item.overrideType!=="LIMIT_SET" && item.overrideType!=="LIMIT_DELTA") continue;
    const key=overrideScopeKey(item);
    const list=groups.get(key) ?? [];
    list.push(item);
    groups.set(key,list);
  }

  for(const [scopeKey,items] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))){
    if(items.length!==1){
      ambiguous("Multiple active limit overrides target the same entitlement scope.");
    }
    const item=items[0]!;
    const entitlement=entitlements.get(scopeKey);
    if(entitlement && entitlement.valueType!==item.valueType){
      invalid("Limit override value type does not match the resolved entitlement.");
    }
    const targets=findLimitTargets(limits,item.entitlementCode,item.industryContextId);
    if(targets.length===0) invalid("Limit override has no resolved target meter.");
    if(targets.length!==1) ambiguous("Limit override maps to multiple target meters.");

    const target=targets[0]!;
    const key=limitKey(target.entitlementCode,target.meterCode,target.industryContextId);
    if(item.overrideType==="LIMIT_SET"){
      limits.set(key,Object.freeze({...target,mode:"FINITE",value:item.value}));
      continue;
    }
    if(target.mode!=="FINITE" || target.value===undefined){
      invalid("LIMIT_DELTA requires an existing finite target limit.");
    }
    limits.set(key,Object.freeze({
      ...target,
      mode:"FINITE",
      value:numericResult(target.value+item.delta,item.valueType,"LIMIT_DELTA result"),
    }));
  }
}

function addOnTargets(
  delta:{readonly entitlementCode:string;readonly meterCode:string;readonly scope:{readonly kind:string;readonly industryCode?:string}},
  limits:ReadonlyMap<string,CommercialPrecedenceLimitV1>,
  activeIndustryCodes:ReadonlyMap<string,string>,
):CommercialPrecedenceLimitV1[]{
  if(delta.scope.kind==="TENANT"){
    const target=limits.get(limitKey(delta.entitlementCode,delta.meterCode));
    return target?[target]:[];
  }
  if(delta.scope.kind==="INDUSTRY_CODE"){
    const id=delta.scope.industryCode?activeIndustryCodes.get(delta.scope.industryCode):undefined;
    if(!id) return [];
    const target=limits.get(limitKey(delta.entitlementCode,delta.meterCode,id));
    return target?[target]:[];
  }
  if(delta.scope.kind==="LICENSED_INDUSTRIES"){
    return [...limits.values()].filter(item=>
      item.entitlementCode===delta.entitlementCode
      && item.meterCode===delta.meterCode
      && item.industryContextId!==undefined
    );
  }
  invalid("Unsupported add-on scope.");
}

function applyEligibleAddOns(
  entitlements:ReadonlyMap<string,CommercialPrecedenceEntitlementV1>,
  limits:Map<string,CommercialPrecedenceLimitV1>,
  adjustments:CommercialPreparedAdjustmentsV1,
  activeIndustryCodes:ReadonlyMap<string,string>,
):void{
  for(const addOn of adjustments.eligibleAddOns){
    for(const delta of addOn.quotaDeltas){
      const targets=addOnTargets(delta,limits,activeIndustryCodes);
      if(targets.length===0){
        invalid("Eligible add-on quota delta has no resolved target limit.");
      }
      for(const target of targets){
        const entitlement=entitlements.get(
          entitlementKey(target.entitlementCode,target.industryContextId),
        );
        if(entitlement && entitlement.valueType!==delta.valueType){
          invalid("Add-on quota delta type does not match the resolved entitlement.");
        }
        let base:number;
        if(target.mode==="FINITE" && target.value!==undefined){
          base=target.value;
        }else if(target.mode==="ADD_ON_ONLY"){
          base=0;
        }else{
          invalid("Add-on quota delta requires FINITE or ADD_ON_ONLY target limit.");
        }
        const value=numericResult(base+delta.amount,delta.valueType,"Add-on quota result");
        limits.set(
          limitKey(target.entitlementCode,target.meterCode,target.industryContextId),
          Object.freeze({...target,mode:"FINITE",value}),
        );
      }
    }
  }
}

export function applyCommercialAdjustmentPrecedenceV1(input:{
  readonly baseline:PlanVersionBaselinePreviewV1;
  readonly adjustments:CommercialPreparedAdjustmentsV1;
  readonly industryContexts:readonly PlanPreviewIndustryContextV1[];
}):CommercialAdjustmentPrecedencePreviewV1{
  const entitlements=normalizeBaselineEntitlements(input.baseline);
  const limits=normalizeBaselineLimits(input.baseline);
  const activeIndustryCodes=validateIndustryMap(input.industryContexts);
  const tenantDenySet=new Set<string>();

  applyAccessOverrides(entitlements,input.adjustments.overrides,tenantDenySet);
  applyLimitOverrides(entitlements,limits,input.adjustments.overrides);
  applyEligibleAddOns(entitlements,limits,input.adjustments,activeIndustryCodes);

  const entitlementOutput=[...entitlements.values()].sort((a,b)=>{
    const c=a.code.localeCompare(b.code);
    return c!==0?c:(a.industryContextId??"").localeCompare(b.industryContextId??"");
  });
  const limitOutput=[...limits.values()].sort((a,b)=>{
    const e=a.entitlementCode.localeCompare(b.entitlementCode);
    if(e!==0) return e;
    const m=a.meterCode.localeCompare(b.meterCode);
    return m!==0?m:(a.industryContextId??"").localeCompare(b.industryContextId??"");
  });

  return Object.freeze({
    entitlements:Object.freeze(entitlementOutput),
    limits:Object.freeze(limitOutput),
    tenantDenySet:Object.freeze([...tenantDenySet].sort()),
  });
}
