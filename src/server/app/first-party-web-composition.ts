import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { OperationExecutor } from "../../core/api/operation-executor.js";
import { DomainOperationRegistry } from "../../core/api/domain-operation-registry.js";
import { IdempotencyRuntimeError, IdempotencyService } from "../../core/api/idempotency.js";
import { OperationRegistry } from "../../core/api/operation-registry.js";
import { RateLimitService, type RateLimitSignalPort } from "../../core/api/rate-limit.js";
import { OperationSchemaRegistry } from "../../core/api/schema-registry.js";
import { TransportEnvelopeProjector } from "../../core/api/transport-projection.js";
import { ZodOperationDtoRegistry } from "../../core/api/zod-operation-dto.js";
import { AuthorizationDecisionService } from "../../core/authorization/decision-service.js";
import { GuardPipeline } from "../../core/authorization/guard-pipeline.js";
import type { ResourceResolverPort } from "../../core/authorization/guard-ports.js";
import { CommercialCurrentStateService } from "../../core/commercial/current-state.js";
import { RequestContextService } from "../../core/context/request-context-service.js";
import { ContextResolutionError } from "../../core/context/errors.js";
import type { VerifiedMachineEvidence } from "../../core/identity/contracts.js";
import type { MachineCredentialVerifierPort } from "../../core/identity/session-security-contracts.js";
import { IdentityRoleQueryService } from "../../core/identity/roles-query-service.js";
import { WorkspaceService } from "../../core/tenancy/workspace-service.js";
import { PostgresIdempotencyStore } from "../api/postgres-idempotency-store.js";
import { PostgresRateLimitStore } from "../api/postgres-rate-limit-store.js";
import { Sha256IdempotencyDigest } from "../api/sha256-idempotency-digest.js";
import { Sha256RateLimitDigest } from "../api/sha256-rate-limit-digest.js";
import { FirstPartyClerkBearerAuthorizationResolver } from "../api/trpc/clerk-bearer-authorization.js";
import {
  createFirstPartyCoreRouter,
  registerCoreCommercialEntitlementsGetCurrent,
  registerCoreIdentityRolesListEffective,
  registerCoreTenancyWorkspaceResolve,
} from "../api/trpc/core-identity-router.js";
import { createFirstPartyTrpcFetchHandler } from "../api/trpc/fetch-handler.js";
import {
  BoundedFirstPartyTrpcBodyPolicy,
  ConfiguredFirstPartyWebEdgePolicy,
  ExactHostFirstPartySelectorResolver,
  type FirstPartyHostSelectorBinding,
} from "../api/trpc/first-party-web-boundary.js";
import { PostgresAuthorizationAuditStore } from "../authorization/postgres-authorization-audit-store.js";
import {
  PostgresAuthorizationContextAdapter,
  PostgresEffectiveRoleReadAdapter,
} from "../authorization/postgres-authorization-context.js";
import { PostgresAuthorizationReadStore } from "../authorization/postgres-authorization-read-store.js";
import { PostgresCommercialCurrentStateStore } from "../commercial/postgres-commercial-current-state.js";
import { PostgresContextBootstrapDatabase } from "../database/postgres-context-bootstrap-database.js";
import { PostgresDatabase } from "../database/postgres-database.js";
import { PostgresIdentityDatabase } from "../database/postgres-identity-database.js";
import { PostgresRateLimiterDatabase } from "../database/postgres-rate-limiter-database.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";
import { ClerkBackendSdkAdapter } from "../identity/clerk-backend-sdk.js";
import { ClerkIdentityAdapter } from "../identity/clerk-identity-adapter.js";
import { PostgresIdentitySecurityStore } from "../identity/postgres-identity-security-store.js";
import { SessionSecurityService } from "../identity/session-security-service.js";
import { PostgresTenantContextAdapter } from "../tenancy/postgres-tenant-context.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FirstPartyWebApplicationConfig {
  readonly databaseUrl:string;
  readonly databasePoolMax:number;
  readonly dataHomeId:string;
  readonly regionCode:string;
  readonly dedicatedTenantId?:string;
  readonly clerkSecretKey:string;
  readonly clerkJwtKey:string;
  readonly clerkAuthorizedParties:readonly string[];
  readonly hostBindings:readonly FirstPartyHostSelectorBinding[];
  readonly allowedOrigins:readonly string[];
  readonly maxBodyBytes:number;
  readonly rateLimitLeaseSeconds:number;
}

export interface FirstPartyWebApplication {
  readonly handle:(request:Request)=>Promise<Response>;
  close():Promise<void>;
}

function required(env:NodeJS.ProcessEnv,key:string):string{
  const value=env[key]?.trim();
  if(!value) throw new Error("Missing required server runtime configuration: "+key+".");
  return value;
}

function positiveInteger(env:NodeJS.ProcessEnv,key:string,min:number,max:number):number{
  const raw=required(env,key);
  if(!/^[1-9][0-9]*$/.test(raw)) throw new Error("Invalid server runtime configuration: "+key+".");
  const value=Number(raw);
  if(!Number.isSafeInteger(value) || value<min || value>max){
    throw new Error("Invalid server runtime configuration: "+key+".");
  }
  return value;
}

function stringArray(env:NodeJS.ProcessEnv,key:string):readonly string[]{
  let parsed:unknown;
  try{ parsed=JSON.parse(required(env,key)); }
  catch{ throw new Error("Invalid server runtime configuration: "+key+"."); }
  if(!Array.isArray(parsed) || parsed.length===0
    || parsed.some(value=>typeof value!=="string" || value.trim().length===0)){
    throw new Error("Invalid server runtime configuration: "+key+".");
  }
  return Object.freeze([...new Set(parsed.map(value=>(value as string).trim()))]);
}

function hostBindings(env:NodeJS.ProcessEnv):readonly FirstPartyHostSelectorBinding[]{
  let parsed:unknown;
  const key="SBG_FIRST_PARTY_HOST_BINDINGS_JSON";
  try{ parsed=JSON.parse(required(env,key)); }
  catch{ throw new Error("Invalid server runtime configuration: "+key+"."); }
  if(!Array.isArray(parsed) || parsed.length===0){
    throw new Error("Invalid server runtime configuration: "+key+".");
  }
  const output=parsed.map((value,index)=>{
    if(!value || typeof value!=="object" || Array.isArray(value)){
      throw new Error("Invalid server runtime configuration: "+key+"["+index+"].");
    }
    const record=value as Record<string,unknown>;
    if(typeof record.host!=="string" || !record.host.trim()
      || typeof record.tenantSelector!=="string" || !record.tenantSelector.trim()){
      throw new Error("Invalid server runtime configuration: "+key+"["+index+"].");
    }
    for(const optional of ["industrySelector","orgUnitSelector"] as const){
      const item=record[optional];
      if(item!==undefined && (typeof item!=="string" || !item.trim())){
        throw new Error("Invalid server runtime configuration: "+key+"["+index+"].");
      }
    }
    return Object.freeze({
      host:record.host.trim(),
      tenantSelector:record.tenantSelector.trim(),
      ...(typeof record.industrySelector==="string"
        ? {industrySelector:record.industrySelector.trim()}:{}),
      ...(typeof record.orgUnitSelector==="string"
        ? {orgUnitSelector:record.orgUnitSelector.trim()}:{}),
    });
  });
  return Object.freeze(output);
}

function uuid(value:string,key:string):string{
  if(!UUID.test(value)) throw new Error("Invalid server runtime configuration: "+key+".");
  return value.toLowerCase();
}

export function readFirstPartyWebApplicationConfig(
  env:NodeJS.ProcessEnv=process.env,
):FirstPartyWebApplicationConfig{
  const dedicated=env.SBG_DEDICATED_TENANT_ID?.trim();
  return Object.freeze({
    databaseUrl:required(env,"SBG_DATABASE_URL"),
    databasePoolMax:positiveInteger(env,"SBG_DATABASE_POOL_MAX",1,200),
    dataHomeId:uuid(required(env,"SBG_DATA_HOME_ID"),"SBG_DATA_HOME_ID"),
    regionCode:required(env,"SBG_REGION_CODE"),
    ...(dedicated ? {dedicatedTenantId:uuid(dedicated,"SBG_DEDICATED_TENANT_ID")}:{}),
    clerkSecretKey:required(env,"CLERK_SECRET_KEY"),
    clerkJwtKey:required(env,"CLERK_JWT_KEY"),
    clerkAuthorizedParties:stringArray(env,"SBG_CLERK_AUTHORIZED_PARTIES_JSON"),
    hostBindings:hostBindings(env),
    allowedOrigins:stringArray(env,"SBG_FIRST_PARTY_ALLOWED_ORIGINS_JSON"),
    maxBodyBytes:positiveInteger(env,"SBG_FIRST_PARTY_MAX_BODY_BYTES",1024,16*1024*1024),
    rateLimitLeaseSeconds:positiveInteger(env,"SBG_RATE_LIMIT_LEASE_SECONDS",1,3600),
  });
}

const webOnlyMachineCredentials:MachineCredentialVerifierPort=Object.freeze({
  async verifyMachineCredential():Promise<VerifiedMachineEvidence>{
    throw new ContextResolutionError(
      "CREDENTIAL_INVALID",
      "Machine credentials are not accepted by this first-party web route.",
    );
  },
});

const unregisteredResources:ResourceResolverPort=Object.freeze({
  async resolve(){
    throw new Error("A resource resolver is not registered in this bounded composition.");
  },
});

class StructuredConsoleRateLimitSignal implements RateLimitSignalPort {
  async emitThrottle(input:Parameters<RateLimitSignalPort["emitThrottle"]>[0]):Promise<void>{
    console.warn("SBGLOBAL_RATE_LIMIT_THROTTLE",JSON.stringify(input));
  }
}

export function createFirstPartyWebApplication(
  config:FirstPartyWebApplicationConfig,
):FirstPartyWebApplication{
  const pool=new Pool({
    connectionString:config.databaseUrl,
    max:config.databasePoolMax,
  });

  const appDatabase=new PostgresDatabase(pool);
  const scopedSql=new RequestScopedSql(appDatabase,{
    dataHomeId:config.dataHomeId,
    regionCode:config.regionCode,
    ...(config.dedicatedTenantId?{dedicatedTenantId:config.dedicatedTenantId}:{}),
  });

  const identityStore=new PostgresIdentitySecurityStore(new PostgresIdentityDatabase(pool));
  const identity=new ClerkIdentityAdapter(
    new ClerkBackendSdkAdapter({
      secretKey:config.clerkSecretKey,
      jwtKey:config.clerkJwtKey,
      authorizedParties:config.clerkAuthorizedParties,
    }),
    identityStore,
    webOnlyMachineCredentials,
  );
  const commercial=new CommercialCurrentStateService(
    new PostgresCommercialCurrentStateStore(scopedSql),
  );
  const tenancy=new PostgresTenantContextAdapter(new PostgresContextBootstrapDatabase(pool));
  const contexts=new RequestContextService({
    identity,
    tenancy,
    authorization:new PostgresAuthorizationContextAdapter(scopedSql),
    commercial,
    security:new SessionSecurityService(identityStore),
    ids:{nextId:randomUUID},
  });

  const authorization=new AuthorizationDecisionService({
    readStore:new PostgresAuthorizationReadStore(scopedSql),
    supplementalFacts:commercial,
    runtime:{now:()=>new Date(),nextDecisionId:randomUUID},
  });
  const guard=new GuardPipeline({
    commercial,
    authorization,
    resources:unregisteredResources,
    audit:new PostgresAuthorizationAuditStore(scopedSql,{
      now:()=>new Date(),
      nextAuditId:randomUUID,
    }),
  });

  const idempotency=new IdempotencyService({
    store:new PostgresIdempotencyStore(scopedSql),
    digest:new Sha256IdempotencyDigest(),
    runtime:{now:()=>new Date(),nextId:randomUUID},
    window:{
      expiresAt(){
        throw new IdempotencyRuntimeError(
          "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE",
          "Command idempotency policy is not registered in this query-only composition.",
        );
      },
    },
  });

  const rateLimits=new RateLimitService({
    store:new PostgresRateLimitStore(new PostgresRateLimiterDatabase(pool)),
    digest:new Sha256RateLimitDigest(),
    runtime:{now:()=>new Date(),nextLeaseId:randomUUID},
    leasePolicy:{
      expiresAt({now}){
        return new Date(now.getTime()+(config.rateLimitLeaseSeconds*1000));
      },
    },
    signals:new StructuredConsoleRateLimitSignal(),
  });

  const operations=new OperationRegistry();
  const dtos=new ZodOperationDtoRegistry();
  const schemas=new OperationSchemaRegistry();
  const domains=new DomainOperationRegistry();
  registerCoreIdentityRolesListEffective({
    operations,
    dtos,
    schemas,
    domains,
    service:new IdentityRoleQueryService(new PostgresEffectiveRoleReadAdapter(scopedSql)),
  });
  registerCoreTenancyWorkspaceResolve({
    operations,
    dtos,
    schemas,
    domains,
    service:new WorkspaceService(tenancy),
  });
  registerCoreCommercialEntitlementsGetCurrent({
    operations,
    dtos,
    schemas,
    domains,
    service:commercial,
  });

  const projector=new TransportEnvelopeProjector();
  const executor=new OperationExecutor({
    operations,
    contexts,
    schemas,
    rateLimits,
    guards:guard,
    idempotency,
    domains,
  });
  const router=createFirstPartyCoreRouter({
    ports:{executor,schemas,dtos,projector},
    includeWorkspaceResolve:true,
    includeCommercialEntitlementsGetCurrent:true,
  });

  const edgePolicy=new ConfiguredFirstPartyWebEdgePolicy({
    allowedHosts:config.hostBindings.map(binding=>binding.host),
    allowedOrigins:config.allowedOrigins,
    maxBodyBytes:config.maxBodyBytes,
  });
  const handle=createFirstPartyTrpcFetchHandler({
    endpoint:"/api/trpc",
    router,
    identity,
    ids:{nextId:randomUUID},
    authorization:new FirstPartyClerkBearerAuthorizationResolver(),
    edgePolicy,
    bodyPolicy:new BoundedFirstPartyTrpcBodyPolicy(config.maxBodyBytes),
    selectors:new ExactHostFirstPartySelectorResolver(config.hostBindings),
    projector,
  });

  return Object.freeze({
    handle,
    async close(){ await pool.end(); },
  });
}

let singleton:FirstPartyWebApplication|undefined;

export function getFirstPartyWebHandler():(
  request:Request,
)=>Promise<Response>{
  if(!singleton){
    singleton=createFirstPartyWebApplication(readFirstPartyWebApplicationConfig());
  }
  return singleton.handle;
}
