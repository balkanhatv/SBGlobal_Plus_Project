# CORE SERVICE CHECKPOINT — DEV-BRAND-CONFIGURATION-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

Verified executable `46d7c8a4d0827678f0b741d06880af55814e1724` / tree `7f76ad448d2a392d2e1d83bd74ca70d682cab63f`: **311/311 Core**, **413/413 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `de677419568b023b3777fe234b3fbabec2ab5c07` / tree `aa4fc80f8402fcd5f44d3611354d72031fe543a4`: Core run `35877360444` (Core job `107236641285`, PostgreSQL job `107236640983`), Database run `35877360246` (job `107236639493`), Web run `35877360364` (job `107236639958`) — SUCCESS; **139 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-139 adds an exact-by-id scoped `core_config.brand_configuration` raw persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. FORCE-RLS preserves PLATFORM/TENANT/INDUSTRY visibility; ACTIVE rows are database-constrained to accessibility PASS, while raw token/typography JSON, logo/favicon UUID references, creator/approver evidence and audit timestamps remain non-resolving persistence facts. Raw BrandConfiguration evidence does not mean current/effective hierarchy resolution, protected-token enforcement, rendered theme, accessibility revalidation or document access.

`BRANDCFG-PG-001`…`BRANDCFG-PG-007` prove exact scoped BrandConfiguration read, sibling-Industry and foreign-Tenant isolation, same-Tenant Tenant-row visibility, PLATFORM_GLOBAL-only PLATFORM visibility, immutable raw token/typography JSON and UUID reference preservation, malformed/route fail-closed behavior, ACTIVE+PASS evidence without hierarchy resolution, and schema-owned DML with the migration-0032 PLATFORM write floor.

## Remaining scope

BrandConfiguration current/latest/effective selection; Platform→Industry→Tenant→user hierarchy resolution; protected security/accessibility semantic-token and Platform product-identity enforcement; lower-layer override allowlists; token/color/font/typography validation; accessibility/WCAG revalidation; theme/CSS/native-token generation; logo/favicon DocumentMeta/ACL/sensitivity/binary access; publish/activate/retire/rollback mutation; entitlement/permission evaluation; and public-route exposure remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep BrandConfiguration current/effective selection, Platform→Industry→Tenant→user hierarchy resolution, protected semantic-token enforcement, accessibility revalidation, theme rendering, logo/favicon document access and BrandConfiguration mutation outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD139_VERIFICATION_2026-09-23.md`.
