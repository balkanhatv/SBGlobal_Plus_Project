import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PostgresCredentialReferenceMetadataStore } from "../../dist/server/integration/postgres-credential-reference-metadata-store.js";
import { PostgresSyncCursorStore } from "../../dist/server/integration/postgres-sync-cursor-store.js";
import { PostgresTenantIntegrationStore } from "../../dist/server/integration/postgres-tenant-integration-store.js";
import { PostgresWebhookDeliveryStore } from "../../dist/server/integration/postgres-webhook-delivery-store.js";
import { PostgresWebhookSubscriptionStore } from "../../dist/server/integration/postgres-webhook-subscription-store.js";

test("tenant-scoped Integration readers reject present-empty Industry on TENANT_CORE before scoped SQL", async () => {
  let scopedCalls = 0;
  const scopedSql = {
    async withContext() {
      scopedCalls += 1;
      throw new Error("scoped SQL must not be reached");
    },
  };

  const requestContext = {
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: randomUUID(),
    industryContextId: "",
    dataHomeId: randomUUID(),
    regionCode: "IN-INT-BOUNDARY",
    principalId: randomUUID(),
    principalType: "SERVICE",
    orgUnitPath: [],
    roleIds: [],
    scopeClass: "TENANT_CORE",
  };

  const id = randomUUID();
  const cases = [
    () => new PostgresCredentialReferenceMetadataStore(scopedSql).loadForContext({
      requestContext,
      credentialReferenceId: id,
    }),
    () => new PostgresSyncCursorStore(scopedSql).loadExact({
      requestContext,
      tenantIntegrationId: id,
      capabilityCode: "SYNC",
    }),
    () => new PostgresTenantIntegrationStore(scopedSql).loadForContext({
      requestContext,
      tenantIntegrationId: id,
    }),
    () => new PostgresWebhookDeliveryStore(scopedSql).loadForContext({
      requestContext,
      deliveryId: id,
    }),
    () => new PostgresWebhookSubscriptionStore(scopedSql).loadForContext({
      requestContext,
      subscriptionId: id,
    }),
  ];

  for (const run of cases) {
    await assert.rejects(run());
  }
  assert.equal(scopedCalls, 0);
});
