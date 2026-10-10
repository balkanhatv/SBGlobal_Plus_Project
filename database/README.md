# Database Implementation — SBGlobal Plus

**Status:** DEVELOPMENT IN PROGRESS / CURRENT DATABASE PERSISTENCE VERIFIED
**Branch:** `docs/architecture-branch-2`
**Current repository checkpoint:** [current verified Core checkpoint](../Development/CORE_SERVICE_CHECKPOINT.md)
**Historical SQL checkpoint:** `DEV-DB-CURRENT-STATE-AUDITED-001`

## Strategy
PostgreSQL is canonical. No ORM/migration framework is selected by governing truth, so the current implementation is SQL-first and framework-neutral.

## Migration coverage
Current migrations: `0001` … `0048`; **48 migrations / 42 SQL verification files**.
Current exact-commit verification is owned by [DB_CHECKPOINT](../Development/DB_CHECKPOINT.md).

### Shared Core
- Tenant + Industry Context / org units
- Configuration / Metadata / Rules / Forms / Country Packs / Branding / Export
- Identity / Authorization / sessions / devices / API credentials
- Commercial / Subscription / Licensing / Entitlements / usage
- Document metadata / private storage / upload / ACL
- Audit / Event / Outbox / Webhook with monthly partitioning
- RLS registry + migration ledger
- Integration Registry + idempotency + SyncCursor
- Workflow / Automation / Tasks / Transition evidence
- Notification templates / delivery / attempts
- AI catalog/config/provisioning, RAG, memory, conversations, usage/cost, agents/tools/approvals
- least-privilege database service/worker roles
- exact same-scope relationship enforcement, immutable ownership selectors and dedicated Identity/Control Plane roles
- physical operator elevation, AI PromptSet/ToolSet and AI-generated DocumentMeta provenance

### Industries
All 9 Current Supported Industry schemas have canonical transactional table sets:
- Healthcare: 5 MS / 37 tables
- Education: 5 / 20
- Retail: 5 / 20
- Hospitality: 4 / 16
- Manufacturing: 5 / 20
- Professional Services: 5 / 20
- Government: 4 / 16
- NGO / Temple / Trust: 4 / 16
- Security / Facility: 4 / 16

**Total: 41 canonical Management Systems / 181 Industry tables.**

See [DB_IMPLEMENTATION_MATRIX](../Development/DB_IMPLEMENTATION_MATRIX.md).

## Verification
- per-slice SQL verification files exist under `database/verification/`;
- `0099_all_industries.verify.sql` checks 9 schemas / 41 MS / 181 registered Industry tables, forced RLS, ownership columns and cross-Industry namespace consistency;
- `0029`–`0034` verification files execute privilege/RLS, cross-scope reference, event/webhook, document, workflow/notification, AI, Core read-binding and PLATFORM_GLOBAL identity-scope adversarial cases;
- `database/scripts/apply-and-verify.sh` applies migrations and verification in lexical order;
- `.github/workflows/database-verify.yml` defines a pgvector-enabled PostgreSQL runtime verification job.

## Security invariants
- runtime/service roles are NOBYPASSRLS;
- Industry rows require current Tenant + Industry Context;
- `industryContextId = null` never means all Industries;
- physical storage metadata is hidden from ordinary application roles;
- provider credential references are hidden from ordinary application roles;
- general app role has no direct `core_ai` access; AI Gateway has a dedicated DB role;
- workflow transitions and notification attempts are append-only to runtime roles;
- partitioned audit/outbox/webhook evidence preserves global identity/idempotency.
- platform catalog mutation is control-plane-only; sensitive identity material is identity-service-only;
- event catalog, physical scope and envelope metadata must agree; ACTIVE webhooks must be verified;
- every Industry document reference resolves to exact-scope DocumentMeta, never StorageObject authority.

## Historical validation evidence — 2026-09-14
Commit `0ada4283959ea4abe39a0980574e2dfdcb62e508`: Database Verify run `34823407538`, job `103909903763` — **PASS**, all 32 migrations and 26 verification files including 0099, with the exact branch commit/tree logged. Core Service Verify run `34823407649` additionally passes 40 Core tests and 7 real PostgreSQL adapter/isolation tests after a separate full bootstrap; see [CORE_SERVICE_CHECKPOINT](../Development/CORE_SERVICE_CHECKPOINT.md).

## Historical validation evidence
Historical run `34736717516`: **PASS for migrations `0001`–`0028`**; its default PR checkout did not prove the exact tested branch commit and it is insufficient for the zero-trust findings.
PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md`.

This is a clean-database persistence verification harness, not a production upgrade/rollback runner or evidence of application-level RBAC/ABAC, provider calls, deployment, performance, penetration or recovery testing.

- `0033_core_context_read_contracts.sql` — DD-041 compiled Authorization subject/snapshot persistence and DD-042 Current Supported Industry presentation catalog with explicit least-privilege grants.

**Historical exact CI (34-migration checkpoint):** `3e7b2927…` — Database Verify 35139097903/job 104938820048 PASS (current tree: 34 migrations / 28 verification files); Core Service Verify 35139097825 jobs 104938819674 and 104938820027 PASS (current tree: 47 Core/server + 11 PostgreSQL tests).

- `0034_platform_global_identity_scope.sql` — DD-043 persisted PLATFORM_GLOBAL machine-credential scope floor; paired RequestContext/RequestScopedSql acceptance prevents ordinary HUMAN/API_CLIENT platform-global use.

## Current Commercial persistence coverage

Migrations 0035–0047 extend platform Authorization persistence/compiler ownership,
idempotency/rate limiting, context bootstrap reads, Commercial event/catalog and
compiler isolation, append-only assessment/route/remediation evidence, immutable
published PlanVersions and atomic evidence/publication serialization.
The current [DB checkpoint](../Development/DB_CHECKPOINT.md) owns exact commit/CI
evidence; historical CI above does not certify later migrations.
