import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import pg from "pg";
import { PostgresIdentityDatabase } from "../../dist/server/database/postgres-identity-database.js";
import { PostgresIdentitySecurityStore } from "../../dist/server/identity/postgres-identity-security-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL, "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");
const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const role = `sbg_identity_test_${randomBytes(8).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries(["home","tenant","industry","principal","membership","link","sessionDevice"].map((key) => [key, randomUUID()]));
let pool, store;

async function adminTransaction(work) {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await work(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

before(async () => {
  await adminTransaction(async (setup) => {
    await setup.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
    await setup.query(`GRANT sbg_identity_service_rw TO ${role}`);
    await setup.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES ($1::uuid,$1::uuid::text,'IN-TEST','IN','SHARED','ACTIVE')`, [f.home]);
    await setup.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
      VALUES ($1::uuid,$1::uuid::text,'Identity fixture','Identity fixture','ACTIVE','RTL',$2,'IN-TEST',now(),now())`,
      [f.tenant,f.home]);
    await setup.query(`INSERT INTO core_tenancy.industry_context
      (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
      VALUES ($1,$2,'RTL','ACTIVE',true,now(),now())`, [f.industry,f.tenant]);
    await setup.query(`INSERT INTO core_identity.platform_principal
      (id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
      VALUES ($1,'HUMAN','ACTIVE','Identity fixture',2,now(),now())`, [f.principal]);
    await setup.query(`INSERT INTO core_identity.tenant_membership
      (id,tenant_id,principal_id,status,created_at,updated_at)
      VALUES ($1,$2,$3,'ACTIVE',now(),now())`, [f.membership,f.tenant,f.principal]);
    await setup.query(`INSERT INTO core_identity.identity_provider_link
      (id,principal_id,provider,provider_subject,tenant_hint,created_at,status)
      VALUES ($1,$2,'CLERK','user_identity_fixture',$3,now(),'ACTIVE')`, [f.link,f.principal,f.tenant]);
    await setup.query(`INSERT INTO core_identity.session_version
      (principal_id,tenant_id,version,changed_at,reason_code)
      VALUES ($1,$2,6,now()-interval '1 hour','FIXTURE')`, [f.principal,f.tenant]);
    await setup.query(`INSERT INTO core_identity.device_registration
      (id,tenant_id,principal_id,device_fingerprint_hash,platform,status,risk_level,registration_version,created_at,updated_at)
      VALUES ($1,$2,$3,'hash','WEB','TRUSTED','LOW',5,now(),now())`, [f.sessionDevice,f.tenant,f.principal]);
  });

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role;
  url.password = password;
  pool = new pg.Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000 });
  store = new PostgresIdentitySecurityStore(new PostgresIdentityDatabase(pool));
});

after(async () => {
  if (pool) await pool.end();
  try {
    await adminTransaction(async (cleanup) => {
      await cleanup.query("DELETE FROM core_identity.device_registration WHERE id=$1", [f.sessionDevice]);
      await cleanup.query("DELETE FROM core_identity.session_version WHERE principal_id=$1 AND tenant_id=$2", [f.principal,f.tenant]);
      await cleanup.query("DELETE FROM core_identity.identity_provider_link WHERE id=$1", [f.link]);
      await cleanup.query("DELETE FROM core_identity.tenant_membership WHERE id=$1", [f.membership]);
      await cleanup.query("DELETE FROM core_identity.platform_principal WHERE id=$1", [f.principal]);
      await cleanup.query("DELETE FROM core_tenancy.industry_context WHERE id=$1", [f.industry]);
      await cleanup.query("DELETE FROM core_tenancy.tenant WHERE id=$1", [f.tenant]);
      await cleanup.query("DELETE FROM platform_directory.data_home WHERE id=$1", [f.home]);
      await cleanup.query(`DROP ROLE IF EXISTS ${role}`);
    });
  } finally { await admin.end(); }
});

test("real identity-service role resolves provider identity without application Tenant context", async () => {
  const identity = await store.resolveHumanProviderIdentity({
    provider: "CLERK", providerSubject: "user_identity_fixture",
  });
  assert.deepEqual(identity, {
    principalId: f.principal, principalType: "HUMAN", authEpoch: 2,
  });
});

test("real identity-service role reads exact tenant session epoch and device security row", async () => {
  const session = await store.getSessionVersion({ principalId: f.principal, tenantId: f.tenant });
  assert.equal(session.version, 6);
  assert.ok(Number.isFinite(session.changedAtMs));
  const device = await store.getDeviceRegistration({
    deviceId: f.sessionDevice, principalId: f.principal, tenantId: f.tenant,
  });
  assert.equal(device.status, "TRUSTED");
  assert.equal(device.registrationVersion, 5);
});
