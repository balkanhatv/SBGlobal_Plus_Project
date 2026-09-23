import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIMediaRequestStore } from "../../dist/server/ai/postgres-ai-media-request-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const suffix = randomBytes(8).toString("hex");
const role = "sbg_ai_media_request_reader_" + suffix;
const password = randomBytes(24).toString("hex");
const capabilityCode = "AI_MEDIA_CAP_" + suffix;
const promptCode = "AI_MEDIA_PROMPT_" + suffix;
const platformServiceCode = "ai-media-request-reader-" + suffix;

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
  "capability",
  "promptTemplate",
  "requestIndustryA1",
  "requestIndustryA2",
  "requestTenantA",
  "requestIndustryB1",
  "missingRequest",
].map((key) => [key, randomUUID()]));

const brandVersion = "9007199254741999";

let pool;
let scoped;
let store;

function tenantCoreA(principalId = f.principalA, membershipId = f.membershipA) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    dataHomeId: f.home,
    regionCode: "IN-AI-MEDIA-REQUEST",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-MEDIA-REQUEST','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI MediaRequest tenant A"],
      [f.tenantB, "EDU", "AI MediaRequest tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-MEDIA-REQUEST',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI MediaRequest principal A", null, null],
      [f.principalA2, "HUMAN", "AI MediaRequest principal A2", null, null],
      [f.principalB, "HUMAN", "AI MediaRequest principal B", null, null],
      [f.platformService, "SERVICE", "AI MediaRequest platform service", platformServiceCode, "AI"],
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

    for (const [id, tenantId, code, primary] of [
      [f.industryA1, f.tenantA, "RTL", true],
      [f.industryA2, f.tenantA, "MFG", false],
      [f.industryB1, f.tenantB, "EDU", true],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,
        [id, tenantId, code, primary],
      );
    }

    await client.query(
      `INSERT INTO core_ai.ai_capability
        (id,code,category,required_entitlement,default_policy_class,schema_version,status)
       VALUES ($1,$2,'IMAGE',NULL,'MEDIA_TEST',1,'ACTIVE')`,
      [f.capability, capabilityCode],
    );

    await client.query(
      `INSERT INTO core_ai.prompt_template
        (id,owner_scope,tenant_id,industry_context_id,code,version,system_template,
         variable_schema_json,grounding_required,allowed_override_fields,status,
         created_by,approved_by,created_at,updated_at)
       VALUES ($1,'PLATFORM',NULL,NULL,$2,1,'Generate governed media.',
         '{"type":"object"}'::jsonb,false,'{}'::text[],'ACTIVE',
         $3,NULL,now()-interval '20 days',now()-interval '10 days')`,
      [f.promptTemplate, promptCode, f.platformService],
    );

    await client.query(
      `INSERT INTO core_ai.ai_media_request
        (id,tenant_id,industry_context_id,principal_id,capability_code,media_type,
         prompt_template_id,prompt_version,brand_config_version,localization_profile_ref,
         input_document_refs,sensitivity_class,residency_requirement,moderation_policy_ref,
         status,created_at,completed_at)
       VALUES
        ($1,$5,$7,$9,$13,'IMAGE',$14,1,$15::bigint,'',
         '{}'::uuid[],'CONFIDENTIAL','IN-AI-MEDIA-REQUEST','moderation:raw','QUEUED',
         '2026-09-20T00:00:00Z'::timestamptz,NULL),
        ($2,$5,$8,$9,$13,'SVG',NULL,NULL,NULL,NULL,
         '{}'::uuid[],'INTERNAL','IN-AI-MEDIA-REQUEST','','RAW_STATUS',
         '2026-09-19T00:00:00Z'::timestamptz,'2026-09-19T01:00:00Z'::timestamptz),
        ($3,$5,NULL,$9,$13,'AUDIO',NULL,NULL,NULL,'tenant-core',
         '{}'::uuid[],'PUBLIC','IN-AI-MEDIA-REQUEST','moderation:tenant','COMPLETE',
         '2020-01-01T00:00:00Z'::timestamptz,'2020-01-01T00:00:01Z'::timestamptz),
        ($4,$6,$12,$11,$13,'VIDEO',NULL,NULL,NULL,NULL,
         '{}'::uuid[],'REGULATED','IN-AI-MEDIA-REQUEST','moderation:b','PENDING',
         '2026-09-18T00:00:00Z'::timestamptz,NULL)`,
      [
        f.requestIndustryA1,
        f.requestIndustryA2,
        f.requestTenantA,
        f.requestIndustryB1,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.principalA,
        f.principalA2,
        f.principalB,
        f.industryB1,
        capabilityCode,
        f.promptTemplate,
        brandVersion,
      ],
    );

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
      regionCode: "IN-AI-MEDIA-REQUEST",
    },
  );
  store = new PostgresAIMediaRequestStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.ai_media_request WHERE id=ANY($1::uuid[])",
      [[f.requestIndustryA1, f.requestIndustryA2, f.requestTenantA, f.requestIndustryB1]],
    );
    await client.query("DELETE FROM core_ai.prompt_template WHERE id=$1", [f.promptTemplate]);
    await client.query("DELETE FROM core_ai.ai_capability WHERE id=$1", [f.capability]);
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

test("AIMEDIAREQ-PG-001 exact Industry request preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    mediaRequestId: f.requestIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.requestIndustryA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.principalId, f.principalA);
  assert.equal(row.capabilityCode, capabilityCode);
  assert.equal(row.mediaType, "IMAGE");
  assert.equal(row.promptTemplateId, f.promptTemplate);
  assert.equal(row.promptVersion, 1);
  assert.equal(row.brandConfigVersion, brandVersion);
  assert.equal(row.localizationProfileRef, "");
  assert.deepEqual(row.inputDocumentRefs, []);
  assert.equal(Object.isFrozen(row.inputDocumentRefs), true);
  assert.equal(row.sensitivityClass, "CONFIDENTIAL");
  assert.equal(row.residencyRequirement, "IN-AI-MEDIA-REQUEST");
  assert.equal(row.moderationPolicyRef, "moderation:raw");
  assert.equal(row.status, "QUEUED");
  assert.equal(row.createdAt, "2026-09-20T00:00:00.000Z");
  assert.equal(row.completedAt, undefined);
  assert.equal(Object.isFrozen(row), true);
  assert.equal("generated" in row, false);
  assert.equal("moderated" in row, false);
  assert.equal("published" in row, false);
  assert.equal("authorized" in row, false);
});

test("AIMEDIAREQ-PG-002 sibling Industry request is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    mediaRequestId: f.requestIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: industryA2(),
    mediaRequestId: f.requestIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.mediaType, "SVG");
  assert.equal(sibling.status, "RAW_STATUS");
});

test("AIMEDIAREQ-PG-003 Tenant-Core request is same-Tenant visible and nullable/raw values stay raw", async () => {
  const fromCore = await store.loadForContext({
    requestContext: tenantCoreA(),
    mediaRequestId: f.requestTenantA,
  });
  const fromIndustry = await store.loadForContext({
    requestContext: industryA1(),
    mediaRequestId: f.requestTenantA,
  });

  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.industryContextId, undefined);
  assert.equal(fromCore.promptTemplateId, undefined);
  assert.equal(fromCore.promptVersion, undefined);
  assert.equal(fromCore.brandConfigVersion, undefined);
  assert.equal(fromCore.localizationProfileRef, "tenant-core");
  assert.equal(fromCore.moderationPolicyRef, "moderation:tenant");
  assert.equal(fromCore.status, "COMPLETE");
  assert.equal(fromCore.completedAt, "2020-01-01T00:00:01.000Z");
  assert.equal(fromIndustry.id, f.requestTenantA);
});

test("AIMEDIAREQ-PG-004 MediaRequest SELECT visibility is not principal-private", async () => {
  const otherPrincipal = await store.loadForContext({
    requestContext: industryA1(f.principalA2, f.membershipA2),
    mediaRequestId: f.requestIndustryA1,
  });

  assert.ok(otherPrincipal);
  assert.equal(otherPrincipal.id, f.requestIndustryA1);
  assert.equal(otherPrincipal.principalId, f.principalA);
});

test("AIMEDIAREQ-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot read request", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    mediaRequestId: f.requestIndustryB1,
  }), null);

  const owner = await store.loadForContext({
    requestContext: industryB1(),
    mediaRequestId: f.requestIndustryB1,
  });
  assert.ok(owner);
  assert.equal(owner.tenantId, f.tenantB);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    mediaRequestId: f.requestIndustryA1,
  }), null);
});

test("AIMEDIAREQ-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    mediaRequestId: f.missingRequest,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryA1(),
    mediaRequestId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryA1(),
      dataHomeId: randomUUID(),
    },
    mediaRequestId: f.requestIndustryA1,
  }));
});

test("AIMEDIAREQ-PG-007 raw request evidence adds no generate/moderate/publish/route/execute authority", async () => {
  const privileges = await scoped.withContext(industryA1(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_media_request','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_media_request','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_media_request','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_media_request','DELETE') AS can_delete`,
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
  assert.equal(typeof store.renderPrompt, "undefined");
  assert.equal(typeof store.generate, "undefined");
  assert.equal(typeof store.moderate, "undefined");
  assert.equal(typeof store.publish, "undefined");
  assert.equal(typeof store.route, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
