# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-20 · **Checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-SCHEMA-001`

Fresh-fetch branch/HEAD/CI before continuation.

Verified executable `4a526c8fc9287136ffad0ee723c73df536a50b27`, tree `1496cb8d43be198edd71cef62171ced096bfc607`: **193 Core + 49 PostgreSQL + 45 migrations / 39 verification files PASS + Next.js 15.5.25 production build/lock/clean-state PASS**.

DD-069 intentionally supports only metered-quota add-on deltas and typed overrides. Tenant DENY uses the global deny set; Industry DENY uses an exact scoped disabled fact so sibling Industries remain unaffected.

Do not apply add-ons to a target preview yet: `add_on.eligibility_json` is still schema-less and active adjustment reads/precedence are not executable. Public changePlan remains blocked.

Next governed slice: lock add-on eligibility and active adjustment-source read semantics only.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
