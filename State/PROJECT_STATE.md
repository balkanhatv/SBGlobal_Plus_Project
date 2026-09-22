# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-22 · **Checkpoint:** `DEV-WORKFLOW-INSTANCE-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `1dd0f3a5e06aaadf5d51dc24928d80cce773359f` / tree `187524ef8bd19470ccdb5235cc6cfb1758022b14`: **311/311 Core**, **162/162 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Inventory: **506 blobs / 205 Markdown / 126 source / 73 test files**.

DD-102 adds an exact-by-id raw WorkflowInstance PostgreSQL reader through the existing dedicated `sbg_workflow_worker_rw` NOBYPASSRLS + RequestScopedSql boundary. It preserves scope, exact WorkflowDefinition id/version, resource identity, current/lifecycle state, row-version and timestamp evidence without selecting or authorizing transitions. Schema-allowed empty text, non-positive rowVersion and non-monotonic created/updated timestamps remain raw evidence rather than invented validation rules.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–102**.

Workflow task/action execution, Notification runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished where documented.

Next: Source-audit WorkflowTask raw persistence as the next independent source-complete Workflow slice. Task assignment/state/due/claim/completion evidence must remain non-authorizing; claim/approve/reject/complete actions, transition authorization, state-machine/approval/rule execution, Notification render/send/retry/provider runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished.

Evidence: `Registers/DEVELOPMENT_DD102_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
