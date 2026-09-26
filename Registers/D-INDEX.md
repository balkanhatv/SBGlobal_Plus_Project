# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-AI-MESSAGE-CONVERSATION-BINDING-FLOORS-001`
**Updated:** 2026-09-26 · **Branch:** `docs/architecture-branch-2`

DD-199 implements only AIMessage → AIConversation exact conversation-id parent foreign-key continuity. Conversation authorization/currentness, assistant validity, content/source access, model-route authority and AI execution remain outside this checkpoint.

Verified canonical DD-199 promotion `9e896908b814044f78d3f3f9e66137c5a405a8fa` / tree `da7d79e5b01c962c62eb0c65d4417c9da5b082a0`: **638/638 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36228554432` (jobs `108367146787`, `108367146941`), Database `36228554434` (job `108367146755`), Web `36228554438` (job `108367147299`).

DD-199 decision/acceptance/traceability are canonically promoted and the promotion HEAD is exact-head verified. This state-closure commit must pass its own Core/PostgreSQL/Database/Web gate before another DD/source audit opens.

Evidence: `Registers/DEVELOPMENT_DD199_VERIFICATION_2026-09-26.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify the DD-200 AIModel → AIProvider exact provider-id binding candidate against the fixed source audit, then implement only that direct FK continuity floor. Provider/model currentness, routing, credentials and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.


## Pending source-complete candidate — DD-200

The next governed prerequisite is the direct AIModel → AIProvider exact provider-id foreign-key continuity only. Source audit: `Development/AI_MODEL_PROVIDER_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`. Provider/model currentness, routing, credentials and AI execution remain outside the candidate.
