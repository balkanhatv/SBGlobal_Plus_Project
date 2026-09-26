-- SBGlobal Plus — Verification 0002
-- Confirms parent-scoped RLS exists on form_field_definition.

DO $$
DECLARE
  rls_enabled boolean;
  rls_forced boolean;
  policy_count integer;
BEGIN
  SELECT c.relrowsecurity, c.relforcerowsecurity
    INTO rls_enabled, rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'core_config'
    AND c.relname = 'form_field_definition';

  IF NOT COALESCE(rls_enabled, false) OR NOT COALESCE(rls_forced, false) THEN
    RAISE EXCEPTION 'form_field_definition must have forced RLS';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'core_config'
    AND tablename = 'form_field_definition'
    AND policyname = 'form_field_definition_parent_context_policy';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'Expected parent context policy on form_field_definition';
  END IF;
END $$;
