import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresWorkflowDatabase } from "../../dist/server/database/postgres-workflow-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresAutomationRunStore,
} from "../../dist/server/workflow/postgres-automation-run-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin = new pg.Pool({connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1});
const role = "sbg_automation_run_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB",
  "membershipA","membershipB","industryA1","industryA2","industryB1",
  "definitionIndustryA1","definitionIndustryA2","definitionTenantA","definitionTenantB",
  "runIndustryA1","runIndustryA2","runTenantA","runTenantB",
  "correlationA1","correlationA2","correlationTenantA","correlationTenantB",
].map((key) => [key, randomUUID()]));

const time = Object.freeze({
  industryA1Started: "2026-09-20T01:00:00.000Z",
  industryA2Started: "2026-09-20T02:00:00.000Z",
  industryA2Completed: "2026-09-20T03:00:00.000Z",
  tenantAStarted: "2026-09-20T04:00:00.000Z",
  tenantACompleted: "2026-09-20T05:00:00.000Z",
  tenantBStarted: "2026-09-20T06:00:00.000Z",
});

let pool;
let store;

function contextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(), correlationId: randomUUID(), tenantId: f.tenantA,
    industryContextId, dataHomeId: f.home, regionCode: "IN-AUTOMATION-RUN",
    principalId: f.principalA, principalType: "HUMAN", membershipId: f.membershipA,
    orgUnitPath: Object.freeze([]), roleIds: Object.freeze([]), scopeClass: "TENANT_INDUSTRY",
  });
}
function tenantCoreA() {
  return Object.freeze({...contextA(), industryContextId: undefined, scopeClass: "TENANT_CORE"});
}
function tenantCoreB() {
  return Object.freeze({
    ...tenantCoreA(), tenantId: f.tenantB, principalId: f.principalB,
    membershipId: f.membershipB,
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
    await client.query("GRANT sbg_workflow_worker_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,($1::uuid)::text,'IN-AUTOMATION-RUN','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "Automation run tenant A"],
      [f.tenantB, "EDU", "Automation run tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,($1::uuid)::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AUTOMATION-RUN',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Automation run principal A"],
      [f.principalB, "Automation run principal B"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,created_at,updated_at)
         VALUES ($1,'HUMAN','ACTIVE',$2,now(),now())`,
        [principalId, label],
      );
    }

    for (const [membershipId, tenantId, principalId] of [
      [f.membershipA, f.tenantA, f.principalA],
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

    for (const [id, ownerScope, tenantId, industryContextId, code, principalId] of [
      [f.definitionIndustryA1, "INDUSTRY", f.tenantA, f.industryA1, "AUTO_RUN_A1", f.principalA],
      [f.definitionIndustryA2, "INDUSTRY", f.tenantA, f.industryA2, "AUTO_RUN_A2", f.principalA],
      [f.definitionTenantA, "TENANT", f.tenantA, null, "AUTO_RUN_TENANT_A", f.principalA],
      [f.definitionTenantB, "TENANT", f.tenantB, null, "AUTO_RUN_TENANT_B", f.principalB],
    ]) {
      await client.query(
        `INSERT INTO core_workflow.automation_definition
          (id,owner_scope,tenant_id,industry_context_id,code,version,status,schema_version,
           trigger_type,trigger_config_json,condition_rule_ref,operation_contract_id,
           workflow_definition_id,config_json,created_by,approved_by,effective_from,effective_to,
           created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,1,'ACTIVE',1,'MANUAL','{}'::jsonb,NULL,
           'core.test.automation-run',NULL,'{}'::jsonb,$6,$6,NULL,NULL,now()-interval '3 days',now()-interval '2 days')`,
        [id, ownerScope, tenantId, industryContextId, code, principalId],
      );
    }

    for (const run of [
      [f.runIndustryA1, f.tenantA, f.industryA1, f.definitionIndustryA1, "event:order.created", "hash-a1", "RUNNING", time.industryA1Started, null, f.correlationA1, null],
      [f.runIndustryA2, f.tenantA, f.industryA2, f.definitionIndustryA2, "schedule:raw", "hash-a2", "FAILED", time.industryA2Started, time.industryA2Completed, f.correlationA2, ""],
      [f.runTenantA, f.tenantA, null, f.definitionTenantA, "", "", "SUCCEEDED", time.tenantAStarted, time.tenantACompleted, f.correlationTenantA, ""],
      [f.runTenantB, f.tenantB, null, f.definitionTenantB, "manual:tenant-b", "hash-b", "PENDING", time.tenantBStarted, null, f.correlationTenantB, null],
    ]) {
      await client.query(
        `INSERT INTO core_workflow.automation_run
          (id,tenant_id,industry_context_id,automation_definition_id,trigger_ref,
           idempotency_key_hash,status,started_at,completed_at,correlation_id,last_error_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::timestamptz,$9::timestamptz,$10,$11)`,
        run,
      );
    }

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
  store = new PostgresAutomationRunStore(new RequestScopedSql(
    new PostgresWorkflowDatabase(pool),
    {dataHomeId: f.home, regionCode: "IN-AUTOMATION-RUN"},
  ));
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_workflow.automation_run WHERE id=ANY($1::uuid[])",
      [[f.runIndustryA1, f.runIndustryA2, f.runTenantA, f.runTenantB]],
    );
    await client.query(
      "DELETE FROM core_workflow.automation_definition WHERE id=ANY($1::uuid[])",
      [[f.definitionIndustryA1, f.definitionIndustryA2, f.definitionTenantA, f.definitionTenantB]],
    );
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipA, f.membershipB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1, f.industryA2, f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.principalA, f.principalB]],
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

test("WFA-RUN-PG-001 exact Industry run preserves raw trigger/idempotency/status evidence", async () => {
  const row = await store.loadForContext({requestContext: contextA(), automationRunId: f.runIndustryA1});
  assert.ok(row);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.automationDefinitionId, f.definitionIndustryA1);
  assert.equal(row.triggerRef, "event:order.created");
  assert.equal(row.idempotencyKeyHash, "hash-a1");
  assert.equal(row.status, "RUNNING");
  assert.equal(row.startedAt, time.industryA1Started);
  assert.equal(row.completedAt, undefined);
  assert.equal(row.lastErrorCode, undefined);
  assert.equal(Object.isFrozen(row), true);
});

test("WFA-RUN-PG-002 RLS hides sibling Industry run and exact sibling context reads its own", async () => {
  assert.equal(await store.loadForContext({requestContext: contextA(), automationRunId: f.runIndustryA2}), null);
  const own = await store.loadForContext({requestContext: contextA(f.industryA2), automationRunId: f.runIndustryA2});
  assert.ok(own);
  assert.equal(own.industryContextId, f.industryA2);
  assert.equal(own.status, "FAILED");
  assert.equal(own.completedAt, time.industryA2Completed);
  assert.equal(own.lastErrorCode, "");
});

test("WFA-RUN-PG-003 Tenant-Core run is same-Tenant visible and preserves schema-allowed empty text", async () => {
  const fromIndustry = await store.loadForContext({requestContext: contextA(), automationRunId: f.runTenantA});
  const fromTenant = await store.loadForContext({requestContext: tenantCoreA(), automationRunId: f.runTenantA});
  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.triggerRef, "");
  assert.equal(fromIndustry.idempotencyKeyHash, "");
  assert.equal(fromIndustry.lastErrorCode, "");
  assert.equal(fromIndustry.status, "SUCCEEDED");
});

test("WFA-RUN-PG-004 foreign Tenant run is hidden and owning Tenant sees raw evidence", async () => {
  assert.equal(await store.loadForContext({requestContext: tenantCoreA(), automationRunId: f.runTenantB}), null);
  const own = await store.loadForContext({requestContext: tenantCoreB(), automationRunId: f.runTenantB});
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.status, "PENDING");
  assert.equal(own.completedAt, undefined);
});

test("WFA-RUN-PG-005 persisted run evidence exposes no trigger/retry/next-state execution decision", async () => {
  const row = await store.loadForContext({requestContext: contextA(f.industryA2), automationRunId: f.runIndustryA2});
  assert.ok(row);
  assert.equal(row.correlationId, f.correlationA2);
  assert.equal("retryable" in row, false);
  assert.equal("nextStatus" in row, false);
  assert.equal("executable" in row, false);
  assert.equal("selected" in row, false);
});

test("WFA-RUN-PG-006 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForContext({requestContext: tenantCoreA(), automationRunId: "not-a-uuid"}));
  await assert.rejects(store.loadForContext({
    requestContext: {...tenantCoreA(), dataHomeId: randomUUID()},
    automationRunId: f.runTenantA,
  }));
});

test("WFA-RUN-PG-007 worker keeps schema-owned UPDATE privilege while read port exposes no mutation surface", async () => {
  const scoped = new RequestScopedSql(
    new PostgresWorkflowDatabase(pool),
    {dataHomeId: f.home, regionCode: "IN-AUTOMATION-RUN"},
  );
  const result = await scoped.withContext(tenantCoreA(), (tx) => tx.query(
    "UPDATE core_workflow.automation_run SET status=status WHERE id=$1::uuid RETURNING id",
    [f.runTenantA],
  ));
  assert.equal(result.rowCount, 1);
  assert.equal(typeof store.updateForContext, "undefined");
  assert.equal(typeof store.createForContext, "undefined");
});
