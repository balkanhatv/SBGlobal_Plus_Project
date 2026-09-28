import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import {
  PostgresAIProviderCatalogMetadataStore,
} from "../../dist/server/ai/postgres-ai-provider-catalog-metadata-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin = new pg.Pool({connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1});
const role = "sbg_ai_provider_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const providerId = randomUUID();
const missingProviderId = randomUUID();
const code = "AI_PROVIDER_" + randomBytes(8).toString("hex");
const secretSentinel = "secret://dd107-must-not-leak/" + randomBytes(8).toString("hex");
const createdAt = "2026-09-21T01:02:03.000Z";
const updatedAt = "2026-09-21T04:05:06.000Z";

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
    await client.query("GRANT sbg_ai_gateway_rw TO " + role);
    await client.query(
      `INSERT INTO core_ai.ai_provider
        (id,code,status,adapter_type,supported_regions,supported_capabilities,
         security_class,residency_metadata,credential_ref,health_state,version,
         created_at,updated_at)
       VALUES ($1::uuid,$2,'ACTIVE','REST',ARRAY['IN','']::text[],
         ARRAY['CHAT',NULL,'']::text[],'REGULATED',
         '{"regions":["IN"],"nested":{"priority":1}}'::jsonb,$3,'',2,
         $4::timestamptz,$5::timestamptz)`,
      [providerId, code, secretSentinel, createdAt, updatedAt],
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
  pool = new pg.Pool({connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000});
  database = new PostgresAIGatewayDatabase(pool);
  store = new PostgresAIProviderCatalogMetadataStore(database);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM core_ai.ai_provider WHERE id=$1::uuid", [providerId]);
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

test("AIPROV-PG-001 exact provider metadata read preserves catalog evidence without credential reference", async () => {
  const row = await store.loadById(providerId);
  assert.ok(row);
  assert.equal(row.id, providerId);
  assert.equal(row.code, code);
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.adapterType, "REST");
  assert.deepEqual(row.supportedRegions, ["IN", ""]);
  assert.deepEqual(row.supportedCapabilities, ["CHAT", null, ""]);
  assert.equal(row.securityClass, "REGULATED");
  assert.deepEqual(row.residencyMetadata, {nested: {priority: 1}, regions: ["IN"]});
  assert.equal(row.healthState, "");
  assert.equal(row.version, 2);
  assert.equal(row.createdAt, createdAt);
  assert.equal(row.updatedAt, updatedAt);
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.supportedRegions), true);
  assert.equal(Object.isFrozen(row.supportedCapabilities), true);
  assert.equal(Object.isFrozen(row.residencyMetadata), true);
  assert.equal(Object.isFrozen(row.residencyMetadata.nested), true);
  assert.equal("credentialRef" in row, false);
  assert.equal("credential_ref" in row, false);
  assert.equal(JSON.stringify(row).includes(secretSentinel), false);
});

test("AIPROV-PG-002 absent provider returns null and malformed id fails closed", async () => {
  assert.equal(await store.loadById(missingProviderId), null);
  await assert.rejects(store.loadById("not-a-uuid"));
});

test("AIPROV-PG-003 schema-allowed empty text and nullable array evidence is not strengthened", async () => {
  const row = await store.loadById(providerId);
  assert.ok(row);
  assert.equal(row.healthState, "");
  assert.equal(row.supportedRegions[1], "");
  assert.equal(row.supportedCapabilities[1], null);
  assert.equal(row.supportedCapabilities[2], "");
});

test("AIPROV-PG-004 raw status and health evidence does not become routing or execution authority", async () => {
  const row = await store.loadById(providerId);
  assert.ok(row);
  assert.equal(row.status, "ACTIVE");
  assert.equal("selected" in row, false);
  assert.equal("eligible" in row, false);
  assert.equal("route" in row, false);
  assert.equal("fallback" in row, false);
  assert.equal("credential" in row, false);
  assert.equal(typeof store.generate, "undefined");
  assert.equal(typeof store.selectProvider, "undefined");
});

test("AIPROV-PG-005 dedicated AI role can read catalog but has no catalog mutation authority", async () => {
  const privileges = await database.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_provider','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_provider','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_provider','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_provider','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, false);
  assert.equal(privileges.rows[0].can_update, false);
  assert.equal(privileges.rows[0].can_delete, false);

  await assert.rejects(database.transaction((tx) => tx.query(
    "UPDATE core_ai.ai_provider SET health_state=health_state WHERE id=$1::uuid",
    [providerId],
  )));
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
});
