import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIAssistantDefinitionStore } from "../../dist/server/ai/postgres-ai-assistant-definition-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_assistant_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");
const capabilityCode = "AI_ASSIST_CAP_" + suffix;
const platformPromptCode = "AI_ASSIST_PROMPT_" + suffix;
const platformToolSetCode = "AI_ASSIST_TOOLSET_" + suffix;
const platformAssistantCode = "AI_ASSIST_PLATFORM_" + suffix;
const platformServiceCode = "ai-assistant-reader-" + suffix;

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
  "capability",
  "promptTemplate",
  "toolSet",
  "assistantIndustryA1",
  "assistantIndustryA2",
  "assistantTenantA",
  "assistantTenantB",
  "assistantPlatform",
  "modelPolicy",
  "retentionPolicyA",
  "retentionPolicyB",
  "missingAssistant",
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
    regionCode: "IN-AI-ASSISTANT",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-ASSISTANT','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "AI Assistant tenant A"],
      [f.tenantB, "EDU", "AI Assistant tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-ASSISTANT',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI Assistant principal A", null, null],
      [f.principalB, "HUMAN", "AI Assistant principal B", null, null],
      [f.platformService, "SERVICE", "AI Assistant platform service",
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
      `INSERT INTO core_ai.ai_capability
        (id,code,category,required_entitlement,default_policy_class,schema_version,status)
       VALUES ($1::uuid,$2,'CHAT',NULL,'',1,'ACTIVE')`,
      [f.capability, capabilityCode],
    );

    await client.query(
      `INSERT INTO core_ai.prompt_template
        (id,owner_scope,tenant_id,industry_context_id,code,version,system_template,
         variable_schema_json,grounding_required,allowed_override_fields,status,
         created_by,approved_by,created_at,updated_at)
       VALUES ($1,'PLATFORM',NULL,NULL,$2,1,'Use authorized context only.',
         '{"type":"object"}'::jsonb,false,'{}'::text[],'ACTIVE',
         $3,NULL,now()-interval '20 days',now()-interval '10 days')`,
      [f.promptTemplate, platformPromptCode, f.platformService],
    );

    await client.query(
      `INSERT INTO core_ai.ai_tool_set
        (id,owner_scope,tenant_id,industry_context_id,code,version,status,created_at,updated_at)
       VALUES ($1,'PLATFORM',NULL,NULL,$2,1,'ACTIVE',now()-interval '20 days',now()-interval '10 days')`,
      [f.toolSet, platformToolSetCode],
    );

    await client.query(
      `INSERT INTO core_ai.assistant_definition
        (id,owner_scope,tenant_id,industry_context_id,code,allowed_capabilities,
         rag_scope_rules,prompt_template_id,tool_set_id,model_policy_id,retention_policy_id,
         version,status,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$6,$8,'ORDER_ASSISTANT',ARRAY[$11]::text[],
          '{"sources":["document","catalog"],"limits":{"topK":5}}'::jsonb,$12,$13,$14,$15,2,'ACTIVE',
          now()-interval '10 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,'MAINT_ASSISTANT',ARRAY[$11]::text[],
          '["raw",{"nested":true}]'::jsonb,$12,$13,NULL,$15,1,'DRAFT',
          now()-interval '8 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'',ARRAY[]::text[],
          'null'::jsonb,$12,NULL,NULL,$15,3,'',
          now()-interval '12 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,'TENANT_B_ASSISTANT',ARRAY[$11]::text[],
          '{}'::jsonb,$12,$13,NULL,$16,1,'ACTIVE',
          now()-interval '7 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,$10,ARRAY[$11]::text[],
          '{"platform":true}'::jsonb,$12,$13,$14,$15,4,'PUBLISHED',
          now()-interval '2 days',now()-interval '9 days')`,
      [
        f.assistantIndustryA1,
        f.assistantIndustryA2,
        f.assistantTenantA,
        f.assistantTenantB,
        f.assistantPlatform,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        platformAssistantCode,
        capabilityCode,
        f.promptTemplate,
        f.toolSet,
        f.modelPolicy,
        f.retentionPolicyA,
        f.retentionPolicyB,
      ],
    );

    await client.query(
      "UPDATE core_ai.ai_capability SET status='RETIRED' WHERE id=$1",
      [f.capability],
    );
    await client.query(
      "UPDATE core_ai.prompt_template SET status='RETIRED' WHERE id=$1",
      [f.promptTemplate],
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
      regionCode: "IN-AI-ASSISTANT",
    },
  );
  store = new PostgresAIAssistantDefinitionStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.assistant_definition WHERE id=ANY($1::uuid[])",
      [[
        f.assistantIndustryA1,
        f.assistantIndustryA2,
        f.assistantTenantA,
        f.assistantTenantB,
        f.assistantPlatform,
      ]],
    );
    await client.query("DELETE FROM core_ai.ai_tool_set WHERE id=$1", [f.toolSet]);
    await client.query("DELETE FROM core_ai.prompt_template WHERE id=$1", [f.promptTemplate]);
    await client.query("DELETE FROM core_ai.ai_capability WHERE id=$1", [f.capability]);
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

test("AIASSIST-PG-001 exact Industry AssistantDefinition preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: contextA(),
    assistantDefinitionId: f.assistantIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.assistantIndustryA1);
  assert.equal(row.ownerScope, "INDUSTRY");
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.code, "ORDER_ASSISTANT");
  assert.deepEqual(row.allowedCapabilities, [capabilityCode]);
  assert.deepEqual(row.ragScopeRules, {
    limits: {topK: 5},
    sources: ["document", "catalog"],
  });
  assert.equal(row.promptTemplateId, f.promptTemplate);
  assert.equal(row.toolSetId, f.toolSet);
  assert.equal(row.modelPolicyId, f.modelPolicy);
  assert.equal(row.retentionPolicyId, f.retentionPolicyA);
  assert.equal(row.version, 2);
  assert.equal(row.status, "ACTIVE");
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.allowedCapabilities), true);
  assert.equal(Object.isFrozen(row.ragScopeRules), true);
  assert.equal("selected" in row, false);
  assert.equal("eligible" in row, false);
  assert.equal("renderedPrompt" in row, false);
  assert.equal("executable" in row, false);
});

test("AIASSIST-PG-002 sibling Industry AssistantDefinition is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: contextA(),
    assistantDefinitionId: f.assistantIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    assistantDefinitionId: f.assistantIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.status, "DRAFT");
});

test("AIASSIST-PG-003 Tenant AssistantDefinition is same-Tenant visible and raw values stay raw", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    assistantDefinitionId: f.assistantTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    assistantDefinitionId: f.assistantTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.ownerScope, "TENANT");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.code, "");
  assert.deepEqual(fromIndustry.allowedCapabilities, []);
  assert.equal(fromIndustry.ragScopeRules, null);
  assert.equal(fromIndustry.toolSetId, undefined);
  assert.equal(fromIndustry.modelPolicyId, undefined);
  assert.equal(fromIndustry.status, "");
  assert.equal(fromTenant.id, f.assistantTenantA);
});

test("AIASSIST-PG-004 PLATFORM AssistantDefinition is not Tenant fallback and needs PLATFORM_GLOBAL", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    assistantDefinitionId: f.assistantPlatform,
  }), null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    assistantDefinitionId: f.assistantPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.ownerScope, "PLATFORM");
  assert.equal(platform.status, "PUBLISHED");
  assert.ok(Date.parse(platform.updatedAt) < Date.parse(platform.createdAt));
});

test("AIASSIST-PG-005 foreign Tenant AssistantDefinition is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    assistantDefinitionId: f.assistantTenantB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    assistantDefinitionId: f.assistantTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
});

test("AIASSIST-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    assistantDefinitionId: f.missingAssistant,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    assistantDefinitionId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    assistantDefinitionId: f.assistantTenantA,
  }));
});

test("AIASSIST-PG-007 raw AssistantDefinition evidence adds no selection/render/RAG/tool authority and platform writes stay protected", async () => {
  const industry = await store.loadForContext({
    requestContext: contextA(),
    assistantDefinitionId: f.assistantIndustryA1,
  });
  assert.ok(industry);
  assert.deepEqual(industry.allowedCapabilities, [capabilityCode]);
  assert.equal(industry.promptTemplateId, f.promptTemplate);
  assert.equal(industry.toolSetId, f.toolSet);

  const retired = await admin.query(
    `SELECT
       (SELECT status FROM core_ai.ai_capability WHERE id=$1) AS capability_status,
       (SELECT status::text FROM core_ai.prompt_template WHERE id=$2) AS prompt_status,
       (SELECT status FROM core_ai.ai_tool_set WHERE id=$3) AS tool_set_status`,
    [f.capability, f.promptTemplate, f.toolSet],
  );
  assert.equal(retired.rows[0].capability_status, "RETIRED");
  assert.equal(retired.rows[0].prompt_status, "RETIRED");
  assert.equal(retired.rows[0].tool_set_status, "RETIRED");

  const privileges = await scoped.withContext(platformContext(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.assistant_definition','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.assistant_definition','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.assistant_definition','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.assistant_definition','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  const attempted = await scoped.withContext(platformContext(), (tx) => tx.query(
    "UPDATE core_ai.assistant_definition SET code='MUTATED' WHERE id=$1::uuid",
    [f.assistantPlatform],
  ));
  assert.equal(attempted.rowCount, 0);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.selectActive, "undefined");
  assert.equal(typeof store.resolveCapabilities, "undefined");
  assert.equal(typeof store.renderPrompt, "undefined");
  assert.equal(typeof store.resolveRag, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
