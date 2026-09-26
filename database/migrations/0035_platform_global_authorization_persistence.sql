-- SBGlobal Plus — Migration 0035: PLATFORM_GLOBAL authorization persistence prerequisite
-- DEV-AUTHZ-PDP-001. Read-side owner only; this does not implement the PDP evaluator/compiler.
BEGIN;

-- The RLS registry predates the explicit PLATFORM_GLOBAL scope class. Migration 0029
-- standardized the governed scope vocabulary for executable catalog/security contracts,
-- so the registry must accept the same platform-global classification before these
-- dedicated Authorization tables can be registered. Keep the older migration immutable
-- and evolve the current schema here so clean bootstrap and forward upgrades agree.
ALTER TABLE core_authz.rls_table_registry
  DROP CONSTRAINT IF EXISTS rls_table_registry_scope_class_check;
ALTER TABLE core_authz.rls_table_registry
  ADD CONSTRAINT rls_table_registry_scope_class_check
  CHECK (scope_class IN ('PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY','MIXED_SCOPED'));

CREATE TABLE core_authz.platform_role_assignment (
  id uuid PRIMARY KEY,
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  role_id uuid NOT NULL REFERENCES core_authz.role_template(id),
  valid_from timestamptz,
  valid_until timestamptz,
  status core_authz.assignment_status NOT NULL,
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  created_at timestamptz NOT NULL,
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from)
);

CREATE INDEX platform_role_assignment_principal_status_idx
  ON core_authz.platform_role_assignment(principal_id,status);

CREATE TABLE core_authz.compiled_platform_permission_subject (
  id uuid PRIMARY KEY,
  principal_id uuid NOT NULL UNIQUE REFERENCES core_identity.platform_principal(id),
  current_snapshot_id uuid,
  current_version bigint NOT NULL DEFAULT 0 CHECK (current_version >= 0),
  row_version bigint NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE core_authz.compiled_platform_permission_snapshot (
  id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES core_authz.compiled_platform_permission_subject(id),
  version bigint NOT NULL CHECK (version > 0),
  status core_authz.compiled_permission_snapshot_status NOT NULL,
  role_ids uuid[] NOT NULL DEFAULT '{}',
  permission_schema_version integer NOT NULL DEFAULT 1 CHECK (permission_schema_version > 0),
  permission_set_json jsonb NOT NULL CHECK (jsonb_typeof(permission_set_json)='object'),
  source_fingerprint text NOT NULL CHECK (length(source_fingerprint) >= 16),
  compiled_at timestamptz NOT NULL,
  superseded_at timestamptz,
  invalidated_at timestamptz,
  UNIQUE (subject_id,version),
  UNIQUE (subject_id,id,version),
  CHECK (
    (status='CURRENT' AND superseded_at IS NULL AND invalidated_at IS NULL)
    OR (status='SUPERSEDED' AND superseded_at IS NOT NULL AND invalidated_at IS NULL)
    OR (status='INVALIDATED' AND invalidated_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX compiled_platform_permission_snapshot_one_current_uq
  ON core_authz.compiled_platform_permission_snapshot(subject_id)
  WHERE status='CURRENT';

ALTER TABLE core_authz.compiled_platform_permission_subject
  ADD CONSTRAINT compiled_platform_permission_subject_current_snapshot_fk
  FOREIGN KEY (id,current_snapshot_id,current_version)
  REFERENCES core_authz.compiled_platform_permission_snapshot(subject_id,id,version)
  DEFERRABLE INITIALLY DEFERRED;

CREATE OR REPLACE FUNCTION core_authz.validate_platform_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM core_identity.platform_principal principal
    WHERE principal.id=NEW.principal_id
      AND principal.status='ACTIVE'
      AND principal.principal_type IN ('PLATFORM_OPERATOR','SERVICE')
  ) THEN
    RAISE EXCEPTION 'platform role assignment requires an active platform operator/service principal'
      USING ERRCODE='23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM core_authz.role_template role
    WHERE role.id=NEW.role_id
      AND role.owner_scope='PLATFORM'
      AND role.tenant_id IS NULL
      AND role.industry_context_id IS NULL
      AND role.status='ACTIVE'
  ) THEN
    RAISE EXCEPTION 'platform role assignment requires an active PLATFORM role template'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP='UPDATE' AND (
    NEW.id IS DISTINCT FROM OLD.id
    OR NEW.principal_id IS DISTINCT FROM OLD.principal_id
    OR NEW.role_id IS DISTINCT FROM OLD.role_id
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'platform role assignment identity is immutable' USING ERRCODE='42501';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_authz.validate_platform_role_assignment() FROM PUBLIC;
CREATE TRIGGER platform_role_assignment_integrity
  BEFORE INSERT OR UPDATE ON core_authz.platform_role_assignment
  FOR EACH ROW EXECUTE FUNCTION core_authz.validate_platform_role_assignment();

CREATE OR REPLACE FUNCTION core_authz.validate_compiled_platform_permission_subject()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE target_status text; target_version bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM core_identity.platform_principal principal
    WHERE principal.id=NEW.principal_id
      AND principal.status='ACTIVE'
      AND principal.principal_type IN ('PLATFORM_OPERATOR','SERVICE')
  ) THEN
    RAISE EXCEPTION 'platform permission subject requires an active platform operator/service principal'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP='UPDATE' AND NEW.principal_id IS DISTINCT FROM OLD.principal_id THEN
    RAISE EXCEPTION 'platform permission subject principal is immutable' USING ERRCODE='42501';
  END IF;

  IF NEW.current_snapshot_id IS NULL THEN
    IF TG_OP='INSERT' AND NEW.current_version<>0 THEN
      RAISE EXCEPTION 'new platform permission subject without snapshot starts at version zero' USING ERRCODE='23514';
    ELSIF TG_OP='UPDATE' AND NEW.current_version<>OLD.current_version THEN
      RAISE EXCEPTION 'clearing platform current snapshot cannot rewrite last issued version' USING ERRCODE='23514';
    END IF;
  ELSE
    SELECT status::text,version INTO target_status,target_version
    FROM core_authz.compiled_platform_permission_snapshot
    WHERE id=NEW.current_snapshot_id AND subject_id=NEW.id;
    IF NOT FOUND OR target_status<>'CURRENT' OR target_version<>NEW.current_version THEN
      RAISE EXCEPTION 'platform permission current pointer/version requires CURRENT matching snapshot'
        USING ERRCODE='23514';
    END IF;
    IF TG_OP='UPDATE' AND NEW.current_snapshot_id IS DISTINCT FROM OLD.current_snapshot_id
      AND NEW.current_version<>OLD.current_version+1 THEN
      RAISE EXCEPTION 'platform permission version must advance exactly by one' USING ERRCODE='23514';
    END IF;
  END IF;

  NEW.row_version := CASE WHEN TG_OP='UPDATE' THEN OLD.row_version+1 ELSE NEW.row_version END;
  NEW.updated_at := CASE WHEN TG_OP='UPDATE' THEN now() ELSE NEW.updated_at END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_authz.validate_compiled_platform_permission_subject() FROM PUBLIC;
CREATE TRIGGER compiled_platform_permission_subject_integrity
  BEFORE INSERT OR UPDATE ON core_authz.compiled_platform_permission_subject
  FOR EACH ROW EXECUTE FUNCTION core_authz.validate_compiled_platform_permission_subject();

CREATE OR REPLACE FUNCTION core_authz.prevent_compiled_platform_permission_payload_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id<>OLD.id OR NEW.subject_id<>OLD.subject_id OR NEW.version<>OLD.version
    OR NEW.role_ids<>OLD.role_ids
    OR NEW.permission_schema_version<>OLD.permission_schema_version
    OR NEW.permission_set_json<>OLD.permission_set_json
    OR NEW.source_fingerprint<>OLD.source_fingerprint
    OR NEW.compiled_at<>OLD.compiled_at THEN
    RAISE EXCEPTION 'compiled platform permission snapshot payload is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_authz.prevent_compiled_platform_permission_payload_rewrite() FROM PUBLIC;
CREATE TRIGGER compiled_platform_permission_snapshot_immutable
  BEFORE UPDATE ON core_authz.compiled_platform_permission_snapshot
  FOR EACH ROW EXECUTE FUNCTION core_authz.prevent_compiled_platform_permission_payload_rewrite();

ALTER TABLE core_authz.platform_role_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.platform_role_assignment FORCE ROW LEVEL SECURITY;
CREATE POLICY platform_role_assignment_current_read_policy
  ON core_authz.platform_role_assignment FOR SELECT
  USING (
    core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
    AND principal_id=core_tenancy.current_principal_id()
  );
CREATE POLICY platform_role_assignment_control_policy
  ON core_authz.platform_role_assignment FOR ALL
  USING (current_user='sbg_control_plane_rw')
  WITH CHECK (current_user='sbg_control_plane_rw');

ALTER TABLE core_authz.compiled_platform_permission_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.compiled_platform_permission_subject FORCE ROW LEVEL SECURITY;
CREATE POLICY compiled_platform_permission_subject_current_read_policy
  ON core_authz.compiled_platform_permission_subject FOR SELECT
  USING (
    core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
    AND principal_id=core_tenancy.current_principal_id()
  );

ALTER TABLE core_authz.compiled_platform_permission_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.compiled_platform_permission_snapshot FORCE ROW LEVEL SECURITY;
CREATE POLICY compiled_platform_permission_snapshot_parent_read_policy
  ON core_authz.compiled_platform_permission_snapshot FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM core_authz.compiled_platform_permission_subject subject
    WHERE subject.id=subject_id
  ));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,status,registered_at)
VALUES
('core_authz','platform_role_assignment','PLATFORM_GLOBAL','RLS-PLATFORM-PRINCIPAL','Authorization',true,'ACTIVE',now()),
('core_authz','compiled_platform_permission_subject','PLATFORM_GLOBAL','RLS-PLATFORM-PRINCIPAL','Authorization',true,'ACTIVE',now()),
('core_authz','compiled_platform_permission_snapshot','PLATFORM_GLOBAL','RLS-PARENT-SCOPE','Authorization',true,'ACTIVE',now())
ON CONFLICT (schema_name,table_name) DO UPDATE
SET scope_class=EXCLUDED.scope_class,
    policy_class=EXCLUDED.policy_class,
    owner_module=EXCLUDED.owner_module,
    force_rls_required=EXCLUDED.force_rls_required,
    status='ACTIVE';

REVOKE ALL ON core_authz.platform_role_assignment,
  core_authz.compiled_platform_permission_subject,
  core_authz.compiled_platform_permission_snapshot
FROM PUBLIC,sbg_app_rw,sbg_worker_rw,sbg_monitor_ro,sbg_control_plane_rw;

GRANT SELECT ON core_authz.platform_role_assignment,
  core_authz.compiled_platform_permission_subject,
  core_authz.compiled_platform_permission_snapshot
TO sbg_app_rw;

GRANT SELECT,INSERT,UPDATE,DELETE ON core_authz.platform_role_assignment TO sbg_control_plane_rw;
GRANT SELECT ON core_authz.compiled_platform_permission_subject,
  core_authz.compiled_platform_permission_snapshot TO sbg_control_plane_rw;

GRANT ALL PRIVILEGES ON core_authz.platform_role_assignment,
  core_authz.compiled_platform_permission_subject,
  core_authz.compiled_platform_permission_snapshot
TO sbg_migration_admin;

COMMIT;
