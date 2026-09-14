# Database Implementation — SBGlobal Plus

**Status:** DEVELOPMENT IN PROGRESS / CURRENT DATABASE PERSISTENCE VERIFIED  
**Branch:** `docs/architecture-branch-2`  
**Current repository checkpoint:** `DEV-DB-CURRENT-STATE-AUDITED-001`

## Strategy
PostgreSQL is canonical. No ORM/migration framework is selected by governing truth, so the current implementation is SQL-first and framework-neutral.

## Migration coverage
Current migrations: `0001` … `0032`.

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

See `Development/DB_IMPLEMENTATION_MATRIX.md`.

## Verification
- per-slice SQL verification files exist under `database/verification/`;
- `0099_all_industries.verify.sql` checks 9 schemas / 41 MS / 181 registered Industry tables, forced RLS, ownership columns and cross-Industry namespace consistency;
- `0029`–`0032` verification files execute privilege/RLS, cross-scope reference, event/webhook, document, workflow/notification and AI adversarial cases;
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

## Current validation status
Historical run `34736717516`: **PASS for migrations `0001`–`0028`**; its default PR checkout did not prove the exact tested branch commit and it is insufficient for the zero-trust findings.  
PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md`.

This is a clean-database persistence verification harness, not a production upgrade/rollback runner or evidence of application-level RBAC/ABAC, provider calls, deployment, performance, penetration or recovery testing.
