-- Verification 0011-0014: AI schema, isolation and gateway boundary

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname='core_ai'
  ) THEN
    RAISE EXCEPTION 'core_ai schema missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname='vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension missing';
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('tenant_ai_config'),
    ('industry_ai_config'),
    ('ai_policy'),
    ('prompt_template'),
    ('ai_provisioning_snapshot'),
    ('ai_media_request'),
    ('assistant_definition'),
    ('ai_conversation'),
    ('ai_message'),
    ('token_usage'),
    ('ai_cost'),
    ('rag_source'),
    ('rag_chunk'),
    ('ai_memory_record'),
    ('agent_definition'),
    ('agent_run'),
    ('agent_step'),
    ('agent_approval')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='core_ai'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Expected forced RLS missing on % core_ai scoped tables', missing;
  END IF;
END $$;

DO $$
BEGIN
  IF has_schema_privilege('sbg_app_rw','core_ai','USAGE') THEN
    RAISE EXCEPTION 'General application role must not have direct core_ai schema usage';
  END IF;

  IF NOT has_schema_privilege('sbg_ai_gateway_rw','core_ai','USAGE') THEN
    RAISE EXCEPTION 'AI Gateway role must have core_ai usage';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname='sbg_ai_gateway_rw'
      AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'AI Gateway runtime role must remain least-privilege and NOBYPASSRLS';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='core_ai'
      AND indexname='prompt_template_active_uq'
  ) THEN
    RAISE EXCEPTION 'Prompt ACTIVE uniqueness missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='core_ai'
      AND indexname='ai_provisioning_snapshot_active_uq'
  ) THEN
    RAISE EXCEPTION 'AI provisioning ACTIVE uniqueness missing';
  END IF;
END $$;

DO $$
DECLARE
  token_limit text;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
    INTO token_limit
  FROM pg_constraint c
  JOIN pg_class t ON t.oid=c.conrelid
  JOIN pg_namespace n ON n.oid=t.relnamespace
  WHERE n.nspname='core_ai'
    AND t.relname='rag_chunk'
    AND c.contype='c'
    AND pg_get_constraintdef(c.oid) LIKE '%1200%';

  IF token_limit IS NULL THEN
    RAISE EXCEPTION 'RAG chunk absolute token ceiling 1200 not enforced';
  END IF;
END $$;
