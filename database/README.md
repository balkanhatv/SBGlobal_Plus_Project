# Database Implementation — SBGlobal Plus

**Status:** DEVELOPMENT STARTED — DATABASE SPINE IN PROGRESS  
**Branch:** `docs/architecture-branch-2`  
**Authority:** DD-02, DD-03, DD-04, DD-05

## Strategy
The canonical stack fixes PostgreSQL but does not select Prisma, Drizzle, or another ORM/migration framework. The initial implementation is therefore SQL-first and framework-neutral.

## Current migrations
1. `0001_core_bootstrap.sql` — canonical schemas, Tenant + Industry Context, org structure, shared Metadata/Rules/Forms/Country Pack/Brand/Export storage and initial forced RLS.
2. `0002_form_field_parent_rls.sql` — parent-aware RLS for form fields.
3. `0003_identity_authorization.sql` — Core principals, provider links, memberships, permission/role/ABAC structures, API credentials, device and session version storage.
4. `0004_commercial_entitlement.sql` — plans/versions, subscriptions/transitions, licenses, add-ons, overrides, usage meters and immutable entitlement snapshots/facts.
5. `0005_security_rls_hardening.sql` — nullable global SessionVersion correction and tightened API credential, role and entitlement-fact RLS.

## Verification SQL
- `0001_core_bootstrap.verify.sql`
- `0002_form_field_parent_rls.verify.sql`
- `0003_0005_identity_commercial.verify.sql`

These assert structural invariants such as required schemas, forced RLS, one-primary Industry, definition uniqueness, no PAST_DUE enum, nullable global SessionVersion, platform credential isolation and Industry-scoped entitlement facts.

## Current guarantees
- `industryContextId = null` is never interpreted as all industries.
- Tenant-owned tables implemented here use Tenant-scoped forced RLS.
- Industry-owned rows implemented here additionally require Industry Context.
- PLATFORM-scoped API credentials do not become visible through a Tenant context.
- Role templates and role permissions are scope-aware.
- Industry-scoped entitlement facts cannot satisfy sibling Industry access.
- Definition and commercial state histories are versioned rather than silently overwritten.

## Not yet implemented
- application DB roles and least-privilege GRANT matrix;
- operator elevation/service-principal RLS paths;
- audit/outbox/webhook/document tables and their partitioning;
- AI/RAG vector storage;
- Industry-specific transactional tables for the 41 MS;
- executable PostgreSQL CI harness;
- ORM mappings or application repositories.

## Validation status
Repository/static design review: **PASS for current slice**.  
Live PostgreSQL migration execution: **NOT YET PERFORMED in this session**.
