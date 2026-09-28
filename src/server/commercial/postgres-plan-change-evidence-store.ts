import type {
  PlanChangeAssessmentRecordV1,
  PlanChangeAssessmentStorePort,
  PlanChangeRemediationEvidenceV1,
  PlanChangeRemediationStorePort,
  PlanChangeRouteResolutionV1,
  PlanChangeResolutionStorePort,
} from "../../core/commercial/plan-change-evidence.js";
import { PlanChangeEvidenceError } from "../../core/commercial/plan-change-evidence.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

function unavailable():never{
  throw new PlanChangeEvidenceError(
    "PLAN_CHANGE_EVIDENCE_STATE_UNAVAILABLE",
    "Plan-change evidence state is unavailable or stale.",
  );
}
function iso(value:Date):string{return value.toISOString();}

export class PostgresPlanChangeAssessmentStore implements
  PlanChangeAssessmentStorePort,PlanChangeRemediationStorePort {
  constructor(private readonly sql:RequestScopedSql){}

  async recordAssessment(input:{
    readonly requestContext:Parameters<PlanChangeAssessmentStorePort["recordAssessment"]>[0]["requestContext"];
    readonly assessment:PlanChangeAssessmentRecordV1;
  }):Promise<PlanChangeAssessmentRecordV1>{
    try{
      return await this.sql.withContext(input.requestContext,async tx=>{
        const a=input.assessment;
        const result=await tx.query(
          "INSERT INTO core_commercial.plan_change_assessment("+
          " assessment_id,assessment_version,tenant_id,subscription_id,source_plan_version_id,"+
          " target_plan_version_id,effective_timing,expected_subscription_version,route_class,"+
          " route_policy_id,route_policy_version,impact_reference,entitlement_diff_reference,"+
          " blocking_impact_codes,remediation_state,source_fingerprint,correlation_id,created_at"+
          ") VALUES ("+
          " $1::uuid,$2,$3::uuid,$4::uuid,$5::uuid,$6::uuid,"+
          " $7::core_commercial.plan_change_effective_timing,$8::bigint,"+
          " $9::core_commercial.plan_change_route_class,$10::uuid,$11,$12,$13,$14::text[],"+
          " $15::core_commercial.plan_change_remediation_state,$16,$17::uuid,$18::timestamptz)",
          [
            a.assessmentId,a.assessmentVersion,a.tenantId,a.subscriptionId,a.sourcePlanVersionId,
            a.targetPlanVersionId,a.effectiveTiming,a.expectedSubscriptionVersion,a.routeClass,
            a.routePolicyId,a.routePolicyVersion,a.impactReference,a.entitlementDiffReference,
            a.blockingImpactCodes,a.remediationState,a.sourceFingerprint,a.correlationId,iso(a.createdAt),
          ],
        );
        if(result.rowCount!==1) unavailable();
        return a;
      });
    }catch(error){
      if(error instanceof PlanChangeEvidenceError) throw error;
      unavailable();
    }
  }

  async recordRemediation(input:{
    readonly requestContext:Parameters<PlanChangeRemediationStorePort["recordRemediation"]>[0]["requestContext"];
    readonly evidence:PlanChangeRemediationEvidenceV1;
  }):Promise<PlanChangeRemediationEvidenceV1>{
    try{
      return await this.sql.withContext(input.requestContext,async tx=>{
        const e=input.evidence;
        const result=await tx.query(
          "INSERT INTO core_commercial.plan_change_remediation_evidence("+
          " id,tenant_id,assessment_id,assessment_version,evidence_version,remediation_state,"+
          " evidence_reference,producer_module,correlation_id,resolved_at,created_at"+
          ") VALUES ("+
          " $1::uuid,$2::uuid,$3::uuid,$4,$5,"+
          " $6::core_commercial.plan_change_remediation_state,$7,$8,$9::uuid,$10::timestamptz,$11::timestamptz)",
          [
            e.id,e.tenantId,e.assessmentId,e.assessmentVersion,e.evidenceVersion,e.remediationState,
            e.evidenceReference,e.producerModule,e.correlationId,iso(e.resolvedAt),iso(e.createdAt),
          ],
        );
        if(result.rowCount!==1) unavailable();
        return e;
      });
    }catch(error){
      if(error instanceof PlanChangeEvidenceError) throw error;
      unavailable();
    }
  }
}

export class PostgresPlanChangeResolutionStore implements PlanChangeResolutionStorePort {
  constructor(private readonly sql:RequestScopedSql){}

  async recordResolution(input:{
    readonly requestContext:Parameters<PlanChangeResolutionStorePort["recordResolution"]>[0]["requestContext"];
    readonly resolution:PlanChangeRouteResolutionV1;
  }):Promise<PlanChangeRouteResolutionV1>{
    try{
      return await this.sql.withContext(input.requestContext,async tx=>{
        const r=input.resolution;
        const result=await tx.query(
          "INSERT INTO core_commercial.plan_change_route_resolution("+
          " id,tenant_id,assessment_id,assessment_version,route_class,resolution_state,"+
          " evidence_reference,billing_preview_reference,effective_at,producer_module,"+
          " evidence_version,resolved_at,correlation_id,created_at"+
          ") VALUES ("+
          " $1::uuid,$2::uuid,$3::uuid,$4,$5::core_commercial.plan_change_route_class,"+
          " $6::core_commercial.plan_change_resolution_state,$7,$8,$9::timestamptz,$10,$11,"+
          " $12::timestamptz,$13::uuid,$14::timestamptz)",
          [
            r.id,r.tenantId,r.assessmentId,r.assessmentVersion,r.routeClass,r.resolutionState,
            r.evidenceReference ?? null,r.billingPreviewReference ?? null,
            r.effectiveAt?iso(r.effectiveAt):null,r.producerModule,r.evidenceVersion,
            r.resolvedAt?iso(r.resolvedAt):null,r.correlationId,iso(r.createdAt),
          ],
        );
        if(result.rowCount!==1) unavailable();
        return r;
      });
    }catch(error){
      if(error instanceof PlanChangeEvidenceError) throw error;
      unavailable();
    }
  }
}
