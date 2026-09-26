# Development DD-091 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `bbe923274f1a8f0238f6f8745c3521c7463c5f99` / `c64391d356e1c72b9dbca4829a37d21195d80ecb`  
**Checkpoint target:** `DEV-EVENT-CATALOG-READ-001`

## Source audit and implementation

`Development/EVENT_CATALOG_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-07, DD-17, migrations 0008/0030/0042, DD-081 EventCatalogContract and Integration-service read privileges.

DD-091 adds `src/core/integration/event-catalog.ts`, `src/server/integration/postgres-event-catalog-store.ts`, Core export and EVT-CAT-PG-001…004 in the Integration PostgreSQL fixture.

The reader requires the exact eventType + eventVersion + scopeClass tuple. It validates and freezes catalog JSON/metadata, preserves RETIRED evidence, and returns null rather than falling back to another version/scope.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35633493801 | 106445137478 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35633493801 | 106445137173 | **104/104 PASS**, 0 fail, 0 skip |
| Database Verify | 35633493755 | 106445136768 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35633493818 | 106445138749 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `bbe923274f1a8f0238f6f8745c3521c7463c5f99` / tree `c64391d356e1c72b9dbca4829a37d21195d80ecb`.

## Acceptance and invariants

EVT-CAT-PG-001…004 pass. Existing outbox/webhook/document/core suites remain green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–091, 47 migrations / 41 verification files.

Verified executable inventory: **456 blobs / 184 Markdown / 102 TypeScript source files / 68 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-091 is read-only catalog persistence. It does not execute payload schemas, mutate catalog rows, decide compatibility, select consumers, authorize webhook delivery, publish events or create a schema engine.
