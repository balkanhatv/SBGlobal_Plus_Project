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
