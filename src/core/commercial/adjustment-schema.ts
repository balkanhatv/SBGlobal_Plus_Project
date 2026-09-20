import type { CommercialEntitlementValueType } from "./current-state.js";
import type {
  PlanVersionScopeSelectorV1,
} from "./plan-version-schema.js";

export type CommercialOverrideTypeV1 =
  | "ALLOW"
  | "DENY"
  | "LIMIT_SET"
  | "LIMIT_DELTA";

export interface AddOnQuotaDeltaV1 {
  readonly entitlementCode:string;
  readonly meterCode:string;
  readonly scope:PlanVersionScopeSelectorV1;
  readonly valueType:"INTEGER"|"DECIMAL";
  readonly amount:number;
}

export interface AddOnEntitlementDeltaV1 {
  readonly schemaVersion:1;
  readonly quotaDeltas:readonly AddOnQuotaDeltaV1[];
}

export type NormalizedTenantOverrideV1 =
  | Readonly<{
      id:string;
      entitlementCode:string;
      industryContextId?:string;
      overrideType:"ALLOW";
      valueType:CommercialEntitlementValueType;
      value:boolean|number|string|readonly string[];
    }>
  | Readonly<{
      id:string;
      entitlementCode:string;
      industryContextId?:string;
      overrideType:"DENY";
      valueType:CommercialEntitlementValueType;
      representation:"TENANT_DENY_SET"|"SCOPED_DISABLED_FACT";
      disabledValue:boolean|number|string|readonly string[];
    }>
  | Readonly<{
      id:string;
      entitlementCode:string;
      industryContextId?:string;
      overrideType:"LIMIT_SET";
      valueType:"INTEGER"|"DECIMAL";
      value:number;
    }>
  | Readonly<{
      id:string;
      entitlementCode:string;
      industryContextId?:string;
      overrideType:"LIMIT_DELTA";
      valueType:"INTEGER"|"DECIMAL";
      delta:number;
    }>;

export type CommercialAdjustmentSchemaErrorCode =
  | "COMMERCIAL_ADJUSTMENT_SCHEMA_INVALID"
  | "COMMERCIAL_ADJUSTMENT_SCHEMA_UNSUPPORTED";

export class CommercialAdjustmentSchemaError extends Error {
  constructor(
    readonly code:CommercialAdjustmentSchemaErrorCode,
    message:string,
  ){
    super(message);
    this.name="CommercialAdjustmentSchemaError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const INDUSTRY=/^[A-Z][A-Z0-9_-]{1,15}$/;
const MAX_DELTAS=128;
const MAX_SET=64;

function invalid(message:string):never{
  throw new CommercialAdjustmentSchemaError("COMMERCIAL_ADJUSTMENT_SCHEMA_INVALID",message);
}
function object(value:unknown,label:string):Record<string,unknown>{
  if(!value || typeof value!=="object" || Array.isArray(value)) invalid(label+" must be an object.");
  return value as Record<string,unknown>;
}
function exactKeys(
  value:Record<string,unknown>,
  required:readonly string[],
  optional:readonly string[],
  label:string,
):void{
  for(const key of required) if(!(key in value)) invalid(label+" is missing "+key+".");
  const allowed=new Set([...required,...optional]);
  for(const key of Object.keys(value)) if(!allowed.has(key)) invalid(label+" contains unknown field "+key+".");
}
function code(value:unknown,label:string,max=256):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !CODE.test(value)){
    invalid("Invalid "+label+".");
  }
  return value;
}
function uuid(value:unknown,label:string):string{
  if(typeof value!=="string" || !UUID.test(value)) invalid("Invalid "+label+".");
  return value.toLowerCase();
}
function scope(value:unknown,label:string):PlanVersionScopeSelectorV1{
  const input=object(value,label);
  if(input.kind==="TENANT"){
    exactKeys(input,["kind"],[],label);
    return Object.freeze({kind:"TENANT"});
  }
  if(input.kind==="LICENSED_INDUSTRIES"){
    exactKeys(input,["kind"],[],label);
    return Object.freeze({kind:"LICENSED_INDUSTRIES"});
  }
  if(input.kind==="INDUSTRY_CODE"){
    exactKeys(input,["kind","industryCode"],[],label);
    if(typeof input.industryCode!=="string" || !INDUSTRY.test(input.industryCode)){
      invalid("Invalid "+label+".industryCode.");
    }
    return Object.freeze({kind:"INDUSTRY_CODE",industryCode:input.industryCode});
  }
  invalid("Invalid "+label+".kind.");
}
function scopeKey(value:PlanVersionScopeSelectorV1):string{
  return value.kind==="INDUSTRY_CODE" ? value.kind+":"+value.industryCode : value.kind;
}
function valueType(value:unknown):CommercialEntitlementValueType{
  if(value!=="BOOLEAN" && value!=="INTEGER" && value!=="DECIMAL"
    && value!=="TEXT" && value!=="SET"){
    invalid("Invalid entitlement value type.");
  }
  return value;
}
function typedValue(
  type:CommercialEntitlementValueType,
  value:unknown,
):boolean|number|string|readonly string[]{
  switch(type){
    case "BOOLEAN":
      if(typeof value!=="boolean") invalid("BOOLEAN value must be boolean.");
      return value;
    case "INTEGER":
      if(!Number.isSafeInteger(value) || Number(value)<0) invalid("INTEGER value must be non-negative safe integer.");
      return Number(value);
    case "DECIMAL":
      if(typeof value!=="number" || !Number.isFinite(value) || value<0) invalid("DECIMAL value must be non-negative finite number.");
      return value;
    case "TEXT":
      if(typeof value!=="string" || value.length>256) invalid("TEXT value is invalid.");
      return value;
    case "SET": {
      if(!Array.isArray(value) || value.length>MAX_SET) invalid("SET value exceeds v1 bounds.");
      const items=value.map((item,index)=>code(item,"SET["+index+"]",128));
      if(new Set(items).size!==items.length) invalid("SET value contains duplicates.");
      return Object.freeze([...items].sort());
    }
  }
}
function disabledValue(type:CommercialEntitlementValueType):boolean|number|string|readonly string[]{
  switch(type){
    case "BOOLEAN": return false;
    case "INTEGER": return 0;
    case "DECIMAL": return 0;
    case "TEXT": return "";
    case "SET": return Object.freeze([]);
  }
}
function numeric(
  type:CommercialEntitlementValueType,
  value:unknown,
  allowNegative:boolean,
):number{
  if(type!=="INTEGER" && type!=="DECIMAL") invalid("Limit override requires INTEGER or DECIMAL entitlement.");
  if(typeof value!=="number" || !Number.isFinite(value) || (!allowNegative && value<0)){
    invalid("Invalid numeric override value.");
  }
  if(type==="INTEGER" && !Number.isSafeInteger(value)){
    invalid("INTEGER override value must be a safe integer.");
  }
  return value;
}

export function parseAddOnEntitlementDeltaV1(input:unknown):AddOnEntitlementDeltaV1{
  const root=object(input,"add-on entitlement delta");
  exactKeys(root,["schemaVersion","quotaDeltas"],[],"add-on entitlement delta");
  if(root.schemaVersion!==1){
    throw new CommercialAdjustmentSchemaError(
      "COMMERCIAL_ADJUSTMENT_SCHEMA_UNSUPPORTED",
      "Unsupported add-on entitlement delta schemaVersion.",
    );
  }
  if(!Array.isArray(root.quotaDeltas) || root.quotaDeltas.length>MAX_DELTAS){
    invalid("Add-on quota deltas exceed v1 bounds.");
  }

  const seen=new Set<string>();
  const deltas=root.quotaDeltas.map((raw,index)=>{
    const item=object(raw,"quotaDeltas["+index+"]");
    exactKeys(
      item,
      ["entitlementCode","meterCode","scope","valueType","amount"],
      [],
      "quotaDeltas["+index+"]",
    );
    const entitlementCode=code(item.entitlementCode,"quotaDeltas["+index+"].entitlementCode");
    const meterCode=code(item.meterCode,"quotaDeltas["+index+"].meterCode");
    const selectedScope=scope(item.scope,"quotaDeltas["+index+"].scope");
    if(item.valueType!=="INTEGER" && item.valueType!=="DECIMAL"){
      invalid("Add-on quota delta valueType must be INTEGER or DECIMAL.");
    }
    const amount=numeric(item.valueType,item.amount,false);
    const key=entitlementCode+"|"+meterCode+"|"+scopeKey(selectedScope);
    if(seen.has(key)) invalid("Duplicate add-on quota delta scope.");
    seen.add(key);
    return Object.freeze({
      entitlementCode,meterCode,scope:selectedScope,
      valueType:item.valueType,amount,
    });
  });
  deltas.sort((a,b)=>{
    const e=a.entitlementCode.localeCompare(b.entitlementCode);
    if(e!==0) return e;
    const m=a.meterCode.localeCompare(b.meterCode);
    return m!==0 ? m : scopeKey(a.scope).localeCompare(scopeKey(b.scope));
  });
  return Object.freeze({schemaVersion:1 as const,quotaDeltas:Object.freeze(deltas)});
}

export function scaleAddOnQuotaDeltasV1(
  input:AddOnEntitlementDeltaV1,
  quantity:number,
):readonly AddOnQuotaDeltaV1[]{
  if(typeof quantity!=="number" || !Number.isFinite(quantity) || quantity<=0){
    invalid("Tenant add-on quantity must be positive and finite.");
  }
  return Object.freeze(input.quotaDeltas.map(delta=>{
    const amount=delta.amount*quantity;
    if(!Number.isFinite(amount) || amount<0) invalid("Scaled add-on quota is invalid.");
    if(delta.valueType==="INTEGER" && !Number.isSafeInteger(amount)){
      invalid("Scaled INTEGER add-on quota must be a safe integer.");
    }
    return Object.freeze({...delta,amount});
  }));
}

export function normalizeTenantOverrideV1(input:{
  readonly id:string;
  readonly industryContextId?:string;
  readonly entitlementCode:string;
  readonly overrideType:CommercialOverrideTypeV1;
  readonly valueType:CommercialEntitlementValueType;
  readonly value:unknown;
}):NormalizedTenantOverrideV1{
  const id=uuid(input.id,"override id");
  const industryContextId=input.industryContextId===undefined
    ? undefined : uuid(input.industryContextId,"override Industry Context id");
  const entitlementCode=code(input.entitlementCode,"override entitlement code");
  const type=valueType(input.valueType);

  if(input.overrideType==="DENY"){
    if(input.value!==true) invalid("DENY override value must be canonical true.");
    return Object.freeze({
      id,entitlementCode,...(industryContextId?{industryContextId}:{}),
      overrideType:"DENY" as const,valueType:type,
      representation:industryContextId ? "SCOPED_DISABLED_FACT" as const : "TENANT_DENY_SET" as const,
      disabledValue:disabledValue(type),
    });
  }
  if(input.overrideType==="ALLOW"){
    return Object.freeze({
      id,entitlementCode,...(industryContextId?{industryContextId}:{}),
      overrideType:"ALLOW" as const,valueType:type,
      value:typedValue(type,input.value),
    });
  }
  if(input.overrideType==="LIMIT_SET"){
    const value=numeric(type,input.value,false);
    return Object.freeze({
      id,entitlementCode,...(industryContextId?{industryContextId}:{}),
      overrideType:"LIMIT_SET" as const,valueType:type as "INTEGER"|"DECIMAL",value,
    });
  }
  if(input.overrideType==="LIMIT_DELTA"){
    const delta=numeric(type,input.value,true);
    return Object.freeze({
      id,entitlementCode,...(industryContextId?{industryContextId}:{}),
      overrideType:"LIMIT_DELTA" as const,valueType:type as "INTEGER"|"DECIMAL",delta,
    });
  }
  invalid("Invalid override type.");
}
