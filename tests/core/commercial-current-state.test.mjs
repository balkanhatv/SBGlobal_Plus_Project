import test from "node:test";
import assert from "node:assert/strict";

import {
  CommercialCurrentStateService,
  CommercialStateError,
} from "../../dist/core/index.js";

const context = Object.freeze({
  requestId: "request-commercial-1",
  correlationId: "correlation-commercial-1",
  tenantId: "tenant-a",
  industryContextId: "industry-rtl",
  dataHomeId: "home-a",
  regionCode: "IN-CENTRAL",
  principalId: "principal-a",
  principalType: "HUMAN",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  entitlementSnapshotId: "snapshot-7",
  entitlementSnapshotVersion: 7,
  scopeClass: "TENANT_INDUSTRY",
});

const operation = Object.freeze({
  operationId: "rtl.pos.sale.view",
  module: "RTL-POS",
  scopeClass: "TENANT_INDUSTRY",
  kind: "QUERY",
  permissionCode: "rtl.pos.sale.view",
  entitlementRequirement: "rtl.pos.enabled",
  inputSchemaVersion: 1,
  outputSchemaVersion: 1,
  idempotencyPolicy: "NONE",
  rateClass: "AUTH_STANDARD",
  auditClass: "STANDARD",
  domainService: "RetailPosSaleService",
  emittedEvents: Object.freeze([]),
  errorCodes: Object.freeze([]),
});

function state(overrides = {}) {
  return Object.freeze({
    snapshotId: "snapshot-7",
    snapshotVersion: 7,
    subscriptionId: "subscription-a",
    subscriptionState: "ACTIVE",
    denySet: Object.freeze([]),
    licenses: Object.freeze([
      Object.freeze({
        id: "license-industry",
        licenseType: "INDUSTRY",
        subjectKey: "RTL",
        industryContextId: "industry-rtl",
        isEffective: true,
      }),
      Object.freeze({
        id: "license-ms",
        licenseType: "MANAGEMENT_SYSTEM",
        subjectKey: "RTL-POS",
        industryContextId: "industry-rtl",
        isEffective: true,
      }),
    ]),
    entitlements: Object.freeze([
      Object.freeze({ code: "rtl.pos.enabled", valueType: "BOOLEAN", value: true }),
      Object.freeze({ code: "rtl.reporting.enabled", valueType: "BOOLEAN", value: false }),
    ]),
    ...overrides,
  });
}

function service(current = state()) {
  return new CommercialCurrentStateService({
    async loadCurrent() {
      return current;
    },
  });
}

test("Commercial context resolution stamps the exact current snapshot", async () => {
  const current = service();
  const resolved = await current.validateAndLoad({
    requestId: "request-commercial-context",
    correlationId: "correlation-commercial-context",
    tenantId: "tenant-a",
    industryContextId: "industry-rtl",
    dataHomeId: "home-a",
    regionCode: "IN-CENTRAL",
    principalId: "principal-a",
    principalType: "HUMAN",
    scopeClass: "TENANT_INDUSTRY",
  });
  assert.deepEqual(resolved, {
    entitlementSnapshotId: "snapshot-7",
    entitlementSnapshotVersion: 7,
  });
});

test("Commercial guard accepts ACTIVE/GRACE exact current state and required entitlement", async () => {
  for (const subscriptionState of ["ACTIVE", "GRACE"]) {
    const result = await service(state({ subscriptionState })).validateCurrent({
      requestContext: context,
      operation,
    });
    assert.deepEqual(result, { allowed: true });
  }
});

test("Commercial guard fails closed when RequestContext snapshot is stale", async () => {
  await assert.rejects(
    service().validateCurrent({
      requestContext: { ...context, entitlementSnapshotVersion: 6 },
      operation,
    }),
    (error) => error instanceof CommercialStateError
      && error.code === "COMMERCIAL_CONTEXT_STALE",
  );
});

test("Commercial guard restricts non-usable subscription states", async () => {
  for (const subscriptionState of ["PENDING", "SUSPENDED", "EXPIRED", "CANCELLED"]) {
    const result = await service(state({ subscriptionState })).validateCurrent({
      requestContext: context,
      operation,
    });
    assert.equal(result.allowed, false);
    assert.equal(result.code, "SUBSCRIPTION_INVALID");
    assert.equal(result.reasonCode, "SUBSCRIPTION_RESTRICTED");
  }
});

test("Commercial guard requires the exact Industry license and rejects a revoked matching MS license", async () => {
  const noIndustry = state({
    licenses: Object.freeze([
      Object.freeze({
        id: "sibling",
        licenseType: "INDUSTRY",
        subjectKey: "MFG",
        industryContextId: "industry-mfg",
        isEffective: true,
      }),
    ]),
  });
  assert.equal((await service(noIndustry).validateCurrent({ requestContext: context, operation })).code, "LICENSE_INVALID");

  const revokedMs = state({
    licenses: Object.freeze([
      Object.freeze({
        id: "industry",
        licenseType: "INDUSTRY",
        subjectKey: "RTL",
        industryContextId: "industry-rtl",
        isEffective: true,
      }),
      Object.freeze({
        id: "ms",
        licenseType: "MANAGEMENT_SYSTEM",
        subjectKey: "RTL-POS",
        industryContextId: "industry-rtl",
        isEffective: false,
      }),
    ]),
  });
  assert.equal((await service(revokedMs).validateCurrent({ requestContext: context, operation })).code, "LICENSE_INVALID");
});

test("Commercial guard denies absent, false or deny-set entitlement requirements", async () => {
  for (const current of [
    state({ entitlements: Object.freeze([]) }),
    state({ entitlements: Object.freeze([
      Object.freeze({ code: "rtl.pos.enabled", valueType: "BOOLEAN", value: false }),
    ]) }),
    state({ denySet: Object.freeze(["rtl.pos.enabled"]) }),
  ]) {
    const result = await service(current).validateCurrent({ requestContext: context, operation });
    assert.equal(result.allowed, false);
    assert.equal(result.code, "ENTITLEMENT_DENIED");
    assert.equal(result.reasonCode, "ENTITLEMENT_MISSING");
  }
});

test("Authorization supplemental Commercial facts are server-owned canonical effective sets", async () => {
  const current = state({
    licenses: Object.freeze([
      ...state().licenses,
      Object.freeze({
        id: "seat",
        licenseType: "SEAT",
        subjectKey: "STAFF",
        principalId: "principal-a",
        isEffective: true,
      }),
    ]),
  });
  const facts = await service(current).load({ requestContext: context, operation });
  assert.equal(facts["commercial.subscriptionState"], "ACTIVE");
  assert.deepEqual(facts["commercial.licenseSet"], [
    "INDUSTRY:RTL",
    "MANAGEMENT_SYSTEM:RTL-POS",
    "SEAT:STAFF",
  ]);
  assert.deepEqual(facts["commercial.entitlementFacts"], ["rtl.pos.enabled"]);
});

test("PLATFORM_GLOBAL supplemental facts stay Commercial-empty", async () => {
  let called = false;
  const current = new CommercialCurrentStateService({
    async loadCurrent() {
      called = true;
      return state();
    },
  });
  const facts = await current.load({
    requestContext: {
      requestId: "platform-r",
      correlationId: "platform-c",
      principalId: "platform-p",
      principalType: "PLATFORM_OPERATOR",
      orgUnitPath: [],
      roleIds: [],
      scopeClass: "PLATFORM_GLOBAL",
    },
    operation: { ...operation, scopeClass: "PLATFORM_GLOBAL" },
  });
  assert.deepEqual(facts, {});
  assert.equal(called, false);
});


test("client Commercial projection exposes only enabled non-denied facts and no internal identifiers", async () => {
  const current = state({
    denySet: Object.freeze(["feature.denied"]),
    entitlements: Object.freeze([
      Object.freeze({ code: "feature.bool", valueType: "BOOLEAN", value: true }),
      Object.freeze({ code: "feature.disabled", valueType: "BOOLEAN", value: false }),
      Object.freeze({ code: "feature.integer", valueType: "INTEGER", value: 3 }),
      Object.freeze({ code: "feature.zero", valueType: "INTEGER", value: 0 }),
      Object.freeze({ code: "feature.decimal", valueType: "DECIMAL", value: 2.5 }),
      Object.freeze({ code: "feature.text", valueType: "TEXT", value: "pro" }),
      Object.freeze({ code: "feature.empty", valueType: "TEXT", value: "" }),
      Object.freeze({ code: "feature.set", valueType: "SET", value: ["b","a"] }),
      Object.freeze({ code: "feature.denied", valueType: "BOOLEAN", value: true }),
    ]),
  });
  const projection = await service(current).getClientCurrentProjection({
    requestContext: context,
  });
  assert.deepEqual(projection,{
    snapshotVersion:7,
    subscriptionState:"ACTIVE",
    entitlements:[
      {code:"feature.bool",valueType:"BOOLEAN",value:true},
      {code:"feature.decimal",valueType:"DECIMAL",value:2.5},
      {code:"feature.integer",valueType:"INTEGER",value:3},
      {code:"feature.set",valueType:"SET",value:["a","b"]},
      {code:"feature.text",valueType:"TEXT",value:"pro"},
    ],
  });
  const serialized=JSON.stringify(projection);
  for(const secret of [
    "snapshot-7","subscription-a","license-industry","license-ms",
    "principal-a","industry-rtl","feature.denied",
  ]){
    assert.equal(serialized.includes(secret),false);
  }
});

test("client Commercial projection fails closed on stale snapshot and invalid SET state", async () => {
  await assert.rejects(
    service().getClientCurrentProjection({
      requestContext:{...context,entitlementSnapshotVersion:6},
    }),
    error=>error instanceof CommercialStateError
      && error.code==="COMMERCIAL_CONTEXT_STALE",
  );

  await assert.rejects(
    service(state({
      entitlements:Object.freeze([
        Object.freeze({code:"feature.set",valueType:"SET",value:["dup","dup"]}),
      ]),
    })).getClientCurrentProjection({requestContext:context}),
    error=>error instanceof CommercialStateError
      && error.code==="COMMERCIAL_STATE_INVALID",
  );
});
