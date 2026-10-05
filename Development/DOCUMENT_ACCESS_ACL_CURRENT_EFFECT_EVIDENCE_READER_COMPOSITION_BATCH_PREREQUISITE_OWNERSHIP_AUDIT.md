# Document ACL current-effect evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-DOCUMENT-UPLOAD-SESSION-ACTING-PRINCIPAL-EVIDENCE-READER-001`  
**Verified entry HEAD:** `e1af3f91183d1798498b6d397e333708fe86e2df`  
**Verified entry tree:** `5e676ea6ab9cd176b0f46f225a402e476e8fc978`  
**Governed batch:** DD-558 through DD-562

## Entry gate

DD-553…DD-557 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37348257778`: Core job `111892272362` **1444/1444 PASS**, PostgreSQL job `111892272534` **536/536 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37348257628` / job `111892271783` PASS. Web run `37348257629` / job `111892271758` PASS.

PR #2 remains open/draft/unmerged. RawSource remains unchanged. `main` remains unmerged.

## Reconciled source owners

- RawSource requires **Secure Document Upload**, OCR/document processing and enterprise document intelligence, but it does not define upload-session expiry/status/media/size transition policy. Therefore DD-087 upload-session usability remains intentionally unresolved and is not extended by this batch.
- DD-08 §6 defines explicit Document ACL entries with optional `valid_until` and explicitly states **“Explicit deny wins.”**
- DD-085 owns subject matching only. It preserves persisted ALLOW/DENY and `validUntil` evidence without interpreting expiry or effect.
- DD-538…DD-542 composes the exact DD-082 pre-sign candidate, DD-084 raw ACL read and DD-085 subject matching for one explicit ACL permission, while deliberately withholding expiry/effect interpretation and final authorization.
- A-03 canonical effective-access order establishes that any deny is final in the broader authorization chain, but ACL evidence cannot replace RBAC/ABAC/commercial/resource/security policy.
- DD-08 §5 still requires ACTIVE metadata, ACL, permission, entitlement, sensitivity, residency and optional step-up before any signed download grant. DD-086 storage binding is physical-object evidence only.

**SOURCE-COMPLETE:** the next independent bounded seam may interpret only the already-matched ACL rows' optional `validUntil` against one explicit trusted current instant, then apply DD-08's explicit-DENY-wins rule inside the ACL layer. This produces ACL-layer effect evidence only and must not become a final access decision or choose source-resource fallback.

## Frozen decisions

**DD-558 — exact DD-542 parent evidence first.** Add `loadDocumentAccessAclCurrentEffectEvidence(...)`. Invoke DD-542 once with the exact RequestContext, document id, explicit ACL permission and unchanged metadata/ACL/matcher dependencies. Parent errors propagate unchanged; no retry/fallback.

**DD-559 — deterministic trusted current-instant floor.** Accept one explicit server-supplied `currentTimeIso` input. It must parse to a finite instant. Each matched row with no `validUntil` remains current; a row with parseable `validUntil` is current only when `validUntil > currentTime`; equality or earlier is expired. Malformed `validUntil` fails closed. Do not read wall-clock time internally.

**DD-560 — immutable current/expired partition.** Partition only DD-542 `matchedEntries`, preserve their input order and exact object references, and expose frozen `currentEntries` and `expiredEntries`. Raw ACL and unmatched entries remain available only through the exact parent evidence.

**DD-561 — explicit DENY wins inside current ACL evidence only.** Derive one ACL-layer `effectEvidence`: `DENY` if any current matched entry is DENY; otherwise `ALLOW` if any current matched entry is ALLOW; otherwise `NONE`. This is not a full authorization decision. Expired entries never participate in the effect evidence.

**DD-562 — boundary: no fallback, final authorization or signing authority.** Do not choose source-resource inheritance versus explicit ACL, do not map OperationContract permissions, do not evaluate RBAC/ABAC/entitlement/sensitivity/residency/step-up, do not load StorageObject, do not sign or issue grants, and do not expose download/share/delete/mutation authority.

## Fixed acceptance before implementation

- **DOC-ACLEFFECT-BASE-001** exact DD-542 parent executes first with exact inputs/dependencies.
- **DOC-ACLEFFECT-BASE-002** DD-542 dependency/governed errors propagate unchanged before time/effect interpretation.
- **DOC-ACLEFFECT-TIME-001** no-expiry and future-expiry rows are current; equal/past expiry rows are expired using the exact supplied current instant.
- **DOC-ACLEFFECT-TIME-002** malformed currentTimeIso or matched validUntil fails closed without fallback.
- **DOC-ACLEFFECT-PART-001** current/expired arrays preserve DD-542 matched-entry order and exact references and are frozen.
- **DOC-ACLEFFECT-DENY-001** any current DENY yields ACL-layer DENY even when current ALLOW entries also exist.
- **DOC-ACLEFFECT-DENY-002** current ALLOW with no current DENY yields ALLOW; no current entries yields NONE.
- **DOC-ACLEFFECT-EVID-001** exact parent/raw ACL/candidate/permission evidence remains unchanged.
- **DOC-ACLEFFECT-BOUND-001** output grants no source-resource fallback choice, full authorization, RBAC/ABAC/commercial/sensitivity/residency/step-up result, storage binding/signing/grant/download/share/delete/mutation authority.

Expected executable delta: Core **1444 → 1453**. PostgreSQL remains **536**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No upload-session expiry/status/media/size/checksum/usability policy.  
No source-resource inheritance decision.  
No ACL-to-OperationContract permission mapping.  
No RBAC/ABAC/entitlement/commercial evaluation.  
No sensitivity/residency/step-up evaluation.  
No StorageObject lookup, provider selection, URL/token signing or public sharing.  
No schema, migration, role, grant, RLS, route, frontend, worker, scheduler or RawSource change.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-558…DD-562 and the nine fixed acceptances.
