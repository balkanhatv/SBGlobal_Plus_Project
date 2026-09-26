import test from "node:test";
import assert from "node:assert/strict";

import {
  FirstPartyClerkBearerAuthorizationResolver,
} from "../../dist/server/api/trpc/clerk-bearer-authorization.js";
import {
  FirstPartyTrpcHttpPreflightError,
} from "../../dist/server/api/trpc/fetch-handler.js";

const resolver=new FirstPartyClerkBearerAuthorizationResolver();
const request={
  method:"GET",
  url:"https://example.test/api/trpc/x",
  headers:new Headers(),
};

test("first-party Clerk Authorization resolver accepts one Bearer token and returns HUMAN auth input",async()=>{
  const auth=await resolver.resolve({
    authorizationHeader:"Bearer ey.test.token",
    request,
  });
  assert.deepEqual(auth,{kind:"HUMAN",credential:"ey.test.token"});
});

test("first-party Clerk Authorization resolver rejects machine/custom/basic/ambiguous schemes",async()=>{
  for(const header of [
    "Basic abc",
    "ApiKey abc",
    "Bearer one two",
    "Bearer ",
    "Machine abc",
  ]){
    await assert.rejects(
      resolver.resolve({authorizationHeader:header,request}),
      error=>error instanceof FirstPartyTrpcHttpPreflightError
        && error.status===401
        && error.retryable===false,
    );
  }
});
