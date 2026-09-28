import type {
  CommercialAdjustmentPrecedencePreviewV1,
  CommercialPrecedenceEntitlementV1,
  CommercialPrecedenceLimitV1,
} from "./adjustment-precedence.js";
import type {
  CommercialEntitlementDenyRestrictionV1,
  CommercialPreparedRestrictionInputsV1,
} from "./compliance-security-restriction.js";
import {
  applyCommercialLifecycleOverlayV1,
  type CommercialLifecycleOverlayV1,
} from "./lifecycle-overlay.js";
import type {
  CommercialUsageImpactItemV1,
  CommercialUsageImpactPreviewV1,
} from "./usage-impact.js";

export interface CommercialFinalTargetPreviewV1 {
  readonly targetPlanVersionId:string;
  readonly entitlements:readonly CommercialPrecedenceEntitlementV1[];
  readonly limits:readonly CommercialPrecedenceLimitV1[];
  readonly tenantDenySet:readonly string[];
  readonly restrictionPolicyVersion:string;
  readonly restrictionEvidenceReference:string;
  readonly appliedRestrictions:readonly CommercialEntitlementDenyRestrictionV1[];
  readonly usageImpact:CommercialUsageImpactPreviewV1;
  readonly lifecycle:CommercialLifecycleOverlayV1;
}

export type CommercialTargetPreviewErrorCode =
  | "COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID"
  | "COMMERCIAL_TARGET_PREVIEW_TARGET_MISMATCH"
  | "COMMERCIAL_TARGET_PREVIEW_RESTRICTION_INVALID"
  | "COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID"
  | "COMMERCIAL_TARGET_PREVIEW_LIFECYCLE_INVALID";

export class CommercialTargetPreviewError extends Error {
  constructor(
    readonly code:CommercialTargetPreviewErrorCode,
    message:string,
  ){
    super(message);
    this.name="CommercialTargetPreviewError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const TOKEN=/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;
const MAX_ITEMS=1024;

function fail(code:CommercialTargetPreviewErrorCode,message:string):never{
  throw new CommercialTargetPreviewError(code,message);
}
function uuid(value:unknown,label:string):string{
  if(typeof value!=="string" || !UUID.test(value)){
    fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Invalid "+label+".");
  }
  return value.toLowerCase();
}
function code(value:unknown,label:string,max=256):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !CODE.test(value)){
    fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Invalid "+label+".");
  }
  return value;
}
function token(value:unknown,label:string,max=512):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !TOKEN.test(value)){
    fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Invalid "+label+".");
  }
  return value;
}
function entitlementKey(entitlementCode:string,industryContextId?:string):string{
  return entitlementCode+"|"+(industryContextId??"");
}
function limitKey(entitlementCode:string,meterCode:string,industryContextId?:string):string{
  return entitlementCode+"|"+meterCode+"|"+(industryContextId??"");
}
function disabledValue(type:CommercialPrecedenceEntitlementV1["valueType"]):
  boolean|number|string|readonly string[]{
  switch(type){
    case "BOOLEAN": return false;
    case "INTEGER": return 0;
    case "DECIMAL": return 0;
    case "TEXT": return "";
    case "SET": return Object.freeze([]);
  }
}
function entitlementValue(
  type:CommercialPrecedenceEntitlementV1["valueType"],
  value:unknown,
):boolean|number|string|readonly string[]{
  // Preserve the existing DD-071 value contract at the DD-075 boundary.
  switch(type){
    case "BOOLEAN":
      if(typeof value==="boolean") return value;
      break;
    case "INTEGER":
      if(typeof value==="number" && Number.isSafeInteger(value) && value>=0) return value;
      break;
    case "DECIMAL":
      if(typeof value==="number" && Number.isFinite(value) && value>=0) return value;
      break;
    case "TEXT":
      if(typeof value==="string") return value;
      break;
    case "SET":
      if(Array.isArray(value) && [...value].every(item=>typeof item==="string")){
        return Object.freeze([...value]);
      }
      break;
  }
  fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Entitlement value does not match its declared type.");
}
function copyEntitlement(item:CommercialPrecedenceEntitlementV1):CommercialPrecedenceEntitlementV1{
  const codeValue=code(item.code,"entitlement code");
  const industryContextId=item.industryContextId===undefined
    ? undefined : uuid(item.industryContextId,"entitlement industryContextId");
  if(item.valueType!=="BOOLEAN" && item.valueType!=="INTEGER" && item.valueType!=="DECIMAL"
    && item.valueType!=="TEXT" && item.valueType!=="SET"){
    fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Unknown entitlement valueType.");
  }
  if(item.state!=="VALUE" && item.state!=="NOT_INCLUDED" && item.state!=="ADD_ON_ONLY"){
    fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Unknown entitlement state.");
  }
  if(item.state==="VALUE" && item.value===undefined){
    fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","VALUE entitlement is missing value.");
  }
  if(item.state!=="VALUE" && item.value!==undefined){
    fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Marker entitlement must not carry value.");
  }
  const value=item.state==="VALUE"
    ? entitlementValue(item.valueType,item.value)
    : undefined;
  return Object.freeze({
    code:codeValue,
    valueType:item.valueType,
    ...(industryContextId?{industryContextId}:{}),
    state:item.state,
    ...(value!==undefined?{value}:{}),
  }) as CommercialPrecedenceEntitlementV1;
}
function normalizePrecedence(preview:CommercialAdjustmentPrecedencePreviewV1):{
  entitlements:Map<string,CommercialPrecedenceEntitlementV1>;
  limits:readonly CommercialPrecedenceLimitV1[];
  tenantDenySet:Set<string>;
}{
  if(!preview || !Array.isArray(preview.entitlements)
    || !Array.isArray(preview.limits) || !Array.isArray(preview.tenantDenySet)
    || preview.entitlements.length>MAX_ITEMS || preview.limits.length>MAX_ITEMS
    || preview.tenantDenySet.length>MAX_ITEMS){
    fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","DD-071 preview shape exceeds v1 bounds.");
  }
  const entitlements=new Map<string,CommercialPrecedenceEntitlementV1>();
  for(const raw of preview.entitlements){
    const item=copyEntitlement(raw);
    const key=entitlementKey(item.code,item.industryContextId);
    if(entitlements.has(key)){
      fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Duplicate entitlement target.");
    }
    entitlements.set(key,item);
  }

  const limitSeen=new Set<string>();
  const limits=preview.limits.map(raw=>{
    const entitlementCode=code(raw.entitlementCode,"limit entitlementCode");
    const meterCode=code(raw.meterCode,"limit meterCode");
    const industryContextId=raw.industryContextId===undefined
      ? undefined : uuid(raw.industryContextId,"limit industryContextId");
    if(raw.mode!=="FINITE" && raw.mode!=="UNLIMITED"
      && raw.mode!=="NOT_INCLUDED" && raw.mode!=="ADD_ON_ONLY"){
      fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Unknown limit mode.");
    }
    if(raw.mode==="FINITE"){
      if(typeof raw.value!=="number" || !Number.isFinite(raw.value) || raw.value<0){
        fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Finite limit value is invalid.");
      }
    }else if(raw.value!==undefined){
      fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Non-finite limit must not carry a value.");
    }
    const key=limitKey(entitlementCode,meterCode,industryContextId);
    if(limitSeen.has(key)){
      fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Duplicate limit target.");
    }
    limitSeen.add(key);
    return Object.freeze({
      entitlementCode,meterCode,
      ...(industryContextId?{industryContextId}:{}),
      mode:raw.mode,
      ...(raw.mode==="FINITE"?{value:raw.value}:{}),
    }) as CommercialPrecedenceLimitV1;
  }).sort((a,b)=>{
    const e=a.entitlementCode.localeCompare(b.entitlementCode);
    if(e!==0) return e;
    const m=a.meterCode.localeCompare(b.meterCode);
    return m!==0?m:(a.industryContextId??"").localeCompare(b.industryContextId??"");
  });

  const tenantDenySet=new Set<string>();
  for(const value of preview.tenantDenySet){
    const entitlementCode=code(value,"tenant deny entitlement");
    const target=entitlements.get(entitlementKey(entitlementCode));
    if(!target){
      fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Tenant deny target is absent from Tenant entitlement preview.");
    }
    if(tenantDenySet.has(entitlementCode)){
      fail("COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID","Duplicate Tenant deny entry.");
    }
    tenantDenySet.add(entitlementCode);
  }
  return {entitlements,limits:Object.freeze(limits),tenantDenySet};
}
function applyRestrictions(
  targetPlanVersionId:string,
  entitlements:Map<string,CommercialPrecedenceEntitlementV1>,
  tenantDenySet:Set<string>,
  input:CommercialPreparedRestrictionInputsV1,
):{
  policyVersion:string;
  evidenceReference:string;
  restrictions:readonly CommercialEntitlementDenyRestrictionV1[];
}{
  if(!input || input.targetPlanVersionId!==targetPlanVersionId){
    fail("COMMERCIAL_TARGET_PREVIEW_TARGET_MISMATCH","DD-072 restriction target PlanVersion mismatch.");
  }
  const policyVersion=token(input.policyVersion,"restriction policyVersion",128);
  const evidenceReference=token(input.evidenceReference,"restriction evidenceReference");
  if(!Array.isArray(input.restrictions) || input.restrictions.length>MAX_ITEMS){
    fail("COMMERCIAL_TARGET_PREVIEW_RESTRICTION_INVALID","Restriction set exceeds v1 bounds.");
  }
  const seen=new Set<string>();
  const output:CommercialEntitlementDenyRestrictionV1[]=[];
  for(const raw of input.restrictions){
    if(raw.effect!=="DENY"){
      fail("COMMERCIAL_TARGET_PREVIEW_RESTRICTION_INVALID","Final preview accepts only DD-072 DENY restrictions.");
    }
    const entitlementCode=code(raw.entitlementCode,"restriction entitlementCode");
    const industryContextId=raw.industryContextId===undefined
      ? undefined : uuid(raw.industryContextId,"restriction industryContextId");
    const controlCode=token(raw.controlCode,"restriction controlCode",128);
    const key=entitlementKey(entitlementCode,industryContextId);
    const target=entitlements.get(key);
    if(!target){
      fail("COMMERCIAL_TARGET_PREVIEW_RESTRICTION_INVALID","Restriction target is absent from DD-071 preview.");
    }
    const identity=key+"|"+controlCode;
    if(seen.has(identity)){
      fail("COMMERCIAL_TARGET_PREVIEW_RESTRICTION_INVALID","Duplicate restriction control/target tuple.");
    }
    seen.add(identity);
    if(industryContextId){
      entitlements.set(key,Object.freeze({
        code:target.code,
        valueType:target.valueType,
        industryContextId,
        state:"VALUE",
        value:disabledValue(target.valueType),
      }));
    }else{
      tenantDenySet.add(entitlementCode);
    }
    output.push(Object.freeze({
      effect:"DENY",
      entitlementCode,
      ...(industryContextId?{industryContextId}:{}),
      controlCode,
    }));
  }
  output.sort((a,b)=>{
    const e=a.entitlementCode.localeCompare(b.entitlementCode);
    if(e!==0) return e;
    const s=(a.industryContextId??"").localeCompare(b.industryContextId??"");
    return s!==0?s:a.controlCode.localeCompare(b.controlCode);
  });
  return {
    policyVersion,
    evidenceReference,
    restrictions:Object.freeze(output),
  };
}
function normalizeUsage(
  targetPlanVersionId:string,
  limits:readonly CommercialPrecedenceLimitV1[],
  input:CommercialUsageImpactPreviewV1,
):CommercialUsageImpactPreviewV1{
  if(!input || input.targetPlanVersionId!==targetPlanVersionId){
    fail("COMMERCIAL_TARGET_PREVIEW_TARGET_MISMATCH","DD-073 usage-impact target PlanVersion mismatch.");
  }
  const selectionPolicyVersion=token(input.selectionPolicyVersion,"usage selectionPolicyVersion",128);
  const evidenceReference=token(input.evidenceReference,"usage evidenceReference");
  if(!Array.isArray(input.impacts) || input.impacts.length!==limits.length){
    fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Usage-impact set does not exactly cover target limits.");
  }
  const expected=new Map(limits.map(item=>[
    limitKey(item.entitlementCode,item.meterCode,item.industryContextId),item,
  ]));
  const seen=new Set<string>();
  const impacts:CommercialUsageImpactItemV1[]=[];
  let blocking=false;
  for(const raw of input.impacts){
    const entitlementCode=code(raw.entitlementCode,"usage impact entitlementCode");
    const meterCode=code(raw.meterCode,"usage impact meterCode");
    const industryContextId=raw.industryContextId===undefined
      ? undefined : uuid(raw.industryContextId,"usage impact industryContextId");
    const key=limitKey(entitlementCode,meterCode,industryContextId);
    const target=expected.get(key);
    if(!target || seen.has(key)){
      fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Usage impact target is missing or duplicated.");
    }
    seen.add(key);
    if(raw.targetMode!==target.mode){
      fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Usage target mode does not match DD-071 limit.");
    }
    if(target.mode==="FINITE"){
      if(raw.targetValue!==target.value){
        fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Usage target value does not match DD-071 finite limit.");
      }
    }else if(target.mode==="NOT_INCLUDED" || target.mode==="ADD_ON_ONLY"){
      if(raw.targetValue!==0){
        fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Zero-capacity target must use targetValue=0.");
      }
    }else if(raw.targetValue!==undefined){
      fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","UNLIMITED target must not carry targetValue.");
    }
    if(raw.status!=="WITHIN_TARGET" && raw.status!=="EXCEEDS_TARGET" && raw.status!=="UNLIMITED"){
      fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Unknown usage impact status.");
    }
    if(target.mode==="UNLIMITED"){
      if(raw.status!=="UNLIMITED" || raw.periodKey!==undefined || raw.usedValue!==undefined){
        fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","UNLIMITED usage impact is inconsistent.");
      }
    }else{
      if(raw.status==="UNLIMITED" || typeof raw.periodKey!=="string" || raw.periodKey.length===0
        || typeof raw.usedValue!=="number" || !Number.isFinite(raw.usedValue) || raw.usedValue<0){
        fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Bounded usage impact evidence is invalid.");
      }
      const cap=target.mode==="FINITE"?target.value!:0;
      const exceeds=raw.usedValue>cap;
      if((exceeds && raw.status!=="EXCEEDS_TARGET")
        || (!exceeds && raw.status!=="WITHIN_TARGET")){
        fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Usage impact status does not match used_value comparison.");
      }
      if(exceeds) blocking=true;
    }
    impacts.push(Object.freeze({
      entitlementCode,meterCode,
      ...(industryContextId?{industryContextId}:{}),
      targetMode:raw.targetMode,
      ...(raw.targetValue!==undefined?{targetValue:raw.targetValue}:{}),
      ...(raw.periodKey!==undefined?{periodKey:raw.periodKey}:{}),
      ...(raw.usedValue!==undefined?{usedValue:raw.usedValue}:{}),
      status:raw.status,
    }));
  }
  if(blocking!==input.hasBlockingUsage){
    fail("COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID","Aggregate blocking-usage flag is inconsistent.");
  }
  impacts.sort((a,b)=>{
    const e=a.entitlementCode.localeCompare(b.entitlementCode);
    if(e!==0) return e;
    const m=a.meterCode.localeCompare(b.meterCode);
    return m!==0?m:(a.industryContextId??"").localeCompare(b.industryContextId??"");
  });
  return Object.freeze({
    targetPlanVersionId,
    selectionPolicyVersion,
    evidenceReference,
    impacts:Object.freeze(impacts),
    hasBlockingUsage:blocking,
  });
}
function normalizeLifecycle(input:CommercialLifecycleOverlayV1):CommercialLifecycleOverlayV1{
  if(!input || typeof input!=="object"){
    fail("COMMERCIAL_TARGET_PREVIEW_LIFECYCLE_INVALID","Lifecycle overlay is missing.");
  }
  let expected:CommercialLifecycleOverlayV1;
  try{
    expected=applyCommercialLifecycleOverlayV1(input.subscriptionState);
  }catch{
    fail("COMMERCIAL_TARGET_PREVIEW_LIFECYCLE_INVALID","Lifecycle state is invalid.");
  }
  if(input.posture!==expected.posture
    || input.genericProtectedOperationsAllowed!==expected.genericProtectedOperationsAllowed
    || input.ordinaryBusinessWritesAllowed!==expected.ordinaryBusinessWritesAllowed
    || input.requiresDedicatedNonGenericPath!==expected.requiresDedicatedNonGenericPath
    || input.dataPreservationRequired!==true){
    fail("COMMERCIAL_TARGET_PREVIEW_LIFECYCLE_INVALID","Lifecycle overlay is inconsistent with DD-074.");
  }
  return expected;
}

export function materializeCommercialFinalTargetPreviewV1(input:{
  readonly targetPlanVersionId:string;
  readonly precedence:CommercialAdjustmentPrecedencePreviewV1;
  readonly restrictions:CommercialPreparedRestrictionInputsV1;
  readonly usageImpact:CommercialUsageImpactPreviewV1;
  readonly lifecycle:CommercialLifecycleOverlayV1;
}):CommercialFinalTargetPreviewV1{
  const targetPlanVersionId=uuid(input.targetPlanVersionId,"targetPlanVersionId");
  const normalized=normalizePrecedence(input.precedence);
  const restriction=applyRestrictions(
    targetPlanVersionId,
    normalized.entitlements,
    normalized.tenantDenySet,
    input.restrictions,
  );
  const usageImpact=normalizeUsage(targetPlanVersionId,normalized.limits,input.usageImpact);
  const lifecycle=normalizeLifecycle(input.lifecycle);

  const entitlements=Object.freeze([...normalized.entitlements.values()].sort((a,b)=>{
    const c=a.code.localeCompare(b.code);
    return c!==0?c:(a.industryContextId??"").localeCompare(b.industryContextId??"");
  }));

  return Object.freeze({
    targetPlanVersionId,
    entitlements,
    limits:normalized.limits,
    tenantDenySet:Object.freeze([...normalized.tenantDenySet].sort()),
    restrictionPolicyVersion:restriction.policyVersion,
    restrictionEvidenceReference:restriction.evidenceReference,
    appliedRestrictions:restriction.restrictions,
    usageImpact,
    lifecycle,
  });
}
