import type {
  FirstPartyTrpcBodyPolicyPort,
  FirstPartyTrpcEdgePolicyPort,
  FirstPartyTrpcRequestMetadata,
  FirstPartyTrpcSelectorFacts,
  FirstPartyTrpcSelectorPort,
} from "./fetch-handler.js";
import { FirstPartyTrpcHttpPreflightError } from "./fetch-handler.js";

export interface FirstPartyHostSelectorBinding {
  readonly host:string;
  readonly tenantSelector:string;
  readonly industrySelector?:string;
  readonly orgUnitSelector?:string;
}

function boundedSelector(value:string|undefined,label:string):string|undefined{
  if(value===undefined) return undefined;
  const normalized=value.trim();
  if(normalized.length===0 || normalized.length>128){
    throw new Error(`${label} selector binding is invalid.`);
  }
  return normalized;
}

function normalizedHost(value:string):string{
  const raw=value.trim().toLowerCase();
  if(raw.length===0 || raw.length>253 || raw.includes("/") || raw.includes("@")){
    throw new Error("Web host binding is invalid.");
  }
  let parsed:URL;
  try{
    parsed=new URL(`https://${raw}`);
  }catch{
    throw new Error("Web host binding is invalid.");
  }
  if(parsed.username || parsed.password || parsed.pathname!=="/"){
    throw new Error("Web host binding is invalid.");
  }
  const hostname=parsed.hostname.endsWith(".")
    ? parsed.hostname.slice(0,-1)
    : parsed.hostname;
  return parsed.port ? `${hostname}:${parsed.port}` : hostname;
}

function requestHost(metadata:FirstPartyTrpcRequestMetadata):string{
  let url:URL;
  try{
    url=new URL(metadata.url);
  }catch{
    throw new FirstPartyTrpcHttpPreflightError({
      code:"TRANSPORT_CONTEXT_INVALID",
      messageSafe:"The request host is invalid.",
      status:400,
      retryable:false,
    });
  }
  const hostname=url.hostname.endsWith(".")
    ? url.hostname.slice(0,-1).toLowerCase()
    : url.hostname.toLowerCase();
  return url.port ? `${hostname}:${url.port}` : hostname;
}

export class ExactHostFirstPartySelectorResolver implements FirstPartyTrpcSelectorPort {
  private readonly bindings:ReadonlyMap<string,Readonly<FirstPartyTrpcSelectorFacts>>;

  constructor(bindings:readonly FirstPartyHostSelectorBinding[]){
    if(bindings.length===0) throw new Error("At least one trusted web selector binding is required.");
    const mapped=new Map<string,Readonly<FirstPartyTrpcSelectorFacts>>();
    for(const binding of bindings){
      const host=normalizedHost(binding.host);
      if(mapped.has(host)) throw new Error("Duplicate trusted web host binding.");
      const tenantSelector=boundedSelector(binding.tenantSelector,"Tenant");
      if(!tenantSelector) throw new Error("Tenant selector binding is required.");
      mapped.set(host,Object.freeze({
        tenantSelector,
        ...(boundedSelector(binding.industrySelector,"Industry")
          ? {industrySelector:boundedSelector(binding.industrySelector,"Industry")}
          : {}),
        ...(boundedSelector(binding.orgUnitSelector,"Organization unit")
          ? {orgUnitSelector:boundedSelector(binding.orgUnitSelector,"Organization unit")}
          : {}),
      }));
    }
    this.bindings=mapped;
  }

  async resolve(request:FirstPartyTrpcRequestMetadata):Promise<FirstPartyTrpcSelectorFacts>{
    const binding=this.bindings.get(requestHost(request));
    if(!binding){
      throw new FirstPartyTrpcHttpPreflightError({
        code:"TRANSPORT_POLICY_DENIED",
        messageSafe:"The request host is not configured for this application.",
        status:403,
        retryable:false,
      });
    }
    return binding;
  }
}

export interface FirstPartyWebEdgePolicyConfig {
  readonly allowedHosts:readonly string[];
  readonly allowedOrigins:readonly string[];
  readonly maxBodyBytes:number;
}

function normalizeOrigin(value:string):string{
  let url:URL;
  try{
    url=new URL(value);
  }catch{
    throw new Error("Allowed web origin is invalid.");
  }
  if(url.username || url.password || url.pathname!=="/" || url.search || url.hash){
    throw new Error("Allowed web origin is invalid.");
  }
  if(url.protocol!=="https:"){
    throw new Error("Allowed web origins must use HTTPS.");
  }
  return url.origin.toLowerCase();
}

function policyDenied(messageSafe:string,status=403):never{
  throw new FirstPartyTrpcHttpPreflightError({
    code:"TRANSPORT_POLICY_DENIED",
    messageSafe,
    status,
    retryable:false,
  });
}

function contextInvalid(messageSafe:string,status=400):never{
  throw new FirstPartyTrpcHttpPreflightError({
    code:"TRANSPORT_CONTEXT_INVALID",
    messageSafe,
    status,
    retryable:false,
  });
}

export class ConfiguredFirstPartyWebEdgePolicy implements FirstPartyTrpcEdgePolicyPort {
  private readonly allowedHosts:ReadonlySet<string>;
  private readonly allowedOrigins:ReadonlySet<string>;
  readonly maxBodyBytes:number;

  constructor(config:FirstPartyWebEdgePolicyConfig){
    if(config.allowedHosts.length===0) throw new Error("At least one allowed web host is required.");
    if(!Number.isSafeInteger(config.maxBodyBytes)
      || config.maxBodyBytes<1024
      || config.maxBodyBytes>16*1024*1024){
      throw new Error("Web request body ceiling is invalid.");
    }
    this.allowedHosts=new Set(config.allowedHosts.map(normalizedHost));
    this.allowedOrigins=new Set(config.allowedOrigins.map(normalizeOrigin));
    this.maxBodyBytes=config.maxBodyBytes;
  }

  async verify(request:FirstPartyTrpcRequestMetadata):Promise<void>{
    let url:URL;
    try{
      url=new URL(request.url);
    }catch{
      contextInvalid("The request URL is invalid.");
    }
    if(url.protocol!=="https:"){
      policyDenied("Secure transport is required.");
    }
    if(url.username || url.password){
      policyDenied("Request URL credentials are not allowed.");
    }
    if(!this.allowedHosts.has(requestHost(request))){
      policyDenied("The request host is not allowed.");
    }
    if(request.method!=="GET" && request.method!=="POST"){
      policyDenied("The request method is not allowed.",405);
    }

    const fetchSite=request.headers.get("sec-fetch-site")?.trim().toLowerCase();
    if(fetchSite==="cross-site"){
      policyDenied("Cross-site browser requests are not allowed.");
    }

    const origin=request.headers.get("origin");
    if(origin){
      let normalized:string;
      try{
        normalized=new URL(origin).origin.toLowerCase();
      }catch{
        contextInvalid("The request origin is invalid.");
      }
      if(!this.allowedOrigins.has(normalized)){
        policyDenied("The request origin is not allowed.");
      }
    }

    const declaredLength=request.headers.get("content-length");
    if(declaredLength!==null){
      if(!/^(0|[1-9][0-9]*)$/.test(declaredLength)){
        contextInvalid("The request content length is invalid.");
      }
      const bytes=Number(declaredLength);
      if(!Number.isSafeInteger(bytes)){
        contextInvalid("The request content length is invalid.");
      }
      if(bytes>this.maxBodyBytes){
        policyDenied("The request body is too large.",413);
      }
    }

    if(request.method==="POST"){
      const contentType=request.headers.get("content-type");
      if(contentType && !contentType.toLowerCase().startsWith("application/json")){
        policyDenied("The request content type is not allowed.",415);
      }
    }
  }
}

async function readBoundedBody(request:Request,maxBodyBytes:number):Promise<Uint8Array>{
  if(!request.body) return new Uint8Array(0);
  if(request.bodyUsed){
    throw new FirstPartyTrpcHttpPreflightError({
      code:"TRANSPORT_CONTEXT_INVALID",
      messageSafe:"The request body is unavailable.",
      status:400,
      retryable:false,
    });
  }
  const reader=request.body.getReader();
  const chunks:Uint8Array[]=[];
  let total=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      if(!value) continue;
      total+=value.byteLength;
      if(total>maxBodyBytes){
        await reader.cancel().catch(()=>undefined);
        policyDenied("The request body is too large.",413);
      }
      chunks.push(value);
    }
  }finally{
    reader.releaseLock();
  }
  const body=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){
    body.set(chunk,offset);
    offset+=chunk.byteLength;
  }
  return body;
}

export class BoundedFirstPartyTrpcBodyPolicy implements FirstPartyTrpcBodyPolicyPort {
  constructor(private readonly maxBodyBytes:number){
    if(!Number.isSafeInteger(maxBodyBytes)
      || maxBodyBytes<1024
      || maxBodyBytes>16*1024*1024){
      throw new Error("Web request body ceiling is invalid.");
    }
  }

  async prepare(request:Request):Promise<Request>{
    if(request.method!=="POST" || !request.body) return request;
    const body=await readBoundedBody(request,this.maxBodyBytes);
    const headers=new Headers(request.headers);
    headers.set("content-length",String(body.byteLength));
    const arrayBuffer=body.buffer.slice(
      body.byteOffset,
      body.byteOffset+body.byteLength,
    ) as ArrayBuffer;
    return new Request(request.url,{
      method:request.method,
      headers,
      body:arrayBuffer,
    });
  }
}
