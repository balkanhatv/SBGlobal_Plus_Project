import type { RequestContext } from "../context/contracts.js";
import type { CommercialAdjustmentPrecedencePreviewV1 } from "./adjustment-precedence.js";

export interface CommercialEntitlementDenyRestrictionV1 {
  readonly effect: "DENY";
  readonly entitlementCode: string;
  readonly industryContextId?: string;
  readonly controlCode: string;
}

export interface CommercialComplianceSecurityRestrictionDecisionV1 {
  readonly targetPlanVersionId: string;
  readonly policyVersion: string;
  readonly evidenceReference: string;
  readonly restrictions: readonly CommercialEntitlementDenyRestrictionV1[];
}

export interface CommercialPreparedRestrictionInputsV1 {
  readonly targetPlanVersionId: string;
  readonly policyVersion: string;
  readonly evidenceReference: string;
  readonly restrictions: readonly CommercialEntitlementDenyRestrictionV1[];
}

export interface CommercialComplianceSecurityRestrictionResolverPort {
  evaluate(input: {
    readonly requestContext: RequestContext;
    readonly targetPlanVersionId: string;
    readonly preview: CommercialAdjustmentPrecedencePreviewV1;
  }): Promise<CommercialComplianceSecurityRestrictionDecisionV1>;
}

export type CommercialRestrictionInputErrorCode =
  | "COMMERCIAL_RESTRICTION_SCOPE_INVALID"
  | "COMMERCIAL_RESTRICTION_INPUT_INVALID"
  | "COMMERCIAL_RESTRICTION_RESOLVER_INVALID"
  | "COMMERCIAL_RESTRICTION_TARGET_INVALID";

export class CommercialRestrictionInputError extends Error {
  constructor(
    readonly code: CommercialRestrictionInputErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CommercialRestrictionInputError";
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE=/^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const POLICY=/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;
const MAX_RESTRICTIONS=1024;

function fail(code:CommercialRestrictionInputErrorCode,message:string):never{
  throw new CommercialRestrictionInputError(code,message);
}

function object(
  value:unknown,
  label:string,
  errorCode:CommercialRestrictionInputErrorCode,
):Record<string,unknown>{
  if(!value || typeof value!=="object" || Array.isArray(value)){
    fail(errorCode,label+" must be an object.");
  }
  return value as Record<string,unknown>;
}

function exactKeys(
  value:Record<string,unknown>,
  required:readonly string[],
  optional:readonly string[],
  label:string,
  errorCode:CommercialRestrictionInputErrorCode,
):void{
  for(const key of required){
    if(!(key in value)) fail(errorCode,label+" is missing "+key+".");
  }
  const allowed=new Set([...required,...optional]);
  for(const key of Object.keys(value)){
    if(!allowed.has(key)) fail(errorCode,label+" contains unknown field "+key+".");
  }
}

function uuid(
  value:unknown,
  label:string,
  errorCode:CommercialRestrictionInputErrorCode,
):string{
  if(typeof value!=="string" || !UUID.test(value)){
    fail(errorCode,"Invalid "+label+".");
  }
  return value.toLowerCase();
}

function code(
  value:unknown,
  label:string,
  errorCode:CommercialRestrictionInputErrorCode,
  max=256,
):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !CODE.test(value)){
    fail(errorCode,"Invalid "+label+".");
  }
  return value;
}

function policyToken(value:unknown,label:string,max=512):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !POLICY.test(value)){
    fail("COMMERCIAL_RESTRICTION_RESOLVER_INVALID","Invalid "+label+".");
  }
  return value;
}

function assertContext(context:RequestContext):void{
  if(context.scopeClass!=="TENANT_CORE" || context.industryContextId
    || !context.tenantId || !context.principalId || context.principalType!=="SERVICE"
    || !context.dataHomeId || !context.regionCode){
    fail(
      "COMMERCIAL_RESTRICTION_SCOPE_INVALID",
      "Commercial compliance/security restriction preparation requires a resolved Tenant Core service context.",
    );
  }
}

function entitlementKey(codeValue:string,industryContextId?:string):string{
  return codeValue+"|"+(industryContextId ?? "");
}

function previewEntitlementKeys(
  preview:CommercialAdjustmentPrecedencePreviewV1,
):ReadonlySet<string>{
  if(!preview || !Array.isArray(preview.entitlements)
    || !Array.isArray(preview.limits) || !Array.isArray(preview.tenantDenySet)){
    fail("COMMERCIAL_RESTRICTION_INPUT_INVALID","DD-071 preview shape is invalid.");
  }

  const keys=new Set<string>();
  for(const [index,item] of preview.entitlements.entries()){
    const raw=object(
      item,
      "preview entitlement["+index+"]",
      "COMMERCIAL_RESTRICTION_INPUT_INVALID",
    );
    exactKeys(
      raw,
      ["code","valueType","state"],
      ["industryContextId","value"],
      "preview entitlement["+index+"]",
      "COMMERCIAL_RESTRICTION_INPUT_INVALID",
    );
    const entitlementCode=code(
      raw.code,
      "preview entitlement code",
      "COMMERCIAL_RESTRICTION_INPUT_INVALID",
    );
    const industryContextId=raw.industryContextId===undefined
      ? undefined
      : uuid(
          raw.industryContextId,
          "preview industryContextId",
          "COMMERCIAL_RESTRICTION_INPUT_INVALID",
        );
    const key=entitlementKey(entitlementCode,industryContextId);
    if(keys.has(key)){
      fail("COMMERCIAL_RESTRICTION_INPUT_INVALID","DD-071 preview contains duplicate entitlement targets.");
    }
    keys.add(key);
  }
  return keys;
}

function normalizeDecision(
  input:unknown,
  targetPlanVersionId:string,
  entitlementKeys:ReadonlySet<string>,
):CommercialPreparedRestrictionInputsV1{
  const raw=object(
    input,
    "restriction resolver decision",
    "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
  );
  exactKeys(
    raw,
    ["targetPlanVersionId","policyVersion","evidenceReference","restrictions"],
    [],
    "restriction resolver decision",
    "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
  );

  const resolvedTarget=uuid(
    raw.targetPlanVersionId,
    "resolver targetPlanVersionId",
    "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
  );
  if(resolvedTarget!==targetPlanVersionId){
    fail(
      "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
      "Restriction resolver target PlanVersion is stale or mismatched.",
    );
  }

  const policyVersion=policyToken(raw.policyVersion,"restriction policyVersion",128);
  const evidenceReference=policyToken(
    raw.evidenceReference,
    "restriction evidenceReference",
  );
  if(!Array.isArray(raw.restrictions) || raw.restrictions.length>MAX_RESTRICTIONS){
    fail(
      "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
      "Restriction resolver output exceeds the bounded v1 restriction set.",
    );
  }

  const normalized:CommercialEntitlementDenyRestrictionV1[]=[];
  const seen=new Set<string>();
  for(const [index,item] of raw.restrictions.entries()){
    const restriction=object(
      item,
      "restriction["+index+"]",
      "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
    );
    exactKeys(
      restriction,
      ["effect","entitlementCode","controlCode"],
      ["industryContextId"],
      "restriction["+index+"]",
      "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
    );
    if(restriction.effect!=="DENY"){
      fail(
        "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
        "DD-072 v1 accepts only narrowing DENY restrictions.",
      );
    }
    const entitlementCode=code(
      restriction.entitlementCode,
      "restriction entitlementCode",
      "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
    );
    const industryContextId=restriction.industryContextId===undefined
      ? undefined
      : uuid(
          restriction.industryContextId,
          "restriction industryContextId",
          "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
        );
    const controlCode=policyToken(restriction.controlCode,"restriction controlCode",128);
    const targetKey=entitlementKey(entitlementCode,industryContextId);
    if(!entitlementKeys.has(targetKey)){
      fail(
        "COMMERCIAL_RESTRICTION_TARGET_INVALID",
        "Restriction target is absent from the exact DD-071 entitlement preview.",
      );
    }
    const identity=targetKey+"|"+controlCode;
    if(seen.has(identity)){
      fail(
        "COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
        "Restriction resolver returned a duplicate control/target tuple.",
      );
    }
    seen.add(identity);
    normalized.push(Object.freeze({
      effect:"DENY",
      entitlementCode,
      ...(industryContextId?{industryContextId}:{}),
      controlCode,
    }));
  }

  normalized.sort((a,b)=>{
    const codeOrder=a.entitlementCode.localeCompare(b.entitlementCode);
    if(codeOrder!==0) return codeOrder;
    const scopeOrder=(a.industryContextId??"").localeCompare(b.industryContextId??"");
    return scopeOrder!==0 ? scopeOrder : a.controlCode.localeCompare(b.controlCode);
  });

  return Object.freeze({
    targetPlanVersionId,
    policyVersion,
    evidenceReference,
    restrictions:Object.freeze(normalized),
  });
}

export class CommercialComplianceSecurityRestrictionInputService {
  constructor(
    private readonly resolver:CommercialComplianceSecurityRestrictionResolverPort,
  ){}

  async prepare(input:{
    readonly requestContext:RequestContext;
    readonly targetPlanVersionId:string;
    readonly preview:CommercialAdjustmentPrecedencePreviewV1;
  }):Promise<CommercialPreparedRestrictionInputsV1>{
    assertContext(input.requestContext);
    const targetPlanVersionId=uuid(
      input.targetPlanVersionId,
      "targetPlanVersionId",
      "COMMERCIAL_RESTRICTION_INPUT_INVALID",
    );
    const entitlementKeys=previewEntitlementKeys(input.preview);
    const decision=await this.resolver.evaluate({
      requestContext:input.requestContext,
      targetPlanVersionId,
      preview:input.preview,
    });
    return normalizeDecision(decision,targetPlanVersionId,entitlementKeys);
  }
}
