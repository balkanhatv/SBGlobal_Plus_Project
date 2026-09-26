import type { RequestContext } from "../context/contracts.js";
import type { CommercialEntitlementValueType } from "./current-state.js";
import {
  normalizeTenantOverrideV1,
  parseAddOnEntitlementDeltaV1,
  scaleAddOnQuotaDeltasV1,
  type AddOnQuotaDeltaV1,
  type CommercialOverrideTypeV1,
  type NormalizedTenantOverrideV1,
} from "./adjustment-schema.js";

export interface CommercialPlanPolicyDocumentsV1 {
  readonly trialPolicy: unknown | null;
  readonly billingPolicy: unknown;
}

export interface CommercialAddOnSourceV1 {
  readonly tenantAddOnId: string;
  readonly tenantAddOnVersion: number;
  readonly addOnId: string;
  readonly addOnCode: string;
  readonly addOnVersion: number;
  readonly quantity: number;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date;
  readonly entitlementDeltaDocument: unknown;
  readonly eligibilityDocument: unknown;
}

export interface CommercialOverrideSourceV1 {
  readonly id: string;
  readonly industryContextId?: string;
  readonly entitlementCode: string;
  readonly overrideType: CommercialOverrideTypeV1;
  readonly valueType: CommercialEntitlementValueType;
  readonly value: unknown;
  readonly reasonCode: string;
  readonly effectiveFrom: Date;
  readonly expiresAt?: Date;
}

export interface CommercialAdjustmentSourceBundleV1 {
  readonly subscriptionId: string;
  readonly subscriptionVersion: number;
  readonly sourcePlanVersionId: string;
  readonly targetPlanVersionId: string;
  readonly targetPlanPolicies: CommercialPlanPolicyDocumentsV1;
  readonly addOns: readonly CommercialAddOnSourceV1[];
  readonly overrides: readonly CommercialOverrideSourceV1[];
}

export type CommercialAddOnEligibilityStatus = "ELIGIBLE" | "INELIGIBLE";

export interface CommercialAddOnEligibilityDecisionV1 {
  readonly status: CommercialAddOnEligibilityStatus;
  readonly policyVersion: string;
  readonly evidenceReference: string;
}

export interface CommercialEligibleAddOnV1 {
  readonly tenantAddOnId: string;
  readonly addOnId: string;
  readonly addOnCode: string;
  readonly eligibility: CommercialAddOnEligibilityDecisionV1;
  readonly quotaDeltas: readonly AddOnQuotaDeltaV1[];
}

export interface CommercialIneligibleAddOnV1 {
  readonly tenantAddOnId: string;
  readonly addOnId: string;
  readonly addOnCode: string;
  readonly eligibility: CommercialAddOnEligibilityDecisionV1;
}

export interface CommercialPreparedAdjustmentsV1 {
  readonly subscriptionId: string;
  readonly subscriptionVersion: number;
  readonly sourcePlanVersionId: string;
  readonly targetPlanVersionId: string;
  readonly eligibleAddOns: readonly CommercialEligibleAddOnV1[];
  readonly ineligibleAddOns: readonly CommercialIneligibleAddOnV1[];
  readonly overrides: readonly NormalizedTenantOverrideV1[];
}

export type CommercialAdjustmentSourceErrorCode =
  | "COMMERCIAL_ADJUSTMENT_SOURCE_SCOPE_INVALID"
  | "COMMERCIAL_ADJUSTMENT_SOURCE_PAYLOAD_INVALID"
  | "COMMERCIAL_ADJUSTMENT_SOURCE_STALE"
  | "COMMERCIAL_ADJUSTMENT_ELIGIBILITY_INVALID";

export class CommercialAdjustmentSourceError extends Error {
  constructor(
    readonly code: CommercialAdjustmentSourceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CommercialAdjustmentSourceError";
  }
}

export interface CommercialAdjustmentSourceStorePort {
  load(input: {
    readonly requestContext: RequestContext;
    readonly subscriptionId: string;
    readonly expectedSubscriptionVersion: number;
    readonly expectedSourcePlanVersionId: string;
    readonly targetPlanVersionId: string;
    readonly effectiveAt: Date;
  }): Promise<CommercialAdjustmentSourceBundleV1>;
}

export interface CommercialAddOnEligibilityResolverPort {
  evaluate(input: {
    readonly requestContext: RequestContext;
    readonly targetPlanVersionId: string;
    readonly targetPlanPolicies: CommercialPlanPolicyDocumentsV1;
    readonly addOn: CommercialAddOnSourceV1;
  }): Promise<CommercialAddOnEligibilityDecisionV1>;
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POLICY=/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;

function fail(code:CommercialAdjustmentSourceErrorCode,message:string):never{
  throw new CommercialAdjustmentSourceError(code,message);
}
function uuid(value:unknown,label:string):string{
  if(typeof value!=="string" || !UUID.test(value)){
    fail("COMMERCIAL_ADJUSTMENT_SOURCE_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return value.toLowerCase();
}
function positive(value:unknown,label:string):number{
  if(!Number.isSafeInteger(value) || Number(value)<=0){
    fail("COMMERCIAL_ADJUSTMENT_SOURCE_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return Number(value);
}
function date(value:unknown,label:string):Date{
  if(!(value instanceof Date) || Number.isNaN(value.getTime())){
    fail("COMMERCIAL_ADJUSTMENT_SOURCE_PAYLOAD_INVALID","Invalid "+label+".");
  }
  return new Date(value.getTime());
}
function policyToken(value:unknown,label:string,max=512):string{
  if(typeof value!=="string" || value.length===0 || value.length>max || !POLICY.test(value)){
    fail("COMMERCIAL_ADJUSTMENT_ELIGIBILITY_INVALID","Invalid "+label+".");
  }
  return value;
}
function assertContext(context:RequestContext):void{
  if(context.scopeClass!=="TENANT_CORE" || context.industryContextId
    || !context.tenantId || !context.principalId || context.principalType!=="SERVICE"
    || !context.dataHomeId || !context.regionCode){
    fail(
      "COMMERCIAL_ADJUSTMENT_SOURCE_SCOPE_INVALID",
      "Commercial adjustment preparation requires a resolved Tenant Core service context.",
    );
  }
}
function decision(
  input:CommercialAddOnEligibilityDecisionV1,
):CommercialAddOnEligibilityDecisionV1{
  if(!input || (input.status!=="ELIGIBLE" && input.status!=="INELIGIBLE")){
    fail("COMMERCIAL_ADJUSTMENT_ELIGIBILITY_INVALID","Invalid add-on eligibility status.");
  }
  return Object.freeze({
    status:input.status,
    policyVersion:policyToken(input.policyVersion,"eligibility policyVersion",128),
    evidenceReference:policyToken(input.evidenceReference,"eligibility evidenceReference"),
  });
}

export class CommercialAdjustmentSourceService {
  constructor(private readonly ports:{
    readonly store:CommercialAdjustmentSourceStorePort;
    readonly eligibility:CommercialAddOnEligibilityResolverPort;
  }){}

  async prepare(input:{
    readonly requestContext:RequestContext;
    readonly subscriptionId:string;
    readonly expectedSubscriptionVersion:number;
    readonly expectedSourcePlanVersionId:string;
    readonly targetPlanVersionId:string;
    readonly effectiveAt:Date;
  }):Promise<CommercialPreparedAdjustmentsV1>{
    assertContext(input.requestContext);
    const subscriptionId=uuid(input.subscriptionId,"subscriptionId");
    const expectedSubscriptionVersion=positive(
      input.expectedSubscriptionVersion,
      "expectedSubscriptionVersion",
    );
    const expectedSourcePlanVersionId=uuid(
      input.expectedSourcePlanVersionId,
      "expectedSourcePlanVersionId",
    );
    const targetPlanVersionId=uuid(input.targetPlanVersionId,"targetPlanVersionId");
    if(expectedSourcePlanVersionId===targetPlanVersionId){
      fail(
        "COMMERCIAL_ADJUSTMENT_SOURCE_PAYLOAD_INVALID",
        "Target PlanVersion must differ from source PlanVersion.",
      );
    }
    const effectiveAt=date(input.effectiveAt,"effectiveAt");

    const source=await this.ports.store.load({
      requestContext:input.requestContext,
      subscriptionId,
      expectedSubscriptionVersion,
      expectedSourcePlanVersionId,
      targetPlanVersionId,
      effectiveAt,
    });

    if(source.subscriptionId!==subscriptionId
      || source.subscriptionVersion!==expectedSubscriptionVersion
      || source.sourcePlanVersionId!==expectedSourcePlanVersionId
      || source.targetPlanVersionId!==targetPlanVersionId){
      fail(
        "COMMERCIAL_ADJUSTMENT_SOURCE_STALE",
        "Commercial adjustment source binding is stale or mismatched.",
      );
    }

    const eligibleAddOns:CommercialEligibleAddOnV1[]=[];
    const ineligibleAddOns:CommercialIneligibleAddOnV1[]=[];
    const seenAddOns=new Set<string>();

    for(const addOn of source.addOns){
      const tenantAddOnId=uuid(addOn.tenantAddOnId,"tenantAddOnId");
      if(seenAddOns.has(tenantAddOnId)){
        fail(
          "COMMERCIAL_ADJUSTMENT_SOURCE_PAYLOAD_INVALID",
          "Duplicate TenantAddOn source row.",
        );
      }
      seenAddOns.add(tenantAddOnId);
      positive(addOn.tenantAddOnVersion,"tenantAddOnVersion");
      positive(addOn.addOnVersion,"addOnVersion");
      date(addOn.effectiveFrom,"addOn effectiveFrom");
      if(addOn.effectiveTo) date(addOn.effectiveTo,"addOn effectiveTo");

      const evaluated=decision(await this.ports.eligibility.evaluate({
        requestContext:input.requestContext,
        targetPlanVersionId,
        targetPlanPolicies:source.targetPlanPolicies,
        addOn,
      }));

      const identity=Object.freeze({
        tenantAddOnId,
        addOnId:uuid(addOn.addOnId,"addOnId"),
        addOnCode:policyToken(addOn.addOnCode,"addOnCode",128),
        eligibility:evaluated,
      });

      if(evaluated.status==="INELIGIBLE"){
        ineligibleAddOns.push(identity);
        continue;
      }

      const delta=parseAddOnEntitlementDeltaV1(addOn.entitlementDeltaDocument);
      eligibleAddOns.push(Object.freeze({
        ...identity,
        quotaDeltas:scaleAddOnQuotaDeltasV1(delta,addOn.quantity),
      }));
    }

    const overrides=source.overrides.map(row=>normalizeTenantOverrideV1({
      id:row.id,
      ...(row.industryContextId?{industryContextId:row.industryContextId}:{}),
      entitlementCode:row.entitlementCode,
      overrideType:row.overrideType,
      valueType:row.valueType,
      value:row.value,
    }));

    eligibleAddOns.sort((a,b)=>a.tenantAddOnId.localeCompare(b.tenantAddOnId));
    ineligibleAddOns.sort((a,b)=>a.tenantAddOnId.localeCompare(b.tenantAddOnId));
    overrides.sort((a,b)=>a.id.localeCompare(b.id));

    return Object.freeze({
      subscriptionId,
      subscriptionVersion:expectedSubscriptionVersion,
      sourcePlanVersionId:expectedSourcePlanVersionId,
      targetPlanVersionId,
      eligibleAddOns:Object.freeze(eligibleAddOns),
      ineligibleAddOns:Object.freeze(ineligibleAddOns),
      overrides:Object.freeze(overrides),
    });
  }
}
