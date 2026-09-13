-- SBGlobal Plus — Verification 0029: identity/RLS/privilege/scope hardening

DO $$
DECLARE
  missing integer;
  unsafe_roles integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_tenancy','tenant'),
    ('core_identity','platform_principal'),
    ('core_identity','identity_provider_link'),
    ('core_authz','operator_elevation')
  ) expected(schema_name,table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
    WHERE namespace.nspname=expected.schema_name AND relation.relname=expected.table_name
      AND relation.relrowsecurity AND relation.relforcerowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM core_authz.rls_table_registry registry
    WHERE registry.schema_name=expected.schema_name AND registry.table_name=expected.table_name
      AND registry.status='ACTIVE'
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0029 expected forced-RLS/registry contracts missing: %',missing;
  END IF;

  SELECT count(*) INTO unsafe_roles FROM pg_roles
  WHERE rolname IN ('sbg_identity_service_rw','sbg_control_plane_rw')
    AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolcanlogin OR rolinherit OR rolbypassrls);
  IF unsafe_roles<>0 OR (
    SELECT count(*) FROM pg_roles WHERE rolname IN ('sbg_identity_service_rw','sbg_control_plane_rw')
  )<>2 THEN
    RAISE EXCEPTION '0029 dedicated service roles absent or over-privileged';
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM pg_class relation
  JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
  WHERE relation.relkind IN ('r','p') AND NOT relation.relispartition
    AND (left(namespace.nspname,5)='core_' OR left(namespace.nspname,4)='ind_')
    AND EXISTS (
      SELECT 1 FROM pg_attribute attribute
      WHERE attribute.attrelid=relation.oid AND attribute.attnum>0 AND NOT attribute.attisdropped
        AND attribute.attname IN (
          'tenant_id','industry_context_id','source_industry_context_id',
          'target_industry_context_id','scope_class','owner_scope'
        )
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_trigger trigger_row
      WHERE trigger_row.tgrelid=relation.oid AND trigger_row.tgname='immutable_scope_ownership'
        AND NOT trigger_row.tgisinternal
    );
  IF missing<>0 THEN
    RAISE EXCEPTION '0029 immutable ownership trigger missing on % eligible tables',missing;
  END IF;
END $$;

DO $$
BEGIN
  IF has_table_privilege('sbg_app_rw','core_identity.api_credential','SELECT')
     OR has_table_privilege('sbg_app_rw','core_identity.identity_provider_link','SELECT')
     OR has_table_privilege('sbg_app_rw','core_authz.rls_table_registry','SELECT')
     OR has_table_privilege('sbg_app_rw','core_authz.permission_definition','INSERT')
     OR has_table_privilege('sbg_app_rw','core_commercial.plan','UPDATE')
     OR has_table_privilege('sbg_app_rw','core_integration.event_catalog','DELETE') THEN
    RAISE EXCEPTION '0029 application role retains sensitive/catalog write privilege';
  END IF;
  IF NOT has_table_privilege('sbg_identity_service_rw','core_identity.api_credential','SELECT')
     OR NOT has_table_privilege('sbg_identity_service_rw','core_identity.api_credential','INSERT')
     OR NOT has_table_privilege('sbg_identity_service_rw','core_identity.api_credential','UPDATE')
     OR NOT has_table_privilege('sbg_control_plane_rw','core_authz.operator_elevation','SELECT')
     OR NOT has_table_privilege('sbg_control_plane_rw','core_authz.operator_elevation','INSERT')
     OR NOT has_table_privilege('sbg_control_plane_rw','core_authz.operator_elevation','UPDATE')
     OR NOT has_table_privilege('sbg_control_plane_rw','core_authz.operator_elevation','DELETE')
     OR has_function_privilege('sbg_app_rw','platform_directory.ensure_evidence_month_partitions(date)','EXECUTE')
     OR NOT has_function_privilege('sbg_migration_admin','platform_directory.ensure_evidence_month_partitions(date)','EXECUTE') THEN
    RAISE EXCEPTION '0029 service grants or partition-function revocation incorrect';
  END IF;
  IF has_table_privilege('sbg_app_rw','core_commercial.subscription_transition','UPDATE')
     OR has_table_privilege('sbg_app_rw','core_commercial.entitlement_snapshot','DELETE') THEN
    RAISE EXCEPTION '0029 immutable commercial evidence remains mutable';
  END IF;
END $$;

DO $$
DECLARE
  leaked_defaults integer;
  deletable_industry integer;
BEGIN
  SELECT count(*) INTO leaked_defaults
  FROM pg_default_acl defaults
  CROSS JOIN LATERAL aclexplode(COALESCE(defaults.defaclacl,acldefault('r',defaults.defaclrole))) privilege
  JOIN pg_roles role_row ON role_row.oid=privilege.grantee
  JOIN pg_namespace namespace ON namespace.oid=defaults.defaclnamespace
  WHERE defaults.defaclobjtype='r' AND role_row.rolname='sbg_app_rw'
    AND (left(namespace.nspname,5)='core_' OR left(namespace.nspname,4)='ind_')
    AND privilege.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE');
  IF leaked_defaults<>0 THEN
    RAISE EXCEPTION '0029 blanket app default table privileges remain: %',leaked_defaults;
  END IF;

  SELECT count(*) INTO deletable_industry
  FROM pg_tables table_row
  WHERE left(table_row.schemaname,4)='ind_'
    AND has_table_privilege('sbg_app_rw',format('%I.%I',table_row.schemaname,table_row.tablename),'DELETE');
  IF deletable_industry<>0 THEN
    RAISE EXCEPTION '0029 app can directly delete % Industry tables',deletable_industry;
  END IF;
END $$;

BEGIN;
INSERT INTO platform_directory.data_home
  (id,code,region_code,jurisdiction_code,topology_class,status,routing_version,metadata_json)
VALUES ('29000000-0000-0000-0000-000000000001','V29','R','J','TEST','ACTIVE',1,'{}');
INSERT INTO core_tenancy.tenant
  (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
VALUES
('29000000-0000-0000-0000-000000000011','V29-A','A','A','PROVISIONING','EDU','29000000-0000-0000-0000-000000000001','R',now(),now()),
('29000000-0000-0000-0000-000000000012','V29-B','B','B','PROVISIONING','HLT','29000000-0000-0000-0000-000000000001','R',now(),now());
INSERT INTO core_tenancy.industry_context
  (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
VALUES
('29000000-0000-0000-0000-000000000021','29000000-0000-0000-0000-000000000011','EDU','ACTIVE',true,now(),now()),
('29000000-0000-0000-0000-000000000022','29000000-0000-0000-0000-000000000011','RTL','ACTIVE',false,now(),now()),
('29000000-0000-0000-0000-000000000023','29000000-0000-0000-0000-000000000012','HLT','ACTIVE',true,now(),now());
INSERT INTO core_identity.platform_principal
  (id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
VALUES
('29000000-0000-0000-0000-000000000031','HUMAN','ACTIVE','A',1,now(),now()),
('29000000-0000-0000-0000-000000000032','HUMAN','ACTIVE','B',1,now(),now());
INSERT INTO core_identity.tenant_membership
  (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
VALUES
('29000000-0000-0000-0000-000000000041','29000000-0000-0000-0000-000000000011','29000000-0000-0000-0000-000000000031','ACTIVE',1,now(),now()),
('29000000-0000-0000-0000-000000000042','29000000-0000-0000-0000-000000000012','29000000-0000-0000-0000-000000000032','ACTIVE',1,now(),now());
UPDATE core_tenancy.tenant SET status='ACTIVE' WHERE id IN (
  '29000000-0000-0000-0000-000000000011','29000000-0000-0000-0000-000000000012'
);
SET CONSTRAINTS ALL IMMEDIATE;

INSERT INTO core_config.metadata_definition
  (id,owner_scope,tenant_id,industry_context_id,code,kind,version,status,schema_json,schema_version,
   created_by,created_at,updated_at)
VALUES
  ('29000000-0000-0000-0000-000000000051','INDUSTRY','29000000-0000-0000-0000-000000000011',
   '29000000-0000-0000-0000-000000000021','V29','TEST',1,'ACTIVE','{}',1,
   '29000000-0000-0000-0000-000000000031',now(),now());

DO $$
BEGIN
  BEGIN
    UPDATE core_config.metadata_definition
    SET industry_context_id='29000000-0000-0000-0000-000000000022'
    WHERE id='29000000-0000-0000-0000-000000000051';
    RAISE EXCEPTION 'expected immutable scope update rejection';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

SET LOCAL ROLE sbg_app_rw;
SELECT set_config('app.tenant_id','29000000-0000-0000-0000-000000000011',true);
SELECT set_config('app.industry_context_id','29000000-0000-0000-0000-000000000021',true);
SELECT set_config('app.principal_id','29000000-0000-0000-0000-000000000031',true);
SELECT set_config('app.scope_class','TENANT_INDUSTRY',true);
DO $$
DECLARE
  visible_tenants integer;
  visible_principals integer;
BEGIN
  SELECT count(*) INTO visible_tenants FROM core_tenancy.tenant;
  SELECT count(*) INTO visible_principals FROM core_identity.platform_principal;
  IF visible_tenants<>1 OR visible_principals<>1 THEN
    RAISE EXCEPTION '0029 contextual tenant/principal RLS leaked: tenants %, principals %',visible_tenants,visible_principals;
  END IF;
END $$;
RESET ROLE;
ROLLBACK;
