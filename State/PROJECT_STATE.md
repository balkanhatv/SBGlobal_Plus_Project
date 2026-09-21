# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-OUTBOX-EVENT-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `9ff139d442158b4fadfa27becc358edade1ccf1f` / tree `d45e327c713391eb35cca147e2ea8da937cf1e9a`: **311/311 Core**, **100/100 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **452 blobs / 182 Markdown / 100 source / 68 test files**.

DD-090 adds a raw typed Outbox Event PostgreSQL reader through the dedicated Integration role and final scope-aware FORCE-RLS predicate. It preserves event/catalog identity, aggregate identity/version, immutable envelope JSON and raw dispatcher status/attempt/availability/lock/dispatch/error evidence. It deliberately does not claim/lock, decide readiness/retryability, dispatch, dead-letter, replay or interpret payload schemas.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–090**.

Event dispatch execution, Webhook network/signing/filter/retry runtime, Document policy/signing, REST exposure, DD-076, AI Gateway, broad Core/Industry APIs, product experiences and production operations remain unfinished where documented.

Next: Event Catalog exact-tuple persistence is the next independent source-complete candidate for source audit; payload-schema execution/registration remains separate. Webhook network/signing/filter/retry runtime, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD090_VERIFICATION_2026-09-21.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
