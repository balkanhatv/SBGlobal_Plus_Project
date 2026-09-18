# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `DEV-WEB-EDGE-001`  
**Branch:** `docs/architecture-branch-2`

Verified executable `6bd1887c5d39a6298b99bbae0589154615684089` / `b512cbbb55ab9588815d8e22c345d2c0ccb69a32`:
- **168/168 Core PASS**
- **38/38 PostgreSQL PASS**
- **40 migrations / 34 verification files PASS**
- **9 Industries / 41 canonical MS / 181 Industry tables**

Shared API/web runtime now includes Clerk Bearer auth, canonical execution, exact-scope guards/idempotency/rate controls, Zod/tRPC/Fetch, exact host selectors and edge/body security.

**Next:** concrete Next.js server composition root + tRPC route floor.
