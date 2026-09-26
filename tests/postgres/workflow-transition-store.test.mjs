import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresWorkflowDatabase } from "../../dist/server/database/postgres-workflow-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresWorkflowTransitionStore,
} from "../../dist/server/workflow/postgres-workflow-transition-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_workflow_transition_reader_" + randomBytes(8).toString("hex");
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
  "transitionIndustryA1",
  "transitionIndustryA2",
  "transitionTenantA",
  "transitionTenantB",
  "correlationA1",
  "correlationA2",
  "correlationTenantA",
  "correlationTenantB",
].map((key) => [key, randomUUID()]));

let pool;
let store;
let scoped;

function industryContextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-WORKFLOW-TRANSITION",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-WORKFLOW-TRANSITION','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Workflow transition tenant A"],
      [f.tenantB, "EDU", "Workflow transition tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-WORKFLOW-TRANSITION',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Workflow transition principal A"],
      [f.principalB, "Workflow transition principal B"],
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
        ($1,'INDUSTRY',$5,$7,'TRANSITION_A1',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($2,'INDUSTRY',$5,$8,'TRANSITION_A2',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($3,'TENANT',$5,NULL,'TRANSITION_TENANT_A',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $9,$9,NULL,NULL,now()-interval '20 days',now()-interval '19 days'),
        ($4,'TENANT',$6,NULL,'TRANSITION_TENANT_B',1,'ACTIVE',1,
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
        ($1,$5,$7,'TENANT_INDUSTRY',$9,1,'Order','order-a1','APPROVED','OPEN',2,
         now()-interval '5 days',NULL,$11,now()-interval '5 days',now()-interval '1 day'),
        ($2,$5,$8,'TENANT_INDUSTRY',$10,1,'Maintenance','maint-a2','REJECTED','OPEN',3,
         now()-interval '5 days',NULL,$11,now()-interval '5 days',now()-interval '1 day'),
        ($3,$5,NULL,'TENANT_CORE',$12,1,'Case','case-a','','OPEN',9007199254740994,
         now()-interval '5 days',NULL,$11,now()-interval '5 days',now()-interval '1 day'),
        ($4,$6,NULL,'TENANT_CORE',$13,1,'Case','case-b','CANCELLED','OPEN',5,
         now()-interval '5 days',NULL,$14,now()-interval '5 days',now()-interval '1 day')`,
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
      `INSERT INTO core_workflow.workflow_transition
        (id,tenant_id,industry_context_id,workflow_instance_id,from_state,
         action_code,to_state,actor_principal_id,reason_code,
         expected_instance_version,resulting_instance_version,occurred_at,correlation_id)
       VALUES
        ($1,$5,$7,$9,'OPEN','APPROVE','APPROVED',$13,'policy-ok',1,2,now(),$15),
        ($2,$5,$8,$10,'OPEN','REJECT','REJECTED',$13,NULL,2,3,now(),$16),
        ($3,$5,NULL,$11,'','','',$13,'',9007199254740993,9007199254740994,now(),$17),
        ($4,$6,NULL,$12,'OPEN','CANCEL','CANCELLED',$14,NULL,4,5,now(),$18)`,
      [
        f.transitionIndustryA1,
        f.transitionIndustryA2,
        f.transitionTenantA,
        f.transitionTenantB,
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
        f.correlationA1,
        f.correlationA2,
        f.correlationTenantA,
        f.correlationTenantB,
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
    new PostgresWorkflowDatabase(pool),
    {
      dataHomeId: f.home,
      regionCode: "IN-WORKFLOW-TRANSITION",
    },
  );
  store = new PostgresWorkflowTransitionStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_workflow.workflow_transition WHERE id=ANY($1::uuid[])",
      [[f.transitionIndustryA1,f.transitionIndustryA2,f.transitionTenantA,f.transitionTenantB]],
    );
    await client.query(
      "DELETE FROM core_workflow.workflow_instance WHERE id=ANY($1::uuid[])",
      [[f.instanceIndustryA1,f.instanceIndustryA2,f.instanceTenantA,f.instanceTenantB]],
    );
    await client.query(
      "DELETE FROM core_workflow.workflow_definition WHERE id=ANY($1::uuid[])",
      [[f.definitionIndustryA1,f.definitionIndustryA2,f.definitionTenantA,f.definitionTenantB]],
    );
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

test("WTR-PG-001 exact Industry transition preserves raw append-only evidence", async () => {
  const transition = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTransitionId: f.transitionIndustryA1,
  });

  assert.ok(transition);
  assert.equal(transition.workflowInstanceId, f.instanceIndustryA1);
  assert.equal(transition.fromState, "OPEN");
  assert.equal(transition.actionCode, "APPROVE");
  assert.equal(transition.toState, "APPROVED");
  assert.equal(transition.actorPrincipalId, f.principalA);
  assert.equal(transition.reasonCode, "policy-ok");
  assert.equal(transition.expectedInstanceVersion, "1");
  assert.equal(transition.resultingInstanceVersion, "2");
  assert.equal(transition.correlationId, f.correlationA1);
  assert.equal(Object.isFrozen(transition), true);
});

test("WTR-PG-002 parent FORCE-RLS hides sibling Industry transition", async () => {
  const hidden = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTransitionId: f.transitionIndustryA2,
  });
  assert.equal(hidden, null);

  const sibling = await store.loadForContext({
    requestContext: industryContextA(f.industryA2),
    workflowTransitionId: f.transitionIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.actionCode, "REJECT");
  assert.equal(sibling.reasonCode, undefined);
});

test("WTR-PG-003 Tenant Core transition preserves large bigint and schema-allowed empty text", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTransitionId: f.transitionTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowTransitionId: f.transitionTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.fromState, "");
  assert.equal(fromIndustry.actionCode, "");
  assert.equal(fromIndustry.toState, "");
  assert.equal(fromIndustry.reasonCode, "");
  assert.equal(fromIndustry.expectedInstanceVersion, "9007199254740993");
  assert.equal(fromIndustry.resultingInstanceVersion, "9007199254740994");
  assert.equal(fromTenant.id, f.transitionTenantA);
});

test("WTR-PG-004 foreign Tenant transition is hidden and owning Tenant sees it", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowTransitionId: f.transitionTenantB,
  });
  assert.equal(hidden, null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    workflowTransitionId: f.transitionTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.actionCode, "CANCEL");
});

test("WTR-PG-005 persisted transition evidence does not expose next-transition authority", async () => {
  const transition = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTransitionId: f.transitionIndustryA1,
  });

  assert.ok(transition);
  assert.equal("canTransition" in transition, false);
  assert.equal("allowedTransitions" in transition, false);
  assert.equal("nextState" in transition, false);
  assert.equal("executable" in transition, false);
});

test("WTR-PG-006 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    workflowTransitionId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    workflowTransitionId: f.transitionTenantA,
  }));
});

test("WTR-PG-007 Workflow worker role cannot UPDATE or DELETE append-only transition evidence", async () => {
  await assert.rejects(scoped.withContext(
    industryContextA(),
    (transaction) => transaction.query(
      "UPDATE core_workflow.workflow_transition SET reason_code='mutated' WHERE id=$1",
      [f.transitionIndustryA1],
    ),
  ));
  await assert.rejects(scoped.withContext(
    industryContextA(),
    (transaction) => transaction.query(
      "DELETE FROM core_workflow.workflow_transition WHERE id=$1",
      [f.transitionIndustryA1],
    ),
  ));

  const transition = await store.loadForContext({
    requestContext: industryContextA(),
    workflowTransitionId: f.transitionIndustryA1,
  });
  assert.equal(transition.reasonCode, "policy-ok");
});
