# Database Implementation — SBGlobal Plus

**Status:** DEVELOPMENT / DATABASE IMPLEMENTATION IN PROGRESS  
**Branch:** `docs/architecture-branch-2`  
**Current repository checkpoint:** `DEV-DB-ALL-INDUSTRIES-001`

## Strategy
PostgreSQL is canonical. No ORM/migration framework is selected by governing truth, so the current implementation is SQL-first and framework-neutral.

## Migration coverage
Current migrations: `0001` … `0028`.

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

## Current validation status
Repository/static contract review: **PASS for implemented files**.  
GitHub Actions workflow: **CONFIGURED**.  
Confirmed live PostgreSQL migration+verification PASS: **NOT YET AVAILABLE**.

Do not report the Database phase runtime-complete until the PostgreSQL execution evidence is actually PASS.
