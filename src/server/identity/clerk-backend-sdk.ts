import {
  createClerkClient,
  verifyToken,
  type ClerkClient,
  type VerifyTokenOptions,
} from "@clerk/backend";

import type {
  ClerkBackendPort,
  ClerkSessionRecord,
  ClerkVerifiedSessionToken,
} from "./clerk-identity-adapter.js";
import { ClerkProviderError } from "./clerk-identity-adapter.js";

export interface ClerkBackendSdkConfig {
  readonly secretKey:string;
  readonly jwtKey:string;
  readonly authorizedParties:readonly string[];
}

export interface ClerkBackendSdkFunctions {
  readonly verifyToken:typeof verifyToken;
  readonly createClerkClient:typeof createClerkClient;
}

function required(value:string,name:string):string{
  const normalized=value.trim();
  if(!normalized){
    throw new Error(`Clerk backend configuration is missing ${name}.`);
  }
  return normalized;
}

function authorizedParties(values:readonly string[]):readonly string[]{
  const normalized=[...new Set(values.map(value=>value.trim()).filter(Boolean))];
  if(normalized.length===0){
    throw new Error("Clerk backend authorizedParties must not be empty.");
  }
  if(normalized.some(value=>value.length>2048)){
    throw new Error("Clerk backend authorizedParties contains an invalid value.");
  }
  return Object.freeze(normalized);
}

function factorAge(payload:Record<string,unknown>):readonly [number,number] | undefined{
  const value=payload.fva;
  if(!Array.isArray(value) || value.length!==2){
    return undefined;
  }
  const first=value[0];
  const second=value[1];
  if(typeof first!=="number" || !Number.isFinite(first)
    || typeof second!=="number" || !Number.isFinite(second)){
    return undefined;
  }
  return Object.freeze([first,second]) as readonly [number,number];
}

function sessionNotFound(error:unknown):boolean{
  if(!error || typeof error!=="object") return false;
  const status=(error as {status?:unknown}).status;
  return status===404;
}

export class ClerkBackendSdkAdapter implements ClerkBackendPort {
  private readonly secretKey:string;
  private readonly jwtKey:string;
  private readonly parties:readonly string[];
  private readonly client:ClerkClient;
  private readonly sdk:ClerkBackendSdkFunctions;

  constructor(
    config:ClerkBackendSdkConfig,
    sdk:ClerkBackendSdkFunctions={
      verifyToken,
      createClerkClient,
    },
  ){
    this.secretKey=required(config.secretKey,"secretKey");
    this.jwtKey=required(config.jwtKey,"jwtKey");
    this.parties=authorizedParties(config.authorizedParties);
    this.sdk=sdk;
    this.client=this.sdk.createClerkClient({
      secretKey:this.secretKey,
      jwtKey:this.jwtKey,
    });
  }

  async verifySessionToken(token:string):Promise<ClerkVerifiedSessionToken>{
    const credential=token.trim();
    if(!credential || credential.length>16384){
      throw new ClerkProviderError("TOKEN_INVALID");
    }

    let payload:Awaited<ReturnType<typeof verifyToken>>;
    try{
      const options:VerifyTokenOptions={
        secretKey:this.secretKey,
        jwtKey:this.jwtKey,
        authorizedParties:[...this.parties],
      };
      payload=await this.sdk.verifyToken(credential,options);
    }catch{
      throw new ClerkProviderError("TOKEN_INVALID");
    }

    const subject=payload.sub;
    const sessionId=(payload as Record<string,unknown>).sid;
    if(typeof subject!=="string" || !subject
      || typeof sessionId!=="string" || !sessionId){
      throw new ClerkProviderError("TOKEN_INVALID");
    }

    return Object.freeze({
      subject,
      sessionId,
      ...(factorAge(payload as Record<string,unknown>)
        ? {factorVerificationAgeMinutes:factorAge(payload as Record<string,unknown>)}
        : {}),
    });
  }

  async getSession(sessionId:string):Promise<ClerkSessionRecord>{
    let session;
    try{
      session=await this.client.sessions.getSession(sessionId);
    }catch(error){
      throw new ClerkProviderError(
        sessionNotFound(error) ? "SESSION_NOT_FOUND" : "DEPENDENCY_UNAVAILABLE",
      );
    }

    return Object.freeze({
      id:session.id,
      userId:session.userId,
      status:session.status,
      createdAtMs:session.createdAt,
    });
  }

  async revokeSession(sessionId:string):Promise<void>{
    try{
      await this.client.sessions.revokeSession(sessionId);
    }catch(error){
      throw new ClerkProviderError(
        sessionNotFound(error) ? "SESSION_NOT_FOUND" : "DEPENDENCY_UNAVAILABLE",
      );
    }
  }
}
