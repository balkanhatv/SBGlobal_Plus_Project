import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { PostgresCountryPackStore } from "../../dist/server/config/postgres-country-pack-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_country_pack_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "approvedBy",
  "activePack",
  "draftPack",
  "retiredPack",
  "missingPack",
].map((key) => [key, randomUUID()]));

let pool;
let database;
let store;

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
      `INSERT INTO core_config.country_pack
        (id,country_code,code,version,status,locale_codes,default_currency_code,
         default_timezone,default_date_format,address_schema_json,phone_schema_json,
         reference_bundle_ref,metadata_json,created_at,approved_by,effective_from)
       VALUES
        ($1,'IN','STANDARD',1,'ACTIVE',ARRAY['en-IN','hi-IN']::text[],'INR',
          'Asia/Kolkata','dd-MM-yyyy',
          '{"type":"object","required":["state"]}'::jsonb,
          '{"countryCallingCode":"+91"}'::jsonb,
          'REF-IN-001','{"default":true,"nested":{"rank":1}}'::jsonb,
          now()-interval '20 days',$4,now()-interval '10 days'),
        ($2,'US','',2,'DRAFT',ARRAY['en-US',NULL,'en-US']::text[],NULL,
          '','',NULL,'{"pattern":""}'::jsonb,'',
          '{"raw":{"empty":"","nullable":null}}'::jsonb,
          now()-interval '5 days',NULL,now()+interval '10 days'),
        ($3,'GB','LEGACY',7,'RETIRED',ARRAY[]::text[],'GBP',
          NULL,NULL,NULL,NULL,NULL,'{}'::jsonb,
          now()-interval '90 days',NULL,NULL)`,
      [f.activePack, f.draftPack, f.retiredPack, f.approvedBy],
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
  database = new PostgresDatabase(pool);
  store = new PostgresCountryPackStore(database);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_config.country_pack WHERE id=ANY($1::uuid[])",
      [[f.activePack, f.draftPack, f.retiredPack]],
    );
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

test("COUNTRYPACK-PG-001 exact CountryPack preserves complete immutable raw catalog evidence", async () => {
  const row = await store.loadById({countryPackId: f.activePack});

  assert.ok(row);
  assert.equal(row.id, f.activePack);
  assert.equal(row.countryCode, "IN");
  assert.equal(row.code, "STANDARD");
  assert.equal(row.version, 1);
  assert.equal(row.status, "ACTIVE");
  assert.deepEqual(row.localeCodes, ["en-IN", "hi-IN"]);
  assert.equal(row.defaultCurrencyCode, "INR");
  assert.equal(row.defaultTimezone, "Asia/Kolkata");
  assert.equal(row.defaultDateFormat, "dd-MM-yyyy");
  assert.deepEqual(row.addressSchema, {required:["state"],type:"object"});
  assert.deepEqual(row.phoneSchema, {countryCallingCode:"+91"});
  assert.equal(row.referenceBundleRef, "REF-IN-001");
  assert.deepEqual(row.metadata, {default:true,nested:{rank:1}});
  assert.equal(row.approvedBy, f.approvedBy);
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.localeCodes), true);
  assert.equal(Object.isFrozen(row.addressSchema), true);
  assert.equal(Object.isFrozen(row.metadata), true);
});

test("COUNTRYPACK-PG-002 catalog read is global and requires no Tenant or Industry RequestContext", async () => {
  const raw = await database.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            current_setting('app.tenant_id',true) AS tenant_id,
            current_setting('app.industry_context_id',true) AS industry_context_id,
            current_setting('app.scope_class',true) AS scope_class`,
  ));
  assert.equal(raw.rows[0].user_name, "sbg_app_rw");
  assert.equal(raw.rows[0].tenant_id, "");
  assert.equal(raw.rows[0].industry_context_id, "");
  assert.equal(raw.rows[0].scope_class, "");

  const row = await store.loadById({countryPackId: f.activePack});
  assert.ok(row);
  assert.equal("tenantId" in row, false);
  assert.equal("industryContextId" in row, false);
});

test("COUNTRYPACK-PG-003 DRAFT, RETIRED, and future-effective evidence stays raw and non-current", async () => {
  const draft = await store.loadById({countryPackId: f.draftPack});
  const retired = await store.loadById({countryPackId: f.retiredPack});

  assert.ok(draft);
  assert.ok(retired);
  assert.equal(draft.status, "DRAFT");
  assert.ok(Date.parse(draft.effectiveFrom) > Date.now());
  assert.equal(retired.status, "RETIRED");
  assert.equal(retired.effectiveFrom, undefined);
  assert.equal("current" in draft, false);
  assert.equal("effective" in draft, false);
  assert.equal("activated" in draft, false);
});

test("COUNTRYPACK-PG-004 raw locale/default/nullable JSON evidence is preserved without interpretation", async () => {
  const row = await store.loadById({countryPackId: f.draftPack});

  assert.ok(row);
  assert.equal(row.code, "");
  assert.deepEqual(row.localeCodes, ["en-US", null, "en-US"]);
  assert.equal(row.defaultCurrencyCode, undefined);
  assert.equal(row.defaultTimezone, "");
  assert.equal(row.defaultDateFormat, "");
  assert.equal(row.addressSchema, undefined);
  assert.deepEqual(row.phoneSchema, {pattern:""});
  assert.equal(row.referenceBundleRef, "");
  assert.deepEqual(row.metadata, {raw:{empty:"",nullable:null}});
});

test("COUNTRYPACK-PG-005 missing well-formed id returns null and malformed id fails before SQL", async () => {
  assert.equal(await store.loadById({countryPackId: f.missingPack}), null);
  await assert.rejects(store.loadById({countryPackId: "not-a-uuid"}));
});

test("COUNTRYPACK-PG-006 ordinary application role is SELECT-only on CountryPack", async () => {
  const privileges = await database.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_config.country_pack','SELECT') AS can_select,
            has_table_privilege(current_user,'core_config.country_pack','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_config.country_pack','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_config.country_pack','DELETE') AS can_delete`,
  ));

  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, false);
  assert.equal(privileges.rows[0].can_update, false);
  assert.equal(privileges.rows[0].can_delete, false);
});

test("COUNTRYPACK-PG-007 raw CountryPack evidence adds no selection/activation/materialization/authorization authority", async () => {
  assert.equal(typeof store.selectCurrent, "undefined");
  assert.equal(typeof store.activate, "undefined");
  assert.equal(typeof store.deactivate, "undefined");
  assert.equal(typeof store.mergeOverrides, "undefined");
  assert.equal(typeof store.materialize, "undefined");
  assert.equal(typeof store.grantPermission, "undefined");
  assert.equal(typeof store.grantEntitlement, "undefined");
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
});
