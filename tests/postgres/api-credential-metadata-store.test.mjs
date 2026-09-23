import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresIdentityDatabase } from "../../dist/server/database/postgres-identity-database.js";
import { PostgresApiCredentialMetadataStore } from "../../dist/server/identity/postgres-api-credential-metadata-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_api_credential_meta_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home",
  "tenant",
  "industryA",
  "industryB",
  "tenantPrincipal",
  "platformPrincipal",
  "tenantCoreCredential",
  "tenantIndustryCredential",
  "platformCredential",
  "missingCredential",
  "permissionProfile",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-APICRED-META','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
       VALUES ($1::uuid,$1::uuid::text,'API Credential metadata fixture',
         'API Credential metadata fixture','ACTIVE','RTL',$2::uuid,
         'IN-APICRED-META',now(),now())`,
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
       VALUES ($1::uuid,'API_CLIENT','ACTIVE','Tenant API client',1,now(),now())`,
      [f.tenantPrincipal],
    );

    await setup.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,auth_epoch,service_code,owning_module,
         allowed_scope_classes,created_at,updated_at)
       VALUES ($1::uuid,'SERVICE','ACTIVE','Platform API service',1,
         'PLATFORM_API_SERVICE','Identity',ARRAY['PLATFORM_GLOBAL']::text[],now(),now())`,
      [f.platformPrincipal],
    );

    await setup.query(
      `INSERT INTO core_identity.api_credential
        (id,tenant_id,industry_context_id,principal_id,key_prefix,secret_hash,status,
         permission_profile_id,expires_at,last_used_at,allowed_cidrs,credential_version,
         created_at,revoked_at,allowed_industry_context_ids)
       VALUES
        ($1::uuid,$4::uuid,NULL,$5::uuid,'','argon2id$tenant-core','ACTIVE',
         $8::uuid,NULL,now()-interval '2 hours',
         ARRAY['10.0.0.0/8'::cidr,'2001:db8::/32'::cidr],
         '-9223372036854775808'::bigint,now()-interval '10 days',NULL,
         ARRAY[$6::uuid,$7::uuid]::uuid[]),
        ($2::uuid,$4::uuid,$6::uuid,$5::uuid,'industry-prefix',
         'argon2id$tenant-industry','SUSPENDED',NULL,now()+interval '7 days',NULL,
         ARRAY[]::cidr[],0::bigint,now()-interval '5 days',NULL,
         ARRAY[$6::uuid]::uuid[]),
        ($3::uuid,NULL,NULL,$9::uuid,'platform-prefix','argon2id$platform','REVOKED',
         NULL,NULL,NULL,ARRAY['192.0.2.0/24'::cidr],
         '9223372036854775807'::bigint,now()-interval '30 days',now()-interval '1 day',
         ARRAY[]::uuid[])`,
      [
        f.tenantCoreCredential,
        f.tenantIndustryCredential,
        f.platformCredential,
        f.tenant,
        f.tenantPrincipal,
        f.industryA,
        f.industryB,
        f.permissionProfile,
        f.platformPrincipal,
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
  store = new PostgresApiCredentialMetadataStore(database);
});

after(async () => {
  if (pool) await pool.end();

  try {
    await adminTransaction(async (cleanup) => {
      await cleanup.query(
        "DELETE FROM core_identity.api_credential WHERE id=ANY($1::uuid[])",
        [[f.tenantCoreCredential,f.tenantIndustryCredential,f.platformCredential]],
      );
      await cleanup.query(
        "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
        [[f.tenantPrincipal,f.platformPrincipal]],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
        [[f.industryA,f.industryB]],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.tenant WHERE id=$1::uuid",
        [f.tenant],
      );
      await cleanup.query(
        "DELETE FROM platform_directory.data_home WHERE id=$1::uuid",
        [f.home],
      );
      await cleanup.query("DROP ROLE IF EXISTS " + role);
    });
  } finally {
    await admin.end();
  }
});

test("APICRED-META-PG-001 exact Tenant-Core credential preserves physical ownership and raw metadata", async () => {
  const row = await store.loadById({apiCredentialId: f.tenantCoreCredential});

  assert.ok(row);
  assert.equal(row.id, f.tenantCoreCredential);
  assert.equal(row.tenantId, f.tenant);
  assert.equal(row.industryContextId, undefined);
  assert.equal(row.principalId, f.tenantPrincipal);
  assert.equal(row.keyPrefix, "");
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.permissionProfileId, f.permissionProfile);
  assert.equal(row.expiresAt, undefined);
  assert.ok(row.lastUsedAt);
  assert.deepEqual(row.allowedCidrs, ["10.0.0.0/8", "2001:db8::/32"]);
  assert.deepEqual(
    row.allowedIndustryContextIds,
    [f.industryA, f.industryB],
  );
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.allowedCidrs), true);
  assert.equal(Object.isFrozen(row.allowedIndustryContextIds), true);
});

test("APICRED-META-PG-002 Tenant-Industry credential preserves exact Industry and allowed-Industry evidence", async () => {
  const row = await store.loadById({apiCredentialId: f.tenantIndustryCredential});

  assert.ok(row);
  assert.equal(row.tenantId, f.tenant);
  assert.equal(row.industryContextId, f.industryA);
  assert.equal(row.status, "SUSPENDED");
  assert.deepEqual(row.allowedIndustryContextIds, [f.industryA]);
  assert.equal(row.expiresAt !== undefined, true);
  assert.equal(row.lastUsedAt, undefined);
});

test("APICRED-META-PG-003 PLATFORM_GLOBAL metadata is Identity-service readable while general app SELECT stays revoked", async () => {
  const row = await store.loadById({apiCredentialId: f.platformCredential});
  assert.ok(row);
  assert.equal(row.tenantId, undefined);
  assert.equal(row.industryContextId, undefined);
  assert.equal(row.principalId, f.platformPrincipal);

  const privileges = await database.transaction((tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_identity.api_credential','SELECT') AS identity_select,
            has_table_privilege('sbg_app_rw','core_identity.api_credential','SELECT') AS app_select`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_identity_service_rw");
  assert.equal(privileges.rows[0].identity_select, true);
  assert.equal(privileges.rows[0].app_select, false);
});

test("APICRED-META-PG-004 secret verifier is excluded while nullable and raw metadata remain evidence", async () => {
  const core = await store.loadById({apiCredentialId: f.tenantCoreCredential});
  const industry = await store.loadById({apiCredentialId: f.tenantIndustryCredential});
  const platform = await store.loadById({apiCredentialId: f.platformCredential});

  assert.ok(core);
  assert.ok(industry);
  assert.ok(platform);
  assert.equal("secretHash" in core, false);
  assert.equal("secret_hash" in core, false);
  assert.equal(core.keyPrefix, "");
  assert.equal(industry.permissionProfileId, undefined);
  assert.deepEqual(industry.allowedCidrs, []);
  assert.equal(platform.status, "REVOKED");
  assert.ok(platform.revokedAt);
  assert.deepEqual(platform.allowedCidrs, ["192.0.2.0/24"]);
});

test("APICRED-META-PG-005 signed bigint credential-version evidence is preserved losslessly", async () => {
  const low = await store.loadById({apiCredentialId: f.tenantCoreCredential});
  const zero = await store.loadById({apiCredentialId: f.tenantIndustryCredential});
  const high = await store.loadById({apiCredentialId: f.platformCredential});

  assert.equal(low?.credentialVersion, "-9223372036854775808");
  assert.equal(zero?.credentialVersion, "0");
  assert.equal(high?.credentialVersion, "9223372036854775807");
});

test("APICRED-META-PG-006 missing exact id returns null and malformed id fails before SQL", async () => {
  assert.equal(
    await store.loadById({apiCredentialId: f.missingCredential}),
    null,
  );
  await assert.rejects(
    store.loadById({apiCredentialId: "not-a-uuid"}),
  );
});

test("APICRED-META-PG-007 Identity schema privileges remain broader than the exact-read-only DD-145 port", async () => {
  const privileges = await database.transaction((tx) => tx.query(
    `SELECT
       has_table_privilege(current_user,'core_identity.api_credential','SELECT') AS can_select,
       has_table_privilege(current_user,'core_identity.api_credential','INSERT') AS can_insert,
       has_table_privilege(current_user,'core_identity.api_credential','UPDATE') AS can_update,
       has_table_privilege(current_user,'core_identity.api_credential','DELETE') AS can_delete`,
  ));

  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, false);

  assert.equal(typeof store.verify, "undefined");
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.rotate, "undefined");
  assert.equal(typeof store.revoke, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.search, "undefined");
  assert.equal(typeof store.authenticate, "undefined");
});
