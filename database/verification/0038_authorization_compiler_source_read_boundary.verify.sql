-- Verification 0038: Authorization compiler source-read boundary
DO $$
DECLARE
  source_table text;
BEGIN
  FOREACH source_table IN ARRAY ARRAY[
    'permission_definition','role_template','role_permission','role_assignment','platform_role_assignment'
  ]
  LOOP
    IF NOT has_table_privilege(
      'sbg_authorization_compiler_rw',
      format('core_authz.%I',source_table),
      'SELECT'
    ) THEN
      RAISE EXCEPTION 'compiler source SELECT missing on %',source_table;
    END IF;
    IF has_table_privilege('sbg_authorization_compiler_rw',format('core_authz.%I',source_table),'INSERT')
       OR has_table_privilege('sbg_authorization_compiler_rw',format('core_authz.%I',source_table),'UPDATE')
       OR has_table_privilege('sbg_authorization_compiler_rw',format('core_authz.%I',source_table),'DELETE') THEN
      RAISE EXCEPTION 'compiler source mutation privilege present on %',source_table;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname='core_authz'
      AND tablename='platform_role_assignment'
      AND policyname='platform_role_assignment_compiler_read_policy'
      AND cmd='SELECT'
  ) THEN
    RAISE EXCEPTION 'platform compiler source-read RLS policy missing';
  END IF;
END $$;
