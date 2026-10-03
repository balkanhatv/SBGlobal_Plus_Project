-- SBGlobal Plus — Verification 0043: dedicated Commercial transition/compiler boundary

DO $$
DECLARE role_row record;
BEGIN
  SELECT rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolbypassrls,rolcanlogin
  INTO role_row
  FROM pg_roles
  WHERE rolname='sbg_commercial_transition_compiler_rw';

  IF NOT FOUND
    OR role_row.rolsuper OR role_row.rolcreatedb OR role_row.rolcreaterole
    OR role_row.rolinherit OR role_row.rolbypassrls OR role_row.rolcanlogin THEN
    RAISE EXCEPTION '0043 Commercial writer role is absent or unsafe';
  END IF;

  IF NOT has_schema_privilege(
    'sbg_commercial_transition_compiler_rw','core_commercial','USAGE'
  ) THEN
    RAISE EXCEPTION '0043 Commercial writer lacks core_commercial usage';
  END IF;
END $$;

DO $$
BEGIN
  IF has_table_privilege('sbg_app_rw','core_commercial.subscription','INSERT')
     OR has_table_privilege('sbg_app_rw','core_commercial.subscription','UPDATE')
     OR has_table_privilege('sbg_app_rw','core_commercial.subscription','DELETE')
     OR has_table_privilege('sbg_app_rw','core_commercial.license','UPDATE')
     OR has_table_privilege('sbg_app_rw','core_commercial.entitlement_snapshot','INSERT')
     OR has_table_privilege('sbg_app_rw','core_commercial.entitlement_snapshot_fact','INSERT') THEN
    RAISE EXCEPTION '0043 general app role retains forbidden Commercial mutation';
  END IF;

  IF has_table_privilege('sbg_worker_rw','core_commercial.subscription','UPDATE')
     OR has_table_privilege('sbg_worker_rw','core_commercial.entitlement_snapshot','INSERT') THEN
    RAISE EXCEPTION '0043 general worker role retains forbidden Commercial mutation';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','SELECT'
    )
    OR NOT has_column_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','plan_version_id','UPDATE'
    )
    OR NOT has_column_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','version','UPDATE'
    )
    OR NOT has_column_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','updated_at','UPDATE'
    )
    OR has_column_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','state','UPDATE'
    )
    OR has_column_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','billing_anchor_at','UPDATE'
    )
    OR has_column_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','current_invoice_id','UPDATE'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','INSERT'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription','DELETE'
    ) THEN
    RAISE EXCEPTION '0043 Subscription column-limited write boundary mismatch';
  END IF;

  IF NOT has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription_transition','INSERT'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription_transition','UPDATE'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.subscription_transition','DELETE'
    )
    OR NOT has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.entitlement_snapshot','INSERT'
    )
    OR NOT has_column_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.entitlement_snapshot','status','UPDATE'
    )
    OR has_column_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.entitlement_snapshot','source_plan_version_id','UPDATE'
    )
    OR NOT has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.entitlement_snapshot_fact','INSERT'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.entitlement_snapshot_fact','UPDATE'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.entitlement_snapshot_fact','DELETE'
    ) THEN
    RAISE EXCEPTION '0043 immutable publication grants mismatch';
  END IF;

  IF has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.license','UPDATE'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.tenant_override','INSERT'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_commercial.usage_meter','UPDATE'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw','core_integration.event_catalog','INSERT'
    ) THEN
    RAISE EXCEPTION '0043 writer leaked source/catalog mutation';
  END IF;
END $$;

DO $$
DECLARE missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_commercial','license','license_commercial_compiler_tenant_select','PERMISSIVE'),
    ('core_commercial','tenant_override','tenant_override_commercial_compiler_tenant_select','PERMISSIVE'),
    ('core_commercial','usage_meter','usage_meter_commercial_compiler_tenant_select','PERMISSIVE'),
    ('core_commercial','entitlement_snapshot_fact','entitlement_snapshot_fact_commercial_compiler_tenant_select','PERMISSIVE'),
    ('core_commercial','entitlement_snapshot_fact','entitlement_snapshot_fact_commercial_compiler_tenant_insert','PERMISSIVE'),
    ('core_integration','outbox_event','outbox_event_commercial_writer_restrictive','RESTRICTIVE'),
    ('core_audit','audit_event','audit_event_commercial_writer_restrictive','RESTRICTIVE')
  ) AS expected(schema_name,table_name,policy_name,permissive_mode)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies policy
    WHERE policy.schemaname=expected.schema_name
      AND policy.tablename=expected.table_name
      AND policy.policyname=expected.policy_name
      AND policy.permissive=expected.permissive_mode
      AND 'sbg_commercial_transition_compiler_rw'=ANY(policy.roles)
  );

  IF missing<>0 THEN
    RAISE EXCEPTION '0043 Commercial writer RLS policy inventory mismatch: %',missing;
  END IF;
END $$;

-- Real FORCE-RLS proof: TENANT_CORE compiler may read all same-Tenant Industry inputs
-- but never a sibling Tenant. Roll back all fixture rows.
BEGIN;

INSERT INTO platform_directory.data_home
(id,code,region_code,jurisdiction_code,topology_class,status,routing_version,metadata_json)
VALUES
('43000000-0000-4000-8000-000000000001','V43-HOME','IN-COMMERCIAL','IN','SHARED','ACTIVE',1,'{}');

INSERT INTO core_tenancy.tenant
(id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
VALUES
('43000000-0000-4000-8000-000000000011','V43-A','V43 A','V43 A','ACTIVE','RTL','43000000-0000-4000-8000-000000000001','IN-COMMERCIAL',now(),now()),
('43000000-0000-4000-8000-000000000012','V43-B','V43 B','V43 B','ACTIVE','EDU','43000000-0000-4000-8000-000000000001','IN-COMMERCIAL',now(),now());

INSERT INTO core_tenancy.industry_context
(id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
VALUES
('43000000-0000-4000-8000-000000000021','43000000-0000-4000-8000-000000000011','RTL','ACTIVE',true,now(),now()),
('43000000-0000-4000-8000-000000000022','43000000-0000-4000-8000-000000000011','MFG','ACTIVE',false,now(),now()),
('43000000-0000-4000-8000-000000000023','43000000-0000-4000-8000-000000000012','EDU','ACTIVE',true,now(),now());

INSERT INTO core_identity.platform_principal
(id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
VALUES
('43000000-0000-4000-8000-000000000031','HUMAN','ACTIVE','V43 approver',1,now(),now());

INSERT INTO core_commercial.entitlement_definition
(id,code,category,value_type,scope_class,description,deny_semantics,version,status)
VALUES
('43000000-0000-4000-8000-000000000041','v43.feature','FEATURE','BOOLEAN','TENANT_INDUSTRY','v43','DENY_WINS',1,'ACTIVE');

INSERT INTO core_commercial.tenant_override
(id,tenant_id,industry_context_id,entitlement_code,override_type,value_json,reason_code,approved_by,effective_from,status,created_at)
VALUES
('43000000-0000-4000-8000-000000000051','43000000-0000-4000-8000-000000000011',NULL,'v43.feature','DENY','false','V43','43000000-0000-4000-8000-000000000031',now(),'ACTIVE',now()),
('43000000-0000-4000-8000-000000000052','43000000-0000-4000-8000-000000000011','43000000-0000-4000-8000-000000000021','v43.feature','DENY','false','V43','43000000-0000-4000-8000-000000000031',now(),'ACTIVE',now()),
('43000000-0000-4000-8000-000000000053','43000000-0000-4000-8000-000000000011','43000000-0000-4000-8000-000000000022','v43.feature','DENY','false','V43','43000000-0000-4000-8000-000000000031',now(),'ACTIVE',now()),
('43000000-0000-4000-8000-000000000054','43000000-0000-4000-8000-000000000012','43000000-0000-4000-8000-000000000023','v43.feature','DENY','false','V43','43000000-0000-4000-8000-000000000031',now(),'ACTIVE',now());

SET LOCAL ROLE sbg_commercial_transition_compiler_rw;
SELECT set_config('app.tenant_id','43000000-0000-4000-8000-000000000011',true);
SELECT set_config('app.industry_context_id','',true);
SELECT set_config('app.scope_class','TENANT_CORE',true);

DO $$
DECLARE visible integer;
BEGIN
  SELECT count(*) INTO visible
  FROM core_commercial.tenant_override
  WHERE entitlement_code='v43.feature';

  IF visible<>3 THEN
    RAISE EXCEPTION '0043 compiler expected 3 same-Tenant override rows, saw %',visible;
  END IF;

  IF EXISTS (
    SELECT 1 FROM core_commercial.tenant_override
    WHERE tenant_id='43000000-0000-4000-8000-000000000012'
  ) THEN
    RAISE EXCEPTION '0043 compiler leaked sibling Tenant Commercial state';
  END IF;

  BEGIN
    UPDATE core_commercial.tenant_override
    SET value_json='true'::jsonb
    WHERE id='43000000-0000-4000-8000-000000000051';
    RAISE EXCEPTION '0043 compiler unexpectedly mutated override source truth';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;

RESET ROLE;
ROLLBACK;
