-- SBGlobal Plus — Verification 0044: atomic Commercial publication support
DO $$
BEGIN
  IF NOT has_table_privilege(
    'sbg_commercial_transition_compiler_rw','core_tenancy.tenant','SELECT'
  ) THEN
    RAISE EXCEPTION '0044 Commercial publication writer needs same-Tenant residency read';
  END IF;

  IF has_table_privilege(
    'sbg_commercial_transition_compiler_rw','core_tenancy.tenant','UPDATE'
  ) OR has_table_privilege(
    'sbg_commercial_transition_compiler_rw','core_tenancy.tenant','INSERT'
  ) OR has_table_privilege(
    'sbg_commercial_transition_compiler_rw','core_tenancy.tenant','DELETE'
  ) THEN
    RAISE EXCEPTION '0044 Commercial publication writer must not mutate Tenant directory';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='core_tenancy'
      AND tablename='tenant'
      AND policyname='tenant_resolved_context_policy'
  ) THEN
    RAISE EXCEPTION '0044 resolved Tenant FORCE-RLS policy missing';
  END IF;
END $$;
