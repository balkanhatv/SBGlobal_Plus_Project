import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresIntegrationDatabase } from "../../dist/server/database/postgres-integration-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresWebhookSubscriptionStore,
} from "../../dist/server/integration/postgres-webhook-subscription-store.js";

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
  store = new PostgresWebhookSubscriptionStore(
    new RequestScopedSql(new PostgresIntegrationDatabase(pool), {
      dataHomeId: f.home,
      regionCode: "IN-WEBHOOK-READER",
    }),
  );
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_integration.webhook_subscription WHERE id=ANY($1::uuid[])",
      [[f.activeA, f.pendingA, f.activeB]],
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
