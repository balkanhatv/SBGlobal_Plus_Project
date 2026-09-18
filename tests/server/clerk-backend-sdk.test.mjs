import test from "node:test";
import assert from "node:assert/strict";

import {
  ClerkBackendSdkAdapter,
} from "../../dist/server/identity/clerk-backend-sdk.js";
import {
  ClerkProviderError,
} from "../../dist/server/identity/clerk-identity-adapter.js";

function fixture(overrides={}){
  const calls=[];
  const sessions={
    async getSession(id){
      calls.push(["getSession",id]);
      if(overrides.getSessionError) throw overrides.getSessionError;
      return {
        id,userId:"user_1",status:"active",createdAt:1234,
      };
    },
    async revokeSession(id){
      calls.push(["revokeSession",id]);
      if(overrides.revokeError) throw overrides.revokeError;
      return {id};
    },
  };
  const sdk={
    async verifyToken(token,options){
      calls.push(["verifyToken",token,options]);
      if(overrides.verifyError) throw overrides.verifyError;
      return {
        sub:"user_1",
        sid:"sess_1",
        fva:[4,1],
        exp:9999999999,
        iat:1,
        iss:"https://issuer.example",
      };
    },
    createClerkClient(options){
      calls.push(["createClerkClient",options]);
      return {sessions};
    },
  };
  const adapter=new ClerkBackendSdkAdapter({
    secretKey:"sk_test_example",
    jwtKey:"-----BEGIN PUBLIC KEY-----\nTEST\n-----END PUBLIC KEY-----",
    authorizedParties:["https://app.example.com","https://app.example.com"],
  },sdk);
  return {adapter,calls};
}

test("Clerk SDK bridge verifies token with pinned local JWT key and authorized parties",async()=>{
  const {adapter,calls}=fixture();
  const token=await adapter.verifySessionToken("jwt-token");
  assert.deepEqual(token,{
    subject:"user_1",
    sessionId:"sess_1",
    factorVerificationAgeMinutes:[4,1],
  });
  const verify=calls.find(call=>call[0]==="verifyToken");
  assert.equal(verify[1],"jwt-token");
  assert.deepEqual(verify[2].authorizedParties,["https://app.example.com"]);
  assert.match(verify[2].jwtKey,/BEGIN PUBLIC KEY/);
});

test("Clerk SDK bridge maps live session fields and revoke through Backend API client",async()=>{
  const {adapter,calls}=fixture();
  const session=await adapter.getSession("sess_1");
  assert.deepEqual(session,{
    id:"sess_1",userId:"user_1",status:"active",createdAtMs:1234,
  });
  await adapter.revokeSession("sess_1");
  assert.deepEqual(
    calls.filter(call=>call[0]==="getSession" || call[0]==="revokeSession"),
    [["getSession","sess_1"],["revokeSession","sess_1"]],
  );
});

test("Clerk SDK bridge fails closed for invalid token and distinguishes missing session from provider outage",async()=>{
  const invalid=fixture({verifyError:new Error("invalid")}).adapter;
  await assert.rejects(
    invalid.verifySessionToken("bad"),
    error=>error instanceof ClerkProviderError && error.code==="TOKEN_INVALID",
  );

  const missing=fixture({getSessionError:{status:404}}).adapter;
  await assert.rejects(
    missing.getSession("missing"),
    error=>error instanceof ClerkProviderError && error.code==="SESSION_NOT_FOUND",
  );

  const outage=fixture({getSessionError:{status:503}}).adapter;
  await assert.rejects(
    outage.getSession("sess_1"),
    error=>error instanceof ClerkProviderError && error.code==="DEPENDENCY_UNAVAILABLE",
  );
});

test("Clerk SDK bridge rejects unsafe/incomplete configuration before creating provider client",()=>{
  const sdk={
    async verifyToken(){throw new Error("unused")},
    createClerkClient(){throw new Error("must not create")},
  };
  assert.throws(
    ()=>new ClerkBackendSdkAdapter({
      secretKey:"",jwtKey:"key",authorizedParties:["https://app.example.com"],
    },sdk),
    /secretKey/,
  );
  assert.throws(
    ()=>new ClerkBackendSdkAdapter({
      secretKey:"secret",jwtKey:"key",authorizedParties:[],
    },sdk),
    /authorizedParties/,
  );
});
