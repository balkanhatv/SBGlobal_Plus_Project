import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresIdentityDatabase } from "../../dist/server/database/postgres-identity-database.js";
import { PostgresApiCredentialVerificationMaterialStore } from "../../dist/server/identity/postgres-api-credential-verification-material-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_api_credential_verify_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const prefixSeed = randomBytes(8).toString("hex");
const prefixes = {
  core: "core-" + prefixSeed,
  industry: "industry-" + prefixSeed,
  platform: "platform-" + prefixSeed,
  expired: "expired-" + prefixSeed,
  missing: "missing-" + prefixSeed,
};
const f = Object.fromEntries([
  "home",
  "tenant",
  "industryA",
  "industryB",
  "tenantPrincipal",
  "platformPrincipal",
  "coreCredential",
  "industryCredential",
  "platformCredential",
  "expiredCredential",
  "profileCore",
  "profileIndustry",
  "profileExpired",
].map((key) => [key, randomUUID()]));

let pool;
let database;
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
      "CREATE ROLE " + role
        + " LOGIN PASSWORD '" + password
        + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await setup.query("GRANT sbg_identity_service_rw TO " + role);

    await setup.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-APICRED-VERIFY','IN','SHARED','ACTIVE')`,
      [f.home],
    );
    await setup.query(
      `INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
       VALUES ($1::uuid,$1::uuid::text,'API Credential verifier fixture',
         'API Credential verifier fixture','ACTIVE','RTL',$2::uuid,
         'IN-APICRED-VERIFY',now(),now())`,
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
       VALUES ($1::uuid,'API_CLIENT','ACTIVE','Tenant API verifier client',1,now(),now())`,
      [f.tenantPrincipal],
    );
    await setup.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,auth_epoch,service_code,owning_module,
         allowed_scope_classes,created_at,updated_at)
       VALUES ($1::uuid,'SERVICE','ACTIVE','Platform verifier service',1,
         'PLATFORM_VERIFY_SERVICE','Identity',
         ARRAY['PLATFORM_GLOBAL']::text[],now(),now())`,
      [f.platformPrincipal],
    );

    await setup.query(
      `INSERT INTO core_identity.api_credential
        (id,tenant_id,industry_context_id,principal_id,key_prefix,secret_hash,status,
         permission_profile_id,expires_at,last_used_at,allowed_cidrs,credential_version,
         created_at,revoked_at,allowed_industry_context_ids)
       VALUES
        ($1::uuid,$5::uuid,NULL,$6::uuid,$9,'argon2id$opaque-core','ACTIVE',
         $8::uuid,NULL,now()-interval '1 hour',
         ARRAY['10.0.0.0/8'::cidr],'-9223372036854775808'::bigint,
         now()-interval '10 days',NULL,ARRAY[$7::uuid]::uuid[]),
        ($2::uuid,$5::uuid,$7::uuid,$6::uuid,$10,'opaque-industry-hash','SUSPENDED',
         NULL,NULL,NULL,NULL,0::bigint,
         now()-interval '5 days',NULL,ARRAY[$7::uuid]::uuid[]),
        ($3::uuid,NULL,NULL,$12::uuid,$11,'opaque-platform-hash','REVOKED',
         NULL,NULL,NULL,ARRAY[]::cidr[],'9223372036854775807'::bigint,
         now()-interval '30 days',now()-interval '2 days',ARRAY[]::uuid[]),
        ($4::uuid,$5::uuid,NULL,$6::uuid,$13,'opaque-expired-hash','EXPIRED',
         $14::uuid,now()-interval '1 day',NULL,NULL,7::bigint,
         now()-interval '20 days',NULL,ARRAY[]::uuid[])`,
      [
        f.coreCredential,
        f.industryCredential,
        f.platformCredential,
        f.expiredCredential,
        f.tenant,
        f.tenantPrincipal,
        f.industryA,
        f.profileCore,
        prefixes.core,
        prefixes.industry,
        prefixes.platform,
        f.platformPrincipal,
        prefixes.expired,
        f.profileExpired,
      ],
    );
  });

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role;
  url.password = password;
  pool = new pg.Pool({
    connectionString: url.toString(),
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  database = new PostgresIdentityDatabase(pool);
  store = new PostgresApiCredentialVerificationMaterialStore(database);
});

after(async () => {
  if (pool) await pool.end();
  try {
    await adminTransaction(async (cleanup) => {
      await cleanup.query(
        "DELETE FROM core_identity.api_credential WHERE id=ANY($1::uuid[])",
        [[f.coreCredential,f.industryCredential,f.platformCredential,f.expiredCredential]],
      );
      await cleanup.query(
        "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
        [[f.tenantPrincipal,f.platformPrincipal]],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
        [[f.industryA,f.industryB]],
      );
      await cleanup.query("DELETE FROM core_tenancy.tenant WHERE id=$1::uuid", [f.tenant]);
      await cleanup.query("DELETE FROM platform_directory.data_home WHERE id=$1::uuid", [f.home]);
      await cleanup.query("DROP ROLE IF EXISTS " + role);
    });
  } finally {
    await admin.end();
  }
});

test("APICRED-VERIFY-PG-001 exact unique prefix returns opaque verifier material and Tenant-Core scope evidence", async () => {
  const row = await store.loadByKeyPrefix({keyPrefix: prefixes.core});
  assert.ok(row);
  assert.equal(row.id, f.coreCredential);
  assert.equal(row.tenantId, f.tenant);
  assert.equal(row.industryContextId, undefined);
  assert.equal(row.principalId, f.tenantPrincipal);
  assert.equal(row.keyPrefix, prefixes.core);
  assert.equal(row.secretHash, "argon2id$opaque-core");
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.permissionProfileId, f.profileCore);
  assert.deepEqual(row.allowedIndustryContextIds, [f.industryA]);
  assert.equal(Object.isFrozen(row), true);
});

test("APICRED-VERIFY-PG-002 Tenant-Industry candidate preserves exact Industry and allowed-Industry evidence", async () => {
  const row = await store.loadByKeyPrefix({keyPrefix: prefixes.industry});
  assert.ok(row);
  assert.equal(row.tenantId, f.tenant);
  assert.equal(row.industryContextId, f.industryA);
  assert.deepEqual(row.allowedIndustryContextIds, [f.industryA]);
  assert.equal(row.status, "SUSPENDED");
});

test("APICRED-VERIFY-PG-003 PLATFORM_GLOBAL service material is readable only through the fixed Identity boundary", async () => {
  const row = await store.loadByKeyPrefix({keyPrefix: prefixes.platform});
  assert.ok(row);
  assert.equal(row.tenantId, undefined);
  assert.equal(row.industryContextId, undefined);
  assert.equal(row.principalId, f.platformPrincipal);

  const p = await database.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_identity.api_credential','SELECT') AS identity_select,
            has_table_privilege('sbg_app_rw','core_identity.api_credential','SELECT') AS app_select`,
  ));
  assert.equal(p.rows[0].user_name, "sbg_identity_service_rw");
  assert.equal(p.rows[0].identity_select, true);
  assert.equal(p.rows[0].app_select, false);
});

test("APICRED-VERIFY-PG-004 suspended, revoked, and expired candidates remain raw material without authentication decision", async () => {
  const suspended = await store.loadByKeyPrefix({keyPrefix: prefixes.industry});
  const revoked = await store.loadByKeyPrefix({keyPrefix: prefixes.platform});
  const expired = await store.loadByKeyPrefix({keyPrefix: prefixes.expired});

  assert.equal(suspended?.status, "SUSPENDED");
  assert.equal(revoked?.status, "REVOKED");
  assert.ok(revoked?.revokedAt);
  assert.equal(expired?.status, "EXPIRED");
  assert.ok(Date.parse(expired.expiresAt) < Date.now());
  assert.equal("usable" in suspended, false);
  assert.equal("authenticated" in suspended, false);
});

test("APICRED-VERIFY-PG-005 nullable CIDR and signed bigint credential-version evidence remain lossless", async () => {
  const core = await store.loadByKeyPrefix({keyPrefix: prefixes.core});
  const industry = await store.loadByKeyPrefix({keyPrefix: prefixes.industry});
  const platform = await store.loadByKeyPrefix({keyPrefix: prefixes.platform});

  assert.deepEqual(core?.allowedCidrs, ["10.0.0.0/8"]);
  assert.equal(industry?.allowedCidrs, undefined);
  assert.deepEqual(platform?.allowedCidrs, []);
  assert.equal(core?.credentialVersion, "-9223372036854775808");
  assert.equal(industry?.credentialVersion, "0");
  assert.equal(platform?.credentialVersion, "9223372036854775807");
});

test("APICRED-VERIFY-PG-006 unknown exact prefix returns null and the source prefix index is unique", async () => {
  assert.equal(await store.loadByKeyPrefix({keyPrefix: prefixes.missing}), null);

  const q = await database.transaction((tx) => tx.query(
    `SELECT idx.indisunique AS is_unique
       FROM pg_class table_rel
       JOIN pg_namespace ns ON ns.oid=table_rel.relnamespace
       JOIN pg_index idx ON idx.indrelid=table_rel.oid
       JOIN pg_class index_rel ON index_rel.oid=idx.indexrelid
      WHERE ns.nspname='core_identity'
        AND table_rel.relname='api_credential'
        AND index_rel.relname='api_credential_key_prefix_uq'`,
  ));
  assert.equal(q.rowCount, 1);
  assert.equal(q.rows[0].is_unique, true);
});

test("APICRED-VERIFY-PG-007 verification-material source remains internal/read-only and does not become the machine verifier", async () => {
  assert.equal(typeof store.verify, "undefined");
  assert.equal(typeof store.authenticate, "undefined");
  assert.equal(typeof store.compareHash, "undefined");
  assert.equal(typeof store.enforceCidr, "undefined");
  assert.equal(typeof store.updateLastUsed, "undefined");
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.rotate, "undefined");
  assert.equal(typeof store.revoke, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.search, "undefined");
});
