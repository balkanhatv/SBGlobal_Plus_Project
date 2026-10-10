-- SBGlobal Plus — Migration 0030: cross-scope reference and event integrity
-- Audit correction: DEV-DB-AC-008.

BEGIN;

-- Commercial children must reference a parent owned by the same tenant. UUID-only
-- foreign keys proved existence but did not prove ownership.
ALTER TABLE core_commercial.subscription
  ADD CONSTRAINT subscription_tenant_id_id_uq UNIQUE (tenant_id,id);
ALTER TABLE core_commercial.entitlement_snapshot
  ADD CONSTRAINT entitlement_snapshot_tenant_id_id_uq UNIQUE (tenant_id,id);

ALTER TABLE core_commercial.subscription_transition
  ADD CONSTRAINT subscription_transition_same_tenant_fk
  FOREIGN KEY (tenant_id,subscription_id)
  REFERENCES core_commercial.subscription(tenant_id,id);
ALTER TABLE core_commercial.license
  ADD CONSTRAINT license_subscription_same_tenant_fk
  FOREIGN KEY (tenant_id,subscription_id)
  REFERENCES core_commercial.subscription(tenant_id,id);
ALTER TABLE core_commercial.tenant_add_on
  ADD CONSTRAINT tenant_add_on_subscription_same_tenant_fk
  FOREIGN KEY (tenant_id,subscription_id)
  REFERENCES core_commercial.subscription(tenant_id,id);
ALTER TABLE core_commercial.entitlement_snapshot
  ADD CONSTRAINT entitlement_snapshot_subscription_same_tenant_fk
  FOREIGN KEY (tenant_id,source_subscription_id)
  REFERENCES core_commercial.subscription(tenant_id,id);
ALTER TABLE core_tenancy.tenant
  ADD CONSTRAINT tenant_current_subscription_same_tenant_fk
  FOREIGN KEY (id,current_subscription_id)
  REFERENCES core_commercial.subscription(tenant_id,id);

-- Facts now carry explicit tenant ownership rather than relying on a UUID-only parent.
ALTER TABLE core_commercial.entitlement_snapshot_fact
  DISABLE TRIGGER immutable_scope_ownership;
ALTER TABLE core_commercial.entitlement_snapshot_fact
  ADD COLUMN tenant_id uuid;
UPDATE core_commercial.entitlement_snapshot_fact fact
SET tenant_id=snapshot.tenant_id
FROM core_commercial.entitlement_snapshot snapshot
WHERE snapshot.id=fact.snapshot_id;
ALTER TABLE core_commercial.entitlement_snapshot_fact
  ALTER COLUMN tenant_id SET NOT NULL,
  ADD CONSTRAINT entitlement_snapshot_fact_parent_same_tenant_fk
    FOREIGN KEY (tenant_id,snapshot_id)
    REFERENCES core_commercial.entitlement_snapshot(tenant_id,id),
  ADD CONSTRAINT entitlement_snapshot_fact_industry_same_tenant_fk
    FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id);
ALTER TABLE core_commercial.entitlement_snapshot_fact
  ENABLE TRIGGER immutable_scope_ownership;

DROP POLICY entitlement_snapshot_fact_parent_policy ON core_commercial.entitlement_snapshot_fact;
CREATE POLICY entitlement_snapshot_fact_parent_policy ON core_commercial.entitlement_snapshot_fact
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (
      industry_context_id IS NULL
      OR industry_context_id=core_tenancy.current_industry_context_id()
    )
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (
      industry_context_id IS NULL
      OR industry_context_id=core_tenancy.current_industry_context_id()
    )
  );

-- Membership, principal and role-template scope must agree for an assignment.
CREATE OR REPLACE FUNCTION core_authz.validate_role_assignment_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  role_row record;
  principal_kind text;
  principal_status text;
  principal_scopes text[];
  creator_kind text;
  creator_status text;
  assignment_scope text := CASE
    WHEN NEW.industry_context_id IS NULL THEN 'TENANT_CORE'
    ELSE 'TENANT_INDUSTRY'
  END;
BEGIN
  SELECT owner_scope::text,tenant_id,industry_context_id,status::text
  INTO role_row
  FROM core_authz.role_template
  WHERE id=NEW.role_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'role assignment references missing role template' USING ERRCODE='23503';
  ELSIF role_row.status<>'ACTIVE' THEN
    RAISE EXCEPTION 'role assignment requires an active role template' USING ERRCODE='23514';
  END IF;

  IF role_row.owner_scope='TENANT' AND role_row.tenant_id<>NEW.tenant_id THEN
    RAISE EXCEPTION 'tenant role template does not belong to assignment tenant' USING ERRCODE='23514';
  ELSIF role_row.owner_scope='INDUSTRY' AND (
    role_row.tenant_id<>NEW.tenant_id
    OR role_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id
  ) THEN
    RAISE EXCEPTION 'industry role template does not match assignment context' USING ERRCODE='23514';
  END IF;

  SELECT principal_type::text,status::text,allowed_scope_classes
  INTO principal_kind,principal_status,principal_scopes
  FROM core_identity.platform_principal
  WHERE id=NEW.principal_id;

  IF NOT FOUND OR principal_status<>'ACTIVE' THEN
    RAISE EXCEPTION 'role assignment principal is missing or inactive' USING ERRCODE='23514';
  ELSIF principal_kind='PLATFORM_OPERATOR' THEN
    RAISE EXCEPTION 'platform operators use time-bounded elevation, not persistent tenant roles' USING ERRCODE='23514';
  ELSIF principal_kind='SERVICE' AND NOT assignment_scope=ANY(COALESCE(principal_scopes,'{}'::text[])) THEN
    RAISE EXCEPTION 'service principal is not allowlisted for assignment scope' USING ERRCODE='23514';
  END IF;

  IF NEW.membership_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM core_identity.tenant_membership membership
      WHERE membership.id=NEW.membership_id
        AND membership.tenant_id=NEW.tenant_id
        AND membership.principal_id=NEW.principal_id
        AND membership.status='ACTIVE'
        AND (membership.valid_from IS NULL OR membership.valid_from<=COALESCE(NEW.valid_from,now()))
        AND (membership.valid_until IS NULL OR membership.valid_until>COALESCE(NEW.valid_from,now()))
    ) THEN
      RAISE EXCEPTION 'role assignment membership is not active for tenant/principal' USING ERRCODE='23514';
    END IF;
  ELSIF principal_kind='HUMAN' THEN
    RAISE EXCEPTION 'human role assignment requires matching active membership' USING ERRCODE='23514';
  END IF;

  SELECT principal_type::text,status::text INTO creator_kind,creator_status
  FROM core_identity.platform_principal WHERE id=NEW.created_by;
  IF NOT FOUND OR creator_status<>'ACTIVE' OR (
    creator_kind='HUMAN' AND NOT EXISTS (
      SELECT 1 FROM core_identity.tenant_membership membership
      WHERE membership.tenant_id=NEW.tenant_id AND membership.principal_id=NEW.created_by
        AND membership.status='ACTIVE'
        AND (membership.valid_from IS NULL OR membership.valid_from<=NEW.created_at)
        AND (membership.valid_until IS NULL OR membership.valid_until>NEW.created_at)
    )
  ) THEN
    RAISE EXCEPTION 'role assignment creator is outside tenant' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_authz.validate_role_assignment_scope() FROM PUBLIC;
CREATE TRIGGER role_assignment_scope_integrity
  BEFORE INSERT OR UPDATE ON core_authz.role_assignment
  FOR EACH ROW EXECUTE FUNCTION core_authz.validate_role_assignment_scope();

-- API keys may be platform-, tenant-, or one-industry-scoped. An optional allowed
-- set is a same-tenant subset, never an unvalidated UUID bag.
ALTER TABLE core_identity.api_credential
  ADD COLUMN allowed_industry_context_ids uuid[] NOT NULL DEFAULT '{}',
  ADD CONSTRAINT api_credential_physical_scope_ck CHECK (
    (tenant_id IS NULL AND industry_context_id IS NULL)
    OR tenant_id IS NOT NULL
  );

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
  IF NEW.tenant_id IS NULL AND item_count<>0 THEN
    RAISE EXCEPTION 'platform API credential cannot carry tenant Industry Contexts' USING ERRCODE='23514';
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
    RAISE EXCEPTION 'platform operator access requires an interactive time-bounded elevation' USING ERRCODE='23514';
  ELSIF principal_kind='SERVICE' AND NOT credential_scope=ANY(COALESCE(principal_scopes,'{}'::text[])) THEN
    RAISE EXCEPTION 'service principal is not allowlisted for credential scope' USING ERRCODE='23514';
  ELSIF principal_kind='HUMAN' AND NEW.tenant_id IS NOT NULL AND NOT EXISTS (
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
CREATE TRIGGER api_credential_scope_integrity
  BEFORE INSERT OR UPDATE ON core_identity.api_credential
  FOR EACH ROW EXECUTE FUNCTION core_identity.validate_api_credential_scope();

-- Export requests represent only one exact physical scope in this table. Any true
-- cross-context export requires a separately governed projection contract.
ALTER TABLE core_config.data_export_request
  ADD CONSTRAINT data_export_request_requester_fk
    FOREIGN KEY (requester_principal_id) REFERENCES core_identity.platform_principal(id),
  ADD CONSTRAINT data_export_request_subject_fk
    FOREIGN KEY (subject_principal_id) REFERENCES core_identity.platform_principal(id),
  ADD CONSTRAINT data_export_request_document_fk
    FOREIGN KEY (document_id) REFERENCES core_document.document_meta(id),
  ADD CONSTRAINT data_export_request_exact_scope_ck CHECK (
    (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  ADD CONSTRAINT data_export_request_sensitivity_ck CHECK (
    sensitivity_ceiling IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  );
DROP POLICY data_export_request_context_policy ON core_config.data_export_request;
CREATE POLICY data_export_request_context_policy ON core_config.data_export_request
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (
      (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
      OR (
        scope_class='TENANT_INDUSTRY'
        AND industry_context_id=core_tenancy.current_industry_context_id()
      )
    )
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (
      (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
      OR (
        scope_class='TENANT_INDUSTRY'
        AND industry_context_id=core_tenancy.current_industry_context_id()
      )
    )
  );

-- An integration may use a tenant-wide credential or an exact-context credential,
-- but never another tenant's or a sibling context's secret reference.
CREATE OR REPLACE FUNCTION core_integration.validate_tenant_integration_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  credential_tenant uuid;
  credential_context uuid;
  credential_status text;
  credential_expires_at timestamptz;
  definition_status text;
  definition_capabilities text[];
  item_count integer;
  unique_count integer;
BEGIN
  SELECT tenant_id,industry_context_id,status,expires_at
  INTO credential_tenant,credential_context,credential_status,credential_expires_at
  FROM core_integration.credential_reference
  WHERE id=NEW.credential_reference_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'tenant integration references missing credential' USING ERRCODE='23503';
  END IF;
  IF credential_tenant IS DISTINCT FROM NEW.tenant_id
     OR (credential_context IS NOT NULL AND credential_context IS DISTINCT FROM NEW.industry_context_id) THEN
    RAISE EXCEPTION 'tenant integration credential scope mismatch' USING ERRCODE='23514';
  END IF;
  IF credential_status<>'ACTIVE' OR (credential_expires_at IS NOT NULL AND credential_expires_at<=now()) THEN
    RAISE EXCEPTION 'tenant integration credential is inactive or expired' USING ERRCODE='23514';
  END IF;
  SELECT status,capability_codes INTO definition_status,definition_capabilities
  FROM core_integration.integration_definition
  WHERE id=NEW.integration_definition_id;
  IF definition_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'tenant integration definition is missing or inactive' USING ERRCODE='23514';
  END IF;
  IF jsonb_typeof(NEW.config_json_encrypted_or_safe)<>'object' THEN
    RAISE EXCEPTION 'tenant integration configuration must be an object' USING ERRCODE='23514';
  END IF;
  SELECT count(*),count(DISTINCT item) INTO item_count,unique_count
  FROM unnest(NEW.enabled_capabilities) AS values_row(item);
  IF item_count<>unique_count OR array_position(NEW.enabled_capabilities,NULL) IS NOT NULL OR EXISTS (
    SELECT 1 FROM unnest(NEW.enabled_capabilities) AS enabled(capability_code)
    WHERE NOT enabled.capability_code=ANY(COALESCE(definition_capabilities,'{}'::text[])) OR NOT EXISTS (
      SELECT 1 FROM core_integration.integration_capability capability
      WHERE capability.integration_definition_id=NEW.integration_definition_id
        AND capability.capability_code=enabled.capability_code AND capability.status='ACTIVE'
    )
  ) THEN
    RAISE EXCEPTION 'tenant integration capability set is duplicate, missing, or inactive' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_integration.validate_tenant_integration_scope() FROM PUBLIC;
CREATE TRIGGER tenant_integration_scope_integrity
  BEFORE INSERT OR UPDATE ON core_integration.tenant_integration
  FOR EACH ROW EXECUTE FUNCTION core_integration.validate_tenant_integration_scope();

CREATE OR REPLACE FUNCTION core_integration.validate_sync_cursor_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM core_integration.tenant_integration integration_row
    JOIN core_integration.integration_capability capability
      ON capability.integration_definition_id=integration_row.integration_definition_id
     AND capability.capability_code=NEW.capability_code AND capability.status='ACTIVE'
    WHERE integration_row.id=NEW.tenant_integration_id AND integration_row.status='ACTIVE'
      AND integration_row.industry_context_id IS NOT DISTINCT FROM NEW.industry_context_id
      AND NEW.capability_code=ANY(integration_row.enabled_capabilities)
  ) THEN
    RAISE EXCEPTION 'sync cursor capability/scope is outside active tenant integration' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_integration.validate_sync_cursor_scope() FROM PUBLIC;
CREATE TRIGGER sync_cursor_scope_integrity
  BEFORE INSERT OR UPDATE ON core_integration.sync_cursor
  FOR EACH ROW EXECUTE FUNCTION core_integration.validate_sync_cursor_scope();

CREATE OR REPLACE FUNCTION core_integration.validate_idempotency_actor_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1 FROM core_identity.platform_principal principal
      WHERE principal.id=NEW.credential_or_principal_id AND principal.status='ACTIVE'
        AND (
          principal.principal_type='HUMAN' AND EXISTS (
            SELECT 1 FROM core_identity.tenant_membership membership
            WHERE membership.tenant_id=NEW.tenant_id
              AND membership.principal_id=principal.id AND membership.status='ACTIVE'
              AND (membership.valid_from IS NULL OR membership.valid_from<=NEW.created_at)
              AND (membership.valid_until IS NULL OR membership.valid_until>NEW.created_at)
          )
          OR principal.principal_type='SERVICE' AND (
            CASE WHEN NEW.industry_context_id IS NULL THEN 'TENANT_CORE' ELSE 'TENANT_INDUSTRY' END
          )=ANY(COALESCE(principal.allowed_scope_classes,'{}'::text[]))
        )
    ) OR EXISTS (
      SELECT 1 FROM core_identity.api_credential credential
      WHERE credential.id=NEW.credential_or_principal_id AND credential.status='ACTIVE'
        AND credential.tenant_id=NEW.tenant_id
        AND (credential.expires_at IS NULL OR credential.expires_at>NEW.created_at)
        AND (
          NEW.industry_context_id IS NULL AND credential.industry_context_id IS NULL
          OR NEW.industry_context_id IS NOT NULL AND (
            credential.industry_context_id=NEW.industry_context_id
            OR credential.industry_context_id IS NULL
              AND NEW.industry_context_id=ANY(credential.allowed_industry_context_ids)
          )
        )
    )
  ) THEN
    RAISE EXCEPTION 'idempotency actor/credential is outside operation scope' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_integration.validate_idempotency_actor_scope() FROM PUBLIC;
CREATE TRIGGER idempotency_actor_scope_integrity
  BEFORE INSERT OR UPDATE ON core_integration.idempotency_record
  FOR EACH ROW EXECUTE FUNCTION core_integration.validate_idempotency_actor_scope();

-- Outbox rows now carry their cataloged scope explicitly. The envelope, physical
-- ownership columns and event-catalog scope must agree before persistence.
ALTER TABLE core_integration.event_catalog
  ADD CONSTRAINT event_catalog_type_version_scope_uq UNIQUE (event_type,event_version,scope_class);
ALTER TABLE core_integration.outbox_event
  DISABLE TRIGGER immutable_scope_ownership;
ALTER TABLE core_integration.outbox_event
  ADD COLUMN scope_class text;
UPDATE core_integration.outbox_event
SET scope_class=CASE
  WHEN tenant_id IS NULL THEN 'PLATFORM_GLOBAL'
  WHEN industry_context_id IS NULL THEN 'TENANT_CORE'
  ELSE 'TENANT_INDUSTRY'
END;
ALTER TABLE core_integration.outbox_event
  ALTER COLUMN scope_class SET NOT NULL,
  ADD CONSTRAINT outbox_event_scope_class_ck CHECK (
    scope_class IN ('PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY','EXPLICIT_CROSS_CONTEXT')
  ),
  ADD CONSTRAINT outbox_event_physical_scope_ck CHECK (
    (scope_class='PLATFORM_GLOBAL' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (scope_class='TENANT_CORE' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
    OR (scope_class='EXPLICIT_CROSS_CONTEXT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
  ),
  ADD CONSTRAINT outbox_event_catalog_scope_fk
    FOREIGN KEY (event_type,event_version,scope_class)
    REFERENCES core_integration.event_catalog(event_type,event_version,scope_class);
ALTER TABLE core_integration.outbox_event
  ENABLE TRIGGER immutable_scope_ownership;

CREATE OR REPLACE FUNCTION core_integration.validate_outbox_envelope_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  source_context uuid;
  target_context uuid;
  correlation_id uuid;
  occurred_at timestamptz;
  catalog_row record;
  tenant_region text;
BEGIN
  IF jsonb_typeof(NEW.envelope_jsonb)<>'object'
     OR NEW.envelope_jsonb->>'eventId' IS DISTINCT FROM NEW.id::text
     OR NEW.envelope_jsonb->>'eventType' IS DISTINCT FROM NEW.event_type
     OR NEW.envelope_jsonb->>'eventVersion' IS DISTINCT FROM NEW.event_version::text
     OR NEW.envelope_jsonb->>'scopeClass' IS DISTINCT FROM NEW.scope_class THEN
    RAISE EXCEPTION 'outbox envelope identity/catalog fields do not match row' USING ERRCODE='23514';
  END IF;

  SELECT producer_module,sensitivity_class INTO catalog_row
  FROM core_integration.event_catalog
  WHERE event_type=NEW.event_type AND event_version=NEW.event_version AND scope_class=NEW.scope_class;
  IF NOT FOUND
     OR NEW.envelope_jsonb->>'sourceModule' IS DISTINCT FROM catalog_row.producer_module
     OR NEW.envelope_jsonb->>'dataSensitivity' IS DISTINCT FROM catalog_row.sensitivity_class
     OR NULLIF(NEW.envelope_jsonb->>'actorType','') IS NULL
     OR NULLIF(NEW.envelope_jsonb->>'sourceResourceType','') IS NULL
     OR NULLIF(NEW.envelope_jsonb->>'sourceResourceId','') IS NULL
     OR NULLIF(NEW.envelope_jsonb->>'payloadSchema','') IS NULL
     OR NOT NEW.envelope_jsonb ? 'payload' THEN
    RAISE EXCEPTION 'outbox envelope mandatory/catalog fields are absent or inconsistent' USING ERRCODE='23514';
  END IF;
  BEGIN
    correlation_id:=(NEW.envelope_jsonb->>'correlationId')::uuid;
    occurred_at:=(NEW.envelope_jsonb->>'occurredAt')::timestamptz;
  EXCEPTION WHEN invalid_text_representation OR datetime_field_overflow OR null_value_not_allowed THEN
    RAISE EXCEPTION 'outbox envelope correlationId/occurredAt is invalid' USING ERRCODE='23514';
  END;
  IF correlation_id IS NULL OR occurred_at IS NULL THEN
    RAISE EXCEPTION 'outbox envelope correlationId/occurredAt is required' USING ERRCODE='23514';
  END IF;

  IF NEW.scope_class='PLATFORM_GLOBAL' THEN
    IF NULLIF(NEW.envelope_jsonb->>'tenantId','') IS NOT NULL
       OR NULLIF(NEW.envelope_jsonb->>'industryContextId','') IS NOT NULL THEN
      RAISE EXCEPTION 'platform event envelope cannot contain tenant ownership' USING ERRCODE='23514';
    END IF;
  ELSE
    IF NEW.envelope_jsonb->>'tenantId' IS DISTINCT FROM NEW.tenant_id::text THEN
      RAISE EXCEPTION 'outbox envelope tenant does not match row' USING ERRCODE='23514';
    END IF;
    SELECT residency_region_code INTO tenant_region
    FROM core_tenancy.tenant WHERE id=NEW.tenant_id;
    IF NEW.envelope_jsonb->>'residencyRegion' IS DISTINCT FROM tenant_region THEN
      RAISE EXCEPTION 'outbox envelope residency region does not match tenant' USING ERRCODE='23514';
    END IF;
  END IF;

  IF NEW.scope_class='TENANT_INDUSTRY' AND
     NEW.envelope_jsonb->>'industryContextId' IS DISTINCT FROM NEW.industry_context_id::text THEN
    RAISE EXCEPTION 'outbox envelope Industry Context does not match row' USING ERRCODE='23514';
  ELSIF NEW.scope_class='TENANT_CORE' AND
     NULLIF(NEW.envelope_jsonb->>'industryContextId','') IS NOT NULL THEN
    RAISE EXCEPTION 'tenant-core event envelope cannot contain Industry Context' USING ERRCODE='23514';
  ELSIF NEW.scope_class='EXPLICIT_CROSS_CONTEXT' THEN
    BEGIN
      source_context:=(NEW.envelope_jsonb->>'sourceIndustryContextId')::uuid;
      target_context:=(NEW.envelope_jsonb->>'targetIndustryContextId')::uuid;
    EXCEPTION WHEN invalid_text_representation OR null_value_not_allowed THEN
      RAISE EXCEPTION 'cross-context event requires valid source and target contexts' USING ERRCODE='23514';
    END;
    IF source_context IS NULL OR target_context IS NULL OR source_context=target_context OR NOT EXISTS (
      SELECT 1 FROM core_tenancy.industry_context source_row
      JOIN core_tenancy.industry_context target_row
        ON target_row.tenant_id=source_row.tenant_id
      WHERE source_row.tenant_id=NEW.tenant_id AND source_row.id=source_context
        AND target_row.id=target_context
    ) THEN
      RAISE EXCEPTION 'cross-context event source/target must be distinct contexts of its tenant' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_integration.validate_outbox_envelope_scope() FROM PUBLIC;
CREATE TRIGGER outbox_envelope_scope_integrity
  BEFORE INSERT OR UPDATE ON core_integration.outbox_event
  FOR EACH ROW EXECUTE FUNCTION core_integration.validate_outbox_envelope_scope();

CREATE OR REPLACE FUNCTION core_integration.outbox_row_visible(
  p_scope_class text,p_tenant_id uuid,p_industry_context_id uuid,p_envelope jsonb
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path=pg_catalog
AS $$
  SELECT CASE
    WHEN p_scope_class='PLATFORM_GLOBAL' THEN
      core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
    WHEN p_scope_class='TENANT_CORE' THEN
      p_tenant_id=core_tenancy.current_tenant_id() AND p_industry_context_id IS NULL
    WHEN p_scope_class='TENANT_INDUSTRY' THEN
      p_tenant_id=core_tenancy.current_tenant_id()
      AND p_industry_context_id=core_tenancy.current_industry_context_id()
    WHEN p_scope_class='EXPLICIT_CROSS_CONTEXT' THEN
      p_tenant_id=core_tenancy.current_tenant_id()
      AND core_tenancy.current_industry_context_id() IS NOT NULL
      AND core_tenancy.current_industry_context_id()::text IN (
        p_envelope->>'sourceIndustryContextId',p_envelope->>'targetIndustryContextId'
      )
    ELSE false
  END
$$;
REVOKE ALL ON FUNCTION core_integration.outbox_row_visible(text,uuid,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION core_integration.outbox_row_visible(text,uuid,uuid,jsonb)
  TO sbg_app_rw,sbg_worker_rw,sbg_monitor_ro,sbg_integration_service_rw;

DROP POLICY outbox_event_context_policy ON core_integration.outbox_event;
CREATE POLICY outbox_event_context_policy ON core_integration.outbox_event
  USING (core_integration.outbox_row_visible(scope_class,tenant_id,industry_context_id,envelope_jsonb))
  WITH CHECK (core_integration.outbox_row_visible(scope_class,tenant_id,industry_context_id,envelope_jsonb));

-- Audit cross-context rows carry both explicit endpoints just like their governed
-- event counterparts; null never means all sibling industries.
ALTER TABLE core_audit.audit_event
  ADD COLUMN source_industry_context_id uuid,
  ADD COLUMN target_industry_context_id uuid,
  ADD CONSTRAINT audit_event_source_context_fk
    FOREIGN KEY (tenant_id,source_industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  ADD CONSTRAINT audit_event_target_context_fk
    FOREIGN KEY (tenant_id,target_industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  ADD CONSTRAINT audit_event_exact_physical_scope_ck CHECK (
    (scope_class='PLATFORM_GLOBAL' AND tenant_id IS NULL AND industry_context_id IS NULL
      AND source_industry_context_id IS NULL AND target_industry_context_id IS NULL)
    OR (scope_class='TENANT_CORE' AND tenant_id IS NOT NULL AND industry_context_id IS NULL
      AND source_industry_context_id IS NULL AND target_industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL
      AND source_industry_context_id IS NULL AND target_industry_context_id IS NULL)
    OR (scope_class='EXPLICIT_CROSS_CONTEXT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL
      AND source_industry_context_id IS NOT NULL AND target_industry_context_id IS NOT NULL
      AND source_industry_context_id<>target_industry_context_id)
  );

CREATE OR REPLACE FUNCTION core_audit.audit_row_visible(
  p_scope_class text,p_tenant_id uuid,p_industry_context_id uuid,
  p_source_industry_context_id uuid,p_target_industry_context_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path=pg_catalog
AS $$
  SELECT CASE
    WHEN p_scope_class='PLATFORM_GLOBAL' THEN
      core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
    WHEN p_scope_class='TENANT_CORE' THEN
      p_tenant_id=core_tenancy.current_tenant_id() AND p_industry_context_id IS NULL
    WHEN p_scope_class='TENANT_INDUSTRY' THEN
      p_tenant_id=core_tenancy.current_tenant_id()
      AND p_industry_context_id=core_tenancy.current_industry_context_id()
    WHEN p_scope_class='EXPLICIT_CROSS_CONTEXT' THEN
      p_tenant_id=core_tenancy.current_tenant_id()
      AND core_tenancy.current_industry_context_id() IN (
        p_source_industry_context_id,p_target_industry_context_id
      )
    ELSE false
  END
$$;
REVOKE ALL ON FUNCTION core_audit.audit_row_visible(text,uuid,uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION core_audit.audit_row_visible(text,uuid,uuid,uuid,uuid)
  TO sbg_app_rw,sbg_worker_rw,sbg_monitor_ro,sbg_ai_gateway_rw,
     sbg_workflow_worker_rw,sbg_notification_worker_rw,sbg_document_service_rw,
     sbg_integration_service_rw;

DROP POLICY audit_event_context_policy ON core_audit.audit_event;
CREATE POLICY audit_event_context_policy ON core_audit.audit_event
  USING (core_audit.audit_row_visible(
    scope_class,tenant_id,industry_context_id,source_industry_context_id,target_industry_context_id
  ))
  WITH CHECK (core_audit.audit_row_visible(
    scope_class,tenant_id,industry_context_id,source_industry_context_id,target_industry_context_id
  ));

DO $$
DECLARE
  partition_row record;
BEGIN
  FOR partition_row IN
    SELECT child_namespace.nspname AS schema_name,child.relname AS table_name
    FROM pg_inherits inheritance
    JOIN pg_class parent ON parent.oid=inheritance.inhparent
    JOIN pg_namespace parent_namespace ON parent_namespace.oid=parent.relnamespace
    JOIN pg_class child ON child.oid=inheritance.inhrelid
    JOIN pg_namespace child_namespace ON child_namespace.oid=child.relnamespace
    WHERE parent_namespace.nspname='core_integration' AND parent.relname='outbox_event'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS outbox_event_context_policy ON %I.%I',partition_row.schema_name,partition_row.table_name);
    EXECUTE format(
      'CREATE POLICY outbox_event_context_policy ON %I.%I USING (core_integration.outbox_row_visible(scope_class,tenant_id,industry_context_id,envelope_jsonb)) WITH CHECK (core_integration.outbox_row_visible(scope_class,tenant_id,industry_context_id,envelope_jsonb))',
      partition_row.schema_name,partition_row.table_name
    );
  END LOOP;
END $$;

DO $$
DECLARE
  partition_row record;
BEGIN
  FOR partition_row IN
    SELECT child_namespace.nspname AS schema_name,child.relname AS table_name
    FROM pg_inherits inheritance
    JOIN pg_class parent ON parent.oid=inheritance.inhparent
    JOIN pg_namespace parent_namespace ON parent_namespace.oid=parent.relnamespace
    JOIN pg_class child ON child.oid=inheritance.inhrelid
    JOIN pg_namespace child_namespace ON child_namespace.oid=child.relnamespace
    WHERE parent_namespace.nspname='core_audit' AND parent.relname='audit_event'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS audit_event_context_policy ON %I.%I',partition_row.schema_name,partition_row.table_name);
    EXECUTE format(
      'CREATE POLICY audit_event_context_policy ON %I.%I USING (core_audit.audit_row_visible(scope_class,tenant_id,industry_context_id,source_industry_context_id,target_industry_context_id)) WITH CHECK (core_audit.audit_row_visible(scope_class,tenant_id,industry_context_id,source_industry_context_id,target_industry_context_id))',
      partition_row.schema_name,partition_row.table_name
    );
  END LOOP;
END $$;

-- Webhook subscription context lists and deliveries are tied to the same tenant and
-- to a cataloged webhook-eligible event. Partition identity rows cannot disagree.
ALTER TABLE core_integration.webhook_subscription
  ADD CONSTRAINT webhook_subscription_secret_version_ck CHECK (secret_version>0),
  ADD CONSTRAINT webhook_subscription_verified_active_ck CHECK (
    status<>'ACTIVE' OR verified_at IS NOT NULL
  ),
  ADD CONSTRAINT webhook_subscription_filter_object_ck CHECK (
    jsonb_typeof(event_filter_json)='object'
  );

CREATE OR REPLACE FUNCTION core_integration.validate_webhook_subscription_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  item_count integer;
  unique_count integer;
BEGIN
  SELECT count(*),count(DISTINCT item) INTO item_count,unique_count
  FROM unnest(NEW.allowed_industry_context_ids) AS values_row(item);
  IF item_count<>unique_count OR array_position(NEW.allowed_industry_context_ids,NULL) IS NOT NULL OR EXISTS (
    SELECT 1 FROM unnest(NEW.allowed_industry_context_ids) AS allowed(allowed_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM core_tenancy.industry_context context_row
      WHERE context_row.tenant_id=NEW.tenant_id AND context_row.id=allowed.allowed_id
    )
  ) THEN
    RAISE EXCEPTION 'webhook allowed Industry Contexts must be unique contexts of its tenant' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM core_identity.platform_principal principal
    WHERE principal.id=NEW.created_by AND principal.status='ACTIVE'
      AND (
        principal.principal_type<>'HUMAN'
        OR EXISTS (
          SELECT 1 FROM core_identity.tenant_membership membership
          WHERE membership.tenant_id=NEW.tenant_id AND membership.principal_id=NEW.created_by
            AND membership.status='ACTIVE'
            AND (membership.valid_from IS NULL OR membership.valid_from<=NEW.created_at)
            AND (membership.valid_until IS NULL OR membership.valid_until>NEW.created_at)
        )
      )
  ) THEN
    RAISE EXCEPTION 'webhook subscription creator is outside tenant' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_integration.validate_webhook_subscription_scope() FROM PUBLIC;
CREATE TRIGGER webhook_subscription_scope_integrity
  BEFORE INSERT OR UPDATE ON core_integration.webhook_subscription
  FOR EACH ROW EXECUTE FUNCTION core_integration.validate_webhook_subscription_scope();

ALTER TABLE core_integration.webhook_delivery_identity
  ADD CONSTRAINT webhook_delivery_identity_full_uq
  UNIQUE (id,created_at,subscription_id,event_id,attempt_no);
ALTER TABLE core_integration.webhook_delivery
  ADD CONSTRAINT webhook_delivery_identity_full_fk
  FOREIGN KEY (id,created_at,subscription_id,event_id,attempt_no)
  REFERENCES core_integration.webhook_delivery_identity(id,created_at,subscription_id,event_id,attempt_no);

CREATE OR REPLACE FUNCTION core_integration.validate_webhook_delivery_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  subscription_row record;
  event_row record;
BEGIN
  SELECT tenant_id,allowed_industry_context_ids
  INTO subscription_row
  FROM core_integration.webhook_subscription
  WHERE id=NEW.subscription_id;
  SELECT event_data.tenant_id,event_data.industry_context_id,event_data.scope_class,event_data.envelope_jsonb,
         catalog.webhook_eligible
  INTO event_row
  FROM core_integration.outbox_event event_data
  JOIN core_integration.event_catalog catalog
    ON catalog.event_type=event_data.event_type
   AND catalog.event_version=event_data.event_version
   AND catalog.scope_class=event_data.scope_class
  WHERE event_data.id=NEW.event_id;
  IF subscription_row.tenant_id IS NULL OR event_row.tenant_id IS NULL THEN
    RAISE EXCEPTION 'webhook delivery requires existing tenant subscription and event' USING ERRCODE='23514';
  END IF;
  IF NOT event_row.webhook_eligible OR subscription_row.tenant_id<>event_row.tenant_id THEN
    RAISE EXCEPTION 'webhook event is ineligible or belongs to another tenant' USING ERRCODE='23514';
  END IF;
  IF event_row.scope_class='TENANT_INDUSTRY'
     AND NOT event_row.industry_context_id=ANY(subscription_row.allowed_industry_context_ids) THEN
    RAISE EXCEPTION 'webhook subscription does not allow event Industry Context' USING ERRCODE='23514';
  ELSIF event_row.scope_class='EXPLICIT_CROSS_CONTEXT'
     AND NOT (
       (event_row.envelope_jsonb->>'sourceIndustryContextId')::uuid=ANY(subscription_row.allowed_industry_context_ids)
       AND (event_row.envelope_jsonb->>'targetIndustryContextId')::uuid=ANY(subscription_row.allowed_industry_context_ids)
     ) THEN
    RAISE EXCEPTION 'webhook subscription does not allow both cross-context endpoints' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_integration.validate_webhook_delivery_scope() FROM PUBLIC;
CREATE TRIGGER webhook_delivery_scope_integrity
  BEFORE INSERT OR UPDATE ON core_integration.webhook_delivery
  FOR EACH ROW EXECUTE FUNCTION core_integration.validate_webhook_delivery_scope();

REVOKE UPDATE,DELETE ON core_integration.outbox_event_identity,
  core_integration.webhook_delivery_identity
FROM sbg_worker_rw,sbg_integration_service_rw;

-- Active tenants have exactly one matching active primary Industry Context. The
-- deferred rule supports atomic provisioning while rejecting a committed mismatch.
CREATE OR REPLACE FUNCTION core_tenancy.validate_primary_industry_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  target_tenant uuid;
  tenant_row record;
  primary_count integer;
  matching_count integer;
BEGIN
  IF TG_TABLE_NAME='tenant' THEN
    IF TG_OP='DELETE' THEN target_tenant:=OLD.id; ELSE target_tenant:=NEW.id; END IF;
  ELSE
    IF TG_OP='DELETE' THEN target_tenant:=OLD.tenant_id; ELSE target_tenant:=NEW.tenant_id; END IF;
  END IF;
  SELECT status::text,primary_industry_code INTO tenant_row
  FROM core_tenancy.tenant WHERE id=target_tenant;
  IF NOT FOUND OR tenant_row.status<>'ACTIVE' THEN
    IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  SELECT count(*),count(*) FILTER (WHERE industry_code=tenant_row.primary_industry_code)
  INTO primary_count,matching_count
  FROM core_tenancy.industry_context
  WHERE tenant_id=target_tenant AND is_primary AND status<>'DISABLED';
  IF primary_count<>1 OR matching_count<>1 THEN
    RAISE EXCEPTION 'active tenant must have one primary Industry Context matching primary_industry_code' USING ERRCODE='23514';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
REVOKE ALL ON FUNCTION core_tenancy.validate_primary_industry_contract() FROM PUBLIC;
CREATE CONSTRAINT TRIGGER tenant_primary_industry_integrity
  AFTER INSERT OR UPDATE ON core_tenancy.tenant
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION core_tenancy.validate_primary_industry_contract();
CREATE CONSTRAINT TRIGGER industry_context_primary_integrity
  AFTER INSERT OR UPDATE OR DELETE ON core_tenancy.industry_context
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION core_tenancy.validate_primary_industry_contract();

-- Replace the partition provisioner so every future outbox partition receives the
-- corrected exact-scope policy. Audit and webhook policy behavior is preserved.
CREATE OR REPLACE FUNCTION platform_directory.ensure_evidence_month_partitions(p_month date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  month_start date := date_trunc('month',p_month)::date;
  month_end date := (date_trunc('month',p_month)+interval '1 month')::date;
  suffix text := to_char(month_start,'YYYYMM');
  audit_partition text := 'audit_event_'||suffix;
  outbox_partition text := 'outbox_event_'||suffix;
  webhook_partition text := 'webhook_delivery_'||suffix;
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS core_audit.%I PARTITION OF core_audit.audit_event FOR VALUES FROM (%L) TO (%L)',audit_partition,month_start,month_end);
  EXECUTE format('ALTER TABLE core_audit.%I ENABLE ROW LEVEL SECURITY',audit_partition);
  EXECUTE format('ALTER TABLE core_audit.%I FORCE ROW LEVEL SECURITY',audit_partition);
  EXECUTE format('DROP POLICY IF EXISTS audit_event_context_policy ON core_audit.%I',audit_partition);
  EXECUTE format($policy$
    CREATE POLICY audit_event_context_policy ON core_audit.%I
    USING (core_audit.audit_row_visible(scope_class,tenant_id,industry_context_id,source_industry_context_id,target_industry_context_id))
    WITH CHECK (core_audit.audit_row_visible(scope_class,tenant_id,industry_context_id,source_industry_context_id,target_industry_context_id))
  $policy$,audit_partition);

  EXECUTE format('CREATE TABLE IF NOT EXISTS core_integration.%I PARTITION OF core_integration.outbox_event FOR VALUES FROM (%L) TO (%L)',outbox_partition,month_start,month_end);
  EXECUTE format('ALTER TABLE core_integration.%I ENABLE ROW LEVEL SECURITY',outbox_partition);
  EXECUTE format('ALTER TABLE core_integration.%I FORCE ROW LEVEL SECURITY',outbox_partition);
  EXECUTE format('DROP POLICY IF EXISTS outbox_event_context_policy ON core_integration.%I',outbox_partition);
  EXECUTE format('CREATE POLICY outbox_event_context_policy ON core_integration.%I USING (core_integration.outbox_row_visible(scope_class,tenant_id,industry_context_id,envelope_jsonb)) WITH CHECK (core_integration.outbox_row_visible(scope_class,tenant_id,industry_context_id,envelope_jsonb))',outbox_partition);

  EXECUTE format('CREATE TABLE IF NOT EXISTS core_integration.%I PARTITION OF core_integration.webhook_delivery FOR VALUES FROM (%L) TO (%L)',webhook_partition,month_start,month_end);
  EXECUTE format('ALTER TABLE core_integration.%I ENABLE ROW LEVEL SECURITY',webhook_partition);
  EXECUTE format('ALTER TABLE core_integration.%I FORCE ROW LEVEL SECURITY',webhook_partition);
  EXECUTE format('DROP POLICY IF EXISTS webhook_delivery_parent_context_policy ON core_integration.%I',webhook_partition);
  EXECUTE format($policy$
    CREATE POLICY webhook_delivery_parent_context_policy ON core_integration.%I
    USING (
      EXISTS (SELECT 1 FROM core_integration.webhook_subscription subscription WHERE subscription.id=subscription_id)
      AND EXISTS (SELECT 1 FROM core_integration.outbox_event event_row WHERE event_row.id=event_id)
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM core_integration.webhook_subscription subscription WHERE subscription.id=subscription_id)
      AND EXISTS (SELECT 1 FROM core_integration.outbox_event event_row WHERE event_row.id=event_id)
    )
  $policy$,webhook_partition);
END;
$$;
REVOKE ALL ON FUNCTION platform_directory.ensure_evidence_month_partitions(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform_directory.ensure_evidence_month_partitions(date) TO sbg_migration_admin;

COMMIT;
