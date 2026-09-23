import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIRAGSourceStore } from "../../dist/server/ai/postgres-ai-rag-source-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_rag_source_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");
const platformServiceCode = "ai-rag-source-reader-" + suffix;

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
  "sourceIndustryA1",
  "sourceIndustryA2",
  "sourceTenantA",
  "sourceTenantB",
  "missingSource",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function tenantCoreA(principalId = f.principalA, membershipId = f.membershipA) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    dataHomeId: f.home,
    regionCode: "IN-AI-RAG-SOURCE",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-RAG-SOURCE','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI RAGSource tenant A"],
      [f.tenantB, "EDU", "AI RAGSource tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-RAG-SOURCE',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI RAGSource principal A", null, null],
      [f.principalA2, "HUMAN", "AI RAGSource principal A2", null, null],
      [f.principalB, "HUMAN", "AI RAGSource principal B", null, null],
      [f.platformService, "SERVICE", "AI RAGSource platform service", platformServiceCode, "AI"],
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
      `INSERT INTO core_ai.rag_source
        (id,tenant_id,industry_context_id,scope_class,source_module,management_system_id,
         resource_type,resource_id,document_id,document_version,sensitivity_class,
         residency_region,retention_class,acl_policy_ref,status,source_version,
         chunking_policy_version,created_at,updated_at)
       VALUES
        ($1,$5,$7,'TENANT_INDUSTRY','Retail','RTL-OMS','ORDER','order-001',NULL,NULL,
          'CONFIDENTIAL','IN-AI-RAG-SOURCE','RAG_STANDARD','acl://orders','REGISTERED',
          12345678901234567890,'chunk-v7','2026-09-23T02:01:01Z','2026-09-22T02:01:01Z'),
        ($2,$5,$8,'TENANT_INDUSTRY','Manufacturing','MFG-PROD','WORK_ORDER','wo-002',NULL,NULL,
          'INTERNAL','IN-AI-RAG-SOURCE','RAG_STANDARD',NULL,'ACTIVE',
          2,'chunk-v2','2026-09-23T02:02:01Z','2026-09-23T02:03:01Z'),
        ($3,$5,NULL,'TENANT_CORE','','','','',NULL,NULL,
          'PUBLIC','','',NULL,'',
          3,'','2026-09-23T02:04:01Z','2026-09-23T02:05:01Z'),
        ($4,$6,$9,'TENANT_INDUSTRY','Education','EDU-LMS','COURSE','course-004',NULL,NULL,
          'REGULATED','IN-AI-RAG-SOURCE','RAG_LONG',NULL,'ACTIVE',
          4,'chunk-v4','2026-09-23T02:06:01Z','2026-09-23T02:07:01Z')`,
      [
        f.sourceIndustryA1,
        f.sourceIndustryA2,
        f.sourceTenantA,
        f.sourceTenantB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.industryB1,
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
      regionCode: "IN-AI-RAG-SOURCE",
    },
  );
  store = new PostgresAIRAGSourceStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.rag_source WHERE id=ANY($1::uuid[])",
      [[f.sourceIndustryA1, f.sourceIndustryA2, f.sourceTenantA, f.sourceTenantB]],
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

test("AIRAGSRC-PG-001 exact Industry RAGSource preserves immutable raw registration evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    ragSourceId: f.sourceIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.sourceIndustryA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.scopeClass, "TENANT_INDUSTRY");
  assert.equal(row.sourceModule, "Retail");
  assert.equal(row.managementSystemId, "RTL-OMS");
  assert.equal(row.resourceType, "ORDER");
  assert.equal(row.resourceId, "order-001");
  assert.equal(row.documentId, undefined);
  assert.equal(row.documentVersion, undefined);
  assert.equal(row.sensitivityClass, "CONFIDENTIAL");
  assert.equal(row.residencyRegion, "IN-AI-RAG-SOURCE");
  assert.equal(row.retentionClass, "RAG_STANDARD");
  assert.equal(row.aclPolicyRef, "acl://orders");
  assert.equal(row.status, "REGISTERED");
  assert.equal(row.sourceVersion, "12345678901234567890");
  assert.equal(row.chunkingPolicyVersion, "chunk-v7");
  assert.equal(row.createdAt, "2026-09-23T02:01:01.000Z");
  assert.equal(row.updatedAt, "2026-09-22T02:01:01.000Z");
  assert.equal(Object.isFrozen(row), true);
  assert.equal("retrievable" in row, false);
  assert.equal("authorized" in row, false);
  assert.equal("embedded" in row, false);
});

test("AIRAGSRC-PG-002 sibling Industry source is hidden while exact sibling context may read it", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    ragSourceId: f.sourceIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: industryA2(),
    ragSourceId: f.sourceIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.sourceModule, "Manufacturing");
});

test("AIRAGSRC-PG-003 Tenant-Core source is same-Tenant visible and raw/null evidence stays raw", async () => {
  const fromCore = await store.loadForContext({
    requestContext: tenantCoreA(),
    ragSourceId: f.sourceTenantA,
  });
  const fromIndustry = await store.loadForContext({
    requestContext: industryA1(),
    ragSourceId: f.sourceTenantA,
  });

  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.industryContextId, undefined);
  assert.equal(fromCore.scopeClass, "TENANT_CORE");
  assert.equal(fromCore.sourceModule, "");
  assert.equal(fromCore.managementSystemId, undefined);
  assert.equal(fromCore.resourceType, "");
  assert.equal(fromCore.resourceId, "");
  assert.equal(fromCore.documentId, undefined);
  assert.equal(fromCore.documentVersion, undefined);
  assert.equal(fromCore.residencyRegion, "");
  assert.equal(fromCore.retentionClass, "");
  assert.equal(fromCore.aclPolicyRef, undefined);
  assert.equal(fromCore.status, "");
  assert.equal(fromCore.chunkingPolicyVersion, "");
  assert.equal(fromIndustry.id, f.sourceTenantA);
});

test("AIRAGSRC-PG-004 RAGSource RLS is scope-based rather than principal-private", async () => {
  const otherPrincipal = await store.loadForContext({
    requestContext: industryA1(f.principalA2, f.membershipA2),
    ragSourceId: f.sourceIndustryA1,
  });

  assert.ok(otherPrincipal);
  assert.equal(otherPrincipal.id, f.sourceIndustryA1);
  assert.equal(otherPrincipal.tenantId, f.tenantA);
});

test("AIRAGSRC-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot read Tenant source", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    ragSourceId: f.sourceTenantB,
  }), null);

  const owner = await store.loadForContext({
    requestContext: industryB1(),
    ragSourceId: f.sourceTenantB,
  });
  assert.ok(owner);
  assert.equal(owner.tenantId, f.tenantB);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    ragSourceId: f.sourceIndustryA1,
  }), null);
});

test("AIRAGSRC-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    ragSourceId: f.missingSource,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryA1(),
    ragSourceId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryA1(),
      dataHomeId: randomUUID(),
    },
    ragSourceId: f.sourceIndustryA1,
  }));
});

test("AIRAGSRC-PG-007 raw source evidence adds no retrieval, ACL, chunk, embedding, search, grounding, or inference authority", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    ragSourceId: f.sourceIndustryA1,
  });
  assert.ok(row);

  const privileges = await scoped.withContext(industryA1(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.rag_source','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.rag_source','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.rag_source','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.rag_source','DELETE') AS can_delete`,
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
  assert.equal(typeof store.listChunks, "undefined");
  assert.equal(typeof store.revalidateDocument, "undefined");
  assert.equal(typeof store.evaluateAcl, "undefined");
  assert.equal(typeof store.retrieve, "undefined");
  assert.equal(typeof store.embed, "undefined");
  assert.equal(typeof store.search, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
