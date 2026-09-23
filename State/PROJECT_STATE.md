# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-AI-MEDIA-REQUEST-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `16a99ef781d07eb8048062cc3bab637d10a7c35b` / tree `ed32932282221ff26108aeb0c10a2dcad3e1957b`: **311/311 Core**, **315/315 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `ef252b21265e149faefe7b3ad21c1de679ddadd3` / tree `ed06ffb7c00f9402297d26924cef6707762bf0cd`: Core run `35838398283` (Core job `107107322184`, PostgreSQL job `107107322294`), Database run `35838398233` (job `107107321984`), Web run `35838398159` (job `107107321869`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 125 unique DD definitions**.

DD-125 adds an exact-by-id Tenant/Industry-scoped `core_ai.ai_media_request` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. MediaRequest FORCE-RLS, principal attribution, raw capability/status/moderation/localization/residency evidence, constrained media/sensitivity classes, optional prompt/version and bigint-text brand version, immutable input-document refs, and created/completed timestamps remain persisted request evidence only. The reader does not generate media, render prompts, revalidate current documents, moderate/publish outputs, resolve providers/models/brand/localization, authorize requests or route/execute AI. Existing migration-owned MediaRequest DML authority remains unchanged.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–125**.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open media generation, provider/model selection, effective authorization/routing, prompt rendering/current-selection, current document revalidation, moderation/publication, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD125_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs remain immutable; `main` is not merged by this continuation; PR #2 remains draft/unmerged unless explicitly authorized.
