import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIMessageStore } from "../../dist/server/ai/postgres-ai-message-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const suffix = randomBytes(8).toString("hex");
const role = "sbg_ai_message_reader_" + suffix;
const password = randomBytes(24).toString("hex");
const serviceCode = "ai-message-reader-" + suffix;

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
  "messageIndustryA1",
  "messageIndustryA2",
  "messageTenantA",
  "messagePrincipalA2",
  "messageTenantB",
  "modelRoute",
  "missingMessage",
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
    regionCode: "IN-AI-MESSAGE",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-MESSAGE','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI Message tenant A"],
      [f.tenantB, "EDU", "AI Message tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-MESSAGE',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, principalServiceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI Message principal A", null, null],
      [f.principalA2, "HUMAN", "AI Message principal A2", null, null],
      [f.principalB, "HUMAN", "AI Message principal B", null, null],
      [f.platformService, "SERVICE", "AI Message platform service", serviceCode, "AI"],
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
        ($1,$6,$9,'TENANT_INDUSTRY',$7,NULL,'REGULATED','MESSAGE','OPEN',now(),now()),
        ($2,$6,$10,'TENANT_INDUSTRY',$7,NULL,'CONFIDENTIAL','MESSAGE','OPEN',now(),now()),
        ($3,$6,NULL,'TENANT_CORE',$7,NULL,'INTERNAL','MESSAGE','OPEN',now(),now()),
        ($4,$6,NULL,'TENANT_CORE',$8,NULL,'PUBLIC','MESSAGE','OPEN',now(),now()),
        ($5,$11,NULL,'TENANT_CORE',$12,NULL,'SENSITIVE_PERSONAL','MESSAGE','OPEN',now(),now())`,
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

    await client.query(
      `INSERT INTO core_ai.ai_message
        (id,conversation_id,role,content_ref_or_encrypted_content,source_refs_json,
         model_route_id,created_at,deleted_at)
       VALUES
        ($1,$6,'assistant','cipher://message-a1',
          '{"documents":["doc-a",{"rank":2}],"nullable":null}'::jsonb,$11,
          '2026-09-20T00:00:00Z'::timestamptz,NULL),
        ($2,$7,'tool','',NULL,NULL,
          '2026-09-19T00:00:00Z'::timestamptz,NULL),
        ($3,$8,'','',NULL,NULL,
          '2020-01-02T00:00:00Z'::timestamptz,'2020-01-01T00:00:00Z'::timestamptz),
        ($4,$9,'user','cipher://a2','[]'::jsonb,NULL,
          '2026-09-18T00:00:00Z'::timestamptz,NULL),
        ($5,$10,'assistant','cipher://b',NULL,NULL,
          '2026-09-17T00:00:00Z'::timestamptz,NULL)`,
      [
        f.messageIndustryA1,
        f.messageIndustryA2,
        f.messageTenantA,
        f.messagePrincipalA2,
        f.messageTenantB,
        f.conversationIndustryA1,
        f.conversationIndustryA2,
        f.conversationTenantA,
        f.conversationPrincipalA2,
        f.conversationTenantB,
        f.modelRoute,
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
      regionCode: "IN-AI-MESSAGE",
    },
  );
  store = new PostgresAIMessageStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_message WHERE id=ANY($1::uuid[])",
      [[f.messageIndustryA1,f.messageIndustryA2,f.messageTenantA,f.messagePrincipalA2,f.messageTenantB]],
    );
    await client.query(
      "DELETE FROM core_ai.ai_conversation WHERE id=ANY($1::uuid[])",
      [[f.conversationIndustryA1,f.conversationIndustryA2,f.conversationTenantA,f.conversationPrincipalA2,f.conversationTenantB]],
    );
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipA,f.membershipA2,f.membershipB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.principalA,f.principalA2,f.principalB,f.platformService]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA,f.tenantB]],
    );
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query("DROP ROLE IF EXISTS "+role);
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await admin.end();
  }
});

test("AIMSG-PG-001 exact visible Industry message preserves immutable raw evidence", async () => {
  const row=await store.loadForContext({
    requestContext:industryA1(),
    messageId:f.messageIndustryA1,
  });
  assert.ok(row);
  assert.equal(row.id,f.messageIndustryA1);
  assert.equal(row.conversationId,f.conversationIndustryA1);
  assert.equal(row.role,"assistant");
  assert.equal(row.contentRefOrEncryptedContent,"cipher://message-a1");
  assert.deepEqual(row.sourceRefs,{documents:["doc-a",{rank:2}],nullable:null});
  assert.equal(row.modelRouteId,f.modelRoute);
  assert.equal(row.createdAt,"2026-09-20T00:00:00.000Z");
  assert.equal(row.deletedAt,undefined);
  assert.equal(Object.isFrozen(row),true);
  assert.equal(Object.isFrozen(row.sourceRefs),true);
  assert.equal(Object.isFrozen(row.sourceRefs.documents),true);
  assert.equal("decryptedContent" in row,false);
  assert.equal("authorizedSources" in row,false);
  assert.equal("selectedModel" in row,false);
});

test("AIMSG-PG-002 sibling Industry parent hides message", async () => {
  assert.equal(await store.loadForContext({
    requestContext:industryA2(),
    messageId:f.messageIndustryA1,
  }),null);
  const own=await store.loadForContext({
    requestContext:industryA2(),
    messageId:f.messageIndustryA2,
  });
  assert.ok(own);
  assert.equal(own.role,"tool");
  assert.equal(own.contentRefOrEncryptedContent,"");
});

test("AIMSG-PG-003 Tenant-Core parent message is owner-visible from Core and same-Tenant Industry", async () => {
  const fromCore=await store.loadForContext({
    requestContext:tenantCore(),
    messageId:f.messageTenantA,
  });
  const fromIndustry=await store.loadForContext({
    requestContext:industryA1(),
    messageId:f.messageTenantA,
  });
  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.role,"");
  assert.equal(fromCore.contentRefOrEncryptedContent,"");
  assert.equal(fromCore.sourceRefs,undefined);
  assert.equal(fromCore.modelRouteId,undefined);
  assert.equal(fromCore.createdAt,"2020-01-02T00:00:00.000Z");
  assert.equal(fromCore.deletedAt,"2020-01-01T00:00:00.000Z");
  assert.equal(fromIndustry.id,f.messageTenantA);
});

test("AIMSG-PG-004 same-Tenant different principal cannot read another owner's message", async () => {
  assert.equal(await store.loadForContext({
    requestContext:tenantCoreA2(),
    messageId:f.messageTenantA,
  }),null);
  const own=await store.loadForContext({
    requestContext:tenantCoreA2(),
    messageId:f.messagePrincipalA2,
  });
  assert.ok(own);
  assert.equal(own.conversationId,f.conversationPrincipalA2);
  assert.deepEqual(own.sourceRefs,[]);
});

test("AIMSG-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot bypass parent RLS", async () => {
  assert.equal(await store.loadForContext({
    requestContext:tenantCore(),
    messageId:f.messageTenantB,
  }),null);
  const own=await store.loadForContext({
    requestContext:tenantCoreB(),
    messageId:f.messageTenantB,
  });
  assert.ok(own);
  assert.equal(own.conversationId,f.conversationTenantB);
  assert.equal(await store.loadForContext({
    requestContext:platformContext(),
    messageId:f.messageTenantA,
  }),null);
});

test("AIMSG-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext:tenantCore(),
    messageId:f.missingMessage,
  }),null);
  await assert.rejects(store.loadForContext({
    requestContext:tenantCore(),
    messageId:"not-a-uuid",
  }));
  await assert.rejects(store.loadForContext({
    requestContext:{...tenantCore(),dataHomeId:randomUUID()},
    messageId:f.messageTenantA,
  }));
});

test("AIMSG-PG-007 raw message evidence adds no history/decrypt/source-auth/route/retention/execute authority", async () => {
  const privileges=await scoped.withContext(tenantCore(),(tx)=>tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_message','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_message','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_message','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_message','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount,1);
  assert.equal(privileges.rows[0].user_name,"sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select,true);
  assert.equal(privileges.rows[0].can_insert,true);
  assert.equal(privileges.rows[0].can_update,true);
  assert.equal(privileges.rows[0].can_delete,true);
  assert.equal(typeof store.create,"undefined");
  assert.equal(typeof store.update,"undefined");
  assert.equal(typeof store.delete,"undefined");
  assert.equal(typeof store.listHistory,"undefined");
  assert.equal(typeof store.decrypt,"undefined");
  assert.equal(typeof store.resolveSources,"undefined");
  assert.equal(typeof store.routeModel,"undefined");
  assert.equal(typeof store.applyRetention,"undefined");
  assert.equal(typeof store.execute,"undefined");
});
