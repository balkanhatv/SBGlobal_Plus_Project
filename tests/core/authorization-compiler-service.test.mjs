import test from "node:test";
import assert from "node:assert/strict";

import {
  AuthorizationCompilerService,
  AuthorizationCompilerWriteError,
} from "../../dist/core/index.js";

const ids = [
  "41000000-0000-0000-0000-000000000001",
  "41000000-0000-0000-0000-000000000002",
  "41000000-0000-0000-0000-000000000003",
  "41000000-0000-0000-0000-000000000004",
];

const tenantContext = Object.freeze({
  requestId: "request-compiler-1",
  correlationId: "correlation-compiler-1",
  tenantId: "41000000-0000-0000-0000-000000000010",
  industryContextId: "41000000-0000-0000-0000-000000000011",
  dataHomeId: "41000000-0000-0000-0000-000000000012",
  regionCode: "IN-COMPILER",
  principalId: "41000000-0000-0000-0000-000000000013",
  principalType: "SERVICE",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_INDUSTRY",
});

const target = Object.freeze({
  tenantId: tenantContext.tenantId,
  industryContextId: tenantContext.industryContextId,
  principalId: "41000000-0000-0000-0000-000000000020",
  scopeClass: "TENANT_INDUSTRY",
});

function fixture() {
  const calls = [];
  let cursor = 0;
  const result = Object.freeze({
    subjectId: "41000000-0000-0000-0000-000000000099",
    snapshotId: "41000000-0000-0000-0000-000000000098",
    permissionVersion: 3,
  });
  const invalidated = Object.freeze({
    subjectId: result.subjectId,
    permissionVersion: 3,
    invalidated: true,
  });
  const store = {
    async publishTenant(input) { calls.push(["publishTenant", input]); return result; },
    async invalidateTenant(input) { calls.push(["invalidateTenant", input]); return invalidated; },
    async publishPlatform(input) { calls.push(["publishPlatform", input]); return result; },
    async invalidatePlatform(input) { calls.push(["invalidatePlatform", input]); return invalidated; },
  };
  const service = new AuthorizationCompilerService({
    store,
    ids: { nextId: () => ids[cursor++] ?? "41000000-0000-0000-0000-000000000099" },
  });
  return { calls, service, result, invalidated };
}

test("tenant compiler validates v1 payload and canonicalizes role IDs before store publication", async () => {
  const { service, calls, result } = fixture();
  const roleA = "41000000-0000-0000-0000-000000000031";
  const roleB = "41000000-0000-0000-0000-000000000030";

  assert.deepEqual(await service.publishTenant({
    requestContext: tenantContext,
    target,
    roleIds: [roleA, roleB],
    permissionSet: { permissions: [{ code: "rtl.pos.sale.view", effect: "ALLOW" }] },
    sourceFingerprint: "compiler-source-fingerprint-v1",
  }), result);

  const [, input] = calls[0];
  assert.deepEqual(input.publication.roleIds, [roleB, roleA]);
  assert.deepEqual(input.publication.permissionSet.permissions, [
    { code: "rtl.pos.sale.view", effect: "ALLOW" },
  ]);
  assert.equal(input.subjectCreateId, ids[0]);
  assert.equal(input.snapshotId, ids[1]);
});

test("compiler rejects non-service actors, sibling scope, malformed policy data and duplicate roles", async () => {
  for (const input of [
    {
      requestContext: { ...tenantContext, principalType: "HUMAN" },
      target,
      roleIds: [],
      permissionSet: { permissions: [] },
      sourceFingerprint: "compiler-source-fingerprint-v1",
    },
    {
      requestContext: tenantContext,
      target: { ...target, industryContextId: "41000000-0000-0000-0000-000000000099" },
      roleIds: [],
      permissionSet: { permissions: [] },
      sourceFingerprint: "compiler-source-fingerprint-v1",
    },
    {
      requestContext: tenantContext,
      target,
      roleIds: [],
      permissionSet: { permissions: [{ code: "bad.code", effect: "ALLOW" }] },
      sourceFingerprint: "compiler-source-fingerprint-v1",
    },
    {
      requestContext: tenantContext,
      target,
      roleIds: [
        "41000000-0000-0000-0000-000000000031",
        "41000000-0000-0000-0000-000000000031",
      ],
      permissionSet: { permissions: [] },
      sourceFingerprint: "compiler-source-fingerprint-v1",
    },
  ]) {
    const { service } = fixture();
    await assert.rejects(
      service.publishTenant(input),
      (error) => error instanceof AuthorizationCompilerWriteError
        && ["AUTHORIZATION_COMPILER_SCOPE_INVALID","AUTHORIZATION_COMPILER_PAYLOAD_INVALID"].includes(error.code),
    );
  }
});

test("platform compiler requires service PLATFORM_GLOBAL context and keeps target separate from actor", async () => {
  const { service, calls } = fixture();
  const requestContext = Object.freeze({
    requestId: "request-platform-compiler",
    correlationId: "correlation-platform-compiler",
    principalId: "41000000-0000-0000-0000-000000000040",
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "PLATFORM_GLOBAL",
  });
  const platformTarget = Object.freeze({
    principalId: "41000000-0000-0000-0000-000000000041",
  });

  await service.publishPlatform({
    requestContext,
    target: platformTarget,
    roleIds: [],
    permissionSet: { permissions: [{ code: "core.platform.tenant.view", effect: "ALLOW" }] },
    sourceFingerprint: "platform-compiler-source-v1",
  });

  assert.equal(calls[0][0], "publishPlatform");
  assert.equal(calls[0][1].target.principalId, platformTarget.principalId);
  assert.notEqual(calls[0][1].target.principalId, requestContext.principalId);
});

test("compiler invalidation uses the exact governed tenant/platform target without generating snapshot IDs", async () => {
  const { service, calls, invalidated } = fixture();
  assert.deepEqual(await service.invalidateTenant({ requestContext: tenantContext, target }), invalidated);

  const platformContext = Object.freeze({
    requestId: "request-platform-invalidate",
    correlationId: "correlation-platform-invalidate",
    principalId: "41000000-0000-0000-0000-000000000050",
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "PLATFORM_GLOBAL",
  });
  assert.deepEqual(await service.invalidatePlatform({
    requestContext: platformContext,
    target: { principalId: "41000000-0000-0000-0000-000000000051" },
  }), invalidated);

  assert.deepEqual(calls.map(([name]) => name), ["invalidateTenant","invalidatePlatform"]);
});
