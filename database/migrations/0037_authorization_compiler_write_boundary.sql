-- SBGlobal Plus — Migration 0037: dedicated Authorization compiler write boundary
-- DD-041 / DEV-AUTHZ-COMPILER-001 prerequisite.
-- The compiler gets only scoped compiled-subject/snapshot publication authority.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_authorization_compiler_rw') THEN
    CREATE ROLE sbg_authorization_compiler_rw
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA core_authz TO sbg_authorization_compiler_rw;

REVOKE ALL ON
  core_authz.compiled_permission_subject,
  core_authz.compiled_permission_snapshot,
  core_authz.compiled_platform_permission_subject,
  core_authz.compiled_platform_permission_snapshot
FROM sbg_authorization_compiler_rw;

GRANT SELECT,INSERT,UPDATE ON
  core_authz.compiled_permission_subject,
  core_authz.compiled_permission_snapshot,
  core_authz.compiled_platform_permission_subject,
  core_authz.compiled_platform_permission_snapshot
TO sbg_authorization_compiler_rw;

-- Tenant compiled tables already have exact Tenant/Industry FORCE-RLS policies.
-- PLATFORM_GLOBAL read policies bind runtime readers to their own principal, so the
-- dedicated compiler needs a separate table-scoped publication policy. It remains
-- scope-gated and the role itself has no other Authorization mutation grants.
CREATE POLICY compiled_platform_permission_subject_compiler_policy
  ON core_authz.compiled_platform_permission_subject
  FOR ALL
  USING (
    current_user='sbg_authorization_compiler_rw'
    AND core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
  )
  WITH CHECK (
    current_user='sbg_authorization_compiler_rw'
    AND core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
  );

CREATE POLICY compiled_platform_permission_snapshot_compiler_policy
  ON core_authz.compiled_platform_permission_snapshot
  FOR ALL
  USING (
    current_user='sbg_authorization_compiler_rw'
    AND core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
    AND EXISTS (
      SELECT 1
      FROM core_authz.compiled_platform_permission_subject subject
      WHERE subject.id=subject_id
    )
  )
  WITH CHECK (
    current_user='sbg_authorization_compiler_rw'
    AND core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
    AND EXISTS (
      SELECT 1
      FROM core_authz.compiled_platform_permission_subject subject
      WHERE subject.id=subject_id
    )
  );

-- Explicitly keep assignment/policy/source truth outside the compiler role.
REVOKE ALL ON
  core_authz.platform_role_assignment,
  core_authz.abac_policy,
  core_authz.role_template,
  core_authz.role_permission,
  core_authz.role_assignment
FROM sbg_authorization_compiler_rw;

COMMIT;
