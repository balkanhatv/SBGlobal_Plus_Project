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
  "industry",
  "operator",
  "operatorInactive",
  "human",
  "approverOperator",
  "approverService",
  "approverInactive",
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
  return {
    id: randomUUID(),
    operatorPrincipalId: f.operator,
    approvedBy: f.approverOperator,
    status: "ACTIVE",
    startsAt: new Date(Date.now() - 60_000).toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    permissionProfileId: randomUUID(),
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
      ($1::uuid,$2::uuid,$3::uuid,NULL,'SUPPORT','DD154',
       $4::uuid,$5::timestamptz,$6::timestamptz,$7,$8::uuid,now(),NULL)
     RETURNING id::text,status,approved_by::text`,
    [
      value.id,
      value.operatorPrincipalId,
      f.tenant,
      value.approvedBy ?? null,
      value.startsAt,
      value.expiresAt,
      value.status,
      value.permissionProfileId,
    ],
  );
}

before(async () => {
  await committed(async (setup) => {
    await setup.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-OPELEV-REL','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
       VALUES ($1::uuid,$1::uuid::text,'Operator elevation integrity fixture',
         'Operator elevation integrity fixture','ACTIVE','RTL',$2::uuid,
         'IN-OPELEV-REL',now(),now())`,
      [f.tenant, f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
       VALUES ($1::uuid,$2::uuid,'RTL','ACTIVE',true,now(),now())`,
      [f.industry, f.tenant],
    );

    await setup.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,auth_epoch,service_code,owning_module,
         allowed_scope_classes,created_at,updated_at)
       VALUES
        ($1::uuid,'PLATFORM_OPERATOR','ACTIVE','Operator active',1,NULL,NULL,NULL,now(),now()),
        ($2::uuid,'PLATFORM_OPERATOR','SUSPENDED','Operator inactive',1,NULL,NULL,NULL,now(),now()),
        ($3::uuid,'HUMAN','ACTIVE','Human principal',1,NULL,NULL,NULL,now(),now()),
        ($4::uuid,'PLATFORM_OPERATOR','ACTIVE','Operator approver',1,NULL,NULL,NULL,now(),now()),
        ($5::uuid,'SERVICE','ACTIVE','Service approver',1,'DD154_APPROVER','Authorization',
         ARRAY['PLATFORM_GLOBAL'],now(),now()),
        ($6::uuid,'PLATFORM_OPERATOR','SUSPENDED','Inactive approver',1,NULL,NULL,NULL,now(),now())`,
      [
        f.operator,
        f.operatorInactive,
        f.human,
        f.approverOperator,
        f.approverService,
        f.approverInactive,
      ],
    );
  });
});

after(async () => {
  try {
    await committed(async (cleanup) => {
      await cleanup.query(
        "DELETE FROM core_authz.operator_elevation WHERE tenant_id=$1::uuid",
        [f.tenant],
      );
      await cleanup.query(
        "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
        [[
          f.operator,
          f.operatorInactive,
          f.human,
          f.approverOperator,
          f.approverService,
          f.approverInactive,
        ]],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.industry_context WHERE id=$1::uuid",
        [f.industry],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.tenant WHERE id=$1::uuid",
        [f.tenant],
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

test("OPELEV-REL-PG-001 ACTIVE PLATFORM_OPERATOR with distinct active PLATFORM_OPERATOR approver is accepted", async () => {
  await rolledBack(async (client) => {
    const value = row();
    const result = await insertElevation(client, value);
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].id, value.id);
    assert.equal(result.rows[0].status, "ACTIVE");
    assert.equal(result.rows[0].approved_by, f.approverOperator);
  });
});

test("OPELEV-REL-PG-002 ACTIVE PLATFORM_OPERATOR with distinct active SERVICE approver is accepted", async () => {
  await rolledBack(async (client) => {
    const value = row({approvedBy: f.approverService});
    const result = await insertElevation(client, value);
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].approved_by, f.approverService);
  });
});

test("OPELEV-REL-PG-003 ACTIVE elevation with NULL approver is rejected", async () => {
  await rolledBack(async (client) => {
    await assert.rejects(
      insertElevation(client, row({approvedBy: null})),
      /active operator elevation requires an independent active approver/,
    );
  });
});

test("OPELEV-REL-PG-004 ACTIVE self-approval is rejected", async () => {
  await rolledBack(async (client) => {
    await assert.rejects(
      insertElevation(client, row({approvedBy: f.operator})),
      /active operator elevation requires an independent active approver/,
    );
  });
});

test("OPELEV-REL-PG-005 ACTIVE elevation with inactive approver is rejected", async () => {
  await rolledBack(async (client) => {
    await assert.rejects(
      insertElevation(client, row({approvedBy: f.approverInactive})),
      /active operator elevation requires an independent active approver/,
    );
  });
});

test("OPELEV-REL-PG-006 non-PLATFORM_OPERATOR or inactive operator principal is rejected", async () => {
  for (const operatorPrincipalId of [f.human, f.operatorInactive]) {
    await rolledBack(async (client) => {
      await assert.rejects(
        insertElevation(client, row({
          operatorPrincipalId,
          status: "PENDING",
          approvedBy: null,
        })),
        /operator elevation requires an active platform operator/,
      );
    });
  }
});

test("OPELEV-REL-PG-007 PENDING may be unapproved but promotion to ACTIVE requires independent active approver", async () => {
  await rolledBack(async (client) => {
    const value = row({status: "PENDING", approvedBy: null});
    const inserted = await insertElevation(client, value);
    assert.equal(inserted.rowCount, 1);
    assert.equal(inserted.rows[0].status, "PENDING");
    assert.equal(inserted.rows[0].approved_by, null);

    await assert.rejects(
      client.query(
        "UPDATE core_authz.operator_elevation SET status='ACTIVE' WHERE id=$1::uuid",
        [value.id],
      ),
      /active operator elevation requires an independent active approver/,
    );
  });
});
