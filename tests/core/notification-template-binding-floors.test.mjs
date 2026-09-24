import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesNotificationDeliveryTemplateBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  template: "66666666-6666-4666-8666-666666666666",
  otherTemplate: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
});

const baseDelivery = Object.freeze({
  id: ids.delivery,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  scopeClass: "TENANT_INDUSTRY",
  templateId: ids.template,
  templateVersion: 3,
  recipientReference: "opaque-recipient",
  channel: "EMAIL",
  correlationId: "99999999-9999-4999-8999-999999999999",
  status: "QUEUED",
  queuedAt: "2026-09-24T06:00:00.000Z",
  rowVersion: 1,
});

const baseTemplate = Object.freeze({
  id: ids.template,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "order-update",
  channel: "EMAIL",
  localeCode: "en-IN",
  version: 3,
  status: "ACTIVE",
  subjectTemplate: "opaque-subject",
  bodyTemplate: "opaque-body",
  safePreviewTemplate: "opaque-preview",
  variableSchema: Object.freeze({type: "object"}),
  createdBy: ids.principal,
  approvedBy: ids.principal,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

function delivery(overrides = {}) {
  return Object.freeze({...baseDelivery, ...overrides});
}

function template(overrides = {}) {
  return Object.freeze({...baseTemplate, ...overrides});
}

test("NOTIF-TPL-CUR-001 unbound delivery with no version/template evidence matches", () => {
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({templateId: undefined, templateVersion: undefined}),
      undefined,
    ),
    true,
  );
});

test("NOTIF-TPL-CUR-002 exact ACTIVE PLATFORM template applies to Core and Industry delivery", () => {
  const platformTemplate = template({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });

  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      platformTemplate,
    ),
    true,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(delivery(), platformTemplate),
    true,
  );
});

test("NOTIF-TPL-CUR-003 same-Tenant TENANT template applies to Core/Industry and foreign Tenant fails", () => {
  const tenantTemplate = template({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });

  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      tenantTemplate,
    ),
    true,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(delivery(), tenantTemplate),
    true,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery(),
      template({
        ownerScope: "TENANT",
        tenantId: ids.tenantB,
        industryContextId: undefined,
      }),
    ),
    false,
  );
});

test("NOTIF-TPL-CUR-004 INDUSTRY template applies only to exact same-Tenant Industry", () => {
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(delivery(), template()),
    true,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({industryContextId: ids.industryB}),
      template(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      template(),
    ),
    false,
  );
});

test("NOTIF-TPL-CUR-005 id/version/status/channel mismatches fail closed", () => {
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery(),
      template({id: ids.otherTemplate}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({templateVersion: undefined}),
      template(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({templateVersion: 2}),
      template(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({templateVersion: 0}),
      template({version: 0}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery(),
      template({status: "PUBLISHED"}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery(),
      template({channel: "SMS"}),
    ),
    false,
  );
});

test("NOTIF-TPL-CUR-006 malformed ownership or unexpected template evidence fails closed", () => {
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({id: "not-a-uuid"}),
      template(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({scopeClass: "TENANT_CORE"}),
      template({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery(),
      template({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({templateId: undefined, templateVersion: undefined}),
      template(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      delivery({templateId: undefined, templateVersion: 3}),
      undefined,
    ),
    false,
  );
});

test("NOTIF-TPL-CUR-007 rendering, approval and delivery runtime semantics remain uninterpreted without mutation", () => {
  const candidateDelivery = delivery({
    recipientPrincipalId: ids.principal,
    recipientReference: "uninterpreted",
    status: "FAILED",
    sentAt: "not-interpreted",
    deliveredAt: "also-not-interpreted",
    lastErrorCode: "UNINTERPRETED",
    tenantIntegrationId: ids.otherTemplate,
    sourceEventId: ids.otherTemplate,
  });
  const candidateTemplate = template({
    code: "",
    localeCode: "",
    subjectTemplate: "",
    bodyTemplate: "",
    safePreviewTemplate: "",
    variableSchema: Object.freeze({anything: Object.freeze({goes: true})}),
    createdBy: "",
    approvedBy: undefined,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeDelivery = JSON.stringify(candidateDelivery);
  const beforeTemplate = JSON.stringify(candidateTemplate);

  assert.equal(
    matchesNotificationDeliveryTemplateBindingFloors(
      candidateDelivery,
      candidateTemplate,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateDelivery), beforeDelivery);
  assert.equal(JSON.stringify(candidateTemplate), beforeTemplate);
});
