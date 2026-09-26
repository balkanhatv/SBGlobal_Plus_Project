-- SBGlobal Plus — 0048 definition scope fail-closed hardening
-- DD-170: preserve the existing PLATFORM/TENANT/INDUSTRY hierarchy while
-- ensuring shared integrity predicates never return SQL UNKNOWN/NULL.

BEGIN;

CREATE OR REPLACE FUNCTION core_tenancy.definition_applies_to_scope(
  p_owner_scope text,p_owner_tenant_id uuid,p_owner_industry_context_id uuid,
  p_target_tenant_id uuid,p_target_industry_context_id uuid
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path=pg_catalog
AS $$
  SELECT COALESCE(
    CASE p_owner_scope
      WHEN 'PLATFORM' THEN
        p_owner_tenant_id IS NULL
        AND p_owner_industry_context_id IS NULL
      WHEN 'TENANT' THEN
        p_owner_tenant_id=p_target_tenant_id
        AND p_owner_industry_context_id IS NULL
      WHEN 'INDUSTRY' THEN
        p_owner_tenant_id=p_target_tenant_id
        AND p_owner_industry_context_id=p_target_industry_context_id
      ELSE false
    END,
    false
  )
$$;

CREATE OR REPLACE FUNCTION core_tenancy.definition_contains_definition(
  p_parent_scope text,p_parent_tenant_id uuid,p_parent_industry_context_id uuid,
  p_child_scope text,p_child_tenant_id uuid,p_child_industry_context_id uuid
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path=pg_catalog
AS $$
  SELECT COALESCE(
    CASE p_child_scope
      WHEN 'PLATFORM' THEN
        p_parent_scope='PLATFORM'
        AND p_parent_tenant_id IS NULL
        AND p_parent_industry_context_id IS NULL
      WHEN 'TENANT' THEN core_tenancy.definition_applies_to_scope(
        p_parent_scope,p_parent_tenant_id,p_parent_industry_context_id,
        p_child_tenant_id,NULL
      )
      WHEN 'INDUSTRY' THEN core_tenancy.definition_applies_to_scope(
        p_parent_scope,p_parent_tenant_id,p_parent_industry_context_id,
        p_child_tenant_id,p_child_industry_context_id
      )
      ELSE false
    END,
    false
  )
$$;

REVOKE ALL ON FUNCTION core_tenancy.definition_applies_to_scope(text,uuid,uuid,uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION core_tenancy.definition_contains_definition(text,uuid,uuid,text,uuid,uuid) FROM PUBLIC;

COMMIT;
