-- SBGlobal Plus — Migration 0036: protect PLATFORM_GLOBAL ABAC policy mutation
-- DD-037 / DEV-AUTHZ-POLICY-READER prerequisite correction.
-- Tenant-scoped ABAC authoring remains governed by the existing Tenant/Industry RLS policy;
-- selecting PLATFORM_GLOBAL alone must not grant platform policy mutation authority.
BEGIN;

CREATE POLICY abac_policy_platform_insert_floor
  ON core_authz.abac_policy
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL
    OR current_user = 'sbg_control_plane_rw'
  );

CREATE POLICY abac_policy_platform_update_floor
  ON core_authz.abac_policy
  AS RESTRICTIVE
  FOR UPDATE
  USING (
    tenant_id IS NOT NULL
    OR current_user = 'sbg_control_plane_rw'
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    OR current_user = 'sbg_control_plane_rw'
  );

CREATE POLICY abac_policy_platform_delete_floor
  ON core_authz.abac_policy
  AS RESTRICTIVE
  FOR DELETE
  USING (
    tenant_id IS NOT NULL
    OR current_user = 'sbg_control_plane_rw'
  );

-- Platform-global policy lifecycle is a Control Plane responsibility. The app role keeps
-- its existing Tenant-scoped DML surface, but the restrictive policies above prevent it
-- from creating, rewriting or deleting tenant_id=NULL platform policies.
GRANT USAGE ON SCHEMA core_authz TO sbg_control_plane_rw;
GRANT SELECT,INSERT,UPDATE,DELETE ON core_authz.abac_policy TO sbg_control_plane_rw;

COMMIT;
