import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAITokenUsageStore } from "../../dist/server/ai/postgres-ai-token-usage-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_token_usage_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");
const providerCode = "AI_USAGE_PROVIDER_" + suffix;
const modelCode = "AI_USAGE_MODEL_" + suffix;
const capabilityCode = "AI_USAGE_CAP_" + suffix;
const platformServiceCode = "ai-token-usage-reader-" + suffix;

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
  "provider",
  "model",
  "capability",
  "usageIndustryA1",
  "usageIndustryA2",
  "usageTenantA",
  "usageTenantB",
  "missingUsage",
  "correlationA1",
  "correlationA2",
  "correlationTenantA",
  "correlationTenantB",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function tenantCoreA(principalId = f.principalA, membershipId = f.membershipA) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    dataHomeId: f.home,
    regionCode: "IN-AI-TOKEN-USAGE",
    principalId,
    principalType: "HUMAN",
    membershipId,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_CORE",
  });
}

function industryA1(principalId = f.principalA, membershipId = f.membershipA) {
  return Object.freeze({
    ...tenantCoreA(principalId, membershipId),
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
    ...tenantCoreA(f.principalB, f.membershipB),
    tenantId: f.tenantB,
    industryContextId: f.industryB1,
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-TOKEN-USAGE','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI TokenUsage tenant A"],
      [f.tenantB, "EDU", "AI TokenUsage tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-TOKEN-USAGE',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI TokenUsage principal A", null, null],
      [f.principalA2, "HUMAN", "AI TokenUsage principal A2", null, null],
      [f.principalB, "HUMAN", "AI TokenUsage principal B", null, null],
      [f.platformService, "SERVICE", "AI TokenUsage platform service", platformServiceCode, "AI"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,service_code,owning_module,created_at,updated_at)
         VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,
        [principalId, type, label, serviceCode, owningModule],
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
      `INSERT INTO core_ai.ai_provider
        (id,code,status,adapter_type,supported_regions,supported_capabilities,
         security_class,residency_metadata,credential_ref,health_state,version,
         created_at,updated_at)
       VALUES ($1,$2,'ACTIVE','REST',ARRAY['IN']::text[],ARRAY['CHAT']::text[],
         'REGULATED','{}'::jsonb,'secret://dd122-provider','HEALTHY',1,now(),now())`,
      [f.provider, providerCode],
    );

    await client.query(
      `INSERT INTO core_ai.ai_model
        (id,provider_id,model_code,display_name,capabilities,context_window_class,
         input_modalities,output_modalities,residency_regions,sensitivity_ceiling,
         cost_class,latency_class,status,version,metadata_json)
       VALUES ($1,$2,$3,'Usage Model',ARRAY['CHAT']::text[],'STANDARD',
         ARRAY['TEXT']::text[],ARRAY['TEXT']::text[],ARRAY['IN']::text[],
         'REGULATED','STANDARD','STANDARD','ACTIVE',1,'{}'::jsonb)`,
      [f.model, f.provider, modelCode],
    );

    await client.query(
      `INSERT INTO core_ai.ai_capability
        (id,code,category,required_entitlement,default_policy_class,schema_version,status)
       VALUES ($1,$2,'CHAT',NULL,'DEFAULT',1,'ACTIVE')`,
      [f.capability, capabilityCode],
    );

    await client.query(
      `INSERT INTO core_ai.token_usage
        (id,tenant_id,industry_context_id,principal_id,capability_code,provider_id,
         model_id,input_units,output_units,media_units,occurred_at,correlation_id)
       VALUES
        ($1,$5,$7,$9,$11,$12,$13,12345678901234567890.125,0.000000000000000001,NULL,
          '2026-09-23T01:01:01Z',$14),
        ($2,$5,$8,$9,$11,$12,$13,2.5,3.75,4.125,
          '2026-09-23T01:02:01Z',$15),
        ($3,$5,NULL,NULL,$11,$12,$13,0,7,1.5,
          '2026-09-23T01:03:01Z',$16),
        ($4,$6,$10,$17,$11,$12,$13,8,9,NULL,
          '2026-09-23T01:04:01Z',$18)`,
      [
        f.usageIndustryA1,
        f.usageIndustryA2,
        f.usageTenantA,
        f.usageTenantB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.principalA,
        f.industryB1,
        capabilityCode,
        f.provider,
        f.model,
        f.correlationA1,
        f.correlationA2,
        f.correlationTenantA,
        f.principalB,
        f.correlationTenantB,
      ],
    );

    await client.query(
      "UPDATE core_ai.ai_provider SET status='RETIRED' WHERE id=$1",
      [f.provider],
    );
    await client.query(
      "UPDATE core_ai.ai_model SET status='RETIRED' WHERE id=$1",
      [f.model],
    );
    await client.query(
      "UPDATE core_ai.ai_capability SET status='RETIRED' WHERE id=$1",
      [f.capability],
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
      regionCode: "IN-AI-TOKEN-USAGE",
    },
  );
  store = new PostgresAITokenUsageStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.token_usage WHERE id=ANY($1::uuid[])",
      [[f.usageIndustryA1, f.usageIndustryA2, f.usageTenantA, f.usageTenantB]],
    );
    await client.query("DELETE FROM core_ai.ai_model WHERE id=$1", [f.model]);
    await client.query("DELETE FROM core_ai.ai_provider WHERE id=$1", [f.provider]);
    await client.query("DELETE FROM core_ai.ai_capability WHERE id=$1", [f.capability]);
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

test("AIUSAGE-PG-001 exact Industry TokenUsage preserves immutable raw usage evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    tokenUsageId: f.usageIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.usageIndustryA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.principalId, f.principalA);
  assert.equal(row.capabilityCode, capabilityCode);
  assert.equal(row.providerId, f.provider);
  assert.equal(row.modelId, f.model);
  assert.equal(row.inputUnits, "12345678901234567890.125");
  assert.equal(row.outputUnits, "0.000000000000000001");
  assert.equal(row.mediaUnits, undefined);
  assert.equal(row.occurredAt, "2026-09-23T01:01:01.000Z");
  assert.equal(row.correlationId, f.correlationA1);
  assert.equal(Object.isFrozen(row), true);
  assert.equal("selectedProvider" in row, false);
  assert.equal("eligibleModel" in row, false);
  assert.equal("cost" in row, false);
  assert.equal("billable" in row, false);
});

test("AIUSAGE-PG-002 sibling Industry usage is hidden while exact sibling context can read it", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    tokenUsageId: f.usageIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: industryA2(),
    tokenUsageId: f.usageIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.inputUnits, "2.5");
  assert.equal(sibling.outputUnits, "3.75");
  assert.equal(sibling.mediaUnits, "4.125");
});

test("AIUSAGE-PG-003 Tenant-Core usage is same-Tenant visible from Core and Industry contexts", async () => {
  const fromCore = await store.loadForContext({
    requestContext: tenantCoreA(),
    tokenUsageId: f.usageTenantA,
  });
  const fromIndustry = await store.loadForContext({
    requestContext: industryA1(),
    tokenUsageId: f.usageTenantA,
  });

  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.industryContextId, undefined);
  assert.equal(fromCore.principalId, undefined);
  assert.equal(fromCore.inputUnits, "0");
  assert.equal(fromCore.outputUnits, "7");
  assert.equal(fromCore.mediaUnits, "1.5");
  assert.equal(fromIndustry.id, f.usageTenantA);
});

test("AIUSAGE-PG-004 principal id is attribution, not a TokenUsage RLS ownership predicate", async () => {
  const otherPrincipal = await store.loadForContext({
    requestContext: industryA1(f.principalA2, f.membershipA2),
    tokenUsageId: f.usageIndustryA1,
  });

  assert.ok(otherPrincipal);
  assert.equal(otherPrincipal.principalId, f.principalA);
  assert.equal(otherPrincipal.id, f.usageIndustryA1);
});

test("AIUSAGE-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot read Tenant usage", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    tokenUsageId: f.usageTenantB,
  }), null);

  const owner = await store.loadForContext({
    requestContext: industryB1(),
    tokenUsageId: f.usageTenantB,
  });
  assert.ok(owner);
  assert.equal(owner.tenantId, f.tenantB);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    tokenUsageId: f.usageIndustryA1,
  }), null);
});

test("AIUSAGE-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    tokenUsageId: f.missingUsage,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryA1(),
    tokenUsageId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryA1(),
      dataHomeId: randomUUID(),
    },
    tokenUsageId: f.usageIndustryA1,
  }));
});

test("AIUSAGE-PG-007 historical usage evidence does not become routing, billing, quota, or execution authority", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    tokenUsageId: f.usageIndustryA1,
  });
  assert.ok(row);

  const catalog = await admin.query(
    `SELECT
       (SELECT status FROM core_ai.ai_provider WHERE id=$1) AS provider_status,
       (SELECT status FROM core_ai.ai_model WHERE id=$2) AS model_status,
       (SELECT status FROM core_ai.ai_capability WHERE id=$3) AS capability_status`,
    [f.provider, f.model, f.capability],
  );
  assert.equal(catalog.rows[0].provider_status, "RETIRED");
  assert.equal(catalog.rows[0].model_status, "RETIRED");
  assert.equal(catalog.rows[0].capability_status, "RETIRED");

  const privileges = await scoped.withContext(industryA1(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.token_usage','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.token_usage','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.token_usage','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.token_usage','DELETE') AS can_delete`,
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
  assert.equal(typeof store.aggregate, "undefined");
  assert.equal(typeof store.calculateCost, "undefined");
  assert.equal(typeof store.evaluateQuota, "undefined");
  assert.equal(typeof store.routeModel, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
