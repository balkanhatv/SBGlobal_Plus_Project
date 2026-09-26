import type { ContextResolutionInput } from "../../../core/context/contracts.js";
import type { AuthenticationInput } from "../../../core/identity/contracts.js";
import type { RateLimitSubject } from "../../../core/api/rate-limit.js";
import {
  OperationExecutionError,
  type OperationExecutionResult,
  type OperationExecutor,
} from "../../../core/api/operation-executor.js";
import {
  TransportEnvelopeProjector,
  type TransportErrorProjection,
  type TransportExecutionProjection,
} from "../../../core/api/transport-projection.js";

export interface RestRequestMetadata {
  readonly method:string;
  readonly url:string;
  readonly headers:Headers;
}

export interface RestRouteResolution {
  readonly operationId:string;
  readonly tenantSelector?:string;
  readonly industrySelector?:string;
  readonly orgUnitSelector?:string;
  readonly successStatus?:200|201;
}

export interface RestRoutePort {
  resolve(request:RestRequestMetadata):Promise<RestRouteResolution|undefined>;
}

export interface RestAuthorizationPort {
  resolve(input:{
    readonly authorizationHeader:string;
    readonly request:RestRequestMetadata;
  }):Promise<AuthenticationInput>;
}

export interface RestEdgePolicyPort {
  verify(request:RestRequestMetadata):Promise<void>;
}

export interface RestBodyPolicyPort {
  prepare(request:Request):Promise<Request>;
}

export interface RestNetworkFacts {
  readonly actorIpHash?:string;
  readonly networkContext?:string;
  readonly verifiedRateSubject?:RateLimitSubject;
}

export interface RestNetworkPort {
  resolve(request:RestRequestMetadata):Promise<RestNetworkFacts>;
}

export interface ProtectedRestContext {
  readonly executionContext:Omit<ContextResolutionInput,"scopeClass">;
  readonly idempotencyKey?:string;
  readonly verifiedRateSubject?:RateLimitSubject;
}

export interface ProtectedRestContextPort {
  authenticate(input:{
    readonly authentication:AuthenticationInput;
    readonly requestId:string;
    readonly correlationId:string;
    readonly route:RestRouteResolution;
    readonly request:RestRequestMetadata;
    readonly idempotencyKey?:string;
    readonly network:RestNetworkFacts;
  }):Promise<ProtectedRestContext>;
}

export interface RestInputPort {
  read(input:{
    readonly request:Request;
    readonly route:RestRouteResolution;
  }):Promise<unknown>;
}

export interface RestIdPort {
  nextId():string;
}

export class RestTransportError extends Error {
  readonly code:string;
  readonly status:number;
  readonly retryable:boolean;

  constructor(input:{
    readonly code:string;
    readonly messageSafe:string;
    readonly status:number;
    readonly retryable:boolean;
  }){
    super(input.messageSafe);
    this.name="RestTransportError";
    this.code=input.code;
    this.status=input.status;
    this.retryable=input.retryable;
  }
}

export interface RestFetchHandlerPorts {
  readonly routes:RestRoutePort;
  readonly authorization:RestAuthorizationPort;
  readonly edgePolicy:RestEdgePolicyPort;
  readonly contexts:ProtectedRestContextPort;
  readonly input:RestInputPort;
  readonly executor:Pick<OperationExecutor,"execute">;
  readonly projector:TransportEnvelopeProjector;
  readonly ids:RestIdPort;
  readonly bodyPolicy:RestBodyPolicyPort;
  readonly network?:RestNetworkPort;
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function nextId(ids:RestIdPort):string{
  const value=ids.nextId();
  if(!UUID.test(value)){
    throw new RestTransportError({
      code:"TRANSPORT_CONTEXT_INVALID",
      messageSafe:"Transport request identity is unavailable.",
      status:503,
      retryable:true,
    });
  }
  return value.toLowerCase();
}

function transportIds(request:Request,ids:RestIdPort):{
  readonly requestId:string;
  readonly correlationId:string;
}{
  const advisory=request.headers.get("x-correlation-id")?.trim();
  return Object.freeze({
    requestId:nextId(ids),
    correlationId:advisory && UUID.test(advisory)
      ? advisory.toLowerCase()
      : nextId(ids),
  });
}

function metadata(request:Request):RestRequestMetadata{
  return Object.freeze({method:request.method,url:request.url,headers:request.headers});
}

function optionalSelector(value:string|undefined):string|undefined{
  if(value===undefined) return undefined;
  if(value.length<1 || value.length>128 || value!==value.trim()){
    throw new RestTransportError({
      code:"TRANSPORT_CONTEXT_INVALID",
      messageSafe:"The REST route selector is invalid.",
      status:503,
      retryable:true,
    });
  }
  return value;
}

function normalizeRoute(route:RestRouteResolution):RestRouteResolution{
  if(typeof route.operationId!=="string"
    || route.operationId.length<1
    || route.operationId.length>256
    || route.operationId!==route.operationId.trim()){
    throw new RestTransportError({
      code:"TRANSPORT_CONTEXT_INVALID",
      messageSafe:"The REST route contract is invalid.",
      status:503,
      retryable:true,
    });
  }
  return Object.freeze({
    operationId:route.operationId,
    ...(optionalSelector(route.tenantSelector)
      ? {tenantSelector:optionalSelector(route.tenantSelector)}
      : {}),
    ...(optionalSelector(route.industrySelector)
      ? {industrySelector:optionalSelector(route.industrySelector)}
      : {}),
    ...(optionalSelector(route.orgUnitSelector)
      ? {orgUnitSelector:optionalSelector(route.orgUnitSelector)}
      : {}),
    ...(route.successStatus?{successStatus:route.successStatus}:{}),
  });
}

function idempotencyKey(request:Request):string|undefined{
  const value=request.headers.get("idempotency-key") ?? undefined;
  if(value!==undefined && (value.length<1 || value.length>512)){
    throw new RestTransportError({
      code:"TRANSPORT_CONTEXT_INVALID",
      messageSafe:"REST transport metadata is invalid.",
      status:400,
      retryable:false,
    });
  }
  return value;
}

function headers(correlationId:string,retryAfterSeconds?:number):Headers{
  const result=new Headers({
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
    "x-correlation-id":correlationId,
  });
  if(retryAfterSeconds!==undefined){
    result.set("retry-after",String(Math.max(1,Math.ceil(retryAfterSeconds))));
  }
  return result;
}

function errorStatus(projection:TransportErrorProjection):number{
  const error=projection.envelope.error;
  if(error.code==="RATE_LIMITED") return 429;
  if(error.code==="AUTH_REQUIRED" || error.code==="AUTHENTICATION_INVALID") return 401;
  if(error.code==="OPERATION_NOT_FOUND" || error.code==="RESOURCE_NOT_FOUND") return 404;
  if(error.code==="IDEMPOTENCY_CONFLICT") return 409;
  if(error.class==="POLICY_DENIAL" || error.class==="ENTITLEMENT_DENIAL") return 403;
  if(error.class==="SYSTEM_FAULT") return 503;
  return 400;
}

function errorResponse(input:{
  readonly projector:TransportEnvelopeProjector;
  readonly error:OperationExecutionError;
  readonly requestId:string;
  readonly correlationId:string;
  readonly status?:number;
}):Response{
  const projection=input.projector.projectError({
    error:input.error,
    requestId:input.requestId,
    correlationId:input.correlationId,
  });
  return new Response(JSON.stringify(projection.envelope),{
    status:input.status ?? errorStatus(projection),
    headers:headers(input.correlationId,projection.retryAfterSeconds),
  });
}

function normalizedFailure(error:unknown):RestTransportError|OperationExecutionError{
  if(error instanceof RestTransportError || error instanceof OperationExecutionError) return error;
  return new RestTransportError({
    code:"DEPENDENCY_UNAVAILABLE",
    messageSafe:"The REST transport is unavailable.",
    status:503,
    retryable:true,
  });
}

function controlStatus(projection:TransportExecutionProjection,successStatus:200|201):number{
  if(projection.kind==="SUCCESS") return successStatus;
  if(projection.kind==="IDEMPOTENCY_IN_PROGRESS") return 202;
  if(projection.kind==="IDEMPOTENCY_FINAL_FAILURE") return 409;
  return 200;
}

function resultResponse(input:{
  readonly projection:TransportExecutionProjection;
  readonly correlationId:string;
  readonly successStatus:200|201;
}):Response{
  const responseHeaders=headers(input.correlationId);
  if(input.projection.kind==="IDEMPOTENT_REPLAY"){
    responseHeaders.set("x-idempotent-replay","true");
  }
  const body=input.projection.kind==="SUCCESS"
    ? input.projection.envelope
    : input.projection;
  return new Response(JSON.stringify(body),{
    status:controlStatus(input.projection,input.successStatus),
    headers:responseHeaders,
  });
}

export function createRestFetchHandler(
  ports:RestFetchHandlerPorts,
):(request:Request)=>Promise<Response>{
  return async(request:Request):Promise<Response>=>{
    const ids=transportIds(request,ports.ids);

    const requestMetadata=metadata(request);
    let route:RestRouteResolution;
    let context:ProtectedRestContext;
    try{
      await ports.edgePolicy.verify(requestMetadata);
      const resolved=await ports.routes.resolve(requestMetadata);
      if(!resolved){
        throw new RestTransportError({
          code:"OPERATION_NOT_FOUND",
          messageSafe:"The requested operation is not available.",
          status:404,
          retryable:false,
        });
      }
      route=normalizeRoute(resolved);

      const authorizationHeader=request.headers.get("authorization");
      if(!authorizationHeader || authorizationHeader.trim().length===0){
        throw new RestTransportError({
          code:"AUTH_REQUIRED",
          messageSafe:"Authentication is required.",
          status:401,
          retryable:false,
        });
      }
      const authentication=await ports.authorization.resolve({
        authorizationHeader,
        request:requestMetadata,
      });
      const network=ports.network
        ? await ports.network.resolve(requestMetadata)
        : Object.freeze({});
      context=await ports.contexts.authenticate({
        authentication,
        ...ids,
        route,
        request:requestMetadata,
        idempotencyKey:idempotencyKey(request),
        network,
      });
      if(context.executionContext.requestId!==ids.requestId
        || context.executionContext.correlationId!==ids.correlationId){
        throw new RestTransportError({
          code:"TRANSPORT_CONTEXT_INVALID",
          messageSafe:"The REST protected context is invalid.",
          status:503,
          retryable:true,
        });
      }
    }catch(error){
      const failure=normalizedFailure(error);
      return errorResponse({
        projector:ports.projector,
        error:failure instanceof OperationExecutionError
          ? failure
          : new OperationExecutionError({
              code:failure.code,
              messageSafe:failure.message,
              retryable:failure.retryable,
            }),
        ...ids,
        ...(failure instanceof RestTransportError?{status:failure.status}:{}),
      });
    }

    try{
      const preparedRequest=await ports.bodyPolicy.prepare(request);
      const rawInput=await ports.input.read({request:preparedRequest,route});
      const result:OperationExecutionResult=await ports.executor.execute({
        operationId:route.operationId,
        rawInput,
        context:context.executionContext,
        ...(context.idempotencyKey?{idempotencyKey:context.idempotencyKey}:{}),
        ...(context.verifiedRateSubject
          ? {verifiedRateSubject:context.verifiedRateSubject}
          : {}),
      });
      return resultResponse({
        projection:ports.projector.projectResult(result),
        correlationId:ids.correlationId,
        successStatus:route.successStatus ?? 200,
      });
    }catch(error){
      const failure=normalizedFailure(error);
      return errorResponse({
        projector:ports.projector,
        error:failure instanceof OperationExecutionError
          ? failure
          : new OperationExecutionError({
              code:failure.code,
              messageSafe:failure.message,
              retryable:failure.retryable,
            }),
        ...ids,
        ...(failure instanceof RestTransportError?{status:failure.status}:{}),
      });
    }
  };
}
