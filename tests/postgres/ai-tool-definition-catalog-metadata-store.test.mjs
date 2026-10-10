import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import {
  PostgresAIToolDefinitionCatalogMetadataStore,
} from "../../dist/server/ai/postgres-ai-tool-definition-catalog-metadata-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin = new pg.Pool({connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1});
const role = "sbg_ai_tool_definition_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const capabilityId = randomUUID();
const toolDefinitionId = randomUUID();
const emptyEvidenceToolDefinitionId = randomUUID();
const missingToolDefinitionId = randomUUID();
const approvalPolicyId = randomUUID();
const capabilityCode = "AI_TOOL_CAP_DD110_" + randomBytes(8).toString("hex");
const toolId = "AI_TOOL_DD110_" + randomBytes(8).toString("hex");
const emptyEvidenceToolId = "AI_TOOL_DD110_EMPTY_" + randomBytes(8).toString("hex");
const createdAt = "2026-09-22T10:00:00.000Z";
const updatedAt = "2026-09-22T11:00:00.000Z";

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
       VALUES ($1::uuid,$2,'TOOL',NULL,'',1,'ACTIVE')`,
      [capabilityId, capabilityCode],
    );
    await client.query(
      `INSERT INTO core_ai.ai_tool_definition
        (id,tool_id,capability_code,operation_contract_id,scope_class,required_permission,
         required_entitlement,input_schema_version,output_schema_version,side_effect_class,
         approval_policy_id,idempotency_required,audit_class,status,version,created_at,updated_at)
       VALUES ($1::uuid,$2,$3,'core.resource.update','TENANT_INDUSTRY','resource.update',
         'ai.tool.use',2,3,'CONTROLLED',$4::uuid,true,'AI_TOOL','ACTIVE',4,$5::timestamptz,$6::timestamptz)`,
      [toolDefinitionId, toolId, capabilityCode, approvalPolicyId, createdAt, updatedAt],
    );
    await client.query(
      `INSERT INTO core_ai.ai_tool_definition
        (id,tool_id,capability_code,operation_contract_id,scope_class,required_permission,
         required_entitlement,input_schema_version,output_schema_version,side_effect_class,
         approval_policy_id,idempotency_required,audit_class,status,version,created_at,updated_at)
       VALUES ($1::uuid,$2,$3,'','PLATFORM_GLOBAL','','',1,1,'NONE',NULL,false,'','',1,$4::timestamptz,$4::timestamptz)`,
      [emptyEvidenceToolDefinitionId, emptyEvidenceToolId, capabilityCode, createdAt],
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
  store = new PostgresAIToolDefinitionCatalogMetadataStore(database);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_tool_definition WHERE id=ANY($1::uuid[])",
      [[toolDefinitionId, emptyEvidenceToolDefinitionId]],
    );
    await client.query("DELETE FROM core_ai.ai_capability WHERE id=$1::uuid", [capabilityId]);
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

test("AITOOLDEF-PG-001 exact tool-definition metadata read preserves immutable catalog evidence", async () => {
  const row = await store.loadById(toolDefinitionId);
  assert.ok(row);
  assert.equal(row.id, toolDefinitionId);
  assert.equal(row.toolId, toolId);
  assert.equal(row.capabilityCode, capabilityCode);
  assert.equal(row.operationContractId, "core.resource.update");
  assert.equal(row.scopeClass, "TENANT_INDUSTRY");
  assert.equal(row.requiredPermission, "resource.update");
  assert.equal(row.requiredEntitlement, "ai.tool.use");
  assert.equal(row.inputSchemaVersion, 2);
  assert.equal(row.outputSchemaVersion, 3);
  assert.equal(row.sideEffectClass, "CONTROLLED");
  assert.equal(row.approvalPolicyId, approvalPolicyId);
  assert.equal(row.idempotencyRequired, true);
  assert.equal(row.auditClass, "AI_TOOL");
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.version, 4);
  assert.equal(row.createdAt, createdAt);
  assert.equal(row.updatedAt, updatedAt);
  assert.equal(Object.isFrozen(row), true);
});

test("AITOOLDEF-PG-002 absent tool definition returns null and malformed id fails closed", async () => {
  assert.equal(await store.loadById(missingToolDefinitionId), null);
  await assert.rejects(store.loadById("not-a-uuid"));
});

test("AITOOLDEF-PG-003 nullable and schema-valid empty/raw catalog evidence is not strengthened", async () => {
  const row = await store.loadById(emptyEvidenceToolDefinitionId);
  assert.ok(row);
  assert.equal(row.operationContractId, "");
  assert.equal(row.scopeClass, "PLATFORM_GLOBAL");
  assert.equal(row.requiredPermission, "");
  assert.equal(row.requiredEntitlement, "");
  assert.equal(row.sideEffectClass, "NONE");
  assert.equal(row.approvalPolicyId, null);
  assert.equal(row.idempotencyRequired, false);
  assert.equal(row.auditClass, "");
  assert.equal(row.status, "");
  assert.equal(row.inputSchemaVersion, 1);
  assert.equal(row.outputSchemaVersion, 1);
  assert.equal(row.version, 1);
});

test("AITOOLDEF-PG-004 catalog facts do not become tool eligibility authorization approval or execution authority", async () => {
  const row = await store.loadById(toolDefinitionId);
  assert.ok(row);
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.requiredPermission, "resource.update");
  assert.equal(row.requiredEntitlement, "ai.tool.use");
  assert.equal(row.sideEffectClass, "CONTROLLED");
  assert.equal(row.idempotencyRequired, true);
  assert.equal("eligible" in row, false);
  assert.equal("authorized" in row, false);
  assert.equal("permissionGranted" in row, false);
  assert.equal("entitlementGranted" in row, false);
  assert.equal("approvalSatisfied" in row, false);
  assert.equal("executable" in row, false);
  assert.equal(typeof store.evaluatePermission, "undefined");
  assert.equal(typeof store.evaluateEntitlement, "undefined");
  assert.equal(typeof store.approve, "undefined");
  assert.equal(typeof store.execute, "undefined");
  assert.equal(typeof store.invoke, "undefined");
  assert.equal(typeof store.reserveIdempotency, "undefined");
  assert.equal(typeof store.appendAudit, "undefined");
});

test("AITOOLDEF-PG-005 dedicated AI role has read-only tool-definition catalog authority", async () => {
  const privileges = await database.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_tool_definition','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_tool_definition','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_tool_definition','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_tool_definition','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, false);
  assert.equal(privileges.rows[0].can_update, false);
  assert.equal(privileges.rows[0].can_delete, false);
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
});
