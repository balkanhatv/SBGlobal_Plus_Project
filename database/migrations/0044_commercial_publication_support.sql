-- SBGlobal Plus — Migration 0044: atomic Commercial publication support
BEGIN;

-- DD-065 needs the authoritative Tenant residency value for DD-07 event envelopes.
-- Existing FORCE-RLS tenant_resolved_context_policy keeps this SELECT same-Tenant.
GRANT SELECT ON core_tenancy.tenant
TO sbg_commercial_transition_compiler_rw;

COMMIT;
