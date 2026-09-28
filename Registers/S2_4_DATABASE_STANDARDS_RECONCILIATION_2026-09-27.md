# S2.4 DATABASE ARCHITECTURE STANDARDS RECONCILIATION — 2026-09-27

**Scope:** S2.4-U158…U173 in the immutable Database Architecture Standards source.

## Reconciliation

S2.4 remains the specialized source-domain authority for database requirements, but canonical Architecture/Detailed Design normalize conflicts under higher authority.

- **Engine:** source MySQL-default/MariaDB/PostgreSQL-future wording is historical. UD-TECH-01 + A-05 make PostgreSQL the current canonical structured store.
- **Naming:** `snake_case` remains active. AC-19 records singular schema-qualified physical table names as canonical because the established DD/migration stream is consistently singular; the source plural-table convention is retained as superseded history. No table is renamed.
- **Identifiers:** UUID/Tenant/Industry requirements are preserved. Branch and Department identifiers are represented through the canonical typed OrgUnit model rather than separate duplicated identity systems.
- **Backup:** continuous WAL/PITR is supplemented by explicit daily/weekly/monthly scheduled base/snapshot recovery-point classes; restore validation and DR remain mandatory.
- **Integration:** REST/webhook/import/export/queue/scheduler remain platform integration capabilities. FHIR/HL7 are preserved under Healthcare interoperability, not treated as database-engine responsibilities.
- **Security/residency/governance/performance/change policy:** preserved at their existing F-03/F-04/F-11/A-05/A-10/DD-05/DD-14/DD-16 owners.

## Recorded decision — AC-19

The alternatives considered were: rename every established table to plural, add compatibility plural aliases/views, or retain singular canonical names. Retaining singular names avoids high-risk schema/query/test churn and avoids permanent dual naming while changing no product behavior or isolation boundary.

## Acceptance

DD-17 `RCV-007` now requires a production Data Home backup policy to include daily, weekly and monthly scheduled recovery-point classes alongside continuous WAL/PITR. This is a design/acceptance requirement, not a claim that production backup operations are already deployed.

No RawSource/runtime/schema/RLS/stable-requirement change. DD-208 remains the latest governed development checkpoint.
