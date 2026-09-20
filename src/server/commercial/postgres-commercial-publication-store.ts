import type {
  CommercialCompiledSnapshotFact,
  CommercialPublicationResult,
  CommercialPublicationStorePort,
} from "../../core/commercial/publication.js";
import { CommercialPublicationError } from "../../core/commercial/publication.js";
import type { CommercialSubscriptionState } from "../../core/commercial/current-state.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface SubscriptionRow {
  readonly id:string;
  readonly plan_version_id:string;
  readonly state:CommercialSubscriptionState;
  readonly version:string|number;
}
interface SnapshotRow {
  readonly id:string;
  readonly version:string|number;
  readonly source_subscription_id:string;
  readonly source_plan_version_id:string;
}
interface TenantRow {
  readonly residency_region_code:string;
  readonly current_subscription_id:string|null;
}
interface DefinitionRow { readonly code:string; readonly value_type:string; }

const USABLE=new Set<CommercialSubscriptionState>(["TRIAL","ACTIVE","GRACE"]);

function conflict(message:string):never{
  throw new CommercialPublicationError("COMMERCIAL_PUBLICATION_STATE_CONFLICT",message);
}
function unavailable(message:string):never{
  throw new CommercialPublicationError("COMMERCIAL_PUBLICATION_STATE_UNAVAILABLE",message);
}
function version(value:string|number,label:string):number{
  const parsed=Number(value);
  if(!Number.isSafeInteger(parsed) || parsed<=0 || parsed>=Number.MAX_SAFE_INTEGER){
    unavailable("Persisted "+label+" version is invalid.");
  }
  return parsed;
}
function exact<T>(rows:readonly T[],label:string):T{
  if(rows.length!==1 || !rows[0]) conflict(label+" is unavailable or ambiguous.");
  return rows[0];
}
function assertContext(context:RequestContext):void{
  if(context.scopeClass!=="TENANT_CORE" || context.industryContextId
    || !context.tenantId || !context.principalId || context.principalType!=="SERVICE"
    || !context.dataHomeId || !context.regionCode
    || !context.entitlementSnapshotId || !context.entitlementSnapshotVersion){
    throw new CommercialPublicationError(
      "COMMERCIAL_PUBLICATION_SCOPE_INVALID",
      "Commercial publication SQL requires a resolved Tenant Core service context.",
    );
  }
}
function iso(value:Date):string{
  return value.toISOString();
}

async function validateDefinitions(
  transaction:SqlTransaction,
  facts:readonly CommercialCompiledSnapshotFact[],
):Promise<void>{
  const codes=[...new Set(facts.map(fact=>fact.code))];
  if(codes.length===0) return;
  const result=await transaction.query<DefinitionRow>(
    "SELECT code,value_type::text FROM core_commercial.entitlement_definition" +
    " WHERE status='ACTIVE' AND code=ANY($1::text[])",
    [codes],
  );
  const persisted=new Map(result.rows.map(row=>[row.code,row.value_type]));
  for(const fact of facts){
    if(persisted.get(fact.code)!==fact.valueType){
      conflict("Compiled entitlement definition is missing or its value type changed.");
    }
  }
}

async function validateIndustryContexts(
  transaction:SqlTransaction,
  tenantId:string,
  facts:readonly CommercialCompiledSnapshotFact[],
):Promise<void>{
  const ids=[...new Set(
    facts.flatMap(fact=>fact.industryContextId ? [fact.industryContextId] : []),
  )];
  if(ids.length===0) return;
  const result=await transaction.query<{id:string}>(
    "SELECT id::text FROM core_tenancy.industry_context" +
    " WHERE tenant_id=$1::uuid AND id=ANY($2::uuid[]) AND status='ACTIVE'",
    [tenantId,ids],
  );
  if(result.rowCount!==ids.length){
    conflict("Compiled entitlement facts reference unavailable Industry Context.");
  }
}

function subscriptionEnvelope(input:{
  readonly context:RequestContext;
  readonly residencyRegion:string;
  readonly eventId:string;
  readonly transitionId:string;
  readonly subscriptionId:string;
  readonly fromState:CommercialSubscriptionState;
  readonly sourcePlanVersionId:string;
  readonly targetPlanVersionId:string;
  readonly subscriptionVersion:number;
  readonly triggerCode:string;
  readonly effectiveAt:Date;
  readonly occurredAt:Date;
  readonly planChangeRequestId?:string;
  readonly reasonCode?:string;
}):Readonly<Record<string,unknown>>{
  return Object.freeze({
    eventId:input.eventId,
    eventType:"subscription.transitioned",
    eventVersion:1,
    scopeClass:"TENANT_CORE",
    tenantId:input.context.tenantId,
    actorPrincipalId:input.context.principalId,
    actorType:"SERVICE",
    sourceModule:"Commercial",
    sourceResourceType:"Subscription",
    sourceResourceId:input.subscriptionId,
    aggregateVersion:input.subscriptionVersion,
    correlationId:input.context.correlationId,
    ...(input.planChangeRequestId?{causationId:input.planChangeRequestId}:{}),
    occurredAt:iso(input.occurredAt),
    dataSensitivity:"INTERNAL",
    residencyRegion:input.residencyRegion,
    payloadSchema:"subscription.transitioned.v1",
    payload:Object.freeze({
      transitionId:input.transitionId,
      subscriptionId:input.subscriptionId,
      fromState:input.fromState,
      toState:input.fromState,
      fromPlanVersionId:input.sourcePlanVersionId,
      toPlanVersionId:input.targetPlanVersionId,
      subscriptionVersion:input.subscriptionVersion,
      triggerCode:input.triggerCode,
      effectiveAt:iso(input.effectiveAt),
      ...(input.planChangeRequestId?{planChangeRequestId:input.planChangeRequestId}:{}),
      ...(input.reasonCode?{reasonCode:input.reasonCode}:{}),
    }),
  });
}

function entitlementEnvelope(input:{
  readonly context:RequestContext;
  readonly residencyRegion:string;
  readonly eventId:string;
  readonly snapshotId:string;
  readonly snapshotVersion:number;
  readonly previousSnapshotVersion:number;
  readonly subscriptionId:string;
  readonly targetPlanVersionId:string;
  readonly effectiveAt:Date;
  readonly occurredAt:Date;
  readonly planChangeRequestId?:string;
}):Readonly<Record<string,unknown>>{
  return Object.freeze({
    eventId:input.eventId,
    eventType:"entitlement.recompiled",
    eventVersion:1,
    scopeClass:"TENANT_CORE",
    tenantId:input.context.tenantId,
    actorPrincipalId:input.context.principalId,
    actorType:"SERVICE",
    sourceModule:"Commercial",
    sourceResourceType:"EntitlementSnapshot",
    sourceResourceId:input.snapshotId,
    aggregateVersion:input.snapshotVersion,
    correlationId:input.context.correlationId,
    ...(input.planChangeRequestId?{causationId:input.planChangeRequestId}:{}),
    occurredAt:iso(input.occurredAt),
    dataSensitivity:"INTERNAL",
    residencyRegion:input.residencyRegion,
    payloadSchema:"entitlement.recompiled.v1",
    payload:Object.freeze({
      snapshotId:input.snapshotId,
      snapshotVersion:input.snapshotVersion,
      sourceSubscriptionId:input.subscriptionId,
      sourcePlanVersionId:input.targetPlanVersionId,
      validFrom:iso(input.effectiveAt),
      previousSnapshotVersion:input.previousSnapshotVersion,
    }),
  });
}

export class PostgresCommercialPublicationStore implements CommercialPublicationStorePort {
  constructor(private readonly scopedSql:RequestScopedSql){}

  async publish(
    input:Parameters<CommercialPublicationStorePort["publish"]>[0],
  ):Promise<CommercialPublicationResult>{
    assertContext(input.requestContext);
    const context=input.requestContext;
    try{
      return await this.scopedSql.withContext(context,async(transaction)=>{
        const subscriptionResult=await transaction.query<SubscriptionRow>(
          "SELECT id::text,plan_version_id::text,state::text,version" +
          " FROM core_commercial.subscription" +
          " WHERE id=$1::uuid AND tenant_id=$2::uuid FOR UPDATE",
          [input.subscriptionId,context.tenantId],
        );
        const subscription=exact(subscriptionResult.rows,"Subscription");
        const currentSubscriptionVersion=version(subscription.version,"Subscription");
        if(currentSubscriptionVersion!==input.expectedSubscriptionVersion
          || subscription.plan_version_id!==input.expectedSourcePlanVersionId){
          conflict("Subscription version or source PlanVersion is stale.");
        }
        if(!USABLE.has(subscription.state)){
          conflict("Subscription state is not eligible for plan publication.");
        }

        const target=await transaction.query<{id:string}>(
          "SELECT version.id::text FROM core_commercial.plan_version version" +
          " JOIN core_commercial.plan plan ON plan.id=version.plan_id AND plan.status='ACTIVE'" +
          " JOIN core_commercial.commercial_route_policy route" +
          "   ON route.id=version.route_policy_id AND route.status='ACTIVE'" +
          " WHERE version.id=$1::uuid AND version.status='ACTIVE'" +
          "   AND (version.effective_from IS NULL OR version.effective_from<=$2::timestamptz)" +
          "   AND (version.effective_to IS NULL OR version.effective_to>$2::timestamptz)",
          [input.targetPlanVersionId,iso(input.effectiveAt)],
        );
        if(target.rowCount!==1){
          conflict("Target PlanVersion is no longer active for the effective time.");
        }

        const snapshotResult=await transaction.query<SnapshotRow>(
          "SELECT id::text,version,source_subscription_id::text,source_plan_version_id::text" +
          " FROM core_commercial.entitlement_snapshot" +
          " WHERE tenant_id=$1::uuid AND status='CURRENT'" +
          " AND valid_from<=CURRENT_TIMESTAMP" +
          " AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP) FOR UPDATE",
          [context.tenantId],
        );
        const currentSnapshot=exact(snapshotResult.rows,"Current entitlement snapshot");
        const currentSnapshotVersion=version(currentSnapshot.version,"entitlement snapshot");
        if(currentSnapshot.id!==context.entitlementSnapshotId
          || currentSnapshotVersion!==context.entitlementSnapshotVersion
          || currentSnapshot.source_subscription_id!==input.subscriptionId
          || currentSnapshot.source_plan_version_id!==input.expectedSourcePlanVersionId){
          conflict("RequestContext Commercial snapshot is stale.");
        }

        const tenant=exact((await transaction.query<TenantRow>(
          "SELECT residency_region_code,current_subscription_id::text" +
          " FROM core_tenancy.tenant WHERE id=$1::uuid",
          [context.tenantId],
        )).rows,"Tenant residency");
        if(tenant.current_subscription_id!==input.subscriptionId){
          conflict("Subscription is no longer the Tenant's current Subscription.");
        }
        if(!tenant.residency_region_code){
          unavailable("Tenant residency region is unavailable.");
        }

        await validateDefinitions(transaction,input.facts);
        await validateIndustryContexts(transaction,context.tenantId!,input.facts);

        const nextSubscriptionVersion=currentSubscriptionVersion+1;
        const nextSnapshotVersion=currentSnapshotVersion+1;

        const subscriptionUpdate=await transaction.query(
          "UPDATE core_commercial.subscription" +
          " SET plan_version_id=$4::uuid,version=$5::bigint,updated_at=$6::timestamptz" +
          " WHERE id=$1::uuid AND tenant_id=$2::uuid" +
          "   AND version=$3::bigint AND plan_version_id=$7::uuid",
          [
            input.subscriptionId,context.tenantId,currentSubscriptionVersion,
            input.targetPlanVersionId,nextSubscriptionVersion,iso(input.occurredAt),
            input.expectedSourcePlanVersionId,
          ],
        );
        if(subscriptionUpdate.rowCount!==1) conflict("Subscription update lost its optimistic lock.");

        const transition=await transaction.query(
          "INSERT INTO core_commercial.subscription_transition(" +
          " id,tenant_id,subscription_id,from_state,to_state,trigger_code," +
          " actor_principal_id,source_event_id,reason_code,occurred_at,correlation_id" +
          ") VALUES (" +
          " $1::uuid,$2::uuid,$3::uuid,$4::core_commercial.subscription_state," +
          " $4::core_commercial.subscription_state,$5,$6::uuid,$7::uuid,$8," +
          " $9::timestamptz,$10::uuid)",
          [
            input.transitionId,context.tenantId,input.subscriptionId,subscription.state,
            input.triggerCode,context.principalId,input.subscriptionEventId,
            input.reasonCode ?? null,iso(input.occurredAt),context.correlationId,
          ],
        );
        if(transition.rowCount!==1) unavailable("Subscription transition was not appended.");

        const superseded=await transaction.query(
          "UPDATE core_commercial.entitlement_snapshot SET status='SUPERSEDED'" +
          " WHERE id=$1::uuid AND tenant_id=$2::uuid AND version=$3::bigint AND status='CURRENT'",
          [currentSnapshot.id,context.tenantId,currentSnapshotVersion],
        );
        if(superseded.rowCount!==1) conflict("Current entitlement snapshot could not be superseded.");

        const snapshotInsert=await transaction.query(
          "INSERT INTO core_commercial.entitlement_snapshot(" +
          " id,tenant_id,version,source_subscription_id,source_plan_version_id," +
          " compiled_at,valid_from,source_fingerprint,status,deny_set_json,metadata_json" +
          ") VALUES (" +
          " $1::uuid,$2::uuid,$3::bigint,$4::uuid,$5::uuid,$6::timestamptz,$7::timestamptz," +
          " $8,'CURRENT',$9::jsonb,$10::jsonb)",
          [
            input.snapshotId,context.tenantId,nextSnapshotVersion,input.subscriptionId,
            input.targetPlanVersionId,iso(input.occurredAt),iso(input.effectiveAt),
            input.sourceFingerprint,JSON.stringify(input.denySet),
            JSON.stringify({publicationVersion:1,transitionId:input.transitionId}),
          ],
        );
        if(snapshotInsert.rowCount!==1) unavailable("New entitlement snapshot was not inserted.");

        for(const fact of input.facts){
          const inserted=await transaction.query(
            "INSERT INTO core_commercial.entitlement_snapshot_fact(" +
            " snapshot_id,tenant_id,entitlement_code,industry_context_id,value_json," +
            " source_type,source_id,effective_from,effective_to" +
            ") VALUES (" +
            " $1::uuid,$2::uuid,$3,$4::uuid,$5::jsonb,$6,$7::uuid,$8::timestamptz,$9::timestamptz)",
            [
              input.snapshotId,context.tenantId,fact.code,fact.industryContextId ?? null,
              JSON.stringify(fact.value),fact.sourceType,fact.sourceId,
              iso(fact.effectiveFrom),fact.effectiveTo ? iso(fact.effectiveTo) : null,
            ],
          );
          if(inserted.rowCount!==1) unavailable("Compiled entitlement fact was not inserted.");
        }

        const subscriptionEvent=subscriptionEnvelope({
          context,residencyRegion:tenant.residency_region_code,
          eventId:input.subscriptionEventId,transitionId:input.transitionId,
          subscriptionId:input.subscriptionId,fromState:subscription.state,
          sourcePlanVersionId:input.expectedSourcePlanVersionId,
          targetPlanVersionId:input.targetPlanVersionId,
          subscriptionVersion:nextSubscriptionVersion,triggerCode:input.triggerCode,
          effectiveAt:input.effectiveAt,occurredAt:input.occurredAt,
          ...(input.planChangeRequestId?{planChangeRequestId:input.planChangeRequestId}:{}),
          ...(input.reasonCode?{reasonCode:input.reasonCode}:{}),
        });
        const entitlementEvent=entitlementEnvelope({
          context,residencyRegion:tenant.residency_region_code,
          eventId:input.entitlementEventId,snapshotId:input.snapshotId,
          snapshotVersion:nextSnapshotVersion,previousSnapshotVersion:currentSnapshotVersion,
          subscriptionId:input.subscriptionId,targetPlanVersionId:input.targetPlanVersionId,
          effectiveAt:input.effectiveAt,occurredAt:input.occurredAt,
          ...(input.planChangeRequestId?{planChangeRequestId:input.planChangeRequestId}:{}),
        });

        for(const event of [
          {
            id:input.subscriptionEventId,type:"subscription.transitioned",
            aggregateType:"Subscription",aggregateId:input.subscriptionId,
            aggregateVersion:nextSubscriptionVersion,envelope:subscriptionEvent,
          },
          {
            id:input.entitlementEventId,type:"entitlement.recompiled",
            aggregateType:"EntitlementSnapshot",aggregateId:input.snapshotId,
            aggregateVersion:nextSnapshotVersion,envelope:entitlementEvent,
          },
        ]){
          await transaction.query(
            "INSERT INTO core_integration.outbox_event_identity(id,created_at)" +
            " VALUES ($1::uuid,$2::timestamptz)",
            [event.id,iso(input.occurredAt)],
          );
          const outbox=await transaction.query(
            "INSERT INTO core_integration.outbox_event(" +
            " id,tenant_id,industry_context_id,scope_class,event_type,event_version," +
            " aggregate_type,aggregate_id,aggregate_version,envelope_jsonb,status," +
            " attempt_count,available_at,created_at" +
            ") VALUES (" +
            " $1::uuid,$2::uuid,NULL,'TENANT_CORE',$3,1,$4,$5,$6::bigint,$7::jsonb," +
            " 'PENDING',0,$8::timestamptz,$8::timestamptz)",
            [
              event.id,context.tenantId,event.type,event.aggregateType,event.aggregateId,
              event.aggregateVersion,JSON.stringify(event.envelope),iso(input.occurredAt),
            ],
          );
          if(outbox.rowCount!==1) unavailable("Commercial outbox event was not appended.");
        }

        await transaction.query(
          "INSERT INTO core_audit.audit_event_identity(id,occurred_at)" +
          " VALUES ($1::uuid,$2::timestamptz)",
          [input.auditId,iso(input.occurredAt)],
        );
        const audit=await transaction.query(
          "INSERT INTO core_audit.audit_event(" +
          " id,tenant_id,industry_context_id,scope_class,occurred_at,actor_principal_id," +
          " actor_type,action_code,resource_type,resource_id,outcome,reason_code," +
          " permission_code,access_decision_id,source_module,correlation_id,causation_id," +
          " request_id,data_home_id,region_code,sensitivity_class,evidence_json,schema_version," +
          " source_industry_context_id,target_industry_context_id" +
          ") VALUES (" +
          " $1::uuid,$2::uuid,NULL,'TENANT_CORE',$3::timestamptz,$4::uuid," +
          " 'SERVICE','commercial.plan_change.publish','Subscription',$5,'SUCCESS',$6," +
          " NULL,NULL,'Commercial',$7::uuid,$8::uuid,$9,$10::uuid,$11,'INTERNAL',$12::jsonb,1,NULL,NULL)",
          [
            input.auditId,context.tenantId,iso(input.occurredAt),context.principalId,
            input.subscriptionId,input.reasonCode ?? input.triggerCode,context.correlationId,
            input.planChangeRequestId ?? null,context.requestId,context.dataHomeId,context.regionCode,
            JSON.stringify({
              transitionId:input.transitionId,
              sourcePlanVersionId:input.expectedSourcePlanVersionId,
              targetPlanVersionId:input.targetPlanVersionId,
              subscriptionVersion:nextSubscriptionVersion,
              snapshotId:input.snapshotId,
              snapshotVersion:nextSnapshotVersion,
            }),
          ],
        );
        if(audit.rowCount!==1) unavailable("Commercial audit evidence was not appended.");

        return Object.freeze({
          subscriptionId:input.subscriptionId,
          subscriptionVersion:nextSubscriptionVersion,
          transitionId:input.transitionId,
          snapshotId:input.snapshotId,
          snapshotVersion:nextSnapshotVersion,
          subscriptionEventId:input.subscriptionEventId,
          entitlementEventId:input.entitlementEventId,
          auditId:input.auditId,
        });
      });
    }catch(error){
      if(error instanceof CommercialPublicationError) throw error;
      unavailable("Commercial publication persistence is unavailable.");
    }
  }
}
