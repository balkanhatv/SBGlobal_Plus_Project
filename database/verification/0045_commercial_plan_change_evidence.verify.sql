-- SBGlobal Plus — Verification 0045: governed Commercial plan-change evidence
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT rolname,rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolbypassrls,rolcanlogin
    FROM pg_roles
    WHERE rolname IN (
      'sbg_commercial_plan_change_evidence_rw',
      'sbg_billing_plan_change_evidence_rw'
    )
  LOOP
    IF r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolinherit
       OR r.rolbypassrls OR r.rolcanlogin THEN
      RAISE EXCEPTION '0045 unsafe evidence producer role: %',r.rolname;
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM pg_roles WHERE rolname IN (
    'sbg_commercial_plan_change_evidence_rw',
    'sbg_billing_plan_change_evidence_rw'
  ))<>2 THEN
    RAISE EXCEPTION '0045 evidence producer role inventory mismatch';
  END IF;
END $$;

DO $$
DECLARE missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('plan_change_assessment','plan_change_assessment_tenant_select'),
    ('plan_change_assessment','plan_change_assessment_commercial_insert'),
    ('plan_change_remediation_evidence','plan_change_remediation_tenant_select'),
    ('plan_change_remediation_evidence','plan_change_remediation_commercial_insert'),
    ('plan_change_route_resolution','plan_change_resolution_tenant_select'),
    ('plan_change_route_resolution','plan_change_resolution_billing_insert'),
    ('plan_change_route_resolution','plan_change_resolution_workflow_insert')
  ) AS expected(table_name,policy_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies policy
    WHERE policy.schemaname='core_commercial'
      AND policy.tablename=expected.table_name
      AND policy.policyname=expected.policy_name
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0045 plan-change policy inventory mismatch: %',missing;
  END IF;
END $$;

DO $$
BEGIN
  IF has_table_privilege('sbg_app_rw','core_commercial.plan_change_assessment','SELECT')
     OR has_table_privilege('sbg_app_rw','core_commercial.plan_change_assessment','INSERT')
     OR has_table_privilege('sbg_worker_rw','core_commercial.plan_change_route_resolution','SELECT')
     OR has_table_privilege('sbg_control_plane_rw','core_commercial.plan_change_route_resolution','INSERT') THEN
    RAISE EXCEPTION '0045 general runtime role leaked plan-change evidence privilege';
  END IF;

  IF NOT has_table_privilege(
      'sbg_commercial_plan_change_evidence_rw',
      'core_commercial.plan_change_assessment','INSERT'
    )
    OR NOT has_table_privilege(
      'sbg_commercial_plan_change_evidence_rw',
      'core_commercial.plan_change_remediation_evidence','INSERT'
    )
    OR has_table_privilege(
      'sbg_commercial_plan_change_evidence_rw',
      'core_commercial.plan_change_route_resolution','INSERT'
    ) THEN
    RAISE EXCEPTION '0045 Commercial evidence grants mismatch';
  END IF;

  IF NOT has_table_privilege(
      'sbg_billing_plan_change_evidence_rw',
      'core_commercial.plan_change_route_resolution','INSERT'
    )
    OR NOT has_table_privilege(
      'sbg_workflow_worker_rw',
      'core_commercial.plan_change_route_resolution','INSERT'
    )
    OR has_table_privilege(
      'sbg_commercial_transition_compiler_rw',
      'core_commercial.plan_change_route_resolution','INSERT'
    ) THEN
    RAISE EXCEPTION '0045 route-resolution producer grants mismatch';
  END IF;
END $$;

DO $$
DECLARE bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM (VALUES
    ('plan_change_assessment','TENANT_CORE'),
    ('plan_change_remediation_evidence','TENANT_CORE'),
    ('plan_change_route_resolution','TENANT_CORE')
  ) AS expected(table_name,scope_class)
  LEFT JOIN core_authz.rls_table_registry registry
    ON registry.schema_name='core_commercial'
   AND registry.table_name=expected.table_name
  WHERE registry.table_name IS NULL
     OR registry.scope_class<>expected.scope_class
     OR NOT registry.force_rls_required;
  IF bad<>0 THEN
    RAISE EXCEPTION '0045 RLS registry mismatch: %',bad;
  END IF;
END $$;
