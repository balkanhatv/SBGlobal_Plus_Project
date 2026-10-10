import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresNotificationDatabase } from "../../dist/server/database/postgres-notification-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresNotificationDeliveryAttemptStore,
} from "../../dist/server/notification/postgres-notification-delivery-attempt-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_notification_attempt_reader_" + randomBytes(8).toString("hex");
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
  "deliveryIndustryA1",
  "deliveryIndustryA2",
  "deliveryCoreA",
  "deliveryCoreB",
  "correlationA1",
  "correlationA2",
  "correlationCoreA",
  "correlationCoreB",
  "attemptA1_1",
  "attemptA1_2",
  "attemptA2_1",
  "attemptCoreA_1",
  "attemptCoreB_1",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function contextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-NOTIFICATION-ATTEMPT",
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
    await client.query("GRANT sbg_notification_worker_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-NOTIFICATION-ATTEMPT','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Notification attempt tenant A"],
      [f.tenantB, "EDU", "Notification attempt tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-NOTIFICATION-ATTEMPT',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Notification attempt principal A"],
      [f.principalB, "Notification attempt principal B"],
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
      `INSERT INTO core_notification.notification_delivery
        (id,tenant_id,industry_context_id,scope_class,template_id,template_version,
         recipient_principal_id,recipient_reference,channel,tenant_integration_id,
         correlation_id,source_event_id,status,queued_at,sent_at,delivered_at,
         last_error_code,row_version)
       VALUES
        ($1,$5,$7,'TENANT_INDUSTRY',NULL,NULL,$9,NULL,'PUSH',NULL,
         $11,NULL,'SENT',now()-interval '10 minutes',now()-interval '7 minutes',
         NULL,NULL,2),
        ($2,$5,$8,'TENANT_INDUSTRY',NULL,NULL,$9,NULL,'SMS',NULL,
         $12,NULL,'FAILED',now()-interval '20 minutes',NULL,NULL,'RATE_LIMITED',3),
        ($3,$5,NULL,'TENANT_CORE',NULL,NULL,NULL,'masked:core-a','EMAIL',NULL,
         $13,NULL,'FAILED',now()-interval '30 minutes',NULL,NULL,'PROVIDER_DOWN',4),
        ($4,$6,NULL,'TENANT_CORE',NULL,NULL,$10,NULL,'IN_APP',NULL,
         $14,NULL,'DELIVERED',now()-interval '40 minutes',now()-interval '38 minutes',
         now()-interval '37 minutes',NULL,5)`,
      [
        f.deliveryIndustryA1,
        f.deliveryIndustryA2,
        f.deliveryCoreA,
        f.deliveryCoreB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.principalA,
        f.principalB,
        f.correlationA1,
        f.correlationA2,
        f.correlationCoreA,
        f.correlationCoreB,
      ],
    );

    await client.query(
      `INSERT INTO core_notification.notification_delivery_attempt
        (id,delivery_id,attempt_no,provider_message_ref,normalized_status,
         normalized_error_code,started_at,completed_at)
       VALUES
        ($1,$6,1,'provider-msg-a1-1','RATE_LIMITED','RATE_LIMITED',
         now()-interval '9 minutes',now()-interval '8 minutes'),
        ($2,$6,2,'provider-msg-a1-2','ACCEPTED',NULL,
         now()-interval '7 minutes',now()-interval '6 minutes'),
        ($3,$7,1,NULL,'FAILED','PROVIDER_DOWN',
         now()-interval '19 minutes',now()-interval '18 minutes'),
        ($4,$8,1,'provider-msg-core-a','FAILED','AUTH_ERROR',
         now()-interval '29 minutes',now()-interval '28 minutes'),
        ($5,$9,1,'provider-msg-core-b','DELIVERED',NULL,
         now()-interval '39 minutes',now()-interval '37 minutes')`,
      [
        f.attemptA1_1,
        f.attemptA1_2,
        f.attemptA2_1,
        f.attemptCoreA_1,
        f.attemptCoreB_1,
        f.deliveryIndustryA1,
        f.deliveryIndustryA2,
        f.deliveryCoreA,
        f.deliveryCoreB,
      ],
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

  scoped = new RequestScopedSql(
    new PostgresNotificationDatabase(pool),
    {
      dataHomeId: f.home,
      regionCode: "IN-NOTIFICATION-ATTEMPT",
    },
  );
  store = new PostgresNotificationDeliveryAttemptStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_notification.notification_delivery_attempt WHERE delivery_id=ANY($1::uuid[])",
      [[
        f.deliveryIndustryA1,
        f.deliveryIndustryA2,
        f.deliveryCoreA,
        f.deliveryCoreB,
      ]],
    );
    await client.query(
      "DELETE FROM core_notification.notification_delivery WHERE id=ANY($1::uuid[])",
      [[
        f.deliveryIndustryA1,
        f.deliveryIndustryA2,
        f.deliveryCoreA,
        f.deliveryCoreB,
      ]],
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

test("NOTIF-ATT-PG-001 exact Industry delivery returns ordered raw attempt evidence", async () => {
  const attempts = await store.loadForDelivery({
    requestContext: contextA(),
    notificationDeliveryId: f.deliveryIndustryA1,
  });

  assert.equal(attempts.length, 2);
  assert.deepEqual(attempts.map((attempt) => attempt.attemptNo), [1, 2]);
  assert.equal(attempts[0].providerMessageRef, "provider-msg-a1-1");
  assert.equal(attempts[0].normalizedStatus, "RATE_LIMITED");
  assert.equal(attempts[0].normalizedErrorCode, "RATE_LIMITED");
  assert.equal(attempts[1].normalizedStatus, "ACCEPTED");
  assert.equal(attempts[1].normalizedErrorCode, undefined);
  assert.ok(attempts.every((attempt) => Object.isFrozen(attempt)));
  assert.equal(Object.isFrozen(attempts), true);
  assert.equal("retryable" in attempts[0], false);
  assert.equal("final" in attempts[0], false);
  assert.equal("nextAttemptAt" in attempts[0], false);
});

test("NOTIF-ATT-PG-002 parent FORCE-RLS hides sibling Industry attempts", async () => {
  const hidden = await store.loadForDelivery({
    requestContext: contextA(),
    notificationDeliveryId: f.deliveryIndustryA2,
  });
  assert.deepEqual(hidden, []);

  const sibling = await store.loadForDelivery({
    requestContext: contextA(f.industryA2),
    notificationDeliveryId: f.deliveryIndustryA2,
  });
  assert.equal(sibling.length, 1);
  assert.equal(sibling[0].deliveryId, f.deliveryIndustryA2);
  assert.equal(sibling[0].normalizedStatus, "FAILED");
  assert.equal(sibling[0].providerMessageRef, undefined);
});

test("NOTIF-ATT-PG-003 Tenant Core attempts are same-Tenant visible from Industry and Tenant Core contexts", async () => {
  const fromIndustry = await store.loadForDelivery({
    requestContext: contextA(),
    notificationDeliveryId: f.deliveryCoreA,
  });
  const fromTenant = await store.loadForDelivery({
    requestContext: tenantCoreA(),
    notificationDeliveryId: f.deliveryCoreA,
  });

  assert.equal(fromIndustry.length, 1);
  assert.equal(fromTenant.length, 1);
  assert.equal(fromIndustry[0].id, f.attemptCoreA_1);
  assert.equal(fromIndustry[0].normalizedStatus, "FAILED");
  assert.equal(fromIndustry[0].normalizedErrorCode, "AUTH_ERROR");
  assert.equal(fromTenant[0].id, f.attemptCoreA_1);
});

test("NOTIF-ATT-PG-004 foreign Tenant attempts are hidden and owning Tenant sees raw evidence", async () => {
  const hidden = await store.loadForDelivery({
    requestContext: tenantCoreA(),
    notificationDeliveryId: f.deliveryCoreB,
  });
  assert.deepEqual(hidden, []);

  const own = await store.loadForDelivery({
    requestContext: tenantCoreB(),
    notificationDeliveryId: f.deliveryCoreB,
  });
  assert.equal(own.length, 1);
  assert.equal(own[0].normalizedStatus, "DELIVERED");
  assert.equal(own[0].providerMessageRef, "provider-msg-core-b");
  assert.equal(typeof own[0].completedAt, "string");
});

test("NOTIF-ATT-PG-005 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForDelivery({
    requestContext: tenantCoreA(),
    notificationDeliveryId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForDelivery({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    notificationDeliveryId: f.deliveryCoreA,
  }));
});

test("NOTIF-ATT-PG-006 Notification worker role cannot mutate append-only attempt evidence", async () => {
  await assert.rejects(scoped.withContext(
    contextA(),
    (transaction) => transaction.query(
      "UPDATE core_notification.notification_delivery_attempt SET normalized_status='MUTATED' WHERE id=$1",
      [f.attemptA1_1],
    ),
  ));

  await assert.rejects(scoped.withContext(
    contextA(),
    (transaction) => transaction.query(
      "DELETE FROM core_notification.notification_delivery_attempt WHERE id=$1",
      [f.attemptA1_1],
    ),
  ));

  const attempts = await store.loadForDelivery({
    requestContext: contextA(),
    notificationDeliveryId: f.deliveryIndustryA1,
  });
  assert.equal(attempts[0].normalizedStatus, "RATE_LIMITED");
});
