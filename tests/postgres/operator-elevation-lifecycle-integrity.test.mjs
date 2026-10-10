import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const f = Object.fromEntries([
  "home",
  "tenant",
  "otherTenant",
  "industry",
  "otherIndustry",
  "otherTenantIndustry",
  "operator",
].map((key) => [key, randomUUID()]));

async function committed(work) {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await work(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function rolledBack(work) {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    return await work(client);
  } finally {
    await client.query("ROLLBACK").catch(() => undefined);
    client.release();
  }
}

function row(overrides = {}) {
  const createdAt = new Date(Date.now() - 120_000);
  return {
    id: randomUUID(),
    tenantId: f.tenant,
    industryContextId: null,
    startsAt: new Date(createdAt.getTime() + 30_000).toISOString(),
    expiresAt: new Date(createdAt.getTime() + 3_600_000).toISOString(),
    status: "PENDING",
    createdAt: createdAt.toISOString(),
    revokedAt: null,
    ...overrides,
  };
}

async function insertElevation(client, value) {
  return client.query(
    `INSERT INTO core_authz.operator_elevation
      (id,operator_principal_id,tenant_id,industry_context_id,purpose_code,
       ticket_reference,approved_by,starts_at,expires_at,status,
       permission_profile_id,created_at,revoked_at)
     VALUES
      ($1::uuid,$2::uuid,$3::uuid,$4::uuid,'SUPPORT','DD156',NULL,
       $5::timestamptz,$6::timestamptz,$7,$8::uuid,$9::timestamptz,$10::timestamptz)
     RETURNING id::text,status,tenant_id::text,industry_context_id::text,
               starts_at,expires_at,created_at,revoked_at`,
    [
      value.id,
      f.operator,
      value.tenantId,
      value.industryContextId,
      value.startsAt,
      value.expiresAt,
      value.status,
      randomUUID(),
      value.createdAt,
      value.revokedAt,
    ],
  );
}

before(async () => {
  await committed(async (setup) => {
    await setup.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-OPELEV-LIFE','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
       VALUES
        ($1::uuid,$1::uuid::text,'Elevation lifecycle tenant',
         'Elevation lifecycle tenant','ACTIVE','RTL',$3::uuid,
         'IN-OPELEV-LIFE',now(),now()),
        ($2::uuid,$2::uuid::text,'Elevation lifecycle other tenant',
         'Elevation lifecycle other tenant','ACTIVE','RTL',$3::uuid,
         'IN-OPELEV-LIFE',now(),now())`,
      [f.tenant, f.otherTenant, f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
       VALUES
        ($1::uuid,$3::uuid,'RTL','ACTIVE',true,now(),now()),
        ($2::uuid,$3::uuid,'MFG','ACTIVE',false,now(),now()),
        ($4::uuid,$5::uuid,'RTL','ACTIVE',true,now(),now())`,
      [f.industry, f.otherIndustry, f.tenant, f.otherTenantIndustry, f.otherTenant],
    );

    await setup.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
       VALUES ($1::uuid,'PLATFORM_OPERATOR','ACTIVE','Lifecycle operator',1,now(),now())`,
      [f.operator],
    );
  });
});

after(async () => {
  try {
    await committed(async (cleanup) => {
      await cleanup.query(
        "DELETE FROM core_authz.operator_elevation WHERE operator_principal_id=$1::uuid",
        [f.operator],
      );
      await cleanup.query(
        "DELETE FROM core_identity.platform_principal WHERE id=$1::uuid",
        [f.operator],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
        [[f.industry, f.otherIndustry, f.otherTenantIndustry]],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
        [[f.tenant, f.otherTenant]],
      );
      await cleanup.query(
        "DELETE FROM platform_directory.data_home WHERE id=$1::uuid",
        [f.home],
      );
    });
  } finally {
    await admin.end();
  }
});

test("OPELEV-LIFE-PG-001 valid PENDING elevation with ordered time window persists", async () => {
  await rolledBack(async (client) => {
    const value = row();
    const result = await insertElevation(client, value);
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].id, value.id);
    assert.equal(result.rows[0].status, "PENDING");
  });
});

test("OPELEV-LIFE-PG-002 equal or reversed start/expiry is rejected", async () => {
  const instant = new Date().toISOString();
  await rolledBack(async (client) => {
    await assert.rejects(
      insertElevation(client, row({startsAt: instant, expiresAt: instant})),
      /operator_elevation.*check|violates check constraint/i,
    );
  });

  await rolledBack(async (client) => {
    await assert.rejects(
      insertElevation(client, row({
        startsAt: new Date(Date.now() + 60_000).toISOString(),
        expiresAt: new Date().toISOString(),
      })),
      /operator_elevation.*check|violates check constraint/i,
    );
  });
});

test("OPELEV-LIFE-PG-003 revoked_at before created_at is rejected", async () => {
  const createdAt = new Date();
  await rolledBack(async (client) => {
    await assert.rejects(
      insertElevation(client, row({
        createdAt: createdAt.toISOString(),
        revokedAt: new Date(createdAt.getTime() - 1).toISOString(),
      })),
      /operator_elevation.*check|violates check constraint/i,
    );
  });
});

test("OPELEV-LIFE-PG-004 REVOKED without revoked_at is rejected", async () => {
  await rolledBack(async (client) => {
    await assert.rejects(
      insertElevation(client, row({status: "REVOKED", revokedAt: null})),
      /operator_elevation.*check|violates check constraint/i,
    );
  });
});

test("OPELEV-LIFE-PG-005 REVOKED with revoked_at at or after created_at persists", async () => {
  await rolledBack(async (client) => {
    const createdAt = new Date(Date.now() - 120_000);
    const value = row({
      status: "REVOKED",
      createdAt: createdAt.toISOString(),
      revokedAt: createdAt.toISOString(),
    });
    const result = await insertElevation(client, value);
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].status, "REVOKED");
    assert.ok(result.rows[0].revoked_at);
  });
});

test("OPELEV-LIFE-PG-006 persisted Tenant ownership is immutable", async () => {
  await rolledBack(async (client) => {
    const value = row();
    await insertElevation(client, value);
    await assert.rejects(
      client.query(
        "UPDATE core_authz.operator_elevation SET tenant_id=$1::uuid WHERE id=$2::uuid",
        [f.otherTenant, value.id],
      ),
      /immutable ownership\/scope column tenant_id cannot change/i,
    );
  });
});

test("OPELEV-LIFE-PG-007 persisted Industry ownership is immutable", async () => {
  await rolledBack(async (client) => {
    const value = row({industryContextId: f.industry});
    await insertElevation(client, value);
    await assert.rejects(
      client.query(
        "UPDATE core_authz.operator_elevation SET industry_context_id=$1::uuid WHERE id=$2::uuid",
        [f.otherIndustry, value.id],
      ),
      /immutable ownership\/scope column industry_context_id cannot change/i,
    );
  });
});
