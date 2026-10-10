import test from "node:test";
import assert from "node:assert/strict";

import {
  loadDocumentUploadSessionActingPrincipalEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  foreignTenant: "12121212-1212-4212-8212-121212121212",
  industry: "22222222-2222-4222-8222-222222222222",
  siblingIndustry: "23232323-2323-4232-8232-232323232323",
  principal: "33333333-3333-4333-8333-333333333333",
  otherPrincipal: "34343434-3434-4434-8434-343434343434",
  session: "44444444-4444-4444-8444-444444444444",
  correlation: "55555555-5555-4555-8555-555555555555",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "data-home-1",
    regionCode: "IN-CENTRAL",
    principalId: ids.principal,
    principalType: "HUMAN",
    membershipId: "66666666-6666-4666-8666-666666666666",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    permissionVersion: 1,
    entitlementSnapshotVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function session(overrides = {}) {
  return Object.freeze({
    id: ids.session,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    principalId: ids.principal,
    expectedMediaTypes: Object.freeze(["application/pdf", "image/png"]),
    maxSizeClass: "RAW_SIZE_CLASS",
    expiresAt: "2020-01-01T00:00:00.000Z",
    status: "REJECTED",
    tempObjectRef: "raw-temp-object",
    checksumExpected: "raw-checksum",
    createdAt: "2026-10-05T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const calls = [];
  const value = Object.hasOwn(overrides, "session")
    ? overrides.session
    : session();

  const reader = {
    async loadForContext(input) {
      calls.push(input);
      if (overrides.error) throw overrides.error;
      return value;
    },
  };

  return {calls, reader, value};
}

async function load(f, inputOverrides = {}) {
  return loadDocumentUploadSessionActingPrincipalEvidence(
    {
      requestContext: context(),
      uploadSessionId: ids.session,
      ...inputOverrides,
    },
    f.reader,
  );
}

test("DOC-UPOWN-BASE-001 exact DD-087 read executes once with exact RequestContext/session id", async () => {
  const f = fixture();
  const ctx = context();
  const result = await load(f, {requestContext: ctx});

  assert.ok(result);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].requestContext, ctx);
  assert.equal(f.calls[0].uploadSessionId, ids.session);
});

test("DOC-UPOWN-BASE-002 DD-087 null returns null and dependency errors propagate unchanged without retry/fallback", async () => {
  const hidden = fixture({session: null});
  assert.equal(await load(hidden), null);
  assert.equal(hidden.calls.length, 1);

  const expected = new Error("upload-session-unavailable");
  const broken = fixture({error: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.equal(broken.calls.length, 1);
});

test("DOC-UPOWN-SCOPE-001 exact Tenant-Core and Tenant-Industry session/context continuity passes", async () => {
  assert.ok(await load(fixture()));

  const coreContext = context({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });
  const core = fixture({
    session: session({
      scopeClass: "TENANT_CORE",
      industryContextId: undefined,
    }),
  });
  const result = await load(core, {requestContext: coreContext});
  assert.ok(result);
  assert.equal(result.session, core.value);
});

test("DOC-UPOWN-SCOPE-002 Tenant/scope/null-vs-present/sibling-Industry mismatch fails closed", async () => {
  const cases = [
    {
      ctx: context(),
      value: session({tenantId: ids.foreignTenant}),
    },
    {
      ctx: context({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      value: session(),
    },
    {
      ctx: context({scopeClass: "TENANT_INDUSTRY", industryContextId: ids.industry}),
      value: session({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    },
    {
      ctx: context({scopeClass: "TENANT_INDUSTRY", industryContextId: ids.industry}),
      value: session({industryContextId: ids.siblingIndustry}),
    },
    {
      ctx: context({scopeClass: "TENANT_INDUSTRY", industryContextId: undefined}),
      value: session(),
    },
  ];

  for (const candidate of cases) {
    const f = fixture({session: candidate.value});
    assert.equal(await load(f, {requestContext: candidate.ctx}), null);
    assert.equal(f.calls.length, 1);
  }
});

test("DOC-UPOWN-PRINCIPAL-001 exact persisted session principal equals acting RequestContext principal", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.session.principalId, ids.principal);
  assert.equal(result.session, f.value);
});

test("DOC-UPOWN-PRINCIPAL-002 acting-principal mismatch fails closed without alternate owner/currentness lookup", async () => {
  const f = fixture({session: session({principalId: ids.otherPrincipal})});
  assert.equal(await load(f), null);
  assert.equal(f.calls.length, 1);

  const missing = fixture();
  assert.equal(
    await load(missing, {requestContext: context({principalId: undefined})}),
    null,
  );
  assert.equal(missing.calls.length, 1);
});

test("DOC-UPOWN-EVID-001 success returns frozen exact session-reference evidence and preserves raw upload facts unchanged", async () => {
  const raw = session();
  const f = fixture({session: raw});
  const before = JSON.stringify(raw);
  const result = await load(f);

  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.session, raw);
  assert.equal(result.session.expiresAt, "2020-01-01T00:00:00.000Z");
  assert.equal(result.session.status, "REJECTED");
  assert.deepEqual(result.session.expectedMediaTypes, ["application/pdf", "image/png"]);
  assert.equal(result.session.maxSizeClass, "RAW_SIZE_CLASS");
  assert.equal(result.session.tempObjectRef, "raw-temp-object");
  assert.equal(result.session.checksumExpected, "raw-checksum");
  assert.equal(JSON.stringify(raw), before);
});

test("DOC-UPOWN-BOUND-001 output exposes no usability expiry transition media/checksum storage or upload mutation authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "usable",
    "expired",
    "expiresNow",
    "statusTransitionAllowed",
    "mediaAllowed",
    "sizeAllowed",
    "checksumValid",
    "tempObjectValid",
    "principalActive",
    "authorized",
    "authorizationDecision",
    "signedUrl",
    "signedToken",
    "storageProvider",
    "storageDispatch",
    "uploadAuthorized",
    "finalizeAuthorized",
    "cancelAuthorized",
    "activateAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
