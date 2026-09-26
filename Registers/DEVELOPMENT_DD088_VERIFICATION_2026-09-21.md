# Development DD-088 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `31fbaeb3ce7b8c2f40ae045639b9589f1eca5815` / `dc426535cb99ae5d4e4456b0ec76dd9d65dd6754`  
**Checkpoint target:** `DEV-WEBHOOK-SUBSCRIPTION-READ-001`

## Source audit and implementation

`Development/WEBHOOK_SUBSCRIPTION_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-07, DD-17, migrations 0008/0028/0030 and the existing request-scoped database patterns.

DD-088 adds:
- `src/core/integration/webhook-subscription.ts`;
- dedicated `src/server/database/postgres-integration-database.ts`;
- `src/server/integration/postgres-webhook-subscription-store.ts`;
- `tests/postgres/webhook-subscription-store.test.mjs`;
- DD/test traceability.

The reader is Tenant-RLS bound and returns immutable persisted subscription metadata only. Endpoint URL remains inert data; secretVersion is version metadata only.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35630832563 | 106436337496 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35630832563 | 106436337984 | **90/90 PASS**, 0 fail, 0 skip |
| Database Verify | 35630832283 | 106436336517 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35630832344 | 106436336463 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `31fbaeb3ce7b8c2f40ae045639b9589f1eca5815` / tree `dc426535cb99ae5d4e4456b0ec76dd9d65dd6754`.

## Acceptance and invariants

WH-SUB-PG-001…005 pass:
- exact Tenant subscription facts are preserved;
- foreign-Tenant subscription is hidden by FORCE-RLS;
- same-Tenant Industry context can read Tenant Core subscription metadata;
- pending/unverified rows remain raw evidence, not executable delivery authority;
- malformed id / route-context mismatch fails closed.

Existing Document/Core/PostgreSQL coverage remains green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–088, 47 migrations / 41 verification files.

Verified executable inventory: **444 blobs / 178 Markdown / 96 TypeScript source files / 68 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-088 is persistence only. Endpoint verification/control proof, DNS/IP/redirect SSRF policy, event-filter interpretation, secret/signature/rotation behavior and delivery/retry/DLQ remain separately governed runtime work.
