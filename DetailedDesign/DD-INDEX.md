# DD-INDEX — DETAILED DESIGN INDEX
**Current checkpoint:** `DEV-DOCUMENT-AI-MODEL-PROVIDER-PAIR-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-192 implements only the generated Document → exact AIModel/AIProvider persisted composite-pair floor: exact Model id and exact Model.providerId continuity against Document aiModelId/aiProviderId. Provider/Model currentness, routing, capability/residency/sensitivity policy, Document authorization and AI execution remain outside this checkpoint.

Verified DD-192 implementation basis `36e2fa9c91aa73aafc1217da69ed62eee6d84eb7` / tree `8efb4c1dc0e13ff303d907866385fdb03e020b18`: **588/588 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36145550258` (jobs `108105690709`, `108105690850`), Database `36145550308` (job `108105690240`), Web `36145550326` (job `108105690919`).

DD-192 decision/acceptance/traceability are canonically promoted in the current metadata change. The verified executable basis is the implementation HEAD above; this promotion HEAD must independently pass Core/PostgreSQL/Database/Web before another DD is opened.

Evidence: `Registers/DEVELOPMENT_DD192_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this DD-192 canonical promotion HEAD with Core/PostgreSQL/Database/Web. Only after PASS, source-audit the next independent persisted relationship; Provider/Model currentness and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

## Historical design and implementation index

Earlier counts and next steps below apply only to their named commits.

| Range | Historical Phase-3 design status |
|---|---|
| DD-00…DD-08 | Shared/Core DD — fresh revalidated / verified |
| DD-09…DD-16 | Experience/AI/offline/infra/security DD — fresh revalidated / verified |
| DD-17…DD-19 | Acceptance/decisions/traceability — Phase-3, Database audit and current Development propagation |
| DD-20A/B/H | Historical audit evidence |
| DD-20C | Historical prior-head Wave-3 audit |
| DD-20D | Current Phase-3 overall adversarial PASS |
| DD-21 | 41-MS acceptance contracts — verified |
| DD-22 | 41 workflow matrices — verified |
| DD-23/23A | behavioral catalogs/indexes/field registry — verified |
| DD-24 | industry domain-rule decisions — verified |
| DD-25/DD-28 | KPI contracts + 165/165 named coverage — verified |
| DD-26 | surfaces/MS/mobile/Future-Industry canonical IDs — Phase-3 updated |
| DD-27 | 41-MS determinism evidence — verified |
| DD-29 | Phase-3 ambiguity sweep PASS; current Core binding gaps recorded below |
| DD-30 | Phase-3 requirement traceability PASS |
| DD-31 | Phase-3 Development/QA determinism PASS |
| Industries/* | 9/9 Industry DD artifacts fresh read; mobile app mapping normalized |

## Historical design gate and historical Development scope
**FOUNDATION PASS · ARCHITECTURE PASS · DETAILED DESIGN COMPLETE / PHASE 3 PASS.**

The historical pre-development authorization gate was subsequently satisfied and Development started. Development remains **IN PROGRESS**. Decisions are contiguous through **DD-192**; current evidence is in [CORE_SERVICE_CHECKPOINT](../Development/CORE_SERVICE_CHECKPOINT.md).

DD-162 composes current credential lifecycle, current machine-principal admissibility and requested-scope compatibility into one pure necessary floor. Final presented-credential verification and machine authentication remain absent.

The post-DD-162 machine-verifier boundary audit at `a453fc2f2f555972cd0391a3db04bc67a6e7d497` (`Development/API_CREDENTIAL_VERIFIER_REMAINING_BOUNDARY_AUDIT.md`) remains binding for machine auth. DD-163 is independently the Webhook delivery necessary-floor decision; it does not widen machine authentication.

Workflow/Automation runtime execution and concrete AI Gateway execution remain unfinished on source-owned prerequisites. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure and DD-076 evaluator also remain unfinished where documented.

DD-166 is the historical bounded Development decision: a pure TenantIntegration Definition/config/enabled-capability current-set necessary floor. It does not authorize TenantIntegration execution, provider selection, credentials/secrets or OperationContract/event/network execution.

**Historical verified canonical evidence:** `b16bf902aba7bc0c8324048cd1b4506b2363ebc8` / tree `4ee6a211b760b6dce34ff187df1d63473f970dfa` — **416/416 Core**, **497/497 PostgreSQL**, full 47/41 database bootstrap, Database Verify and Web build PASS. See [DD-166 verification](../Registers/DEVELOPMENT_DD166_VERIFICATION_2026-09-24.md).

DD-167 is the historical bounded Development decision: pure composition of DD-165 and DD-166 current-integrity floors only. It is not Integration execution authority.

DD-169 is the historical bounded Development decision: NotificationDelivery optional OutboxEvent exact-scope current-binding floor only. It is not event dispatch or notification execution authority.

DD-170 is the historical bounded Development decision: shared definition applicability/containment predicates are total fail-closed booleans with no owner-hierarchy change.

DD-172 is the historical bounded Development decision: pure conjunction of the already-governed DD-168, DD-169 and DD-171 NotificationDelivery relationship floors. Recipient-principal currentness remains outside the composition.

DD-173 is the historical bounded Development decision: WorkflowInstance→WorkflowDefinition exact id/version/ACTIVE/scope current-binding floor only.

DD-174 is the historical bounded Development decision: WorkflowTask/WorkflowTransition→WorkflowInstance exact parent id/Tenant/nullable-Industry current-binding floor only.

DD-175 is the historical bounded Development decision: AutomationRun→AutomationDefinition exact id/ACTIVE/scope current-binding floor only.

DD-176 is the historical bounded Development decision: optional AutomationDefinition→WorkflowDefinition exact-id broader/equal containment floor only.

DD-177 is the historical bounded Development decision: PromptSetMember→ACTIVE PromptSet + ACTIVE PromptTemplate + broader/equal containment current-binding floor only.

DD-178 is the historical bounded Development decision: AIToolSetMember→AIToolDefinition exact-id/ACTIVE current-binding floor only.

DD-179 is the historical bounded Development decision: AssistantDefinition required PromptTemplate + optional ToolSet exact-id/ACTIVE/broader-or-equal containment floor only.

DD-180 is the historical bounded Development decision: AgentDefinition→allowed ToolSet exact-id/ACTIVE/broader-or-equal containment current-binding floor only.

DD-181 is the historical bounded Development decision: AgentRun→AgentDefinition exact-id/ACTIVE/scope current-binding floor only.

DD-182 is the historical bounded Development decision: AgentStep persisted TOOL/non-TOOL binding currentness only. It is not approval satisfaction or Agent/tool execution authority.

DD-183 is the historical bounded Development decision: AgentStep optional AgentApproval exact persisted backlink currentness only.

DD-184 is the historical bounded Development decision: AgentApproval→AgentRun/AgentStep exact parent-chain and Tenant/nullable-Industry currentness only.

DD-185 is the historical bounded Development decision: AIConversation optional AssistantDefinition id/ACTIVE/scope current-binding floor only.

DD-186 is the bounded AIMemoryRecord optional AssistantDefinition id/ACTIVE/scope current-binding floor only.

DD-187 is the historical bounded Development decision: AIMemoryRecord direct optional supersession continuity (non-self exact parent id plus Tenant / null-safe Industry / null-safe principal / memory-class continuity) only.

DD-188 is the bounded AIMediaRequest optional PromptTemplate exact id/version/ACTIVE/owner-scope current-binding floor only.

DD-189 is the bounded AIMediaRequest input-document exact evidence-set/scope/ACTIVE/CLEAN/sensitivity/residency current-binding floor only; principal, ACL/storage and AI execution remain outside this decision.

**Historical verified executable evidence:** `69fd07ab465cf34c80d8f9771fd3ccf74cefe0de` / tree `0e007eb532c7b9871beea3ef46fcaf3513c6ee6b` — **556/556 Core**, **497/497 PostgreSQL**, **48/42 database inventory**, Database/Web PASS. See DD-187 verification.

## Historical all-stages checkpoint evidence
PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in [ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13](../Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md).
Earlier Phase-3 labels describe their recorded baseline. Current source-owner reconciliation and the full-file audit supersede inherited traceability/count assumptions without changing the preserved source IDs.

**Historical Development evidence:** `3e7b2927…` — 47 Core/server acceptance tests, 11 PostgreSQL tests, and 34 migrations / 28 verification files passed at that checkpoint.

**Historical verified executable evidence: `b37242298bff0c2b8e95a9b957896d6a7278e8fd` / tree `749064f6d423f4d685c715e905538a06dbc77613` — 402 Core/server tests including `SYNC-BIND-001…007`, 497 PostgreSQL tests, full 47/41 bootstrap, Database and Web PASS.

Post-promotion DD-145 fidelity correction `14b69ad4c66d78340c0bd020d65ff1f444b7c02c` / tree `35d7e5dafb39c53384f817cfba3a8d56ffd048ec`: Core run `35909155774` (job `107344302164`) **311/311**, PostgreSQL job `107344301757` **462/462** including corrected `APICRED-META-PG-004`, Database run `35909155819` (job `107344301870`) SUCCESS, Web run `35909155798` (job `107344301871`) SUCCESS. This changes only schema-valid nullable `allowed_cidrs` preservation; DD-146 checkpoint and OperatorElevation semantics are unchanged.

DD-164 is the bounded SyncCursor current parent/capability binding necessary floor. A true result is not synchronization authorization; cursor/provider/runtime semantics remain separately governed.


