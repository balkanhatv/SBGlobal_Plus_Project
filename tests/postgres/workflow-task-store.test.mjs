import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresWorkflowDatabase } from "../../dist/server/database/postgres-workflow-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresWorkflowTaskStore,
} from "../../dist/server/workflow/postgres-workflow-task-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_workflow_task_reader_" + randomBytes(8).toString("hex");
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
  "orgUnitA1",
  "roleA1",
  "definitionIndustryA1",
  "definitionIndustryA2",
  "definitionTenantA",
  "definitionTenantB",
  "instanceIndustryA1",
  "instanceIndustryA2",
  "instanceTenantA",
  "instanceTenantB",
  "taskPrincipal",
  "taskRole",
  "taskOrgUnit",
  "taskSibling",
  "taskTenantA",
  "taskTenantB",
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
    regionCode: "IN-WORKFLOW-TASK",
    principalId: f.principalA,
    principalType: "HUMAN",
    membershipId: f.membershipA,
    orgUnitPath: Object.freeze([f.orgUnitA1]),
    roleIds: Object.freeze([f.roleA1]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreA() {
  return Object.freeze({
    ...industryContextA(),
    industryContextId: undefined,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
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
       VALUES ($1::uuid,$1::uuid::text,'IN-WORKFLOW-TASK','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Workflow task tenant A"],
      [f.tenantB, "EDU", "Workflow task tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-WORKFLOW-TASK',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Workflow task principal A"],
      [f.principalB, "Workflow task principal B"],
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
      `INSERT INTO core_tenancy.org_unit
        (id,tenant_id,parent_id,unit_type,code,name,path_key,status,row_version,created_at,updated_at)
       VALUES ($1,$2,NULL,'DEPARTMENT','WF-TASK-OU','Workflow Task OU','/wf-task-ou','ACTIVE',1,now(),now())`,
      [f.orgUnitA1, f.tenantA],
    );
    await client.query(
      `INSERT INTO core_tenancy.org_unit_industry
        (tenant_id,org_unit_id,industry_context_id,status,config_json)
       VALUES ($1,$2,$3,'ACTIVE','{}'::jsonb)`,
      [f.tenantA, f.orgUnitA1, f.industryA1],
    );

    await client.query(
      `INSERT INTO core_authz.role_template
        (id,code,owner_scope,tenant_id,industry_context_id,industry_code,name,
         description,immutable_seed,version,status,created_at,updated_at)
       VALUES ($1,'WF_TASK_ROLE','INDUSTRY',$2,$3,'RTL','Workflow Task Role',
         NULL,false,1,'ACTIVE',now(),now())`,
      [f.roleA1, f.tenantA, f.industryA1],
    );

    await client.query(
      `INSERT INTO core_workflow.workflow_definition
        (id,owner_scope,tenant_id,industry_context_id,code,version,status,
         schema_version,state_machine_json,approval_policy_json,rule_refs,
         created_by,approved_by,effective_from,effective_to,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$5,$7,'TASK_A1',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($2,'INDUSTRY',$5,$8,'TASK_A2',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($3,'TENANT',$5,NULL,'TASK_TENANT_A',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($4,'TENANT',$6,NULL,'TASK_TENANT_B',1,'ACTIVE',1,
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
        ($1,$5,$7,'TENANT_INDUSTRY',$9,1,'Order','order-a1','OPEN','OPEN',1,
         now()-interval '5 days',NULL,$11,now()-interval '5 days',now()-interval '4 days'),
        ($2,$5,$8,'TENANT_INDUSTRY',$10,1,'Maintenance','maint-a2','OPEN','OPEN',1,
         now()-interval '5 days',NULL,$11,now()-interval '5 days',now()-interval '4 days'),
        ($3,$5,NULL,'TENANT_CORE',$12,1,'Case','case-a','OPEN','OPEN',1,
         now()-interval '5 days',NULL,$11,now()-interval '5 days',now()-interval '4 days'),
        ($4,$6,NULL,'TENANT_CORE',$13,1,'Case','case-b','OPEN','OPEN',1,
         now()-interval '5 days',NULL,$14,now()-interval '5 days',now()-interval '4 days')`,
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

    await client.query(
      `INSERT INTO core_workflow.workflow_task
        (id,tenant_id,industry_context_id,workflow_instance_id,task_type,
         assigned_subject_type,assigned_subject_id,permission_code,state,due_at,
         claimed_by,completed_by,completed_at,row_version,created_at,updated_at)
       VALUES
        ($1,$7,$9,$11,'APPROVAL','PRINCIPAL',$15,'workflow.approve','PENDING',
         now()+interval '2 days',NULL,NULL,NULL,0,now()-interval '2 days',now()-interval '3 days'),
        ($2,$7,$9,$11,'REVIEW','ROLE',$17,'','CLAIMED',
         NULL,$15,NULL,NULL,-2,now()-interval '2 days',now()-interval '1 day'),
        ($3,$7,$9,$11,'ACTION','ORG_UNIT',$18,'workflow.action','COMPLETED',
         now()-interval '1 day',$15,$15,now()-interval '12 hours',3,
         now()-interval '3 days',now()-interval '1 day'),
        ($4,$7,$10,$12,'APPROVAL','PRINCIPAL',$15,'workflow.approve','REJECTED',
         NULL,NULL,$15,now()-interval '6 hours',4,now()-interval '2 days',now()-interval '6 hours'),
        ($5,$7,NULL,$13,'REVIEW','PRINCIPAL',$15,'','EXPIRED',
         now()-interval '1 day',NULL,NULL,now()-interval '12 hours',-7,
         now()-interval '4 days',now()-interval '5 days'),
        ($6,$8,NULL,$14,'ACTION','PRINCIPAL',$16,'workflow.cancel','CANCELLED',
         NULL,NULL,$16,now()-interval '2 hours',11,now()-interval '3 days',now()-interval '2 hours')`,
      [
        f.taskPrincipal,
        f.taskRole,
        f.taskOrgUnit,
        f.taskSibling,
        f.taskTenantA,
        f.taskTenantB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.instanceIndustryA1,
        f.instanceIndustryA2,
        f.instanceTenantA,
        f.instanceTenantB,
        f.principalA,
        f.principalB,
        f.roleA1,
        f.orgUnitA1,
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
      regionCode: "IN-WORKFLOW-TASK",
    },
  );
  store = new PostgresWorkflowTaskStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_workflow.workflow_task WHERE id=ANY($1::uuid[])",
      [[f.taskPrincipal,f.taskRole,f.taskOrgUnit,f.taskSibling,f.taskTenantA,f.taskTenantB]],
    );
    await client.query(
      "DELETE FROM core_workflow.workflow_instance WHERE id=ANY($1::uuid[])",
      [[f.instanceIndustryA1,f.instanceIndustryA2,f.instanceTenantA,f.instanceTenantB]],
    );
    await client.query(
      "DELETE FROM core_workflow.workflow_definition WHERE id=ANY($1::uuid[])",
      [[f.definitionIndustryA1,f.definitionIndustryA2,f.definitionTenantA,f.definitionTenantB]],
    );
    await client.query("DELETE FROM core_authz.role_template WHERE id=$1",[f.roleA1]);
    await client.query(
      "DELETE FROM core_tenancy.org_unit_industry WHERE tenant_id=$1 AND org_unit_id=$2",
      [f.tenantA,f.orgUnitA1],
    );
    await client.query("DELETE FROM core_tenancy.org_unit WHERE id=$1",[f.orgUnitA1]);
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipA,f.membershipB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.principalA,f.principalB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA,f.tenantB]],
    );
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
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

test("WFT-PG-001 exact Industry task preserves raw principal assignment/state/due evidence", async () => {
  const task = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTaskId: f.taskPrincipal,
  });

  assert.ok(task);
  assert.equal(task.workflowInstanceId, f.instanceIndustryA1);
  assert.equal(task.taskType, "APPROVAL");
  assert.equal(task.assignedSubjectType, "PRINCIPAL");
  assert.equal(task.assignedSubjectId, f.principalA);
  assert.equal(task.permissionCode, "workflow.approve");
  assert.equal(task.state, "PENDING");
  assert.equal(task.rowVersion, "0");
  assert.equal(typeof task.dueAt, "string");
  assert.equal(task.claimedBy, undefined);
  assert.equal(Object.isFrozen(task), true);
});

test("WFT-PG-002 ROLE and ORG_UNIT assignment evidence is preserved without eligibility decision", async () => {
  const roleTask = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTaskId: f.taskRole,
  });
  const orgTask = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTaskId: f.taskOrgUnit,
  });

  assert.ok(roleTask);
  assert.ok(orgTask);
  assert.equal(roleTask.assignedSubjectType, "ROLE");
  assert.equal(roleTask.assignedSubjectId, f.roleA1);
  assert.equal(roleTask.permissionCode, "");
  assert.equal(roleTask.state, "CLAIMED");
  assert.equal(roleTask.claimedBy, f.principalA);
  assert.equal(roleTask.rowVersion, "-2");
  assert.equal(orgTask.assignedSubjectType, "ORG_UNIT");
  assert.equal(orgTask.assignedSubjectId, f.orgUnitA1);
  assert.equal(orgTask.state, "COMPLETED");
  assert.equal(orgTask.completedBy, f.principalA);
  assert.equal(typeof orgTask.completedAt, "string");
  assert.equal("eligible" in roleTask, false);
  assert.equal("allowed" in orgTask, false);
});

test("WFT-PG-003 parent FORCE-RLS hides sibling Industry task", async () => {
  const hidden = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTaskId: f.taskSibling,
  });
  assert.equal(hidden, null);

  const sibling = await store.loadForContext({
    requestContext: industryContextA(f.industryA2),
    workflowTaskId: f.taskSibling,
  });
  assert.ok(sibling);
  assert.equal(sibling.state, "REJECTED");
  assert.equal(sibling.completedBy, f.principalA);
});

test("WFT-PG-004 Tenant Core task is same-Tenant visible and preserves schema-allowed raw values", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTaskId: f.taskTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowTaskId: f.taskTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.permissionCode, "");
  assert.equal(fromIndustry.state, "EXPIRED");
  assert.equal(fromIndustry.rowVersion, "-7");
  assert.ok(Date.parse(fromIndustry.updatedAt) < Date.parse(fromIndustry.createdAt));
  assert.equal(fromTenant.id, f.taskTenantA);
});

test("WFT-PG-005 foreign Tenant task is hidden and owning Tenant sees it", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowTaskId: f.taskTenantB,
  });
  assert.equal(hidden, null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    workflowTaskId: f.taskTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.state, "CANCELLED");
});

test("WFT-PG-006 terminal/claim/completion evidence is raw and non-authorizing", async () => {
  const task = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTaskId: f.taskOrgUnit,
  });

  assert.ok(task);
  assert.equal(task.state, "COMPLETED");
  assert.equal(task.claimedBy, f.principalA);
  assert.equal(task.completedBy, f.principalA);
  assert.equal("canClaim" in task, false);
  assert.equal("canApprove" in task, false);
  assert.equal("canComplete" in task, false);
  assert.equal("transition" in task, false);
});

test("WFT-PG-007 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    workflowTaskId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    workflowTaskId: f.taskTenantA,
  }));
});
