# REVIEW_REQUIRED — Current Dependency Ownership
**Current checkpoint:** `DEV-DOCUMENT-AI-MODEL-PROVIDER-PAIR-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-192 implements only the generated Document → exact AIModel/AIProvider persisted composite-pair floor: exact Model id and exact Model.providerId continuity against Document aiModelId/aiProviderId. Provider/Model currentness, routing, capability/residency/sensitivity policy, Document authorization and AI execution remain outside this checkpoint.

Verified canonical DD-192 promotion `799fc1802e62d822bff947f1fef6e0632a09a84b` / tree `c392413443e8574d94efdf317ce251066641d0bf`: **588/588 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36146256839` (jobs `108108056709`, `108108057100`), Database `36146256978` (job `108108056728`), Web `36146256807` (job `108108056620`).

DD-192 decision/acceptance/traceability are canonically promoted and the promotion HEAD is exact-head verified. This state-closure commit must pass its own Core/PostgreSQL/Database/Web gate before another DD/source audit opens.

Evidence: `Registers/DEVELOPMENT_DD192_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify the DD-193 RAGSource optional Document binding candidate against the fixed source audit, then implement only that relationship floor. Document ACL, RAG retrieval and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

No new approval request is created. Source-incomplete boundaries remain locked: machine verifier syntax/CIDR/use-audit, external REST catalog, DD-076 evaluator policy/evidence producers, webhook dispatch/signature/SSRF/retry, integration/sync execution, notification/workflow/automation execution, memory-principal provenance, retention/ACL and AI/provider/tool execution. The AIMemory principal audit is completed with a BLOCKED finding; it is not pending discovery.


## Pending source-complete candidate — DD-193

The next governed prerequisite is the RAGSource → optional DocumentMeta exact id/version/scope/ACTIVE-CLEAN/sensitivity/residency relationship only. Source audit: `Development/RAG_SOURCE_DOCUMENT_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`. Document ACL, RAG retrieval and AI execution remain outside the candidate.
