# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-20 · **Checkpoint:** `DEV-COMMERCIAL-PLAN-BASELINE-001`

- Branch: `docs/architecture-branch-2`.
- Verified executable: `8f9e7a23e2b383eb7cb3e964d8ed57e35678d2e4` / `eab90b5ad7c269994686790e1d76c2c90b7953a6`.
- Core **190/190 PASS**; PostgreSQL **49/49 PASS**; Database **45 migrations / 39 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock, and generated-state cleanliness: **PASS**.
- DD-063…DD-066 Commercial event/write/publication/evidence boundaries remain verified.
- DD-067 PlanVersion JSON source schema and DD-068 license-safe baseline expansion are executable.
- Full target preview, impact evaluator and producer integrations remain unfinished.
- Public `core.commercial.subscription.changePlan` remains intentionally unbound.
- RawSourceCorpus immutable; `main` unmerged; PR #2 draft/unmerged.

Next: **add-on delta + tenant-override normalization and precedence**.
