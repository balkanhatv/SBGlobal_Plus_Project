import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresBrandConfigurationStore } from "../../dist/server/config/postgres-brand-configuration-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_brand_configuration_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");

const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","platformService",
  "industryA1","industryA2","industryB1",
  "brandIndustryA1","brandIndustryA2","brandTenantA","brandTenantB","brandPlatform",
  "logoA1","faviconA1","logoPlatform","createdBy","approvedBy","missingBrand",
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
    regionCode: "IN-BRAND-CONFIG",
    principalId: f.principalA,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreA() {
  return Object.freeze({...contextA(), industryContextId: undefined, scopeClass: "TENANT_CORE"});
}

function tenantCoreB() {
  return Object.freeze({
    ...tenantCoreA(),
    tenantId: f.tenantB,
    principalId: f.principalB,
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
    await client.query("GRANT sbg_app_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-BRAND-CONFIG','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "BrandConfiguration tenant A"],
      [f.tenantB, "EDU", "BrandConfiguration tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-BRAND-CONFIG',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
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
      `INSERT INTO core_config.brand_configuration
        (id,owner_scope,tenant_id,industry_context_id,code,version,status,
         token_json,typography_json,logo_document_id,favicon_document_id,
         accessibility_validation_status,created_by,approved_by,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$6,$8,$10,2,'ACTIVE',
          '{"primary":"#06B6D4","security":{"danger":"#DC2626"}}'::jsonb,
          '{"primary":"Inter","heading":"Poppins"}'::jsonb,$11,$12,'PASS',$13,$14,
          now()-interval '10 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,$15,1,'PUBLISHED',
          '{"warning":"#000000"}'::jsonb,'{"primary":""}'::jsonb,NULL,NULL,'PENDING',$13,NULL,
          now()-interval '8 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'',3,'DRAFT',
          '{"raw":{"empty":"","nullable":null},"danger":"#FFFFFF"}'::jsonb,
          '{"font":"","fallbacks":["Inter",null,"Inter"]}'::jsonb,NULL,NULL,'FAIL',$13,NULL,
          now()-interval '6 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,$16,1,'ACTIVE',
          '{"primary":"#123456"}'::jsonb,'{"primary":"Inter"}'::jsonb,NULL,NULL,'PASS',$13,$14,
          now()-interval '5 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,$17,4,'ACTIVE',
          '{"product":"SBGlobal Plus","danger":"#DC2626"}'::jsonb,
          '{"primary":"Inter"}'::jsonb,$18,NULL,'PASS',$13,$14,
          now()-interval '20 days',now()-interval '1 hour')`,
      [
        f.brandIndustryA1,
        f.brandIndustryA2,
        f.brandTenantA,
        f.brandTenantB,
        f.brandPlatform,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        "INDUSTRY_A1_" + suffix,
        f.logoA1,
        f.faviconA1,
        f.createdBy,
        f.approvedBy,
        "INDUSTRY_A2_" + suffix,
        "TENANT_B_" + suffix,
        "PLATFORM_" + suffix,
        f.logoPlatform,
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
    new PostgresDatabase(pool),
    {dataHomeId: f.home, regionCode: "IN-BRAND-CONFIG"},
  );
  store = new PostgresBrandConfigurationStore(scoped);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_config.brand_configuration WHERE id=ANY($1::uuid[])",
      [[f.brandIndustryA1,f.brandIndustryA2,f.brandTenantA,f.brandTenantB,f.brandPlatform]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA,f.tenantB]],
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

test("BRANDCFG-PG-001 exact Industry BrandConfiguration preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: contextA(),
    brandConfigurationId: f.brandIndustryA1,
  });
  assert.ok(row);
  assert.equal(row.id, f.brandIndustryA1);
  assert.equal(row.ownerScope, "INDUSTRY");
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.version, 2);
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.accessibilityValidationStatus, "PASS");
  assert.equal(row.logoDocumentId, f.logoA1);
  assert.equal(row.faviconDocumentId, f.faviconA1);
  assert.equal(row.createdBy, f.createdBy);
  assert.equal(row.approvedBy, f.approvedBy);
  assert.deepEqual(row.tokens, {primary:"#06B6D4",security:{danger:"#DC2626"}});
  assert.deepEqual(row.typography, {heading:"Poppins",primary:"Inter"});
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.tokens), true);
  assert.equal(Object.isFrozen(row.tokens.security), true);
  assert.equal(Object.isFrozen(row.typography), true);
});

test("BRANDCFG-PG-002 sibling Industry scope hides BrandConfiguration", async () => {
  assert.equal(await store.loadForContext({
    requestContext: contextA(),
    brandConfigurationId: f.brandIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    brandConfigurationId: f.brandIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.status, "PUBLISHED");
  assert.equal(sibling.accessibilityValidationStatus, "PENDING");
  assert.deepEqual(sibling.tokens, {warning:"#000000"});
});

test("BRANDCFG-PG-003 Tenant configuration is same-Tenant visible and raw non-ACTIVE evidence stays raw", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    brandConfigurationId: f.brandTenantA,
  });
  const fromCore = await store.loadForContext({
    requestContext: tenantCoreA(),
    brandConfigurationId: f.brandTenantA,
  });
  assert.ok(fromIndustry);
  assert.ok(fromCore);
  assert.equal(fromIndustry.code, "");
  assert.equal(fromIndustry.status, "DRAFT");
  assert.equal(fromIndustry.accessibilityValidationStatus, "FAIL");
  assert.equal(fromIndustry.logoDocumentId, undefined);
  assert.equal(fromIndustry.faviconDocumentId, undefined);
  assert.equal(fromIndustry.approvedBy, undefined);
  assert.deepEqual(fromIndustry.tokens, {danger:"#FFFFFF",raw:{empty:"",nullable:null}});
  assert.deepEqual(fromIndustry.typography, {fallbacks:["Inter",null,"Inter"],font:""});
  assert.equal(fromCore.id, f.brandTenantA);
});

test("BRANDCFG-PG-004 PLATFORM BrandConfiguration is not Tenant fallback and requires PLATFORM_GLOBAL", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    brandConfigurationId: f.brandPlatform,
  }), null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    brandConfigurationId: f.brandPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.ownerScope, "PLATFORM");
  assert.equal(platform.status, "ACTIVE");
  assert.equal(platform.accessibilityValidationStatus, "PASS");
  assert.deepEqual(platform.tokens, {danger:"#DC2626",product:"SBGlobal Plus"});
  assert.equal("resolved" in platform, false);
  assert.equal("effective" in platform, false);
});

test("BRANDCFG-PG-005 foreign Tenant row is hidden and ACTIVE/PASS does not imply resolved brand authority", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    brandConfigurationId: f.brandTenantB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    brandConfigurationId: f.brandTenantB,
  });
  assert.ok(own);
  assert.equal(own.status, "ACTIVE");
  assert.equal(own.accessibilityValidationStatus, "PASS");
  assert.equal("current" in own, false);
  assert.equal("resolved" in own, false);
  assert.equal("protectedTokensApplied" in own, false);
});

test("BRANDCFG-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    brandConfigurationId: f.missingBrand,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    brandConfigurationId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {...tenantCoreA(), dataHomeId: randomUUID()},
    brandConfigurationId: f.brandTenantA,
  }));
});

test("BRANDCFG-PG-007 raw brand evidence adds no hierarchy/token/render/document authority and write floors stay schema-owned", async () => {
  const privileges = await scoped.withContext(tenantCoreA(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_config.brand_configuration','SELECT') AS can_select,
            has_table_privilege(current_user,'core_config.brand_configuration','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_config.brand_configuration','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_config.brand_configuration','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  const deniedPlatformUpdate = await scoped.withContext(platformContext(), (tx) => tx.query(
    "UPDATE core_config.brand_configuration SET code='MUTATED' WHERE id=$1::uuid",
    [f.brandPlatform],
  ));
  assert.equal(deniedPlatformUpdate.rowCount, 0);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.selectCurrent, "undefined");
  assert.equal(typeof store.resolveHierarchy, "undefined");
  assert.equal(typeof store.enforceProtectedTokens, "undefined");
  assert.equal(typeof store.validateAccessibility, "undefined");
  assert.equal(typeof store.renderTheme, "undefined");
  assert.equal(typeof store.loadLogoDocument, "undefined");
  assert.equal(typeof store.loadFaviconDocument, "undefined");
});
