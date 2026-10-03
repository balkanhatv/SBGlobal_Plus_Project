import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresNotificationDatabase } from "../../dist/server/database/postgres-notification-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresNotificationDeliveryStore,
} from "../../dist/server/notification/postgres-notification-delivery-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_notification_reader_" + randomBytes(8).toString("hex");
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
].map((key) => [key, randomUUID()]));

let pool;
let store;

function contextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-NOTIFICATION-READER",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-NOTIFICATION-READER','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Notification tenant A"],
      [f.tenantB, "EDU", "Notification tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-NOTIFICATION-READER',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Notification principal A"],
      [f.principalB, "Notification principal B"],
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
        ($1,$5,$7,'TENANT_INDUSTRY',NULL,NULL,$9,NULL,'IN_APP',NULL,
         $11,NULL,'QUEUED',now()-interval '5 minutes',NULL,NULL,NULL,1),
        ($2,$5,$8,'TENANT_INDUSTRY',NULL,NULL,$9,NULL,'PUSH',NULL,
         $12,NULL,'SENT',now()-interval '10 minutes',now()-interval '9 minutes',
         NULL,NULL,2),
        ($3,$5,NULL,'TENANT_CORE',NULL,NULL,NULL,'masked:tenant-a','EMAIL',NULL,
         $13,NULL,'FAILED',now()-interval '15 minutes',NULL,NULL,
         'PROVIDER_UNAVAILABLE',3),
        ($4,$6,NULL,'TENANT_CORE',NULL,NULL,$10,NULL,'SMS',NULL,
         $14,NULL,'DELIVERED',now()-interval '20 minutes',now()-interval '19 minutes',
         now()-interval '18 minutes',NULL,4)`,
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

  const scoped = new RequestScopedSql(
    new PostgresNotificationDatabase(pool),
    {
      dataHomeId: f.home,
      regionCode: "IN-NOTIFICATION-READER",
    },
  );
  store = new PostgresNotificationDeliveryStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
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

test("NOTIF-DEL-PG-001 exact Industry delivery preserves raw persistence evidence", async () => {
  const delivery = await store.loadForContext({
    requestContext: contextA(),
    notificationDeliveryId: f.deliveryIndustryA1,
  });

  assert.ok(delivery);
  assert.equal(delivery.id, f.deliveryIndustryA1);
  assert.equal(delivery.tenantId, f.tenantA);
  assert.equal(delivery.industryContextId, f.industryA1);
  assert.equal(delivery.scopeClass, "TENANT_INDUSTRY");
  assert.equal(delivery.recipientPrincipalId, f.principalA);
  assert.equal(delivery.channel, "IN_APP");
  assert.equal(delivery.status, "QUEUED");
  assert.equal(delivery.rowVersion, 1);
  assert.equal(Object.isFrozen(delivery), true);
  assert.equal("provider" in delivery, false);
  assert.equal("retryable" in delivery, false);
  assert.equal("sendAllowed" in delivery, false);
});

test("NOTIF-DEL-PG-002 FORCE-RLS hides sibling Industry delivery", async () => {
  const hidden = await store.loadForContext({
    requestContext: contextA(),
    notificationDeliveryId: f.deliveryIndustryA2,
  });
  assert.equal(hidden, null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    notificationDeliveryId: f.deliveryIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.channel, "PUSH");
  assert.equal(sibling.status, "SENT");
  assert.equal(typeof sibling.sentAt, "string");
});

test("NOTIF-DEL-PG-003 Tenant Core delivery is same-Tenant visible from Industry and Tenant Core contexts", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    notificationDeliveryId: f.deliveryCoreA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    notificationDeliveryId: f.deliveryCoreA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.scopeClass, "TENANT_CORE");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.recipientPrincipalId, undefined);
  assert.equal(fromIndustry.recipientReference, "masked:tenant-a");
  assert.equal(fromIndustry.status, "FAILED");
  assert.equal(fromIndustry.lastErrorCode, "PROVIDER_UNAVAILABLE");
  assert.equal(fromIndustry.rowVersion, 3);
  assert.equal(fromTenant.id, f.deliveryCoreA);
});

test("NOTIF-DEL-PG-004 foreign Tenant delivery is hidden and owning Tenant sees raw terminal evidence", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    notificationDeliveryId: f.deliveryCoreB,
  });
  assert.equal(hidden, null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    notificationDeliveryId: f.deliveryCoreB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.channel, "SMS");
  assert.equal(own.status, "DELIVERED");
  assert.equal(typeof own.sentAt, "string");
  assert.equal(typeof own.deliveredAt, "string");
  assert.equal("final" in own, false);
  assert.equal("providerClient" in own, false);
});

test("NOTIF-DEL-PG-005 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    notificationDeliveryId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    notificationDeliveryId: f.deliveryCoreA,
  }));
});
