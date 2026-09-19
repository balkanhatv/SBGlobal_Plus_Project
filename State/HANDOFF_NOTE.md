# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-19 · **Checkpoint:** `DEV-COMMERCIAL-ENTITLEMENTS-QUERY-001`

Fresh-fetch branch/HEAD/CI before continuation.

Verified executable `3bb86bc4b1b313c6bee8c8d65406992bb6b28cc7`, tree `07ebd925d3c0176907ebd257e0cdecb5d0f3840e`: **180 Core + 44 PostgreSQL + 41 migrations / 35 verification files PASS + Next.js 15.5.25 production build/lock/clean-state PASS**.

DD-060 is implemented within bounded scope: `core.commercial.entitlements.getCurrent` accepts strict empty input, revalidates exact current Commercial snapshot, returns only client-safe enabled entitlement state and remains behind the existing Commercial/Authorization guard chain.

Next governed work is not direct mutation by assumption: audit `core.commercial.subscription.changePlan` prerequisites first. If write repository, least-privilege DB boundary, entitlement recompilation/publication, expectedVersion, outbox or deterministic lifecycle semantics are missing, close only the blocking prerequisite before the command.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
