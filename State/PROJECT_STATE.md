# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-22 · **Checkpoint:** `DEV-NOTIFICATION-TEMPLATE-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `59d4a870a0c09b655708015fca991727ed59cc91` / tree `1228fd709e2c2cd8768520f548035fa3abf0632a`: **311/311 Core**, **148/148 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **496 blobs / 202 Markdown / 121 source / 71 test files**.

DD-100 adds an exact-by-id raw NotificationTemplate PostgreSQL reader through the dedicated Notification worker/RLS boundary. It preserves owner scope, code/channel/locale/version/lifecycle/content/variable-schema/creator evidence while deliberately withholding active-version selection, owner/locale fallback, rendering, approval/send eligibility and provider/credential authority. PLATFORM templates require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**,
**2,962 unchanged source requirement IDs/text**, and contiguous
**ADR-001–020 / DD-001–100**.

Notification rendering/send/retry/provider runtime and other named
Workflow/REST/Commercial/AI/Event/Document unfinished scopes remain unclaimed.

Next: Source-audit WorkflowDefinition raw persistence as the next independent source-complete Workflow slice. Workflow selection/activation, state-machine interpretation, approval/rule execution and transition authorization must remain separate; Notification rendering/send/retry/provider runtime, CredentialReference secret retrieval, webhook/event runtime, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD100_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
