# REVIEW_REQUIRED — Current Dependency Ownership
**Current checkpoint:** `DEV-AI-TOKEN-USAGE-CAPABILITY-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `495a19e2608c1c6bf6ec10e04954063dd12b969b` / tree `58f0d4955e62c87a16263e00111428263ade2a09`
**Updated:** 2026-10-10 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-10):** DD-713…DD-717 source audit and corrected bounded implementation independently passed exact-HEAD Core/PostgreSQL/Database/Web. Canonical promotion STAGED/PENDING own CI; separate state closure also needs independent verification. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness NOT CLAIMED.

DD-713…DD-717 is the current governed backend-only scoped TokenUsage → exact global AICapability(code) persisted direct-FK relationship evidence composition. It reuses DD-197 UUID/code and exact case-sensitive code equality floors after original DD-122 RequestContext/FORCE-RLS-scoped read and one DD-109 global exact-by-code lookup.

Verified corrected implementation basis `495a19e2608c1c6bf6ec10e04954063dd12b969b` / tree `58f0d4955e62c87a16263e00111428263ade2a09`: **1719/1719 Core**, **540/540 PostgreSQL** with full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped Core or PostgreSQL tests. Promotion and state closure have independent gates.

Raw TokenUsage and catalog references, numeric text and opaque metadata remain unchanged. No capability eligibility, entitlement/policy, Tenant/Industry allowlist, principal authorization, billing, model/provider compatibility, routing, RAG/media/tool/agent/inference, API/UI, events, mutations or atomic snapshot.

Evidence: `Registers/DEVELOPMENT_DD713_DD717_VERIFICATION_2026-10-10.md`. Source audit: `Development/AI_TOKEN_USAGE_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Development **IN PROGRESS**; production readiness **NOT CLAIMED**.

Next: Verify the DD-713…DD-717 canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web; only then create and independently verify a separate state-closure commit before DD-718.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirement IDs**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP`. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

No new approval request is created. Implementation-incomplete/source-owned runtime boundaries remain locked: machine verifier syntax/CIDR/use-audit, external REST catalog, DD-076 evaluator policy/evidence producers, webhook dispatch/signature/SSRF/retry, integration/sync execution, notification/workflow/automation execution, memory-principal provenance, retention/ACL and AI/provider/tool execution. The AIMemory principal audit is completed with a BLOCKED finding; it is not pending discovery.
