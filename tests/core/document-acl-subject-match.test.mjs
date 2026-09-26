import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAclSubjectMatcher,
  DocumentAclSubjectMatchError,
} from "../../dist/core/index.js";

const ids = {
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  principal: "33333333-3333-4333-8333-333333333333",
  roleA: "44444444-4444-4444-8444-444444444444",
  roleB: "55555555-5555-4555-8555-555555555555",
  orgRoot: "66666666-6666-4666-8666-666666666666",
  orgLeaf: "77777777-7777-4777-8777-777777777777",
  document: "88888888-8888-4888-8888-888888888888",
  otherDocument: "99999999-9999-4999-8999-999999999999",
  acl1: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  acl2: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  acl3: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  acl4: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
};

function context(overrides = {}) {
  return Object.freeze({
    requestId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    correlationId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    principalId: ids.principal,
    principalType: "HUMAN",
    roleIds: Object.freeze([ids.roleA]),
    orgUnitId: ids.orgLeaf,
    orgUnitPath: Object.freeze([ids.orgRoot, ids.orgLeaf]),
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function entry(overrides = {}) {
  return Object.freeze({
    id: ids.acl1,
    documentId: ids.document,
    subjectType: "PRINCIPAL",
    subjectId: ids.principal,
    permission: "VIEW",
    effect: "ALLOW",
    validUntil: "2020-01-01T00:00:00.000Z",
    createdAt: "2019-01-01T00:00:00.000Z",
    ...overrides,
  });
}

test("DOC-ACL-MATCH-001 principal match filters only the explicit requested ACL permission", () => {
  const matcher = new DocumentAclSubjectMatcher();
  const result = matcher.match({
    requestContext: context(),
    documentId: ids.document,
    permission: "VIEW",
    entries: [
      entry(),
      entry({
        id: ids.acl2,
        permission: "DOWNLOAD",
        effect: "DENY",
      }),
    ],
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].subjectType, "PRINCIPAL");
  assert.equal(result[0].permission, "VIEW");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result[0]), true);
});

test("DOC-ACL-MATCH-002 role subject matches only resolved server-owned roleIds", () => {
  const matcher = new DocumentAclSubjectMatcher();
  const result = matcher.match({
    requestContext: context(),
    documentId: ids.document,
    permission: "DOWNLOAD",
    entries: [
      entry({
        id: ids.acl1,
        subjectType: "ROLE",
        subjectId: ids.roleA,
        permission: "DOWNLOAD",
        effect: "ALLOW",
      }),
      entry({
        id: ids.acl2,
        subjectType: "ROLE",
        subjectId: ids.roleB,
        permission: "DOWNLOAD",
        effect: "DENY",
      }),
    ],
  });

  assert.deepEqual(result.map((item) => item.subjectId), [ids.roleA]);
});

test("DOC-ACL-MATCH-003 org-unit subject matches current unit and ancestor UUIDs from orgUnitPath", () => {
  const matcher = new DocumentAclSubjectMatcher();
  const result = matcher.match({
    requestContext: context(),
    documentId: ids.document,
    permission: "SHARE",
    entries: [
      entry({
        id: ids.acl1,
        subjectType: "ORG_UNIT",
        subjectId: ids.orgRoot,
        permission: "SHARE",
      }),
      entry({
        id: ids.acl2,
        subjectType: "ORG_UNIT",
        subjectId: ids.orgLeaf,
        permission: "SHARE",
        effect: "DENY",
      }),
    ],
  });

  assert.deepEqual(result.map((item) => item.subjectId), [ids.orgRoot, ids.orgLeaf]);
});

test("DOC-ACL-MATCH-004 matcher preserves effect and expiry evidence without interpreting either", () => {
  const matcher = new DocumentAclSubjectMatcher();
  const result = matcher.match({
    requestContext: context(),
    documentId: ids.document,
    permission: "VIEW",
    entries: [
      entry({
        id: ids.acl1,
        effect: "ALLOW",
        validUntil: "2020-01-01T00:00:00.000Z",
      }),
      entry({
        id: ids.acl2,
        subjectType: "ROLE",
        subjectId: ids.roleA,
        effect: "DENY",
        validUntil: "2030-01-01T00:00:00.000Z",
      }),
    ],
  });

  assert.deepEqual(result.map((item) => [item.effect, item.validUntil]), [
    ["ALLOW", "2020-01-01T00:00:00.000Z"],
    ["DENY", "2030-01-01T00:00:00.000Z"],
  ]);
});

test("DOC-ACL-MATCH-005 no matching subject returns empty evidence and never invents an access decision", () => {
  const matcher = new DocumentAclSubjectMatcher();
  const result = matcher.match({
    requestContext: context({
      principalId: "12121212-1212-4121-8121-121212121212",
      roleIds: Object.freeze([]),
      orgUnitPath: Object.freeze([]),
    }),
    documentId: ids.document,
    permission: "VIEW",
    entries: [entry()],
  });

  assert.deepEqual(result, []);
  assert.equal("allowed" in result, false);
  assert.equal("decision" in result, false);
});

test("DOC-ACL-MATCH-006 malformed context or cross-document evidence fails closed", () => {
  const matcher = new DocumentAclSubjectMatcher();

  assert.throws(
    () => matcher.match({
      requestContext: context({industryContextId: undefined}),
      documentId: ids.document,
      permission: "VIEW",
      entries: [entry()],
    }),
    (error) => error instanceof DocumentAclSubjectMatchError
      && error.code === "ACL_MATCH_CONTEXT_INVALID",
  );

  assert.throws(
    () => matcher.match({
      requestContext: context(),
      documentId: ids.document,
      permission: "VIEW",
      entries: [entry({documentId: ids.otherDocument})],
    }),
    (error) => error instanceof DocumentAclSubjectMatchError
      && error.code === "ACL_MATCH_INPUT_INVALID",
  );
});
