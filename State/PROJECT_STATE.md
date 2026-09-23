# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-AI-RAG-CHUNK-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `f713a05d7f03e29938198dac96663dc0222a26b6` / tree `d6420945deba39281963d374cccde327e422e57a`: **311/311 Core**, **336/336 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `d79c4fdca4645d4b95d6442a621eb4cf3678f065` / tree `6ff1b8fddbb3e2b6c18419dca7cebbc84ae86667`: Core run `35846762899` (Core job `107134668672`, PostgreSQL job `107134669061`), Database run `35846763723` (job `107134671660`), Web run `35846763020` (job `107134669327`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 128 unique DD definitions**.

DD-128 adds an exact-by-id scoped `core_ai.rag_chunk` raw metadata reader excluding persisted vector payload. Raw ACL/model/chunk metadata remains non-authorizing and non-retrieving.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–128**.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open effective RAG retrieval/ACL evaluation, vector or FTS search, current-document authorization, provider/model routing, secret resolution, fallback/retry, inference/embedding execution, prompt-policy evaluation, assistant/agent/tool execution or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD128_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs remain immutable; `main` is not merged by this continuation; PR #2 remains draft/unmerged unless explicitly authorized.
