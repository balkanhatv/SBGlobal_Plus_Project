import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresFormFieldDefinitionStore } from "../../dist/server/config/postgres-form-field-definition-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_form_field_definition_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const platformCode = "FORM_FIELD_PLATFORM_" + randomBytes(8).toString("hex");

const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","platformService",
  "industryA1","industryA2","industryB1","createdBy",
  "formIndustryA1","formIndustryA2","formTenantA","formTenantB","formPlatform",
  "fieldIndustryA1","fieldIndustryA2","fieldTenantA","fieldTenantB","fieldPlatform","missingField",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function contextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-FORM-FIELD",
    principalId: f.principalA,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreA() {
  return Object.freeze({...contextA(), industryContextId: undefined, scopeClass: "TENANT_CORE"});
}

function tenantCoreB() {
  return Object.freeze({
    ...contextA(),
    tenantId: f.tenantB,
    industryContextId: undefined,
    principalId: f.principalB,
    scopeClass: "TENANT_CORE",
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
    await client.query("GRANT sbg_app_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-FORM-FIELD','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "FormFieldDefinition tenant A"],
      [f.tenantB, "EDU", "FormFieldDefinition tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-FORM-FIELD',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
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
      `INSERT INTO core_config.form_definition
        (id,owner_scope,tenant_id,industry_context_id,code,version,status,schema_version,
         purpose_code,layout_schema_json,allowed_surface_classes,created_by,created_at,updated_at)
       VALUES
        ($1,'INDUSTRY',$6,$8,'ORDER_FORM',2,'ACTIVE',3,'ORDER_CAPTURE','{}'::jsonb,ARRAY['WEB']::text[],$11,now()-interval '20 days',now()-interval '1 day'),
        ($2,'INDUSTRY',$6,$9,'MAINT_FORM',1,'DRAFT',1,'MAINT','{}'::jsonb,ARRAY['STAFF_MOBILE']::text[],$11,now()-interval '8 days',now()-interval '2 days'),
        ($3,'TENANT',$6,NULL,'TENANT_A_FORM',3,'RETIRED',2,'','{}'::jsonb,ARRAY['WEB']::text[],$11,now()-interval '12 days',now()-interval '3 days'),
        ($4,'TENANT',$7,NULL,'TENANT_B_FORM',1,'ACTIVE',1,'TENANT_B','{}'::jsonb,ARRAY['WEB']::text[],$11,now()-interval '7 days',now()-interval '1 day'),
        ($5,'PLATFORM',NULL,NULL,$10,4,'PUBLISHED',4,'GLOBAL','{}'::jsonb,ARRAY['WEB']::text[],$11,now()-interval '2 days',now()-interval '9 days')`,
      [
        f.formIndustryA1,f.formIndustryA2,f.formTenantA,f.formTenantB,f.formPlatform,
        f.tenantA,f.tenantB,f.industryA1,f.industryA2,platformCode,f.createdBy,
      ],
    );

    await client.query(
      `INSERT INTO core_config.form_field_definition
        (id,form_definition_id,field_key,field_type,label_key,required,read_only,
         visibility_rule_ref,validation_schema_json,reference_catalog_ref,sort_order,
         sensitivity_class,created_at)
       VALUES
        ($1,$6,'order_total','DECIMAL','form.order.total',true,false,'RULE_VISIBLE',
          '{"minimum":0,"multipleOf":0.01}'::jsonb,NULL,10,'FINANCIAL',now()-interval '10 days'),
        ($2,$7,'asset','REFERENCE','form.asset',false,true,NULL,
          '{"raw":["asset",""]}'::jsonb,'ASSET_CATALOG',0,'INTERNAL',now()-interval '8 days'),
        ($3,$8,'','TEXT','',true,true,'',
          '{"raw":{"empty":"","nullable":null}}'::jsonb,'',-7,'',now()-interval '6 days'),
        ($4,$9,'tenant_b','BOOLEAN','tenant.b',false,false,NULL,
          '{"tenant":"b"}'::jsonb,NULL,100,'GENERAL',now()-interval '5 days'),
        ($5,$10,'platform_field','JSON_STRUCTURED','platform.field',false,true,NULL,
          '{"platform":true}'::jsonb,NULL,42,'PLATFORM',now()-interval '2 days')`,
      [
        f.fieldIndustryA1,f.fieldIndustryA2,f.fieldTenantA,f.fieldTenantB,f.fieldPlatform,
        f.formIndustryA1,f.formIndustryA2,f.formTenantA,f.formTenantB,f.formPlatform,
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
  pool = new pg.Pool({connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000});
  scoped = new RequestScopedSql(
    new PostgresDatabase(pool),
    {dataHomeId: f.home, regionCode: "IN-FORM-FIELD"},
  );
  store = new PostgresFormFieldDefinitionStore(scoped);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_config.form_field_definition WHERE id=ANY($1::uuid[])",
      [[f.fieldIndustryA1,f.fieldIndustryA2,f.fieldTenantA,f.fieldTenantB,f.fieldPlatform]],
    );
    await client.query(
      "DELETE FROM core_config.form_definition WHERE id=ANY($1::uuid[])",
      [[f.formIndustryA1,f.formIndustryA2,f.formTenantA,f.formTenantB,f.formPlatform]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA,f.tenantB]],
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

test("FORMFIELD-PG-001 exact Industry FormFieldDefinition preserves immutable raw child evidence", async () => {
  const row = await store.loadForContext({
    requestContext: contextA(),
    formFieldDefinitionId: f.fieldIndustryA1,
  });
  assert.ok(row);
  assert.equal(row.id, f.fieldIndustryA1);
  assert.equal(row.formDefinitionId, f.formIndustryA1);
  assert.equal(row.fieldKey, "order_total");
  assert.equal(row.fieldType, "DECIMAL");
  assert.equal(row.labelKey, "form.order.total");
  assert.equal(row.required, true);
  assert.equal(row.readOnly, false);
  assert.equal(row.visibilityRuleRef, "RULE_VISIBLE");
  assert.deepEqual(row.validationSchema, {minimum:0,multipleOf:0.01});
  assert.equal(row.referenceCatalogRef, undefined);
  assert.equal(row.sortOrder, 10);
  assert.equal(row.sensitivityClass, "FINANCIAL");
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.validationSchema), true);
  assert.equal("visible" in row, false);
  assert.equal("validated" in row, false);
  assert.equal("rendered" in row, false);
  assert.equal("submitted" in row, false);
});

test("FORMFIELD-PG-002 sibling Industry parent scope hides FormFieldDefinition", async () => {
  assert.equal(await store.loadForContext({
    requestContext: contextA(),
    formFieldDefinitionId: f.fieldIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: contextA(f.industryA2),
    formFieldDefinitionId: f.fieldIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.formDefinitionId, f.formIndustryA2);
  assert.equal(sibling.fieldType, "REFERENCE");
  assert.equal(sibling.readOnly, true);
});

test("FORMFIELD-PG-003 Tenant-parent child is same-Tenant visible and raw values stay raw", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: contextA(),
    formFieldDefinitionId: f.fieldTenantA,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantCoreA(),
    formFieldDefinitionId: f.fieldTenantA,
  });
  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.fieldKey, "");
  assert.equal(fromIndustry.labelKey, "");
  assert.equal(fromIndustry.visibilityRuleRef, "");
  assert.equal(fromIndustry.referenceCatalogRef, "");
  assert.equal(fromIndustry.sortOrder, -7);
  assert.equal(fromIndustry.sensitivityClass, "");
  assert.equal(fromIndustry.required, true);
  assert.equal(fromIndustry.readOnly, true);
  assert.deepEqual(fromIndustry.validationSchema, {raw:{empty:"",nullable:null}});
  assert.equal(fromTenant.id, f.fieldTenantA);

  const parent = await scoped.withContext(tenantCoreA(), (tx) => tx.query(
    "SELECT status::text FROM core_config.form_definition WHERE id=$1::uuid",
    [f.formTenantA],
  ));
  assert.equal(parent.rows[0].status, "RETIRED");
});

test("FORMFIELD-PG-004 PLATFORM-parent child is not Tenant fallback and needs PLATFORM_GLOBAL", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    formFieldDefinitionId: f.fieldPlatform,
  }), null);

  const platform = await store.loadForContext({
    requestContext: platformContext(),
    formFieldDefinitionId: f.fieldPlatform,
  });
  assert.ok(platform);
  assert.equal(platform.formDefinitionId, f.formPlatform);
  assert.equal(platform.fieldType, "JSON_STRUCTURED");
  assert.deepEqual(platform.validationSchema, {platform:true});
});

test("FORMFIELD-PG-005 foreign-Tenant parent child is hidden", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    formFieldDefinitionId: f.fieldTenantB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantCoreB(),
    formFieldDefinitionId: f.fieldTenantB,
  });
  assert.ok(own);
  assert.equal(own.formDefinitionId, f.formTenantB);
  assert.equal(own.fieldType, "BOOLEAN");
});

test("FORMFIELD-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantCoreA(),
    formFieldDefinitionId: f.missingField,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    formFieldDefinitionId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {...tenantCoreA(), dataHomeId: randomUUID()},
    formFieldDefinitionId: f.fieldTenantA,
  }));
});

test("FORMFIELD-PG-007 raw field evidence adds no enforcement/render/validation/catalog/access/submit authority and write floors stay schema-owned", async () => {
  const privileges = await scoped.withContext(platformContext(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_config.form_field_definition','SELECT') AS can_select,
            has_table_privilege(current_user,'core_config.form_field_definition','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_config.form_field_definition','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_config.form_field_definition','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  const deniedPlatformUpdate = await scoped.withContext(platformContext(), (tx) => tx.query(
    "UPDATE core_config.form_field_definition SET label_key='MUTATED' WHERE id=$1::uuid",
    [f.fieldPlatform],
  ));
  assert.equal(deniedPlatformUpdate.rowCount, 0);

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.sort, "undefined");
  assert.equal(typeof store.render, "undefined");
  assert.equal(typeof store.validate, "undefined");
  assert.equal(typeof store.evaluateVisibility, "undefined");
  assert.equal(typeof store.resolveCatalog, "undefined");
  assert.equal(typeof store.submit, "undefined");
});
