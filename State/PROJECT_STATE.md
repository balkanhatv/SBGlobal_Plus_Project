# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-22 · **Checkpoint:** `DEV-AUTOMATION-RUN-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `0bd4cb33d07836f797d434b21d5e24fcee0a3641` / tree `e6630c0dc1d01b238e9299c6281cb3ce86ed76e6`: **311/311 Core**, **190/190 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Inventory: **526 blobs / 213 Markdown / 134 source / 77 test files**.

DD-106 adds an exact-by-id raw AutomationRun PostgreSQL reader through the dedicated Workflow worker/RLS boundary. Persisted definition/scope/status/timing/trigger/idempotency/correlation/error evidence remains evidence only; it cannot authorize trigger execution, replay, retry/finality, a next state or runtime mutation. Existing schema-owned Workflow worker AutomationRun UPDATE privilege remains unchanged outside the read-port surface.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–106**.

Automation runtime execution, Workflow transition execution, Notification runtime, Document signing, REST exposure, DD-076, concrete AI Gateway, broad product experiences and production operations remain unfinished where documented.

Next: Source-audit the next independent source-complete Workflow/Automation persistence slice. Do not open automation runtime execution semantics unless source-owned. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished.

Evidence: `Registers/DEVELOPMENT_DD106_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
