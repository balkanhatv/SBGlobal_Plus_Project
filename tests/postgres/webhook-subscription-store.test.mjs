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
import {
  PostgresOutboxEventStore,
} from "../../dist/server/integration/postgres-outbox-event-store.js";
import {
  PostgresEventCatalogStore,
} from "../../dist/server/integration/postgres-event-catalog-store.js";
import {
  PostgresIntegrationDefinitionStore,
} from "../../dist/server/integration/postgres-integration-definition-store.js";
import {
  PostgresIntegrationCapabilityStore,
} from "../../dist/server/integration/postgres-integration-capability-store.js";

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
  "definitionPlatform",
  "definitionIndustry",
  "capabilityPlatform",
  "capabilityIndustry",
].map((key) => [key, randomUUID()]));

let pool;
let store;
let deliveryStore;
let outboxStore;
let catalogStore;
let definitionStore;
let capabilityStore;

const eventTypeIndustry = "webhook.reader.industry." + randomBytes(6).toString("hex");
const eventTypeTenant = "webhook.reader.tenant." + randomBytes(6).toString("hex");
const definitionCodePlatform = "fixture.platform." + randomBytes(6).toString("hex");
const definitionCodeIndustry = "fixture.industry." + randomBytes(6).toString("hex");

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
      `INSERT INTO core_integration.integration_definition
        (id,code,name,provider_family,capability_codes,adapter_contract_version,
         owner_scope,status,data_transfer_class,residency_metadata_json,created_at,updated_at)
       VALUES
        ($1,$3,'Platform registry fixture','FixtureProvider',
         ARRAY['orders.read','orders.write'],'v1','PLATFORM','ACTIVE','INTERNAL',
         '{"regions":["IN"],"residencyRequired":true}'::jsonb,now(),now()),
        ($2,$4,'Industry registry fixture','FixtureProvider',
         ARRAY['lab.receive'],'v2','INDUSTRY','RETIRED','REGULATED',
         '{"regions":["IN-CENTRAL"],"notes":{"mode":"raw"}}'::jsonb,now(),now())`,
      [
        f.definitionPlatform,
        f.definitionIndustry,
        definitionCodePlatform,
        definitionCodeIndustry,
      ],
    );

    await client.query(
      `INSERT INTO core_integration.integration_capability
        (id,integration_definition_id,capability_code,direction,operation_contract_id,
         event_types,data_class,idempotency_class,rate_class,status)
       VALUES
        ($1,$3,'orders.read','OUTBOUND','core.orders.read',
         ARRAY['order.created'],'INTERNAL','READ_ONLY','AUTH_STANDARD','ACTIVE'),
        ($2,$4,'lab.receive','INBOUND',NULL,
         ARRAY['lab.result.received','lab.result.corrected'],'REGULATED',
         'IDEMPOTENT_EXTERNAL','EXTERNAL_WRITE','RETIRED')`,
      [
        f.capabilityPlatform,
        f.capabilityIndustry,
        f.definitionPlatform,
        f.definitionIndustry,
      ],
    );

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

    await client.query(
      `UPDATE core_integration.outbox_event
          SET status='DISPATCHING',
              attempt_count=2,
              locked_at=$2,
              locked_by='worker-fixture',
              last_error_code='transient-fixture'
        WHERE id=$1`,
      [f.eventIndustryA, fixtureAt],
    );
    await client.query(
      "UPDATE core_integration.event_catalog SET status='RETIRED' WHERE event_type=$1 AND event_version=1",
      [eventTypeTenant],
    );

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
  const integrationDatabase = new PostgresIntegrationDatabase(pool);
  const scoped = new RequestScopedSql(integrationDatabase, {
    dataHomeId: f.home,
    regionCode: "IN-WEBHOOK-READER",
  });
  store = new PostgresWebhookSubscriptionStore(scoped);
  deliveryStore = new PostgresWebhookDeliveryStore(scoped);
  outboxStore = new PostgresOutboxEventStore(scoped);
  catalogStore = new PostgresEventCatalogStore(integrationDatabase);
  definitionStore = new PostgresIntegrationDefinitionStore(integrationDatabase);
  capabilityStore = new PostgresIntegrationCapabilityStore(integrationDatabase);
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
      "DELETE FROM core_integration.integration_capability WHERE id=ANY($1::uuid[])",
      [[f.capabilityPlatform, f.capabilityIndustry]],
    );
    await client.query(
      "DELETE FROM core_integration.integration_definition WHERE id=ANY($1::uuid[])",
      [[f.definitionPlatform, f.definitionIndustry]],
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


test("EVT-OUT-PG-001 exact Industry outbox event preserves raw dispatcher evidence", async () => {
  const event = await outboxStore.loadForContext({
    requestContext: contextA(),
    eventId: f.eventIndustryA,
  });

  assert.ok(event);
  assert.equal(event.id, f.eventIndustryA);
  assert.equal(event.tenantId, f.tenantA);
  assert.equal(event.industryContextId, f.industryA1);
  assert.equal(event.scopeClass, "TENANT_INDUSTRY");
  assert.equal(event.eventType, eventTypeIndustry);
  assert.equal(event.eventVersion, 1);
  assert.equal(event.aggregateType, "Fixture");
  assert.equal(event.aggregateId, "industry-a");
  assert.equal(event.aggregateVersion, "1");
  assert.equal(event.status, "DISPATCHING");
  assert.equal(event.attemptCount, 2);
  assert.equal(event.lockedBy, "worker-fixture");
  assert.equal(event.lastErrorCode, "transient-fixture");
  assert.equal(typeof event.lockedAt, "string");
  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(event.envelopeJson), true);
  assert.equal(event.envelopeJson.eventId, f.eventIndustryA);
  assert.equal(event.envelopeJson.scopeClass, "TENANT_INDUSTRY");
  assert.equal("dispatchable" in event, false);
  assert.equal("retryable" in event, false);
});

test("EVT-OUT-PG-002 sibling Industry cannot observe Industry-scoped outbox event", async () => {
  const hidden = await outboxStore.loadForContext({
    requestContext: contextA(f.industryA2),
    eventId: f.eventIndustryA,
  });
  assert.equal(hidden, null);

  const own = await outboxStore.loadForContext({
    requestContext: contextA(f.industryA1),
    eventId: f.eventIndustryA,
  });
  assert.ok(own);
  assert.equal(own.industryContextId, f.industryA1);
});

test("EVT-OUT-PG-003 Tenant-Core outbox event is same-Tenant visible from Tenant Core and Industry contexts", async () => {
  const fromTenant = await outboxStore.loadForContext({
    requestContext: tenantCoreA(),
    eventId: f.eventTenantA,
  });
  const fromIndustry = await outboxStore.loadForContext({
    requestContext: contextA(),
    eventId: f.eventTenantA,
  });

  assert.ok(fromTenant);
  assert.ok(fromIndustry);
  assert.equal(fromTenant.scopeClass, "TENANT_CORE");
  assert.equal(fromTenant.industryContextId, undefined);
  assert.equal(fromIndustry.id, f.eventTenantA);
  assert.equal(fromTenant.status, "PENDING");
  assert.equal(fromTenant.attemptCount, 0);
});

test("EVT-OUT-PG-004 foreign Tenant outbox event is hidden by FORCE-RLS", async () => {
  const hidden = await outboxStore.loadForContext({
    requestContext: contextA(),
    eventId: f.eventIndustryB,
  });
  assert.equal(hidden, null);

  const own = await outboxStore.loadForContext({
    requestContext: {
      ...tenantCoreB(),
      industryContextId: f.industryB1,
      scopeClass: "TENANT_INDUSTRY",
    },
    eventId: f.eventIndustryB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.industryContextId, f.industryB1);
});

test("EVT-OUT-PG-005 malformed id or route/context mismatch fails closed", async () => {
  await assert.rejects(
    outboxStore.loadForContext({
      requestContext: tenantCoreA(),
      eventId: "not-a-uuid",
    }),
  );

  await assert.rejects(
    outboxStore.loadForContext({
      requestContext: {
        ...tenantCoreA(),
        dataHomeId: randomUUID(),
      },
      eventId: f.eventTenantA,
    }),
  );
});


test("EVT-CAT-PG-001 exact Event Catalog tuple preserves authoritative catalog facts", async () => {
  const entry = await catalogStore.loadExact({
    eventType: eventTypeIndustry,
    eventVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
  });

  assert.ok(entry);
  assert.equal(entry.eventType, eventTypeIndustry);
  assert.equal(entry.eventVersion, 1);
  assert.equal(entry.producerModule, "WebhookReaderTest");
  assert.equal(entry.scopeClass, "TENANT_INDUSTRY");
  assert.deepEqual(entry.payloadSchema, {});
  assert.equal(entry.sensitivityClass, "INTERNAL");
  assert.equal(entry.orderingKey, undefined);
  assert.deepEqual(entry.consumerClassesJson, []);
  assert.equal(entry.retentionAuditPosture, "TEST");
  assert.equal(entry.webhookEligible, true);
  assert.equal(entry.backwardCompatibility, "NONE");
  assert.equal(entry.status, "ACTIVE");
  assert.equal(Object.isFrozen(entry), true);
  assert.equal(Object.isFrozen(entry.payloadSchema), true);
  assert.equal(Object.isFrozen(entry.consumerClassesJson), true);
});

test("EVT-CAT-PG-002 RETIRED catalog row remains raw readable evidence", async () => {
  const entry = await catalogStore.loadExact({
    eventType: eventTypeTenant,
    eventVersion: 1,
    scopeClass: "TENANT_CORE",
  });

  assert.ok(entry);
  assert.equal(entry.status, "RETIRED");
  assert.equal(entry.scopeClass, "TENANT_CORE");
  assert.equal("usable" in entry, false);
  assert.equal("publishable" in entry, false);
});

test("EVT-CAT-PG-003 exact scope/version mismatch returns no catalog tuple", async () => {
  const wrongScope = await catalogStore.loadExact({
    eventType: eventTypeIndustry,
    eventVersion: 1,
    scopeClass: "TENANT_CORE",
  });
  const wrongVersion = await catalogStore.loadExact({
    eventType: eventTypeIndustry,
    eventVersion: 2,
    scopeClass: "TENANT_INDUSTRY",
  });

  assert.equal(wrongScope, null);
  assert.equal(wrongVersion, null);
});

test("EVT-CAT-PG-004 malformed tuple fails closed before query", async () => {
  await assert.rejects(
    catalogStore.loadExact({
      eventType: "",
      eventVersion: 1,
      scopeClass: "TENANT_CORE",
    }),
  );
  await assert.rejects(
    catalogStore.loadExact({
      eventType: eventTypeTenant,
      eventVersion: 0,
      scopeClass: "TENANT_CORE",
    }),
  );
  await assert.rejects(
    catalogStore.loadExact({
      eventType: eventTypeTenant,
      eventVersion: 1,
      scopeClass: "NOT_A_SCOPE",
    }),
  );
});


test("INT-DEF-PG-001 exact IntegrationDefinition id preserves immutable registry metadata", async () => {
  const definition = await definitionStore.loadById(f.definitionPlatform);

  assert.ok(definition);
  assert.equal(definition.id, f.definitionPlatform);
  assert.equal(definition.code, definitionCodePlatform);
  assert.equal(definition.name, "Platform registry fixture");
  assert.equal(definition.providerFamily, "FixtureProvider");
  assert.deepEqual(definition.capabilityCodes, ["orders.read", "orders.write"]);
  assert.equal(definition.adapterContractVersion, "v1");
  assert.equal(definition.ownerScope, "PLATFORM");
  assert.equal(definition.status, "ACTIVE");
  assert.equal(definition.dataTransferClass, "INTERNAL");
  assert.deepEqual(definition.residencyMetadata, {
    regions: ["IN"],
    residencyRequired: true,
  });
  assert.equal(Object.isFrozen(definition), true);
  assert.equal(Object.isFrozen(definition.capabilityCodes), true);
  assert.equal(Object.isFrozen(definition.residencyMetadata), true);
  assert.equal(Object.isFrozen(definition.residencyMetadata.regions), true);
});

test("INT-DEF-PG-002 ownerScope and raw RETIRED status are preserved without selection authority", async () => {
  const definition = await definitionStore.loadById(f.definitionIndustry);

  assert.ok(definition);
  assert.equal(definition.ownerScope, "INDUSTRY");
  assert.equal(definition.status, "RETIRED");
  assert.equal(definition.dataTransferClass, "REGULATED");
  assert.deepEqual(definition.capabilityCodes, ["lab.receive"]);
  assert.equal("selectable" in definition, false);
  assert.equal("enabled" in definition, false);
  assert.equal("healthy" in definition, false);
});

test("INT-DEF-PG-003 absent definition id returns null without fallback", async () => {
  assert.equal(await definitionStore.loadById(randomUUID()), null);
});

test("INT-DEF-PG-004 malformed definition id fails closed before persistence query", async () => {
  await assert.rejects(definitionStore.loadById("not-a-uuid"));
});


test("INT-CAP-PG-001 exact definition+capability tuple preserves immutable registry metadata", async () => {
  const capability = await capabilityStore.loadExact({
    integrationDefinitionId: f.definitionPlatform,
    capabilityCode: "orders.read",
  });

  assert.ok(capability);
  assert.equal(capability.id, f.capabilityPlatform);
  assert.equal(capability.integrationDefinitionId, f.definitionPlatform);
  assert.equal(capability.capabilityCode, "orders.read");
  assert.equal(capability.direction, "OUTBOUND");
  assert.equal(capability.operationContractId, "core.orders.read");
  assert.deepEqual(capability.eventTypes, ["order.created"]);
  assert.equal(capability.dataClass, "INTERNAL");
  assert.equal(capability.idempotencyClass, "READ_ONLY");
  assert.equal(capability.rateClass, "AUTH_STANDARD");
  assert.equal(capability.status, "ACTIVE");
  assert.equal(Object.isFrozen(capability), true);
  assert.equal(Object.isFrozen(capability.eventTypes), true);
});

test("INT-CAP-PG-002 raw RETIRED and direction evidence do not become execution authority", async () => {
  const capability = await capabilityStore.loadExact({
    integrationDefinitionId: f.definitionIndustry,
    capabilityCode: "lab.receive",
  });

  assert.ok(capability);
  assert.equal(capability.direction, "INBOUND");
  assert.equal(capability.operationContractId, undefined);
  assert.deepEqual(capability.eventTypes, ["lab.result.received", "lab.result.corrected"]);
  assert.equal(capability.status, "RETIRED");
  assert.equal(capability.rateClass, "EXTERNAL_WRITE");
  assert.equal("enabled" in capability, false);
  assert.equal("executable" in capability, false);
  assert.equal("authorized" in capability, false);
});

test("INT-CAP-PG-003 exact tuple mismatch returns null without definition/provider fallback", async () => {
  assert.equal(await capabilityStore.loadExact({
    integrationDefinitionId: f.definitionPlatform,
    capabilityCode: "lab.receive",
  }), null);
  assert.equal(await capabilityStore.loadExact({
    integrationDefinitionId: randomUUID(),
    capabilityCode: "orders.read",
  }), null);
});

test("INT-CAP-PG-004 malformed definition id or empty capability code fails closed", async () => {
  await assert.rejects(capabilityStore.loadExact({
    integrationDefinitionId: "not-a-uuid",
    capabilityCode: "orders.read",
  }));
  await assert.rejects(capabilityStore.loadExact({
    integrationDefinitionId: f.definitionPlatform,
    capabilityCode: "",
  }));
});
