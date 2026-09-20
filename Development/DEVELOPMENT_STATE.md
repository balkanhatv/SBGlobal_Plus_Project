# DEVELOPMENT STATE — SBGlobal Plus
**Updated:** 2026-09-20 · **Checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-SCHEMA-001`

Development is **IN PROGRESS — ADD-ON ELIGIBILITY / ACTIVE ADJUSTMENT SOURCES**.

Verified `4a526c8fc9287136ffad0ee723c73df536a50b27` / `1496cb8d43be198edd71cef62171ced096bfc607`:
- **193/193 Core PASS**
- **49/49 PostgreSQL PASS**
- **45 migrations / 39 verification files PASS**
- **Next.js 15.5.25 production build + deterministic lock/config clean-state PASS**

DD-069 normalizes only the source-backed quota-additive add-on case and typed tenant overrides. Full precedence is not claimed because add-on eligibility and active source reads are not yet executable.

Next: lock add-on eligibility and active adjustment-source read contract, then apply deterministic precedence. Do not bind public changePlan.

RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
