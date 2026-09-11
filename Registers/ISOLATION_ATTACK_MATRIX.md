# SECURITY / ISOLATION ATTACK MATRIX — POST-REMEDIATION
**Status:** PASS AT ARCHITECTURE EVIDENCE LEVEL · **Date:** 2026-09-11 · **Evaluated HEAD:** `df1f72412044751ac30c184315d05e4d72e0099a`

This is an Architecture-level adversarial review, not executed penetration testing.

| Attack | Architectural enforcement point | Expected decision | Audit behavior | Result |
|---|---|---|---|---|
| Tenant A requests Tenant B resource | A-02 §3–§4 kernel/repository/RLS | DENY | tenant/principal/resource/reason logged | PASS |
| Same tenant Healthcare requests Retail API resource | A-01 §3 + A-02 §3–§4 active Industry Context | DENY wrong-context | active/source context + denial reason | PASS |
| Same tenant wrong `industryContextId` at DB access | A-02 §2/§4 + A-05 §3 ownership | DENY/fail closed | context/resource ownership violation | PASS |
| Retail resource ID supplied while Healthcare context active | A-02 §3 resource-ID anti-switch rule | DENY; never auto-switch | supplied resource + active context + reason | PASS |
| Healthcare user requests Retail document URL | A-05 §5 DocumentMeta ownership + A-02 §4 | DENY signed URL | document/context/ACL denial | PASS |
| Healthcare consumer receives Retail event | A-06 §4 contextual event envelope | consumer rejects/will not subscribe | event/source/consumer context mismatch | PASS |
| Healthcare-only webhook receives Retail payload | A-06 §5 context-filtered subscription | DENY/no delivery | filtered event + subscription scope | PASS |
| Queued Healthcare mutation replayed under Retail | A-08 §7–§8 + A-01 §3 | DENY unless explicit governed cross-context workflow | origin/current context + replay denial | PASS |
| Healthcare RAG query retrieves Retail private vectors | A-07 §4 | DENY/filter out | tenant/industry/ACL policy trail | PASS |
| AI agent tries Retail tool while user authorized only Healthcare | A-07 §5 + A-01/A-03 guard | DENY | acting principal/tool/context/permission denial | PASS |
| Provider route violates residency policy | A-07 §2–§3 + F-11/A-10 | DENY/fallback only to permitted provider/region | routing/policy reason without prohibited prompt leakage | PASS |

**Adversarial conclusion:** the earlier P0 asymmetry—strong AI Industry Context but tenant-only general architecture—has been closed at Architecture depth. Exact RLS predicates, storage schemas and payload fields remain Detailed Design.
