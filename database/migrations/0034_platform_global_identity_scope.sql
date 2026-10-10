-- SBGlobal Plus — Migration 0034: PLATFORM_GLOBAL identity/API-credential scope floor (DD-043)
BEGIN;

CREATE OR REPLACE FUNCTION core_identity.validate_api_credential_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  item_count integer;
  unique_count integer;
  principal_kind text;
  principal_status text;
  principal_scopes text[];
  credential_scope text := CASE
    WHEN NEW.tenant_id IS NULL THEN 'PLATFORM_GLOBAL'
    WHEN NEW.industry_context_id IS NULL THEN 'TENANT_CORE'
    ELSE 'TENANT_INDUSTRY'
  END;
BEGIN
  SELECT count(*),count(DISTINCT item)
  INTO item_count,unique_count
  FROM unnest(NEW.allowed_industry_context_ids) AS values_row(item);
  IF item_count<>unique_count OR array_position(NEW.allowed_industry_context_ids,NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'API credential allowed Industry Context list must be unique and non-null' USING ERRCODE='23514';
  END IF;
  IF NEW.tenant_id IS NULL AND (NEW.industry_context_id IS NOT NULL OR item_count<>0) THEN
    RAISE EXCEPTION 'platform credential cannot carry tenant Industry Contexts' USING ERRCODE='23514';
  END IF;
  IF NEW.tenant_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(NEW.allowed_industry_context_ids) AS allowed(allowed_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM core_tenancy.industry_context context_row
      WHERE context_row.tenant_id=NEW.tenant_id AND context_row.id=allowed.allowed_id
    )
  ) THEN
    RAISE EXCEPTION 'API credential allowed Industry Context is outside its tenant' USING ERRCODE='23514';
  END IF;
  IF NEW.industry_context_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(NEW.allowed_industry_context_ids) AS allowed(allowed_id)
    WHERE allowed.allowed_id<>NEW.industry_context_id
  ) THEN
    RAISE EXCEPTION 'industry-scoped API credential cannot widen to a sibling context' USING ERRCODE='23514';
  END IF;

  SELECT principal_type::text,status::text,allowed_scope_classes
  INTO principal_kind,principal_status,principal_scopes
  FROM core_identity.platform_principal WHERE id=NEW.principal_id;
  IF NOT FOUND OR principal_status<>'ACTIVE' THEN
    RAISE EXCEPTION 'API credential principal is missing or inactive' USING ERRCODE='23514';
  ELSIF principal_kind='PLATFORM_OPERATOR' THEN
    RAISE EXCEPTION 'platform operator access requires interactive identity/elevation' USING ERRCODE='23514';
  ELSIF NEW.tenant_id IS NULL AND (
    principal_kind<>'SERVICE'
    OR NOT 'PLATFORM_GLOBAL'=ANY(COALESCE(principal_scopes,'{}'::text[]))
  ) THEN
    RAISE EXCEPTION 'platform-global machine credential requires allowlisted service principal' USING ERRCODE='23514';
  ELSIF NEW.tenant_id IS NOT NULL AND principal_kind='SERVICE'
    AND NOT credential_scope=ANY(COALESCE(principal_scopes,'{}'::text[])) THEN
    RAISE EXCEPTION 'service principal is not allowlisted for credential scope' USING ERRCODE='23514';
  ELSIF NEW.tenant_id IS NOT NULL AND principal_kind='HUMAN' AND NOT EXISTS (
    SELECT 1 FROM core_identity.tenant_membership membership
    WHERE membership.tenant_id=NEW.tenant_id AND membership.principal_id=NEW.principal_id
      AND membership.status='ACTIVE'
      AND (membership.valid_from IS NULL OR membership.valid_from<=NEW.created_at)
      AND (membership.valid_until IS NULL OR membership.valid_until>NEW.created_at)
  ) THEN
    RAISE EXCEPTION 'human API credential principal is outside tenant' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_identity.validate_api_credential_scope() FROM PUBLIC;

COMMIT;
