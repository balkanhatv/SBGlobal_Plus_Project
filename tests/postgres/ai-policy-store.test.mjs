import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIPolicyStore } from "../../dist/server/ai/postgres-ai-policy-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_policy_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const platformCode = "PLATFORM_POLICY_DD116_" + randomBytes(8).toString("hex");
const serviceCode = "ai-policy-reader-" + randomBytes(8).toString("hex");
const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "principalA",
  "principalB",
  "platformService",
  "membershipA",
  "membershipB",
  "industryA1",
  "industryA2",
  "industryB1",
  "policyIndustryA1",
  "policyIndustryA2",
  "policyTenantA",
  "policyTenantB",
  "policyPlatform",
  "missingPolicy",
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
    regionCode: "IN-AI-POLICY",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-POLICY','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "AI Policy tenant A"],
      [f.tenantB, "EDU", "AI Policy tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-POLICY',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, type, label, principalServiceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI Policy principal A", null, null],
      [f.principalB, "HUMAN", "AI Policy principal B", null, null],
      [f.platformService, "SERVICE", "AI Policy platform service",
        serviceCode, "AI"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,service_code,owning_module,
           created_at,updated_at)
         VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,
        [principalId, type, label, principalServiceCode, owningModule],
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
      `INSERT INTO core_ai.ai_policy
        (id,owner_scope,tenant_id,industry_context_id,code,priority,effect,
         condition_ast_json,constraint_json,version,status,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$6,$8,'ORDER_POLICY_DD116',-7,'ALLOW',
          '{"op":"eq","path":"request.mode","value":"read"}'::jsonb,
          '{"maxItems":3}'::jsonb,2,'ACTIVE',now()-interval '10 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,'MAINT_POLICY_DD116',0,'DENY',
          '{"op":"always"}'::jsonb,'{}'::jsonb,1,'DRAFT',now()-interval '8 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'',250,'RESTRICT',
          '{"nested":{"x":1}}'::jsonb,'{"raw":true}'::jsonb,3,'',now()-interval '12 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,'TENANT_B_POLICY_DD116',100,'ALLOW',
          '{"op":"always"}'::jsonb,'{}'::jsonb,1,'ACTIVE',now()-interval '7 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,$10,42,'DENY',
          '{"op":"always"}'::jsonb,'{"platform":true}'::jsonb,4,'PUBLISHED',now()-interval '2 days',now()-interval '1 day')`,
      [
        f.policyIndustryA1,
        f.policyIndustryA2,
        f.policyTenantA,
        f.policyTenantB,
        f.policyPlatform,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        platformCode,
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
      regionCode: "IN-AI-POLICY",
    },
  );
  store = new PostgresAIPolicyStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_policy WHERE id=ANY($1::uuid[])",
      [[
        f.policyIndustryA1,
        f.policyIndustryA2,
        f.policyTenantA,
        f.policyTenantB,
        f.policyPlatform,
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
      [[f.principalA, f.principalB, f.platformService]],
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

test("AIPOLICY-PG-001 exact Industry AI Policy preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: contextA(),
    policyId: f.policyIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.policyIndustryA1);
  assert.equal(row.ownerScope, "INDUSTRY");
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.code, "ORDER_POLICY_DD116");
  assert.equal(row.priority, -7);
  assert.equal(row.effect, "ALLOW");
  assert.deepEqual(row.conditionAst, {op: "eq", path: "request.mode", value: "read"});
  assert.deepEqual(row.constraint, {maxItems: 3});
  assert.equal(row.version, 2);
  assert.equal(row.status, "ACTIVE");
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.conditionAst), true);
  assert.equal(Object.isFrozen(row.constraint), true);
  assert.equal("applicable" in row, false);
  assert.equal("decision" in row, false);
  assert.equal("effective" in row, false);
});

test("AIPOLICY-PG-002 sibling Industry AI Policy is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: contextA(),
    policyId: f.policyIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    policyId: f.policyIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.effect, "DENY");
});

test("AIPOLICY-PG-003 Tenant AI Policy is same-Tenant visible and raw values stay raw", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    policyId: f.policyTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    policyId: f.policyTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.ownerScope, "TENANT");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.code, "");
  assert.equal(fromIndustry.priority, 250);
  assert.equal(fromIndustry.effect, "RESTRICT");
  assert.equal(fromIndustry.status, "");
  assert.deepEqual(fromIndustry.conditionAst, {nested: {x: 1}});
  assert.deepEqual(fromIndustry.constraint, {raw: true});
  assert.equal(fromTenant.id, f.policyTenantA);
});

test("AIPOLICY-PG-004 PLATFORM AI Policy is not Tenant fallback and needs PLATFORM_GLOBAL", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    policyId: f.policyPlatform,
  }), null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    policyId: f.policyPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.ownerScope, "PLATFORM");
  assert.equal(platform.effect, "DENY");
  assert.equal(platform.status, "PUBLISHED");
  assert.equal("decision" in platform, false);
});

test("AIPOLICY-PG-005 foreign Tenant AI Policy is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    policyId: f.policyTenantB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    policyId: f.policyTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.effect, "ALLOW");
});

test("AIPOLICY-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    policyId: f.missingPolicy,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    policyId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    policyId: f.policyTenantA,
  }));
});

test("AIPOLICY-PG-007 raw policy evidence adds no evaluation/execution authority and platform writes stay protected", async () => {
  const privileges = await scoped.withContext(platformContext(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_policy','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_policy','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_policy','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_policy','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  const attempted = await scoped.withContext(platformContext(), (tx) => tx.query(
    "UPDATE core_ai.ai_policy SET priority=999 WHERE id=$1::uuid",
    [f.policyPlatform],
  ));
  assert.equal(attempted.rowCount, 0);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    policyId: f.policyPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.priority, 42);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.listApplicable, "undefined");
  assert.equal(typeof store.sortByPriority, "undefined");
  assert.equal(typeof store.evaluateCondition, "undefined");
  assert.equal(typeof store.evaluateConstraint, "undefined");
  assert.equal(typeof store.decide, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
