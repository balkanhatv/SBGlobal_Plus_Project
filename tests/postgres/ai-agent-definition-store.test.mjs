import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIAgentDefinitionStore } from "../../dist/server/ai/postgres-ai-agent-definition-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_agent_definition_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");
const platformToolSetCode = "AI_AGENT_TOOLSET_" + suffix;
const platformAgentCode = "AI_AGENT_PLATFORM_" + suffix;
const platformServiceCode = "ai-agent-definition-reader-" + suffix;

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
  "toolSet",
  "agentIndustryA1",
  "agentIndustryA2",
  "agentTenantA",
  "agentTenantB",
  "agentPlatform",
  "approvalPolicyA",
  "approvalPolicyB",
  "budgetPolicyA",
  "budgetPolicyB",
  "missingAgent",
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
    regionCode: "IN-AI-AGENT-DEF",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-AGENT-DEF','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "AI AgentDefinition tenant A"],
      [f.tenantB, "EDU", "AI AgentDefinition tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-AGENT-DEF',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI AgentDefinition principal A", null, null],
      [f.principalB, "HUMAN", "AI AgentDefinition principal B", null, null],
      [f.platformService, "SERVICE", "AI AgentDefinition platform service",
        platformServiceCode, "AI"],
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
       VALUES ($1,'PLATFORM',NULL,NULL,$2,1,'ACTIVE',now()-interval '20 days',now()-interval '10 days')`,
      [f.toolSet, platformToolSetCode],
    );

    await client.query(
      `INSERT INTO core_ai.agent_definition
        (id,owner_scope,tenant_id,industry_context_id,code,objective_class,
         allowed_tool_set_id,max_risk_class,approval_policy_id,budget_policy_id,
         version,status,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$6,$8,'ORDER_AGENT','ORDER_FULFILLMENT',$11,'CONTROLLED',$12,$14,2,'ACTIVE',
          now()-interval '10 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,'MAINT_AGENT','MAINTENANCE',$11,'LOW',$12,$14,1,'DRAFT',
          now()-interval '8 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'','',$11,'',$12,$14,3,'',
          now()-interval '12 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,'TENANT_B_AGENT','SERVICE',$11,'HIGH',$13,$15,1,'ACTIVE',
          now()-interval '7 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,$10,'PLATFORM_ASSIST',$11,'CONTROLLED',$12,$14,4,'PUBLISHED',
          now()-interval '2 days',now()-interval '9 days')`,
      [
        f.agentIndustryA1,
        f.agentIndustryA2,
        f.agentTenantA,
        f.agentTenantB,
        f.agentPlatform,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        platformAgentCode,
        f.toolSet,
        f.approvalPolicyA,
        f.approvalPolicyB,
        f.budgetPolicyA,
        f.budgetPolicyB,
      ],
    );

    await client.query(
      "UPDATE core_ai.ai_tool_set SET status='RETIRED' WHERE id=$1",
      [f.toolSet],
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
      regionCode: "IN-AI-AGENT-DEF",
    },
  );
  store = new PostgresAIAgentDefinitionStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.agent_definition WHERE id=ANY($1::uuid[])",
      [[
        f.agentIndustryA1,
        f.agentIndustryA2,
        f.agentTenantA,
        f.agentTenantB,
        f.agentPlatform,
      ]],
    );
    await client.query("DELETE FROM core_ai.ai_tool_set WHERE id=$1", [f.toolSet]);
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

test("AIAGENTDEF-PG-001 exact Industry AgentDefinition preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: contextA(),
    agentDefinitionId: f.agentIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.agentIndustryA1);
  assert.equal(row.ownerScope, "INDUSTRY");
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.code, "ORDER_AGENT");
  assert.equal(row.objectiveClass, "ORDER_FULFILLMENT");
  assert.equal(row.allowedToolSetId, f.toolSet);
  assert.equal(row.maxRiskClass, "CONTROLLED");
  assert.equal(row.approvalPolicyId, f.approvalPolicyA);
  assert.equal(row.budgetPolicyId, f.budgetPolicyA);
  assert.equal(row.version, 2);
  assert.equal(row.status, "ACTIVE");
  assert.equal(Object.isFrozen(row), true);
  assert.equal("selected" in row, false);
  assert.equal("authorized" in row, false);
  assert.equal("approved" in row, false);
  assert.equal("budgetSatisfied" in row, false);
  assert.equal("executable" in row, false);
});

test("AIAGENTDEF-PG-002 sibling Industry AgentDefinition is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: contextA(),
    agentDefinitionId: f.agentIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    agentDefinitionId: f.agentIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.status, "DRAFT");
});

test("AIAGENTDEF-PG-003 Tenant AgentDefinition is same-Tenant visible and raw values stay raw", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    agentDefinitionId: f.agentTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    agentDefinitionId: f.agentTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.ownerScope, "TENANT");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.code, "");
  assert.equal(fromIndustry.objectiveClass, "");
  assert.equal(fromIndustry.maxRiskClass, "");
  assert.equal(fromIndustry.status, "");
  assert.equal(fromTenant.id, f.agentTenantA);
});

test("AIAGENTDEF-PG-004 PLATFORM AgentDefinition is not Tenant fallback and needs PLATFORM_GLOBAL", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    agentDefinitionId: f.agentPlatform,
  }), null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    agentDefinitionId: f.agentPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.ownerScope, "PLATFORM");
  assert.equal(platform.status, "PUBLISHED");
  assert.ok(Date.parse(platform.updatedAt) < Date.parse(platform.createdAt));
});

test("AIAGENTDEF-PG-005 foreign Tenant AgentDefinition is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    agentDefinitionId: f.agentTenantB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    agentDefinitionId: f.agentTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.approvalPolicyId, f.approvalPolicyB);
  assert.equal(own.budgetPolicyId, f.budgetPolicyB);
});

test("AIAGENTDEF-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    agentDefinitionId: f.missingAgent,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    agentDefinitionId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    agentDefinitionId: f.agentTenantA,
  }));
});

test("AIAGENTDEF-PG-007 raw AgentDefinition evidence adds no selection/approval/budget/tool-execution authority and platform writes stay protected", async () => {
  const industry = await store.loadForContext({
    requestContext: contextA(),
    agentDefinitionId: f.agentIndustryA1,
  });
  assert.ok(industry);
  assert.equal(industry.allowedToolSetId, f.toolSet);

  const retired = await admin.query(
    "SELECT status FROM core_ai.ai_tool_set WHERE id=$1",
    [f.toolSet],
  );
  assert.equal(retired.rows[0].status, "RETIRED");

  const privileges = await scoped.withContext(platformContext(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.agent_definition','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.agent_definition','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.agent_definition','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.agent_definition','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  const attempted = await scoped.withContext(platformContext(), (tx) => tx.query(
    "UPDATE core_ai.agent_definition SET code='MUTATED' WHERE id=$1::uuid",
    [f.agentPlatform],
  ));
  assert.equal(attempted.rowCount, 0);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.selectActive, "undefined");
  assert.equal(typeof store.plan, "undefined");
  assert.equal(typeof store.approve, "undefined");
  assert.equal(typeof store.evaluateBudget, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
