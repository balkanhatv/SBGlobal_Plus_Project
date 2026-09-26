import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIRAGChunkMetadataStore } from "../../dist/server/ai/postgres-ai-rag-chunk-metadata-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_ai_rag_chunk_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");
const providerCode = "AI_RAG_CHUNK_PROVIDER_" + suffix;
const modelCode = "AI_RAG_CHUNK_MODEL_" + suffix;
const platformServiceCode = "ai-rag-chunk-reader-" + suffix;

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
  "provider",
  "model",
  "sourceIndustryA1",
  "sourceIndustryA2",
  "sourceTenantA",
  "sourceTenantB",
  "chunkIndustryA1",
  "chunkIndustryA2",
  "chunkTenantA",
  "chunkTenantB",
  "missingChunk",
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
    regionCode: "IN-AI-RAG-CHUNK",
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
       VALUES ($1::uuid,$1::uuid::text,'IN-AI-RAG-CHUNK','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "AI RAGChunk tenant A"],
      [f.tenantB, "EDU", "AI RAGChunk tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-AI-RAG-CHUNK',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, type, label, serviceCode, owningModule] of [
      [f.principalA, "HUMAN", "AI RAGChunk principal A", null, null],
      [f.principalA2, "HUMAN", "AI RAGChunk principal A2", null, null],
      [f.principalB, "HUMAN", "AI RAGChunk principal B", null, null],
      [f.platformService, "SERVICE", "AI RAGChunk platform service", platformServiceCode, "AI"],
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
      `INSERT INTO core_ai.ai_provider
        (id,code,status,adapter_type,supported_regions,supported_capabilities,
         security_class,residency_metadata,credential_ref,health_state,version,
         created_at,updated_at)
       VALUES ($1,$2,'ACTIVE','REST',ARRAY['IN']::text[],ARRAY['EMBEDDING']::text[],
         'REGULATED','{}'::jsonb,'secret://dd128-provider','HEALTHY',1,now(),now())`,
      [f.provider, providerCode],
    );

    await client.query(
      `INSERT INTO core_ai.ai_model
        (id,provider_id,model_code,display_name,capabilities,context_window_class,
         input_modalities,output_modalities,residency_regions,sensitivity_ceiling,
         cost_class,latency_class,status,version,metadata_json)
       VALUES ($1,$2,$3,'RAG Chunk Model',ARRAY['EMBEDDING']::text[],'STANDARD',
         ARRAY['TEXT']::text[],ARRAY['EMBEDDING']::text[],ARRAY['IN']::text[],
         'REGULATED','STANDARD','STANDARD','ACTIVE',1,'{}'::jsonb)`,
      [f.model, f.provider, modelCode],
    );

    await client.query(
      `INSERT INTO core_ai.rag_source
        (id,tenant_id,industry_context_id,scope_class,source_module,management_system_id,
         resource_type,resource_id,document_id,document_version,sensitivity_class,
         residency_region,retention_class,acl_policy_ref,status,source_version,
         chunking_policy_version,created_at,updated_at)
       VALUES
        ($1,$5,$7,'TENANT_INDUSTRY','Retail','RTL-OMS','ORDER','order-001',NULL,NULL,
          'CONFIDENTIAL','IN-AI-RAG-CHUNK','RAG_STANDARD','acl://orders','ACTIVE',1,
          'chunk-v1',now()-interval '5 days',now()-interval '4 days'),
        ($2,$5,$8,'TENANT_INDUSTRY','Manufacturing','MFG-PROD','WORK_ORDER','wo-002',NULL,NULL,
          'INTERNAL','IN-AI-RAG-CHUNK','RAG_STANDARD',NULL,'ACTIVE',1,
          'chunk-v1',now()-interval '5 days',now()-interval '4 days'),
        ($3,$5,NULL,'TENANT_CORE','','','','',NULL,NULL,
          'PUBLIC','','',NULL,'ACTIVE',1,
          '',now()-interval '5 days',now()-interval '4 days'),
        ($4,$6,$9,'TENANT_INDUSTRY','Education','EDU-LMS','COURSE','course-004',NULL,NULL,
          'REGULATED','IN-AI-RAG-CHUNK','RAG_LONG',NULL,'ACTIVE',1,
          'chunk-v1',now()-interval '5 days',now()-interval '4 days')`,
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

    await client.query(
      `INSERT INTO core_ai.rag_chunk
        (id,source_id,tenant_id,industry_context_id,scope_class,chunk_ordinal,
         text_ref_or_encrypted_text,content_hash,token_count,acl_projection_json,
         sensitivity_class,residency_region,retention_class,embedding_model_id,
         embedding_version,embedding,metadata_json,created_at)
       VALUES
        ($1,$5,$9,$11,'TENANT_INDUSTRY',0,'enc://chunk-a1','hash-a1',1200,
          '{"groups":["ops",""],"rules":{"read":true},"nullable":null}'::jsonb,
          'REGULATED','IN-AI-RAG-CHUNK','RAG_STANDARD',$13,'embed-v1',
          '[0.1,0.2,0.3]'::vector,'{"page":7,"tags":["x",""]}'::jsonb,'2026-09-23T03:01:01Z'),
        ($2,$6,$9,$12,'TENANT_INDUSTRY',7,'enc://chunk-a2','hash-a2',0,
          '{}'::jsonb,'INTERNAL','IN-AI-RAG-CHUNK','RAG_STANDARD',$13,'embed-v2',
          '[0.3,0.2,0.1]'::vector,'{}'::jsonb,'2026-09-23T03:02:01Z'),
        ($3,$7,$9,NULL,'TENANT_CORE',1,'','',1,
          '{"raw":true}'::jsonb,'PUBLIC','','',$13,'',
          '[0,0,0]'::vector,'{"raw":true}'::jsonb,'2026-09-23T03:03:01Z'),
        ($4,$8,$10,$14,'TENANT_INDUSTRY',2,'enc://chunk-b','hash-b',10,
          '{"tenant":"b"}'::jsonb,'REGULATED','IN-AI-RAG-CHUNK','RAG_LONG',$13,'embed-v4',
          '[0.4,0.4,0.4]'::vector,'{"tenant":"b"}'::jsonb,'2026-09-23T03:04:01Z')`,
      [
        f.chunkIndustryA1,
        f.chunkIndustryA2,
        f.chunkTenantA,
        f.chunkTenantB,
        f.sourceIndustryA1,
        f.sourceIndustryA2,
        f.sourceTenantA,
        f.sourceTenantB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.model,
        f.industryB1,
      ],
    );

    await client.query(
      "UPDATE core_ai.ai_model SET status='RETIRED' WHERE id=$1",
      [f.model],
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
      regionCode: "IN-AI-RAG-CHUNK",
    },
  );
  store = new PostgresAIRAGChunkMetadataStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_ai.rag_chunk WHERE id=ANY($1::uuid[])",
      [[f.chunkIndustryA1, f.chunkIndustryA2, f.chunkTenantA, f.chunkTenantB]],
    );
    await client.query(
      "DELETE FROM core_ai.rag_source WHERE id=ANY($1::uuid[])",
      [[f.sourceIndustryA1, f.sourceIndustryA2, f.sourceTenantA, f.sourceTenantB]],
    );
    await client.query("DELETE FROM core_ai.ai_model WHERE id=$1", [f.model]);
    await client.query("DELETE FROM core_ai.ai_provider WHERE id=$1", [f.provider]);
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

test("AIRAGCHUNK-PG-001 exact Industry chunk returns immutable raw non-vector metadata", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    ragChunkId: f.chunkIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.chunkIndustryA1);
  assert.equal(row.sourceId, f.sourceIndustryA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.scopeClass, "TENANT_INDUSTRY");
  assert.equal(row.chunkOrdinal, 0);
  assert.equal(row.textRefOrEncryptedText, "enc://chunk-a1");
  assert.equal(row.contentHash, "hash-a1");
  assert.equal(row.tokenCount, 1200);
  assert.deepEqual(row.aclProjection, {
    groups: ["ops", ""],
    nullable: null,
    rules: {read: true},
  });
  assert.equal(row.sensitivityClass, "REGULATED");
  assert.equal(row.residencyRegion, "IN-AI-RAG-CHUNK");
  assert.equal(row.retentionClass, "RAG_STANDARD");
  assert.equal(row.embeddingModelId, f.model);
  assert.equal(row.embeddingVersion, "embed-v1");
  assert.deepEqual(row.metadata, {page: 7, tags: ["x", ""]});
  assert.equal(row.createdAt, "2026-09-23T03:01:01.000Z");
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.aclProjection), true);
  assert.equal(Object.isFrozen(row.metadata), true);
  assert.equal("embedding" in row, false);
  assert.equal("authorized" in row, false);
  assert.equal("relevance" in row, false);
});

test("AIRAGCHUNK-PG-002 sibling Industry chunk is hidden while exact sibling context may read it", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    ragChunkId: f.chunkIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: industryA2(),
    ragChunkId: f.chunkIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.chunkOrdinal, 7);
  assert.equal(sibling.tokenCount, 0);
});

test("AIRAGCHUNK-PG-003 Tenant-Core chunk is same-Tenant visible and raw/JSON evidence stays raw", async () => {
  const fromCore = await store.loadForContext({
    requestContext: tenantCoreA(),
    ragChunkId: f.chunkTenantA,
  });
  const fromIndustry = await store.loadForContext({
    requestContext: industryA1(),
    ragChunkId: f.chunkTenantA,
  });

  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.industryContextId, undefined);
  assert.equal(fromCore.scopeClass, "TENANT_CORE");
  assert.equal(fromCore.textRefOrEncryptedText, "");
  assert.equal(fromCore.contentHash, "");
  assert.equal(fromCore.tokenCount, 1);
  assert.deepEqual(fromCore.aclProjection, {raw: true});
  assert.equal(fromCore.residencyRegion, "");
  assert.equal(fromCore.retentionClass, "");
  assert.equal(fromCore.embeddingVersion, "");
  assert.deepEqual(fromCore.metadata, {raw: true});
  assert.equal(fromIndustry.id, f.chunkTenantA);
});

test("AIRAGCHUNK-PG-004 RAGChunk RLS is scope-based rather than principal-private", async () => {
  const otherPrincipal = await store.loadForContext({
    requestContext: industryA1(f.principalA2, f.membershipA2),
    ragChunkId: f.chunkIndustryA1,
  });

  assert.ok(otherPrincipal);
  assert.equal(otherPrincipal.id, f.chunkIndustryA1);
});

test("AIRAGCHUNK-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot read Tenant chunk", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    ragChunkId: f.chunkTenantB,
  }), null);

  const owner = await store.loadForContext({
    requestContext: industryB1(),
    ragChunkId: f.chunkTenantB,
  });
  assert.ok(owner);
  assert.equal(owner.tenantId, f.tenantB);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    ragChunkId: f.chunkIndustryA1,
  }), null);
});

test("AIRAGCHUNK-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA1(),
    ragChunkId: f.missingChunk,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryA1(),
    ragChunkId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryA1(),
      dataHomeId: randomUUID(),
    },
    ragChunkId: f.chunkIndustryA1,
  }));
});

test("AIRAGCHUNK-PG-007 raw metadata adds no ACL, vector, retrieval, grounding, or inference authority", async () => {
  const row = await store.loadForContext({
    requestContext: industryA1(),
    ragChunkId: f.chunkIndustryA1,
  });
  assert.ok(row);

  const model = await admin.query(
    "SELECT status FROM core_ai.ai_model WHERE id=$1",
    [f.model],
  );
  assert.equal(model.rows[0].status, "RETIRED");

  const privileges = await scoped.withContext(industryA1(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.rag_chunk','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.rag_chunk','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.rag_chunk','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.rag_chunk','DELETE') AS can_delete`,
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
  assert.equal(typeof store.loadVector, "undefined");
  assert.equal(typeof store.evaluateAcl, "undefined");
  assert.equal(typeof store.retrieve, "undefined");
  assert.equal(typeof store.search, "undefined");
  assert.equal(typeof store.rerank, "undefined");
  assert.equal(typeof store.ground, "undefined");
  assert.equal(typeof store.execute, "undefined");
});
