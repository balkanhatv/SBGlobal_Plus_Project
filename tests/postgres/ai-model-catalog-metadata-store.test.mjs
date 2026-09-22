import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import {
  PostgresAIModelCatalogMetadataStore,
} from "../../dist/server/ai/postgres-ai-model-catalog-metadata-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin = new pg.Pool({connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1});
const role = "sbg_ai_model_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const providerId = randomUUID();
const modelId = randomUUID();
const missingModelId = randomUUID();
const providerCode = "AI_PROVIDER_DD108_" + randomBytes(8).toString("hex");
const modelCode = "AI_MODEL_DD108_" + randomBytes(8).toString("hex");

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
       VALUES ($1::uuid,$2,'ACTIVE','REST',ARRAY['IN']::text[],ARRAY['CHAT']::text[],
         'REGULATED','{}'::jsonb,'secret://dd108-provider','HEALTHY',1,now(),now())`,
      [providerId, providerCode],
    );
    await client.query(
      `INSERT INTO core_ai.ai_model
        (id,provider_id,model_code,display_name,capabilities,context_window_class,
         input_modalities,output_modalities,residency_regions,sensitivity_ceiling,
         cost_class,latency_class,status,version,metadata_json)
       VALUES ($1::uuid,$2::uuid,$3,'',ARRAY['CHAT',NULL,'']::text[],'',
         ARRAY['TEXT',NULL,'']::text[],ARRAY['TEXT','']::text[],ARRAY['IN','']::text[],
         'REGULATED','','','ACTIVE',2,
         '{"classes":["balanced"],"nested":{"priority":1}}'::jsonb)`,
      [modelId, providerId, modelCode],
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
  store = new PostgresAIModelCatalogMetadataStore(database);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM core_ai.ai_model WHERE id=$1::uuid", [modelId]);
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

test("AIMODEL-PG-001 exact model metadata read preserves immutable catalog evidence", async () => {
  const row = await store.loadById(modelId);
  assert.ok(row);
  assert.equal(row.id, modelId);
  assert.equal(row.providerId, providerId);
  assert.equal(row.modelCode, modelCode);
  assert.equal(row.displayName, "");
  assert.deepEqual(row.capabilities, ["CHAT", null, ""]);
  assert.equal(row.contextWindowClass, "");
  assert.deepEqual(row.inputModalities, ["TEXT", null, ""]);
  assert.deepEqual(row.outputModalities, ["TEXT", ""]);
  assert.deepEqual(row.residencyRegions, ["IN", ""]);
  assert.equal(row.sensitivityCeiling, "REGULATED");
  assert.equal(row.costClass, "");
  assert.equal(row.latencyClass, "");
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.version, 2);
  assert.deepEqual(row.metadata, {classes: ["balanced"], nested: {priority: 1}});
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.capabilities), true);
  assert.equal(Object.isFrozen(row.inputModalities), true);
  assert.equal(Object.isFrozen(row.outputModalities), true);
  assert.equal(Object.isFrozen(row.residencyRegions), true);
  assert.equal(Object.isFrozen(row.metadata), true);
  assert.equal(Object.isFrozen(row.metadata.nested), true);
});

test("AIMODEL-PG-002 absent model returns null and malformed id fails closed", async () => {
  assert.equal(await store.loadById(missingModelId), null);
  await assert.rejects(store.loadById("not-a-uuid"));
});

test("AIMODEL-PG-003 schema-valid empty text and nullable array evidence is not strengthened", async () => {
  const row = await store.loadById(modelId);
  assert.ok(row);
  assert.equal(row.displayName, "");
  assert.equal(row.contextWindowClass, "");
  assert.equal(row.costClass, "");
  assert.equal(row.latencyClass, "");
  assert.equal(row.capabilities[1], null);
  assert.equal(row.capabilities[2], "");
  assert.equal(row.inputModalities[1], null);
  assert.equal(row.residencyRegions[1], "");
});

test("AIMODEL-PG-004 raw catalog evidence does not become routing or execution authority", async () => {
  const row = await store.loadById(modelId);
  assert.ok(row);
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.sensitivityCeiling, "REGULATED");
  assert.equal("selected" in row, false);
  assert.equal("eligible" in row, false);
  assert.equal("route" in row, false);
  assert.equal("fallback" in row, false);
  assert.equal("preferred" in row, false);
  assert.equal("current" in row, false);
  assert.equal(typeof store.selectModel, "undefined");
  assert.equal(typeof store.generate, "undefined");
  assert.equal(typeof store.embed, "undefined");
});

test("AIMODEL-PG-005 provider relation is preserved and dedicated AI role has no model mutation authority", async () => {
  const row = await store.loadById(modelId);
  assert.ok(row);
  assert.equal(row.providerId, providerId);

  const privileges = await database.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_model','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_model','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_model','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_model','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, false);
  assert.equal(privileges.rows[0].can_update, false);
  assert.equal(privileges.rows[0].can_delete, false);

  await assert.rejects(database.transaction((tx) => tx.query(
    "UPDATE core_ai.ai_model SET status=status WHERE id=$1::uuid",
    [modelId],
  )));
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
});
