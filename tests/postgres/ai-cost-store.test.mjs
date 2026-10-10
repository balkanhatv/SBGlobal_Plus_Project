import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAICostStore } from "../../dist/server/ai/postgres-ai-cost-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_cost_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");
const providerCode = "AI_COST_PROVIDER_" + suffix;
const modelCode = "AI_COST_MODEL_" + suffix;
const capabilityCode = "AI_COST_CAP_" + suffix;
const platformServiceCode = "ai-cost-reader-" + suffix;

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
    regionCode: "IN-AI-COST",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-COST','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI Cost tenant A"],
      [f.tenantB, "EDU", "AI Cost tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-COST',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI Cost principal A", null, null],
      [f.principalA2, "HUMAN", "AI Cost principal A2", null, null],
      [f.principalB, "HUMAN", "AI Cost principal B", null, null],
      [f.platformService, "SERVICE", "AI Cost platform service", platformServiceCode, "AI"],
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
         'REGULATED','{}'::jsonb,'secret://dd123-provider','HEALTHY',1,now(),now())`,
      [f.provider, providerCode],
    );

    await client.query(
      `INSERT INTO core_ai.ai_model
        (id,provider_id,model_code,display_name,capabilities,context_window_class,
         input_modalities,output_modalities,residency_regions,sensitivity_ceiling,
         cost_class,latency_class,status,version,metadata_json)
       VALUES ($1,$2,$3,'Cost Model',ARRAY['CHAT']::text[],'STANDARD',
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
        ($1,$5,$7,$9,$11,$12,$13,1,2,NULL,'2026-09-23T02:01:01Z',$1),
        ($2,$5,$8,$9,$11,$12,$13,3,4,NULL,'2026-09-23T02:02:01Z',$2),
        ($3,$5,NULL,$9,$11,$12,$13,5,6,NULL,'2026-09-23T02:03:01Z',$3),
        ($4,$6,$10,$14,$11,$12,$13,7,8,NULL,'2026-09-23T02:04:01Z',$4)`,
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
        f.principalB,
      ],
    );

    await client.query(
      `INSERT INTO core_ai.ai_cost
        (usage_id,cost_currency,estimated_minor_units,provider_rate_version,
         billable_class,finalized_at)
       VALUES
        ($1,'USD',9223372036854775807,'rate-v1','STANDARD','2026-09-23T02:11:01Z'),
        ($2,'INR',25,'rate-v2','',NULL),
        ($3,'USD',0,'','TENANT',NULL),
        ($4,'EUR',99,'rate-v4','FOREIGN','2026-09-23T02:14:01Z')`,
      [f.usageIndustryA1, f.usageIndustryA2, f.usageTenantA, f.usageTenantB],
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
      regionCode: "IN-AI-COST",
    },
  );
  store = new PostgresAICostStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_cost WHERE usage_id=ANY($1::uuid[])",
      [[f.usageIndustryA1, f.usageIndustryA2, f.usageTenantA, f.usageTenantB]],
    );
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

test("AICOST-PG-001 exact Industry cost preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    usageId: f.usageIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.usageId, f.usageIndustryA1);
  assert.equal(row.costCurrency, "USD");
  assert.equal(row.estimatedMinorUnits, "9223372036854775807");
  assert.equal(row.providerRateVersion, "rate-v1");
  assert.equal(row.billableClass, "STANDARD");
  assert.equal(row.finalizedAt, "2026-09-23T02:11:01.000Z");
  assert.equal(Object.isFrozen(row), true);
  assert.equal("computed" in row, false);
  assert.equal("invoiceId" in row, false);
  assert.equal("finalized" in row, false);
});

test("AICOST-PG-002 sibling Industry cost is hidden while exact sibling context can read it", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    usageId: f.usageIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: industryA2(),
    usageId: f.usageIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.costCurrency, "INR");
  assert.equal(sibling.estimatedMinorUnits, "25");
  assert.equal(sibling.providerRateVersion, "rate-v2");
  assert.equal(sibling.billableClass, "");
  assert.equal(sibling.finalizedAt, undefined);
});

test("AICOST-PG-003 Tenant-Core cost is same-Tenant visible from Core and Industry contexts", async () => {
  const fromCore = await store.loadForContext({
    requestContext: tenantCoreA(),
    usageId: f.usageTenantA,
  });
  const fromIndustry = await store.loadForContext({
    requestContext: industryA1(),
    usageId: f.usageTenantA,
  });

  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.estimatedMinorUnits, "0");
  assert.equal(fromCore.providerRateVersion, "");
  assert.equal(fromCore.billableClass, "TENANT");
  assert.equal(fromIndustry.usageId, f.usageTenantA);
});

test("AICOST-PG-004 parent principal attribution does not create principal-private cost visibility", async () => {
  const otherPrincipal = await store.loadForContext({
    requestContext: industryA1(f.principalA2, f.membershipA2),
    usageId: f.usageIndustryA1,
  });

  assert.ok(otherPrincipal);
  assert.equal(otherPrincipal.usageId, f.usageIndustryA1);
  assert.equal(otherPrincipal.costCurrency, "USD");
});

test("AICOST-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot read cost", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    usageId: f.usageTenantB,
  }), null);

  const owner = await store.loadForContext({
    requestContext: industryB1(),
    usageId: f.usageTenantB,
  });
  assert.ok(owner);
  assert.equal(owner.costCurrency, "EUR");

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    usageId: f.usageIndustryA1,
  }), null);
});

test("AICOST-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    usageId: f.missingUsage,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryA1(),
    usageId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryA1(),
      dataHomeId: randomUUID(),
    },
    usageId: f.usageIndustryA1,
  }));
});

test("AICOST-PG-007 raw cost evidence adds no pricing, billing, finalization, or execution authority", async () => {
  const privileges = await scoped.withContext(industryA1(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_cost','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_cost','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_cost','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_cost','DELETE') AS can_delete`,
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
  assert.equal(typeof store.applyRate, "undefined");
  assert.equal(typeof store.convertCurrency, "undefined");
  assert.equal(typeof store.finalize, "undefined");
  assert.equal(typeof store.invoice, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
