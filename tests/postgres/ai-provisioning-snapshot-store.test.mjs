import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIProvisioningSnapshotStore } from "../../dist/server/ai/postgres-ai-provisioning-snapshot-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_provisioning_snapshot_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");
const routeCode = "AI_PROV_ROUTE_" + suffix;
const planCode = "AI_PROV_PLAN_" + suffix;
const capabilityCode = "AI_PROV_CAP_" + suffix;
const providerCode = "AI_PROV_PROVIDER_" + suffix;
const platformServiceCode = "ai-provisioning-snapshot-reader-" + suffix;

const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "principalA",
  "principalA2",
  "principalB",
  "platformService",
  "membershipA",
  "membershipA2",
  "membershipB",
  "industryA1",
  "industryA2",
  "industryB1",
  "routePolicy",
  "plan",
  "planVersion",
  "subscriptionA",
  "subscriptionB",
  "entitlementA",
  "entitlementB",
  "capability",
  "provider",
  "tenantConfigA",
  "tenantConfigB",
  "snapshotIndustryA1",
  "snapshotIndustryA2",
  "snapshotTenantA",
  "snapshotIndustryB1",
  "missingSnapshot",
].map((key) => [key, randomUUID()]));

const v = Object.freeze({
  subscriptionA: "9007199254740993",
  subscriptionB: "9007199254740994",
  entitlementA: "9007199254740995",
  entitlementB: "9007199254740996",
  tenantConfigA: "9007199254740997",
  tenantConfigB: "9007199254740998",
  activationA1: "9007199254740999",
  activationA2: "9007199254741000",
  activationB1: "9007199254741001",
  snapshotA1: "9007199254741002",
  snapshotA2: "9007199254741003",
  snapshotTenantA: "9007199254741004",
  snapshotB1: "9007199254741005",
});

let pool;
let scoped;
let store;

function tenantCoreA(principalId = f.principalA, membershipId = f.membershipA) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    dataHomeId: f.home,
    regionCode: "IN-AI-PROVISIONING-SNAPSHOT",
    principalId,
    principalType: "HUMAN",
    membershipId,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_CORE",
  });
}

function industryA1(principalId = f.principalA, membershipId = f.membershipA) {
  return Object.freeze({
    ...tenantCoreA(principalId, membershipId),
    industryContextId: f.industryA1,
    scopeClass: "TENANT_INDUSTRY",
  });
}

function industryA2() {
  return Object.freeze({
    ...tenantCoreA(),
    industryContextId: f.industryA2,
    scopeClass: "TENANT_INDUSTRY",
  });
}

function industryB1() {
  return Object.freeze({
    ...tenantCoreA(f.principalB, f.membershipB),
    tenantId: f.tenantB,
    industryContextId: f.industryB1,
    scopeClass: "TENANT_INDUSTRY",
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

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "CREATE ROLE " + role
        + " LOGIN PASSWORD '" + password
        + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await client.query("GRANT sbg_ai_gateway_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-PROVISIONING-SNAPSHOT','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI Provisioning tenant A"],
      [f.tenantB, "EDU", "AI Provisioning tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-PROVISIONING-SNAPSHOT',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI Provisioning principal A", null, null],
      [f.principalA2, "HUMAN", "AI Provisioning principal A2", null, null],
      [f.principalB, "HUMAN", "AI Provisioning principal B", null, null],
      [f.platformService, "SERVICE", "AI Provisioning platform service", platformServiceCode, "AI"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,service_code,owning_module,created_at,updated_at)
         VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,
        [principalId, type, label, serviceCode, owningModule],
      );
    }

    for (const [membershipId, tenantId, principalId] of [
      [f.membershipA, f.tenantA, f.principalA],
      [f.membershipA2, f.tenantA, f.principalA2],
      [f.membershipB, f.tenantB, f.principalB],
    ]) {
      await client.query(
        `INSERT INTO core_identity.tenant_membership
          (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,
        [membershipId, tenantId, principalId],
      );
    }

    for (const [id, tenantId, code, primary, activationVersion] of [
      [f.industryA1, f.tenantA, "RTL", true, v.activationA1],
      [f.industryA2, f.tenantA, "MFG", false, v.activationA2],
      [f.industryB1, f.tenantB, "EDU", true, v.activationB1],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,activation_version,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,$5::bigint,now(),now())`,
        [id, tenantId, code, primary, activationVersion],
      );
    }

    await client.query(
      `INSERT INTO core_commercial.commercial_route_policy
        (id,code,self_serve_enabled,sales_assisted_enabled,market_scope_json,
         approval_required,version,status,created_at)
       VALUES ($1,$2,true,true,'{}'::jsonb,false,1,'DRAFT',now())`,
      [f.routePolicy, routeCode],
    );
    await client.query(
      `INSERT INTO core_commercial.plan
        (id,code,name,status,created_at,updated_at)
       VALUES ($1,$2,'AI Provisioning Fixture','DRAFT',now(),now())`,
      [f.plan, planCode],
    );
    await client.query(
      `INSERT INTO core_commercial.plan_version
        (id,plan_id,version_no,status,route_policy_id,entitlement_template_json,
         limit_set_json,billing_policy_json,support_class,created_by,created_at)
       VALUES ($1,$2,1,'DRAFT',$3,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,
         'TEST',$4,now())`,
      [f.planVersion, f.plan, f.routePolicy, f.platformService],
    );

    for (const [id, tenantId, version] of [
      [f.subscriptionA, f.tenantA, v.subscriptionA],
      [f.subscriptionB, f.tenantB, v.subscriptionB],
    ]) {
      await client.query(
        `INSERT INTO core_commercial.subscription
          (id,tenant_id,plan_version_id,state,auto_renew,billing_timezone,version,
           created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',true,'UTC',$4::bigint,now(),now())`,
        [id, tenantId, f.planVersion, version],
      );
    }

    await client.query(
      "UPDATE core_tenancy.tenant SET current_subscription_id=$2 WHERE id=$1",
      [f.tenantA, f.subscriptionA],
    );
    await client.query(
      "UPDATE core_tenancy.tenant SET current_subscription_id=$2 WHERE id=$1",
      [f.tenantB, f.subscriptionB],
    );

    for (const [id, tenantId, version, subscriptionId] of [
      [f.entitlementA, f.tenantA, v.entitlementA, f.subscriptionA],
      [f.entitlementB, f.tenantB, v.entitlementB, f.subscriptionB],
    ]) {
      await client.query(
        `INSERT INTO core_commercial.entitlement_snapshot
          (id,tenant_id,version,source_subscription_id,source_plan_version_id,
           compiled_at,valid_from,source_fingerprint,status,deny_set_json,metadata_json)
         VALUES ($1,$2,$3::bigint,$4,$5,now(),now(),'dd124','CURRENT','[]'::jsonb,'{}'::jsonb)`,
        [id, tenantId, version, subscriptionId, f.planVersion],
      );
    }

    await client.query(
      `INSERT INTO core_ai.ai_capability
        (id,code,category,required_entitlement,default_policy_class,schema_version,status)
       VALUES ($1,$2,'CHAT',NULL,'DEFAULT',1,'ACTIVE')`,
      [f.capability, capabilityCode],
    );
    await client.query(
      `INSERT INTO core_ai.ai_provider
        (id,code,status,adapter_type,supported_regions,supported_capabilities,
         security_class,residency_metadata,credential_ref,health_state,version,
         created_at,updated_at)
       VALUES ($1,$2,'ACTIVE','REST',ARRAY['IN']::text[],ARRAY['CHAT']::text[],
         'REGULATED','{}'::jsonb,'secret://dd124-provider','HEALTHY',1,now(),now())`,
      [f.provider, providerCode],
    );

    for (const [id, tenantId, version] of [
      [f.tenantConfigA, f.tenantA, v.tenantConfigA],
      [f.tenantConfigB, f.tenantB, v.tenantConfigB],
    ]) {
      await client.query(
        `INSERT INTO core_ai.tenant_ai_config
          (id,tenant_id,enabled,allowed_capabilities,allowed_provider_ids,allowed_model_ids,
           max_sensitivity_class,residency_policy_id,retention_policy_id,prompt_override_policy_id,
           version,updated_at)
         VALUES ($1,$2,true,ARRAY[$3]::text[],ARRAY[$4::uuid]::uuid[],'{}'::uuid[],
           'REGULATED',$5::uuid,$6::uuid,$7::uuid,$8::bigint,now())`,
        [
          id,
          tenantId,
          capabilityCode,
          f.provider,
          randomUUID(),
          randomUUID(),
          randomUUID(),
          version,
        ],
      );
    }

    const snapshotRows = [
      [
        f.snapshotIndustryA1, f.tenantA, f.industryA1, v.snapshotA1,
        v.subscriptionA, v.entitlementA, v.activationA1, v.tenantConfigA,
        "ACTIVE", "2026-09-20T00:00:00Z", "2026-10-20T00:00:00Z",
        "budget-a1",
      ],
      [
        f.snapshotIndustryA2, f.tenantA, f.industryA2, v.snapshotA2,
        v.subscriptionA, v.entitlementA, v.activationA2, v.tenantConfigA,
        "REVOKED", "2026-09-19T00:00:00Z", null, null,
      ],
      [
        f.snapshotTenantA, f.tenantA, null, v.snapshotTenantA,
        v.subscriptionA, v.entitlementA, null, v.tenantConfigA,
        "SUPERSEDED", "2020-01-01T00:00:00Z", "2021-01-01T00:00:00Z",
        "",
      ],
      [
        f.snapshotIndustryB1, f.tenantB, f.industryB1, v.snapshotB1,
        v.subscriptionB, v.entitlementB, v.activationB1, v.tenantConfigB,
        "ACTIVE", "2026-09-18T00:00:00Z", null, "budget-b1",
      ],
    ];

    for (const row of snapshotRows) {
      await client.query(
        `INSERT INTO core_ai.ai_provisioning_snapshot
          (id,tenant_id,industry_context_id,version,subscription_version,
           entitlement_snapshot_version,industry_activation_version,ms_pack_versions,
           country_pack_versions,tenant_ai_config_version,allowed_capability_ids,
           allowed_api_classes,allowed_provider_ids,allowed_model_classes,budget_policy_ref,
           status,compiled_at,valid_until)
         VALUES ($1,$2,$3,$4::bigint,$5::bigint,$6::bigint,$7::bigint,
           '{"packs":{"MS-1":7},"raw":[1,"x",null]}'::jsonb,
           '{"IN":{"version":2}}'::jsonb,$8::bigint,
           ARRAY[$9::uuid]::uuid[],ARRAY['TENANT_API','PARTNER_API']::text[],
           ARRAY[$10::uuid]::uuid[],ARRAY['balanced','reasoning']::text[],$11,$12,
           $13::timestamptz,$14::timestamptz)`,
        [
          row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7],
          f.capability, f.provider, row[11], row[8], row[9], row[10],
        ],
      );
    }

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
    new PostgresAIGatewayDatabase(pool),
    {
      dataHomeId: f.home,
      regionCode: "IN-AI-PROVISIONING-SNAPSHOT",
    },
  );
  store = new PostgresAIProvisioningSnapshotStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_provisioning_snapshot WHERE id=ANY($1::uuid[])",
      [[f.snapshotIndustryA1, f.snapshotIndustryA2, f.snapshotTenantA, f.snapshotIndustryB1]],
    );
    await client.query(
      "DELETE FROM core_ai.tenant_ai_config WHERE id=ANY($1::uuid[])",
      [[f.tenantConfigA, f.tenantConfigB]],
    );
    await client.query("DELETE FROM core_ai.ai_provider WHERE id=$1", [f.provider]);
    await client.query("DELETE FROM core_ai.ai_capability WHERE id=$1", [f.capability]);
    await client.query(
      "DELETE FROM core_commercial.entitlement_snapshot WHERE id=ANY($1::uuid[])",
      [[f.entitlementA, f.entitlementB]],
    );
    await client.query(
      "UPDATE core_tenancy.tenant SET current_subscription_id=NULL WHERE id=ANY($1::uuid[])",
      [[f.tenantA, f.tenantB]],
    );
    await client.query(
      "DELETE FROM core_commercial.subscription WHERE id=ANY($1::uuid[])",
      [[f.subscriptionA, f.subscriptionB]],
    );
    await client.query("DELETE FROM core_commercial.plan_version WHERE id=$1", [f.planVersion]);
    await client.query("DELETE FROM core_commercial.plan WHERE id=$1", [f.plan]);
    await client.query(
      "DELETE FROM core_commercial.commercial_route_policy WHERE id=$1",
      [f.routePolicy],
    );
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipA, f.membershipA2, f.membershipB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1, f.industryA2, f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.principalA, f.principalA2, f.principalB, f.platformService]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA, f.tenantB]],
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

test("AIPROVSNAP-PG-001 exact Industry snapshot preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    snapshotId: f.snapshotIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.snapshotIndustryA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.version, v.snapshotA1);
  assert.equal(row.subscriptionVersion, v.subscriptionA);
  assert.equal(row.entitlementSnapshotVersion, v.entitlementA);
  assert.equal(row.industryActivationVersion, v.activationA1);
  assert.equal(row.tenantAiConfigVersion, v.tenantConfigA);
  assert.deepEqual(row.msPackVersions, {packs: {"MS-1": 7}, raw: [1, "x", null]});
  assert.deepEqual(row.countryPackVersions, {IN: {version: 2}});
  assert.deepEqual(row.allowedCapabilityIds, [f.capability]);
  assert.deepEqual(row.allowedApiClasses, ["TENANT_API", "PARTNER_API"]);
  assert.deepEqual(row.allowedProviderIds, [f.provider]);
  assert.deepEqual(row.allowedModelClasses, ["balanced", "reasoning"]);
  assert.equal(row.budgetPolicyRef, "budget-a1");
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.compiledAt, "2026-09-20T00:00:00.000Z");
  assert.equal(row.validUntil, "2026-10-20T00:00:00.000Z");
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.msPackVersions), true);
  assert.equal(Object.isFrozen(row.msPackVersions.packs), true);
  assert.equal(Object.isFrozen(row.allowedApiClasses), true);
  assert.equal("current" in row, false);
  assert.equal("effective" in row, false);
  assert.equal("authorized" in row, false);
});

test("AIPROVSNAP-PG-002 sibling Industry snapshot is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    snapshotId: f.snapshotIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: industryA2(),
    snapshotId: f.snapshotIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.status, "REVOKED");
  assert.equal(sibling.validUntil, undefined);
});

test("AIPROVSNAP-PG-003 Tenant-Core snapshot is same-Tenant visible and raw status/validity stay raw", async () => {
  const fromCore = await store.loadForContext({
    requestContext: tenantCoreA(),
    snapshotId: f.snapshotTenantA,
  });
  const fromIndustry = await store.loadForContext({
    requestContext: industryA1(),
    snapshotId: f.snapshotTenantA,
  });

  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.industryContextId, undefined);
  assert.equal(fromCore.industryActivationVersion, undefined);
  assert.equal(fromCore.status, "SUPERSEDED");
  assert.equal(fromCore.budgetPolicyRef, "");
  assert.equal(fromCore.validUntil, "2021-01-01T00:00:00.000Z");
  assert.equal(fromIndustry.id, f.snapshotTenantA);
});

test("AIPROVSNAP-PG-004 ProvisioningSnapshot visibility is not principal-private", async () => {
  const otherPrincipal = await store.loadForContext({
    requestContext: industryA1(f.principalA2, f.membershipA2),
    snapshotId: f.snapshotIndustryA1,
  });

  assert.ok(otherPrincipal);
  assert.equal(otherPrincipal.id, f.snapshotIndustryA1);
  assert.equal(otherPrincipal.status, "ACTIVE");
});

test("AIPROVSNAP-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot read snapshot", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    snapshotId: f.snapshotIndustryB1,
  }), null);

  const owner = await store.loadForContext({
    requestContext: industryB1(),
    snapshotId: f.snapshotIndustryB1,
  });
  assert.ok(owner);
  assert.equal(owner.tenantId, f.tenantB);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    snapshotId: f.snapshotIndustryA1,
  }), null);
});

test("AIPROVSNAP-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    snapshotId: f.missingSnapshot,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryA1(),
    snapshotId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryA1(),
      dataHomeId: randomUUID(),
    },
    snapshotId: f.snapshotIndustryA1,
  }));
});

test("AIPROVSNAP-PG-007 raw snapshot evidence adds no current/compile/authorize/route/execute authority", async () => {
  const privileges = await scoped.withContext(industryA1(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_provisioning_snapshot','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_provisioning_snapshot','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_provisioning_snapshot','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_provisioning_snapshot','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.selectCurrent, "undefined");
  assert.equal(typeof store.compile, "undefined");
  assert.equal(typeof store.revalidate, "undefined");
  assert.equal(typeof store.authorize, "undefined");
  assert.equal(typeof store.route, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
