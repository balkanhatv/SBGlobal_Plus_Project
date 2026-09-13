-- SBGlobal Plus — Migration 0031: document, workflow, notification and AI integrity
-- Audit correction: DEV-DB-AC-008 / DEV-DB-AC-009.

BEGIN;

-- Shared, fail-closed predicates used by cross-layer integrity triggers.
CREATE OR REPLACE FUNCTION core_tenancy.definition_applies_to_scope(
  p_owner_scope text,p_owner_tenant_id uuid,p_owner_industry_context_id uuid,
  p_target_tenant_id uuid,p_target_industry_context_id uuid
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path=pg_catalog
AS $$
  SELECT CASE p_owner_scope
    WHEN 'PLATFORM' THEN p_owner_tenant_id IS NULL AND p_owner_industry_context_id IS NULL
    WHEN 'TENANT' THEN p_owner_tenant_id=p_target_tenant_id AND p_owner_industry_context_id IS NULL
    WHEN 'INDUSTRY' THEN p_owner_tenant_id=p_target_tenant_id
      AND p_owner_industry_context_id=p_target_industry_context_id
    ELSE false
  END
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
  SELECT CASE p_child_scope
    WHEN 'PLATFORM' THEN p_parent_scope='PLATFORM'
      AND p_parent_tenant_id IS NULL AND p_parent_industry_context_id IS NULL
    WHEN 'TENANT' THEN core_tenancy.definition_applies_to_scope(
      p_parent_scope,p_parent_tenant_id,p_parent_industry_context_id,p_child_tenant_id,NULL
    )
    WHEN 'INDUSTRY' THEN core_tenancy.definition_applies_to_scope(
      p_parent_scope,p_parent_tenant_id,p_parent_industry_context_id,
      p_child_tenant_id,p_child_industry_context_id
    )
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION core_tenancy.sensitivity_rank(p_class text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path=pg_catalog
AS $$
  SELECT CASE p_class
    WHEN 'PUBLIC' THEN 1 WHEN 'INTERNAL' THEN 2 WHEN 'CONFIDENTIAL' THEN 3
    WHEN 'SENSITIVE_PERSONAL' THEN 4 WHEN 'REGULATED' THEN 5 ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION core_tenancy.uuid_array_is_set(p_values uuid[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path=pg_catalog
AS $$
  SELECT p_values IS NOT NULL
    AND array_position(p_values,NULL) IS NULL
    AND cardinality(p_values)=(
      SELECT count(DISTINCT values_row.value)
      FROM unnest(p_values) AS values_row(value)
    )
$$;

CREATE OR REPLACE FUNCTION core_tenancy.text_array_is_set(p_values text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path=pg_catalog
AS $$
  SELECT p_values IS NOT NULL
    AND array_position(p_values,NULL) IS NULL
    AND cardinality(p_values)=(
      SELECT count(DISTINCT values_row.value)
      FROM unnest(p_values) AS values_row(value)
    )
$$;

CREATE OR REPLACE FUNCTION core_identity.principal_is_active_for_tenant(
  p_tenant_id uuid,p_principal_id uuid,p_at timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM core_identity.platform_principal principal
    WHERE principal.id=p_principal_id AND principal.status='ACTIVE'
      AND (
        principal.principal_type='SERVICE'
        OR EXISTS (
          SELECT 1 FROM core_identity.tenant_membership membership
          WHERE membership.tenant_id=p_tenant_id
            AND membership.principal_id=p_principal_id
            AND membership.status='ACTIVE'
            AND (membership.valid_from IS NULL OR membership.valid_from<=p_at)
            AND (membership.valid_until IS NULL OR membership.valid_until>p_at)
        )
        OR (
          principal.principal_type='PLATFORM_OPERATOR'
          AND EXISTS (
            SELECT 1
            FROM core_authz.operator_elevation elevation
            WHERE elevation.id::text=NULLIF(current_setting('app.operator_elevation_id',true),'')
              AND elevation.operator_principal_id=p_principal_id
              AND elevation.tenant_id=p_tenant_id
              AND core_tenancy.current_principal_id()=p_principal_id
              AND core_tenancy.current_tenant_id()=p_tenant_id
              AND (
                elevation.industry_context_id IS NULL
                OR elevation.industry_context_id=core_tenancy.current_industry_context_id()
              )
              AND elevation.status='ACTIVE'
              AND elevation.starts_at<=p_at
              AND elevation.expires_at>p_at
          )
        )
      )
  )
$$;

CREATE OR REPLACE FUNCTION core_identity.principal_is_active_for_definition(
  p_owner_scope text,p_tenant_id uuid,p_principal_id uuid,p_at timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
  SELECT CASE
    WHEN p_owner_scope='PLATFORM' THEN EXISTS (
      SELECT 1 FROM core_identity.platform_principal principal
      WHERE principal.id=p_principal_id AND principal.status='ACTIVE'
        AND principal.principal_type IN ('SERVICE','PLATFORM_OPERATOR')
    )
    WHEN p_owner_scope IN ('TENANT','INDUSTRY') THEN
      core_identity.principal_is_active_for_tenant(p_tenant_id,p_principal_id,p_at)
    ELSE false
  END
$$;

REVOKE ALL ON FUNCTION core_tenancy.definition_applies_to_scope(text,uuid,uuid,uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION core_tenancy.definition_contains_definition(text,uuid,uuid,text,uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION core_tenancy.sensitivity_rank(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION core_tenancy.uuid_array_is_set(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION core_tenancy.text_array_is_set(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION core_identity.principal_is_active_for_tenant(uuid,uuid,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION core_identity.principal_is_active_for_definition(text,uuid,uuid,timestamptz) FROM PUBLIC;

-- Identity-owned tenant references must represent a real relationship, not merely a
-- globally existing principal UUID. A nullable tenant SessionVersion is restored to
-- the DD contract without permitting duplicate platform-global rows.
ALTER TABLE core_identity.identity_provider_link
  ADD CONSTRAINT identity_provider_link_tenant_hint_fk
  FOREIGN KEY (tenant_hint) REFERENCES core_tenancy.tenant(id);
ALTER TABLE core_identity.session_version
  DROP CONSTRAINT session_version_pkey,
  ALTER COLUMN tenant_id DROP NOT NULL,
  ADD CONSTRAINT session_version_scope_uq UNIQUE NULLS NOT DISTINCT (principal_id,tenant_id);

CREATE OR REPLACE FUNCTION core_identity.validate_identity_tenant_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  principal_kind text;
  principal_status text;
BEGIN
  SELECT principal_type::text,status::text INTO principal_kind,principal_status
  FROM core_identity.platform_principal WHERE id=NEW.principal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'identity row references missing principal' USING ERRCODE='23503';
  END IF;
  IF TG_TABLE_NAME='tenant_membership' THEN
    IF NEW.status='ACTIVE' AND principal_status<>'ACTIVE' THEN
      RAISE EXCEPTION 'active tenant membership requires active principal' USING ERRCODE='23514';
    END IF;
  ELSIF principal_status<>'ACTIVE' THEN
    RAISE EXCEPTION 'device/session row requires active principal' USING ERRCODE='23514';
  ELSIF NEW.tenant_id IS NOT NULL AND principal_kind='HUMAN' AND NOT EXISTS (
    SELECT 1 FROM core_identity.tenant_membership membership
    WHERE membership.tenant_id=NEW.tenant_id AND membership.principal_id=NEW.principal_id
      AND membership.status='ACTIVE'
      AND (membership.valid_from IS NULL OR membership.valid_from<=now())
      AND (membership.valid_until IS NULL OR membership.valid_until>now())
  ) THEN
    RAISE EXCEPTION 'human device/session principal is outside tenant' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_identity.validate_identity_tenant_relationships() FROM PUBLIC;
CREATE TRIGGER tenant_membership_principal_integrity
  BEFORE INSERT OR UPDATE ON core_identity.tenant_membership
  FOR EACH ROW EXECUTE FUNCTION core_identity.validate_identity_tenant_relationships();
CREATE TRIGGER device_registration_principal_integrity
  BEFORE INSERT OR UPDATE ON core_identity.device_registration
  FOR EACH ROW EXECUTE FUNCTION core_identity.validate_identity_tenant_relationships();
CREATE TRIGGER session_version_principal_integrity
  BEFORE INSERT OR UPDATE ON core_identity.session_version
  FOR EACH ROW EXECUTE FUNCTION core_identity.validate_identity_tenant_relationships();

CREATE OR REPLACE FUNCTION core_authz.validate_operator_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM core_identity.platform_principal principal
    WHERE principal.id=NEW.operator_principal_id
      AND principal.principal_type='PLATFORM_OPERATOR' AND principal.status='ACTIVE'
  ) THEN
    RAISE EXCEPTION 'operator elevation requires an active platform operator' USING ERRCODE='23514';
  END IF;
  IF NEW.status='ACTIVE' AND (
    NEW.approved_by IS NULL OR NEW.approved_by=NEW.operator_principal_id OR NOT EXISTS (
      SELECT 1 FROM core_identity.platform_principal approver
      WHERE approver.id=NEW.approved_by AND approver.status='ACTIVE'
        AND approver.principal_type IN ('PLATFORM_OPERATOR','SERVICE')
    )
  ) THEN
    RAISE EXCEPTION 'active operator elevation requires an independent active approver' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_authz.validate_operator_elevation() FROM PUBLIC;
CREATE TRIGGER operator_elevation_relationship_integrity
  BEFORE INSERT OR UPDATE ON core_authz.operator_elevation
  FOR EACH ROW EXECUTE FUNCTION core_authz.validate_operator_elevation();

-- Documents, derivatives and ACL subjects retain one exact ownership scope.
ALTER TABLE core_document.document_meta
  ADD COLUMN ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN ai_media_request_id uuid,
  ADD COLUMN ai_provider_id uuid,
  ADD COLUMN ai_model_id uuid,
  ADD COLUMN ai_provenance_json jsonb,
  ADD COLUMN ai_moderation_result_json jsonb,
  ADD COLUMN ai_licensing_usage_json jsonb,
  ADD CONSTRAINT document_meta_active_clean_ck CHECK (
    status<>'ACTIVE' OR virus_scan_status='CLEAN'
  ),
  ADD CONSTRAINT document_meta_ai_provenance_ck CHECK (
    (NOT ai_generated AND ai_media_request_id IS NULL AND ai_provider_id IS NULL
      AND ai_model_id IS NULL AND ai_provenance_json IS NULL
      AND ai_moderation_result_json IS NULL AND ai_licensing_usage_json IS NULL)
    OR (ai_generated AND ai_media_request_id IS NOT NULL AND ai_provider_id IS NOT NULL
      AND ai_model_id IS NOT NULL AND jsonb_typeof(ai_provenance_json)='object'
      AND jsonb_typeof(ai_moderation_result_json)='object'
      AND (ai_licensing_usage_json IS NULL OR jsonb_typeof(ai_licensing_usage_json)='object'))
  );

CREATE OR REPLACE FUNCTION core_document.validate_document_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  parent_row record;
  document_row record;
  role_row record;
  tenant_row record;
  storage_row record;
  media_row record;
BEGIN
  IF TG_TABLE_NAME='document_meta' THEN
    SELECT data_home_id,residency_region_code INTO tenant_row
    FROM core_tenancy.tenant WHERE id=NEW.tenant_id;
    SELECT data_home_id,size_bytes,checksum_sha256,status::text INTO storage_row
    FROM core_document.storage_object WHERE id=NEW.storage_object_id;
    IF tenant_row.data_home_id IS NULL OR storage_row.data_home_id IS NULL
       OR storage_row.data_home_id<>tenant_row.data_home_id
       OR NEW.residency_region<>tenant_row.residency_region_code
       OR storage_row.size_bytes<>NEW.size_bytes
       OR storage_row.checksum_sha256<>NEW.checksum_sha256
       OR (NEW.status='ACTIVE' AND storage_row.status<>'ACTIVE') THEN
      RAISE EXCEPTION 'document storage object integrity/Data Home/residency mismatch' USING ERRCODE='23514';
    END IF;
    IF NEW.ai_generated THEN
      SELECT tenant_id,industry_context_id,sensitivity_class,residency_requirement,completed_at
      INTO media_row FROM core_ai.ai_media_request WHERE id=NEW.ai_media_request_id;
      IF NOT FOUND OR media_row.completed_at IS NULL OR media_row.tenant_id<>NEW.tenant_id
         OR media_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id
         OR media_row.residency_requirement<>NEW.residency_region
         OR core_tenancy.sensitivity_rank(NEW.sensitivity_class)<
            core_tenancy.sensitivity_rank(media_row.sensitivity_class) THEN
        RAISE EXCEPTION 'AI-generated document provenance is incomplete or outside media-request scope' USING ERRCODE='23514';
      END IF;
    END IF;
    IF (NEW.parent_document_id IS NULL)<>(NEW.derivative_type IS NULL) THEN
      RAISE EXCEPTION 'document parent and derivative type must be supplied together' USING ERRCODE='23514';
    END IF;
    IF NEW.parent_document_id IS NOT NULL THEN
      IF NEW.parent_document_id=NEW.id THEN
        RAISE EXCEPTION 'document cannot derive from itself' USING ERRCODE='23514';
      END IF;
      SELECT tenant_id,industry_context_id,scope_class,sensitivity_class,residency_region,status::text,virus_scan_status::text
      INTO parent_row FROM core_document.document_meta WHERE id=NEW.parent_document_id;
      IF NOT FOUND OR parent_row.tenant_id<>NEW.tenant_id
         OR parent_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id
         OR parent_row.scope_class<>NEW.scope_class
         OR parent_row.residency_region<>NEW.residency_region
         OR parent_row.status<>'ACTIVE' OR parent_row.virus_scan_status<>'CLEAN'
         OR core_tenancy.sensitivity_rank(NEW.sensitivity_class)<core_tenancy.sensitivity_rank(parent_row.sensitivity_class) THEN
        RAISE EXCEPTION 'document derivative cannot cross scope, residency, or lower sensitivity' USING ERRCODE='23514';
      END IF;
    END IF;
    IF (NEW.owner_principal_id IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(
          NEW.tenant_id,NEW.owner_principal_id,NEW.created_at
        )) OR (NEW.created_by IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(
          NEW.tenant_id,NEW.created_by,NEW.created_at
        )) OR (NEW.updated_by IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(
          NEW.tenant_id,NEW.updated_by,NEW.updated_at
        )) THEN
      RAISE EXCEPTION 'document owner/audit principal is not active for tenant' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='document_upload_session' THEN
    IF NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.principal_id,NEW.created_at) THEN
      RAISE EXCEPTION 'document upload principal is outside tenant' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='document_acl' THEN
    SELECT tenant_id,industry_context_id INTO document_row
    FROM core_document.document_meta WHERE id=NEW.document_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACL references missing document' USING ERRCODE='23503';
    END IF;
    IF NEW.subject_type='PRINCIPAL' AND
       NOT core_identity.principal_is_active_for_tenant(document_row.tenant_id,NEW.subject_id,NEW.created_at) THEN
      RAISE EXCEPTION 'document ACL principal is outside tenant' USING ERRCODE='23514';
    ELSIF NEW.subject_type='ROLE' THEN
      SELECT owner_scope::text,tenant_id,industry_context_id INTO role_row
      FROM core_authz.role_template WHERE id=NEW.subject_id;
      IF NOT FOUND OR NOT core_tenancy.definition_applies_to_scope(
        role_row.owner_scope,role_row.tenant_id,role_row.industry_context_id,
        document_row.tenant_id,document_row.industry_context_id
      ) THEN
        RAISE EXCEPTION 'document ACL role is outside document scope' USING ERRCODE='23514';
      END IF;
    ELSIF NEW.subject_type='ORG_UNIT' THEN
      IF NOT EXISTS (
        SELECT 1 FROM core_tenancy.org_unit unit_row
        WHERE unit_row.tenant_id=document_row.tenant_id AND unit_row.id=NEW.subject_id
      ) OR (
        document_row.industry_context_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM core_tenancy.org_unit_industry link
          WHERE link.tenant_id=document_row.tenant_id
            AND link.org_unit_id=NEW.subject_id
            AND link.industry_context_id=document_row.industry_context_id
            AND link.status='ACTIVE'
        )
      ) THEN
        RAISE EXCEPTION 'document ACL org unit is outside document scope' USING ERRCODE='23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_document.validate_document_relationships() FROM PUBLIC;
CREATE TRIGGER document_relationship_integrity
  BEFORE INSERT OR UPDATE ON core_document.document_meta
  FOR EACH ROW EXECUTE FUNCTION core_document.validate_document_relationships();
CREATE TRIGGER document_upload_relationship_integrity
  BEFORE INSERT OR UPDATE ON core_document.document_upload_session
  FOR EACH ROW EXECUTE FUNCTION core_document.validate_document_relationships();
CREATE TRIGGER document_acl_subject_integrity
  BEFORE INSERT OR UPDATE ON core_document.document_acl
  FOR EACH ROW EXECUTE FUNCTION core_document.validate_document_relationships();

-- Every Industry document reference resolves through DocumentMeta in the exact
-- Tenant + Industry Context. The former ambiguous "document_or_storage_ref" is
-- narrowed to a DocumentMeta reference; physical StorageObject IDs are never an
-- Industry authorization path.
ALTER TABLE core_document.document_meta
  ADD CONSTRAINT document_meta_scope_id_uq UNIQUE (tenant_id,industry_context_id,id);
ALTER TABLE ind_psv.psv_sgm_revision RENAME COLUMN document_or_storage_ref TO revision_document_id;
ALTER TABLE ind_psv.psv_sgm_delivery RENAME COLUMN document_vault_ref TO delivery_document_id;

ALTER TABLE ind_edu.edu_ctm_completion ADD CONSTRAINT edu_ctm_completion_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,certificate_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_edu.edu_lms_item ADD CONSTRAINT edu_lms_item_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_edu.edu_lms_submission ADD CONSTRAINT edu_lms_submission_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_edu.edu_ems_candidate ADD CONSTRAINT edu_ems_candidate_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,hall_ticket_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_edu.edu_ems_result ADD CONSTRAINT edu_ems_result_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,result_document_ref)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_psv.psv_crm_proposal ADD CONSTRAINT psv_crm_proposal_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_psv.psv_sdm_deliverable ADD CONSTRAINT psv_sdm_deliverable_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_psv.psv_sgm_revision ADD CONSTRAINT psv_sgm_revision_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,revision_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_psv.psv_sgm_delivery ADD CONSTRAINT psv_sgm_delivery_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,delivery_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_sfm.sfm_sgm_handover ADD CONSTRAINT sfm_sgm_handover_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,note_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_hlt.hlt_hms_admission ADD CONSTRAINT hlt_hms_admission_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,consent_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_hlt.hlt_hms_discharge_summary ADD CONSTRAINT hlt_hms_discharge_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,summary_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_hlt.hlt_lis_report ADD CONSTRAINT hlt_lis_report_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_hlt.hlt_ris_contrast_screen ADD CONSTRAINT hlt_ris_contrast_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,consent_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_hlt.hlt_ris_report ADD CONSTRAINT hlt_ris_report_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_hlt.hlt_cms_referral ADD CONSTRAINT hlt_cms_referral_consent_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,consent_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_hlt.hlt_cms_referral ADD CONSTRAINT hlt_cms_referral_summary_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,summary_document_id)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);
ALTER TABLE ind_gov.gov_cfm_noting ADD CONSTRAINT gov_cfm_noting_document_scope_fk
  FOREIGN KEY (tenant_id,industry_context_id,content_document_ref)
  REFERENCES core_document.document_meta(tenant_id,industry_context_id,id);

CREATE OR REPLACE FUNCTION core_document.validate_industry_document_array()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
BEGIN
  IF array_position(NEW.document_ids,NULL) IS NOT NULL OR EXISTS (
    SELECT 1 FROM unnest(NEW.document_ids) AS reference(document_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM core_document.document_meta document
      WHERE document.id=reference.document_id AND document.tenant_id=NEW.tenant_id
        AND document.industry_context_id=NEW.industry_context_id
    )
  ) THEN
    RAISE EXCEPTION 'Industry document array contains a null/foreign-scope document' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_document.validate_industry_document_array() FROM PUBLIC;
CREATE TRIGGER sfm_pms_incident_document_scope_integrity
  BEFORE INSERT OR UPDATE ON ind_sfm.sfm_pms_incident
  FOR EACH ROW EXECUTE FUNCTION core_document.validate_industry_document_array();

-- Tenant audit evidence must be routed to the tenant's authoritative Data Home and
-- may name only a principal valid for that tenant at the evidence timestamp.
CREATE OR REPLACE FUNCTION core_audit.validate_audit_event_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  tenant_row record;
BEGIN
  IF jsonb_typeof(NEW.evidence_json)<>'object' THEN
    RAISE EXCEPTION 'audit evidence payload must be an object' USING ERRCODE='23514';
  END IF;
  IF NEW.scope_class='PLATFORM_GLOBAL' THEN
    IF NEW.actor_principal_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM core_identity.platform_principal principal
      WHERE principal.id=NEW.actor_principal_id AND principal.status='ACTIVE'
        AND principal.principal_type IN ('SERVICE','PLATFORM_OPERATOR')
    ) THEN
      RAISE EXCEPTION 'platform audit actor is not an active platform principal' USING ERRCODE='23514';
    END IF;
  ELSE
    SELECT data_home_id,residency_region_code INTO tenant_row
    FROM core_tenancy.tenant WHERE id=NEW.tenant_id;
    IF NOT FOUND OR NEW.data_home_id IS DISTINCT FROM tenant_row.data_home_id
       OR NEW.region_code IS DISTINCT FROM tenant_row.residency_region_code THEN
      RAISE EXCEPTION 'tenant audit evidence Data Home/region does not match tenant routing' USING ERRCODE='23514';
    END IF;
    IF NEW.actor_principal_id IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(
      NEW.tenant_id,NEW.actor_principal_id,NEW.occurred_at
    ) THEN
      RAISE EXCEPTION 'tenant audit actor is outside tenant' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_audit.validate_audit_event_integrity() FROM PUBLIC;
CREATE TRIGGER audit_event_relationship_integrity
  BEFORE INSERT OR UPDATE ON core_audit.audit_event
  FOR EACH ROW EXECUTE FUNCTION core_audit.validate_audit_event_integrity();

CREATE OR REPLACE FUNCTION core_config.validate_export_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  document_row record;
BEGIN
  IF NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.requester_principal_id,NEW.created_at) THEN
    RAISE EXCEPTION 'export requester is not active for tenant' USING ERRCODE='23514';
  END IF;
  IF NEW.subject_principal_id IS NOT NULL AND
     NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.subject_principal_id,NEW.created_at) THEN
    RAISE EXCEPTION 'export subject is not active for tenant' USING ERRCODE='23514';
  END IF;
  IF NEW.document_id IS NOT NULL THEN
    SELECT tenant_id,industry_context_id,scope_class,sensitivity_class,residency_region,status::text,virus_scan_status::text
    INTO document_row FROM core_document.document_meta WHERE id=NEW.document_id;
    IF NOT FOUND OR document_row.tenant_id<>NEW.tenant_id
       OR document_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id
       OR document_row.scope_class<>NEW.scope_class
       OR document_row.status<>'ACTIVE' OR document_row.virus_scan_status<>'CLEAN'
       OR core_tenancy.sensitivity_rank(document_row.sensitivity_class)>
          core_tenancy.sensitivity_rank(NEW.sensitivity_ceiling) THEN
      RAISE EXCEPTION 'export document scope, sensitivity, or residency mismatch' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_config.validate_export_relationships() FROM PUBLIC;
CREATE TRIGGER data_export_relationship_integrity
  BEFORE INSERT OR UPDATE ON core_config.data_export_request
  FOR EACH ROW EXECUTE FUNCTION core_config.validate_export_relationships();

-- Workflow/automation records cannot bind definitions, parents, actors, or assignees
-- from a foreign tenant/context.
CREATE OR REPLACE FUNCTION core_workflow.validate_workflow_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  definition_row record;
  parent_row record;
  subject_role record;
BEGIN
  IF TG_TABLE_NAME='workflow_definition' THEN
    IF NOT core_identity.principal_is_active_for_definition(
      NEW.owner_scope::text,NEW.tenant_id,NEW.created_by,NEW.created_at
    ) OR (NEW.approved_by IS NOT NULL AND NOT core_identity.principal_is_active_for_definition(
      NEW.owner_scope::text,NEW.tenant_id,NEW.approved_by,COALESCE(NEW.effective_from,NEW.updated_at)
    )) THEN
      RAISE EXCEPTION 'workflow definition creator/approver is outside definition scope' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='workflow_instance' THEN
    SELECT owner_scope::text,tenant_id,industry_context_id,version,status::text
    INTO definition_row FROM core_workflow.workflow_definition WHERE id=NEW.workflow_definition_id;
    IF NOT FOUND OR definition_row.version<>NEW.workflow_definition_version
       OR definition_row.status<>'ACTIVE'
       OR NOT core_tenancy.definition_applies_to_scope(
         definition_row.owner_scope,definition_row.tenant_id,definition_row.industry_context_id,
         NEW.tenant_id,NEW.industry_context_id
       ) THEN
      RAISE EXCEPTION 'workflow definition version/scope is not applicable' USING ERRCODE='23514';
    END IF;
    IF NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.created_by,NEW.created_at) THEN
      RAISE EXCEPTION 'workflow creator is outside tenant' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME IN ('workflow_task','workflow_transition') THEN
    SELECT tenant_id,industry_context_id INTO parent_row
    FROM core_workflow.workflow_instance WHERE id=NEW.workflow_instance_id;
    IF NOT FOUND OR parent_row.tenant_id<>NEW.tenant_id
       OR parent_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id THEN
      RAISE EXCEPTION 'workflow child scope differs from instance' USING ERRCODE='23514';
    END IF;
    IF TG_TABLE_NAME='workflow_task' THEN
      IF NEW.assigned_subject_type='PRINCIPAL' AND NOT core_identity.principal_is_active_for_tenant(
        NEW.tenant_id,NEW.assigned_subject_id,NEW.created_at
      ) THEN
        RAISE EXCEPTION 'workflow assignee principal is outside tenant' USING ERRCODE='23514';
      ELSIF NEW.assigned_subject_type='ROLE' THEN
        SELECT owner_scope::text,tenant_id,industry_context_id INTO subject_role
        FROM core_authz.role_template WHERE id=NEW.assigned_subject_id;
        IF NOT FOUND OR NOT core_tenancy.definition_applies_to_scope(
          subject_role.owner_scope,subject_role.tenant_id,subject_role.industry_context_id,
          NEW.tenant_id,NEW.industry_context_id
        ) THEN
          RAISE EXCEPTION 'workflow assignee role is outside task scope' USING ERRCODE='23514';
        END IF;
      ELSIF NEW.assigned_subject_type='ORG_UNIT' AND NOT EXISTS (
        SELECT 1 FROM core_tenancy.org_unit unit_row
        WHERE unit_row.tenant_id=NEW.tenant_id AND unit_row.id=NEW.assigned_subject_id
          AND (
            NEW.industry_context_id IS NULL OR EXISTS (
              SELECT 1 FROM core_tenancy.org_unit_industry link
              WHERE link.tenant_id=NEW.tenant_id AND link.org_unit_id=unit_row.id
                AND link.industry_context_id=NEW.industry_context_id AND link.status='ACTIVE'
            )
          )
      ) THEN
        RAISE EXCEPTION 'workflow assignee org unit is outside task scope' USING ERRCODE='23514';
      END IF;
      IF NEW.claimed_by IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.claimed_by,now()) THEN
        RAISE EXCEPTION 'workflow claimant is outside tenant' USING ERRCODE='23514';
      END IF;
      IF NEW.completed_by IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.completed_by,now()) THEN
        RAISE EXCEPTION 'workflow completer is outside tenant' USING ERRCODE='23514';
      END IF;
    ELSIF NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.actor_principal_id,NEW.occurred_at) THEN
      RAISE EXCEPTION 'workflow transition actor is outside tenant' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='automation_definition' THEN
    IF NOT core_identity.principal_is_active_for_definition(
      NEW.owner_scope::text,NEW.tenant_id,NEW.created_by,NEW.created_at
    ) OR (NEW.approved_by IS NOT NULL AND NOT core_identity.principal_is_active_for_definition(
      NEW.owner_scope::text,NEW.tenant_id,NEW.approved_by,COALESCE(NEW.effective_from,NEW.updated_at)
    )) THEN
      RAISE EXCEPTION 'automation definition creator/approver is outside definition scope' USING ERRCODE='23514';
    END IF;
    IF NEW.workflow_definition_id IS NOT NULL THEN
      SELECT owner_scope::text,tenant_id,industry_context_id INTO definition_row
      FROM core_workflow.workflow_definition WHERE id=NEW.workflow_definition_id;
      IF NOT FOUND OR NOT core_tenancy.definition_contains_definition(
        definition_row.owner_scope,definition_row.tenant_id,definition_row.industry_context_id,
        NEW.owner_scope::text,NEW.tenant_id,NEW.industry_context_id
      ) THEN
        RAISE EXCEPTION 'automation cannot reference narrower/foreign workflow definition' USING ERRCODE='23514';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME='automation_run' THEN
    SELECT owner_scope::text,tenant_id,industry_context_id,status::text INTO definition_row
    FROM core_workflow.automation_definition WHERE id=NEW.automation_definition_id;
    IF NOT FOUND OR definition_row.status<>'ACTIVE' OR NOT core_tenancy.definition_applies_to_scope(
      definition_row.owner_scope,definition_row.tenant_id,definition_row.industry_context_id,
      NEW.tenant_id,NEW.industry_context_id
    ) THEN
      RAISE EXCEPTION 'automation definition is inactive or outside run scope' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_workflow.validate_workflow_relationships() FROM PUBLIC;
CREATE TRIGGER workflow_definition_relationship_integrity BEFORE INSERT OR UPDATE ON core_workflow.workflow_definition FOR EACH ROW EXECUTE FUNCTION core_workflow.validate_workflow_relationships();
CREATE TRIGGER workflow_instance_relationship_integrity BEFORE INSERT OR UPDATE ON core_workflow.workflow_instance FOR EACH ROW EXECUTE FUNCTION core_workflow.validate_workflow_relationships();
CREATE TRIGGER workflow_task_relationship_integrity BEFORE INSERT OR UPDATE ON core_workflow.workflow_task FOR EACH ROW EXECUTE FUNCTION core_workflow.validate_workflow_relationships();
CREATE TRIGGER workflow_transition_relationship_integrity BEFORE INSERT OR UPDATE ON core_workflow.workflow_transition FOR EACH ROW EXECUTE FUNCTION core_workflow.validate_workflow_relationships();
CREATE TRIGGER automation_definition_relationship_integrity BEFORE INSERT OR UPDATE ON core_workflow.automation_definition FOR EACH ROW EXECUTE FUNCTION core_workflow.validate_workflow_relationships();
CREATE TRIGGER automation_run_relationship_integrity BEFORE INSERT OR UPDATE ON core_workflow.automation_run FOR EACH ROW EXECUTE FUNCTION core_workflow.validate_workflow_relationships();

CREATE OR REPLACE FUNCTION core_notification.validate_notification_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  template_row record;
  integration_row record;
  event_row record;
BEGIN
  IF TG_TABLE_NAME='notification_template' THEN
    IF NOT core_identity.principal_is_active_for_definition(
      NEW.owner_scope::text,NEW.tenant_id,NEW.created_by,NEW.created_at
    ) OR (NEW.approved_by IS NOT NULL AND NOT core_identity.principal_is_active_for_definition(
      NEW.owner_scope::text,NEW.tenant_id,NEW.approved_by,NEW.updated_at
    )) THEN
      RAISE EXCEPTION 'notification template creator/approver is outside definition scope' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.template_id IS NOT NULL THEN
    SELECT owner_scope::text,tenant_id,industry_context_id,version,status::text,channel::text
    INTO template_row FROM core_notification.notification_template WHERE id=NEW.template_id;
    IF NOT FOUND OR NEW.template_version IS NULL OR template_row.version<>NEW.template_version
       OR template_row.status<>'ACTIVE' OR template_row.channel<>NEW.channel::text
       OR NOT core_tenancy.definition_applies_to_scope(
         template_row.owner_scope,template_row.tenant_id,template_row.industry_context_id,
         NEW.tenant_id,NEW.industry_context_id
       ) THEN
      RAISE EXCEPTION 'notification template version/channel/scope is not applicable' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.template_version IS NOT NULL THEN
    RAISE EXCEPTION 'notification template version requires a template' USING ERRCODE='23514';
  END IF;
  IF NEW.recipient_principal_id IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(
    NEW.tenant_id,NEW.recipient_principal_id,NEW.queued_at
  ) THEN
    RAISE EXCEPTION 'notification recipient principal is outside tenant' USING ERRCODE='23514';
  END IF;
  IF NEW.tenant_integration_id IS NOT NULL THEN
    SELECT tenant_id,industry_context_id,status::text INTO integration_row
    FROM core_integration.tenant_integration WHERE id=NEW.tenant_integration_id;
    IF NOT FOUND OR integration_row.tenant_id<>NEW.tenant_id OR integration_row.status<>'ACTIVE'
       OR (integration_row.industry_context_id IS NOT NULL
           AND integration_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id) THEN
      RAISE EXCEPTION 'notification integration is inactive or outside delivery scope' USING ERRCODE='23514';
    END IF;
  END IF;
  IF NEW.source_event_id IS NOT NULL THEN
    SELECT tenant_id,industry_context_id,scope_class INTO event_row
    FROM core_integration.outbox_event WHERE id=NEW.source_event_id;
    IF NOT FOUND OR event_row.tenant_id<>NEW.tenant_id
       OR event_row.scope_class<>NEW.scope_class
       OR event_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id THEN
      RAISE EXCEPTION 'notification source event is outside exact delivery scope' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_notification.validate_notification_relationships() FROM PUBLIC;
ALTER TABLE core_notification.notification_delivery
  ADD CONSTRAINT notification_delivery_source_event_fk
  FOREIGN KEY (source_event_id) REFERENCES core_integration.outbox_event_identity(id);
CREATE TRIGGER notification_template_relationship_integrity
  BEFORE INSERT OR UPDATE ON core_notification.notification_template
  FOR EACH ROW EXECUTE FUNCTION core_notification.validate_notification_relationships();
CREATE TRIGGER notification_delivery_relationship_integrity
  BEFORE INSERT OR UPDATE ON core_notification.notification_delivery
  FOR EACH ROW EXECUTE FUNCTION core_notification.validate_notification_relationships();

-- ToolSet was referenced by both assistant and agent contracts but had no physical
-- owner. The member row is the concrete tool binding used by AgentStep.
CREATE TABLE core_ai.ai_tool_set (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  version integer NOT NULL CHECK (version>0),
  status text NOT NULL CHECK (status IN ('DRAFT','REVIEW','PUBLISHED','ACTIVE','RETIRED')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope='PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope='TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope='INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id,industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id)
);
CREATE UNIQUE INDEX ai_tool_set_scope_code_version_uq ON core_ai.ai_tool_set(
  owner_scope,COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),code,version
);
CREATE UNIQUE INDEX ai_tool_set_active_uq ON core_ai.ai_tool_set(
  owner_scope,COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),code
) WHERE status='ACTIVE';
CREATE TABLE core_ai.ai_tool_set_member (
  id uuid PRIMARY KEY,
  tool_set_id uuid NOT NULL REFERENCES core_ai.ai_tool_set(id),
  tool_definition_id uuid NOT NULL REFERENCES core_ai.ai_tool_definition(id),
  enabled boolean NOT NULL DEFAULT true,
  constraint_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  UNIQUE (tool_set_id,tool_definition_id)
);
CREATE TABLE core_ai.ai_prompt_set (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  version integer NOT NULL CHECK (version>0),
  status text NOT NULL CHECK (status IN ('DRAFT','REVIEW','PUBLISHED','ACTIVE','RETIRED')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope='PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope='TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope='INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id,industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id)
);
CREATE UNIQUE INDEX ai_prompt_set_scope_code_version_uq ON core_ai.ai_prompt_set(
  owner_scope,COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),code,version
);
CREATE UNIQUE INDEX ai_prompt_set_active_uq ON core_ai.ai_prompt_set(
  owner_scope,COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),code
) WHERE status='ACTIVE';
CREATE TABLE core_ai.ai_prompt_set_member (
  id uuid PRIMARY KEY,
  prompt_set_id uuid NOT NULL REFERENCES core_ai.ai_prompt_set(id),
  prompt_template_id uuid NOT NULL REFERENCES core_ai.prompt_template(id),
  priority integer NOT NULL DEFAULT 100,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,
  UNIQUE (prompt_set_id,prompt_template_id)
);
ALTER TABLE core_ai.ai_tool_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_tool_set FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_tool_set_scope_policy ON core_ai.ai_tool_set
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));
ALTER TABLE core_ai.ai_tool_set_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_tool_set_member FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_tool_set_member_parent_policy ON core_ai.ai_tool_set_member
  USING (EXISTS (SELECT 1 FROM core_ai.ai_tool_set parent WHERE parent.id=tool_set_id))
  WITH CHECK (EXISTS (SELECT 1 FROM core_ai.ai_tool_set parent WHERE parent.id=tool_set_id));
ALTER TABLE core_ai.ai_prompt_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_prompt_set FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_prompt_set_scope_policy ON core_ai.ai_prompt_set
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));
ALTER TABLE core_ai.ai_prompt_set_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_prompt_set_member FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_prompt_set_member_parent_policy ON core_ai.ai_prompt_set_member
  USING (EXISTS (SELECT 1 FROM core_ai.ai_prompt_set parent WHERE parent.id=prompt_set_id))
  WITH CHECK (EXISTS (SELECT 1 FROM core_ai.ai_prompt_set parent WHERE parent.id=prompt_set_id));
CREATE TRIGGER immutable_scope_ownership BEFORE UPDATE ON core_ai.ai_tool_set
  FOR EACH ROW EXECUTE FUNCTION core_tenancy.enforce_immutable_scope_ownership();
CREATE TRIGGER immutable_scope_ownership BEFORE UPDATE ON core_ai.ai_prompt_set
  FOR EACH ROW EXECUTE FUNCTION core_tenancy.enforce_immutable_scope_ownership();

ALTER TABLE core_ai.assistant_definition
  ADD CONSTRAINT assistant_definition_tool_set_fk FOREIGN KEY (tool_set_id) REFERENCES core_ai.ai_tool_set(id);
ALTER TABLE core_ai.agent_definition
  ADD CONSTRAINT agent_definition_tool_set_fk FOREIGN KEY (allowed_tool_set_id) REFERENCES core_ai.ai_tool_set(id);
ALTER TABLE core_ai.agent_step
  ADD CONSTRAINT agent_step_tool_binding_fk FOREIGN KEY (tool_binding_id) REFERENCES core_ai.ai_tool_set_member(id);
ALTER TABLE core_ai.industry_ai_config
  ADD CONSTRAINT industry_ai_config_prompt_set_fk FOREIGN KEY (domain_prompt_set_id) REFERENCES core_ai.ai_prompt_set(id);

CREATE UNIQUE INDEX assistant_definition_active_uq ON core_ai.assistant_definition(
  owner_scope,COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),code
) WHERE status='ACTIVE';
CREATE UNIQUE INDEX agent_definition_active_uq ON core_ai.agent_definition(
  owner_scope,COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),code
) WHERE status='ACTIVE';

ALTER TABLE core_ai.ai_model
  ADD CONSTRAINT ai_model_id_provider_uq UNIQUE (id,provider_id);
ALTER TABLE core_document.document_meta
  ADD CONSTRAINT document_meta_ai_media_request_fk
    FOREIGN KEY (ai_media_request_id) REFERENCES core_ai.ai_media_request(id),
  ADD CONSTRAINT document_meta_ai_model_provider_fk
    FOREIGN KEY (ai_model_id,ai_provider_id) REFERENCES core_ai.ai_model(id,provider_id);
ALTER TABLE core_ai.token_usage
  ADD CONSTRAINT token_usage_model_provider_fk
  FOREIGN KEY (model_id,provider_id) REFERENCES core_ai.ai_model(id,provider_id);
ALTER TABLE core_ai.ai_provisioning_snapshot
  ADD CONSTRAINT ai_provisioning_tenant_config_fk
  FOREIGN KEY (tenant_id,tenant_ai_config_version)
  REFERENCES core_ai.tenant_ai_config(tenant_id,version);

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,status,registered_at)
VALUES
('core_ai','ai_tool_set','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','AI',true,'ACTIVE',now()),
('core_ai','ai_tool_set_member','MIXED_SCOPED','RLS-PARENT-SCOPE','AI',true,'ACTIVE',now()),
('core_ai','ai_prompt_set','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','AI',true,'ACTIVE',now()),
('core_ai','ai_prompt_set_member','MIXED_SCOPED','RLS-PARENT-SCOPE','AI',true,'ACTIVE',now())
ON CONFLICT (schema_name,table_name) DO UPDATE
SET scope_class=EXCLUDED.scope_class,policy_class=EXCLUDED.policy_class,
    owner_module=EXCLUDED.owner_module,force_rls_required=true,status='ACTIVE';

GRANT SELECT,INSERT,UPDATE,DELETE ON core_ai.ai_tool_set,core_ai.ai_tool_set_member,
  core_ai.ai_prompt_set,core_ai.ai_prompt_set_member TO sbg_ai_gateway_rw;
GRANT ALL PRIVILEGES ON core_ai.ai_tool_set,core_ai.ai_tool_set_member,
  core_ai.ai_prompt_set,core_ai.ai_prompt_set_member TO sbg_migration_admin;

-- AI Gateway may author tenant/industry definitions but cannot mutate the platform
-- catalog. Platform definition writes use the explicit control-plane role.
CREATE OR REPLACE FUNCTION core_ai.definition_write_allowed(
  p_owner_scope core_config.owner_scope,p_tenant_id uuid,p_industry_context_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path=pg_catalog
AS $$
  SELECT core_config.row_visible_to_current_context(p_owner_scope,p_tenant_id,p_industry_context_id)
    AND (p_owner_scope<>'PLATFORM' OR current_user='sbg_control_plane_rw')
$$;
CREATE OR REPLACE FUNCTION core_ai.definition_member_write_allowed(
  p_parent_table text,p_parent_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path=pg_catalog
AS $$
DECLARE
  allowed boolean;
BEGIN
  IF p_parent_table='TOOL_SET' THEN
    SELECT core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id)
    INTO allowed FROM core_ai.ai_tool_set WHERE id=p_parent_id;
  ELSIF p_parent_table='PROMPT_SET' THEN
    SELECT core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id)
    INTO allowed FROM core_ai.ai_prompt_set WHERE id=p_parent_id;
  ELSE
    RETURN false;
  END IF;
  RETURN COALESCE(allowed,false);
END;
$$;
REVOKE ALL ON FUNCTION core_ai.definition_write_allowed(core_config.owner_scope,uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION core_ai.definition_member_write_allowed(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION core_ai.definition_write_allowed(core_config.owner_scope,uuid,uuid),
  core_ai.definition_member_write_allowed(text,uuid) TO sbg_ai_gateway_rw,sbg_control_plane_rw;

DROP POLICY ai_policy_scope_policy ON core_ai.ai_policy;
CREATE POLICY ai_policy_scope_read ON core_ai.ai_policy FOR SELECT
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));
CREATE POLICY ai_policy_scope_write ON core_ai.ai_policy
  USING (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id));
DROP POLICY prompt_template_scope_policy ON core_ai.prompt_template;
CREATE POLICY prompt_template_scope_read ON core_ai.prompt_template FOR SELECT
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));
CREATE POLICY prompt_template_scope_write ON core_ai.prompt_template
  USING (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id));
DROP POLICY assistant_definition_scope_policy ON core_ai.assistant_definition;
CREATE POLICY assistant_definition_scope_read ON core_ai.assistant_definition FOR SELECT
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));
CREATE POLICY assistant_definition_scope_write ON core_ai.assistant_definition
  USING (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id));
DROP POLICY agent_definition_scope_policy ON core_ai.agent_definition;
CREATE POLICY agent_definition_scope_read ON core_ai.agent_definition FOR SELECT
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));
CREATE POLICY agent_definition_scope_write ON core_ai.agent_definition
  USING (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id));
DROP POLICY ai_tool_set_scope_policy ON core_ai.ai_tool_set;
CREATE POLICY ai_tool_set_scope_read ON core_ai.ai_tool_set FOR SELECT
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));
CREATE POLICY ai_tool_set_scope_write ON core_ai.ai_tool_set
  USING (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id));
DROP POLICY ai_prompt_set_scope_policy ON core_ai.ai_prompt_set;
CREATE POLICY ai_prompt_set_scope_read ON core_ai.ai_prompt_set FOR SELECT
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));
CREATE POLICY ai_prompt_set_scope_write ON core_ai.ai_prompt_set
  USING (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_ai.definition_write_allowed(owner_scope,tenant_id,industry_context_id));
DROP POLICY ai_tool_set_member_parent_policy ON core_ai.ai_tool_set_member;
CREATE POLICY ai_tool_set_member_parent_read ON core_ai.ai_tool_set_member FOR SELECT
  USING (EXISTS (SELECT 1 FROM core_ai.ai_tool_set parent WHERE parent.id=tool_set_id));
CREATE POLICY ai_tool_set_member_parent_write ON core_ai.ai_tool_set_member
  USING (core_ai.definition_member_write_allowed('TOOL_SET',tool_set_id))
  WITH CHECK (core_ai.definition_member_write_allowed('TOOL_SET',tool_set_id));
DROP POLICY ai_prompt_set_member_parent_policy ON core_ai.ai_prompt_set_member;
CREATE POLICY ai_prompt_set_member_parent_read ON core_ai.ai_prompt_set_member FOR SELECT
  USING (EXISTS (SELECT 1 FROM core_ai.ai_prompt_set parent WHERE parent.id=prompt_set_id));
CREATE POLICY ai_prompt_set_member_parent_write ON core_ai.ai_prompt_set_member
  USING (core_ai.definition_member_write_allowed('PROMPT_SET',prompt_set_id))
  WITH CHECK (core_ai.definition_member_write_allowed('PROMPT_SET',prompt_set_id));

GRANT SELECT,INSERT,UPDATE,DELETE ON core_ai.ai_policy,core_ai.prompt_template,
  core_ai.assistant_definition,core_ai.agent_definition,core_ai.ai_tool_set,
  core_ai.ai_tool_set_member,core_ai.ai_prompt_set,core_ai.ai_prompt_set_member
TO sbg_control_plane_rw;

CREATE OR REPLACE FUNCTION core_ai.validate_ai_configuration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  tenant_config record;
  definition_row record;
  context_version bigint;
BEGIN
  IF TG_TABLE_NAME='tenant_ai_config' THEN
    IF NOT core_tenancy.text_array_is_set(NEW.allowed_capabilities)
       OR NOT core_tenancy.uuid_array_is_set(NEW.allowed_provider_ids)
       OR NOT core_tenancy.uuid_array_is_set(NEW.allowed_model_ids) THEN
      RAISE EXCEPTION 'tenant AI allowlists must be duplicate-free non-null sets' USING ERRCODE='23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.allowed_capabilities) AS allowed(code)
      WHERE NOT EXISTS (
        SELECT 1 FROM core_ai.ai_capability capability
        WHERE capability.code=allowed.code AND capability.status='ACTIVE'
      )
    ) OR EXISTS (
      SELECT 1 FROM unnest(NEW.allowed_provider_ids) AS allowed(provider_id)
      WHERE NOT EXISTS (
        SELECT 1 FROM core_ai.ai_provider provider
        WHERE provider.id=allowed.provider_id AND provider.status='ACTIVE'
      )
    ) OR EXISTS (
      SELECT 1 FROM unnest(NEW.allowed_model_ids) AS allowed(model_id)
      WHERE NOT EXISTS (
        SELECT 1 FROM core_ai.ai_model model
        WHERE model.id=allowed.model_id AND model.status='ACTIVE'
          AND model.provider_id=ANY(NEW.allowed_provider_ids)
      )
    ) THEN
      RAISE EXCEPTION 'tenant AI allowlist references inactive/missing or disallowed catalog row' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='industry_ai_config' THEN
    IF NOT core_tenancy.text_array_is_set(NEW.allowed_capabilities)
       OR NOT core_tenancy.uuid_array_is_set(NEW.allowed_provider_ids)
       OR NOT core_tenancy.uuid_array_is_set(NEW.allowed_model_ids)
       OR NOT core_tenancy.uuid_array_is_set(NEW.country_pack_refs) THEN
      RAISE EXCEPTION 'industry AI allowlists must be duplicate-free non-null sets' USING ERRCODE='23514';
    END IF;
    SELECT enabled,allowed_capabilities,allowed_provider_ids,allowed_model_ids
    INTO tenant_config
    FROM core_ai.tenant_ai_config
    WHERE tenant_id=NEW.tenant_id
    ORDER BY version DESC LIMIT 1;
    IF NOT FOUND OR (NEW.enabled AND NOT tenant_config.enabled)
       OR NOT NEW.allowed_capabilities<@tenant_config.allowed_capabilities
       OR NOT NEW.allowed_provider_ids<@tenant_config.allowed_provider_ids
       OR NOT NEW.allowed_model_ids<@tenant_config.allowed_model_ids THEN
      RAISE EXCEPTION 'industry AI configuration cannot widen tenant AI configuration' USING ERRCODE='23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.country_pack_refs) AS allowed(pack_id)
      WHERE NOT EXISTS (
        SELECT 1 FROM core_config.tenant_country_pack_activation activation
        WHERE activation.tenant_id=NEW.tenant_id
          AND activation.country_pack_id=allowed.pack_id
          AND activation.status='ACTIVE'
      )
    ) THEN
      RAISE EXCEPTION 'industry AI country pack is not active for tenant' USING ERRCODE='23514';
    END IF;
    IF NEW.domain_prompt_set_id IS NOT NULL THEN
      SELECT owner_scope::text,tenant_id,industry_context_id,status INTO definition_row
      FROM core_ai.ai_prompt_set WHERE id=NEW.domain_prompt_set_id;
      IF NOT FOUND OR definition_row.status<>'ACTIVE' OR NOT core_tenancy.definition_applies_to_scope(
        definition_row.owner_scope,definition_row.tenant_id,definition_row.industry_context_id,
        NEW.tenant_id,NEW.industry_context_id
      ) THEN
        RAISE EXCEPTION 'industry AI prompt set is inactive or outside Industry Context' USING ERRCODE='23514';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME='ai_provisioning_snapshot' THEN
    IF jsonb_typeof(NEW.ms_pack_versions)<>'object' OR jsonb_typeof(NEW.country_pack_versions)<>'object'
       OR NOT core_tenancy.uuid_array_is_set(NEW.allowed_capability_ids)
       OR NOT core_tenancy.text_array_is_set(NEW.allowed_api_classes)
       OR NOT core_tenancy.uuid_array_is_set(NEW.allowed_provider_ids)
       OR NOT core_tenancy.text_array_is_set(NEW.allowed_model_classes)
       OR NOT NEW.allowed_api_classes<@ARRAY[
         'INTERNAL_FIRST_PARTY','TENANT_API','PARTNER_API','PUBLIC_DEVELOPER_API'
       ]::text[] THEN
      RAISE EXCEPTION 'AI provisioning snapshot contains malformed governed sets/maps' USING ERRCODE='23514';
    END IF;
    SELECT enabled,allowed_capabilities,allowed_provider_ids INTO tenant_config
    FROM core_ai.tenant_ai_config
    WHERE tenant_id=NEW.tenant_id AND version=NEW.tenant_ai_config_version;
    IF NOT FOUND OR NOT tenant_config.enabled OR NOT NEW.allowed_provider_ids<@tenant_config.allowed_provider_ids
       OR EXISTS (
         SELECT 1 FROM unnest(NEW.allowed_capability_ids) AS allowed(capability_id)
         WHERE NOT EXISTS (
           SELECT 1 FROM core_ai.ai_capability capability
           WHERE capability.id=allowed.capability_id AND capability.status='ACTIVE'
             AND capability.code=ANY(tenant_config.allowed_capabilities)
         )
       ) THEN
      RAISE EXCEPTION 'AI provisioning snapshot widens or misses referenced tenant configuration' USING ERRCODE='23514';
    END IF;
    IF NEW.industry_context_id IS NULL THEN
      IF NEW.industry_activation_version IS NOT NULL THEN
        RAISE EXCEPTION 'tenant-core AI snapshot cannot carry industry activation version' USING ERRCODE='23514';
      END IF;
    ELSE
      SELECT activation_version INTO context_version
      FROM core_tenancy.industry_context
      WHERE tenant_id=NEW.tenant_id AND id=NEW.industry_context_id AND status='ACTIVE';
      IF context_version IS NULL OR NEW.industry_activation_version IS DISTINCT FROM context_version THEN
        RAISE EXCEPTION 'industry AI snapshot activation version is stale or mismatched' USING ERRCODE='23514';
      END IF;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM core_commercial.entitlement_snapshot snapshot
      WHERE snapshot.tenant_id=NEW.tenant_id
        AND snapshot.version=NEW.entitlement_snapshot_version
        AND snapshot.status='CURRENT'
    ) OR NOT EXISTS (
      SELECT 1 FROM core_tenancy.tenant tenant_row
      JOIN core_commercial.subscription subscription
        ON subscription.tenant_id=tenant_row.id AND subscription.id=tenant_row.current_subscription_id
      WHERE tenant_row.id=NEW.tenant_id AND subscription.version=NEW.subscription_version
    ) THEN
      RAISE EXCEPTION 'AI provisioning snapshot commercial versions are stale or foreign' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_ai.validate_ai_configuration() FROM PUBLIC;
CREATE TRIGGER tenant_ai_configuration_integrity BEFORE INSERT OR UPDATE ON core_ai.tenant_ai_config FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_configuration();
CREATE TRIGGER industry_ai_configuration_integrity BEFORE INSERT OR UPDATE ON core_ai.industry_ai_config FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_configuration();
CREATE TRIGGER ai_provisioning_snapshot_integrity BEFORE INSERT OR UPDATE ON core_ai.ai_provisioning_snapshot FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_configuration();

CREATE OR REPLACE FUNCTION core_ai.validate_ai_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  parent_row record;
  referenced_row record;
BEGIN
  IF TG_TABLE_NAME='prompt_template' THEN
    IF NOT core_identity.principal_is_active_for_definition(
      NEW.owner_scope::text,NEW.tenant_id,NEW.created_by,NEW.created_at
    ) OR (NEW.approved_by IS NOT NULL AND NOT core_identity.principal_is_active_for_definition(
      NEW.owner_scope::text,NEW.tenant_id,NEW.approved_by,NEW.updated_at
    )) THEN
      RAISE EXCEPTION 'prompt creator/approver is outside definition scope' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='ai_prompt_set_member' THEN
    SELECT owner_scope::text,tenant_id,industry_context_id,status INTO parent_row
    FROM core_ai.ai_prompt_set WHERE id=NEW.prompt_set_id;
    SELECT owner_scope::text,tenant_id,industry_context_id,status::text INTO referenced_row
    FROM core_ai.prompt_template WHERE id=NEW.prompt_template_id;
    IF parent_row.status IS DISTINCT FROM 'ACTIVE' OR referenced_row.status IS DISTINCT FROM 'ACTIVE'
       OR NOT core_tenancy.definition_contains_definition(
         referenced_row.owner_scope,referenced_row.tenant_id,referenced_row.industry_context_id,
         parent_row.owner_scope,parent_row.tenant_id,parent_row.industry_context_id
       ) THEN
      RAISE EXCEPTION 'prompt-set member is inactive, narrower, or foreign' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='ai_tool_set_member' THEN
    IF NOT EXISTS (
      SELECT 1 FROM core_ai.ai_tool_definition tool
      WHERE tool.id=NEW.tool_definition_id AND tool.status='ACTIVE'
    ) THEN
      RAISE EXCEPTION 'tool-set binding requires active tool definition' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='assistant_definition' THEN
    IF NOT core_tenancy.text_array_is_set(NEW.allowed_capabilities) OR EXISTS (
      SELECT 1 FROM unnest(NEW.allowed_capabilities) AS allowed(code)
      WHERE NOT EXISTS (
        SELECT 1 FROM core_ai.ai_capability capability
        WHERE capability.code=allowed.code AND capability.status='ACTIVE'
      )
    ) THEN
      RAISE EXCEPTION 'assistant capability set is invalid' USING ERRCODE='23514';
    END IF;
    SELECT owner_scope::text,tenant_id,industry_context_id,status::text INTO referenced_row
    FROM core_ai.prompt_template WHERE id=NEW.prompt_template_id;
    IF NOT FOUND OR referenced_row.status<>'ACTIVE' OR NOT core_tenancy.definition_contains_definition(
      referenced_row.owner_scope,referenced_row.tenant_id,referenced_row.industry_context_id,
      NEW.owner_scope::text,NEW.tenant_id,NEW.industry_context_id
    ) THEN
      RAISE EXCEPTION 'assistant prompt is inactive, narrower, or foreign' USING ERRCODE='23514';
    END IF;
    IF NEW.tool_set_id IS NOT NULL THEN
      SELECT owner_scope::text,tenant_id,industry_context_id,status INTO referenced_row
      FROM core_ai.ai_tool_set WHERE id=NEW.tool_set_id;
      IF NOT FOUND OR referenced_row.status<>'ACTIVE' OR NOT core_tenancy.definition_contains_definition(
        referenced_row.owner_scope,referenced_row.tenant_id,referenced_row.industry_context_id,
        NEW.owner_scope::text,NEW.tenant_id,NEW.industry_context_id
      ) THEN
        RAISE EXCEPTION 'assistant tool set is inactive, narrower, or foreign' USING ERRCODE='23514';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME='ai_conversation' THEN
    IF NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.owner_principal_id,NEW.created_at) THEN
      RAISE EXCEPTION 'AI conversation owner is outside tenant' USING ERRCODE='23514';
    END IF;
    IF NEW.assistant_definition_id IS NOT NULL THEN
      SELECT owner_scope::text,tenant_id,industry_context_id,status INTO referenced_row
      FROM core_ai.assistant_definition WHERE id=NEW.assistant_definition_id;
      IF NOT FOUND OR referenced_row.status<>'ACTIVE' OR NOT core_tenancy.definition_applies_to_scope(
        referenced_row.owner_scope,referenced_row.tenant_id,referenced_row.industry_context_id,
        NEW.tenant_id,NEW.industry_context_id
      ) THEN
        RAISE EXCEPTION 'assistant definition is inactive or outside conversation scope' USING ERRCODE='23514';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME='token_usage' THEN
    IF NEW.principal_id IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(
      NEW.tenant_id,NEW.principal_id,NEW.occurred_at
    ) THEN
      RAISE EXCEPTION 'AI usage principal is outside tenant' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='rag_source' THEN
    IF NEW.document_id IS NOT NULL THEN
      SELECT tenant_id,industry_context_id,scope_class,version_no,sensitivity_class,residency_region,status::text,virus_scan_status::text
      INTO referenced_row FROM core_document.document_meta WHERE id=NEW.document_id;
      IF NOT FOUND OR NEW.document_version IS NULL OR referenced_row.version_no<>NEW.document_version
         OR referenced_row.tenant_id<>NEW.tenant_id
         OR referenced_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id
         OR referenced_row.scope_class<>NEW.scope_class
         OR referenced_row.residency_region<>NEW.residency_region
         OR referenced_row.status<>'ACTIVE' OR referenced_row.virus_scan_status<>'CLEAN'
         OR core_tenancy.sensitivity_rank(NEW.sensitivity_class)<core_tenancy.sensitivity_rank(referenced_row.sensitivity_class) THEN
        RAISE EXCEPTION 'RAG source document version/scope/security mismatch' USING ERRCODE='23514';
      END IF;
    ELSIF NEW.document_version IS NOT NULL THEN
      RAISE EXCEPTION 'RAG document version requires document id' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='rag_chunk' THEN
    SELECT tenant_id,industry_context_id,scope_class,sensitivity_class,residency_region,retention_class
    INTO parent_row FROM core_ai.rag_source WHERE id=NEW.source_id;
    IF NOT FOUND OR parent_row.tenant_id<>NEW.tenant_id
       OR parent_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id
       OR parent_row.scope_class<>NEW.scope_class
       OR parent_row.residency_region<>NEW.residency_region
       OR parent_row.retention_class<>NEW.retention_class
       OR core_tenancy.sensitivity_rank(NEW.sensitivity_class)<core_tenancy.sensitivity_rank(parent_row.sensitivity_class) THEN
      RAISE EXCEPTION 'RAG chunk cannot diverge from source scope/security' USING ERRCODE='23514';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM core_ai.ai_model model
      WHERE model.id=NEW.embedding_model_id AND model.status='ACTIVE'
        AND core_tenancy.sensitivity_rank(model.sensitivity_ceiling)>=core_tenancy.sensitivity_rank(NEW.sensitivity_class)
    ) THEN
      RAISE EXCEPTION 'RAG embedding model is inactive or below source sensitivity' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='ai_memory_record' THEN
    IF NEW.principal_id IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(
      NEW.tenant_id,NEW.principal_id,NEW.created_at
    ) THEN
      RAISE EXCEPTION 'AI memory principal is outside tenant' USING ERRCODE='23514';
    END IF;
    IF NEW.assistant_definition_id IS NOT NULL THEN
      SELECT owner_scope::text,tenant_id,industry_context_id,status INTO referenced_row
      FROM core_ai.assistant_definition WHERE id=NEW.assistant_definition_id;
      IF NOT FOUND OR referenced_row.status<>'ACTIVE' OR NOT core_tenancy.definition_applies_to_scope(
        referenced_row.owner_scope,referenced_row.tenant_id,referenced_row.industry_context_id,
        NEW.tenant_id,NEW.industry_context_id
      ) THEN
        RAISE EXCEPTION 'memory assistant is inactive or outside memory scope' USING ERRCODE='23514';
      END IF;
    END IF;
    IF NEW.supersedes_id IS NOT NULL THEN
      IF NEW.supersedes_id=NEW.id THEN
        RAISE EXCEPTION 'memory cannot supersede itself' USING ERRCODE='23514';
      END IF;
      SELECT tenant_id,industry_context_id,principal_id,memory_class::text INTO parent_row
      FROM core_ai.ai_memory_record WHERE id=NEW.supersedes_id;
      IF NOT FOUND OR parent_row.tenant_id<>NEW.tenant_id
         OR parent_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id
         OR parent_row.principal_id IS DISTINCT FROM NEW.principal_id
         OR parent_row.memory_class<>NEW.memory_class::text THEN
        RAISE EXCEPTION 'memory supersession must remain in exact owner/scope/class' USING ERRCODE='23514';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME='ai_media_request' THEN
    IF NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.principal_id,NEW.created_at)
       OR NOT core_tenancy.uuid_array_is_set(NEW.input_document_refs) THEN
      RAISE EXCEPTION 'AI media principal or input document set invalid' USING ERRCODE='23514';
    END IF;
    IF NEW.prompt_template_id IS NOT NULL THEN
      SELECT owner_scope::text,tenant_id,industry_context_id,version,status::text INTO referenced_row
      FROM core_ai.prompt_template WHERE id=NEW.prompt_template_id;
      IF NOT FOUND OR NEW.prompt_version IS NULL OR referenced_row.version<>NEW.prompt_version
         OR referenced_row.status<>'ACTIVE' OR NOT core_tenancy.definition_applies_to_scope(
           referenced_row.owner_scope,referenced_row.tenant_id,referenced_row.industry_context_id,
           NEW.tenant_id,NEW.industry_context_id
         ) THEN
        RAISE EXCEPTION 'AI media prompt version/scope invalid' USING ERRCODE='23514';
      END IF;
    ELSIF NEW.prompt_version IS NOT NULL THEN
      RAISE EXCEPTION 'AI media prompt version requires prompt id' USING ERRCODE='23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.input_document_refs) AS input(document_id)
      WHERE NOT EXISTS (
        SELECT 1 FROM core_document.document_meta document
        WHERE document.id=input.document_id AND document.tenant_id=NEW.tenant_id
          AND document.industry_context_id IS NOT DISTINCT FROM NEW.industry_context_id
          AND document.status='ACTIVE' AND document.virus_scan_status='CLEAN'
          AND core_tenancy.sensitivity_rank(document.sensitivity_class)<=core_tenancy.sensitivity_rank(NEW.sensitivity_class)
          AND document.residency_region=NEW.residency_requirement
      )
    ) THEN
      RAISE EXCEPTION 'AI media input document crosses scope/security/residency' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='agent_definition' THEN
    SELECT owner_scope::text,tenant_id,industry_context_id,status INTO referenced_row
    FROM core_ai.ai_tool_set WHERE id=NEW.allowed_tool_set_id;
    IF NOT FOUND OR referenced_row.status<>'ACTIVE' OR NOT core_tenancy.definition_contains_definition(
      referenced_row.owner_scope,referenced_row.tenant_id,referenced_row.industry_context_id,
      NEW.owner_scope::text,NEW.tenant_id,NEW.industry_context_id
    ) THEN
      RAISE EXCEPTION 'agent tool set is inactive, narrower, or foreign' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME='agent_run' THEN
    SELECT owner_scope::text,tenant_id,industry_context_id,status INTO referenced_row
    FROM core_ai.agent_definition WHERE id=NEW.agent_definition_id;
    IF NOT FOUND OR referenced_row.status<>'ACTIVE' OR NOT core_tenancy.definition_applies_to_scope(
      referenced_row.owner_scope,referenced_row.tenant_id,referenced_row.industry_context_id,
      NEW.tenant_id,NEW.industry_context_id
    ) OR NOT core_identity.principal_is_active_for_tenant(NEW.tenant_id,NEW.acting_principal_id,NEW.started_at) THEN
      RAISE EXCEPTION 'agent definition/principal is inactive or outside run scope' USING ERRCODE='23514';
    END IF;
    IF NEW.membership_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM core_identity.tenant_membership membership
      WHERE membership.id=NEW.membership_id AND membership.tenant_id=NEW.tenant_id
        AND membership.principal_id=NEW.acting_principal_id AND membership.status='ACTIVE'
        AND (membership.valid_from IS NULL OR membership.valid_from<=NEW.started_at)
        AND (membership.valid_until IS NULL OR membership.valid_until>NEW.started_at)
    ) THEN
      RAISE EXCEPTION 'agent run membership does not match acting principal/tenant' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_ai.validate_ai_relationships() FROM PUBLIC;
CREATE TRIGGER prompt_template_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.prompt_template FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER ai_prompt_set_member_integrity BEFORE INSERT OR UPDATE ON core_ai.ai_prompt_set_member FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER ai_tool_set_member_integrity BEFORE INSERT OR UPDATE ON core_ai.ai_tool_set_member FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER assistant_definition_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.assistant_definition FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER ai_conversation_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.ai_conversation FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER token_usage_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.token_usage FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER rag_source_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.rag_source FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER rag_chunk_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.rag_chunk FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER ai_memory_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.ai_memory_record FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER ai_media_request_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.ai_media_request FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER agent_definition_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.agent_definition FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();
CREATE TRIGGER agent_run_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.agent_run FOR EACH ROW EXECUTE FUNCTION core_ai.validate_ai_relationships();

CREATE OR REPLACE FUNCTION core_ai.validate_agent_step_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  run_row record;
  binding_row record;
  related_row record;
BEGIN
  IF TG_TABLE_NAME='agent_step' THEN
    SELECT run_data.tenant_id,run_data.industry_context_id,definition.allowed_tool_set_id
    INTO run_row
    FROM core_ai.agent_run run_data
    JOIN core_ai.agent_definition definition ON definition.id=run_data.agent_definition_id
    WHERE run_data.id=NEW.run_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'agent step references missing run' USING ERRCODE='23503';
    END IF;
    IF NEW.step_type='TOOL' THEN
      SELECT member.tool_set_id,member.enabled,tool.status
      INTO binding_row
      FROM core_ai.ai_tool_set_member member
      JOIN core_ai.ai_tool_definition tool ON tool.id=member.tool_definition_id
      WHERE member.id=NEW.tool_binding_id;
      IF NEW.tool_binding_id IS NULL OR NOT FOUND OR NOT binding_row.enabled
         OR binding_row.status<>'ACTIVE' OR binding_row.tool_set_id<>run_row.allowed_tool_set_id THEN
        RAISE EXCEPTION 'agent tool step binding is absent/inactive/outside allowed ToolSet' USING ERRCODE='23514';
      END IF;
    ELSIF NEW.tool_binding_id IS NOT NULL THEN
      RAISE EXCEPTION 'non-tool agent step cannot carry tool binding' USING ERRCODE='23514';
    END IF;
    IF NEW.approval_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM core_ai.agent_approval approval
      WHERE approval.id=NEW.approval_id AND approval.run_id=NEW.run_id AND approval.step_id=NEW.id
    ) THEN
      RAISE EXCEPTION 'agent step approval does not point back to same step/run' USING ERRCODE='23514';
    END IF;
  ELSE
    SELECT tenant_id,industry_context_id INTO run_row
    FROM core_ai.agent_run WHERE id=NEW.run_id;
    SELECT run_id INTO related_row FROM core_ai.agent_step WHERE id=NEW.step_id;
    IF run_row.tenant_id IS NULL OR related_row.run_id IS NULL OR related_row.run_id<>NEW.run_id
       OR run_row.tenant_id<>NEW.tenant_id
       OR run_row.industry_context_id IS DISTINCT FROM NEW.industry_context_id THEN
      RAISE EXCEPTION 'agent approval run/step/scope mismatch' USING ERRCODE='23514';
    END IF;
    IF NEW.approver_principal_id IS NOT NULL AND NOT core_identity.principal_is_active_for_tenant(
      NEW.tenant_id,NEW.approver_principal_id,COALESCE(NEW.approved_at,NEW.created_at)
    ) THEN
      RAISE EXCEPTION 'agent approver is outside tenant' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_ai.validate_agent_step_approval() FROM PUBLIC;
CREATE TRIGGER agent_step_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.agent_step FOR EACH ROW EXECUTE FUNCTION core_ai.validate_agent_step_approval();
CREATE TRIGGER agent_approval_relationship_integrity BEFORE INSERT OR UPDATE ON core_ai.agent_approval FOR EACH ROW EXECUTE FUNCTION core_ai.validate_agent_step_approval();

COMMIT;
