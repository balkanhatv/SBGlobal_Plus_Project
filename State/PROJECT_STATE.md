# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-24 · **Checkpoint:** `DEV-NOTIFICATION-TEMPLATE-CURRENT-BINDING-FLOORS-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified canonical DD-171 promotion `0bc47ea75d5405dd29bf35562b1245f0b7d3842a` / tree `5e47ae874cc88cabcbc1de11dfaa803851d601af`: **444/444 Core**, **497/497 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS. Exact-head runs: Core `35967907330` (Core job `107530583772`, PostgreSQL job `107530583559`), Database `35967907358` (job `107530584175`), Web `35967907245` (job `107530583512`).

DD-171 adds only the pure NotificationDelivery optional NotificationTemplate current-binding floor.

Canonical invariants remain **9 equal Current Supported Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, exactly **two logical Tenant mobile app classes** (`TENANT_STAFF_APP` + `TENANT_USER_APP`), and contiguous **ADR-001–020 / DD-001–171**.

Rendering/fallback/provider/send/retry semantics remain locked unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD171_VERIFICATION_2026-09-24.md`.

RawSource accepted blobs remain immutable; `main` remains unmerged; PR #2 remains draft/unmerged.
