import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresWorkflowDatabase } from "../../dist/server/database/postgres-workflow-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresWorkflowDefinitionStore,
} from "../../dist/server/workflow/postgres-workflow-definition-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_workflow_definition_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "principalA",
  "principalB",
  "platformService",
  "membershipA",
  "membershipB",
  "industryA1",
  "industryA2",
  "industryB1",
  "definitionIndustryA1",
  "definitionIndustryA2",
  "definitionTenantA",
  "definitionTenantB",
  "definitionPlatform",
].map((key) => [key, randomUUID()]));

let pool;
let store;

function contextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-WORKFLOW-DEFINITION",
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
    ...contextA(),
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
}

function tenantCoreB() {
  return Object.freeze({
    ...contextA(),
    tenantId: f.tenantB,
    industryContextId: undefined,
    principalId: f.principalB,
    membershipId: f.membershipB,
    scopeClass: "TENANT_CORE",
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
    await client.query("GRANT sbg_workflow_worker_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-WORKFLOW-DEFINITION','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Workflow definition tenant A"],
      [f.tenantB, "EDU", "Workflow definition tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-WORKFLOW-DEFINITION',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "Workflow definition principal A", null, null],
      [f.principalB, "HUMAN", "Workflow definition principal B", null, null],
      [f.platformService, "SERVICE", "Workflow definition platform service",
        "workflow-definition-reader", "Workflow"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,service_code,owning_module,
           created_at,updated_at)
         VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,
        [principalId, type, label, serviceCode, owningModule],
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
        ($1,'INDUSTRY',$6,$8,'ORDER_APPROVAL',2,'ACTIVE',3,
         '{"initial":"OPEN","states":["OPEN","APPROVED"]}'::jsonb,
         '{"mode":"ROLE"}'::jsonb,ARRAY['rule.order.total',''],
         $10,$10,now()-interval '5 days',NULL,
         now()-interval '10 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,'MAINT_REVIEW',1,'DRAFT',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $10,NULL,NULL,NULL,now()-interval '4 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'',3,'RETIRED',2,
         '{"initial":"WAITING"}'::jsonb,'{"quorum":2}'::jsonb,
         ARRAY['rule.tenant.review'],$10,$10,NULL,now()-interval '1 day',
         now()-interval '12 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,'TENANT_B_FLOW',1,'ACTIVE',1,
         '{"initial":"OPEN"}'::jsonb,'{}'::jsonb,ARRAY[]::text[],
         $11,$11,NULL,NULL,now()-interval '3 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,'PLATFORM_GOVERNANCE',1,'PUBLISHED',1,
         '{"initial":"REVIEW"}'::jsonb,'{"approval":"platform"}'::jsonb,
         ARRAY['rule.platform'],$12,$12,NULL,NULL,
         now()-interval '20 days',now()-interval '30 days')`,
      [
        f.definitionIndustryA1,
        f.definitionIndustryA2,
        f.definitionTenantA,
        f.definitionTenantB,
        f.definitionPlatform,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.principalA,
        f.principalB,
        f.platformService,
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
      regionCode: "IN-WORKFLOW-DEFINITION",
    },
  );
  store = new PostgresWorkflowDefinitionStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_workflow.workflow_definition WHERE id=ANY($1::uuid[])",
      [[
        f.definitionIndustryA1,
        f.definitionIndustryA2,
        f.definitionTenantA,
        f.definitionTenantB,
        f.definitionPlatform,
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
      [[f.principalA, f.principalB, f.platformService]],
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

test("WFD-PG-001 exact Industry definition preserves raw JSON/rule/effective evidence", async () => {
  const definition = await store.loadForContext({
    requestContext: contextA(),
    workflowDefinitionId: f.definitionIndustryA1,
  });

  assert.ok(definition);
  assert.equal(definition.ownerScope, "INDUSTRY");
  assert.equal(definition.tenantId, f.tenantA);
  assert.equal(definition.industryContextId, f.industryA1);
  assert.equal(definition.code, "ORDER_APPROVAL");
  assert.equal(definition.version, 2);
  assert.equal(definition.status, "ACTIVE");
  assert.equal(definition.schemaVersion, 3);
  assert.deepEqual(definition.stateMachine, {
    initial: "OPEN",
    states: ["OPEN", "APPROVED"],
  });
  assert.deepEqual(definition.approvalPolicy, {mode: "ROLE"});
  assert.deepEqual(definition.ruleRefs, ["rule.order.total", ""]);
  assert.equal(typeof definition.effectiveFrom, "string");
  assert.equal(definition.effectiveTo, undefined);
  assert.equal(Object.isFrozen(definition), true);
  assert.equal(Object.isFrozen(definition.ruleRefs), true);
  assert.equal("selected" in definition, false);
  assert.equal("executable" in definition, false);
});

test("WFD-PG-002 owner-scope RLS hides sibling Industry definition", async () => {
  const hidden = await store.loadForContext({
    requestContext: contextA(),
    workflowDefinitionId: f.definitionIndustryA2,
  });
  assert.equal(hidden, null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    workflowDefinitionId: f.definitionIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.status, "DRAFT");
});

test("WFD-PG-003 Tenant definition remains same-Tenant visible and preserves schema-allowed raw values", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    workflowDefinitionId: f.definitionTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowDefinitionId: f.definitionTenantA,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.ownerScope, "TENANT");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromIndustry.code, "");
  assert.equal(fromIndustry.status, "RETIRED");
  assert.equal(fromIndustry.effectiveFrom, undefined);
  assert.equal(typeof fromIndustry.effectiveTo, "string");
  assert.equal(fromTenant.id, f.definitionTenantA);
});

test("WFD-PG-004 PLATFORM definition is not Tenant fallback and requires PLATFORM_GLOBAL context", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowDefinitionId: f.definitionPlatform,
  });
  assert.equal(hidden, null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    workflowDefinitionId: f.definitionPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.ownerScope, "PLATFORM");
  assert.equal(platform.status, "PUBLISHED");
  assert.equal(platform.createdBy, f.platformService);
  assert.ok(Date.parse(platform.updatedAt) < Date.parse(platform.createdAt));
});

test("WFD-PG-005 foreign Tenant definition is hidden and owning Tenant sees raw evidence", async () => {
  const hidden = await store.loadForContext({
    requestContext: tenantCoreA(),
    workflowDefinitionId: f.definitionTenantB,
  });
  assert.equal(hidden, null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    workflowDefinitionId: f.definitionTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);
  assert.equal(own.status, "ACTIVE");
});

test("WFD-PG-006 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    workflowDefinitionId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...tenantCoreA(),
      dataHomeId: randomUUID(),
    },
    workflowDefinitionId: f.definitionTenantA,
  }));
});

test("WFD-PG-007 Workflow worker role cannot mutate definition catalog", async () => {
  const scoped = new RequestScopedSql(
    new PostgresWorkflowDatabase(pool),
    {
      dataHomeId: f.home,
      regionCode: "IN-WORKFLOW-DEFINITION",
    },
  );

  await assert.rejects(scoped.withContext(
    contextA(),
    (transaction) => transaction.query(
      "UPDATE core_workflow.workflow_definition SET code='MUTATED' WHERE id=$1",
      [f.definitionIndustryA1],
    ),
  ));

  const definition = await store.loadForContext({
    requestContext: contextA(),
    workflowDefinitionId: f.definitionIndustryA1,
  });
  assert.equal(definition.code, "ORDER_APPROVAL");
});
