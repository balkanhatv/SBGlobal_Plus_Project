# Development DD-089 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `79b44a5271e3738d2ea5e869bf0c1afc8742add8` / `8223d4918c22e66c313ab0e586356dd360237c8f`  
**Checkpoint target:** `DEV-WEBHOOK-DELIVERY-READ-001`

## Source audit and implementation

`Development/WEBHOOK_DELIVERY_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-07, DD-17, migrations 0008/0028/0030 and the DD-088 Integration database boundary.

DD-089 adds:
- `src/core/integration/webhook-delivery.ts`;
- `src/server/integration/postgres-webhook-delivery-store.ts`;
- Core export;
- real PostgreSQL delivery fixture/acceptance in `tests/postgres/webhook-subscription-store.test.mjs`;
- DD/test traceability.

The reader preserves raw persisted attempt evidence only. It does not classify delivery status/error/http evidence or schedule any action.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35631968438 | 106440071910 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35631968438 | 106440072058 | **95/95 PASS**, 0 fail, 0 skip |
| Database Verify | 35631968498 | 106440072012 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35631968424 | 106440072001 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `79b44a5271e3738d2ea5e869bf0c1afc8742add8` / tree `8223d4918c22e66c313ab0e586356dd360237c8f`.

## Acceptance and invariants

WH-DEL-PG-001…005 pass:
- exact Industry delivery preserves raw persisted attempt evidence;
- sibling Industry cannot observe Industry-scoped parent event delivery;
- Tenant-Core event delivery is same-Tenant visible from Tenant Core and Industry contexts;
- foreign-Tenant delivery is hidden by parent subscription/event RLS;
- malformed id / route-context mismatch fails closed.

Existing Webhook Subscription, Document and prior Core/PostgreSQL coverage remains green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–089, 47 migrations / 41 verification files.

Verified executable inventory: **448 blobs / 180 Markdown / 98 TypeScript source files / 68 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-089 is persistence evidence only. Endpoint verification/control proof, DNS/IP/redirect SSRF policy, event-filter interpretation, secret/signature/rotation behavior and retry/DLQ/replay execution remain separately governed runtime work.
