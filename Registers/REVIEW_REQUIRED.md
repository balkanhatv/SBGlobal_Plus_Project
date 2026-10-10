# REVIEW_REQUIRED — Current Dependency Ownership
**Current checkpoint:** `DEV-AI-TOKEN-USAGE-CAPABILITY-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `495a19e2608c1c6bf6ec10e04954063dd12b969b` / tree `58f0d4955e62c87a16263e00111428263ade2a09`
**Updated:** 2026-10-10 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-10):** Complete-project downstream semantic/file-coverage/adversarial audit remains **CLEAN / CLOSED** through VC27-111. The DD-713…DD-717 canonical promotion independently passed exact-HEAD Core/PostgreSQL/Database/Web at `5240e4b06c9ec798b1d36a5a1cd9436336c70eef`; this state-closure projection correction becomes effective only if its exact HEAD passes the same four gates. Production readiness **NOT CLAIMED**.

DD-713…DD-717 is the current governed backend-only scoped TokenUsage → exact global AICapability(code) persisted direct-FK relationship evidence composition. It reuses DD-197 UUID/code strict equality after the original DD-122 RequestContext/FORCE-RLS-scoped usage read and DD-109 exact global by-code lookup.

Verified current executable implementation basis `495a19e2608c1c6bf6ec10e04954063dd12b969b` / tree `58f0d4955e62c87a16263e00111428263ade2a09`: **1719/1719 Core**, **540/540 PostgreSQL** with full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped Core or PostgreSQL tests. The separate DD-713…DD-717 canonical promotion `5240e4b06c9ec798b1d36a5a1cd9436336c70eef` / tree `e7df7e43a1dc761c6c925bbd7c7678ea9797fdfe` independently passed exact-HEAD Core/PostgreSQL/Database/Web. This state-closure correction is conditional on its own exact-HEAD CI.

Raw scoped usage and global catalog source references, numeric precision and opaque metadata remain unchanged. No catalog currentness/eligibility, entitlement/policy, principal authorization, Tenant/Industry allowlisting, provider/model compatibility, pricing/billing, routing, AI inference/RAG/media/tool/agent, API/UI/mutation/events or atomic snapshot authority.

Evidence: `Registers/DEVELOPMENT_DD713_DD717_VERIFICATION_2026-10-10.md`. Source audit: `Development/AI_TOKEN_USAGE_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Development **IN PROGRESS**; production readiness **NOT CLAIMED**.

Next: Verify this DD-713…DD-717 state-closure correction at its exact HEAD with Core/PostgreSQL/Database/Web; upon green results, DD-717 state closure is effective and the next action is to source-audit the next independently source-complete backend batch before DD-718.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirement IDs**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP`. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

No new approval request is created. Implementation-incomplete/source-owned runtime boundaries remain locked: machine verifier syntax/CIDR/use-audit, external REST catalog, DD-076 evaluator policy/evidence producers, webhook dispatch/signature/SSRF/retry, integration/sync execution, notification/workflow/automation execution, memory-principal provenance, retention/ACL and AI/provider/tool execution. The AIMemory principal audit is completed with a BLOCKED finding; it is not pending discovery.
