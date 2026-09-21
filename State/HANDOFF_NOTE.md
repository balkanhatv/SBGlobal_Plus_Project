# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-WEBHOOK-SUBSCRIPTION-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `31fbaeb3ce7b8c2f40ae045639b9589f1eca5815` / tree `dc426535cb99ae5d4e4456b0ec76dd9d65dd6754`: **311/311 Core**, **90/90 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **444 blobs / 178 Markdown / 96 source / 68 test files**.

DD-088 adds a raw typed Webhook Subscription PostgreSQL reader under the dedicated `sbg_integration_service_rw` NOBYPASSRLS boundary. It preserves Tenant-owned endpoint/status/secret-version/filter/allowed-Industry-context metadata as immutable server-side persistence facts and returns null for RLS-hidden/absent rows. It deliberately does not verify endpoint control, perform DNS/IP/SSRF decisions, interpret event filters, handle secret material, sign requests or authorize/deliver webhooks.

Read `Development/WEBHOOK_SUBSCRIPTION_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` before extending webhook behavior. DD-088 exposes subscription persistence only; endpoint URLs are data, not authorization to connect, and allowed Industry Context ids/event filters are not yet interpreted by a delivery runtime.

Next: Webhook execution still requires source-owned endpoint verification/challenge, DNS/IP/redirect SSRF policy, secret/signature/rotation behavior, event-filter evaluation and delivery/retry/DLQ orchestration. Document upload/signed-access policy gaps remain separately governed. REST exposure, DD-076 evaluator and concrete AI Gateway also remain unfinished on their named prerequisites. Source-audit the next independent source-complete slice before implementation.

Evidence: `Registers/DEVELOPMENT_DD088_VERIFICATION_2026-09-21.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
