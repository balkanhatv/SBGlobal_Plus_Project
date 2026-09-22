# Development DD-100 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `59d4a870a0c09b655708015fca991727ed59cc91` / `1228fd709e2c2cd8768520f548035fa3abf0632a`  
**Checkpoint target:** `DEV-NOTIFICATION-TEMPLATE-READ-001`

## Source audit and implementation

`Development/NOTIFICATION_TEMPLATE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`
reconciled migration 0026 NotificationTemplate schema/owner-scope FORCE-RLS,
migration 0027 Notification worker SELECT privilege and migration 0031
creator/approver scope integrity.

DD-100 adds:
- `src/core/notification/template.ts`;
- `src/server/notification/postgres-notification-template-store.ts`;
- Core export;
- `tests/postgres/notification-template-store.test.mjs`;
- DD-100 decision + NOTIF-TPL-PG-001…006 acceptance traceability.

The exact-id reader preserves raw template evidence and deliberately does not select
active versions, apply locale/owner fallbacks, render variables, evaluate approval or
send eligibility, select providers/credentials or send notifications.

## CI-discovered fixture correction

Intermediate code head `d9063ff6514b46aff778e7caba7b75b2970a8544`
failed the six new PostgreSQL tests during fixture setup because the PLATFORM
`SERVICE` principal omitted the existing schema-required `service_code` and
`owning_module`. Commit `59d4a870a0c09b655708015fca991727ed59cc91` corrected only the fixture to satisfy the
existing identity contract. No production implementation, migration, grant or policy
was changed.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35684927606 | 106609593750 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35684927606 | 106609593441 | **148/148 PASS**, 0 fail, 0 skip |
| Database Verify | 35684927588 | 106609593530 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35684927586 | 106609593231 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact corrected head `59d4a870a0c09b655708015fca991727ed59cc91` / tree `1228fd709e2c2cd8768520f548035fa3abf0632a`.

## Acceptance and invariants

NOTIF-TPL-PG-001…006 pass:
- exact Industry raw content/schema evidence;
- sibling Industry isolation;
- same-Tenant Tenant-template visibility with RETIRED preserved as raw state;
- PLATFORM template hidden from Tenant context and visible only to trusted
  PLATFORM_GLOBAL service context;
- foreign-Tenant isolation;
- malformed id / route mismatch fail closed.

Existing NOTIF-ATT-PG, NOTIF-DEL-PG and all prior suites remain green. Invariants
remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement
IDs/text, ADR-001–020 / DD-001–100, 47 migrations / 41 verification files.

Verified executable inventory: **496 blobs / 202 Markdown / 121 TypeScript source
files / 71 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b`
and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains
`3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

NotificationTemplate persistence is not a selection/render/send engine. Locale/owner
fallback, variable rendering/escaping, approval/send eligibility, provider selection,
credentials/secrets and network execution remain unfinished.
