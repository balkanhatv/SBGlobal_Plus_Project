import test from "node:test";
import assert from "node:assert/strict";

import {
  AuthorizationPolicyGrammarError,
  canonicalAbacExpressionJsonV1,
  canonicalPermissionSetJsonV1,
  parseAbacExpressionV1,
  parsePermissionPatternV1,
  parsePermissionSetV1,
} from "../../dist/core/index.js";

function grammarError(error) {
  return error instanceof AuthorizationPolicyGrammarError
    && error.code === "AUTHORIZATION_POLICY_GRAMMAR_INVALID";
}

test("permission-set v1 accepts canonical sorted effective RBAC facts", () => {
  const parsed = parsePermissionSetV1({
    permissions: [
      { code: "core.identity.role.assign", effect: "DENY" },
      { code: "rtl.pos.refund.approve", effect: "ALLOW" },
    ],
  });

  assert.deepEqual(parsed, {
    permissions: [
      { code: "core.identity.role.assign", effect: "DENY" },
      { code: "rtl.pos.refund.approve", effect: "ALLOW" },
    ],
  });
  assert.equal(
    canonicalPermissionSetJsonV1(parsed),
    '{"permissions":[{"code":"core.identity.role.assign","effect":"DENY"},{"code":"rtl.pos.refund.approve","effect":"ALLOW"}]}',
  );
});

test("permission-set v1 rejects unsorted, duplicate, malformed or executable-shaped payloads", () => {
  for (const payload of [
    { permissions: [
      { code: "rtl.pos.sale.view", effect: "ALLOW" },
      { code: "core.identity.role.assign", effect: "ALLOW" },
    ] },
    { permissions: [
      { code: "rtl.pos.sale.view", effect: "ALLOW" },
      { code: "rtl.pos.sale.view", effect: "DENY" },
    ] },
    { permissions: [{ code: "rtl.pos.view", effect: "ALLOW" }] },
    { permissions: [{ code: "rtl.pos.sale.view", effect: "RESTRICT" }] },
    { permissions: [{ code: "rtl.pos.sale.view", effect: "ALLOW", eval: "process.exit()" }] },
  ]) {
    assert.throws(() => parsePermissionSetV1(payload), grammarError);
  }
});

test("ABAC expression v1 accepts only bounded data-only allowlisted nodes", () => {
  const expression = parseAbacExpressionV1({
    op: "all",
    args: [
      { op: "eq", attribute: "subject.type", value: "HUMAN" },
      { op: "contains", attribute: "subject.roles", value: "TENANT_ADMIN" },
      { op: "in", attribute: "resource.state", values: ["APPROVED", "OPEN"] },
      { op: "after", attribute: "environment.time", value: "2026-09-17T00:00:00Z" },
      { op: "exists", attribute: "commercial.subscriptionState" },
    ],
  });

  assert.equal(expression.op, "all");
  assert.equal(
    canonicalAbacExpressionJsonV1(expression),
    '{"op":"all","args":[{"op":"eq","attribute":"subject.type","value":"HUMAN"},{"op":"contains","attribute":"subject.roles","value":"TENANT_ADMIN"},{"op":"in","attribute":"resource.state","values":["APPROVED","OPEN"]},{"op":"after","attribute":"environment.time","value":"2026-09-17T00:00:00Z"},{"op":"exists","attribute":"commercial.subscriptionState"}]}',
  );
});

test("ABAC expression v1 rejects arbitrary execution, unknown attributes and operator/type mismatches", () => {
  for (const expression of [
    { op: "eval", code: "return true" },
    { op: "eq", attribute: "subject.__proto__", value: "x" },
    { op: "contains", attribute: "subject.type", value: "HUMAN" },
    { op: "eq", attribute: "subject.roles", value: "TENANT_ADMIN" },
    { op: "before", attribute: "resource.state", value: "2026-09-17T00:00:00Z" },
    { op: "after", attribute: "environment.time", value: "not-a-time" },
    { op: "all", args: [] },
    { op: "exists", attribute: "subject.principalId", sql: "select true" },
  ]) {
    assert.throws(() => parseAbacExpressionV1(expression), grammarError);
  }
});

test("ABAC expression v1 enforces the bounded maximum depth", () => {
  let expression = { op: "exists", attribute: "subject.principalId" };
  for (let index = 0; index < 8; index += 1) {
    expression = { op: "not", arg: expression };
  }
  assert.throws(() => parseAbacExpressionV1(expression), grammarError);
});

test("permission pattern v1 permits exact codes and terminal prefix wildcards only", () => {
  assert.equal(parsePermissionPatternV1("rtl.pos.sale.view"), "rtl.pos.sale.view");
  assert.equal(parsePermissionPatternV1("core.identity.*"), "core.identity.*");
  assert.equal(parsePermissionPatternV1("rtl.*"), "rtl.*");

  for (const pattern of [
    "*",
    "rtl.*.sale.view",
    "rtl.pos.sale.*.extra",
    "rtl.pos.sale.(view|edit)",
    "rtl.pos.sale",
  ]) {
    assert.throws(() => parsePermissionPatternV1(pattern), grammarError);
  }
});
