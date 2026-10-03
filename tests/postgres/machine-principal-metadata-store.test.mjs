import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresIdentityDatabase } from "../../dist/server/database/postgres-identity-database.js";
import {
  PostgresMachinePrincipalMetadataStore,
} from "../../dist/server/identity/postgres-machine-principal-metadata-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin=new pg.Pool({
  connectionString:process.env.SBG_POSTGRES_TEST_URL,
  max:1,
});
const role="sbg_machine_principal_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");

const f=Object.fromEntries([
  "apiClient",
  "service",
  "human",
  "platformOperator",
  "pending",
  "suspended",
  "revoked",
  "missing",
].map((key)=>[key,randomUUID()]));

let pool;
let database;
let store;

async function adminTransaction(work){
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await work(client);
    await client.query("COMMIT");
  }catch(error){
    await client.query("ROLLBACK");
    throw error;
  }finally{
    client.release();
  }
}

before(async()=>{
  await adminTransaction(async(setup)=>{
    await setup.query(
      "CREATE ROLE "+role
        +" LOGIN PASSWORD '"+password
        +"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await setup.query("GRANT sbg_identity_service_rw TO "+role);

    await setup.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,primary_email_norm,primary_mobile_norm,
         auth_epoch,service_code,owning_module,allowed_scope_classes,created_at,updated_at)
       VALUES
        ($1::uuid,'API_CLIENT','ACTIVE','API Client','hidden@example.invalid','+910000000001',
         '-9223372036854775808'::bigint,NULL,NULL,NULL,now(),now()),
        ($2::uuid,'SERVICE','ACTIVE','Service','service@example.invalid',NULL,
         '9223372036854775807'::bigint,'MACHINE_VERIFY','Identity',
         ARRAY['PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY']::text[],now(),now()),
        ($3::uuid,'HUMAN','ACTIVE','Human',NULL,NULL,1,NULL,NULL,NULL,now(),now()),
        ($4::uuid,'PLATFORM_OPERATOR','ACTIVE','Operator',NULL,NULL,2,NULL,NULL,NULL,now(),now()),
        ($5::uuid,'API_CLIENT','PENDING','Pending',NULL,NULL,3,NULL,NULL,NULL,now(),now()),
        ($6::uuid,'API_CLIENT','SUSPENDED','Suspended',NULL,NULL,4,NULL,NULL,NULL,now(),now()),
        ($7::uuid,'API_CLIENT','REVOKED','Revoked',NULL,NULL,5,NULL,NULL,NULL,now(),now())`,
      [f.apiClient,f.service,f.human,f.platformOperator,f.pending,f.suspended,f.revoked],
    );
  });

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=role;
  url.password=password;
  pool=new pg.Pool({
    connectionString:url.toString(),
    max:1,
    connectionTimeoutMillis:5000,
  });
  database=new PostgresIdentityDatabase(pool);
  store=new PostgresMachinePrincipalMetadataStore(database);
});

after(async()=>{
  if(pool) await pool.end();
  try{
    await adminTransaction(async(cleanup)=>{
      await cleanup.query(
        "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
        [[f.apiClient,f.service,f.human,f.platformOperator,f.pending,f.suspended,f.revoked]],
      );
      await cleanup.query("DROP ROLE IF EXISTS "+role);
    });
  }finally{
    await admin.end();
  }
});

test("MACHPRINC-PG-001 exact ACTIVE API_CLIENT principal raw metadata is readable without PII projection", async()=>{
  const row=await store.loadById({principalId:f.apiClient});
  assert.ok(row);
  assert.equal(row.id,f.apiClient);
  assert.equal(row.principalType,"API_CLIENT");
  assert.equal(row.status,"ACTIVE");
  assert.equal(row.authEpoch,"-9223372036854775808");
  assert.equal(row.allowedScopeClasses,undefined);
  assert.equal("displayName" in row,false);
  assert.equal("primaryEmailNorm" in row,false);
  assert.equal("primaryMobileNorm" in row,false);
  assert.equal(Object.isFrozen(row),true);
});

test("MACHPRINC-PG-002 ACTIVE SERVICE preserves service metadata and immutable allowed scopes", async()=>{
  const row=await store.loadById({principalId:f.service});
  assert.ok(row);
  assert.equal(row.principalType,"SERVICE");
  assert.equal(row.status,"ACTIVE");
  assert.equal(row.serviceCode,"MACHINE_VERIFY");
  assert.equal(row.owningModule,"Identity");
  assert.deepEqual(row.allowedScopeClasses,[
    "PLATFORM_GLOBAL","TENANT_CORE","TENANT_INDUSTRY",
  ]);
  assert.equal(Object.isFrozen(row.allowedScopeClasses),true);
});

test("MACHPRINC-PG-003 HUMAN and PLATFORM_OPERATOR remain raw principal-type evidence rather than machine acceptance", async()=>{
  const human=await store.loadById({principalId:f.human});
  const operator=await store.loadById({principalId:f.platformOperator});
  assert.equal(human?.principalType,"HUMAN");
  assert.equal(operator?.principalType,"PLATFORM_OPERATOR");
  assert.equal("machineAccepted" in human,false);
  assert.equal("machineAccepted" in operator,false);
});

test("MACHPRINC-PG-004 PENDING, SUSPENDED and REVOKED statuses remain raw evidence", async()=>{
  const pending=await store.loadById({principalId:f.pending});
  const suspended=await store.loadById({principalId:f.suspended});
  const revoked=await store.loadById({principalId:f.revoked});
  assert.equal(pending?.status,"PENDING");
  assert.equal(suspended?.status,"SUSPENDED");
  assert.equal(revoked?.status,"REVOKED");
  assert.equal("usable" in pending,false);
  assert.equal("authenticated" in suspended,false);
});

test("MACHPRINC-PG-005 nullable scopes and signed bigint auth epoch remain lossless", async()=>{
  const apiClient=await store.loadById({principalId:f.apiClient});
  const service=await store.loadById({principalId:f.service});
  assert.equal(apiClient?.allowedScopeClasses,undefined);
  assert.equal(apiClient?.authEpoch,"-9223372036854775808");
  assert.equal(service?.authEpoch,"9223372036854775807");
});

test("MACHPRINC-PG-006 missing exact id returns null and malformed UUID fails before SQL", async()=>{
  assert.equal(await store.loadById({principalId:f.missing}),null);
  await assert.rejects(
    store.loadById({principalId:"not-a-uuid"}),
    /Machine Principal id is invalid/,
  );
});

test("MACHPRINC-PG-007 fixed Identity role reads raw principal metadata while surface remains exact-read-only", async()=>{
  const privileges=await database.transaction((tx)=>tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_identity.platform_principal','SELECT') AS can_select`,
  ));
  assert.equal(privileges.rowCount,1);
  assert.equal(privileges.rows[0].user_name,"sbg_identity_service_rw");
  assert.equal(privileges.rows[0].can_select,true);

  for(const method of [
    "create","update","delete","list","search","authenticate","verifyMachineCredential",
  ]){
    assert.equal(typeof store[method],"undefined");
  }
});
