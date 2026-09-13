-- DBA-010: contextual platform read is distinct from control-plane write authority.
DO $$
DECLARE missing integer;
BEGIN
  SELECT count(*) INTO missing FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname='owner_scope' AND a.attnum>0 AND NOT a.attisdropped
  WHERE c.relkind='r' AND NOT c.relispartition AND left(n.nspname,5)='core_'
    AND (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid AND NOT p.polpermissive
      AND p.polname IN ('platform_definition_insert_floor','platform_definition_update_floor','platform_definition_delete_floor'))<>3;
  IF missing<>0 THEN RAISE EXCEPTION 'platform mutation floors missing: %',missing; END IF;
  SELECT count(*) INTO missing FROM (VALUES
    ('core_config.form_field_definition'),('core_authz.role_permission'),
    ('core_ai.ai_prompt_set_member'),('core_ai.ai_tool_set_member')
  ) expected(table_name)
  WHERE (SELECT count(*) FROM pg_policy p WHERE p.polrelid=expected.table_name::regclass
    AND NOT p.polpermissive AND p.polname IN (
      'platform_parent_insert_floor','platform_parent_update_floor','platform_parent_delete_floor'))<>3;
  IF missing<>0 THEN RAISE EXCEPTION 'platform child mutation floors missing: %',missing; END IF;
END $$;

BEGIN;
-- Config creator is a governed actor reference at service level; no real identity is
-- needed for this isolated policy test. All fixture content is rolled back.
INSERT INTO core_config.metadata_definition
  (id,owner_scope,code,kind,version,status,schema_json,schema_version,created_by,created_at,updated_at)
VALUES ('32000000-0000-0000-0000-000000000001','PLATFORM','V32','TEST',1,'DRAFT','{}',1,
  '32000000-0000-0000-0000-000000000002',now(),now());
INSERT INTO core_authz.role_template(id,code,owner_scope,name,version,status,created_at,updated_at)
VALUES ('32000000-0000-0000-0000-000000000004','V32','PLATFORM','V32',1,'ACTIVE',now(),now());
INSERT INTO core_authz.permission_definition
  (id,code,domain,module,resource_or_capability,action,scope_class,sensitivity_ceiling,description,status,version)
VALUES ('32000000-0000-0000-0000-000000000005','v32.read','test','test','test','READ','PLATFORM_GLOBAL','INTERNAL','test','ACTIVE',1);
SET LOCAL ROLE sbg_app_rw;
SELECT set_config('app.scope_class','PLATFORM_GLOBAL',true);
SELECT set_config('app.tenant_id','',true);
SELECT set_config('app.industry_context_id','',true);
DO $$
DECLARE changed integer;
BEGIN
  IF (SELECT count(*) FROM core_config.metadata_definition WHERE code='V32')<>1 THEN
    RAISE EXCEPTION 'platform definition read regression';
  END IF;
  UPDATE core_config.metadata_definition SET kind='ATTACK' WHERE code='V32';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>0 THEN RAISE EXCEPTION 'application mutated platform definition'; END IF;
  DELETE FROM core_config.metadata_definition WHERE code='V32';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>0 THEN RAISE EXCEPTION 'application deleted platform definition'; END IF;
  BEGIN
    INSERT INTO core_config.metadata_definition
      (id,owner_scope,code,kind,version,status,schema_json,schema_version,created_by,created_at,updated_at)
    VALUES ('32000000-0000-0000-0000-000000000003','PLATFORM','ATTACK','TEST',1,'DRAFT','{}',1,
      '32000000-0000-0000-0000-000000000002',now(),now());
    RAISE EXCEPTION 'application inserted platform definition';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO core_authz.role_permission(role_id,permission_id,effect,version)
    VALUES ('32000000-0000-0000-0000-000000000004','32000000-0000-0000-0000-000000000005','ALLOW',1);
    RAISE EXCEPTION 'application changed platform role permission binding';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE sbg_control_plane_rw;
DO $$
DECLARE changed integer;
BEGIN
  UPDATE core_config.metadata_definition SET kind='GOVERNED' WHERE code='V32';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION 'control-plane platform update unreachable'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
