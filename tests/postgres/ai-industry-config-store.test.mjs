import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIIndustryConfigStore } from "../../dist/server/ai/postgres-ai-industry-config-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_industry_config_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const serviceCode = "ai-industry-config-reader-" + randomBytes(8).toString("hex");

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
  "tenantConfigA",
  "tenantConfigB",
  "industryConfigA1v1",
  "industryConfigA1v2",
  "industryConfigA2",
  "industryConfigB1",
  "missingConfig",
  "residencyA",
  "residencyB",
  "retentionA",
  "retentionB",
  "promptOverrideA",
  "promptOverrideB",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function tenantCoreA() {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    dataHomeId: f.home,
    regionCode: "IN-AI-INDUSTRY-CONFIG",
    principalId: f.principalA,
    principalType: "HUMAN",
    membershipId: f.membershipA,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_CORE",
  });
}

function industryA1() {
  return Object.freeze({
    ...tenantCoreA(),
    industryContextId: f.industryA1,
    scopeClass: "TENANT_INDUSTRY",
  });
}

function industryA2() {
  return Object.freeze({
    ...tenantCoreA(),
    industryContextId: f.industryA2,
    scopeClass: "TENANT_INDUSTRY",
  });
}

function industryB1() {
  return Object.freeze({
    ...tenantCoreA(),
    tenantId: f.tenantB,
    industryContextId: f.industryB1,
    principalId: f.principalB,
    membershipId: f.membershipB,
    scopeClass: "TENANT_INDUSTRY",
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

async function insertTenantConfig(client, input) {
  await client.query(
    `INSERT INTO core_ai.tenant_ai_config
      (id,tenant_id,enabled,allowed_capabilities,allowed_provider_ids,allowed_model_ids,
       max_sensitivity_class,residency_policy_id,monthly_budget_policy_ref,
       retention_policy_id,prompt_override_policy_id,version,updated_at)
     VALUES ($1,$2,true,'{}'::text[],'{}'::uuid[],'{}'::uuid[],
       'REGULATED',$3,NULL,$4,$5,1,$6::timestamptz)`,
    [
      input.id,
      input.tenantId,
      input.residencyPolicyId,
      input.retentionPolicyId,
      input.promptOverridePolicyId,
      input.updatedAt,
    ],
  );
}

async function insertIndustryConfig(client, input) {
  await client.query(
    `INSERT INTO core_ai.industry_ai_config
      (id,tenant_id,industry_context_id,enabled,allowed_capabilities,
       allowed_provider_ids,allowed_model_ids,domain_prompt_set_id,country_pack_refs,
       localization_profile_ref,version,updated_at)
     VALUES ($1,$2,$3,$4,'{}'::text[],'{}'::uuid[],'{}'::uuid[],NULL,
       '{}'::uuid[],$5,$6,$7::timestamptz)`,
    [
      input.id,
      input.tenantId,
      input.industryContextId,
      input.enabled,
      input.localizationProfileRef,
      input.version,
      input.updatedAt,
    ],
  );
}

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "CREATE ROLE " + role +
      " LOGIN PASSWORD '" + password +
      "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await client.query("GRANT sbg_ai_gateway_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-INDUSTRY-CONFIG','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI IndustryConfig tenant A"],
      [f.tenantB, "EDU", "AI IndustryConfig tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-INDUSTRY-CONFIG',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, principalServiceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI IndustryConfig principal A", null, null],
      [f.principalB, "HUMAN", "AI IndustryConfig principal B", null, null],
      [f.platformService, "SERVICE", "AI IndustryConfig platform service", serviceCode, "AI"],
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

    await insertTenantConfig(client, {
      id: f.tenantConfigA,
      tenantId: f.tenantA,
      residencyPolicyId: f.residencyA,
      retentionPolicyId: f.retentionA,
      promptOverridePolicyId: f.promptOverrideA,
      updatedAt: "2026-09-20T00:00:00Z",
    });
    await insertTenantConfig(client, {
      id: f.tenantConfigB,
      tenantId: f.tenantB,
      residencyPolicyId: f.residencyB,
      retentionPolicyId: f.retentionB,
      promptOverridePolicyId: f.promptOverrideB,
      updatedAt: "2026-09-20T00:00:00Z",
    });

    await insertIndustryConfig(client, {
      id: f.industryConfigA1v1,
      tenantId: f.tenantA,
      industryContextId: f.industryA1,
      enabled: false,
      localizationProfileRef: null,
      version: 1,
      updatedAt: "2026-09-20T00:00:00Z",
    });
    await insertIndustryConfig(client, {
      id: f.industryConfigA1v2,
      tenantId: f.tenantA,
      industryContextId: f.industryA1,
      enabled: true,
      localizationProfileRef: "",
      version: 2,
      updatedAt: "2026-09-21T00:00:00Z",
    });
    await insertIndustryConfig(client, {
      id: f.industryConfigA2,
      tenantId: f.tenantA,
      industryContextId: f.industryA2,
      enabled: true,
      localizationProfileRef: "MFG-LOCALIZATION",
      version: 1,
      updatedAt: "2026-09-19T00:00:00Z",
    });
    await insertIndustryConfig(client, {
      id: f.industryConfigB1,
      tenantId: f.tenantB,
      industryContextId: f.industryB1,
      enabled: true,
      localizationProfileRef: "EDU-LOCALIZATION",
      version: 1,
      updatedAt: "2026-09-18T00:00:00Z",
    });

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
      regionCode: "IN-AI-INDUSTRY-CONFIG",
    },
  );
  store = new PostgresAIIndustryConfigStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.industry_ai_config WHERE id=ANY($1::uuid[])",
      [[f.industryConfigA1v1, f.industryConfigA1v2, f.industryConfigA2, f.industryConfigB1]],
    );
    await client.query(
      "DELETE FROM core_ai.tenant_ai_config WHERE id=ANY($1::uuid[])",
      [[f.tenantConfigA, f.tenantConfigB]],
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

test("AIINDCFG-PG-001 exact owning Industry context preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    industryConfigId: f.industryConfigA1v1,
  });

  assert.ok(row);
  assert.equal(row.id, f.industryConfigA1v1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.enabled, false);
  assert.deepEqual(row.allowedCapabilities, []);
  assert.deepEqual(row.allowedProviderIds, []);
  assert.deepEqual(row.allowedModelIds, []);
  assert.equal(row.domainPromptSetId, undefined);
  assert.deepEqual(row.countryPackRefs, []);
  assert.equal(row.localizationProfileRef, undefined);
  assert.equal(row.version, 1);
  assert.equal(typeof row.updatedAt, "string");
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.allowedCapabilities), true);
  assert.equal(Object.isFrozen(row.allowedProviderIds), true);
  assert.equal(Object.isFrozen(row.allowedModelIds), true);
  assert.equal(Object.isFrozen(row.countryPackRefs), true);
  assert.equal("effective" in row, false);
  assert.equal("merged" in row, false);
  assert.equal("provisioned" in row, false);
});

test("AIINDCFG-PG-002 Tenant Core and sibling Industry contexts cannot read the row", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    industryConfigId: f.industryConfigA1v1,
  }), null);

  assert.equal(await store.loadForContext({
    requestContext: industryA2(),
    industryConfigId: f.industryConfigA1v1,
  }), null);

  const exact = await store.loadForContext({
    requestContext: industryA1(),
    industryConfigId: f.industryConfigA1v1,
  });
  assert.ok(exact);
});

test("AIINDCFG-PG-003 foreign Tenant Industry config is hidden while owner can read it", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    industryConfigId: f.industryConfigB1,
  }), null);

  const own = await store.loadForContext({
    requestContext: industryB1(),
    industryConfigId: f.industryConfigB1,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.industryContextId, f.industryB1);
  assert.equal(own.localizationProfileRef, "EDU-LOCALIZATION");
});

test("AIINDCFG-PG-004 PLATFORM_GLOBAL context does not bypass Industry RLS", async () => {
  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    industryConfigId: f.industryConfigA1v1,
  }), null);
});

test("AIINDCFG-PG-005 exact versions stay distinct and no latest/effective merge is selected", async () => {
  const v1 = await store.loadForContext({
    requestContext: industryA1(),
    industryConfigId: f.industryConfigA1v1,
  });
  const v2 = await store.loadForContext({
    requestContext: industryA1(),
    industryConfigId: f.industryConfigA1v2,
  });

  assert.ok(v1);
  assert.ok(v2);
  assert.equal(v1.version, 1);
  assert.equal(v1.enabled, false);
  assert.equal(v1.localizationProfileRef, undefined);
  assert.equal(v2.version, 2);
  assert.equal(v2.enabled, true);
  assert.equal(v2.localizationProfileRef, "");
});

test("AIINDCFG-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    industryConfigId: f.missingConfig,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryA1(),
    industryConfigId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryA1(),
      dataHomeId: randomUUID(),
    },
    industryConfigId: f.industryConfigA1v1,
  }));
});

test("AIINDCFG-PG-007 database DML remains schema-owned while port adds no latest/effective/merge/provision authority", async () => {
  const privileges = await scoped.withContext(industryA1(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.industry_ai_config','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.industry_ai_config','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.industry_ai_config','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.industry_ai_config','DELETE') AS can_delete`,
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
  assert.equal(typeof store.loadLatest, "undefined");
  assert.equal(typeof store.resolveEffective, "undefined");
  assert.equal(typeof store.mergeTenantConfig, "undefined");
  assert.equal(typeof store.compileProvisioning, "undefined");
  assert.equal(typeof store.routeModel, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
