import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAuthorizationAuditStore } from "../../dist/server/authorization/postgres-authorization-audit-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL, "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");

const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const role = `sbg_authz_audit_${randomBytes(8).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home", "tenant", "principal", "membership", "industry", "sibling", "decision", "audit",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function context(industryContextId = f.industry) {
  return {
    requestId: "authz-audit-request-1",
    correlationId: randomUUID(),
    tenantId: f.tenant,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-AUTHZ-AUDIT",
    principalId: f.principal,
    principalType: "HUMAN",
    membershipId: f.membership,
    orgUnitPath: [],
    roleIds: [],
    permissionVersion: 3,
    entitlementSnapshotVersion: 5,
    scopeClass: "TENANT_INDUSTRY",
  };
}

const operation = {
  operationId: "rtl.pos.sale.view",
  module: "RTL-POS",
  scopeClass: "TENANT_INDUSTRY",
  kind: "QUERY",
  permissionCode: "rtl.pos.sale.view",
  inputSchemaVersion: 1,
  outputSchemaVersion: 1,
  idempotencyPolicy: "NONE",
  rateClass: "AUTH_STANDARD",
  auditClass: "SECURITY",
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
      VALUES ($1::uuid,$1::uuid::text,'IN-AUTHZ-AUDIT','IN','SHARED','ACTIVE')`, [f.home]);
    await client.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
      VALUES ($1::uuid,$1::uuid::text,'Authorization audit fixture','Authorization audit fixture','ACTIVE','RTL',$2::uuid,'IN-AUTHZ-AUDIT',now(),now())`,
      [f.tenant, f.home]);
    await client.query(`INSERT INTO core_identity.platform_principal
      (id,principal_type,status,created_at,updated_at)
      VALUES ($1,'HUMAN','ACTIVE',now(),now())`, [f.principal]);
    await client.query(`INSERT INTO core_identity.tenant_membership
      (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
      VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`, [f.membership, f.tenant, f.principal]);
    await client.query(`INSERT INTO core_tenancy.industry_context
      (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
      VALUES
      ($1,$3,'RTL','ACTIVE',true,now(),now()),
      ($2,$3,'MFG','ACTIVE',false,now(),now())`,
      [f.industry, f.sibling, f.tenant]);
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
    regionCode: "IN-AUTHZ-AUDIT",
  });
  store = new PostgresAuthorizationAuditStore(scoped, {
    now: () => new Date("2026-09-18T06:00:00.000Z"),
    nextAuditId: () => f.audit,
  });
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM core_audit.audit_event WHERE id=$1", [f.audit]);
    await client.query("DELETE FROM core_audit.audit_event_identity WHERE id=$1", [f.audit]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1", [f.tenant]);
    await client.query("DELETE FROM core_identity.tenant_membership WHERE id=$1", [f.membership]);
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

test("PostgreSQL Authorization audit append stores minimal exact-scope decision evidence", async () => {
  const ctx = context();
  await store.append({
    requestContext: ctx,
    operation,
    outcome: "DENIED",
    reasonCode: "ABAC_DENY",
    accessDecision: {
      decision: "DENY",
      reasonCode: "ABAC_DENY",
      policyIds: ["policy-safe-id"],
      permissionCode: operation.permissionCode,
      decisionId: f.decision,
      auditRequired: true,
      evaluatedAt: "2026-09-18T06:00:00.000Z",
      permissionVersion: 3,
      entitlementSnapshotVersion: 5,
    },
    resourceDescriptor: {
      resourceType: "rtl.pos.sale",
      resourceId: "sale-1",
      tenantId: f.tenant,
      industryContextId: f.industry,
      sensitivityClass: "CONFIDENTIAL",
      state: "PAID",
    },
  });

  const row = await admin.query(`SELECT tenant_id,industry_context_id,scope_class,actor_principal_id,
      action_code,resource_type,resource_id,outcome::text,reason_code,permission_code,
      access_decision_id,source_module,correlation_id,data_home_id,region_code,sensitivity_class,
      evidence_json
    FROM core_audit.audit_event WHERE id=$1`, [f.audit]);
  assert.equal(row.rowCount, 1);
  assert.equal(row.rows[0].tenant_id, f.tenant);
  assert.equal(row.rows[0].industry_context_id, f.industry);
  assert.equal(row.rows[0].scope_class, "TENANT_INDUSTRY");
  assert.equal(row.rows[0].actor_principal_id, f.principal);
  assert.equal(row.rows[0].action_code, operation.operationId);
  assert.equal(row.rows[0].resource_type, "rtl.pos.sale");
  assert.equal(row.rows[0].resource_id, "sale-1");
  assert.equal(row.rows[0].outcome, "DENIED");
  assert.equal(row.rows[0].reason_code, "ABAC_DENY");
  assert.equal(row.rows[0].permission_code, operation.permissionCode);
  assert.equal(row.rows[0].access_decision_id, f.decision);
  assert.equal(row.rows[0].source_module, "RTL-POS");
  assert.equal(row.rows[0].data_home_id, f.home);
  assert.equal(row.rows[0].region_code, "IN-AUTHZ-AUDIT");
  assert.equal(row.rows[0].sensitivity_class, "CONFIDENTIAL");
  assert.deepEqual(row.rows[0].evidence_json, {
    auditClass: "SECURITY",
    operationKind: "QUERY",
    pdpDecisionKind: "DENY",
    policyIds: ["policy-safe-id"],
    permissionVersion: 3,
    entitlementSnapshotVersion: 5,
    restrictionPresent: false,
  });
  assert.equal(Object.hasOwn(row.rows[0].evidence_json, "restrictionSet"), false);
  assert.equal(Object.hasOwn(row.rows[0].evidence_json, "resourceState"), false);
});

test("Authorization audit row is invisible from sibling Industry Context under the runtime role", async () => {
  const count = await scoped.withContext(context(f.sibling), async (tx) => {
    const result = await tx.query(`SELECT count(*)::int AS count
      FROM core_audit.audit_event WHERE id=$1::uuid`, [f.audit]);
    return result.rows[0]?.count ?? -1;
  });
  assert.equal(count, 0);
});

test("runtime application role cannot mutate append-only Authorization audit evidence", async () => {
  await assert.rejects(
    scoped.withContext(context(), (tx) =>
      tx.query(`UPDATE core_audit.audit_event SET reason_code='TAMPERED' WHERE id=$1::uuid`, [f.audit])),
    (error) => String(error.code).startsWith("DATABASE_"),
  );
});
