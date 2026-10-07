# DATABASE IMPLEMENTATION MATRIX — INDUSTRY WAVE
**Current checkpoint:** `DEV-AI-RAG-CHUNK-EMBEDDING-MODEL-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `b6d614568da4fa0a25372e472534143b961617c5` / tree `4e0ae0c5978cfbba2abfd4732ae1dc116076ce48`
> **Current audit gate (2026-10-07):** DD-633…DD-637 RAGChunk→current embedding AIModel evidence is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.
**Updated:** 2026-10-07 · **Branch:** `docs/architecture-branch-2`
**Status:** 9 CURRENT SUPPORTED INDUSTRY TABLE SETS IMPLEMENTED · CURRENT PERSISTENCE CHECKPOINT VERIFIED

| Industry schema | Canonical MS | Registered canonical tables | Migration | Verification |
|---|---:|---:|---|---|
| ind_hlt | 5 | 37 | 0024 | 0024 + 0099 |
| ind_edu | 5 | 20 | 0015/0016 | 0015_0016 + 0099 |
| ind_rtl | 5 | 20 | 0020 | 0020 + 0099 |
| ind_hsp | 4 | 16 | 0018 | 0018 + 0099 |
| ind_mfg | 5 | 20 | 0019 | 0019 + 0099 |
| ind_psv | 5 | 20 | 0021 | 0021 + 0099 |
| ind_gov | 4 | 16 | 0017 | 0017 + 0099 |
| ind_ngo | 4 | 16 | 0022 | 0022 + 0099 |
| ind_sfm | 4 | 16 | 0023 | 0023 + 0099 |
| **Total** | **41** | **181** |  |  |

## Database invariants
- every registered Industry table is TENANT_INDUSTRY;
- every registered Industry table carries non-null tenant_id + industry_context_id;
- forced PostgreSQL RLS is mandatory;
- canonical MS IDs are namespace-qualified;
- no sibling Industry schema owns another Industry's business semantics;
- unequal table counts reflect domain depth, not unequal first-class status.

## Shared-Core database coverage
Implemented migrations also cover:
Tenant/Industry context · Config/Metadata/Rules/Forms · Identity/Authz · Commercial/Entitlements · Documents · Audit/Event/Outbox/Webhooks · Integration Registry/idempotency · Workflow/Automation · Notification delivery · AI/RAG/Agents · RLS registry/migration ledger · least-privilege runtime/service roles.

## Validation boundary
The 9/41/181 counts were independently recalculated from Industry DD, physical CREATE TABLE definitions and the runtime RLS/MS registry assertion. **Current executable audit evidence:** `4dd7138e5a546f608fe5e28e0912d17523e33693` / tree `33ea828f05b2b8014b4c75401822cde89aa3ee70` passes Core **739/739**, PostgreSQL **512/512** with clean database bootstrap, Database Verify **48 migrations / 42 verification files** (including `0099_all_industries.verify.sql`) and Web PASS. The later VC27-70 state-sync head `b7b50bbcdf30020c62a52e85a3cac3b074d0010b` is canonical projection evidence, not a replacement executable basis; the earlier `2c36b43a7d55c6600b71f9714389e025a06df580` evidence (32 migrations / 26 verification files) remains historical all-stages audit provenance, not the current inventory. No application or production-runtime completion is implied.
