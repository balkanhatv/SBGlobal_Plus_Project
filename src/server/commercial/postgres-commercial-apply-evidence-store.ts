import type {
  CommercialApplyEvidenceBundleV1,
  CommercialApplyEvidenceStorePort,
} from "../../core/commercial/apply-evidence-gate.js";
import { CommercialApplyEvidenceGateError } from "../../core/commercial/apply-evidence-gate.js";
import type {
  PlanChangeAssessmentRecordV1,
  PlanChangeRemediationEvidenceV1,
  PlanChangeRouteResolutionV1,
} from "../../core/commercial/plan-change-evidence.js";
import type { CommercialSubscriptionState } from "../../core/commercial/current-state.js";
import type { RequestContext } from "../../core/context/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AssessmentRow {
  readonly assessment_id:string;
  readonly assessment_version:number|string;
  readonly tenant_id:string;
  readonly subscription_id:string;
  readonly source_plan_version_id:string;
  readonly target_plan_version_id:string;
  readonly effective_timing:PlanChangeAssessmentRecordV1["effectiveTiming"];
  readonly expected_subscription_version:number|string;
  readonly route_class:PlanChangeAssessmentRecordV1["routeClass"];
  readonly route_policy_id:string;
  readonly route_policy_version:number|string;
  readonly impact_reference:string;
  readonly entitlement_diff_reference:string;
  readonly blocking_impact_codes:string[];
  readonly remediation_state:PlanChangeAssessmentRecordV1["remediationState"];
  readonly source_fingerprint:string;
  readonly correlation_id:string;
  readonly created_at:Date|string;
}
interface RouteRow {
  readonly id:string;
  readonly tenant_id:string;
  readonly assessment_id:string;
  readonly assessment_version:number|string;
  readonly route_class:PlanChangeRouteResolutionV1["routeClass"];
  readonly resolution_state:PlanChangeRouteResolutionV1["resolutionState"];
  readonly evidence_reference:string|null;
  readonly billing_preview_reference:string|null;
  readonly effective_at:Date|string|null;
  readonly producer_module:PlanChangeRouteResolutionV1["producerModule"];
  readonly evidence_version:number|string;
  readonly resolved_at:Date|string|null;
  readonly correlation_id:string;
  readonly created_at:Date|string;
}
interface RemediationRow {
  readonly id:string;
  readonly tenant_id:string;
  readonly assessment_id:string;
  readonly assessment_version:number|string;
  readonly evidence_version:number|string;
  readonly remediation_state:"SATISFIED";
  readonly evidence_reference:string;
  readonly producer_module:"Commercial";
  readonly correlation_id:string;
  readonly resolved_at:Date|string;
  readonly created_at:Date|string;
}
interface SubscriptionRow {
  readonly plan_version_id:string;
  readonly version:number|string;
  readonly state:CommercialSubscriptionState;
}
interface TargetRow {
  readonly route_policy_id:string;
  readonly route_policy_version:number|string;
  readonly self_serve_enabled:boolean;
  readonly sales_assisted_enabled:boolean;
}
interface VersionRow { readonly max_version:number|string|null; }

const USABLE=new Set<CommercialSubscriptionState>(["TRIAL","ACTIVE","GRACE"]);

function fail(
  code:"COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT"|"COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE",
  message:string,
):never{
  throw new CommercialApplyEvidenceGateError(code,message);
}
function version(value:number|string,label:string):number{
  const parsed=Number(value);
  if(!Number.isSafeInteger(parsed) || parsed<=0){
    fail("COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE","Persisted "+label+" version is invalid.");
  }
  return parsed;
}
function persistedDate(value:Date|string,label:string):Date{
  const parsed=value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if(Number.isNaN(parsed.getTime())){
    fail("COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE","Persisted "+label+" is invalid.");
  }
  return parsed;
}
function exact<T>(rows:readonly T[],label:string):T{
  if(rows.length!==1 || !rows[0]){
    fail("COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE",label+" is unavailable or ambiguous.");
  }
  return rows[0];
}
function assessment(row:AssessmentRow):PlanChangeAssessmentRecordV1{
  return Object.freeze({
    assessmentId:row.assessment_id,
    assessmentVersion:version(row.assessment_version,"assessment"),
    tenantId:row.tenant_id,
    subscriptionId:row.subscription_id,
    sourcePlanVersionId:row.source_plan_version_id,
    targetPlanVersionId:row.target_plan_version_id,
    effectiveTiming:row.effective_timing,
    expectedSubscriptionVersion:version(row.expected_subscription_version,"expected Subscription"),
    routeClass:row.route_class,
    routePolicyId:row.route_policy_id,
    routePolicyVersion:version(row.route_policy_version,"route policy"),
    impactReference:row.impact_reference,
    entitlementDiffReference:row.entitlement_diff_reference,
    blockingImpactCodes:Object.freeze([...(row.blocking_impact_codes ?? [])]),
    remediationState:row.remediation_state,
    sourceFingerprint:row.source_fingerprint,
    correlationId:row.correlation_id,
    createdAt:persistedDate(row.created_at,"assessment created_at"),
  });
}
function route(row:RouteRow):PlanChangeRouteResolutionV1{
  return Object.freeze({
    id:row.id,
    tenantId:row.tenant_id,
    assessmentId:row.assessment_id,
    assessmentVersion:version(row.assessment_version,"route assessment"),
    routeClass:row.route_class,
    resolutionState:row.resolution_state,
    ...(row.evidence_reference?{evidenceReference:row.evidence_reference}:{}),
    ...(row.billing_preview_reference?{billingPreviewReference:row.billing_preview_reference}:{}),
    ...(row.effective_at?{effectiveAt:persistedDate(row.effective_at,"route effective_at")}:{ }),
    producerModule:row.producer_module,
    evidenceVersion:version(row.evidence_version,"route evidence"),
    ...(row.resolved_at?{resolvedAt:persistedDate(row.resolved_at,"route resolved_at")}:{ }),
    correlationId:row.correlation_id,
    createdAt:persistedDate(row.created_at,"route created_at"),
  });
}
function remediation(row:RemediationRow):PlanChangeRemediationEvidenceV1{
  return Object.freeze({
    id:row.id,
    tenantId:row.tenant_id,
    assessmentId:row.assessment_id,
    assessmentVersion:version(row.assessment_version,"remediation assessment"),
    evidenceVersion:version(row.evidence_version,"remediation evidence"),
    remediationState:"SATISFIED",
    evidenceReference:row.evidence_reference,
    producerModule:"Commercial",
    correlationId:row.correlation_id,
    resolvedAt:persistedDate(row.resolved_at,"remediation resolved_at"),
    createdAt:persistedDate(row.created_at,"remediation created_at"),
  });
}

export class PostgresCommercialApplyEvidenceStore implements CommercialApplyEvidenceStorePort {
  constructor(private readonly sql:RequestScopedSql){}

  async load(
    input:Parameters<CommercialApplyEvidenceStorePort["load"]>[0],
  ):Promise<CommercialApplyEvidenceBundleV1>{
    const context=input.requestContext;
    try{
      return await this.sql.withContext(context,async tx=>{
        const assessmentRow=exact((await tx.query<AssessmentRow>(
          "SELECT assessment_id::text,assessment_version,tenant_id::text,subscription_id::text,"+
          " source_plan_version_id::text,target_plan_version_id::text,effective_timing::text,"+
          " expected_subscription_version,route_class::text,route_policy_id::text,route_policy_version,"+
          " impact_reference,entitlement_diff_reference,blocking_impact_codes,remediation_state::text,"+
          " source_fingerprint,correlation_id::text,created_at"+
          " FROM core_commercial.plan_change_assessment"+
          " WHERE tenant_id=$1::uuid AND assessment_id=$2::uuid AND assessment_version=$3",
          [context.tenantId,input.assessmentId,input.assessmentVersion],
        )).rows,"Plan-change assessment");

        const currentVersion=exact((await tx.query<VersionRow>(
          "SELECT max(assessment_version) AS max_version"+
          " FROM core_commercial.plan_change_assessment"+
          " WHERE tenant_id=$1::uuid AND assessment_id=$2::uuid",
          [context.tenantId,input.assessmentId],
        )).rows,"Current assessment version");
        if(currentVersion.max_version===null
          || version(currentVersion.max_version,"current assessment")!==input.assessmentVersion){
          fail("COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT","Assessment version is stale.");
        }

        if(assessmentRow.subscription_id!==input.subscriptionId
          || assessmentRow.source_plan_version_id!==input.sourcePlanVersionId
          || assessmentRow.target_plan_version_id!==input.targetPlanVersionId
          || version(assessmentRow.expected_subscription_version,"assessment Subscription")!==input.expectedSubscriptionVersion){
          fail("COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT","Assessment core binding changed.");
        }

        const currentSubscription=exact((await tx.query<SubscriptionRow>(
          "SELECT subscription.plan_version_id::text,subscription.version,subscription.state::text"+
          " FROM core_commercial.subscription subscription"+
          " JOIN core_tenancy.tenant tenant"+
          "   ON tenant.id=subscription.tenant_id"+
          "  AND tenant.current_subscription_id=subscription.id"+
          " WHERE subscription.tenant_id=$1::uuid AND subscription.id=$2::uuid"+
          " FOR SHARE OF subscription",
          [context.tenantId,input.subscriptionId],
        )).rows,"Current Subscription");
        if(currentSubscription.plan_version_id!==input.sourcePlanVersionId
          || version(currentSubscription.version,"current Subscription")!==input.expectedSubscriptionVersion
          || !USABLE.has(currentSubscription.state)){
          fail("COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT","Current Subscription is stale or not apply-eligible.");
        }

        const target=exact((await tx.query<TargetRow>(
          "SELECT version.route_policy_id::text,route.version AS route_policy_version,"+
          " route.self_serve_enabled,route.sales_assisted_enabled"+
          " FROM core_commercial.plan_version version"+
          " JOIN core_commercial.plan plan ON plan.id=version.plan_id AND plan.status='ACTIVE'"+
          " JOIN core_commercial.commercial_route_policy route"+
          "   ON route.id=version.route_policy_id AND route.status='ACTIVE'"+
          " WHERE version.id=$1::uuid AND version.status='ACTIVE'"+
          "   AND (version.effective_from IS NULL OR version.effective_from<=$2::timestamptz)"+
          "   AND (version.effective_to IS NULL OR version.effective_to>$2::timestamptz)",
          [input.targetPlanVersionId,input.evaluatedAt.toISOString()],
        )).rows,"Target PlanVersion route");
        if(target.route_policy_id!==assessmentRow.route_policy_id
          || version(target.route_policy_version,"current route policy")!==version(assessmentRow.route_policy_version,"assessment route policy")
          || (assessmentRow.route_class==="SELF_SERVE" && !target.self_serve_enabled)
          || (assessmentRow.route_class==="SALES_ASSISTED" && !target.sales_assisted_enabled)){
          fail("COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT","Target route policy is stale or no longer permits the assessment route.");
        }

        const routeRows=(await tx.query<RouteRow>(
          "SELECT id::text,tenant_id::text,assessment_id::text,assessment_version,route_class::text,"+
          " resolution_state::text,evidence_reference,billing_preview_reference,effective_at,"+
          " producer_module,evidence_version,resolved_at,correlation_id::text,created_at"+
          " FROM core_commercial.plan_change_route_resolution"+
          " WHERE tenant_id=$1::uuid AND assessment_id=$2::uuid AND assessment_version=$3"+
          " ORDER BY evidence_version DESC LIMIT 1",
          [context.tenantId,input.assessmentId,input.assessmentVersion],
        )).rows;

        let remediationEvidence:PlanChangeRemediationEvidenceV1|undefined;
        if(assessmentRow.remediation_state==="SATISFIED"){
          if(input.assessmentVersion<=1){
            fail("COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE","Initial assessment cannot have SATISFIED remediation.");
          }
          const remediationRows=(await tx.query<RemediationRow>(
            "SELECT id::text,tenant_id::text,assessment_id::text,assessment_version,evidence_version,"+
            " remediation_state::text,evidence_reference,producer_module,correlation_id::text,"+
            " resolved_at,created_at"+
            " FROM core_commercial.plan_change_remediation_evidence"+
            " WHERE tenant_id=$1::uuid AND assessment_id=$2::uuid AND assessment_version=$3"+
            " ORDER BY evidence_version DESC LIMIT 1",
            [context.tenantId,input.assessmentId,input.assessmentVersion-1],
          )).rows;
          if(remediationRows.length!==1 || !remediationRows[0]){
            fail("COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE","Required remediation evidence is unavailable.");
          }
          remediationEvidence=remediation(remediationRows[0]);
        }

        return Object.freeze({
          assessment:assessment(assessmentRow),
          ...(remediationEvidence?{remediationEvidence}:{}),
          ...(routeRows[0]?{routeResolution:route(routeRows[0])}:{}),
        });
      });
    }catch(error){
      if(error instanceof CommercialApplyEvidenceGateError) throw error;
      fail("COMMERCIAL_APPLY_EVIDENCE_STATE_UNAVAILABLE","Plan-change apply evidence could not be read.");
    }
  }
}
