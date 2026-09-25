# PROJECT_STATE — SBGlobal Plus
**Current checkpoint:** `DEV-AI-MEDIA-PROMPT-BINDING-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-188 implements only optional AIMediaRequest → PromptTemplate exact id/version/ACTIVE/owner-scope binding. Missing, foreign or malformed binding evidence fails closed. A true result grants no principal/document access, prompt rendering, moderation or AI execution authority.

Verified canonical correction `4d9b609756d4c97417214eeadc54aa7531d57fdb` / tree `fa01068c39b18241399c5c28e9c71ea7ae67f57b`: **565/565 Core**, **497/497 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36121218741` (jobs `108026901271`, `108026901423`), Database `36121218700` (job `108026901298`), Web `36121218744` (job `108026901307`).

The named correction is canonically promoted and exact-head verified. New commits carrying metadata or candidates must pass their own exact-head CI; no self-referential commit hash is invented.

Evidence: `Registers/DEVELOPMENT_DD188_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify the DD-189 AIMediaRequest input-document binding candidate at its exact HEAD, then promote its canonical decision/acceptance/traceability only on PASS. Principal-currentness and AI execution boundaries remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

## Pending source-complete candidate — DD-189

The separately governed input-document relationship is implemented for exact-head verification; it is not yet a promoted checkpoint. Detailed contract and fixed acceptance: `Development/AI_MEDIA_INPUT_DOCUMENT_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`.
