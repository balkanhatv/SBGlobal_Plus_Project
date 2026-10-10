# DD-137 Development Verification — CountryPack Raw Global Catalog Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-FORM-FIELD-DEFINITION-READ-001`  
**Prior DD-136 promoted state basis:** `c27486968a956d723faf4ec2517e52837ed21bf4`

## 1. Source-first ownership audit

Fresh reconciliation selected one exact `core_config.country_pack` row as the next independent source-complete Core persistence slice.

Audit commit: `8b2405df3ba22fdde669d7e119ada3d3d3fa2a3b`.  
Audit artifact: `Development/COUNTRY_PACK_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

Reconciled sources include migration 0001 physical schema, migration 0009/0029 application/control-plane privileges, migration 0014 AI Gateway read ownership, later migrations for absence of a CountryPack RLS/current-selection rule, F-04 global-read platform-master ownership, A-05 global/reference CountryPack storage, DD-05 physical contract and DD-031 CountryPack reference/default boundary.

## 2. Bounded implementation

Initial implementation commit: `89122eb7b9efad2fecf3e3375a6f63559070723e`. It introduced the bounded CountryPack contract/store/tests but wrote a literal escaped newline into the Core export and therefore failed Core/Web TypeScript compilation. Intermediate commit `dfdb6506864e0e3c04820bb8c4045c1f0f6c3ae4` did not remove that literal token. The forward-only formatting correction below changed no CountryPack semantics.

Verified implementation head: `e03546f122c56e80632a96a01eaf423ce8a4c3ef`.  
Implementation tree: `62fe5013b8765632960d5ee4502020615df05a40`.

Changed implementation/test surface:

- `src/core/config/country-pack.ts`;
- `src/server/config/postgres-country-pack-store.ts`;
- `tests/postgres/country-pack-store.test.mjs`;
- `src/core/index.ts` export only.

No migration, schema, SQL verification file, role, grant, RLS policy, product policy, public/API route, Tenant activation service or localization materializer was added.

## 3. Read contract and security boundary

CountryPack is intentionally a global/reference catalog: the physical table has no Tenant/Industry ownership and no RLS. The reader therefore uses the existing `PostgresDatabase` / `SqlDatabase` application-role boundary without inventing RequestContext-based visibility.

It returns only exact persisted evidence: country/code/version/status, raw locale array, optional currency/timezone/date defaults, optional address/phone JSON, optional reference-bundle text, immutable metadata JSON, created timestamp, optional approver and optional effective-from timestamp. Raw array order/duplicates/null elements and schema-valid empty text remain persistence facts.

Migration 0029 remains authoritative: `sbg_app_rw` is SELECT-only on `core_config.country_pack`; mutation belongs to `sbg_control_plane_rw`.

## 4. Exact implementation-head CI

Exact tested implementation head: `e03546f122c56e80632a96a01eaf423ce8a4c3ef` / tree `62fe5013b8765632960d5ee4502020615df05a40`.

- Core Service Verify run `35871890076`, Core job `107217797586`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL job `107217797098`: **SUCCESS**, **399/399 PostgreSQL**, including `COUNTRYPACK-PG-001…007`.
- Database Verify run `35871890017`, job `107217797010`: **SUCCESS**, full database bootstrap PASS.
- Web Boundary Verify run `35871890004`, job `107217797491`: **SUCCESS**, Next.js/Core compile PASS.

## 5. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `1f5674dfb8211981a456d93761fa3ddb5dbe9875` / tree `99f15f43160d08a28f7380ba3e9d6e8aa6085738`.

It adds exactly one DD-137 decision, one DD-137 acceptance block and one DD-137 changelog entry.

## 6. Promotion invariant gate

- Core run `35872265125`: Core job `107219111511` **SUCCESS**, **311/311 Core**.
- Same run: PostgreSQL job `107219111531` **SUCCESS**, **399/399 PostgreSQL**, including `COUNTRYPACK-PG-001…007`.
- Database run `35872264999`, job `107219110377`: **SUCCESS**.
- Web run `35872265039`, job `107219110748`: **SUCCESS**.
- Repository invariants `REPO-001…006`: **PASS**; `REPO-004` confirms canonical DD definitions remain unique and contiguous.
- Direct DD-18 recount at the canonical head: **137 definitions / 137 unique / DD-001…DD-137 / no gaps / no duplicates**.
- Stable product invariants: **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirement IDs/text**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This gate authorizes promotion to `DEV-COUNTRY-PACK-READ-001`; it does not expand DD-137 semantics.

## 7. Explicitly unclaimed

DD-137 does not select current/latest/ACTIVE Country Packs; evaluate `effective_from` against wall-clock time; perform country/locale fallback; activate/deactivate Tenant Country Packs; merge Tenant overrides; materialize/apply localization defaults; load reference bundles; apply tax/business rules; grant permissions, entitlements or Industry activation; mutate/publish packs; revalidate AI provisioning; or expose a public route.

## 8. Safety

- All repository mutations are forward-only; no force-push.
- `main` remains unmerged.
- RawSourceCorpus is untouched.
- PR #2 remains draft/review-only unless explicitly authorized.
