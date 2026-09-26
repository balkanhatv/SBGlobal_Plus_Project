import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIConversationStore } from "../../dist/server/ai/postgres-ai-conversation-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_conversation_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const serviceCode = "ai-conversation-reader-" + randomBytes(8).toString("hex");

const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "principalA",
  "principalA2",
  "principalB",
  "platformService",
  "membershipA",
  "membershipA2",
  "membershipB",
  "industryA1",
  "industryA2",
  "industryB1",
  "conversationIndustryA1",
  "conversationIndustryA2",
  "conversationTenantA",
  "conversationPrincipalA2",
  "conversationTenantB",
  "missingConversation",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function tenantCore(principalId = f.principalA, membershipId = f.membershipA) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    dataHomeId: f.home,
    regionCode: "IN-AI-CONVERSATION",
    principalId,
    principalType: "HUMAN",
    membershipId,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_CORE",
  });
}

function industryA1() {
  return Object.freeze({
    ...tenantCore(),
    industryContextId: f.industryA1,
    scopeClass: "TENANT_INDUSTRY",
  });
}

function industryA2() {
  return Object.freeze({
    ...tenantCore(),
    industryContextId: f.industryA2,
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreA2() {
  return tenantCore(f.principalA2, f.membershipA2);
}

function tenantCoreB() {
  return Object.freeze({
    ...tenantCore(),
    tenantId: f.tenantB,
    principalId: f.principalB,
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
    await client.query("GRANT sbg_ai_gateway_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-CONVERSATION','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI Conversation tenant A"],
      [f.tenantB, "EDU", "AI Conversation tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-CONVERSATION',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, principalServiceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI Conversation principal A", null, null],
      [f.principalA2, "HUMAN", "AI Conversation principal A2", null, null],
      [f.principalB, "HUMAN", "AI Conversation principal B", null, null],
      [f.platformService, "SERVICE", "AI Conversation platform service", serviceCode, "AI"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,service_code,owning_module,created_at,updated_at)
         VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,
        [principalId, type, label, principalServiceCode, owningModule],
      );
    }

    for (const [membershipId, tenantId, principalId] of [
      [f.membershipA, f.tenantA, f.principalA],
      [f.membershipA2, f.tenantA, f.principalA2],
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
      `INSERT INTO core_ai.ai_conversation
        (id,tenant_id,industry_context_id,scope_class,owner_principal_id,
         assistant_definition_id,sensitivity_class,retention_class,status,
         created_at,last_activity_at)
       VALUES
        ($1,$6,$9,'TENANT_INDUSTRY',$7,NULL,'REGULATED','', '',
          now(),now()-interval '1 hour'),
        ($2,$6,$10,'TENANT_INDUSTRY',$7,NULL,'CONFIDENTIAL','INDUSTRY','OPEN',
          now(),now()),
        ($3,$6,NULL,'TENANT_CORE',$7,NULL,'INTERNAL','TENANT','',
          now(),now()),
        ($4,$6,NULL,'TENANT_CORE',$8,NULL,'PUBLIC','TENANT','OPEN',
          now(),now()),
        ($5,$11,NULL,'TENANT_CORE',$12,NULL,'SENSITIVE_PERSONAL','TENANT','OPEN',
          now(),now())`,
      [
        f.conversationIndustryA1,
        f.conversationIndustryA2,
        f.conversationTenantA,
        f.conversationPrincipalA2,
        f.conversationTenantB,
        f.tenantA,
        f.principalA,
        f.principalA2,
        f.industryA1,
        f.industryA2,
        f.tenantB,
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

  scoped = new RequestScopedSql(
    new PostgresAIGatewayDatabase(pool),
    {
      dataHomeId: f.home,
      regionCode: "IN-AI-CONVERSATION",
    },
  );
  store = new PostgresAIConversationStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_conversation WHERE id=ANY($1::uuid[])",
      [[
        f.conversationIndustryA1,
        f.conversationIndustryA2,
        f.conversationTenantA,
        f.conversationPrincipalA2,
        f.conversationTenantB,
      ]],
    );
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipA, f.membershipA2, f.membershipB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1, f.industryA2, f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.principalA, f.principalA2, f.principalB, f.platformService]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA, f.tenantB]],
    );
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1", [f.home]);
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

test("AICONV-PG-001 exact owner and Industry context returns immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    conversationId: f.conversationIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.conversationIndustryA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.scopeClass, "TENANT_INDUSTRY");
  assert.equal(row.ownerPrincipalId, f.principalA);
  assert.equal(row.assistantDefinitionId, undefined);
  assert.equal(row.sensitivityClass, "REGULATED");
  assert.equal(row.retentionClass, "");
  assert.equal(row.status, "");
  assert.equal(typeof row.createdAt, "string");
  assert.equal(typeof row.lastActivityAt, "string");
  assert.ok(Date.parse(row.lastActivityAt) < Date.parse(row.createdAt));
  assert.equal(Object.isFrozen(row), true);
  assert.equal("messages" in row, false);
  assert.equal("effectiveAssistant" in row, false);
  assert.equal("executable" in row, false);
});

test("AICONV-PG-002 sibling Industry context cannot read an Industry conversation", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA2(),
    conversationId: f.conversationIndustryA1,
  }), null);

  const exact = await store.loadForContext({
    requestContext: industryA1(),
    conversationId: f.conversationIndustryA1,
  });
  assert.ok(exact);
});

test("AICONV-PG-003 Tenant-Core conversation stays owner-visible from Core and same-Tenant Industry contexts", async () => {
  const fromCore = await store.loadForContext({
    requestContext: tenantCore(),
    conversationId: f.conversationTenantA,
  });
  const fromIndustry = await store.loadForContext({
    requestContext: industryA1(),
    conversationId: f.conversationTenantA,
  });

  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.scopeClass, "TENANT_CORE");
  assert.equal(fromCore.industryContextId, undefined);
  assert.equal(fromIndustry.id, f.conversationTenantA);
  assert.equal(typeof store.listHistory, "undefined");
});

test("AICONV-PG-004 same-Tenant different principal cannot read another owner's conversation", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA2(),
    conversationId: f.conversationTenantA,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreA2(),
    conversationId: f.conversationPrincipalA2,
  });
  assert.ok(own);
  assert.equal(own.ownerPrincipalId, f.principalA2);
});

test("AICONV-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot bypass RLS", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCore(),
    conversationId: f.conversationTenantB,
  }), null);

  const foreignOwn = await store.loadForContext({
    requestContext: tenantCoreB(),
    conversationId: f.conversationTenantB,
  });
  assert.ok(foreignOwn);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    conversationId: f.conversationTenantA,
  }), null);
});

test("AICONV-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCore(),
    conversationId: f.missingConversation,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCore(),
    conversationId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCore(),
      dataHomeId: randomUUID(),
    },
    conversationId: f.conversationTenantA,
  }));
});

test("AICONV-PG-007 database DML stays schema-owned while port adds no history/assistant/retention/execution authority", async () => {
  const privileges = await scoped.withContext(tenantCore(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_conversation','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_conversation','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_conversation','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_conversation','DELETE') AS can_delete`,
  ));

  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.loadMessages, "undefined");
  assert.equal(typeof store.listHistory, "undefined");
  assert.equal(typeof store.selectAssistant, "undefined");
  assert.equal(typeof store.applyRetention, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
