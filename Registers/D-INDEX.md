# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-18 · **Checkpoint:** `DEV-API-DTO-PROJECTION-001`

| Layer | Current boundary |
|---|---|
| Governance | Active |
| RawSourceCorpus | Immutable |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + DD-041/DD-045…DD-052 implementation overlays |
| Development | Authz/Commercial/PEP/audit + idempotency + rate + executor + Zod/projection tested |
| SQL/CI | 40 migrations / 34 verification files; exact-head green |
| Industry SQL | 9 Industries / 41 canonical MS / 181 tables |
| Concrete API transports | Not started |

Verified `b0f484eb8100a71c8677fce4c39441a8ab26e881` / `69d2fa367329c1dc2b02d3a829ff80d714a21177`: **148 Core / 38 PostgreSQL PASS**.

Next: **first-party tRPC adapter floor**, then concrete REST/OpenAPI only after its gate passes.
