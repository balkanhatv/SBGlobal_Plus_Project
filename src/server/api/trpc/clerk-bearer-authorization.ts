import type { AuthenticationInput } from "../../../core/identity/contracts.js";
import type {
  FirstPartyTrpcAuthorizationPort,
  FirstPartyTrpcRequestMetadata,
} from "./fetch-handler.js";
import { FirstPartyTrpcHttpPreflightError } from "./fetch-handler.js";

const MAX_AUTHORIZATION_HEADER_LENGTH = 8192;

export class FirstPartyClerkBearerAuthorizationResolver
implements FirstPartyTrpcAuthorizationPort {
  async resolve(input:{
    readonly authorizationHeader:string;
    readonly request:FirstPartyTrpcRequestMetadata;
  }):Promise<AuthenticationInput>{
    const header=input.authorizationHeader.trim();
    if(header.length<8 || header.length>MAX_AUTHORIZATION_HEADER_LENGTH){
      throw new FirstPartyTrpcHttpPreflightError({
        code:"TRANSPORT_CONTEXT_INVALID",
        messageSafe:"The Authorization header is invalid.",
        status:401,
        retryable:false,
      });
    }

    const match=/^Bearer ([^\s]+)$/i.exec(header);
    const token=match?.[1];
    if(!token){
      throw new FirstPartyTrpcHttpPreflightError({
        code:"TRANSPORT_CONTEXT_INVALID",
        messageSafe:"The Authorization header is invalid.",
        status:401,
        retryable:false,
      });
    }

    return Object.freeze({
      kind:"HUMAN",
      credential:token,
    });
  }
}
