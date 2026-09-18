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

Verified `f97eb4fca54623a49d6405681f5bda4c3751bb84` / `32e24b9ed495aa33c88d8ad91b22262f53509f65`: **128 Core / 38 PostgreSQL PASS**.

Next: **canonical input/schema normalization + transport-neutral operation executor**, then concrete tRPC/REST adapters.
