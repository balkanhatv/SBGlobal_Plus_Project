# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-20 · **Checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-SCHEMA-001`

- Branch: `docs/architecture-branch-2`.
- Verified executable: `4a526c8fc9287136ffad0ee723c73df536a50b27` / `1496cb8d43be198edd71cef62171ced096bfc607`.
- Core **193/193 PASS**; PostgreSQL **49/49 PASS**; Database **45 migrations / 39 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock, and generated-state cleanliness: **PASS**.
- DD-067 PlanVersion source schema + DD-068 licensed baseline remain verified.
- DD-069 now normalizes quota-additive add-ons and typed overrides, including Tenant-vs-Industry DENY representation.
- Add-on eligibility, active adjustment reads and precedence are not yet complete.
- Public `core.commercial.subscription.changePlan` remains intentionally unbound.
- RawSourceCorpus immutable; `main` unmerged; PR #2 draft/unmerged.

Next: **add-on eligibility + active adjustment-source read contract**, then deterministic precedence.
