import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAITenantConfigStore } from "../../dist/server/ai/postgres-ai-tenant-config-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_tenant_config_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const serviceCode = "ai-tenant-config-reader-" + randomBytes(8).toString("hex");

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
  "industryB1",
  "configA1",
  "configA2",
  "configB1",
  "missingConfig",
  "residencyA1",
  "residencyA2",
  "residencyB1",
  "retentionA1",
  "retentionA2",
  "retentionB1",
  "promptOverrideA1",
  "promptOverrideA2",
  "promptOverrideB1",
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
    regionCode: "IN-AI-TENANT-CONFIG",
    principalId: f.principalA,
    principalType: "HUMAN",
    membershipId: f.membershipA,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_CORE",
  });
}

function industryA() {
  return Object.freeze({
    ...tenantCoreA(),
    industryContextId: f.industryA1,
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreB() {
  return Object.freeze({
    ...tenantCoreA(),
    tenantId: f.tenantB,
    principalId: f.principalB,
    membershipId: f.membershipB,
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

async function insertTenantConfig(client, row) {
  await client.query(
    `INSERT INTO core_ai.tenant_ai_config
      (id,tenant_id,enabled,allowed_capabilities,allowed_provider_ids,allowed_model_ids,
       max_sensitivity_class,residency_policy_id,monthly_budget_policy_ref,
       retention_policy_id,prompt_override_policy_id,version,updated_at)
     VALUES ($1,$2,$3,'{}'::text[],'{}'::uuid[],'{}'::uuid[],$4,$5,$6,$7,$8,$9,$10::timestamptz)`,
    [
      row.id,
      row.tenantId,
      row.enabled,
      row.sensitivity,
      row.residencyPolicyId,
      row.monthlyBudgetPolicyRef,
      row.retentionPolicyId,
      row.promptOverridePolicyId,
      row.version,
      row.updatedAt,
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-TENANT-CONFIG','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI TenantConfig tenant A"],
      [f.tenantB, "EDU", "AI TenantConfig tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-TENANT-CONFIG',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, principalServiceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI TenantConfig principal A", null, null],
      [f.principalB, "HUMAN", "AI TenantConfig principal B", null, null],
      [f.platformService, "SERVICE", "AI TenantConfig platform service", serviceCode, "AI"],
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

    for (const [id, tenantId, code] of [
      [f.industryA1, f.tenantA, "RTL"],
      [f.industryB1, f.tenantB, "EDU"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',true,now(),now())`,
        [id, tenantId, code],
      );
    }

    await insertTenantConfig(client, {
      id: f.configA1,
      tenantId: f.tenantA,
      enabled: true,
      sensitivity: "CONFIDENTIAL",
      residencyPolicyId: f.residencyA1,
      monthlyBudgetPolicyRef: null,
      retentionPolicyId: f.retentionA1,
      promptOverridePolicyId: f.promptOverrideA1,
      version: 1,
      updatedAt: "2026-09-20T00:00:00Z",
    });

    await insertTenantConfig(client, {
      id: f.configA2,
      tenantId: f.tenantA,
      enabled: false,
      sensitivity: "REGULATED",
      residencyPolicyId: f.residencyA2,
      monthlyBudgetPolicyRef: "",
      retentionPolicyId: f.retentionA2,
      promptOverridePolicyId: f.promptOverrideA2,
      version: 2,
      updatedAt: "2026-09-21T00:00:00Z",
    });

    await insertTenantConfig(client, {
      id: f.configB1,
      tenantId: f.tenantB,
      enabled: true,
      sensitivity: "PUBLIC",
      residencyPolicyId: f.residencyB1,
      monthlyBudgetPolicyRef: "BUDGET-B",
      retentionPolicyId: f.retentionB1,
      promptOverridePolicyId: f.promptOverrideB1,
      version: 1,
      updatedAt: "2026-09-19T00:00:00Z",
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
      regionCode: "IN-AI-TENANT-CONFIG",
    },
  );
  store = new PostgresAITenantConfigStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.tenant_ai_config WHERE id=ANY($1::uuid[])",
      [[f.configA1, f.configA2, f.configB1]],
    );
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipA, f.membershipB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1, f.industryB1]],
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

test("AITENCFG-PG-001 exact Tenant config preserves immutable raw metadata", async () => {
  const row = await store.loadForContext({
    requestContext: tenantCoreA(),
    tenantConfigId: f.configA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.configA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.enabled, true);
  assert.deepEqual(row.allowedCapabilities, []);
  assert.deepEqual(row.allowedProviderIds, []);
  assert.deepEqual(row.allowedModelIds, []);
  assert.equal(row.maxSensitivityClass, "CONFIDENTIAL");
  assert.equal(row.residencyPolicyId, f.residencyA1);
  assert.equal(row.monthlyBudgetPolicyRef, undefined);
  assert.equal(row.retentionPolicyId, f.retentionA1);
  assert.equal(row.promptOverridePolicyId, f.promptOverrideA1);
  assert.equal(row.version, 1);
  assert.equal(typeof row.updatedAt, "string");
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.allowedCapabilities), true);
  assert.equal(Object.isFrozen(row.allowedProviderIds), true);
  assert.equal(Object.isFrozen(row.allowedModelIds), true);
  assert.equal("effective" in row, false);
  assert.equal("current" in row, false);
  assert.equal("provisioned" in row, false);
});

test("AITENCFG-PG-002 same Tenant Core and Industry contexts see the same Tenant config", async () => {
  const core = await store.loadForContext({
    requestContext: tenantCoreA(),
    tenantConfigId: f.configA1,
  });
  const industry = await store.loadForContext({
    requestContext: industryA(),
    tenantConfigId: f.configA1,
  });

  assert.ok(core);
  assert.ok(industry);
  assert.equal(industry.id, core.id);
  assert.equal(industry.tenantId, f.tenantA);
});

test("AITENCFG-PG-003 foreign Tenant config is hidden while owner can read it", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    tenantConfigId: f.configB1,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    tenantConfigId: f.configB1,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.monthlyBudgetPolicyRef, "BUDGET-B");
});

test("AITENCFG-PG-004 PLATFORM_GLOBAL context does not bypass Tenant RLS", async () => {
  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    tenantConfigId: f.configA1,
  }), null);
});

test("AITENCFG-PG-005 exact versions stay distinct and no latest/effective config is selected", async () => {
  const v1 = await store.loadForContext({
    requestContext: tenantCoreA(),
    tenantConfigId: f.configA1,
  });
  const v2 = await store.loadForContext({
    requestContext: tenantCoreA(),
    tenantConfigId: f.configA2,
  });

  assert.ok(v1);
  assert.ok(v2);
  assert.equal(v1.version, 1);
  assert.equal(v1.enabled, true);
  assert.equal(v1.monthlyBudgetPolicyRef, undefined);
  assert.equal(v2.version, 2);
  assert.equal(v2.enabled, false);
  assert.equal(v2.monthlyBudgetPolicyRef, "");
  assert.equal(v2.maxSensitivityClass, "REGULATED");
});

test("AITENCFG-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    tenantConfigId: f.missingConfig,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    tenantConfigId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    tenantConfigId: f.configA1,
  }));
});

test("AITENCFG-PG-007 database DML remains schema-owned while read port adds no latest/effective/provision authority", async () => {
  const privileges = await scoped.withContext(tenantCoreA(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.tenant_ai_config','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.tenant_ai_config','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.tenant_ai_config','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.tenant_ai_config','DELETE') AS can_delete`,
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
  assert.equal(typeof store.compileProvisioning, "undefined");
  assert.equal(typeof store.routeModel, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
