import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresTenantCountryPackActivationStore } from "../../dist/server/config/postgres-tenant-country-pack-activation-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_tenant_country_pack_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");

const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "principalA",
  "principalB",
  "platformService",
  "industryA1",
  "industryB1",
  "packA1",
  "packA2",
  "packA3",
  "packB1",
  "activationA1",
  "activationA2",
  "activationA3",
  "activationB1",
  "missingActivation",
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
    regionCode: "IN-TENANT-PACK",
    principalId: f.principalA,
    principalType: "HUMAN",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-TENANT-PACK','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Tenant CountryPack A"],
      [f.tenantB, "EDU", "Tenant CountryPack B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-TENANT-PACK',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
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

    for (const [id, countryCode, code, status] of [
      [f.packA1, "IN", "TENANT_PACK_A1_" + suffix, "ACTIVE"],
      [f.packA2, "US", "TENANT_PACK_A2_" + suffix, "DRAFT"],
      [f.packA3, "GB", "TENANT_PACK_A3_" + suffix, "RETIRED"],
      [f.packB1, "CA", "TENANT_PACK_B1_" + suffix, "ACTIVE"],
    ]) {
      await client.query(
        `INSERT INTO core_config.country_pack
          (id,country_code,code,version,status,locale_codes,metadata_json,created_at)
         VALUES ($1,$2,$3,1,$4,ARRAY[]::text[],'{}'::jsonb,now())`,
        [id, countryCode, code, status],
      );
    }

    await client.query(
      `INSERT INTO core_config.tenant_country_pack_activation
        (id,tenant_id,country_pack_id,status,config_override_json,activated_at,disabled_at,row_version)
       VALUES
        ($1,$5,$7,'ACTIVE',
          '{"currency":"INR","nested":{"date":"dd-MM-yyyy"}}'::jsonb,
          now()-interval '10 days',NULL,'9223372036854775807'::bigint),
        ($2,$5,$8,'PENDING',
          '{"raw":{"empty":"","nullable":null}}'::jsonb,
          now()+interval '10 days',now()-interval '10 days',-7),
        ($3,$5,$9,'DISABLED',
          '{"disabled":true}'::jsonb,
          NULL,NULL,0),
        ($4,$6,$10,'ACTIVE',
          '{"currency":"CAD"}'::jsonb,
          now()-interval '5 days',NULL,3)`,
      [
        f.activationA1,
        f.activationA2,
        f.activationA3,
        f.activationB1,
        f.tenantA,
        f.tenantB,
        f.packA1,
        f.packA2,
        f.packA3,
        f.packB1,
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
    {dataHomeId: f.home, regionCode: "IN-TENANT-PACK"},
  );
  store = new PostgresTenantCountryPackActivationStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_config.tenant_country_pack_activation WHERE id=ANY($1::uuid[])",
      [[f.activationA1, f.activationA2, f.activationA3, f.activationB1]],
    );
    await client.query(
      "DELETE FROM core_config.country_pack WHERE id=ANY($1::uuid[])",
      [[f.packA1, f.packA2, f.packA3, f.packB1]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1, f.industryB1]],
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

test("TENANTPACK-PG-001 exact activation preserves immutable raw evidence and exact bigint row version", async () => {
  const row = await store.loadForContext({
    requestContext: tenantCoreA(),
    activationId: f.activationA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.activationA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.countryPackId, f.packA1);
  assert.equal(row.status, "ACTIVE");
  assert.deepEqual(row.configOverride, {
    currency: "INR",
    nested: {date: "dd-MM-yyyy"},
  });
  assert.equal(row.disabledAt, undefined);
  assert.equal(row.rowVersion, "9223372036854775807");
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.configOverride), true);
  assert.equal(Object.isFrozen(row.configOverride.nested), true);
});

test("TENANTPACK-PG-002 same Tenant Core and Industry contexts see the same Tenant activation", async () => {
  const core = await store.loadForContext({
    requestContext: tenantCoreA(),
    activationId: f.activationA1,
  });
  const industry = await store.loadForContext({
    requestContext: industryA(),
    activationId: f.activationA1,
  });

  assert.ok(core);
  assert.ok(industry);
  assert.equal(industry.id, core.id);
  assert.equal(industry.tenantId, f.tenantA);
});

test("TENANTPACK-PG-003 foreign Tenant activation is hidden while owner can read it", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    activationId: f.activationB1,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    activationId: f.activationB1,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.countryPackId, f.packB1);
});

test("TENANTPACK-PG-004 PLATFORM_GLOBAL context does not bypass Tenant RLS", async () => {
  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    activationId: f.activationA1,
  }), null);
});

test("TENANTPACK-PG-005 lifecycle, unordered timestamps, raw overrides, and non-positive row versions remain raw", async () => {
  const pending = await store.loadForContext({
    requestContext: tenantCoreA(),
    activationId: f.activationA2,
  });
  const disabled = await store.loadForContext({
    requestContext: tenantCoreA(),
    activationId: f.activationA3,
  });

  assert.ok(pending);
  assert.ok(disabled);
  assert.equal(pending.status, "PENDING");
  assert.deepEqual(pending.configOverride, {raw:{empty:"",nullable:null}});
  assert.ok(Date.parse(pending.disabledAt) < Date.parse(pending.activatedAt));
  assert.equal(pending.rowVersion, "-7");
  assert.equal(disabled.status, "DISABLED");
  assert.equal(disabled.activatedAt, undefined);
  assert.equal(disabled.disabledAt, undefined);
  assert.equal(disabled.rowVersion, "0");
  assert.equal("current" in pending, false);
  assert.equal("effective" in pending, false);
  assert.equal("applied" in pending, false);
  assert.equal("materialized" in pending, false);
});

test("TENANTPACK-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    activationId: f.missingActivation,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    activationId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {...tenantCoreA(), dataHomeId: randomUUID()},
    activationId: f.activationA1,
  }));
});

test("TENANTPACK-PG-007 database DML and immutable Tenant ownership remain schema-owned while port adds no activation/materialization authority", async () => {
  const privileges = await scoped.withContext(tenantCoreA(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_config.tenant_country_pack_activation','SELECT') AS can_select,
            has_table_privilege(current_user,'core_config.tenant_country_pack_activation','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_config.tenant_country_pack_activation','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_config.tenant_country_pack_activation','DELETE') AS can_delete`,
  ));

  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  await assert.rejects(scoped.withContext(tenantCoreA(), (tx) => tx.query(
    "UPDATE core_config.tenant_country_pack_activation SET tenant_id=$1::uuid WHERE id=$2::uuid",
    [f.tenantB, f.activationA1],
  )));

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.selectCurrent, "undefined");
  assert.equal(typeof store.activate, "undefined");
  assert.equal(typeof store.deactivate, "undefined");
  assert.equal(typeof store.mergeOverrides, "undefined");
  assert.equal(typeof store.materialize, "undefined");
  assert.equal(typeof store.applyDefaults, "undefined");
  assert.equal(typeof store.revalidateAIEligibility, "undefined");
});
