-- SBGlobal Plus — Verification 0047: atomic plan-change evidence/publication serialization
DO $$
DECLARE
  helper_oid oid;
  public_execute integer;
BEGIN
  SELECT p.oid INTO STRICT helper_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='core_commercial'
    AND p.proname='acquire_plan_change_assessment_lock'
    AND pg_get_function_identity_arguments(p.oid)='p_tenant_id uuid, p_assessment_id uuid';

  IF NOT has_function_privilege(
    'sbg_commercial_transition_compiler_rw',
    helper_oid,
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION '0047 compiler role cannot acquire assessment serialization lock';
  END IF;

  SELECT count(*) INTO public_execute
  FROM aclexplode(COALESCE(
    (SELECT proacl FROM pg_proc WHERE oid=helper_oid),
    acldefault('f',(SELECT proowner FROM pg_proc WHERE oid=helper_oid))
  )) acl
  WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE';
  IF public_execute<>0 THEN
    RAISE EXCEPTION '0047 assessment lock helper is executable by PUBLIC';
  END IF;
END $$;

DO $$
DECLARE trigger_count integer;
BEGIN
  SELECT count(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_proc p ON p.oid=t.tgfoid
  WHERE n.nspname='core_commercial'
    AND c.relname IN (
      'plan_change_assessment',
      'plan_change_remediation_evidence',
      'plan_change_route_resolution'
    )
    AND t.tgname='a_plan_change_evidence_serialization_guard'
    AND NOT t.tgisinternal
    AND p.proname='serialize_plan_change_evidence_insert';

  IF trigger_count<>3 THEN
    RAISE EXCEPTION '0047 evidence serialization trigger inventory mismatch: %',trigger_count;
  END IF;
END $$;

DO $$
BEGIN
  IF has_table_privilege(
       'sbg_commercial_transition_compiler_rw',
       'core_commercial.plan_change_assessment',
       'INSERT,UPDATE,DELETE'
     )
     OR has_table_privilege(
       'sbg_commercial_transition_compiler_rw',
       'core_commercial.plan_change_remediation_evidence',
       'INSERT,UPDATE,DELETE'
     )
     OR has_table_privilege(
       'sbg_commercial_transition_compiler_rw',
       'core_commercial.plan_change_route_resolution',
       'INSERT,UPDATE,DELETE'
     ) THEN
    RAISE EXCEPTION '0047 compiler role gained evidence mutation authority';
  END IF;
END $$;
