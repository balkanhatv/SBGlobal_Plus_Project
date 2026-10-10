export type PlanVersionEntitlementValueType =
  | "BOOLEAN"
  | "INTEGER"
  | "DECIMAL"
  | "TEXT"
  | "SET";

export type PlanVersionScopeSelectorV1 =
  | Readonly<{kind:"TENANT"}>
  | Readonly<{kind:"LICENSED_INDUSTRIES"}>
  | Readonly<{kind:"INDUSTRY_CODE";industryCode:string}>;

export type PlanEntitlementGrantModeV1 =
  | "INCLUDED"
  | "NOT_INCLUDED"
  | "ADD_ON_ONLY";

export type PlanLimitModeV1 =
  | "FINITE"
  | "UNLIMITED"
  | "NOT_INCLUDED"
  | "ADD_ON_ONLY";

export interface PlanEntitlementTemplateFactV1 {
  readonly code:string;
  readonly valueType:PlanVersionEntitlementValueType;
  readonly scope:PlanVersionScopeSelectorV1;
  readonly grantMode:PlanEntitlementGrantModeV1;
  readonly value?:boolean|number|string|readonly string[];
}

export interface PlanEntitlementTemplateV1 {
  readonly schemaVersion:1;
  readonly facts:readonly PlanEntitlementTemplateFactV1[];
}

export interface PlanLimitDefinitionV1 {
  readonly entitlementCode:string;
  readonly meterCode:string;
  readonly scope:PlanVersionScopeSelectorV1;
  readonly mode:PlanLimitModeV1;
  readonly value?:number;
}

export interface PlanLimitSetV1 {
  readonly schemaVersion:1;
  readonly limits:readonly PlanLimitDefinitionV1[];
}

export type PlanVersionSchemaErrorCode =
  | "PLAN_VERSION_SCHEMA_INVALID"
  | "PLAN_VERSION_SCHEMA_UNSUPPORTED";

export class PlanVersionSchemaError extends Error {
  constructor(
    readonly code:PlanVersionSchemaErrorCode,
    message:string,
  ){
    super(message);
    this.name="PlanVersionSchemaError";
  }
}

const CODE=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const INDUSTRY=/^[A-Z][A-Z0-9_-]{1,15}$/;
const MAX_FACTS=512;
const MAX_LIMITS=256;
const MAX_SET=64;

function invalid(message:string):never{
  throw new PlanVersionSchemaError("PLAN_VERSION_SCHEMA_INVALID",message);
}

function object(value:unknown,label:string):Record<string,unknown>{
  if(!value || typeof value!=="object" || Array.isArray(value)){
    invalid(label+" must be an object.");
  }
  return value as Record<string,unknown>;
}

function exactKeys(
  value:Record<string,unknown>,
  required:readonly string[],
  optional:readonly string[],
  label:string,
):void{
  const keys=Object.keys(value);
  for(const key of required){
    if(!(key in value)) invalid(label+" is missing "+key+".");
  }
  const allowed=new Set([...required,...optional]);
  for(const key of keys){
    if(!allowed.has(key)) invalid(label+" contains unknown field "+key+".");
  }
}

function code(value:unknown,label:string,max=256):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !CODE.test(value)){
    invalid("Invalid "+label+".");
  }
  return value;
}

function valueType(value:unknown):PlanVersionEntitlementValueType{
  if(value!=="BOOLEAN" && value!=="INTEGER" && value!=="DECIMAL"
    && value!=="TEXT" && value!=="SET"){
    invalid("Invalid entitlement valueType.");
  }
  return value;
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

function factValue(
  type:PlanVersionEntitlementValueType,
  value:unknown,
):boolean|number|string|readonly string[]{
  switch(type){
    case "BOOLEAN":
      if(typeof value!=="boolean") invalid("BOOLEAN entitlement value must be boolean.");
      return value;
    case "INTEGER":
      if(!Number.isSafeInteger(value) || Number(value)<0){
        invalid("INTEGER entitlement value must be a non-negative safe integer.");
      }
      return Number(value);
    case "DECIMAL":
      if(typeof value!=="number" || !Number.isFinite(value) || value<0){
        invalid("DECIMAL entitlement value must be a non-negative finite number.");
      }
      return value;
    case "TEXT":
      if(typeof value!=="string" || value.length>256){
        invalid("TEXT entitlement value is invalid.");
      }
      return value;
    case "SET": {
      if(!Array.isArray(value) || value.length>MAX_SET){
        invalid("SET entitlement value exceeds v1 bounds.");
      }
      const items=value.map((item,index)=>code(item,"SET["+index+"]",128));
      if(new Set(items).size!==items.length){
        invalid("SET entitlement value contains duplicates.");
      }
      return Object.freeze([...items].sort());
    }
  }
}

function grantMode(value:unknown):PlanEntitlementGrantModeV1{
  if(value!=="INCLUDED" && value!=="NOT_INCLUDED" && value!=="ADD_ON_ONLY"){
    invalid("Invalid entitlement grantMode.");
  }
  return value;
}

function limitMode(value:unknown):PlanLimitModeV1{
  if(value!=="FINITE" && value!=="UNLIMITED"
    && value!=="NOT_INCLUDED" && value!=="ADD_ON_ONLY"){
    invalid("Invalid limit mode.");
  }
  return value;
}

export function parsePlanEntitlementTemplateV1(input:unknown):PlanEntitlementTemplateV1{
  const root=object(input,"entitlement template");
  exactKeys(root,["schemaVersion","facts"],[],"entitlement template");
  if(root.schemaVersion!==1){
    throw new PlanVersionSchemaError(
      "PLAN_VERSION_SCHEMA_UNSUPPORTED",
      "Unsupported entitlement template schemaVersion.",
    );
  }
  if(!Array.isArray(root.facts) || root.facts.length>MAX_FACTS){
    invalid("Entitlement template facts exceed v1 bounds.");
  }

  const seen=new Set<string>();
  const facts=root.facts.map((raw,index)=>{
    const item=object(raw,"facts["+index+"]");
    exactKeys(item,["code","valueType","scope","grantMode"],["value"],"facts["+index+"]");
    const factCode=code(item.code,"facts["+index+"].code");
    const type=valueType(item.valueType);
    const selectedScope=scope(item.scope,"facts["+index+"].scope");
    const mode=grantMode(item.grantMode);
    const key=factCode+"|"+scopeKey(selectedScope);
    if(seen.has(key)) invalid("Duplicate entitlement fact scope.");
    seen.add(key);

    if(mode==="INCLUDED"){
      if(!("value" in item)) invalid("INCLUDED entitlement fact requires value.");
      return Object.freeze({
        code:factCode,
        valueType:type,
        scope:selectedScope,
        grantMode:mode,
        value:factValue(type,item.value),
      });
    }
    if("value" in item){
      invalid(mode+" entitlement fact cannot carry value.");
    }
    return Object.freeze({
      code:factCode,
      valueType:type,
      scope:selectedScope,
      grantMode:mode,
    });
  });

  facts.sort((left,right)=>{
    const codeOrder=left.code.localeCompare(right.code);
    return codeOrder!==0 ? codeOrder : scopeKey(left.scope).localeCompare(scopeKey(right.scope));
  });
  return Object.freeze({schemaVersion:1 as const,facts:Object.freeze(facts)});
}

export function parsePlanLimitSetV1(input:unknown):PlanLimitSetV1{
  const root=object(input,"limit set");
  exactKeys(root,["schemaVersion","limits"],[],"limit set");
  if(root.schemaVersion!==1){
    throw new PlanVersionSchemaError(
      "PLAN_VERSION_SCHEMA_UNSUPPORTED",
      "Unsupported limit-set schemaVersion.",
    );
  }
  if(!Array.isArray(root.limits) || root.limits.length>MAX_LIMITS){
    invalid("Plan limit set exceeds v1 bounds.");
  }

  const seen=new Set<string>();
  const limits=root.limits.map((raw,index)=>{
    const item=object(raw,"limits["+index+"]");
    exactKeys(
      item,
      ["entitlementCode","meterCode","scope","mode"],
      ["value"],
      "limits["+index+"]",
    );
    const entitlementCode=code(item.entitlementCode,"limits["+index+"].entitlementCode");
    const meterCode=code(item.meterCode,"limits["+index+"].meterCode");
    const selectedScope=scope(item.scope,"limits["+index+"].scope");
    const mode=limitMode(item.mode);
    const key=entitlementCode+"|"+meterCode+"|"+scopeKey(selectedScope);
    if(seen.has(key)) invalid("Duplicate plan limit scope.");
    seen.add(key);

    if(mode==="FINITE"){
      if(typeof item.value!=="number" || !Number.isFinite(item.value) || item.value<0){
        invalid("FINITE plan limit requires a non-negative finite value.");
      }
      return Object.freeze({
        entitlementCode,meterCode,scope:selectedScope,mode,
        value:item.value,
      });
    }
    if("value" in item){
      invalid(mode+" plan limit cannot carry value.");
    }
    return Object.freeze({entitlementCode,meterCode,scope:selectedScope,mode});
  });

  limits.sort((left,right)=>{
    const entitlementOrder=left.entitlementCode.localeCompare(right.entitlementCode);
    if(entitlementOrder!==0) return entitlementOrder;
    const meterOrder=left.meterCode.localeCompare(right.meterCode);
    return meterOrder!==0 ? meterOrder : scopeKey(left.scope).localeCompare(scopeKey(right.scope));
  });
  return Object.freeze({schemaVersion:1 as const,limits:Object.freeze(limits)});
}
