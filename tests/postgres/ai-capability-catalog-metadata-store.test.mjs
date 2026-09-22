import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import {
  PostgresAICapabilityCatalogMetadataStore,
} from "../../dist/server/ai/postgres-ai-capability-catalog-metadata-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin = new pg.Pool({connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1});
const role = "sbg_ai_capability_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const capabilityId = randomUUID();
const emptyEvidenceCapabilityId = randomUUID();
const missingCapabilityId = randomUUID();
const capabilityCode = "AI_CAP_DD109_" + randomBytes(8).toString("hex");
const emptyEvidenceCode = "AI_CAP_DD109_EMPTY_" + randomBytes(8).toString("hex");

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
      `INSERT INTO core_ai.ai_capability
        (id,code,category,required_entitlement,default_policy_class,schema_version,status)
       VALUES ($1::uuid,$2,'API',NULL,'',2,'ACTIVE')`,
      [capabilityId, capabilityCode],
    );
    await client.query(
      `INSERT INTO core_ai.ai_capability
        (id,code,category,required_entitlement,default_policy_class,schema_version,status)
       VALUES ($1::uuid,$2,'TOOL','','',1,'')`,
      [emptyEvidenceCapabilityId, emptyEvidenceCode],
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
  store = new PostgresAICapabilityCatalogMetadataStore(database);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_capability WHERE id=ANY($1::uuid[])",
      [[capabilityId, emptyEvidenceCapabilityId]],
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

test("AICAP-PG-001 exact capability metadata read preserves immutable catalog evidence", async () => {
  const row = await store.loadById(capabilityId);
  assert.ok(row);
  assert.equal(row.id, capabilityId);
  assert.equal(row.code, capabilityCode);
  assert.equal(row.category, "API");
  assert.equal(row.requiredEntitlement, null);
  assert.equal(row.defaultPolicyClass, "");
  assert.equal(row.schemaVersion, 2);
  assert.equal(row.status, "ACTIVE");
  assert.equal(Object.isFrozen(row), true);
});

test("AICAP-PG-002 absent capability returns null and malformed id fails closed", async () => {
  assert.equal(await store.loadById(missingCapabilityId), null);
  await assert.rejects(store.loadById("not-a-uuid"));
});

test("AICAP-PG-003 nullable and empty schema-valid text evidence is not strengthened", async () => {
  const nullableRow = await store.loadById(capabilityId);
  assert.ok(nullableRow);
  assert.equal(nullableRow.requiredEntitlement, null);
  assert.equal(nullableRow.defaultPolicyClass, "");

  const emptyRow = await store.loadById(emptyEvidenceCapabilityId);
  assert.ok(emptyRow);
  assert.equal(emptyRow.category, "TOOL");
  assert.equal(emptyRow.requiredEntitlement, "");
  assert.equal(emptyRow.defaultPolicyClass, "");
  assert.equal(emptyRow.status, "");
});

test("AICAP-PG-004 catalog evidence does not become eligibility policy routing or execution authority", async () => {
  const row = await store.loadById(capabilityId);
  assert.ok(row);
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.category, "API");
  assert.equal("eligible" in row, false);
  assert.equal("entitled" in row, false);
  assert.equal("allowed" in row, false);
  assert.equal("selected" in row, false);
  assert.equal("route" in row, false);
  assert.equal("policyDecision" in row, false);
  assert.equal(typeof store.evaluateEntitlement, "undefined");
  assert.equal(typeof store.evaluatePolicy, "undefined");
  assert.equal(typeof store.execute, "undefined");
  assert.equal(typeof store.generate, "undefined");
});

test("AICAP-PG-005 dedicated AI role has read-only capability catalog authority", async () => {
  const privileges = await database.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_capability','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_capability','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_capability','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_capability','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, false);
  assert.equal(privileges.rows[0].can_update, false);
  assert.equal(privileges.rows[0].can_delete, false);

  await assert.rejects(database.transaction((tx) => tx.query(
    "UPDATE core_ai.ai_capability SET status=status WHERE id=$1::uuid",
    [capabilityId],
  )));
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
});
