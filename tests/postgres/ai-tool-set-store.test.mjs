import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIToolSetStore } from "../../dist/server/ai/postgres-ai-tool-set-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_tool_set_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
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
  "toolSetIndustryA1",
  "toolSetIndustryA2",
  "toolSetTenantA",
  "toolSetTenantB",
  "toolSetPlatform",
  "missingToolSet",
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
    regionCode: "IN-AI-TOOL-SET",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-TOOL-SET','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "AI ToolSet tenant A"],
      [f.tenantB, "EDU", "AI ToolSet tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-TOOL-SET',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI ToolSet principal A", null, null],
      [f.principalB, "HUMAN", "AI ToolSet principal B", null, null],
      [f.platformService, "SERVICE", "AI ToolSet platform service",
        "ai-tool-set-reader", "AI"],
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
      `INSERT INTO core_ai.ai_tool_set
        (id,owner_scope,tenant_id,industry_context_id,code,version,status,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$6,$8,'ORDER_TOOLS',2,'ACTIVE',now()-interval '10 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,'MAINT_TOOLS',1,'DRAFT',now()-interval '8 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'',3,'RETIRED',now()-interval '12 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,'TENANT_B_TOOLS',1,'ACTIVE',now()-interval '7 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,'PLATFORM_TOOLS',4,'PUBLISHED',now()-interval '2 days',now()-interval '9 days')`,
      [
        f.toolSetIndustryA1,
        f.toolSetIndustryA2,
        f.toolSetTenantA,
        f.toolSetTenantB,
        f.toolSetPlatform,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
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
      regionCode: "IN-AI-TOOL-SET",
    },
  );
  store = new PostgresAIToolSetStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_tool_set WHERE id=ANY($1::uuid[])",
      [[
        f.toolSetIndustryA1,
        f.toolSetIndustryA2,
        f.toolSetTenantA,
        f.toolSetTenantB,
        f.toolSetPlatform,
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

test("AITOOLSET-PG-001 exact Industry ToolSet preserves immutable raw metadata", async () => {
  const row = await store.loadForContext({
    requestContext: contextA(),
    toolSetId: f.toolSetIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.toolSetIndustryA1);
  assert.equal(row.ownerScope, "INDUSTRY");
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.code, "ORDER_TOOLS");
  assert.equal(row.version, 2);
  assert.equal(row.status, "ACTIVE");
  assert.equal(typeof row.createdAt, "string");
  assert.equal(typeof row.updatedAt, "string");
  assert.equal(Object.isFrozen(row), true);
  assert.equal("selected" in row, false);
  assert.equal("members" in row, false);
  assert.equal("executable" in row, false);
});

test("AITOOLSET-PG-002 FORCE-RLS hides sibling Industry ToolSet", async () => {
  const hidden = await store.loadForContext({
    requestContext: contextA(),
    toolSetId: f.toolSetIndustryA2,
  });
  assert.equal(hidden, null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    toolSetId: f.toolSetIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.status, "DRAFT");
});

test("AITOOLSET-PG-003 Tenant ToolSet is same-Tenant visible and raw values stay raw", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    toolSetId: f.toolSetTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    toolSetId: f.toolSetTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.ownerScope, "TENANT");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.code, "");
  assert.equal(fromIndustry.version, 3);
  assert.equal(fromIndustry.status, "RETIRED");
  assert.equal(fromTenant.id, f.toolSetTenantA);
});

test("AITOOLSET-PG-004 PLATFORM ToolSet is not Tenant fallback and needs PLATFORM_GLOBAL", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    toolSetId: f.toolSetPlatform,
  });
  assert.equal(hidden, null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    toolSetId: f.toolSetPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.ownerScope, "PLATFORM");
  assert.equal(platform.status, "PUBLISHED");
  assert.ok(Date.parse(platform.updatedAt) < Date.parse(platform.createdAt));
});

test("AITOOLSET-PG-005 foreign Tenant ToolSet is hidden", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    toolSetId: f.toolSetTenantB,
  });
  assert.equal(hidden, null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    toolSetId: f.toolSetTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.status, "ACTIVE");
});

test("AITOOLSET-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    toolSetId: f.missingToolSet,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    toolSetId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    toolSetId: f.toolSetTenantA,
  }));
});

test("AITOOLSET-PG-007 read port adds no mutation/selection authority and platform writes stay protected", async () => {
  const privileges = await scoped.withContext(platformContext(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_tool_set','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_tool_set','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_tool_set','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_tool_set','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  const attempted = await scoped.withContext(platformContext(), (tx) => tx.query(
    "UPDATE core_ai.ai_tool_set SET code='MUTATED' WHERE id=$1::uuid",
    [f.toolSetPlatform],
  ));
  assert.equal(attempted.rowCount, 0);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    toolSetId: f.toolSetPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.code, "PLATFORM_TOOLS");

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.loadMembers, "undefined");
  assert.equal(typeof store.selectActive, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
