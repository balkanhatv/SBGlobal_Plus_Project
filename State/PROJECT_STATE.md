# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-19 · **Checkpoint:** `DEV-COMMERCIAL-ENTITLEMENTS-QUERY-001`

- Branch: `docs/architecture-branch-2`.
- Verified executable: `3bb86bc4b1b313c6bee8c8d65406992bb6b28cc7` / `07ebd925d3c0176907ebd257e0cdecb5d0f3840e`.
- Core **180/180 PASS**; PostgreSQL **44/44 PASS**; Database **41 migrations / 35 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock, and generated-state cleanliness: **PASS**.
- First-party Identity + Workspace + client-safe Commercial entitlement query are bound through the same executor/tRPC/Next chain.
- Commercial UI projection excludes persistence identifiers, license/principal bindings and raw deny/source metadata.
- Tenant/Industry selectors remain non-authoritative; server RequestContext and current Commercial snapshot are authoritative.
- RawSourceCorpus immutable; `main` unmerged; PR #2 draft/unmerged.

Next: **Commercial subscription change-plan prerequisite audit; close blockers before mutation code**.
