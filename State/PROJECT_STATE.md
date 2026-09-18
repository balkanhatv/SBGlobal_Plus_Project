# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-19 · **Checkpoint:** `DEV-WEB-AUTH-001`

- Branch: `docs/architecture-branch-2`.
- Verified executable: `ac00ce9ba8ff51928a235c5719f724b4c6d720d1` / `8afd73c415a3333b3ff2aa9937f899d067be5df2`.
- Core **163/163 PASS**; PostgreSQL **38/38 PASS**; Database **40 migrations / 34 verification files PASS**.
- First-party tRPC query adapter + physical Fetch handler + concrete Clerk Bearer Authorization bridge are implemented/tested.
- Official Clerk Backend SDK is pinned; IdentityPort remains authoritative for provider→Core identity mapping.
- Selector derivation, edge policy and actual Next.js composition remain unfinished.
- RawSourceCorpus immutable; `main` unmerged; PR #2 draft/unmerged.

Next: **trusted selector derivation + edge policy reconciliation** before concrete Next.js route composition.
