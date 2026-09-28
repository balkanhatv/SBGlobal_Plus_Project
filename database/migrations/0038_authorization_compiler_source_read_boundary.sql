-- SBGlobal Plus — Migration 0038: Authorization compiler source-read boundary
-- DD-048 / DEV-AUTHZ-SOURCE-COMPILER-001 prerequisite.
BEGIN;

-- The dedicated compiler may read governed RBAC source truth but still cannot mutate it.
GRANT SELECT ON
  core_authz.permission_definition,
  core_authz.role_template,
  core_authz.role_permission,
  core_authz.role_assignment,
  core_authz.platform_role_assignment
TO sbg_authorization_compiler_rw;

REVOKE INSERT,UPDATE,DELETE ON
  core_authz.permission_definition,
  core_authz.role_template,
  core_authz.role_permission,
  core_authz.role_assignment,
  core_authz.platform_role_assignment
FROM sbg_authorization_compiler_rw;

-- Tenant role_assignment already has exact Tenant/Industry FORCE RLS. Platform
-- assignment runtime reads are principal-bound, while the compiler actor is a
-- separate SERVICE principal. Give only the dedicated compiler role a platform
-- scope read policy; application code still supplies the exact target principal.
CREATE POLICY platform_role_assignment_compiler_read_policy
  ON core_authz.platform_role_assignment
  FOR SELECT
  USING (
    current_user='sbg_authorization_compiler_rw'
    AND core_tenancy.current_scope_class()='PLATFORM_GLOBAL'
  );

COMMIT;
