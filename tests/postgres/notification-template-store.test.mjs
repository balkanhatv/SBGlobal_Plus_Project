import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresNotificationDatabase } from "../../dist/server/database/postgres-notification-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresNotificationTemplateStore,
} from "../../dist/server/notification/postgres-notification-template-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_notification_template_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "tenantPrincipalA",
  "tenantPrincipalB",
  "platformService",
  "membershipA",
  "membershipB",
  "industryA1",
  "industryA2",
  "industryB1",
  "templateIndustryA1",
  "templateIndustryA2",
  "templateTenantA",
  "templateTenantB",
  "templatePlatform",
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
    regionCode: "IN-NOTIFICATION-TEMPLATE",
    principalId: f.tenantPrincipalA,
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
    principalId: f.tenantPrincipalB,
    membershipId: f.membershipB,
    scopeClass: "TENANT_CORE",
  });
}

function platformContext() {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    principalId: f.platformService,
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "PLATFORM_GLOBAL",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-NOTIFICATION-TEMPLATE','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Notification template tenant A"],
      [f.tenantB, "EDU", "Notification template tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-NOTIFICATION-TEMPLATE',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.tenantPrincipalA, "HUMAN", "Notification template principal A", null, null],
      [f.tenantPrincipalB, "HUMAN", "Notification template principal B", null, null],
      [f.platformService, "SERVICE", "Notification template platform service",
        "notification-template-reader", "Notification"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,service_code,owning_module,
           created_at,updated_at)
         VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,
        [principalId, type, label, serviceCode, owningModule],
      );
    }

    for (const [membershipId, tenantId, principalId] of [
      [f.membershipA, f.tenantA, f.tenantPrincipalA],
      [f.membershipB, f.tenantB, f.tenantPrincipalB],
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
      `INSERT INTO core_notification.notification_template
        (id,owner_scope,tenant_id,industry_context_id,code,channel,locale_code,
         version,status,subject_template,body_template,safe_preview_template,
         variable_schema_json,created_by,approved_by,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$6,$8,'ORDER_READY','PUSH','en-IN',2,'ACTIVE',
         NULL,'Order {{orderId}} is ready','Order ready',
         '{"type":"object","required":["orderId"]}'::jsonb,$10,$10,
         now()-interval '5 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,'MAINT_ALERT','SMS','en-IN',1,'ACTIVE',
         NULL,'Machine {{machineId}} requires attention',NULL,
         '{"type":"object","properties":{"machineId":{"type":"string"}}}'::jsonb,
         $10,$10,now()-interval '4 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'TENANT_DIGEST','EMAIL','en-IN',3,'RETIRED',
         'Digest {{name}}','Hello {{name}}','New digest available',
         '{"type":"object","required":["name"]}'::jsonb,$10,$10,
         now()-interval '10 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,'TENANT_NOTICE','IN_APP','en-IN',1,'ACTIVE',
         NULL,'Tenant B notice',NULL,'{}'::jsonb,$11,$11,
         now()-interval '2 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,'PLATFORM_SECURITY','EMAIL','en-IN',1,'PUBLISHED',
         'Security notice','Platform security notice','',
         '{"type":"object","additionalProperties":false}'::jsonb,$12,$12,
         now()-interval '20 days',now()-interval '30 days')`,
      [
        f.templateIndustryA1,
        f.templateIndustryA2,
        f.templateTenantA,
        f.templateTenantB,
        f.templatePlatform,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.tenantPrincipalA,
        f.tenantPrincipalB,
        f.platformService,
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
      regionCode: "IN-NOTIFICATION-TEMPLATE",
    },
  );
  store = new PostgresNotificationTemplateStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_notification.notification_template WHERE id=ANY($1::uuid[])",
      [[
        f.templateIndustryA1,
        f.templateIndustryA2,
        f.templateTenantA,
        f.templateTenantB,
        f.templatePlatform,
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
      [[f.tenantPrincipalA, f.tenantPrincipalB, f.platformService]],
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

test("NOTIF-TPL-PG-001 exact Industry template preserves raw content and schema evidence", async () => {
  const template = await store.loadForContext({
    requestContext: contextA(),
    notificationTemplateId: f.templateIndustryA1,
  });

  assert.ok(template);
  assert.equal(template.ownerScope, "INDUSTRY");
  assert.equal(template.tenantId, f.tenantA);
  assert.equal(template.industryContextId, f.industryA1);
  assert.equal(template.code, "ORDER_READY");
  assert.equal(template.channel, "PUSH");
  assert.equal(template.localeCode, "en-IN");
  assert.equal(template.version, 2);
  assert.equal(template.status, "ACTIVE");
  assert.equal(template.bodyTemplate, "Order {{orderId}} is ready");
  assert.equal(template.safePreviewTemplate, "Order ready");
  assert.deepEqual(template.variableSchema, {
    required: ["orderId"],
    type: "object",
  });
  assert.equal(Object.isFrozen(template), true);
  assert.equal(Object.isFrozen(template.variableSchema), true);
  assert.equal("renderedBody" in template, false);
  assert.equal("selected" in template, false);
});

test("NOTIF-TPL-PG-002 exact owner-scope RLS hides sibling Industry template", async () => {
  const hidden = await store.loadForContext({
    requestContext: contextA(),
    notificationTemplateId: f.templateIndustryA2,
  });
  assert.equal(hidden, null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    notificationTemplateId: f.templateIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.channel, "SMS");
});

test("NOTIF-TPL-PG-003 Tenant template is same-Tenant visible and raw RETIRED state is preserved", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    notificationTemplateId: f.templateTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    notificationTemplateId: f.templateTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.ownerScope, "TENANT");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.status, "RETIRED");
  assert.equal(fromIndustry.subjectTemplate, "Digest {{name}}");
  assert.equal(fromTenant.id, f.templateTenantA);
  assert.equal("sendAllowed" in fromIndustry, false);
});

test("NOTIF-TPL-PG-004 Platform template is not implicit Tenant fallback and requires PLATFORM_GLOBAL context", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    notificationTemplateId: f.templatePlatform,
  });
  assert.equal(hidden, null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    notificationTemplateId: f.templatePlatform,
  });
  assert.ok(platform);
  assert.equal(platform.ownerScope, "PLATFORM");
  assert.equal(platform.tenantId, undefined);
  assert.equal(platform.industryContextId, undefined);
  assert.equal(platform.status, "PUBLISHED");
  assert.equal(platform.createdBy, f.platformService);
  assert.equal(platform.safePreviewTemplate, "");
  assert.ok(Date.parse(platform.updatedAt) < Date.parse(platform.createdAt));
});

test("NOTIF-TPL-PG-005 foreign Tenant template is hidden and owning Tenant can read raw evidence", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    notificationTemplateId: f.templateTenantB,
  });
  assert.equal(hidden, null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    notificationTemplateId: f.templateTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.status, "ACTIVE");
});

test("NOTIF-TPL-PG-006 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    notificationTemplateId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    notificationTemplateId: f.templateTenantA,
  }));
});
