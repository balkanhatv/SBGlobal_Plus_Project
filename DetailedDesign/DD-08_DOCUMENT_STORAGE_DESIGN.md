# DD-08 — DOCUMENT / STORAGE DESIGN
**Wave:** 1 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-01 §7 · F-04 · F-11 · A-05 §5/§7/§8 · ADR-002 · DD-02/03/05

## 1. DocumentMeta
| Field | Type | Null | Rule |
|---|---|---:|---|
| id | uuid | No | PK |
| tenant_id | uuid | No tenant documents | immutable |
| industry_context_id | uuid | scope-dependent | required TENANT_INDUSTRY |
| scope_class | enum | No | |
| source_module | text | No | |
| source_ms | text | Yes | industry docs |
| source_resource_type | text | No | |
| source_resource_id | text/uuid | No | |
| filename_display | text | No | sanitized display only |
| media_type | text | No | verified, not trusted client only |
| size_bytes | bigint | No | >=0 |
| checksum_sha256 | text | No | integrity |
| storage_object_id | uuid | No | indirection to private object |
| owner_principal_id | uuid | Yes | |
| acl_policy_id | uuid | Yes | |
| sensitivity_class | enum | No | |
| retention_class | text | No | |
| residency_region | text | No | |
| status | enum UPLOADING/SCANNING/ACTIVE/QUARANTINED/REJECTED/DELETED/PURGED | No | |
| virus_scan_status | enum PENDING/CLEAN/INFECTED/ERROR | No | |
| version_no | int | No | >=1 |
| parent_document_id | uuid | Yes | version/derivative lineage |
| derivative_type | text | Yes | |
| ai_generated | boolean | No | default false |
| ai_media_request_id | uuid | AI output | exact originating AIMediaRequest |
| ai_provider_id/ai_model_id | uuid | AI output | registered route pair |
| ai_provenance_json | jsonb | AI output | source/input/output lineage object |
| ai_moderation_result_json | jsonb | AI output | required moderation evidence object |
| ai_licensing_usage_json | jsonb | Yes | governed provider/licensing/usage metadata |
| is_demo | boolean | No | default false |
| row_version | bigint | No | |
| created/updated audit fields | ... | No | |

ACTIVE requires CLEAN malware state. The StorageObject Data Home, size and checksum must match DocumentMeta, and tenant documents use the tenant's authoritative Data Home/residency region. AI-generated rows require the exact completed AIMediaRequest scope/security/residency plus a consistent registered provider/model pair. Indexes: tenant/context/source resource; status; checksum where dedupe policy permits; retention lifecycle; parent.

## 2. StorageObject
`id, data_home_id, provider_ref_encrypted?, bucket_class, object_key, object_version?, size, checksum, encryption_key_ref, status, created_at`. Access restricted to Document module service identity. The object key is not exposed as authorization.

## 3. Upload session
`document_upload_session{id, tenant_id, industry_context_id?, scope_class, principal_id, expected_media_types, max_size_class, expires_at, status, temp_object_ref?, checksum_expected?, created_at}`.
Creation runs access/entitlement/limit checks first.

## 4. Upload lifecycle
1 authorize create against source resource/context;
2 create upload session;
3 upload to private temporary/quarantine location;
4 verify type/size/checksum;
5 virus/malware scan;
6 if clean, atomically activate DocumentMeta/storage reference;
7 emit `document.activated`;
8 quarantine/reject on failure; no active metadata points at unsafe object.

## 5. Signed download contract
Input documentId + intended disposition. Server:
1 resolves RequestContext;
2 loads DocumentMeta under RLS;
3 checks ACTIVE state, ACL, permission, entitlement, sensitivity, residency;
4 optionally step-up auth;
5 creates one-object, short-lived signed grant;
6 audits high-sensitivity access.
Output: URL/token descriptor + expiresAt + safe filename; never storage credentials.

## 6. ACL model
Document access can inherit source-resource authorization or use explicit ACL entries:
`document_acl{id, document_id, subject_type(PRINCIPAL/ROLE/ORG_UNIT), subject_id, permission(VIEW/DOWNLOAD/SHARE/DELETE_VERSION), effect, valid_until?}`.
Explicit deny wins; ACL cannot widen beyond tenant/industry/security/compliance boundary.

## 7. Versioning
New approved replacement creates new DocumentMeta version linked to logical document family. Prior regulated/approved versions are retained per retention class; no in-place content mutation.

## 8. Derivatives
Thumbnail/preview/OCR extract/transcode is a child derivative with same or stricter tenant/context/sensitivity/residency. Derivative cannot widen ACL. Rebuildable derivative can be purged independently if source remains.

Parent and derivative identifiers are supplied together. A derivative may reference only an ACTIVE/CLEAN parent in the exact tenant/context/residency and cannot lower its sensitivity classification.

## 9. Retention/erasure
Legal hold/retention evaluated before delete. Logical delete may hide user access; physical purge follows policy. Erasure propagates to derivatives/search/RAG linkage. Audit records identifier/action/reason without preserving erased content.

## 10. Sharing
**External anonymous/public document sharing is DISABLED in the current DD.** Current sharing is authenticated principal/resource access only through DocumentMeta ACL and signed short-lived access after DD-03 authorization. No public bucket/public object ACL is permitted for private tenant documents. Any future external-share capability is a new versioned feature requiring `ShareGrant{id,tenant_id,industry_context_id,document_id,grantee_type,grantee_ref,scope,expires_at,consent_policy_ref,revoked_at?,created_by,created_at}` plus explicit threat/privacy review before it can become an implementation requirement; Development must not invent it.

## 11. Acceptance
Wrong Industry Context cannot resolve metadata; storage key cannot bypass DocumentMeta; quarantined file cannot get signed URL; derivative cannot gain broader scope; cross-region signed access obeys residency policy. Every scalar Industry document field is a same-tenant/context composite DocumentMeta dependency, and document arrays are element-validated. ACL principal/role/org-unit subjects, upload principal and document owner/audit principals must belong to the document tenant/scope.


## 12. StoragePort physical binding [DD-AC]
Document service uses a portable S3-compatible `StoragePort`. Preferred managed profile: AWS S3 in the approved Data Home region. Preferred regional/self-hosted profile: MinIO-compatible S3 storage inside the regional storage/cell boundary. Object locations remain private and non-authoritative; DocumentMeta/ACL/context remains the authorization owner. Mandatory capabilities: multipart upload, head/get/put/copy/delete-version, object versioning, metadata/checksum, server-side encryption, lifecycle, signed access and quarantine handling.


## 13. Pre-sign access candidate boundary [DD-082]

The executable Document access floor stops before storage signing. A resolved Tenant
RequestContext supplies the only Tenant/Industry authority. An injected metadata
reader loads DocumentMeta under its RLS boundary; Core then verifies the returned
metadata is structurally valid, belongs to the resolved Tenant, carries either
TENANT_CORE ownership or the exact selected TENANT_INDUSTRY context, and is both
ACTIVE and CLEAN.

A successful result is an **internal immutable access candidate** containing only
DocumentMeta-derived document/storage-object identifiers, source-resource identity,
owner, sensitivity, residency, media type, display filename, version and correlation
metadata. It is input to later DD-03/DD-04/document policy authorization and a future
StoragePort signer; it is not authorization and is never an external signed grant.

Missing/foreign/sibling-context metadata is normalized as non-disclosing resource
absence. Non-ACTIVE/non-CLEAN metadata is state-invalid. Malformed authoritative rows
or metadata dependency failures fail closed.

**Boundary:** DD-082 does not choose a download permission, entitlement, ACL result,
sensitivity step-up rule, residency exception, signed-grant TTL, bucket/provider,
object key, public route or sharing model. Full DD-08 §5 signed access remains
unimplemented until those bindings are source-owned.


## 14. PostgreSQL access-metadata reader [DD-083]

DD-082's metadata port is concretely bound to PostgreSQL through
`PostgresDocumentAccessMetadataStore`. The adapter accepts only a resolved
TENANT_CORE or TENANT_INDUSTRY RequestContext and executes one parameterized
DocumentMeta lookup inside `RequestScopedSql.withContext`. Its SQL transaction is
opened by `PostgresDocumentDatabase`, which fixes the existing migration-0028
`sbg_document_service_rw` NOBYPASSRLS role rather than reusing `sbg_app_rw`.

Migration 0006 FORCE-RLS remains the physical ownership authority: a Tenant Industry
request can read Tenant Core rows plus only its exact Industry Context rows, while a
sibling Industry row is invisible. The adapter projects only the DocumentMeta fields
required by DD-082. It does not join `storage_object` and does not expose object
keys, provider references, credentials or signed access material.

The adapter validates the persisted row shape and returns null for an RLS-hidden or
absent document. ACTIVE/CLEAN authorization-state progression remains DD-082 Core
responsibility, preserving one reusable policy-independent persistence reader.

**Boundary:** no migration, role, grant, RLS policy, ACL evaluator, signer, route,
permission, entitlement, TTL/provider configuration or public sharing is added.


## 15. Raw ACL persistence reader [DD-084]

The persisted `document_acl` relation is exposed to Document-module code through a
raw typed read port only. `DocumentAclEntry` preserves id, document id, subject
type/id, permission, effect, optional expiry and creation timestamp exactly as stored.

`PostgresDocumentAclStore` reads those rows through the DD-083
`PostgresDocumentDatabase` + `RequestScopedSql` boundary. Parent DocumentMeta
FORCE-RLS remains the physical visibility authority, so sibling-Industry ACL rows are
not observable from the active context and Tenant Core ACL rows remain same-Tenant
visible.

This reader intentionally does **not** decide access. It does not match the current
principal/roles/org-unit, filter expiry, apply explicit-deny precedence, map an
OperationContract to VIEW/DOWNLOAD/SHARE/DELETE_VERSION, or choose source-resource
inheritance versus explicit ACL behavior. Those are later policy-composition work.

**Boundary:** no permission/entitlement/ACL evaluator, signed grant, signer,
TTL/provider, public route, migration, role, grant, RLS policy or sharing capability
is introduced.


## 16. ACL subject-match evidence [DD-085]

The raw DD-084 ACL rows may be narrowed to subjects already present in the resolved
server-owned RequestContext without becoming an authorization decision.

For one explicit ACL permission and one document id:

- PRINCIPAL matches only `RequestContext.principalId`;
- ROLE matches only ids in resolved `RequestContext.roleIds`;
- ORG_UNIT matches only ids in resolved `RequestContext.orgUnitPath`, whose
  PostgreSQL resolver supplies the selected OrgUnit plus its ancestor UUIDs.

The matcher requires every supplied row to belong to the same document and preserves
input order, persisted ALLOW/DENY effect and optional validUntil evidence. It does not
interpret expiry or effect.

**Boundary:** DD-085 does not map an OperationContract to an ACL permission, decide
source-resource fallback, filter validUntil, apply explicit-deny precedence, return
ALLOW/DENY authorization, compose sensitivity/residency/step-up policy or sign
storage access.


## 17. Linked physical StorageObject binding [DD-086]

Private physical object metadata may be resolved only through an RLS-visible
DocumentMeta row. `PostgresDocumentStorageBindingStore` accepts the resolved
Tenant RequestContext plus the exact document id and storageObjectId already carried
by the DD-082 candidate, then joins `document_meta` to `storage_object` inside the
DD-083 dedicated Document PostgreSQL role.

The lookup requires:
- exact DocumentMeta → StorageObject linkage;
- current RequestContext Data Home equals StorageObject data_home_id;
- DocumentMeta ACTIVE + CLEAN;
- StorageObject ACTIVE.

Only after those predicates pass may server-internal Document code receive the
physical locator tuple (bucket class, object key/version, checksum, size, encryption
key reference and optional encrypted provider reference). The tuple is not
authorization and is never a client/transport response.

This concretely preserves P2-STO-001: possession of an object id/key cannot bypass
DocumentMeta/RLS authority. Unsafe or quarantined object state also cannot progress
toward signing.

**Boundary:** DD-086 does not decrypt provider references, choose a provider, sign a
URL/token, define TTL, evaluate ACL/permission/entitlement/step-up/residency
exceptions, expose a route, or add SQL/role/grant/RLS changes.


## 18. Raw upload-session persistence reader [DD-087]

The persisted `document_upload_session` relation is exposed through a raw typed read
port only. `DocumentUploadSession` preserves scope, principal, expected media types,
max size class, expiry, status, optional temporary object reference, optional expected
checksum and creation timestamp exactly as stored.

`PostgresDocumentUploadSessionStore` reads one session through the existing DD-083
`PostgresDocumentDatabase` + `RequestScopedSql` boundary. FORCE-RLS remains the
physical visibility authority: sibling-Industry sessions are not observable from the
active Industry Context, while Tenant Core sessions remain same-Tenant visible.

This reader intentionally does **not** decide upload usability. It does not interpret
whether `expiresAt` has passed, whether a status may transition, what a
`maxSizeClass` means, whether a media type is currently allowed, whether checksum
or temporary-object evidence satisfies upload policy, or whether the current
principal may mutate the session.

**Boundary:** no upload state machine, media/size policy, expiry reducer, StoragePort
operation, signer, route, migration, role, grant or RLS policy is introduced.
