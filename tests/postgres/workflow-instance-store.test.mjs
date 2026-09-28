import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresWorkflowDatabase } from "../../dist/server/database/postgres-workflow-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresWorkflowInstanceStore,
} from "../../dist/server/workflow/postgres-workflow-instance-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_workflow_instance_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "principalA",
  "principalB",
  "membershipA",
  "membershipB",
  "industryA1",
  "industryA2",
  "industryB1",
  "definitionIndustryA1",
  "definitionIndustryA2",
  "definitionTenantA",
  "definitionTenantB",
  "instanceIndustryA1",
  "instanceIndustryA2",
  "instanceTenantA",
  "instanceTenantB",
].map((key) => [key, randomUUID()]));

let pool;
let store;

function industryContextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-WORKFLOW-INSTANCE",
    principalId: f.principalA,
    principalType: "HUMAN",
    membershipId: f.membershipA,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreA() {
  return Object.freeze({
    ...industryContextA(),
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
}

function tenantCoreB() {
  return Object.freeze({
    ...tenantCoreA(),
    tenantId: f.tenantB,
    principalId: f.principalB,
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
       VALUES ($1::uuid,$1::uuid::text,'IN-WORKFLOW-INSTANCE','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Workflow instance tenant A"],
      [f.tenantB, "EDU", "Workflow instance tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-WORKFLOW-INSTANCE',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Workflow instance principal A"],
      [f.principalB, "Workflow instance principal B"],
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

    await client.query(
      `INSERT INTO core_workflow.workflow_definition
        (id,owner_scope,tenant_id,industry_context_id,code,version,status,
         schema_version,state_machine_json,approval_policy_json,rule_refs,
         created_by,approved_by,effective_from,effective_to,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$5,$7,'INSTANCE_A1',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($2,'INDUSTRY',$5,$8,'INSTANCE_A2',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($3,'TENANT',$5,NULL,'INSTANCE_TENANT_A',1,'ACTIVE',1,
         '{"initial":"WAITING"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($4,'TENANT',$6,NULL,'INSTANCE_TENANT_B',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $10,$10,NULL,NULL,now()-interval '20 days',now()-interval '19 days')`,
      [
        f.definitionIndustryA1,
        f.definitionIndustryA2,
        f.definitionTenantA,
        f.definitionTenantB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.principalA,
        f.principalB,
      ],
    );

    await client.query(
      `INSERT INTO core_workflow.workflow_instance
        (id,tenant_id,industry_context_id,scope_class,workflow_definition_id,
         workflow_definition_version,resource_type,resource_id,current_state,
         lifecycle_state,row_version,started_at,completed_at,created_by,created_at,updated_at)
       VALUES
        ($1,$5,$7,'TENANT_INDUSTRY',$9,1,'Order','order-a1','',
         'WAITING',0,now()-interval '4 days',NULL,$11,
         now()-interval '4 days',now()-interval '5 days'),
        ($2,$5,$8,'TENANT_INDUSTRY',$10,1,'Maintenance','maint-a2','OPEN',
         'OPEN',2,now()-interval '3 days',NULL,$11,
         now()-interval '3 days',now()-interval '2 days'),
        ($3,$5,NULL,'TENANT_CORE',$12,1,'','','DONE',
         'COMPLETED',-7,now()-interval '6 days',now()-interval '2 days',$11,
         now()-interval '5 days',now()-interval '7 days'),
        ($4,$6,NULL,'TENANT_CORE',$13,1,'Case','case-b','CANCELLED',
         'CANCELLED',11,now()-interval '5 days',now()-interval '1 day',$14,
         now()-interval '5 days',now()-interval '1 day')`,
      [
        f.instanceIndustryA1,
        f.instanceIndustryA2,
        f.instanceTenantA,
        f.instanceTenantB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.definitionIndustryA1,
        f.definitionIndustryA2,
        f.principalA,
        f.definitionTenantA,
        f.definitionTenantB,
        f.principalB,
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

  const scoped = new RequestScopedSql(
    new PostgresWorkflowDatabase(pool),
    {
      dataHomeId: f.home,
      regionCode: "IN-WORKFLOW-INSTANCE",
    },
  );
  store = new PostgresWorkflowInstanceStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_workflow.workflow_instance WHERE id=ANY($1::uuid[])",
      [[
        f.instanceIndustryA1,
        f.instanceIndustryA2,
        f.instanceTenantA,
        f.instanceTenantB,
      ]],
    );
    await client.query(
      "DELETE FROM core_workflow.workflow_definition WHERE id=ANY($1::uuid[])",
      [[
        f.definitionIndustryA1,
        f.definitionIndustryA2,
        f.definitionTenantA,
        f.definitionTenantB,
      ]],
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
    await client.query(
      "DELETE FROM platform_directory.data_home WHERE id=$1",
      [f.home],
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

test("WFI-PG-001 exact Industry instance preserves raw state/version evidence", async () => {
  const instance = await store.loadForContext({
    requestContext: industryContextA(),
    workflowInstanceId: f.instanceIndustryA1,
  });

  assert.ok(instance);
  assert.equal(instance.scopeClass, "TENANT_INDUSTRY");
  assert.equal(instance.tenantId, f.tenantA);
  assert.equal(instance.industryContextId, f.industryA1);
  assert.equal(instance.workflowDefinitionId, f.definitionIndustryA1);
  assert.equal(instance.workflowDefinitionVersion, 1);
  assert.equal(instance.resourceType, "Order");
  assert.equal(instance.resourceId, "order-a1");
  assert.equal(instance.currentState, "");
  assert.equal(instance.lifecycleState, "WAITING");
  assert.equal(instance.rowVersion, "0");
  assert.equal(instance.completedAt, undefined);
  assert.equal(Object.isFrozen(instance), true);
});

test("WFI-PG-002 FORCE-RLS hides sibling Industry instance", async () => {
  const hidden = await store.loadForContext({
    requestContext: industryContextA(),
    workflowInstanceId: f.instanceIndustryA2,
  });
  assert.equal(hidden, null);

  const sibling = await store.loadForContext({
    requestContext: industryContextA(f.industryA2),
    workflowInstanceId: f.instanceIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.lifecycleState, "OPEN");
});

test("WFI-PG-003 Tenant Core instance is same-Tenant visible and preserves schema-allowed raw values", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: industryContextA(),
    workflowInstanceId: f.instanceTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowInstanceId: f.instanceTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.scopeClass, "TENANT_CORE");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.resourceType, "");
  assert.equal(fromIndustry.resourceId, "");
  assert.equal(fromIndustry.rowVersion, "-7");
  assert.equal(fromIndustry.lifecycleState, "COMPLETED");
  assert.equal(typeof fromIndustry.completedAt, "string");
  assert.ok(Date.parse(fromIndustry.updatedAt) < Date.parse(fromIndustry.createdAt));
  assert.equal(fromTenant.id, f.instanceTenantA);
});

test("WFI-PG-004 foreign Tenant instance is hidden and owning Tenant sees it", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowInstanceId: f.instanceTenantB,
  });
  assert.equal(hidden, null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    workflowInstanceId: f.instanceTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.lifecycleState, "CANCELLED");
  assert.equal(own.rowVersion, "11");
});

test("WFI-PG-005 lifecycle/completion evidence is raw and non-executing", async () => {
  const instance = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowInstanceId: f.instanceTenantA,
  });

  assert.ok(instance);
  assert.equal(instance.lifecycleState, "COMPLETED");
  assert.equal(instance.currentState, "DONE");
  assert.equal("canTransition" in instance, false);
  assert.equal("allowedTransitions" in instance, false);
  assert.equal("executable" in instance, false);
  assert.equal("final" in instance, false);
});

test("WFI-PG-006 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    workflowInstanceId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    workflowInstanceId: f.instanceTenantA,
  }));
});

test("WFI-PG-007 exact-by-id reader does not select another instance or definition", async () => {
  const instance = await store.loadForContext({
    requestContext: industryContextA(),
    workflowInstanceId: f.instanceIndustryA1,
  });

  assert.ok(instance);
  assert.equal(instance.id, f.instanceIndustryA1);
  assert.equal(instance.workflowDefinitionId, f.definitionIndustryA1);
  assert.notEqual(instance.id, f.instanceIndustryA2);
});
