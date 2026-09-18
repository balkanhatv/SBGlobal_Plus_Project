import {
  initTRPC,
  TRPCError,
  type TRPC_ERROR_CODE_KEY,
} from "@trpc/server";
import type { ZodType, output as ZodOutput } from "zod";

import type { ContextResolutionInput } from "../../../core/context/contracts.js";
import type { AuthenticationInput, IdentityPort } from "../../../core/identity/contracts.js";
import type { RateLimitSubject } from "../../../core/api/rate-limit.js";
import type { OperationContract } from "../../../core/api/operation-contract.js";
import {
  OperationExecutionError,
  type OperationExecutor,
} from "../../../core/api/operation-executor.js";
import type { OperationSchemaRegistry } from "../../../core/api/schema-registry.js";
import type { ZodOperationDtoRegistry } from "../../../core/api/zod-operation-dto.js";
import {
  TransportEnvelopeProjector,
  type ApiResponseMeta,
  type TransportExecutionProjection,
  type TransportErrorProjection,
} from "../../../core/api/transport-projection.js";

export interface FirstPartyTrpcIdPort {
  nextId(): string;
}

export interface FirstPartyTrpcContext {
  readonly executionContext: Omit<ContextResolutionInput, "scopeClass">;
  readonly idempotencyKey?: string;
  readonly verifiedRateSubject?: RateLimitSubject;
}

export class FirstPartyTrpcContextError extends Error {
  readonly code: "AUTHENTICATION_INVALID" | "TRANSPORT_CONTEXT_INVALID";

  constructor(
    code: "AUTHENTICATION_INVALID" | "TRANSPORT_CONTEXT_INVALID",
    messageSafe: string,
  ) {
    super(messageSafe);
    this.name = "FirstPartyTrpcContextError";
    this.code = code;
  }
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizedId(value: string | undefined, ids: FirstPartyTrpcIdPort): string {
  if (value && UUID.test(value)) return value.toLowerCase();
  const generated=ids.nextId();
  if (!UUID.test(generated)) {
    throw new FirstPartyTrpcContextError(
      "TRANSPORT_CONTEXT_INVALID",
      "Transport request identity is unavailable.",
    );
  }
  return generated.toLowerCase();
}

function optionalSelector(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized=value.trim();
  if (normalized.length===0 || normalized.length>128) {
    throw new FirstPartyTrpcContextError(
      "TRANSPORT_CONTEXT_INVALID",
      "Transport selector is invalid.",
    );
  }
  return normalized;
}

function optionalBounded(value: string | undefined, max: number): string | undefined {
  if (value===undefined) return undefined;
  if (value.length===0 || value.length>max) {
    throw new FirstPartyTrpcContextError(
      "TRANSPORT_CONTEXT_INVALID",
      "Transport metadata is invalid.",
    );
  }
  return value;
}

export async function createProtectedFirstPartyTrpcContext(input:{
  readonly identity: IdentityPort;
  readonly ids: FirstPartyTrpcIdPort;
  readonly authentication: AuthenticationInput;
  readonly advisoryCorrelationId?: string;
  readonly tenantSelector?: string;
  readonly industrySelector?: string;
  readonly orgUnitSelector?: string;
  readonly actorIpHash?: string;
  readonly networkContext?: string;
  readonly idempotencyKey?: string;
  readonly verifiedRateSubject?: RateLimitSubject;
}):Promise<FirstPartyTrpcContext>{
  try{
    if(input.authentication.kind==="HUMAN"){
      await input.identity.verifyHumanSession(
        input.authentication.credential,
        input.authentication.deviceRegistrationId,
      );
    }else{
      await input.identity.verifyMachineCredential(input.authentication.credential);
    }
  }catch{
    throw new FirstPartyTrpcContextError(
      "AUTHENTICATION_INVALID",
      "Authentication is invalid.",
    );
  }

  const requestId=normalizedId(undefined,input.ids);
  const correlationId=normalizedId(input.advisoryCorrelationId,input.ids);
  const idempotencyKey=optionalBounded(input.idempotencyKey,512);
  const actorIpHash=optionalBounded(input.actorIpHash,256);
  const networkContext=optionalBounded(input.networkContext,128);

  return Object.freeze({
    executionContext:Object.freeze({
      requestId,
      correlationId,
      authentication:input.authentication,
      ...(optionalSelector(input.tenantSelector)
        ? {tenantSelector:optionalSelector(input.tenantSelector)}
        : {}),
      ...(optionalSelector(input.industrySelector)
        ? {industrySelector:optionalSelector(input.industrySelector)}
        : {}),
      ...(optionalSelector(input.orgUnitSelector)
        ? {orgUnitSelector:optionalSelector(input.orgUnitSelector)}
        : {}),
      ...(actorIpHash?{actorIpHash}:{}),
      ...(networkContext?{networkContext}:{}),
    }),
    ...(idempotencyKey?{idempotencyKey}:{}),
    ...(input.verifiedRateSubject?{verifiedRateSubject:input.verifiedRateSubject}:{}),
  });
}

export class FirstPartyTrpcProjectedCause extends Error {
  readonly projection: TransportErrorProjection;

  constructor(projection: TransportErrorProjection) {
    super(projection.envelope.error.messageSafe);
    this.name="FirstPartyTrpcProjectedCause";
    this.projection=projection;
  }
}

function trpcCode(projection:TransportErrorProjection):TRPC_ERROR_CODE_KEY{
  const error=projection.envelope.error;
  if(error.code==="RATE_LIMITED") return "TOO_MANY_REQUESTS";
  if(error.code==="AUTH_REQUIRED" || error.code==="AUTHENTICATION_INVALID") return "UNAUTHORIZED";
  if(error.code==="IDEMPOTENCY_CONFLICT") return "CONFLICT";
  if(error.class==="POLICY_DENIAL" || error.class==="ENTITLEMENT_DENIAL") return "FORBIDDEN";
  if(error.class==="USER_ERROR") return "BAD_REQUEST";
  return "INTERNAL_SERVER_ERROR";
}

export const firstPartyTrpc=initTRPC.context<FirstPartyTrpcContext>().create({
  errorFormatter({shape,error}){
    const projection=error.cause instanceof FirstPartyTrpcProjectedCause
      ? error.cause.projection
      : undefined;
    return {
      ...shape,
      data:{
        ...shape.data,
        ...(projection?{sbglobal:projection.envelope}:{}),
        ...(projection?.retryAfterSeconds!==undefined
          ? {retryAfterSeconds:projection.retryAfterSeconds}
          : {}),
      },
    };
  },
});

type FirstPartyControlProjection=Exclude<TransportExecutionProjection,{kind:"SUCCESS"}>;

export type FirstPartyTrpcResult<TOutput>=
  | {
      readonly kind:"SUCCESS";
      readonly envelope:{
        readonly data:TOutput;
        readonly meta:ApiResponseMeta;
      };
      readonly responseStatus?:string;
      readonly responseReference?:string;
    }
  | FirstPartyControlProjection;

export interface FirstPartyTrpcAdapterPorts {
  readonly executor: Pick<OperationExecutor,"execute">;
  readonly schemas: OperationSchemaRegistry;
  readonly dtos: ZodOperationDtoRegistry;
  readonly projector: TransportEnvelopeProjector;
}

export function createFirstPartyQueryProcedure<
  TInput extends ZodType,
  TOutput extends ZodType,
>(input:{
  readonly ports:FirstPartyTrpcAdapterPorts;
  readonly operation:OperationContract;
  readonly inputSchema:TInput;
  readonly outputSchema:TOutput;
}){
  const registered=input.ports.dtos.get(input.operation);
  if(registered.inputSchema!==input.inputSchema || registered.outputSchema!==input.outputSchema){
    throw new Error("The tRPC procedure must use the exact registered Zod DTO schema objects.");
  }

  const invoke=async(ctx:FirstPartyTrpcContext,parsedInput:ZodOutput<TInput>)
    :Promise<FirstPartyTrpcResult<ZodOutput<TOutput>>>=>{
    const prepared=input.ports.schemas.prepareInput(input.operation,parsedInput);
    try{
      const result=await input.ports.executor.execute({
        operationId:input.operation.operationId,
        rawInput:parsedInput,
        preparedInput:prepared,
        context:ctx.executionContext,
        idempotencyKey:ctx.idempotencyKey,
        verifiedRateSubject:ctx.verifiedRateSubject,
      });
      return input.ports.projector.projectResult(result)
        as FirstPartyTrpcResult<ZodOutput<TOutput>>;
    }catch(error){
      if(!(error instanceof OperationExecutionError)) throw error;
      const projection=input.ports.projector.projectError({
        error,
        requestId:ctx.executionContext.requestId,
        correlationId:ctx.executionContext.correlationId
          ?? ctx.executionContext.requestId,
      });
      throw new TRPCError({
        code:trpcCode(projection),
        message:projection.envelope.error.messageSafe,
        cause:new FirstPartyTrpcProjectedCause(projection),
      });
    }
  };

  if(input.operation.kind!=="QUERY"){
    throw new Error("The first-party query adapter requires a QUERY OperationContract.");
  }
  return firstPartyTrpc.procedure
    .input(input.inputSchema)
    .query(({ctx,input:parsed})=>invoke(ctx,parsed));
}
