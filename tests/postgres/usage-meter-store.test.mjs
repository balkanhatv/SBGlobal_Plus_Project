import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresUsageMeterStore } from "../../dist/server/commercial/postgres-usage-meter-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_usage_meter_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");

const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","platformService",
  "industryA1","industryA2","industryB1",
  "meterTenantCore","meterIndustryA1","meterRaw","meterTenantB","missingMeter",
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
    regionCode: "IN-USAGE-METER",
    principalId: f.principalA,
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_CORE",
  });
}

function industryA(industryContextId = f.industryA1) {
  return Object.freeze({
    ...tenantCoreA(),
    industryContextId,
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
       VALUES ($1::uuid,$1::uuid::text,'IN-USAGE-METER','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Usage meter tenant A"],
      [f.tenantB, "EDU", "Usage meter tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-USAGE-METER',now(),now())`,
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
      `INSERT INTO core_commercial.usage_meter
        (id,tenant_id,industry_context_id,meter_code,period_key,
         used_value,reserved_value,version,updated_at)
       VALUES
        ($1,$5,NULL,$9,$10,
          '12345678901234567890.12345678901234567890'::numeric,
          '0.00000000000000000001'::numeric,
          '9223372036854775807'::bigint,now()-interval '1 day'),
        ($2,$5,$7,$11,$12,
          '42.50000000000000000000'::numeric,
          '0'::numeric,3,now()-interval '2 hours'),
        ($3,$5,NULL,'','',
          '0'::numeric,'7.25000000000000000000'::numeric,
          '-7'::bigint,now()-interval '3 hours'),
        ($4,$6,NULL,$13,$14,
          '9'::numeric,'0'::numeric,1,now()-interval '4 hours')`,
      [
        f.meterTenantCore,
        f.meterIndustryA1,
        f.meterRaw,
        f.meterTenantB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        "TENANT_TOTAL_" + suffix,
        "2026-09",
        "INDUSTRY_TOTAL_" + suffix,
        "2026-W39",
        "TENANT_B_" + suffix,
        "2026-09",
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
    {dataHomeId: f.home, regionCode: "IN-USAGE-METER"},
  );
  store = new PostgresUsageMeterStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_commercial.usage_meter WHERE id=ANY($1::uuid[])",
      [[f.meterTenantCore,f.meterIndustryA1,f.meterRaw,f.meterTenantB]],
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

test("USAGEMETER-PG-001 exact Tenant-Core meter preserves lossless immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: tenantCoreA(),
    usageMeterId: f.meterTenantCore,
  });

  assert.ok(row);
  assert.equal(row.id, f.meterTenantCore);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, undefined);
  assert.match(row.meterCode, /^TENANT_TOTAL_/);
  assert.equal(row.periodKey, "2026-09");
  assert.equal(row.usedValue, "12345678901234567890.12345678901234567890");
  assert.equal(row.reservedValue, "0.00000000000000000001");
  assert.equal(row.version, "9223372036854775807");
  assert.equal(Object.isFrozen(row), true);
});

test("USAGEMETER-PG-002 Tenant-Core meter remains visible from same-Tenant Industry application context", async () => {
  const core = await store.loadForContext({
    requestContext: tenantCoreA(),
    usageMeterId: f.meterTenantCore,
  });
  const industry = await store.loadForContext({
    requestContext: industryA(),
    usageMeterId: f.meterTenantCore,
  });

  assert.ok(core);
  assert.ok(industry);
  assert.equal(industry.id, core.id);
  assert.equal(industry.industryContextId, undefined);
  assert.equal(industry.usedValue, core.usedValue);
});

test("USAGEMETER-PG-003 Industry meter requires exact Industry Context", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    usageMeterId: f.meterIndustryA1,
  }), null);

  const exact = await store.loadForContext({
    requestContext: industryA(f.industryA1),
    usageMeterId: f.meterIndustryA1,
  });
  assert.ok(exact);
  assert.equal(exact.industryContextId, f.industryA1);
  assert.equal(exact.usedValue, "42.50000000000000000000");

  assert.equal(await store.loadForContext({
    requestContext: industryA(f.industryA2),
    usageMeterId: f.meterIndustryA1,
  }), null);
});

test("USAGEMETER-PG-004 foreign Tenant and PLATFORM_GLOBAL cannot bypass UsageMeter RLS", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    usageMeterId: f.meterTenantB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    usageMeterId: f.meterTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);

  await assert.rejects(store.loadForContext({
    requestContext: platformContext(),
    usageMeterId: f.meterTenantCore,
  }));
});

test("USAGEMETER-PG-005 raw empty text, exact decimals, and non-positive version remain non-semantic evidence", async () => {
  const row = await store.loadForContext({
    requestContext: tenantCoreA(),
    usageMeterId: f.meterRaw,
  });

  assert.ok(row);
  assert.equal(row.meterCode, "");
  assert.equal(row.periodKey, "");
  assert.equal(row.usedValue, "0");
  assert.equal(row.reservedValue, "7.25000000000000000000");
  assert.equal(row.version, "-7");
  assert.equal("entitlementCode" in row, false);
  assert.equal("current" in row, false);
  assert.equal("authoritativePeriod" in row, false);
  assert.equal("availableCapacity" in row, false);
  assert.equal("usageImpact" in row, false);
});

test("USAGEMETER-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    usageMeterId: f.missingMeter,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    usageMeterId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {...tenantCoreA(), dataHomeId: randomUUID()},
    usageMeterId: f.meterTenantCore,
  }));
});

test("USAGEMETER-PG-007 application/compiler roles are read-only and port adds no selector/mutation authority", async () => {
  const privileges = await scoped.withContext(tenantCoreA(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_commercial.usage_meter','SELECT') AS app_select,
            has_table_privilege(current_user,'core_commercial.usage_meter','INSERT') AS app_insert,
            has_table_privilege(current_user,'core_commercial.usage_meter','UPDATE') AS app_update,
            has_table_privilege(current_user,'core_commercial.usage_meter','DELETE') AS app_delete,
            has_table_privilege('sbg_commercial_transition_compiler_rw','core_commercial.usage_meter','SELECT') AS compiler_select,
            has_table_privilege('sbg_commercial_transition_compiler_rw','core_commercial.usage_meter','INSERT') AS compiler_insert,
            has_table_privilege('sbg_commercial_transition_compiler_rw','core_commercial.usage_meter','UPDATE') AS compiler_update,
            has_table_privilege('sbg_commercial_transition_compiler_rw','core_commercial.usage_meter','DELETE') AS compiler_delete`,
  ));

  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].app_select, true);
  assert.equal(privileges.rows[0].app_insert, false);
  assert.equal(privileges.rows[0].app_update, false);
  assert.equal(privileges.rows[0].app_delete, false);
  assert.equal(privileges.rows[0].compiler_select, true);
  assert.equal(privileges.rows[0].compiler_insert, false);
  assert.equal(privileges.rows[0].compiler_update, false);
  assert.equal(privileges.rows[0].compiler_delete, false);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.selectCurrent, "undefined");
  assert.equal(typeof store.selectPeriod, "undefined");
  assert.equal(typeof store.aggregate, "undefined");
  assert.equal(typeof store.reserve, "undefined");
  assert.equal(typeof store.release, "undefined");
  assert.equal(typeof store.resolveEntitlement, "undefined");
  assert.equal(typeof store.evaluateImpact, "undefined");
});
