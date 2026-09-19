import test from "node:test";
import assert from "node:assert/strict";

import {
  createFirstPartyWebApplication,
  readFirstPartyWebApplicationConfig,
} from "../../dist/server/app/first-party-web-composition.js";

function environment(overrides={}){
  return {
    SBG_DATABASE_URL:"postgresql://runtime:secret@db.internal/sbglobal",
    SBG_DATABASE_POOL_MAX:"8",
    SBG_DATA_HOME_ID:"11111111-1111-4111-8111-111111111111",
    SBG_REGION_CODE:"IN-CENTRAL",
    CLERK_SECRET_KEY:"sk_test_example",
    CLERK_JWT_KEY:"-----BEGIN PUBLIC KEY-----test-----END PUBLIC KEY-----",
    SBG_CLERK_AUTHORIZED_PARTIES_JSON:JSON.stringify(["https://app.example.test"]),
    SBG_FIRST_PARTY_HOST_BINDINGS_JSON:JSON.stringify([{
      host:"app.example.test",
      tenantSelector:"TENANT-A",
    }]),
    SBG_FIRST_PARTY_ALLOWED_ORIGINS_JSON:JSON.stringify(["https://app.example.test"]),
    SBG_FIRST_PARTY_MAX_BODY_BYTES:"1048576",
    SBG_RATE_LIMIT_LEASE_SECONDS:"300",
    ...overrides,
  };
}

test("web composition config is environment-only and normalizes the cell route",()=>{
  const config=readFirstPartyWebApplicationConfig(environment());
  assert.equal(config.databasePoolMax,8);
  assert.equal(config.dataHomeId,"11111111-1111-4111-8111-111111111111");
  assert.equal(config.regionCode,"IN-CENTRAL");
  assert.deepEqual(config.hostBindings,[{
    host:"app.example.test",
    tenantSelector:"TENANT-A",
  }]);
  assert.deepEqual(config.allowedOrigins,["https://app.example.test"]);
  assert.equal(config.maxBodyBytes,1048576);
  assert.equal(config.rateLimitLeaseSeconds,300);
});

test("web composition config fails closed on missing secrets and invalid route identity",()=>{
  assert.throws(
    ()=>readFirstPartyWebApplicationConfig(environment({CLERK_SECRET_KEY:""})),
    /CLERK_SECRET_KEY/,
  );
  assert.throws(
    ()=>readFirstPartyWebApplicationConfig(environment({SBG_DATA_HOME_ID:"not-a-uuid"})),
    /SBG_DATA_HOME_ID/,
  );
  assert.throws(
    ()=>readFirstPartyWebApplicationConfig(environment({
      SBG_FIRST_PARTY_HOST_BINDINGS_JSON:JSON.stringify([{host:"app.example.test"}]),
    })),
    /SBG_FIRST_PARTY_HOST_BINDINGS_JSON/,
  );
});

test("composition construction is lazy with respect to external database connectivity",async()=>{
  const application=createFirstPartyWebApplication(readFirstPartyWebApplicationConfig(environment()));
  assert.equal(typeof application.handle,"function");
  await application.close();
});

test("App Router boundary is thin, node-only and exposes the same GET/POST handler contract",async()=>{
  const route=await import("../../dist/app/api/trpc/[trpc]/route.js");
  assert.equal(route.runtime,"nodejs");
  assert.equal(route.dynamic,"force-dynamic");
  assert.equal(typeof route.GET,"function");
  assert.equal(typeof route.POST,"function");
});
