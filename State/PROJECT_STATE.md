# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-22 · **Checkpoint:** `DEV-WORKFLOW-DEFINITION-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `267f920f9a22d03a3902f45f6c9a16498715652b` / tree `7230aa99828e961b602738d086e276d981f1bde0`: **311/311 Core**, **155/155 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Inventory: **502 blobs / 204 Markdown / 124 source / 72 test files**.

DD-101 adds an exact-by-id raw WorkflowDefinition PostgreSQL reader through dedicated `sbg_workflow_worker_rw` NOBYPASSRLS + RequestScopedSql. It preserves owner scope, version/lifecycle/schema version, state-machine/approval JSON, rule refs, principals and effective-date evidence without selecting or executing a workflow. The worker cannot mutate the definition catalog.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**,
**2,962 unchanged source requirement IDs/text**, and contiguous
**ADR-001–020 / DD-001–101**.

Workflow execution/transition policy and the documented Notification/REST/Commercial/
AI/Event/Document unfinished scopes remain unclaimed.

Next: Source-audit WorkflowInstance raw persistence as the next independent source-complete Workflow slice. Instance-state evidence remains non-executing; transition authorization, task action rules, state-machine/approval/rule execution, Notification render/send/retry/provider runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished.

Evidence: `Registers/DEVELOPMENT_DD101_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains
`3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
