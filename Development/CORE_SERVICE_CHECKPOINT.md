# CORE SERVICE CHECKPOINT — DEV-EVENT-CATALOG-READ-001
**Updated:** 2026-09-21 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `bbe923274f1a8f0238f6f8745c3521c7463c5f99` / tree `c64391d356e1c72b9dbca4829a37d21195d80ecb`: **311/311 Core**, **104/104 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **456 blobs / 184 Markdown / 102 source / 68 test files**.

## Implemented boundary

DD-091 adds an exact Event Catalog PostgreSQL reader through the governed Integration read role. It loads only the exact eventType + eventVersion + scopeClass tuple, returns an immutable structural superset of the DD-081 EventCatalogContract, preserves ACTIVE/RETIRED and raw compatibility/consumer/retention/webhook metadata, and deliberately does not execute payload schemas, register/retire events, select consumers or authorize webhook delivery.

EVT-CAT-PG-001…004 prove exact tuple fidelity, RETIRED raw evidence preservation, no version/scope fallback and malformed-input fail-closed behavior. DD-081 can consume the returned structural catalog contract; payload-schema execution remains a separate port/runtime.

DD-090 outbox evidence, DD-089 webhook delivery evidence and earlier Integration/Document/Core checkpoints remain covered.

## Remaining scope

Event Catalog reads are not catalog mutation or schema execution. No consumer selection, webhook authorization, event publication, retry/DLQ mutation or schema engine is claimed.

Next: Payload-schema execution/registration remains unimplemented and must not be inferred from DD-091. Source-audit the next independent Integration persistence/read boundary before implementation. Webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD091_VERIFICATION_2026-09-21.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
