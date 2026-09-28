import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAuditEventStore } from "../../dist/server/audit/postgres-audit-event-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_audit_event_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const occurredAt = new Date().toISOString();

const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","platformService",
  "industryA1","industryA2","industryA3","industryB1",
  "eventCoreA","eventIndustryA1","eventCrossA12","eventPlatform","eventTenantB",
  "missingEvent","decision","causation",
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
    regionCode: "IN-AUDIT-RAW",
    principalId: f.principalA,
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_CORE",
  });
}

function industryA(industryContextId = f.industryA1) {
  return Object.freeze({
    ...tenantCoreA(),
    industryContextId,
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

async function insertAudit(client, row) {
  await client.query(
    `INSERT INTO core_audit.audit_event_identity(id,occurred_at)
     VALUES ($1::uuid,$2::timestamptz)`,
    [row.id, occurredAt],
  );
  await client.query(
    `INSERT INTO core_audit.audit_event(
       id,tenant_id,industry_context_id,source_industry_context_id,target_industry_context_id,
       scope_class,occurred_at,actor_principal_id,actor_type,action_code,
       resource_type,resource_id,outcome,reason_code,permission_code,access_decision_id,
       source_module,correlation_id,causation_id,request_id,data_home_id,region_code,
       sensitivity_class,evidence_json,schema_version
     ) VALUES (
       $1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::uuid,
       $6,$7::timestamptz,NULL,$8,$9,
       $10,$11,$12::core_audit.audit_outcome,$13,$14,$15::uuid,
       $16,$17::uuid,$18::uuid,$19,$20::uuid,$21,
       $22,$23::jsonb,$24
     )`,
    [
      row.id,
      row.tenantId ?? null,
      row.industryContextId ?? null,
      row.sourceIndustryContextId ?? null,
      row.targetIndustryContextId ?? null,
      row.scopeClass,
      occurredAt,
      row.actorType,
      row.actionCode,
      row.resourceType ?? null,
      row.resourceId ?? null,
      row.outcome,
      row.reasonCode ?? null,
      row.permissionCode ?? null,
      row.accessDecisionId ?? null,
      row.sourceModule,
      row.correlationId,
      row.causationId ?? null,
      row.requestId ?? null,
      row.dataHomeId ?? null,
      row.regionCode ?? null,
      row.sensitivityClass,
      JSON.stringify(row.evidenceJson),
      row.schemaVersion,
    ],
  );
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AUDIT-RAW','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Audit raw tenant A"],
      [f.tenantB, "EDU", "Audit raw tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AUDIT-RAW',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [id, tenantId, code, primary] of [
      [f.industryA1, f.tenantA, "RTL", true],
      [f.industryA2, f.tenantA, "MFG", false],
      [f.industryA3, f.tenantA, "HSP", false],
      [f.industryB1, f.tenantB, "EDU", true],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,
        [id, tenantId, code, primary],
      );
    }

    await insertAudit(client, {
      id: f.eventCoreA,
      tenantId: f.tenantA,
      scopeClass: "TENANT_CORE",
      actorType: "",
      actionCode: "",
      resourceType: null,
      resourceId: "",
      outcome: "DENIED",
      reasonCode: "",
      permissionCode: "core.audit.read",
      accessDecisionId: f.decision,
      sourceModule: "",
      correlationId: randomUUID(),
      causationId: f.causation,
      requestId: "",
      dataHomeId: f.home,
      regionCode: "IN-AUDIT-RAW",
      sensitivityClass: "INTERNAL",
      evidenceJson: {z: [3, null, {b: true}], a: {nested: "value"}},
      schemaVersion: 1,
    });

    await insertAudit(client, {
      id: f.eventIndustryA1,
      tenantId: f.tenantA,
      industryContextId: f.industryA1,
      scopeClass: "TENANT_INDUSTRY",
      actorType: "SERVICE",
      actionCode: "industry.action",
      outcome: "SUCCESS",
      sourceModule: "Industry",
      correlationId: randomUUID(),
      dataHomeId: f.home,
      regionCode: "IN-AUDIT-RAW",
      sensitivityClass: "CONFIDENTIAL",
      evidenceJson: {kind: "industry"},
      schemaVersion: 2,
    });

    await insertAudit(client, {
      id: f.eventCrossA12,
      tenantId: f.tenantA,
      sourceIndustryContextId: f.industryA1,
      targetIndustryContextId: f.industryA2,
      scopeClass: "EXPLICIT_CROSS_CONTEXT",
      actorType: "SERVICE",
      actionCode: "cross.action",
      outcome: "SUCCESS",
      sourceModule: "CrossContext",
      correlationId: randomUUID(),
      dataHomeId: f.home,
      regionCode: "IN-AUDIT-RAW",
      sensitivityClass: "REGULATED",
      evidenceJson: {source: f.industryA1, target: f.industryA2},
      schemaVersion: 3,
    });

    await insertAudit(client, {
      id: f.eventPlatform,
      scopeClass: "PLATFORM_GLOBAL",
      actorType: "",
      actionCode: "",
      resourceType: "",
      resourceId: null,
      outcome: "FAILED",
      reasonCode: null,
      permissionCode: "",
      sourceModule: "",
      correlationId: randomUUID(),
      requestId: "",
      regionCode: "",
      sensitivityClass: "PUBLIC",
      evidenceJson: {raw: [false, 0, null, ""]},
      schemaVersion: 4,
    });

    await insertAudit(client, {
      id: f.eventTenantB,
      tenantId: f.tenantB,
      scopeClass: "TENANT_CORE",
      actorType: "SERVICE",
      actionCode: "tenant-b.action",
      outcome: "SUCCESS",
      sourceModule: "TenantB",
      correlationId: randomUUID(),
      dataHomeId: f.home,
      regionCode: "IN-AUDIT-RAW",
      sensitivityClass: "INTERNAL",
      evidenceJson: {tenant: "B"},
      schemaVersion: 1,
    });

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
    {dataHomeId: f.home, regionCode: "IN-AUDIT-RAW"},
  );
  store = new PostgresAuditEventStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_audit.audit_event WHERE id=ANY($1::uuid[])",
      [[f.eventCoreA,f.eventIndustryA1,f.eventCrossA12,f.eventPlatform,f.eventTenantB]],
    );
    await client.query(
      "DELETE FROM core_audit.audit_event_identity WHERE id=ANY($1::uuid[])",
      [[f.eventCoreA,f.eventIndustryA1,f.eventCrossA12,f.eventPlatform,f.eventTenantB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryA3,f.industryB1]],
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

test("AUDITEVENT-PG-001 exact Tenant-Core event preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: tenantCoreA(),
    auditEventId: f.eventCoreA,
  });

  assert.ok(row);
  assert.equal(row.id, f.eventCoreA);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, undefined);
  assert.equal(row.scopeClass, "TENANT_CORE");
  assert.equal(row.actorPrincipalId, undefined);
  assert.equal(row.actorType, "");
  assert.equal(row.actionCode, "");
  assert.equal(row.resourceType, undefined);
  assert.equal(row.resourceId, "");
  assert.equal(row.outcome, "DENIED");
  assert.equal(row.reasonCode, "");
  assert.equal(row.permissionCode, "core.audit.read");
  assert.equal(row.accessDecisionId, f.decision);
  assert.equal(row.sourceModule, "");
  assert.equal(row.causationId, f.causation);
  assert.equal(row.requestId, "");
  assert.equal(row.dataHomeId, f.home);
  assert.equal(row.regionCode, "IN-AUDIT-RAW");
  assert.equal(row.sensitivityClass, "INTERNAL");
  assert.equal(row.schemaVersion, 1);
  assert.deepEqual(row.evidenceJson, {a: {nested: "value"}, z: [3, null, {b: true}]});
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.evidenceJson), true);
  assert.equal(Object.isFrozen(row.evidenceJson.z), true);
});

test("AUDITEVENT-PG-002 Tenant-Core event is visible from same-Tenant Industry context", async () => {
  const row = await store.loadForContext({
    requestContext: industryA(f.industryA3),
    auditEventId: f.eventCoreA,
  });
  assert.ok(row);
  assert.equal(row.scopeClass, "TENANT_CORE");
  assert.equal(row.tenantId, f.tenantA);
});

test("AUDITEVENT-PG-003 Tenant-Industry event requires exact Industry Context", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    auditEventId: f.eventIndustryA1,
  }), null);

  const exact = await store.loadForContext({
    requestContext: industryA(f.industryA1),
    auditEventId: f.eventIndustryA1,
  });
  assert.ok(exact);
  assert.equal(exact.industryContextId, f.industryA1);

  assert.equal(await store.loadForContext({
    requestContext: industryA(f.industryA2),
    auditEventId: f.eventIndustryA1,
  }), null);

  assert.equal(await store.loadForContext({
    requestContext: tenantCoreB(),
    auditEventId: f.eventIndustryA1,
  }), null);
});

test("AUDITEVENT-PG-004 explicit cross-context event is visible only from source or target Industry", async () => {
  for (const industryContextId of [f.industryA1, f.industryA2]) {
    const row = await store.loadForContext({
      requestContext: industryA(industryContextId),
      auditEventId: f.eventCrossA12,
    });
    assert.ok(row);
    assert.equal(row.scopeClass, "EXPLICIT_CROSS_CONTEXT");
    assert.equal(row.industryContextId, undefined);
    assert.equal(row.sourceIndustryContextId, f.industryA1);
    assert.equal(row.targetIndustryContextId, f.industryA2);
  }

  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    auditEventId: f.eventCrossA12,
  }), null);

  assert.equal(await store.loadForContext({
    requestContext: industryA(f.industryA3),
    auditEventId: f.eventCrossA12,
  }), null);
});

test("AUDITEVENT-PG-005 PLATFORM_GLOBAL isolation and raw nullable/text evidence are preserved", async () => {
  const row = await store.loadForContext({
    requestContext: platformContext(),
    auditEventId: f.eventPlatform,
  });

  assert.ok(row);
  assert.equal(row.scopeClass, "PLATFORM_GLOBAL");
  assert.equal(row.tenantId, undefined);
  assert.equal(row.actorType, "");
  assert.equal(row.actionCode, "");
  assert.equal(row.resourceType, "");
  assert.equal(row.resourceId, undefined);
  assert.equal(row.permissionCode, "");
  assert.equal(row.requestId, "");
  assert.equal(row.regionCode, "");
  assert.deepEqual(row.evidenceJson, {raw: [false, 0, null, ""]});

  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    auditEventId: f.eventPlatform,
  }), null);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    auditEventId: f.eventCoreA,
  }), null);
});

test("AUDITEVENT-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    auditEventId: f.missingEvent,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    auditEventId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {...tenantCoreA(), dataHomeId: randomUUID()},
    auditEventId: f.eventCoreA,
  }));
});

test("AUDITEVENT-PG-007 schema keeps append/read ownership while DD-144 port stays exact-read only", async () => {
  const privileges = await scoped.withContext(tenantCoreA(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_audit.audit_event','SELECT') AS app_select,
            has_table_privilege(current_user,'core_audit.audit_event','INSERT') AS app_insert,
            has_table_privilege(current_user,'core_audit.audit_event','UPDATE') AS app_update,
            has_table_privilege(current_user,'core_audit.audit_event','DELETE') AS app_delete,
            has_table_privilege('sbg_monitor_ro','core_audit.audit_event','SELECT') AS monitor_select`,
  ));

  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].app_select, true);
  assert.equal(privileges.rows[0].app_insert, true);
  assert.equal(privileges.rows[0].app_update, false);
  assert.equal(privileges.rows[0].app_delete, false);
  assert.equal(privileges.rows[0].monitor_select, true);

  assert.equal(typeof store.append, "undefined");
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.search, "undefined");
  assert.equal(typeof store.export, "undefined");
  assert.equal(typeof store.retain, "undefined");
  assert.equal(typeof store.purge, "undefined");
  assert.equal(typeof store.authorize, "undefined");
});
