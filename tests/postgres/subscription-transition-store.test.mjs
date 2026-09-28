import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresSubscriptionTransitionStore } from "../../dist/server/commercial/postgres-subscription-transition-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_subscription_transition_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");

const f = Object.fromEntries([
  "home","tenantA","tenantB","industryA","industryB",
  "principalA","principalB","platformService",
  "routePolicy","plan","planVersion",
  "subscriptionA","subscriptionB",
  "transitionA1","transitionA2","transitionB",
  "sourceEventA1","correlationA1","correlationA2","correlationB","missingTransition",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function tenantCoreA() {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    dataHomeId: f.home,
    regionCode: "IN-SUB-TRANS",
    principalId: f.principalA,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_CORE",
  });
}

function industryA() {
  return Object.freeze({
    ...tenantCoreA(),
    industryContextId: f.industryA,
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreB() {
  return Object.freeze({
    ...tenantCoreA(),
    tenantId: f.tenantB,
    principalId: f.principalB,
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
    await client.query("GRANT sbg_app_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-SUB-TRANS','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Subscription transition tenant A"],
      [f.tenantB, "EDU", "Subscription transition tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-SUB-TRANS',now()-interval '40 days',now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [industryId, tenantId, industryCode] of [
      [f.industryA, f.tenantA, "RTL"],
      [f.industryB, f.tenantB, "EDU"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',true,now()-interval '30 days',now())`,
        [industryId, tenantId, industryCode],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Subscription transition principal A"],
      [f.principalB, "Subscription transition principal B"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,created_at,updated_at)
         VALUES ($1,'HUMAN','ACTIVE',$2,now()-interval '40 days',now())`,
        [principalId, label],
      );
    }

    await client.query(
      `INSERT INTO core_commercial.commercial_route_policy
        (id,code,self_serve_enabled,sales_assisted_enabled,market_scope_json,
         approval_required,version,status,created_at)
       VALUES ($1,$2,true,true,'{}'::jsonb,false,1,'ACTIVE',now()-interval '30 days')`,
      [f.routePolicy, "SUB_TRANS_ROUTE_" + suffix],
    );
    await client.query(
      `INSERT INTO core_commercial.plan
        (id,code,name,status,created_at,updated_at)
       VALUES ($1,$2,'Subscription transition plan','ACTIVE',
         now()-interval '30 days',now())`,
      [f.plan, "SUB_TRANS_PLAN_" + suffix],
    );
    await client.query(
      `INSERT INTO core_commercial.plan_version
        (id,plan_id,version_no,status,effective_from,effective_to,route_policy_id,
         entitlement_template_json,limit_set_json,trial_policy_json,billing_policy_json,
         support_class,published_at,created_by,created_at)
       VALUES ($1,$2,1,'ACTIVE',now()-interval '20 days',NULL,$3,
         '{}'::jsonb,'{}'::jsonb,NULL,'{}'::jsonb,'STANDARD',
         now()-interval '20 days',$4,now()-interval '25 days')`,
      [f.planVersion, f.plan, f.routePolicy, f.principalA],
    );

    for (const [subscriptionId, tenantId] of [
      [f.subscriptionA, f.tenantA],
      [f.subscriptionB, f.tenantB],
    ]) {
      await client.query(
        `INSERT INTO core_commercial.subscription
          (id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE','Asia/Kolkata',1,
           now()-interval '10 days',now())`,
        [subscriptionId, tenantId, f.planVersion],
      );
    }

    await client.query(
      `INSERT INTO core_commercial.subscription_transition
        (id,tenant_id,subscription_id,from_state,to_state,trigger_code,
         actor_principal_id,source_event_id,reason_code,occurred_at,correlation_id)
       VALUES
        ($1,$4,$6,'ACTIVE','ACTIVE','',$8,$9,'',
          now()+interval '2 days',$10),
        ($2,$4,$6,NULL,'GRACE','raw-manual',NULL,NULL,NULL,
          now()-interval '5 days',$11),
        ($3,$5,$7,'TRIAL','ACTIVE','foreign',$12,NULL,'reason',
          now()-interval '1 day',$13)`,
      [
        f.transitionA1,
        f.transitionA2,
        f.transitionB,
        f.tenantA,
        f.tenantB,
        f.subscriptionA,
        f.subscriptionB,
        f.principalA,
        f.sourceEventA1,
        f.correlationA1,
        f.correlationA2,
        f.principalB,
        f.correlationB,
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
    new PostgresDatabase(pool),
    {dataHomeId: f.home, regionCode: "IN-SUB-TRANS"},
  );
  store = new PostgresSubscriptionTransitionStore(scoped);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_commercial.subscription_transition WHERE id=ANY($1::uuid[])",
      [[f.transitionA1,f.transitionA2,f.transitionB]],
    );
    await client.query(
      "DELETE FROM core_commercial.subscription WHERE id=ANY($1::uuid[])",
      [[f.subscriptionA,f.subscriptionB]],
    );
    await client.query("DELETE FROM core_commercial.plan_version WHERE id=$1", [f.planVersion]);
    await client.query("DELETE FROM core_commercial.plan WHERE id=$1", [f.plan]);
    await client.query("DELETE FROM core_commercial.commercial_route_policy WHERE id=$1", [f.routePolicy]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])", [[f.industryA,f.industryB]]);
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.principalA,f.principalB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA,f.tenantB]],
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

test("SUBTRANS-PG-001 exact transition preserves complete immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: tenantCoreA(),
    transitionId: f.transitionA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.transitionA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.subscriptionId, f.subscriptionA);
  assert.equal(row.fromState, "ACTIVE");
  assert.equal(row.toState, "ACTIVE");
  assert.equal(row.triggerCode, "");
  assert.equal(row.actorPrincipalId, f.principalA);
  assert.equal(row.sourceEventId, f.sourceEventA1);
  assert.equal(row.reasonCode, "");
  assert.equal(row.correlationId, f.correlationA1);
  assert.equal(Object.isFrozen(row), true);
});

test("SUBTRANS-PG-002 same-Tenant Core and Industry contexts see Tenant-owned transition", async () => {
  const core = await store.loadForContext({
    requestContext: tenantCoreA(),
    transitionId: f.transitionA1,
  });
  const industry = await store.loadForContext({
    requestContext: industryA(),
    transitionId: f.transitionA1,
  });

  assert.ok(core);
  assert.ok(industry);
  assert.equal(industry.id, core.id);
  assert.equal(industry.tenantId, f.tenantA);
});

test("SUBTRANS-PG-003 foreign Tenant and PLATFORM_GLOBAL contexts do not bypass Tenant RLS", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    transitionId: f.transitionB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    transitionId: f.transitionB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    transitionId: f.transitionA1,
  }), null);
});

test("SUBTRANS-PG-004 nullable evidence and raw text remain unstrengthened", async () => {
  const row = await store.loadForContext({
    requestContext: tenantCoreA(),
    transitionId: f.transitionA2,
  });

  assert.ok(row);
  assert.equal(row.fromState, undefined);
  assert.equal(row.toState, "GRACE");
  assert.equal(row.triggerCode, "raw-manual");
  assert.equal(row.actorPrincipalId, undefined);
  assert.equal(row.sourceEventId, undefined);
  assert.equal(row.reasonCode, undefined);
});

test("SUBTRANS-PG-005 equal states and arbitrary chronology remain raw rather than lifecycle authority", async () => {
  const equal = await store.loadForContext({
    requestContext: tenantCoreA(),
    transitionId: f.transitionA1,
  });
  const earlier = await store.loadForContext({
    requestContext: tenantCoreA(),
    transitionId: f.transitionA2,
  });

  assert.ok(equal);
  assert.ok(earlier);
  assert.equal(equal.fromState, equal.toState);
  assert.ok(Date.parse(equal.occurredAt) > Date.now());
  assert.ok(Date.parse(earlier.occurredAt) < Date.now());
  assert.equal("legal" in equal, false);
  assert.equal("current" in equal, false);
  assert.equal("replayable" in equal, false);
  assert.equal("authorized" in equal, false);
});

test("SUBTRANS-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    transitionId: f.missingTransition,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    transitionId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {...tenantCoreA(), dataHomeId: randomUUID()},
    transitionId: f.transitionA1,
  }));
});

test("SUBTRANS-PG-007 read privileges and append-only write ownership remain schema-owned", async () => {
  const privileges = await scoped.withContext(tenantCoreA(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_commercial.subscription_transition','SELECT') AS app_select,
            has_table_privilege(current_user,'core_commercial.subscription_transition','INSERT') AS app_insert,
            has_table_privilege(current_user,'core_commercial.subscription_transition','UPDATE') AS app_update,
            has_table_privilege(current_user,'core_commercial.subscription_transition','DELETE') AS app_delete,
            has_table_privilege('sbg_commercial_transition_compiler_rw','core_commercial.subscription_transition','SELECT') AS compiler_select,
            has_table_privilege('sbg_commercial_transition_compiler_rw','core_commercial.subscription_transition','INSERT') AS compiler_insert,
            has_table_privilege('sbg_commercial_transition_compiler_rw','core_commercial.subscription_transition','UPDATE') AS compiler_update,
            has_table_privilege('sbg_commercial_transition_compiler_rw','core_commercial.subscription_transition','DELETE') AS compiler_delete`,
  ));

  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].app_select, true);
  assert.equal(privileges.rows[0].app_insert, false);
  assert.equal(privileges.rows[0].app_update, false);
  assert.equal(privileges.rows[0].app_delete, false);
  assert.equal(privileges.rows[0].compiler_select, true);
  assert.equal(privileges.rows[0].compiler_insert, true);
  assert.equal(privileges.rows[0].compiler_update, false);
  assert.equal(privileges.rows[0].compiler_delete, false);

  await assert.rejects(scoped.withContext(tenantCoreA(), (tx) => tx.query(
    "UPDATE core_commercial.subscription_transition SET reason_code='mutated' WHERE id=$1::uuid",
    [f.transitionA1],
  )));

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.latest, "undefined");
  assert.equal(typeof store.execute, "undefined");
  assert.equal(typeof store.authorize, "undefined");
  assert.equal(typeof store.replay, "undefined");
  assert.equal(typeof store.publish, "undefined");
});
