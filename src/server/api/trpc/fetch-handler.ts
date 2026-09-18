import type { AnyRouter } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import type { AuthenticationInput, IdentityPort } from "../../../core/identity/contracts.js";
import type { RateLimitSubject } from "../../../core/api/rate-limit.js";
import { OperationExecutionError } from "../../../core/api/operation-executor.js";
import { TransportEnvelopeProjector } from "../../../core/api/transport-projection.js";
import {
  FirstPartyTrpcContextError,
  FirstPartyTrpcProjectedCause,
  createFirstPartyTransportIds,
  createProtectedFirstPartyTrpcContext,
  type FirstPartyTrpcContext,
  type FirstPartyTrpcIdPort,
} from "./first-party-trpc.js";

export interface FirstPartyTrpcRequestMetadata {
  readonly method: string;
  readonly url: string;
  readonly headers: Headers;
}

export interface FirstPartyTrpcAuthorizationPort {
  resolve(input:{
    readonly authorizationHeader:string;
    readonly request:FirstPartyTrpcRequestMetadata;
  }):Promise<AuthenticationInput>;
}

export interface FirstPartyTrpcSelectorFacts {
  readonly tenantSelector?:string;
  readonly industrySelector?:string;
  readonly orgUnitSelector?:string;
}

export interface FirstPartyTrpcSelectorPort {
  resolve(request:FirstPartyTrpcRequestMetadata):Promise<FirstPartyTrpcSelectorFacts>;
}

export interface FirstPartyTrpcNetworkFacts {
  readonly actorIpHash?:string;
  readonly networkContext?:string;
  readonly verifiedRateSubject?:RateLimitSubject;
}

export interface FirstPartyTrpcNetworkPort {
  resolve(request:FirstPartyTrpcRequestMetadata):Promise<FirstPartyTrpcNetworkFacts>;
}

export interface FirstPartyTrpcEdgePolicyPort {
  verify(request:FirstPartyTrpcRequestMetadata):Promise<void>;
}

export class FirstPartyTrpcHttpPreflightError extends Error {
  readonly code:
    | "TRANSPORT_POLICY_DENIED"
    | "TRANSPORT_CONTEXT_INVALID"
    | "DEPENDENCY_UNAVAILABLE";
  readonly status:number;
  readonly retryable:boolean;

  constructor(input:{
    readonly code:
      | "TRANSPORT_POLICY_DENIED"
      | "TRANSPORT_CONTEXT_INVALID"
      | "DEPENDENCY_UNAVAILABLE";
    readonly messageSafe:string;
    readonly status:number;
    readonly retryable:boolean;
  }){
    super(input.messageSafe);
    this.name="FirstPartyTrpcHttpPreflightError";
    this.code=input.code;
    this.status=input.status;
    this.retryable=input.retryable;
  }
}

export interface FirstPartyTrpcFetchHandlerPorts<TRouter extends AnyRouter> {
  readonly endpoint:string;
  readonly router:TRouter;
  readonly identity:IdentityPort;
  readonly ids:FirstPartyTrpcIdPort;
  readonly authorization:FirstPartyTrpcAuthorizationPort;
  readonly edgePolicy:FirstPartyTrpcEdgePolicyPort;
  readonly selectors?:FirstPartyTrpcSelectorPort;
  readonly network?:FirstPartyTrpcNetworkPort;
  readonly projector:TransportEnvelopeProjector;
}

function metadata(request:Request):FirstPartyTrpcRequestMetadata{
  return Object.freeze({
    method:request.method,
    url:request.url,
    headers:request.headers,
  });
}

function preflightResponse(input:{
  readonly projector:TransportEnvelopeProjector;
  readonly requestId:string;
  readonly correlationId:string;
  readonly code:string;
  readonly messageSafe:string;
  readonly retryable:boolean;
  readonly status:number;
}):Response{
  const projection=input.projector.projectError({
    error:new OperationExecutionError({
      code:input.code,
      messageSafe:input.messageSafe,
      retryable:input.retryable,
    }),
    requestId:input.requestId,
    correlationId:input.correlationId,
  });
  return new Response(JSON.stringify(projection.envelope),{
    status:input.status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      "x-correlation-id":input.correlationId,
    },
  });
}

function normalizePreflightFailure(error:unknown):{
  readonly code:string;
  readonly messageSafe:string;
  readonly retryable:boolean;
  readonly status:number;
}{
  if(error instanceof FirstPartyTrpcHttpPreflightError){
    return error;
  }
  if(error instanceof FirstPartyTrpcContextError){
    if(error.code==="AUTHENTICATION_INVALID"){
      return {
        code:error.code,
        messageSafe:error.message,
        retryable:false,
        status:401,
      };
    }
    return {
      code:error.code,
      messageSafe:error.message,
      retryable:false,
      status:400,
    };
  }
  return {
    code:"DEPENDENCY_UNAVAILABLE",
    messageSafe:"The API transport is unavailable.",
    retryable:true,
    status:503,
  };
}

export function createFirstPartyTrpcFetchHandler<TRouter extends AnyRouter>(
  ports:FirstPartyTrpcFetchHandlerPorts<TRouter>,
):(request:Request)=>Promise<Response>{
  const endpoint=ports.endpoint.trim();
  if(!endpoint.startsWith("/") || endpoint.includes("?") || endpoint.includes("#")){
    throw new Error("The first-party tRPC endpoint is invalid.");
  }

  return async(request:Request):Promise<Response>=>{
    const requestMetadata=metadata(request);
    const transportIds=createFirstPartyTransportIds(
      ports.ids,
      request.headers.get("x-correlation-id") ?? undefined,
    );

    let context:FirstPartyTrpcContext;
    try{
      await ports.edgePolicy.verify(requestMetadata);

      const authorizationHeader=request.headers.get("authorization");
      if(!authorizationHeader || authorizationHeader.trim().length===0){
        return preflightResponse({
          projector:ports.projector,
          ...transportIds,
          code:"AUTH_REQUIRED",
          messageSafe:"Authentication is required.",
          retryable:false,
          status:401,
        });
      }

      const authentication=await ports.authorization.resolve({
        authorizationHeader,
        request:requestMetadata,
      });
      const selectorFacts=ports.selectors
        ? await ports.selectors.resolve(requestMetadata)
        : Object.freeze({});
      const networkFacts=ports.network
        ? await ports.network.resolve(requestMetadata)
        : Object.freeze({});

      context=await createProtectedFirstPartyTrpcContext({
        identity:ports.identity,
        ids:ports.ids,
        transportIds,
        authentication,
        tenantSelector:selectorFacts.tenantSelector,
        industrySelector:selectorFacts.industrySelector,
        orgUnitSelector:selectorFacts.orgUnitSelector,
        actorIpHash:networkFacts.actorIpHash,
        networkContext:networkFacts.networkContext,
        idempotencyKey:request.headers.get("idempotency-key") ?? undefined,
        verifiedRateSubject:networkFacts.verifiedRateSubject,
      });
    }catch(error){
      const failure=normalizePreflightFailure(error);
      return preflightResponse({
        projector:ports.projector,
        ...transportIds,
        ...failure,
      });
    }

    return fetchRequestHandler({
      endpoint,
      req:request,
      router:ports.router,
      allowBatching:false,
      createContext:async()=>context,
      responseMeta({errors}){
        const headers=new Headers({
          "cache-control":"no-store",
          "x-correlation-id":context.executionContext.correlationId
            ?? context.executionContext.requestId,
        });
        const projectedCause=errors
          .map(error=>error.cause)
          .find(cause=>cause instanceof FirstPartyTrpcProjectedCause);
        if(projectedCause instanceof FirstPartyTrpcProjectedCause
          && projectedCause.projection.retryAfterSeconds!==undefined){
          headers.set(
            "retry-after",
            String(Math.max(1,Math.ceil(projectedCause.projection.retryAfterSeconds))),
          );
        }
        return {headers};
      },
    });
  };
}
