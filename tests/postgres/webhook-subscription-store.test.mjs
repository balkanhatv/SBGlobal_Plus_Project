import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresIntegrationDatabase } from "../../dist/server/database/postgres-integration-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresWebhookSubscriptionStore,
} from "../../dist/server/integration/postgres-webhook-subscription-store.js";
import {
  PostgresWebhookDeliveryStore,
} from "../../dist/server/integration/postgres-webhook-delivery-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});
const role = "sbg_webhook_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "principalA",
  "principalB",
  "membershipA",
  "membershipB",
  "industryA1",
  "industryA2",
  "industryB1",
  "activeA",
  "pendingA",
  "activeB",
  "eventIndustryA",
  "eventTenantA",
  "eventIndustryB",
  "deliveryIndustryA",
  "deliveryTenantA",
  "deliveryIndustryB",
  "correlationIndustryA",
  "correlationTenantA",
  "correlationIndustryB",
].map((key) => [key, randomUUID()]));

let pool;
let store;
let deliveryStore;

const eventTypeIndustry = "webhook.reader.industry." + randomBytes(6).toString("hex");
const eventTypeTenant = "webhook.reader.tenant." + randomBytes(6).toString("hex");

function contextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-WEBHOOK-READER",
    principalId: f.principalA,
    principalType: "HUMAN",
    membershipId: f.membershipA,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreA() {
  return Object.freeze({
    ...contextA(),
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
}

function tenantCoreB() {
  return Object.freeze({
    ...contextA(),
    tenantId: f.tenantB,
    industryContextId: undefined,
    principalId: f.principalB,
    membershipId: f.membershipB,
    scopeClass: "TENANT_CORE",
  });
}

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "CREATE ROLE " + role
        + " LOGIN PASSWORD '" + password
        + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await client.query("GRANT sbg_integration_service_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-WEBHOOK-READER','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Webhook tenant A"],
      [f.tenantB, "EDU", "Webhook tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-WEBHOOK-READER',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Webhook principal A"],
      [f.principalB, "Webhook principal B"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,created_at,updated_at)
         VALUES ($1,'HUMAN','ACTIVE',$2,now(),now())`,
        [principalId, label],
      );
    }

    for (const [membershipId, tenantId, principalId] of [
      [f.membershipA, f.tenantA, f.principalA],
      [f.membershipB, f.tenantB, f.principalB],
    ]) {
      await client.query(
        `INSERT INTO core_identity.tenant_membership
          (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,
        [membershipId, tenantId, principalId],
      );
    }

    for (const [id, tenantId, code, primary] of [
      [f.industryA1, f.tenantA, "RTL", true],
      [f.industryA2, f.tenantA, "MFG", false],
      [f.industryB1, f.tenantB, "EDU", true],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,
        [id, tenantId, code, primary],
      );
    }

    await client.query(
      `INSERT INTO core_integration.webhook_subscription
        (id,tenant_id,name,endpoint_url,status,secret_version,event_filter_json,
         allowed_industry_context_ids,permission_profile_id,created_by,verified_at,
         created_at,updated_at)
       VALUES
        ($1,$4,'Orders endpoint','https://example.invalid/hooks/orders','ACTIVE',2,
         '{"eventTypes":["order.created"],"minimumVersion":1}'::jsonb,
         ARRAY[$5::uuid,$6::uuid],NULL,$7,now(),now(),now()),
        ($2,$4,'Pending endpoint','https://pending.invalid/hook','PENDING_VERIFICATION',1,
         '{}'::jsonb,'{}'::uuid[],NULL,$7,NULL,now(),now()),
        ($3,$8,'Foreign endpoint','https://foreign.invalid/hook','ACTIVE',3,
         '{"eventTypes":["student.updated"]}'::jsonb,
         ARRAY[$9::uuid],NULL,$10,now(),now(),now())`,
      [
        f.activeA,
        f.pendingA,
        f.activeB,
        f.tenantA,
        f.industryA1,
        f.industryA2,
        f.principalA,
        f.tenantB,
        f.industryB1,
        f.principalB,
      ],
    );

    await client.query(
      "SELECT platform_directory.ensure_evidence_month_partitions(date_trunc('month',now())::date)",
    );

    const fixtureAt = new Date();
    const completedAt = new Date(fixtureAt.getTime() + 1000);
    const nextAttemptAt = new Date(fixtureAt.getTime() + 60000);

    await client.query(
      `INSERT INTO core_integration.event_catalog
        (event_type,event_version,producer_module,scope_class,payload_schema_json,
         sensitivity_class,ordering_key,consumer_classes_json,retention_audit_posture,
         webhook_eligible,backward_compatibility,status,created_at)
       VALUES
        ($1,1,'WebhookReaderTest','TENANT_INDUSTRY','{}'::jsonb,'INTERNAL',NULL,
         '[]'::jsonb,'TEST',true,'NONE','ACTIVE',$3),
        ($2,1,'WebhookReaderTest','TENANT_CORE','{}'::jsonb,'INTERNAL',NULL,
         '[]'::jsonb,'TEST',true,'NONE','ACTIVE',$3)`,
      [eventTypeIndustry, eventTypeTenant, fixtureAt],
    );

    const events = [
      [f.eventIndustryA, f.tenantA, f.industryA1, eventTypeIndustry, "TENANT_INDUSTRY", f.correlationIndustryA, "industry-a"],
      [f.eventTenantA, f.tenantA, null, eventTypeTenant, "TENANT_CORE", f.correlationTenantA, "tenant-a"],
      [f.eventIndustryB, f.tenantB, f.industryB1, eventTypeIndustry, "TENANT_INDUSTRY", f.correlationIndustryB, "industry-b"],
    ];
    for (const [eventId, tenantId, industryContextId, eventType, scopeClass, correlationId, resourceId] of events) {
      await client.query(
        "INSERT INTO core_integration.outbox_event_identity(id,created_at) VALUES ($1,$2)",
        [eventId, fixtureAt],
      );
      const envelope = {
        eventId,
        eventType,
        eventVersion: 1,
        scopeClass,
        tenantId,
        ...(industryContextId ? {industryContextId} : {}),
        actorType: "SERVICE",
        sourceModule: "WebhookReaderTest",
        sourceResourceType: "Fixture",
        sourceResourceId: resourceId,
        correlationId,
        occurredAt: fixtureAt.toISOString(),
        dataSensitivity: "INTERNAL",
        residencyRegion: "IN-WEBHOOK-READER",
        payloadSchema: "test.v1",
        payload: {fixture: true},
      };
      await client.query(
        `INSERT INTO core_integration.outbox_event
          (id,tenant_id,industry_context_id,event_type,event_version,aggregate_type,
           aggregate_id,aggregate_version,envelope_jsonb,status,attempt_count,
           available_at,locked_at,locked_by,dispatched_at,last_error_code,created_at,
           scope_class)
         VALUES ($1,$2,$3,$4,1,'Fixture',$5,1,$6::jsonb,'PENDING',0,$7,NULL,NULL,NULL,NULL,$7,$8)`,
        [
          eventId,
          tenantId,
          industryContextId,
          eventType,
          resourceId,
          JSON.stringify(envelope),
          fixtureAt,
          scopeClass,
        ],
      );
    }

    const deliveries = [
      [
        f.deliveryIndustryA,
        f.activeA,
        f.eventIndustryA,
        1,
        "https://example.invalid/hooks/orders",
        "digest-industry-a",
        "RETRY_EVIDENCE",
        503,
        completedAt,
        nextAttemptAt,
        "TRANSPORT_EVIDENCE",
        f.correlationIndustryA,
      ],
      [
        f.deliveryTenantA,
        f.activeA,
        f.eventTenantA,
        1,
        "https://example.invalid/hooks/orders",
        "digest-tenant-a",
        "PERSISTED_EVIDENCE",
        null,
        null,
        null,
        null,
        f.correlationTenantA,
      ],
      [
        f.deliveryIndustryB,
        f.activeB,
        f.eventIndustryB,
        1,
        "https://foreign.invalid/hook",
        "digest-industry-b",
        "PERSISTED_EVIDENCE",
        202,
        completedAt,
        null,
        null,
        f.correlationIndustryB,
      ],
    ];
    for (const [
      deliveryId, subscriptionId, eventId, attemptNo, endpointSnapshot, payloadDigest,
      status, httpStatus, completed, nextAttempt, errorClass, correlationId,
    ] of deliveries) {
      await client.query(
        `INSERT INTO core_integration.webhook_delivery_identity
          (id,created_at,subscription_id,event_id,attempt_no)
         VALUES ($1,$2,$3,$4,$5)`,
        [deliveryId, fixtureAt, subscriptionId, eventId, attemptNo],
      );
      await client.query(
        `INSERT INTO core_integration.webhook_delivery
          (id,subscription_id,event_id,attempt_no,endpoint_snapshot,payload_digest,
           status,http_status,started_at,completed_at,next_attempt_at,error_class,
           correlation_id,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$9)`,
        [
          deliveryId,
          subscriptionId,
          eventId,
          attemptNo,
          endpointSnapshot,
          payloadDigest,
          status,
          httpStatus,
          fixtureAt,
          completed,
          nextAttempt,
          errorClass,
          correlationId,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role;
  url.password = password;
  pool = new pg.Pool({
    connectionString: url.toString(),
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  const scoped = new RequestScopedSql(new PostgresIntegrationDatabase(pool), {
    dataHomeId: f.home,
    regionCode: "IN-WEBHOOK-READER",
  });
  store = new PostgresWebhookSubscriptionStore(scoped);
  deliveryStore = new PostgresWebhookDeliveryStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_integration.webhook_delivery WHERE id=ANY($1::uuid[])",
      [[f.deliveryIndustryA, f.deliveryTenantA, f.deliveryIndustryB]],
    );
    await client.query(
      "DELETE FROM core_integration.webhook_delivery_identity WHERE id=ANY($1::uuid[])",
      [[f.deliveryIndustryA, f.deliveryTenantA, f.deliveryIndustryB]],
    );
    await client.query(
      "DELETE FROM core_integration.outbox_event WHERE id=ANY($1::uuid[])",
      [[f.eventIndustryA, f.eventTenantA, f.eventIndustryB]],
    );
    await client.query(
      "DELETE FROM core_integration.outbox_event_identity WHERE id=ANY($1::uuid[])",
      [[f.eventIndustryA, f.eventTenantA, f.eventIndustryB]],
    );
    await client.query(
      "DELETE FROM core_integration.webhook_subscription WHERE id=ANY($1::uuid[])",
      [[f.activeA, f.pendingA, f.activeB]],
    );
    await client.query(
      "DELETE FROM core_integration.event_catalog WHERE event_type=ANY($1::text[])",
      [[eventTypeIndustry, eventTypeTenant]],
    );
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipA, f.membershipB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1, f.industryA2, f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.principalA, f.principalB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA, f.tenantB]],
    );
    await client.query(
      "DELETE FROM platform_directory.data_home WHERE id=$1",
      [f.home],
    );
    await client.query("DROP ROLE IF EXISTS " + role);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await admin.end();
  }
});

test("WH-SUB-PG-001 exact Tenant subscription preserves raw persisted facts", async () => {
  const subscription = await store.loadForContext({
    requestContext: tenantCoreA(),
    subscriptionId: f.activeA,
  });

  assert.ok(subscription);
  assert.equal(subscription.id, f.activeA);
  assert.equal(subscription.tenantId, f.tenantA);
  assert.equal(subscription.status, "ACTIVE");
  assert.equal(subscription.secretVersion, 2);
  assert.equal(subscription.endpointUrl, "https://example.invalid/hooks/orders");
  assert.deepEqual(subscription.allowedIndustryContextIds, [f.industryA1, f.industryA2]);
  assert.deepEqual(subscription.eventFilterJson, {
    eventTypes: ["order.created"],
    minimumVersion: 1,
  });
  assert.equal(typeof subscription.verifiedAt, "string");
  assert.equal(Object.isFrozen(subscription), true);
  assert.equal(Object.isFrozen(subscription.allowedIndustryContextIds), true);
  assert.equal(Object.isFrozen(subscription.eventFilterJson), true);
});

test("WH-SUB-PG-002 FORCE-RLS hides foreign Tenant subscription", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    subscriptionId: f.activeB,
  });
  assert.equal(hidden, null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    subscriptionId: f.activeB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.deepEqual(own.allowedIndustryContextIds, [f.industryB1]);
});

test("WH-SUB-PG-003 Tenant Core subscription is visible from same-Tenant Industry context", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    subscriptionId: f.activeA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    subscriptionId: f.activeA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.id, fromTenant.id);
  assert.equal(fromIndustry.tenantId, f.tenantA);
});

test("WH-SUB-PG-004 pending/unverified subscription remains raw non-executable evidence", async () => {
  const subscription = await store.loadForContext({
    requestContext: tenantCoreA(),
    subscriptionId: f.pendingA,
  });

  assert.ok(subscription);
  assert.equal(subscription.status, "PENDING_VERIFICATION");
  assert.equal(subscription.secretVersion, 1);
  assert.equal(subscription.verifiedAt, undefined);
  assert.deepEqual(subscription.allowedIndustryContextIds, []);
  assert.deepEqual(subscription.eventFilterJson, {});
  assert.equal("verified" in subscription, false);
  assert.equal("deliverable" in subscription, false);
});

test("WH-SUB-PG-005 malformed id or route/context mismatch fails closed", async () => {
  await assert.rejects(
    store.loadForContext({
      requestContext: tenantCoreA(),
      subscriptionId: "not-a-uuid",
    }),
  );

  await assert.rejects(
    store.loadForContext({
      requestContext: {
        ...tenantCoreA(),
        dataHomeId: randomUUID(),
      },
      subscriptionId: f.activeA,
    }),
  );
});


test("WH-DEL-PG-001 exact Industry delivery preserves raw persisted attempt evidence", async () => {
  const delivery = await deliveryStore.loadForContext({
    requestContext: contextA(),
    deliveryId: f.deliveryIndustryA,
  });

  assert.ok(delivery);
  assert.equal(delivery.id, f.deliveryIndustryA);
  assert.equal(delivery.subscriptionId, f.activeA);
  assert.equal(delivery.eventId, f.eventIndustryA);
  assert.equal(delivery.attemptNo, 1);
  assert.equal(delivery.endpointSnapshot, "https://example.invalid/hooks/orders");
  assert.equal(delivery.payloadDigest, "digest-industry-a");
  assert.equal(delivery.status, "RETRY_EVIDENCE");
  assert.equal(delivery.httpStatus, 503);
  assert.equal(delivery.errorClass, "TRANSPORT_EVIDENCE");
  assert.equal(delivery.correlationId, f.correlationIndustryA);
  assert.equal(typeof delivery.completedAt, "string");
  assert.equal(typeof delivery.nextAttemptAt, "string");
  assert.equal(Object.isFrozen(delivery), true);
  assert.equal("retryable" in delivery, false);
  assert.equal("deliverable" in delivery, false);
});

test("WH-DEL-PG-002 sibling Industry cannot observe delivery whose event is Industry-scoped", async () => {
  const hidden = await deliveryStore.loadForContext({
    requestContext: contextA(f.industryA2),
    deliveryId: f.deliveryIndustryA,
  });
  assert.equal(hidden, null);

  const own = await deliveryStore.loadForContext({
    requestContext: contextA(f.industryA1),
    deliveryId: f.deliveryIndustryA,
  });
  assert.ok(own);
  assert.equal(own.eventId, f.eventIndustryA);
});

test("WH-DEL-PG-003 Tenant-Core event delivery is same-Tenant visible from Tenant Core and Industry contexts", async () => {
  const fromTenant = await deliveryStore.loadForContext({
    requestContext: tenantCoreA(),
    deliveryId: f.deliveryTenantA,
  });
  const fromIndustry = await deliveryStore.loadForContext({
    requestContext: contextA(),
    deliveryId: f.deliveryTenantA,
  });

  assert.ok(fromTenant);
  assert.ok(fromIndustry);
  assert.equal(fromTenant.id, f.deliveryTenantA);
  assert.equal(fromIndustry.id, f.deliveryTenantA);
  assert.equal(fromTenant.httpStatus, undefined);
  assert.equal(fromTenant.completedAt, undefined);
  assert.equal(fromTenant.nextAttemptAt, undefined);
  assert.equal(fromTenant.errorClass, undefined);
});

test("WH-DEL-PG-004 foreign Tenant delivery is hidden by parent subscription/event RLS", async () => {
  const hidden = await deliveryStore.loadForContext({
    requestContext: tenantCoreA(),
    deliveryId: f.deliveryIndustryB,
  });
  assert.equal(hidden, null);

  const own = await deliveryStore.loadForContext({
    requestContext: {
      ...tenantCoreB(),
      industryContextId: f.industryB1,
      scopeClass: "TENANT_INDUSTRY",
    },
    deliveryId: f.deliveryIndustryB,
  });
  assert.ok(own);
  assert.equal(own.subscriptionId, f.activeB);
  assert.equal(own.httpStatus, 202);
});

test("WH-DEL-PG-005 malformed id or route/context mismatch fails closed", async () => {
  await assert.rejects(
    deliveryStore.loadForContext({
      requestContext: tenantCoreA(),
      deliveryId: "not-a-uuid",
    }),
  );

  await assert.rejects(
    deliveryStore.loadForContext({
      requestContext: {
        ...tenantCoreA(),
        dataHomeId: randomUUID(),
      },
      deliveryId: f.deliveryTenantA,
    }),
  );
});
