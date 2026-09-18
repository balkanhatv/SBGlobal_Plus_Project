import type { OperationContract } from "./operation-contract.js";
import type { RequestContext } from "../context/contracts.js";

export type SecurityRateClassV1 =
  | "PUBLIC_LOW"
  | "PUBLIC_STANDARD"
  | "AUTH_STANDARD"
  | "ADMIN_SENSITIVE"
  | "AUTH_SECURITY"
  | "BULK"
  | "WEBHOOK"
  | "AI"
  | "FILE_UPLOAD"
  | "API_CREDENTIAL"
  | "TENANT_AGGREGATE"
  | "EXTERNAL_WRITE";

export type RateLimitDimension =
  | "IP"
  | "PRINCIPAL"
  | "CREDENTIAL"
  | "TENANT"
  | "ENDPOINT";

export interface SecurityRatePolicyRuleV1 {
  readonly rateClass: SecurityRateClassV1;
  readonly maxRequests: number;
  readonly windowSeconds: number;
  readonly burstCapacity: number;
  readonly concurrencyLimit?: number;
}

export const SECURITY_RATE_POLICY_V1: Readonly<Record<SecurityRateClassV1, SecurityRatePolicyRuleV1>> =
  Object.freeze({
    PUBLIC_LOW: Object.freeze({rateClass:"PUBLIC_LOW",maxRequests:30,windowSeconds:60,burstCapacity:10}),
    PUBLIC_STANDARD: Object.freeze({rateClass:"PUBLIC_STANDARD",maxRequests:120,windowSeconds:60,burstCapacity:30}),
    AUTH_STANDARD: Object.freeze({rateClass:"AUTH_STANDARD",maxRequests:600,windowSeconds:60,burstCapacity:120}),
    ADMIN_SENSITIVE: Object.freeze({rateClass:"ADMIN_SENSITIVE",maxRequests:60,windowSeconds:60,burstCapacity:15}),
    AUTH_SECURITY: Object.freeze({rateClass:"AUTH_SECURITY",maxRequests:20,windowSeconds:300,burstCapacity:5}),
    BULK: Object.freeze({rateClass:"BULK",maxRequests:30,windowSeconds:3600,burstCapacity:30,concurrencyLimit:2}),
    WEBHOOK: Object.freeze({rateClass:"WEBHOOK",maxRequests:600,windowSeconds:60,burstCapacity:600}),
    AI: Object.freeze({rateClass:"AI",maxRequests:60,windowSeconds:60,burstCapacity:60,concurrencyLimit:8}),
    FILE_UPLOAD: Object.freeze({rateClass:"FILE_UPLOAD",maxRequests:60,windowSeconds:3600,burstCapacity:60}),
    API_CREDENTIAL: Object.freeze({rateClass:"API_CREDENTIAL",maxRequests:1200,windowSeconds:60,burstCapacity:1200}),
    TENANT_AGGREGATE: Object.freeze({rateClass:"TENANT_AGGREGATE",maxRequests:3000,windowSeconds:60,burstCapacity:3000}),
    EXTERNAL_WRITE: Object.freeze({rateClass:"EXTERNAL_WRITE",maxRequests:120,windowSeconds:60,burstCapacity:120}),
  });

export type RateLimitRuntimeErrorCode =
  | "RATE_LIMITED"
  | "POLICY_DENIED"
  | "RATE_CONTEXT_INVALID"
  | "DEPENDENCY_UNAVAILABLE";

export class RateLimitRuntimeError extends Error {
  readonly code: RateLimitRuntimeErrorCode;
  readonly retryAfterSeconds?: number;
  readonly rateClass?: SecurityRateClassV1;
  readonly dimension?: RateLimitDimension;

  constructor(input: {
    readonly code: RateLimitRuntimeErrorCode;
    readonly message: string;
    readonly retryAfterSeconds?: number;
    readonly rateClass?: SecurityRateClassV1;
    readonly dimension?: RateLimitDimension;
  }) {
    super(input.message);
    this.name="RateLimitRuntimeError";
    this.code=input.code;
    this.retryAfterSeconds=input.retryAfterSeconds;
    this.rateClass=input.rateClass;
    this.dimension=input.dimension;
  }
}

export interface RateLimitSubject {
  readonly endpointKey?: string;
}

export interface RateLimitOverride {
  readonly rateClass: SecurityRateClassV1;
  readonly dimension: RateLimitDimension;
  readonly maxRequests?: number;
  readonly burstCapacity?: number;
  readonly concurrencyLimit?: number;
}

export interface RateLimitOverridePort {
  resolve(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly baseRules: readonly RateLimitRule[];
  }): Promise<readonly RateLimitOverride[]>;
}

export interface RateLimitDigestPort {
  sha256(value: string): string;
}

export interface RateLimitRuntimePort {
  now(): Date;
  nextLeaseId(): string;
}

export interface RateLimitLeasePolicyPort {
  expiresAt(input: {
    readonly now: Date;
    readonly operation: OperationContract;
  }): Date;
}

export interface RateLimitRule {
  readonly rateClass: SecurityRateClassV1;
  readonly dimension: RateLimitDimension;
  readonly rawSubject: string;
  readonly maxRequests: number;
  readonly windowSeconds: number;
  readonly burstCapacity: number;
  readonly concurrencyLimit?: number;
}

export interface RateLimitStoreRule {
  readonly bucketKeyHash: string;
  readonly policyVersion: 1;
  readonly rateClass: SecurityRateClassV1;
  readonly dimension: RateLimitDimension;
  readonly capacity: number;
  readonly refillPerSecond: number;
  readonly concurrencyLimit?: number;
  readonly leaseId?: string;
}

export type RateLimitStoreAcquireResult =
  | {
      readonly allowed: true;
      readonly leases: readonly { readonly leaseId: string; readonly bucketKeyHash: string }[];
    }
  | {
      readonly allowed: false;
      readonly retryAfterSeconds: number;
      readonly rateClass: SecurityRateClassV1;
      readonly dimension: RateLimitDimension;
    };

export interface RateLimitStorePort {
  acquire(input: {
    readonly now: Date;
    readonly leaseExpiresAt: Date;
    readonly rules: readonly RateLimitStoreRule[];
  }): Promise<RateLimitStoreAcquireResult>;
  release(input: {
    readonly leaseIds: readonly string[];
  }): Promise<void>;
}

export interface RateLimitAcquisition {
  readonly leases: readonly { readonly leaseId: string; readonly bucketKeyHash: string }[];
}

export interface RateLimitSignalPort {
  emitThrottle(input: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly scopeClass: RequestContext["scopeClass"];
    readonly operationId: string;
    readonly rateClass: SecurityRateClassV1;
    readonly dimension: RateLimitDimension;
    readonly retryAfterSeconds: number;
  }): Promise<void>;
}

export interface RateLimitServicePorts {
  readonly store: RateLimitStorePort;
  readonly digest: RateLimitDigestPort;
  readonly runtime: RateLimitRuntimePort;
  readonly leasePolicy: RateLimitLeasePolicyPort;
  readonly signals: RateLimitSignalPort;
  readonly overrides?: RateLimitOverridePort;
}

const HEX64=/^[0-9a-f]{64}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function alias(value: string): SecurityRateClassV1 {
  switch(value){
    case "PUBLIC_LOW": return "PUBLIC_LOW";
    case "PUBLIC_STANDARD": return "PUBLIC_STANDARD";
    case "AUTH_STANDARD": return "AUTH_STANDARD";
    case "AUTH_HIGH_COST": return "ADMIN_SENSITIVE";
    case "ADMIN_SENSITIVE": return "ADMIN_SENSITIVE";
    case "AUTH_SECURITY": return "AUTH_SECURITY";
    case "BULK": return "BULK";
    case "WEBHOOK":
    case "WEBHOOK_ADMIN": return "WEBHOOK";
    case "AI":
    case "AI_COSTED": return "AI";
    case "FILE_UPLOAD": return "FILE_UPLOAD";
    case "API_CREDENTIAL": return "API_CREDENTIAL";
    case "TENANT_AGGREGATE": return "TENANT_AGGREGATE";
    case "EXTERNAL_WRITE": return "EXTERNAL_WRITE";
    default:
      throw new RateLimitRuntimeError({
        code:"POLICY_DENIED",
        message:"The operation rate class is not governed by the active security policy.",
      });
  }
}

function baseRule(rateClass: SecurityRateClassV1,dimension:RateLimitDimension,rawSubject:string):RateLimitRule{
  const policy=SECURITY_RATE_POLICY_V1[rateClass];
  const tenantConcurrency =
    dimension==="TENANT" && (rateClass==="AI" || rateClass==="BULK")
      ? policy.concurrencyLimit
      : undefined;
  return Object.freeze({
    rateClass:policy.rateClass,
    maxRequests:policy.maxRequests,
    windowSeconds:policy.windowSeconds,
    burstCapacity:policy.burstCapacity,
    ...(tenantConcurrency!==undefined?{concurrencyLimit:tenantConcurrency}:{}),
    dimension,
    rawSubject,
  });
}

function dedupe(rules: readonly RateLimitRule[]): RateLimitRule[] {
  const map=new Map<string,RateLimitRule>();
  for(const rule of rules){
    const key=`${rule.rateClass}:${rule.dimension}:${rule.rawSubject}`;
    if(!map.has(key)) map.set(key,rule);
  }
  return [...map.values()];
}

function buildBaseRules(
  context: RequestContext,
  operation: OperationContract,
  subject: RateLimitSubject,
): RateLimitRule[] {
  const rateClass=alias(operation.rateClass);
  const rules:RateLimitRule[]=[];

  if(context.scopeClass==="PUBLIC"){
    if(!context.actorIpHash) throw new RateLimitRuntimeError({
      code:"RATE_CONTEXT_INVALID",
      message:"Public rate limiting requires a server-owned network identity.",
    });
    rules.push(baseRule(rateClass,"IP",context.actorIpHash));
    return dedupe(rules);
  }

  if(rateClass==="WEBHOOK"){
    if(!subject.endpointKey) throw new RateLimitRuntimeError({
      code:"RATE_CONTEXT_INVALID",
      message:"Webhook rate limiting requires a verified endpoint identity.",
    });
    rules.push(baseRule("WEBHOOK","ENDPOINT",subject.endpointKey));
  } else {
    if(context.principalId) rules.push(baseRule(rateClass,"PRINCIPAL",context.principalId));
    if(context.credentialId) rules.push(baseRule(rateClass,"CREDENTIAL",context.credentialId));
    if(context.actorIpHash) rules.push(baseRule(rateClass,"IP",context.actorIpHash));
  }

  if(context.tenantId){
    const tenantPrimary = rateClass==="AI" || rateClass==="BULK";
    if(tenantPrimary) rules.push(baseRule(rateClass,"TENANT",context.tenantId));
    rules.push(baseRule("TENANT_AGGREGATE","TENANT",context.tenantId));
  }
  if(context.credentialId){
    rules.push(baseRule("API_CREDENTIAL","CREDENTIAL",context.credentialId));
  }

  if(rules.length===0) throw new RateLimitRuntimeError({
    code:"RATE_CONTEXT_INVALID",
    message:"No governed rate-limit subject is available.",
  });
  return dedupe(rules);
}

function applyOverrides(
  baseRules: readonly RateLimitRule[],
  overrides: readonly RateLimitOverride[],
): RateLimitRule[] {
  const output=baseRules.map(rule=>({...rule}));
  for(const override of overrides){
    const matches=output.filter(rule=>
      rule.rateClass===override.rateClass && rule.dimension===override.dimension);
    if(matches.length===0) throw new RateLimitRuntimeError({
      code:"POLICY_DENIED",
      message:"Rate-limit override does not match an applicable governed bucket.",
    });
    for(const rule of matches){
      if(override.maxRequests!==undefined){
        if(!Number.isSafeInteger(override.maxRequests) || override.maxRequests<=0
          || override.maxRequests>rule.maxRequests){
          throw new RateLimitRuntimeError({code:"POLICY_DENIED",message:"Rate-limit override would weaken the platform policy."});
        }
        rule.maxRequests=override.maxRequests;
      }
      if(override.burstCapacity!==undefined){
        if(!Number.isSafeInteger(override.burstCapacity) || override.burstCapacity<=0
          || override.burstCapacity>rule.burstCapacity
          || override.burstCapacity>rule.maxRequests){
          throw new RateLimitRuntimeError({code:"POLICY_DENIED",message:"Rate-limit burst override would weaken the platform policy."});
        }
        rule.burstCapacity=override.burstCapacity;
      }
      if(override.concurrencyLimit!==undefined){
        if(rule.concurrencyLimit===undefined
          || !Number.isSafeInteger(override.concurrencyLimit)
          || override.concurrencyLimit<=0
          || override.concurrencyLimit>rule.concurrencyLimit){
          throw new RateLimitRuntimeError({code:"POLICY_DENIED",message:"Rate-limit concurrency override would weaken the platform policy."});
        }
        rule.concurrencyLimit=override.concurrencyLimit;
      }
    }
  }
  return output.map(rule=>Object.freeze(rule));
}

export class RateLimitService {
  constructor(private readonly ports: RateLimitServicePorts) {}

  async acquire(input:{
    readonly requestContext:RequestContext;
    readonly operation:OperationContract;
    readonly subject?:RateLimitSubject;
  }):Promise<RateLimitAcquisition>{
    const now=this.ports.runtime.now();
    if(!(now instanceof Date) || Number.isNaN(now.getTime())) throw new RateLimitRuntimeError({
      code:"DEPENDENCY_UNAVAILABLE",message:"Rate-limit clock is unavailable.",
    });

    let rules=buildBaseRules(input.requestContext,input.operation,input.subject??{});
    if(this.ports.overrides){
      let overrides:readonly RateLimitOverride[];
      try{
        overrides=await this.ports.overrides.resolve({
          requestContext:input.requestContext,operation:input.operation,baseRules:rules,
        });
      }catch(error){
        if(error instanceof RateLimitRuntimeError) throw error;
        throw new RateLimitRuntimeError({code:"DEPENDENCY_UNAVAILABLE",message:"Rate-limit policy resolution is unavailable."});
      }
      rules=applyOverrides(rules,overrides);
    }

    const leaseExpiresAt=this.ports.leasePolicy.expiresAt({now,operation:input.operation});
    if(!(leaseExpiresAt instanceof Date) || Number.isNaN(leaseExpiresAt.getTime())
      || leaseExpiresAt.getTime()<=now.getTime()){
      throw new RateLimitRuntimeError({code:"DEPENDENCY_UNAVAILABLE",message:"Rate-limit lease policy is unavailable."});
    }

    const storeRules:RateLimitStoreRule[]=[];
    for(const rule of rules){
      const bucketKeyHash=this.ports.digest.sha256(
        `security-rate:v1:${rule.rateClass}:${rule.dimension}:${rule.rawSubject}`,
      ).toLowerCase();
      if(!HEX64.test(bucketKeyHash)) throw new RateLimitRuntimeError({
        code:"DEPENDENCY_UNAVAILABLE",message:"Rate-limit digest service is unavailable.",
      });
      const leaseId=rule.concurrencyLimit!==undefined ? this.ports.runtime.nextLeaseId() : undefined;
      if(leaseId!==undefined && !UUID.test(leaseId)) throw new RateLimitRuntimeError({
        code:"DEPENDENCY_UNAVAILABLE",message:"Rate-limit lease identity service is unavailable.",
      });
      storeRules.push(Object.freeze({
        bucketKeyHash,policyVersion:1,rateClass:rule.rateClass,dimension:rule.dimension,
        capacity:rule.burstCapacity,
        refillPerSecond:rule.maxRequests/rule.windowSeconds,
        ...(rule.concurrencyLimit!==undefined?{concurrencyLimit:rule.concurrencyLimit}:{}),
        ...(leaseId?{leaseId}:{}),
      }));
    }
    storeRules.sort((a,b)=>a.bucketKeyHash.localeCompare(b.bucketKeyHash));

    let result:RateLimitStoreAcquireResult;
    try{
      result=await this.ports.store.acquire({now,leaseExpiresAt,rules:storeRules});
    }catch(error){
      if(error instanceof RateLimitRuntimeError) throw error;
      throw new RateLimitRuntimeError({code:"DEPENDENCY_UNAVAILABLE",message:"Rate-limit state is unavailable."});
    }
    if(!result.allowed) {
      const retryAfterSeconds=Math.max(1,Math.ceil(result.retryAfterSeconds));
      try{
        await this.ports.signals.emitThrottle({
          requestId:input.requestContext.requestId,
          correlationId:input.requestContext.correlationId,
          scopeClass:input.requestContext.scopeClass,
          operationId:input.operation.operationId,
          rateClass:result.rateClass,
          dimension:result.dimension,
          retryAfterSeconds,
        });
      }catch{
        throw new RateLimitRuntimeError({
          code:"DEPENDENCY_UNAVAILABLE",
          message:"Rate-limit security signal emission is unavailable.",
        });
      }
      throw new RateLimitRuntimeError({
        code:"RATE_LIMITED",
        message:"The request rate limit has been exceeded.",
        retryAfterSeconds,
        rateClass:result.rateClass,
        dimension:result.dimension,
      });
    }
    return Object.freeze({leases:Object.freeze([...result.leases])});
  }

  async release(acquisition:RateLimitAcquisition):Promise<void>{
    const leaseIds=[...new Set(acquisition.leases.map(lease=>lease.leaseId))];
    if(leaseIds.length===0) return;
    try{
      await this.ports.store.release({leaseIds});
    }catch{
      throw new RateLimitRuntimeError({
        code:"DEPENDENCY_UNAVAILABLE",
        message:"Rate-limit concurrency release is unavailable.",
      });
    }
  }
}
