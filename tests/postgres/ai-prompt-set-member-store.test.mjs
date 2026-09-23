import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIPromptSetMemberStore } from "../../dist/server/ai/postgres-ai-prompt-set-member-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_prompt_set_member_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const platformPromptSetCode = "PLATFORM_PROMPT_SET_DD114_" + randomBytes(8).toString("hex");
const platformPromptTemplateCode = "PLATFORM_PROMPT_TEMPLATE_DD114_" + randomBytes(8).toString("hex");
const platformServiceCode = "ai-prompt-set-member-reader-" + randomBytes(8).toString("hex");
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
  "promptTemplate",
  "promptSetIndustryA1",
  "promptSetIndustryA2",
  "promptSetTenantA",
  "promptSetTenantB",
  "promptSetPlatform",
  "memberIndustryA1",
  "memberIndustryA2",
  "memberTenantA",
  "memberTenantB",
  "memberPlatform",
  "missingMember",
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
    regionCode: "IN-AI-PROMPT-MEMBER",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-PROMPT-MEMBER','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "AI PromptSetMember tenant A"],
      [f.tenantB, "EDU", "AI PromptSetMember tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-PROMPT-MEMBER',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI PromptSetMember principal A", null, null],
      [f.principalB, "HUMAN", "AI PromptSetMember principal B", null, null],
      [f.platformService, "SERVICE", "AI PromptSetMember platform service",
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
      `INSERT INTO core_ai.prompt_template
        (id,owner_scope,tenant_id,industry_context_id,code,version,system_template,
         variable_schema_json,grounding_required,allowed_override_fields,status,
         created_by,approved_by,created_at,updated_at)
       VALUES ($1,'PLATFORM',NULL,NULL,$2,1,'Use authorized context only.',
         '{"type":"object"}'::jsonb,false,'{}'::text[],'ACTIVE',
         $3,NULL,now()-interval '20 days',now()-interval '10 days')`,
      [f.promptTemplate, platformPromptTemplateCode, f.platformService],
    );

    await client.query(
      `INSERT INTO core_ai.ai_prompt_set
        (id,owner_scope,tenant_id,industry_context_id,code,version,status,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$6,$8,'ORDER_PROMPTS_DD114',2,'ACTIVE',now()-interval '10 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,'MAINT_PROMPTS_DD114',1,'ACTIVE',now()-interval '8 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'TENANT_PROMPTS_DD114',3,'ACTIVE',now()-interval '12 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,'TENANT_B_PROMPTS_DD114',1,'ACTIVE',now()-interval '7 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,$10,4,'ACTIVE',now()-interval '2 days',now()-interval '1 day')`,
      [
        f.promptSetIndustryA1,
        f.promptSetIndustryA2,
        f.promptSetTenantA,
        f.promptSetTenantB,
        f.promptSetPlatform,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        platformPromptSetCode,
      ],
    );

    await client.query(
      `INSERT INTO core_ai.ai_prompt_set_member
        (id,prompt_set_id,prompt_template_id,priority,enabled,created_at)
       VALUES
        ($1,$6,$11,-7,true,now()-interval '5 days'),
        ($2,$7,$11,0,false,now()-interval '4 days'),
        ($3,$8,$11,250,false,now()-interval '3 days'),
        ($4,$9,$11,100,true,now()-interval '2 days'),
        ($5,$10,$11,42,true,now()-interval '1 day')`,
      [
        f.memberIndustryA1,
        f.memberIndustryA2,
        f.memberTenantA,
        f.memberTenantB,
        f.memberPlatform,
        f.promptSetIndustryA1,
        f.promptSetIndustryA2,
        f.promptSetTenantA,
        f.promptSetTenantB,
        f.promptSetPlatform,
        f.promptTemplate,
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
      regionCode: "IN-AI-PROMPT-MEMBER",
    },
  );
  store = new PostgresAIPromptSetMemberStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_prompt_set_member WHERE id=ANY($1::uuid[])",
      [[
        f.memberIndustryA1,
        f.memberIndustryA2,
        f.memberTenantA,
        f.memberTenantB,
        f.memberPlatform,
      ]],
    );
    await client.query(
      "DELETE FROM core_ai.ai_prompt_set WHERE id=ANY($1::uuid[])",
      [[
        f.promptSetIndustryA1,
        f.promptSetIndustryA2,
        f.promptSetTenantA,
        f.promptSetTenantB,
        f.promptSetPlatform,
      ]],
    );
    await client.query("DELETE FROM core_ai.prompt_template WHERE id=$1", [f.promptTemplate]);
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

test("AIPROMPTMEM-PG-001 exact visible member preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: contextA(),
    promptSetMemberId: f.memberIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.memberIndustryA1);
  assert.equal(row.promptSetId, f.promptSetIndustryA1);
  assert.equal(row.promptTemplateId, f.promptTemplate);
  assert.equal(row.priority, -7);
  assert.equal(row.enabled, true);
  assert.equal(typeof row.createdAt, "string");
  assert.equal(Object.isFrozen(row), true);
  assert.equal("effective" in row, false);
  assert.equal("selected" in row, false);
  assert.equal("renderable" in row, false);
  assert.equal("executable" in row, false);
});

test("AIPROMPTMEM-PG-002 sibling Industry parent hides its member", async () => {
  assert.equal(await store.loadForContext({
    requestContext: contextA(),
    promptSetMemberId: f.memberIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    promptSetMemberId: f.memberIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.promptSetId, f.promptSetIndustryA2);
  assert.equal(sibling.priority, 0);
  assert.equal(sibling.enabled, false);
});

test("AIPROMPTMEM-PG-003 Tenant-parent member is same-Tenant visible and raw values stay raw", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    promptSetMemberId: f.memberTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    promptSetMemberId: f.memberTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.priority, 250);
  assert.equal(fromIndustry.enabled, false);
  assert.equal(fromTenant.id, f.memberTenantA);
});

test("AIPROMPTMEM-PG-004 PLATFORM-parent member is not Tenant fallback", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    promptSetMemberId: f.memberPlatform,
  }), null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    promptSetMemberId: f.memberPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.promptSetId, f.promptSetPlatform);
  assert.equal(platform.priority, 42);
});

test("AIPROMPTMEM-PG-005 foreign Tenant parent hides its member", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    promptSetMemberId: f.memberTenantB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    promptSetMemberId: f.memberTenantB,
  });
  assert.ok(own);
  assert.equal(own.promptSetId, f.promptSetTenantB);
});

test("AIPROMPTMEM-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    promptSetMemberId: f.missingMember,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    promptSetMemberId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    promptSetMemberId: f.memberTenantA,
  }));
});

test("AIPROMPTMEM-PG-007 raw member evidence adds no effective/render/execute authority and platform-parent writes stay protected", async () => {
  const privileges = await scoped.withContext(platformContext(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_prompt_set_member','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_prompt_set_member','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_prompt_set_member','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_prompt_set_member','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  const attempted = await scoped.withContext(platformContext(), (tx) => tx.query(
    "UPDATE core_ai.ai_prompt_set_member SET enabled=false WHERE id=$1::uuid",
    [f.memberPlatform],
  ));
  assert.equal(attempted.rowCount, 0);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    promptSetMemberId: f.memberPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.enabled, true);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.listForPromptSet, "undefined");
  assert.equal(typeof store.resolveEffective, "undefined");
  assert.equal(typeof store.render, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
