import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import pg from "pg";

import { CommercialCurrentStateService, CommercialStateError } from "../../dist/core/index.js";
import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresCommercialCurrentStateStore } from "../../dist/server/commercial/postgres-commercial-current-state.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL, "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");

const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const role = `sbg_commercial_reader_${randomBytes(8).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home", "tenant", "principal", "industry", "sibling", "route", "plan", "planVersion",
  "subscription", "industryLicense", "msLicense", "siblingLicense", "snapshot",
  "entRtl", "entMfg", "entGlobal",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;
let service;

function requestContext(industryContextId = f.industry) {
  return {
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenant,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-COMMERCIAL",
    principalId: f.principal,
    principalType: "HUMAN",
    orgUnitPath: [],
    roleIds: [],
    entitlementSnapshotId: f.snapshot,
    entitlementSnapshotVersion: 7,
    scopeClass: "TENANT_INDUSTRY",
  };
}

const operation = {
  operationId: "rtl.pos.sale.view",
  module: "RTL-POS",
  scopeClass: "TENANT_INDUSTRY",
  kind: "QUERY",
  permissionCode: "rtl.pos.sale.view",
  entitlementRequirement: "rtl.pos.enabled",
  inputSchemaVersion: 1,
  outputSchemaVersion: 1,
  idempotencyPolicy: "NONE",
  rateClass: "AUTH_STANDARD",
  auditClass: "STANDARD",
  domainService: "RetailPosSaleService",
  emittedEvents: [],
  errorCodes: [],
};

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
    await client.query(`GRANT sbg_app_rw TO ${role}`);

    await client.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES ($1::uuid,$1::uuid::text,'IN-COMMERCIAL','IN','SHARED','ACTIVE')`, [f.home]);
    await client.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
      VALUES ($1::uuid,$1::uuid::text,'Commercial fixture','Commercial fixture','ACTIVE','RTL',$2::uuid,'IN-COMMERCIAL',now(),now())`,
      [f.tenant, f.home]);
    await client.query(`INSERT INTO core_identity.platform_principal
      (id,principal_type,status,created_at,updated_at)
      VALUES ($1,'HUMAN','ACTIVE',now(),now())`, [f.principal]);

    for (const [id, code, primary] of [[f.industry, "RTL", true], [f.sibling, "MFG", false]]) {
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`, [id, f.tenant, code, primary]);
    }

    await client.query(`INSERT INTO core_commercial.commercial_route_policy
      (id,code,self_serve_enabled,sales_assisted_enabled,version,status,created_at)
      VALUES ($1,$2,true,false,1,'ACTIVE',now())`, [f.route, `COMM-${f.route}`]);
    await client.query(`INSERT INTO core_commercial.plan
      (id,code,name,status,created_at,updated_at)
      VALUES ($1,$2,'Commercial Test','ACTIVE',now(),now())`, [f.plan, `PLAN-${f.plan}`]);
    await client.query(`INSERT INTO core_commercial.plan_version
      (id,plan_id,version_no,status,route_policy_id,entitlement_template_json,limit_set_json,
       billing_policy_json,support_class,published_at,created_by,created_at)
      VALUES ($1,$2,1,'ACTIVE',$3,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,'TEST',now(),$4,now())`,
      [f.planVersion, f.plan, f.route, f.principal]);
    await client.query(`INSERT INTO core_commercial.subscription
      (id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at)
      VALUES ($1,$2,$3,'ACTIVE','Asia/Kolkata',3,now(),now())`,
      [f.subscription, f.tenant, f.planVersion]);
    await client.query(`UPDATE core_tenancy.tenant
      SET current_subscription_id=$2,updated_at=now() WHERE id=$1`,
      [f.tenant, f.subscription]);

    await client.query(`INSERT INTO core_commercial.license
      (id,tenant_id,subscription_id,license_type,subject_key,industry_context_id,status,valid_from,version,created_at,updated_at)
      VALUES
      ($1,$4,$5,'INDUSTRY','RTL',$6,'ACTIVE',now()-interval '1 day',1,now(),now()),
      ($2,$4,$5,'MANAGEMENT_SYSTEM','RTL-POS',$6,'ACTIVE',now()-interval '1 day',1,now(),now()),
      ($3,$4,$5,'INDUSTRY','MFG',$7,'ACTIVE',now()-interval '1 day',1,now(),now())`,
      [f.industryLicense, f.msLicense, f.siblingLicense, f.tenant, f.subscription, f.industry, f.sibling]);

    for (const [id, code] of [
      [f.entRtl, "rtl.pos.enabled"],
      [f.entMfg, "mfg.production.enabled"],
      [f.entGlobal, "tenant.common.enabled"],
    ]) {
      await client.query(`INSERT INTO core_commercial.entitlement_definition
        (id,code,category,value_type,scope_class,description,deny_semantics,version,status)
        VALUES ($1,$2,'FEATURE','BOOLEAN','TENANT_INDUSTRY','test','DENY_WINS',1,'ACTIVE')`,
        [id, code]);
    }

    await client.query(`INSERT INTO core_commercial.entitlement_snapshot
      (id,tenant_id,version,source_subscription_id,source_plan_version_id,compiled_at,valid_from,
       source_fingerprint,status,deny_set_json,metadata_json)
      VALUES ($1,$2,7,$3,$4,now(),now()-interval '1 minute','commercial-current-7','CURRENT','[]'::jsonb,'{}'::jsonb)`,
      [f.snapshot, f.tenant, f.subscription, f.planVersion]);

    await client.query(`INSERT INTO core_commercial.entitlement_snapshot_fact
      (snapshot_id,tenant_id,entitlement_code,industry_context_id,value_json,source_type,source_id,effective_from)
      VALUES
      ($1,$7,'tenant.common.enabled',NULL,'true'::jsonb,'PLAN',$2,now()-interval '1 minute'),
      ($1,$7,'rtl.pos.enabled',$3,'true'::jsonb,'LICENSE',$4,now()-interval '1 minute'),
      ($1,$7,'mfg.production.enabled',$5,'true'::jsonb,'LICENSE',$6,now()-interval '1 minute')`,
      [f.snapshot, f.planVersion, f.industry, f.industryLicense, f.sibling, f.siblingLicense, f.tenant]);

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
  pool = new pg.Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000 });
  scoped = new RequestScopedSql(new PostgresDatabase(pool), {
    dataHomeId: f.home,
    regionCode: "IN-COMMERCIAL",
  });
  store = new PostgresCommercialCurrentStateStore(scoped);
  service = new CommercialCurrentStateService(store);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM core_commercial.entitlement_snapshot_fact WHERE snapshot_id=$1", [f.snapshot]);
    await client.query("DELETE FROM core_commercial.entitlement_snapshot WHERE id=$1", [f.snapshot]);
    await client.query("DELETE FROM core_commercial.license WHERE tenant_id=$1", [f.tenant]);
    await client.query("UPDATE core_tenancy.tenant SET current_subscription_id=NULL,updated_at=now() WHERE id=$1", [f.tenant]);
    await client.query("DELETE FROM core_commercial.subscription WHERE id=$1", [f.subscription]);
    await client.query("DELETE FROM core_commercial.plan_version WHERE id=$1", [f.planVersion]);
    await client.query("DELETE FROM core_commercial.plan WHERE id=$1", [f.plan]);
    await client.query("DELETE FROM core_commercial.commercial_route_policy WHERE id=$1", [f.route]);
    await client.query("DELETE FROM core_commercial.entitlement_definition WHERE id=ANY($1::uuid[])", [[f.entRtl, f.entMfg, f.entGlobal]]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1", [f.tenant]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=$1", [f.principal]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=$1", [f.tenant]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1", [f.home]);
    await client.query(`DROP ROLE IF EXISTS ${role}`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await admin.end();
  }
});

test("PostgreSQL Commercial reader returns exact current snapshot and only active Industry scope", async () => {
  const state = await store.loadCurrent({ requestContext: requestContext() });
  assert.ok(state);
  assert.equal(state.snapshotId, f.snapshot);
  assert.equal(state.snapshotVersion, 7);
  assert.equal(state.subscriptionState, "ACTIVE");
  assert.deepEqual(state.licenses.map((license) => license.subjectKey), ["RTL", "RTL-POS"]);
  assert.deepEqual(state.entitlements.map((fact) => fact.code), [
    "rtl.pos.enabled",
    "tenant.common.enabled",
  ]);
});

test("PostgreSQL Commercial reader does not leak sibling Industry license or entitlement facts", async () => {
  const state = await store.loadCurrent({ requestContext: requestContext(f.sibling) });
  assert.ok(state);
  assert.deepEqual(state.licenses.map((license) => license.subjectKey), ["MFG"]);
  assert.deepEqual(state.entitlements.map((fact) => fact.code), [
    "mfg.production.enabled",
    "tenant.common.enabled",
  ]);
});

test("Commercial service validates current version and emits exact server-owned facts from PostgreSQL", async () => {
  const guard = await service.validateCurrent({ requestContext: requestContext(), operation });
  assert.deepEqual(guard, { allowed: true });

  const facts = await service.load({ requestContext: requestContext(), operation });
  assert.equal(facts["commercial.subscriptionState"], "ACTIVE");
  assert.deepEqual(facts["commercial.licenseSet"], ["INDUSTRY:RTL", "MANAGEMENT_SYSTEM:RTL-POS"]);
  assert.deepEqual(facts["commercial.entitlementFacts"], ["rtl.pos.enabled", "tenant.common.enabled"]);

  await assert.rejects(
    service.validateCurrent({
      requestContext: { ...requestContext(), entitlementSnapshotVersion: 6 },
      operation,
    }),
    (error) => error instanceof CommercialStateError
      && error.code === "COMMERCIAL_CONTEXT_STALE",
  );
});
