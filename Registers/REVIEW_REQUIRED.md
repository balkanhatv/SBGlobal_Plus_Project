# REVIEW_REQUIRED — Current Dependency Ownership
**Current checkpoint:** `DEV-DOCUMENT-AI-PROVENANCE-RAW-READER-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-190 exposes only existing DocumentMeta AI-generated provenance persistence evidence through the existing Document FORCE-RLS/RequestScopedSql boundary. It preserves raw scope/sensitivity/residency, MediaRequest/Provider/Model ids and immutable provenance/moderation/licensing JSON without turning them into authorization, currentness, approval, publication or AI execution authority.

Verified DD-190 implementation basis `4fa07cab31cfa5b67939c007e95c27842c93ed6b` / tree `807bd258e46c461412749e5ac833dd6a34939daa`: **573/573 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36131728895` (jobs `108060304839`, `108060304912`), Database `36131728835` (job `108060304877`), Web `36131728818` (job `108060304437`).

DD-190 decision/acceptance/traceability are canonically promoted in the current metadata change. The verified executable basis is the implementation HEAD above; this promotion HEAD must independently pass Core/PostgreSQL/Database/Web before another DD is opened.

Evidence: `Registers/DEVELOPMENT_DD190_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify the DD-191 generated Document → completed AIMediaRequest provenance candidate against the fixed source audit, then implement only that direct relationship floor. Provider/Model currentness and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

No new approval request is created. Source-incomplete boundaries remain locked: machine verifier syntax/CIDR/use-audit, external REST catalog, DD-076 evaluator policy/evidence producers, webhook dispatch/signature/SSRF/retry, integration/sync execution, notification/workflow/automation execution, memory-principal provenance, retention/ACL and AI/provider/tool execution. The AIMemory principal audit is completed with a BLOCKED finding; it is not pending discovery.




## Pending source-complete candidate — DD-191

The next governed prerequisite is the direct generated Document → completed AIMediaRequest provenance relationship only. Source audit: `Development/DOCUMENT_AI_GENERATED_MEDIA_REQUEST_PROVENANCE_PREREQUISITE_OWNERSHIP_AUDIT.md`. Provider/Model currentness, moderation/licensing interpretation, Document authorization/storage and AI execution remain outside the candidate.
