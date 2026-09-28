import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresControlPlaneDatabase } from "../../dist/server/database/postgres-control-plane-database.js";
import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { PostgresOperatorElevationMetadataStore } from "../../dist/server/authorization/postgres-operator-elevation-metadata-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const controlRole = "sbg_operator_elev_cp_" + randomBytes(8).toString("hex");
const appRole = "sbg_operator_elev_app_" + randomBytes(8).toString("hex");
const controlPassword = randomBytes(24).toString("hex");
const appPassword = randomBytes(24).toString("hex");

const f = Object.fromEntries([
  "home",
  "tenant",
  "industryA",
  "industryB",
  "operator",
  "approver",
  "coreActive",
  "industryPending",
  "expired",
  "revoked",
  "missing",
  "profileCore",
  "profileIndustry",
  "profileExpired",
  "profileRevoked",
].map((key) => [key, randomUUID()]));

let controlPool;
let appPool;
let controlDatabase;
let appDatabase;
let store;

async function adminTransaction(work) {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await work(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

before(async () => {
  await adminTransaction(async (setup) => {
    await setup.query(
      "CREATE ROLE " + controlRole
        + " LOGIN PASSWORD '" + controlPassword
        + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await setup.query(
      "CREATE ROLE " + appRole
        + " LOGIN PASSWORD '" + appPassword
        + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await setup.query("GRANT sbg_control_plane_rw TO " + controlRole);
    await setup.query("GRANT sbg_app_rw TO " + appRole);

    await setup.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-OPELEV-META','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
       VALUES ($1::uuid,$1::uuid::text,'Operator elevation fixture',
         'Operator elevation fixture','ACTIVE','RTL',$2::uuid,
         'IN-OPELEV-META',now(),now())`,
      [f.tenant, f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
       VALUES
        ($1::uuid,$3::uuid,'RTL','ACTIVE',true,now(),now()),
        ($2::uuid,$3::uuid,'MFG','ACTIVE',false,now(),now())`,
      [f.industryA, f.industryB, f.tenant],
    );

    await setup.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
       VALUES
        ($1::uuid,'PLATFORM_OPERATOR','ACTIVE','Operator fixture',1,now(),now()),
        ($2::uuid,'PLATFORM_OPERATOR','ACTIVE','Approver fixture',1,now(),now())`,
      [f.operator, f.approver],
    );

    await setup.query(
      `INSERT INTO core_authz.operator_elevation
        (id,operator_principal_id,tenant_id,industry_context_id,purpose_code,
         ticket_reference,approved_by,starts_at,expires_at,status,
         permission_profile_id,created_at,revoked_at)
       VALUES
        ($1::uuid,$5::uuid,$6::uuid,NULL,'SUPPORT','INC-100',$7::uuid,
         now()-interval '1 hour',now()+interval '1 hour','ACTIVE',
         $9::uuid,now()-interval '2 hours',NULL),
        ($2::uuid,$5::uuid,$6::uuid,$8::uuid,'',NULL,NULL,
         now()+interval '2 hours',now()+interval '4 hours','PENDING',
         $10::uuid,now()-interval '1 day',NULL),
        ($3::uuid,$5::uuid,$6::uuid,NULL,'FORENSICS','CASE-OLD',$7::uuid,
         now()-interval '10 days',now()-interval '9 days','EXPIRED',
         $11::uuid,now()-interval '11 days',NULL),
        ($4::uuid,$5::uuid,$6::uuid,$8::uuid,'INCIDENT','INC-REVOKED',$7::uuid,
         now()-interval '3 days',now()+interval '3 days','REVOKED',
         $12::uuid,now()-interval '4 days',now()-interval '1 day')`,
      [
        f.coreActive,
        f.industryPending,
        f.expired,
        f.revoked,
        f.operator,
        f.tenant,
        f.approver,
        f.industryA,
        f.profileCore,
        f.profileIndustry,
        f.profileExpired,
        f.profileRevoked,
      ],
    );
  });

  const baseUrl = new URL(process.env.SBG_POSTGRES_TEST_URL);

  const controlUrl = new URL(baseUrl.toString());
  controlUrl.username = controlRole;
  controlUrl.password = controlPassword;
  controlPool = new pg.Pool({
    connectionString: controlUrl.toString(),
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  controlDatabase = new PostgresControlPlaneDatabase(controlPool);
  store = new PostgresOperatorElevationMetadataStore(controlDatabase);

  const appUrl = new URL(baseUrl.toString());
  appUrl.username = appRole;
  appUrl.password = appPassword;
  appPool = new pg.Pool({
    connectionString: appUrl.toString(),
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  appDatabase = new PostgresDatabase(appPool);
});

after(async () => {
  if (controlPool) await controlPool.end();
  if (appPool) await appPool.end();

  try {
    await adminTransaction(async (cleanup) => {
      await cleanup.query(
        "DELETE FROM core_authz.operator_elevation WHERE id=ANY($1::uuid[])",
        [[f.coreActive,f.industryPending,f.expired,f.revoked]],
      );
      await cleanup.query(
        "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
        [[f.operator,f.approver]],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
        [[f.industryA,f.industryB]],
      );
      await cleanup.query("DELETE FROM core_tenancy.tenant WHERE id=$1::uuid", [f.tenant]);
      await cleanup.query("DELETE FROM platform_directory.data_home WHERE id=$1::uuid", [f.home]);
      await cleanup.query("DROP ROLE IF EXISTS " + controlRole);
      await cleanup.query("DROP ROLE IF EXISTS " + appRole);
    });
  } finally {
    await admin.end();
  }
});

test("OPELEV-META-PG-001 exact Tenant-Core elevation preserves raw ownership, purpose, profile, and time evidence", async () => {
  const row = await store.loadById({operatorElevationId: f.coreActive});

  assert.ok(row);
  assert.equal(row.id, f.coreActive);
  assert.equal(row.operatorPrincipalId, f.operator);
  assert.equal(row.tenantId, f.tenant);
  assert.equal(row.industryContextId, undefined);
  assert.equal(row.purposeCode, "SUPPORT");
  assert.equal(row.ticketReference, "INC-100");
  assert.equal(row.approvedBy, f.approver);
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.permissionProfileId, f.profileCore);
  assert.ok(Date.parse(row.startsAt) < Date.parse(row.expiresAt));
  assert.equal(row.revokedAt, undefined);
  assert.equal(Object.isFrozen(row), true);
});

test("OPELEV-META-PG-002 exact Tenant-Industry target stays raw and does not create sibling or cross-context authority", async () => {
  const row = await store.loadById({operatorElevationId: f.industryPending});

  assert.ok(row);
  assert.equal(row.tenantId, f.tenant);
  assert.equal(row.industryContextId, f.industryA);
  assert.equal(row.permissionProfileId, f.profileIndustry);
  assert.equal("allowedIndustryContextIds" in row, false);
  assert.equal("sourceIndustryContextId" in row, false);
  assert.equal("targetIndustryContextId" in row, false);
});

test("OPELEV-META-PG-003 future PENDING, EXPIRED, and REVOKED rows remain historical/control-plane metadata", async () => {
  const pending = await store.loadById({operatorElevationId: f.industryPending});
  const expired = await store.loadById({operatorElevationId: f.expired});
  const revoked = await store.loadById({operatorElevationId: f.revoked});

  assert.equal(pending?.status, "PENDING");
  assert.ok(Date.parse(pending.startsAt) > Date.now());
  assert.equal(expired?.status, "EXPIRED");
  assert.ok(Date.parse(expired.expiresAt) < Date.now());
  assert.equal(revoked?.status, "REVOKED");
  assert.ok(revoked.revokedAt);
  assert.equal("usable" in pending, false);
  assert.equal("current" in pending, false);
  assert.equal("authorized" in pending, false);
});

test("OPELEV-META-PG-004 nullable approver/ticket/revocation and empty purpose remain raw evidence", async () => {
  const row = await store.loadById({operatorElevationId: f.industryPending});

  assert.ok(row);
  assert.equal(row.purposeCode, "");
  assert.equal(row.ticketReference, undefined);
  assert.equal(row.approvedBy, undefined);
  assert.equal(row.revokedAt, undefined);
});

test("OPELEV-META-PG-005 fixed Control Plane role reads metadata while ordinary app visibility stays closed without elevation scope", async () => {
  const control = await controlDatabase.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_authz.operator_elevation','SELECT') AS can_select,
            has_table_privilege(current_user,'core_authz.operator_elevation','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_authz.operator_elevation','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_authz.operator_elevation','DELETE') AS can_delete`,
  ));
  assert.equal(control.rows[0].user_name, "sbg_control_plane_rw");
  assert.equal(control.rows[0].can_select, true);
  assert.equal(control.rows[0].can_insert, true);
  assert.equal(control.rows[0].can_update, true);
  assert.equal(control.rows[0].can_delete, true);

  const app = await appDatabase.transaction((tx) => tx.query(
    "SELECT id::text FROM core_authz.operator_elevation WHERE id=$1::uuid",
    [f.coreActive],
  ));
  assert.equal(app.rowCount, 0);
});

test("OPELEV-META-PG-006 missing exact id returns null and malformed id fails before SQL", async () => {
  assert.equal(
    await store.loadById({operatorElevationId: f.missing}),
    null,
  );
  await assert.rejects(
    store.loadById({operatorElevationId: "not-a-uuid"}),
  );
});

test("OPELEV-META-PG-007 Control Plane schema DML does not become DD-146 mutation, approval, or authorization authority", async () => {
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.approve, "undefined");
  assert.equal(typeof store.activate, "undefined");
  assert.equal(typeof store.revoke, "undefined");
  assert.equal(typeof store.expire, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.search, "undefined");
  assert.equal(typeof store.authorize, "undefined");
  assert.equal(typeof store.resolvePermissionProfile, "undefined");
});
