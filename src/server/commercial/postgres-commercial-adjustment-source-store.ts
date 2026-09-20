import type {
  CommercialAdjustmentSourceBundleV1,
  CommercialAdjustmentSourceStorePort,
  CommercialAddOnSourceV1,
  CommercialOverrideSourceV1,
} from "../../core/commercial/adjustment-source.js";
import { CommercialAdjustmentSourceError } from "../../core/commercial/adjustment-source.js";
import type {
  CommercialEntitlementValueType,
} from "../../core/commercial/current-state.js";
import type {
  CommercialOverrideTypeV1,
} from "../../core/commercial/adjustment-schema.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface SubscriptionRow {
  readonly version:string|number;
  readonly plan_version_id:string;
}
interface PlanVersionRow {
  readonly trial_policy_json:unknown|null;
  readonly billing_policy_json:unknown;
}
interface AddOnRow {
  readonly tenant_add_on_id:string;
  readonly tenant_add_on_version:string|number;
  readonly add_on_id:string;
  readonly add_on_code:string;
  readonly add_on_version:number;
  readonly quantity:string|number;
  readonly effective_from:Date|string;
  readonly effective_to:Date|string|null;
  readonly entitlement_delta_json:unknown;
  readonly eligibility_json:unknown;
}
interface OverrideRow {
  readonly id:string;
  readonly industry_context_id:string|null;
  readonly entitlement_code:string;
  readonly override_type:CommercialOverrideTypeV1;
  readonly value_type:CommercialEntitlementValueType;
  readonly value_json:unknown;
  readonly reason_code:string;
  readonly effective_from:Date|string;
  readonly expires_at:Date|string|null;
}

function stale(message:string):never{
  throw new CommercialAdjustmentSourceError(
    "COMMERCIAL_ADJUSTMENT_SOURCE_STALE",
    message,
  );
}
function invalid(message:string):never{
  throw new CommercialAdjustmentSourceError(
    "COMMERCIAL_ADJUSTMENT_SOURCE_PAYLOAD_INVALID",
    message,
  );
}
function positiveInteger(value:string|number,label:string):number{
  const parsed=Number(value);
  if(!Number.isSafeInteger(parsed) || parsed<=0) invalid("Invalid persisted "+label+".");
  return parsed;
}
function quantity(value:string|number):number{
  const parsed=Number(value);
  if(!Number.isFinite(parsed) || parsed<=0) invalid("Invalid active TenantAddOn quantity.");
  return parsed;
}
function date(value:Date|string,label:string):Date{
  const parsed=value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if(Number.isNaN(parsed.getTime())) invalid("Invalid persisted "+label+".");
  return parsed;
}

export class PostgresCommercialAdjustmentSourceStore
implements CommercialAdjustmentSourceStorePort {
  constructor(private readonly sql:RequestScopedSql){}

  async load(
    input:Parameters<CommercialAdjustmentSourceStorePort["load"]>[0],
  ):Promise<CommercialAdjustmentSourceBundleV1>{
    try{
      return await this.sql.withContext(input.requestContext,async transaction=>{
        const subscription=await transaction.query<SubscriptionRow>(
          "SELECT subscription.version,subscription.plan_version_id::text"+
          " FROM core_commercial.subscription subscription"+
          " JOIN core_tenancy.tenant tenant"+
          "   ON tenant.id=subscription.tenant_id"+
          "  AND tenant.current_subscription_id=subscription.id"+
          " WHERE subscription.id=$1::uuid AND subscription.tenant_id=$2::uuid"+
          "   AND subscription.version=$3::bigint"+
          "   AND subscription.plan_version_id=$4::uuid"+
          "   AND subscription.state IN ('TRIAL','ACTIVE','GRACE')"+
          " FOR SHARE",
          [
            input.subscriptionId,
            input.requestContext.tenantId,
            input.expectedSubscriptionVersion,
            input.expectedSourcePlanVersionId,
          ],
        );
        if(subscription.rowCount!==1) stale("Current Subscription binding changed.");

        const target=await transaction.query<PlanVersionRow>(
          "SELECT version.trial_policy_json,version.billing_policy_json"+
          " FROM core_commercial.plan_version version"+
          " JOIN core_commercial.plan plan ON plan.id=version.plan_id AND plan.status='ACTIVE'"+
          " JOIN core_commercial.commercial_route_policy route"+
          "   ON route.id=version.route_policy_id AND route.status='ACTIVE'"+
          " WHERE version.id=$1::uuid AND version.status='ACTIVE'"+
          "   AND (version.effective_from IS NULL OR version.effective_from<=$2::timestamptz)"+
          "   AND (version.effective_to IS NULL OR version.effective_to>$2::timestamptz)",
          [input.targetPlanVersionId,input.effectiveAt.toISOString()],
        );
        if(target.rowCount!==1 || !target.rows[0]) stale("Target PlanVersion is unavailable.");

        const addOnResult=await transaction.query<AddOnRow>(
          "SELECT tenant_add_on.id::text AS tenant_add_on_id,"+
          " tenant_add_on.version AS tenant_add_on_version,"+
          " add_on.id::text AS add_on_id,add_on.code AS add_on_code,"+
          " add_on.version AS add_on_version,tenant_add_on.quantity,"+
          " tenant_add_on.effective_from,tenant_add_on.effective_to,"+
          " add_on.entitlement_delta_json,add_on.eligibility_json"+
          " FROM core_commercial.tenant_add_on tenant_add_on"+
          " JOIN core_commercial.add_on add_on"+
          "   ON add_on.id=tenant_add_on.add_on_id AND add_on.status='ACTIVE'"+
          " WHERE tenant_add_on.tenant_id=$1::uuid"+
          "   AND tenant_add_on.subscription_id=$2::uuid"+
          "   AND tenant_add_on.status='ACTIVE'"+
          "   AND tenant_add_on.effective_from<=$3::timestamptz"+
          "   AND (tenant_add_on.effective_to IS NULL OR tenant_add_on.effective_to>$3::timestamptz)"+
          " ORDER BY tenant_add_on.id",
          [
            input.requestContext.tenantId,
            input.subscriptionId,
            input.effectiveAt.toISOString(),
          ],
        );

        const overrideResult=await transaction.query<OverrideRow>(
          "SELECT tenant_override.id::text,tenant_override.industry_context_id::text,"+
          " tenant_override.entitlement_code,tenant_override.override_type::text,"+
          " definition.value_type::text,tenant_override.value_json,"+
          " tenant_override.reason_code,tenant_override.effective_from,tenant_override.expires_at"+
          " FROM core_commercial.tenant_override tenant_override"+
          " JOIN core_commercial.entitlement_definition definition"+
          "   ON definition.code=tenant_override.entitlement_code"+
          "  AND definition.status='ACTIVE'"+
          " WHERE tenant_override.tenant_id=$1::uuid"+
          "   AND tenant_override.status='ACTIVE'"+
          "   AND tenant_override.effective_from<=$2::timestamptz"+
          "   AND (tenant_override.expires_at IS NULL OR tenant_override.expires_at>$2::timestamptz)"+
          " ORDER BY tenant_override.id",
          [input.requestContext.tenantId,input.effectiveAt.toISOString()],
        );

        const addOns:CommercialAddOnSourceV1[]=addOnResult.rows.map(row=>Object.freeze({
          tenantAddOnId:row.tenant_add_on_id,
          tenantAddOnVersion:positiveInteger(row.tenant_add_on_version,"TenantAddOn version"),
          addOnId:row.add_on_id,
          addOnCode:row.add_on_code,
          addOnVersion:positiveInteger(row.add_on_version,"AddOn version"),
          quantity:quantity(row.quantity),
          effectiveFrom:date(row.effective_from,"TenantAddOn effective_from"),
          ...(row.effective_to?{effectiveTo:date(row.effective_to,"TenantAddOn effective_to")}:{ }),
          entitlementDeltaDocument:row.entitlement_delta_json,
          eligibilityDocument:row.eligibility_json,
        }));

        const overrides:CommercialOverrideSourceV1[]=overrideResult.rows.map(row=>Object.freeze({
          id:row.id,
          ...(row.industry_context_id?{industryContextId:row.industry_context_id}:{}),
          entitlementCode:row.entitlement_code,
          overrideType:row.override_type,
          valueType:row.value_type,
          value:row.value_json,
          reasonCode:row.reason_code,
          effectiveFrom:date(row.effective_from,"override effective_from"),
          ...(row.expires_at?{expiresAt:date(row.expires_at,"override expires_at")}:{ }),
        }));

        return Object.freeze({
          subscriptionId:input.subscriptionId,
          subscriptionVersion:positiveInteger(
            subscription.rows[0]!.version,
            "Subscription version",
          ),
          sourcePlanVersionId:subscription.rows[0]!.plan_version_id,
          targetPlanVersionId:input.targetPlanVersionId,
          targetPlanPolicies:Object.freeze({
            trialPolicy:target.rows[0]!.trial_policy_json,
            billingPolicy:target.rows[0]!.billing_policy_json,
          }),
          addOns:Object.freeze(addOns),
          overrides:Object.freeze(overrides),
        });
      });
    }catch(error){
      if(error instanceof CommercialAdjustmentSourceError) throw error;
      stale("Commercial adjustment source read failed.");
    }
  }
}
