# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-18 · **Checkpoint:** `DEV-API-RATE-LIMIT-001`

| Layer | Current boundary |
|---|---|
| Governance | Active |
| RawSourceCorpus | Immutable |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + DD-041/DD-045…DD-050 runtime overlays |
| Development | Authz/Commercial/PEP/audit + idempotency + distributed rate-limit runtime tested |
| SQL/CI | 40 migrations / 34 verification files; exact-head green |
| Industry SQL | 9 Industries / 41 canonical MS / 181 tables |
| API transports | Not started |

Verified `4defa98c18e5314cf647700740de5bff33d3807e` / `ade7862646c873b65db915c11b59338912811de8`: **128 Core / 38 PostgreSQL PASS**.

Next: **canonical input/schema normalization + transport-neutral operation executor**, then concrete tRPC/REST adapters.
