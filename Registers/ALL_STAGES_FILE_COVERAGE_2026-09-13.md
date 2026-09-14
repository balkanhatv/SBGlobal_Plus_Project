# Complete Repository File Coverage — Audit 2026-09-13

**Frozen start:** `5d779b5ff9f2cce361ce81f2901ac95edfd697cc` · **Completed coverage update:** 2026-09-14  
**Execution contract:** prompt blob `5a44cc555c52c49632e0788ba5d4995559830a3e` · **Branch:** `docs/architecture-branch-2`

All 184 starting text artifacts were read in full during this continuous audit, including both complete immutable sources and historical evidence. The final inventory adds eight correction SQL files and two audit artifacts. Content was examined in full ranges; scans/checks corroborate that reading and do not replace it. No file was excluded, no binary was present, and no RawSource byte was changed. The ledger records final corrected text ranges; all unchanged files have identical start/current blobs. Source routing is a design-owner map, never evidence that an unbuilt service passed runtime tests.

The per-file rows and referenced role/correction dictionaries together record classification, authoritative role, exact blob, bytes, lines, structured count, read range, findings, disposition, correction SHA, upstream/downstream dependencies, downstream revalidation and final status. `B:1–N/N; F:1–M/M` records complete baseline and final text reads respectively; B:NEW denotes an artifact added by this audit. Exact immutable starting blobs are retained in the rows. `SQL leads` counts top-level-looking SQL command lines for inventory only, not executable statements; `table lines` includes headers/separators. JSON counts all recursive object keys. Counts are content measures, never semantic certification.

**Final file status for every row:** `FULLY_AUDITED`. `NONE` means no new file-local defect; `HISTORY` means fully read, no current authority inferred; `CHAIN` means the original ordered SQL is preserved and the final schema is corrected by later numbered migrations; `EVIDENCE` means this artifact records the audit. Other findings use `AUD-` IDs in the companion report. Correction disposition is CORRECTED for non-NONE/non-HISTORY findings. Revalidation `S` = current source/design/state dependency reconciliation and structured/link checks complete; `R` = full SQL chain/verification and exact-commit CI passed; `H` = historical dependency interpretation reconciled, not rerun as a current certificate; `I` = immutable identity verified. Future application/provider/production execution is not claimed by any code.

Git cannot embed the SHA of a file inside that same file without changing its SHA. Only this ledger uses `SELF_GIT_TREE` for its current blob; its exact identity is the blob at this path in the published closure tree, independently compared after publication. All other current blobs are exact. Likewise, the final metadata commit containing its own report is resolved from remote Git, not invented inside its content. Correction `CD` refers to the actual substantive documentary correction commit once published; later changes only record its evidence.

## Classifications and totals

| Code | Classification | Files |
|---|---|---:|
| A | ACTIVE_CANONICAL | 65 |
| C | ACTIVE_CONTROL | 3 |
| I | ACTIVE_IMPLEMENTATION | 33 |
| T | ACTIVE_TEST_OR_VERIFICATION | 26 |
| CI | ACTIVE_CI | 1 |
| E | ACTIVE_EVIDENCE_OR_STATE | 47 |
| H | HISTORICAL_OR_SUPERSEDED | 17 |
| R | RAW_SOURCE_IMMUTABLE | 2 |

**Total: 194 classified/full-read files; 175 active files fully audited.** Bytes: 5,098,088; text lines: 51,932. Other allowed classes have zero files. These totals describe the current ledger-hosting tree.

## Owner and dependency dictionary

| Profile | Authoritative role | Upstream dependencies | Downstream dependencies |
|---|---|---|---|
| GOV | Execution/product control; immutable audit prompt freezes this run | Vision; compatible explicit user direction; MI/MP authority rules | Source interpretation; Foundation; Architecture; DD; SQL/tests; State |
| RAW | Immutable knowledge/provenance, not executable truth | Vision/user reconciliation; governed S1/S2 precedence | Foundation F-01…14; source child-ID/owner registers; later phase owners |
| FND | WHAT/WHY/WHO; F-00 also projects current status | Vision; MI/MP; S1/S2; D-DECISIONS | A-00…12; DD owners; source traceability; current audit/State |
| ARC | System-level HOW; A-12 owns ADRs | Foundation F-00…15; MI/MP; current D-DECISIONS | DD-00…18; Industry contracts; current audit/State |
| DD | Exact shared design/acceptance/decision contract; SQL implementation is separately evidenced | Foundation F-01…14; A-00…12/ADRs; DD-01 boundaries | Industry DD; database migrations; verification SQL; source routes; current checkpoints |
| IND | Industry-owned MS entities/fields/workflows; no sibling semantics imported | F-07…09/12/13; A-09; DD-01…18/21…28 | Matching ind_* migrations/registry; 0099; MS acceptance and source routes |
| EVD | Current evidence/projection only; cannot invent product or runtime authority | Relevant canonical Foundation/Architecture/DD owners; source IDs; actual Git/CI | Audit/coverage; current State/checkpoints/README and next-action decisions |
| HIS | Dated history/provenance; fully read; prior PASS is bounded to recorded snapshot | Recorded historical owners/commit; current MI/MP supersession rules | Current audit classifies history; no automatic active certification or product requirement |
| DBCORE | Ordered Core persistence migration or companion SQL assertion; evaluate final schema after all migrations | DD-02…09/13…17; DD-18 completion decisions; prior numbered migrations | Later migrations 0029…0032; matching verification; all consumers; Database Verify/State |
| DBIND | Industry persistence/assertion; namespace and MS ownership derive from matching Industry DD | Matching Industry DD; DD-05/21…25; prior Core migrations | Same-namespace MS service contracts; 0031 document refs; 0099; Database Verify/State |
| DBALL | Independent complete Industry table/MS/RLS inventory assertion | Nine Industry DD; migrations 0015…0024 and 0029…0032 | Database Verify; 9/41/181 matrix; Database checkpoint/current audit |
| RUN | Clean disposable-database migration/verification runner | Ordered SQL inventories; Bash/psql; DD-17 DBA-012/013 | Database Verify; exact-commit runtime evidence; Database/current state |
| CI | Runtime verification workflow; exact submitted branch commit asserted | Runner; SQL inventories; DD-17 DBA-012/013; authorized branch/PR | Run/job/log evidence; final Git/CI identities and current gate |

## Correction commit dictionary

| Code | Exact correction commit SHA |
|---|---|
| C1 | `1c4033ca0af3501099a014f9a34d0bad3c21c7dd` |
| C2 | `390636e79f22f1debe484f6b6e3f24f1286aae96` |
| C3 | `ba3834427e76bc87f5623058d33c82705f412bd2` |
| C4 | `ed29b57c0d22a9bbd21efbcdf768494cbfe5af40` |
| C5 | `49b9898b2bfe4b5196876f878621a85f7d034da2` |
| CD | `PENDING_PUBLICATION` |

`C1…C5` means the ordered five exact commits above; `+` lists applicable corrections. No correction required is `—`. Findings, authority, blast radius and exact run/job/root causes are in [the audit report](ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md).

## (root) — 2 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `BACKUP_METADATA.json` | H / HIS | `c2f47ca43517b33ffe9071222b3d6500f91606a5` | `c2f47ca43517b33ffe9071222b3d6500f91606a5` | 2229 / 31 / 27 keys | B:1–31/31; F:1–31/31 | HISTORY / — | H |
| `README_FOUNDATION.md` | E / EVD | `3b0665ea9cbd2dd33d80067ac6bd9f06b5d2bc94` | `f0bff50df46c48504df4932036a60e236b64e494` | 3596 / 54 / 0 table lines | B:1–47/47; F:1–54/54 | 002 / CD | S |

## .github — 1 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `.github/workflows/database-verify.yml` | CI / CI | `b506d2a4e5421e8ce8f30005e368b815dc23b24c` | `61a1ab4c233abd293e4bfd2b2cf47827021a358a` | 1970 / 67 / 40 keys | B:1–62/62; F:1–67/67 | 023 / C3 | R |

## Architecture — 14 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `Architecture/A-00_ARCHITECTURE_OVERVIEW.md` | A / ARC | `4b249a03e73c6e2d5d85a54dc0e9b695901f15fe` | `4b249a03e73c6e2d5d85a54dc0e9b695901f15fe` | 9345 / 94 / 15 table lines | B:1–94/94; F:1–94/94 | NONE / — | S |
| `Architecture/A-01_CORE_PLATFORM_ARCHITECTURE.md` | A / ARC | `a7e75036dea53f910f5a3f06bdadf50611087294` | `a7e75036dea53f910f5a3f06bdadf50611087294` | 8754 / 78 / 25 table lines | B:1–78/78; F:1–78/78 | NONE / — | S |
| `Architecture/A-02_MULTITENANT_CONTEXT_ARCHITECTURE.md` | A / ARC | `591dd4da9697fc4d537bc94642cbf02867fbea94` | `591dd4da9697fc4d537bc94642cbf02867fbea94` | 6140 / 61 / 9 table lines | B:1–61/61; F:1–61/61 | NONE / — | S |
| `Architecture/A-03_IDENTITY_SECURITY_ACCESS_ARCHITECTURE.md` | A / ARC | `4c4a240746468895363e152d6ed66ff2f77680d5` | `4c4a240746468895363e152d6ed66ff2f77680d5` | 6302 / 50 / 8 table lines | B:1–50/50; F:1–50/50 | NONE / — | S |
| `Architecture/A-04_COMMERCIAL_ENTITLEMENT_ARCHITECTURE.md` | A / ARC | `be81239503ae7481d23b1d33439230c72a7458a1` | `be81239503ae7481d23b1d33439230c72a7458a1` | 7066 / 55 / 7 table lines | B:1–55/55; F:1–55/55 | NONE / — | S |
| `Architecture/A-05_DATA_ARCHITECTURE.md` | A / ARC | `7ef9f56993abb697f654d33dbe7e81c31e69cd70` | `7ef9f56993abb697f654d33dbe7e81c31e69cd70` | 8258 / 50 / 14 table lines | B:1–50/50; F:1–50/50 | NONE / — | S |
| `Architecture/A-06_API_EVENTS_INTEGRATION_ARCHITECTURE.md` | A / ARC | `298f3214b0242f610fa9e40003b506591ade28dd` | `298f3214b0242f610fa9e40003b506591ade28dd` | 6198 / 54 / 8 table lines | B:1–54/54; F:1–54/54 | NONE / — | S |
| `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md` | A / ARC | `06094f9da112b7b58f708ec7f70bd7b348cde310` | `06094f9da112b7b58f708ec7f70bd7b348cde310` | 7883 / 56 / 0 table lines | B:1–56/56; F:1–56/56 | NONE / — | S |
| `Architecture/A-08_EXPERIENCE_ARCHITECTURE.md` | A / ARC | `09572aaa0ea3394f06ee92463578b5dc47da1355` | `09572aaa0ea3394f06ee92463578b5dc47da1355` | 8228 / 45 / 6 table lines | B:1–45/45; F:1–45/45 | NONE / — | S |
| `Architecture/A-09_INDUSTRY_SUITE_ARCHITECTURE.md` | A / ARC | `cab9914dbd7470fb167c1b6098d2376ff84cce4d` | `cab9914dbd7470fb167c1b6098d2376ff84cce4d` | 7155 / 66 / 11 table lines | B:1–66/66; F:1–66/66 | NONE / — | S |
| `Architecture/A-10_INFRASTRUCTURE_DEPLOYMENT_SCALABILITY_RESILIENCE_ARCHITECTURE.md` | A / ARC | `74ece988446bb6bc9bd24f29637984c1f5db506f` | `74ece988446bb6bc9bd24f29637984c1f5db506f` | 5532 / 43 / 0 table lines | B:1–43/43; F:1–43/43 | NONE / — | S |
| `Architecture/A-11_OBSERVABILITY_RELIABILITY_OPERATIONS_ARCHITECTURE.md` | A / ARC | `459a9e5fc83eab78981b02c84f3e70d929d5c359` | `459a9e5fc83eab78981b02c84f3e70d929d5c359` | 4933 / 44 / 0 table lines | B:1–44/44; F:1–44/44 | NONE / — | S |
| `Architecture/A-12_ARCHITECTURE_DECISIONS_CONSTRAINTS_DEPENDENCIES_TRADEOFFS.md` | A / ARC | `70f148c180f56daac91330b836dd36874ef8a466` | `70f148c180f56daac91330b836dd36874ef8a466` | 18481 / 157 / 0 table lines | B:1–157/157; F:1–157/157 | NONE / — | S |
| `Architecture/ARCHITECTURE_REVALIDATION_NOTICE.md` | E / EVD | `e03d12f94099828683f9198038ac1ea8bc2076de` | `4ae777dbdccb36e83ef57762d241ec57673c9bee` | 2018 / 31 / 0 table lines | B:1–29/29; F:1–31/31 | 002 / CD | S |

## DetailedDesign — 55 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `DetailedDesign/DD-00_DETAILED_DESIGN_OVERVIEW.md` | A / DD | `2ce483e4463ba39f26574c207f68783dee2298a4` | `2ce483e4463ba39f26574c207f68783dee2298a4` | 6260 / 101 / 16 table lines | B:1–101/101; F:1–101/101 | NONE / — | S |
| `DetailedDesign/DD-01_DOMAIN_MODULE_BOUNDARIES.md` | A / DD | `61a30809359676929605e6d59777c7ce36556087` | `61a30809359676929605e6d59777c7ce36556087` | 7289 / 82 / 25 table lines | B:1–82/82; F:1–82/82 | NONE / — | S |
| `DetailedDesign/DD-02_TENANT_INDUSTRY_CONTEXT_DESIGN.md` | A / DD | `b3fbac10c16eaa07fe15f17b2ce3ea68f694a483` | `b3fbac10c16eaa07fe15f17b2ce3ea68f694a483` | 6153 / 86 / 24 table lines | B:1–86/86; F:1–86/86 | NONE / — | S |
| `DetailedDesign/DD-03_IDENTITY_AUTHORIZATION_DESIGN.md` | A / DD | `a4ee4ddb4dd72233ad16d021aa490e620f3ea286` | `fd8773e32823f5445ac537b2bb0771a7760f8a60` | 7782 / 133 / 10 table lines | B:1–127/127; F:1–133/133 | 003/007/017/021 / CD | S |
| `DetailedDesign/DD-04_COMMERCIAL_ENTITLEMENT_DESIGN.md` | A / DD | `2132dc055625aa0fbcff23c1dff7fc3aa42f796d` | `2132dc055625aa0fbcff23c1dff7fc3aa42f796d` | 8538 / 140 / 38 table lines | B:1–140/140; F:1–140/140 | NONE / — | S |
| `DetailedDesign/DD-05_DATA_MODEL_AND_DATABASE_DESIGN.md` | A / DD | `0b90832839c0d199ee88462cc27e4f9222365e32` | `07ed766a042957e29bd5eb059ee237a8c5659a1b` | 20046 / 217 / 27 table lines | B:1–207/207; F:1–217/217 | 003…020/026 / C5 | S |
| `DetailedDesign/DD-06_API_TRPC_REST_DESIGN.md` | A / DD | `65a386541cb0d6e9e31c0f08ed262dd3deb490ba` | `65a386541cb0d6e9e31c0f08ed262dd3deb490ba` | 10321 / 168 / 30 table lines | B:1–168/168; F:1–168/168 | NONE / — | S |
| `DetailedDesign/DD-07_EVENT_OUTBOX_WEBHOOK_DESIGN.md` | A / DD | `eacd46d866f7f38999f719362dfc060ca6b6db69` | `e9e542ac692ff8846f399701b119dd00c536d0f0` | 5864 / 91 / 23 table lines | B:1–90/90; F:1–91/91 | 009…012 / CD | S |
| `DetailedDesign/DD-08_DOCUMENT_STORAGE_DESIGN.md` | A / DD | `9917006e9cf174319efaaee586cff9b0126ac827` | `42a323f060afcc9c09b90885e025d82dd071de84` | 6682 / 94 / 34 table lines | B:1–86/86; F:1–94/94 | 013/014/019 / CD | S |
| `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md` | A / DD | `a25014f692f7e29db964ac076fa0ff523dd4ca0e` | `d77ad97dab2807306ff5783aa98d66fc6216be33` | 15976 / 198 / 0 table lines | B:1–189/189; F:1–198/198 | 016/018/019 / CD | S |
| `DetailedDesign/DD-10_EXPERIENCE_APPLICATION_DESIGN.md` | A / DD | `62ed4fa07aab108082775ff67fca85bb01e62aab` | `62ed4fa07aab108082775ff67fca85bb01e62aab` | 21204 / 243 / 93 table lines | B:1–243/243; F:1–243/243 | NONE / — | S |
| `DetailedDesign/DD-11_MOBILE_OFFLINE_SYNC_DESIGN.md` | A / DD | `5dc98dadb391f2e434cf0f124f8af6caa823b83f` | `5dc98dadb391f2e434cf0f124f8af6caa823b83f` | 8238 / 97 / 7 table lines | B:1–97/97; F:1–97/97 | NONE / — | S |
| `DetailedDesign/DD-12_DESKTOP_DESIGN.md` | A / DD | `ee80cccf8f5791c7ce210325789e68d37e02f1db` | `ee80cccf8f5791c7ce210325789e68d37e02f1db` | 5049 / 74 / 11 table lines | B:1–74/74; F:1–74/74 | NONE / — | S |
| `DetailedDesign/DD-13_INDUSTRY_SUITE_DESIGN.md` | A / DD | `4c20d0428fa61bd64193a51f77ac3e19098960e9` | `4c20d0428fa61bd64193a51f77ac3e19098960e9` | 6029 / 70 / 12 table lines | B:1–70/70; F:1–70/70 | NONE / — | S |
| `DetailedDesign/DD-14_INFRASTRUCTURE_DEPLOYMENT_DESIGN.md` | A / DD | `dfa080e3ca05e04c043b0fed1318909d256c7c9f` | `dfa080e3ca05e04c043b0fed1318909d256c7c9f` | 11495 / 195 / 16 table lines | B:1–195/195; F:1–195/195 | NONE / — | S |
| `DetailedDesign/DD-15_OBSERVABILITY_OPERATIONS_DESIGN.md` | A / DD | `f93eb9c7e1c738bb72bf58e8423e82689920e884` | `f93eb9c7e1c738bb72bf58e8423e82689920e884` | 7508 / 126 / 20 table lines | B:1–126/126; F:1–126/126 | NONE / — | S |
| `DetailedDesign/DD-16_SECURITY_COMPLIANCE_DESIGN.md` | A / DD | `a4c39d51dd3847cf201cf6203a3f2ec2b0e60b06` | `a4c39d51dd3847cf201cf6203a3f2ec2b0e60b06` | 10481 / 131 / 10 table lines | B:1–131/131; F:1–131/131 | NONE / — | S |
| `DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md` | A / DD | `015365f3cd3b9c2d11283e1c5a954545bac70c39` | `a6e04e75f61ffef2c96121d7f885306656cc939e` | 24963 / 332 / 246 table lines | B:1–314/314; F:1–332/332 | 003…021/023/024/026 / C5 | S |
| `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` | A / DD | `9ffe581c2e3fe6a1fb0ff39c3f2dd09df111d8f7` | `72101c982a3b327a6fff696c01e0ca2b4f945dc6` | 30330 / 348 / 0 table lines | B:1–324/324; F:1–348/348 | 003…021/026 / C5 | S |
| `DetailedDesign/DD-19_DETAILED_DESIGN_TRACEABILITY.md` | E / EVD | `a2d1c9d720f3a41566bd31e11d99e0d400c8d04c` | `3d8c8497dce21b94935184dd6472eb1b95d2dd91` | 18402 / 157 / 85 table lines | B:1–149/149; F:1–157/157 | 002/025 / CD | S |
| `DetailedDesign/DD-20A_WAVE1_AUDIT.md` | H / HIS | `88d29593fe6fbc10b57a636ef73f9b0dec1b7f74` | `88d29593fe6fbc10b57a636ef73f9b0dec1b7f74` | 341 / 3 / 0 table lines | B:1–3/3; F:1–3/3 | HISTORY / — | H |
| `DetailedDesign/DD-20B_WAVE2_AUDIT.md` | H / HIS | `f9c7fa35b2b3441cde8f1c08d9c7c45cecef545a` | `f9c7fa35b2b3441cde8f1c08d9c7c45cecef545a` | 351 / 3 / 0 table lines | B:1–3/3; F:1–3/3 | HISTORY / — | H |
| `DetailedDesign/DD-20C_WAVE3_ADVERSARIAL_AUDIT.md` | H / HIS | `74fc0df1cc6d7fe5f02b544d2d87c1f345a96213` | `74fc0df1cc6d7fe5f02b544d2d87c1f345a96213` | 18540 / 90 / 59 table lines | B:1–90/90; F:1–90/90 | HISTORY / — | H |
| `DetailedDesign/DD-20D_OVERALL_DETAILED_DESIGN_AUDIT.md` | E / EVD | `5bda1a4eca12d1b243953017430099d07ea9b55e` | `5bda1a4eca12d1b243953017430099d07ea9b55e` | 2095 / 44 / 0 table lines | B:1–44/44; F:1–44/44 | NONE / — | S |
| `DetailedDesign/DD-20H_LEGACY_COMBINED_AUDIT_HISTORY.md` | H / HIS | `a9f65528f06caa2c5a64fcc935ce253ea9866f09` | `a9f65528f06caa2c5a64fcc935ce253ea9866f09` | 12863 / 240 / 76 table lines | B:1–240/240; F:1–240/240 | HISTORY / — | H |
| `DetailedDesign/DD-20_DETAILED_DESIGN_FINAL_AUDIT.md` | E / EVD | `1483eef648f1dffe484053a3c3b0a4e28d054d21` | `6deedbb739559cbf54c1d3ba060f7c49a6b3177a` | 1677 / 19 / 10 table lines | B:1–19/19; F:1–19/19 | 002 / CD | S |
| `DetailedDesign/DD-21_MS_ACCEPTANCE_TEST_CONTRACTS.md` | A / DD | `6b9438c159aee1bc5426341082c843cb84a53a2b` | `6b9438c159aee1bc5426341082c843cb84a53a2b` | 134024 / 753 / 656 table lines | B:1–753/753; F:1–753/753 | NONE / — | S |
| `DetailedDesign/DD-22H_STATE_ENUM_DERIVATION_HISTORY.md` | H / HIS | `2a29c1de7ed1208a660c43edb804e327dcde5e3b` | `59107bdab4d1d5dd7d72ad6a03e68c449affd038` | 380808 / 2143 / 856 table lines | B:1–2143/2143; F:1–2143/2143 | 022 / CD | H |
| `DetailedDesign/DD-22_MS_WORKFLOW_TRANSITION_MATRICES.md` | A / DD | `bc62574fa40fc08090bd273f7f109dc71b56bc4d` | `bd30c710299b20b339f92a2aed5adeb90e23e677` | 245064 / 625 / 391 table lines | B:1–625/625; F:1–625/625 | 022 / CD | S |
| `DetailedDesign/DD-23A_BEHAVIOR_FIELD_REGISTRY.md` | A / DD | `5c907615ab165666cbfbd44ec2e030529bfaee78` | `5c907615ab165666cbfbd44ec2e030529bfaee78` | 12764 / 107 / 94 table lines | B:1–107/107; F:1–107/107 | NONE / — | S |
| `DetailedDesign/DD-23_BEHAVIORAL_CATALOGS_INDEX_CONTRACTS.md` | A / DD | `23bf72bf29a083fdb6f1303bd6c6791abfcc3e4c` | `23bf72bf29a083fdb6f1303bd6c6791abfcc3e4c` | 4375 / 52 / 19 table lines | B:1–52/52; F:1–52/52 | NONE / — | S |
| `DetailedDesign/DD-24_INDUSTRY_DOMAIN_RULE_DECISIONS.md` | A / DD | `f58c05db4f43ca99f91151e2d9bcae5e023c4dee` | `f58c05db4f43ca99f91151e2d9bcae5e023c4dee` | 21278 / 305 / 0 table lines | B:1–305/305; F:1–305/305 | NONE / — | S |
| `DetailedDesign/DD-25_KPI_CALCULATION_CATALOG.md` | A / DD | `807dc97606cb5d4bcc59be93485c5f4471e9c2db` | `807dc97606cb5d4bcc59be93485c5f4471e9c2db` | 39431 / 202 / 173 table lines | B:1–202/202; F:1–202/202 | NONE / — | S |
| `DetailedDesign/DD-26_CANONICAL_SURFACES_MS_IDENTIFIERS.md` | A / DD | `6ef9e8d3058e83a23ed1ffc6e3470533f46ebb15` | `6ef9e8d3058e83a23ed1ffc6e3470533f46ebb15` | 3065 / 48 / 0 table lines | B:1–48/48; F:1–48/48 | NONE / — | S |
| `DetailedDesign/DD-27_41_MS_DETERMINISM_AUDIT.md` | E / EVD | `6da43e0fdf6b8007ff12161fbce05b47319f17fc` | `6da43e0fdf6b8007ff12161fbce05b47319f17fc` | 147642 / 1194 / 1077 table lines | B:1–1194/1194; F:1–1194/1194 | NONE / — | S |
| `DetailedDesign/DD-28_FINAL_NAMED_KPI_COVERAGE.md` | A / DD | `13bcac0fe7b9a0ba0767fe1886abbc3565e425ff` | `13bcac0fe7b9a0ba0767fe1886abbc3565e425ff` | 31739 / 179 / 167 table lines | B:1–179/179; F:1–179/179 | NONE / — | S |
| `DetailedDesign/DD-29_FINAL_REVIEW_REQUIRED_SWEEP.md` | E / EVD | `24223ffb424945cf83bb5984d327ea83dc47fde5` | `24223ffb424945cf83bb5984d327ea83dc47fde5` | 1527 / 32 / 0 table lines | B:1–32/32; F:1–32/32 | NONE / — | S |
| `DetailedDesign/DD-30_FINAL_REQUIREMENT_TRACEABILITY_AUDIT.md` | E / EVD | `88d2c099ba5458a216f6a277c6b3198708b3a179` | `88d2c099ba5458a216f6a277c6b3198708b3a179` | 1819 / 33 / 0 table lines | B:1–33/33; F:1–33/33 | NONE / — | S |
| `DetailedDesign/DD-31_FINAL_DEVELOPMENT_QA_DETERMINISM.md` | E / EVD | `86f26bd64bb470b86dac052f4f6c3e61637990d1` | `86f26bd64bb470b86dac052f4f6c3e61637990d1` | 2021 / 34 / 11 table lines | B:1–34/34; F:1–34/34 | NONE / — | S |
| `DetailedDesign/DD-CHANGELOG.md` | E / EVD | `9995c1a90d2532842242e54540293460e2fe0810` | `069b921c8120a01504030d7961b51ac5b6b81df4` | 3144 / 14 / 12 table lines | B:1–14/14; F:1–14/14 | 002/022 / CD | S |
| `DetailedDesign/DD-CHECKPOINT.md` | E / EVD | `ead9f4f14d27cb964238d314db9f7e889cc47d72` | `8a44228243496f88310e99942d8139193f2e3702` | 1888 / 31 / 0 table lines | B:1–26/26; F:1–31/31 | 002 / CD | S |
| `DetailedDesign/DD-INDEX.md` | E / EVD | `b5525c85135075c65ddb67f0895d78ed16ee8d0d` | `5c0b77ec6cc1a15cbfe15dc6c7533a71cc36e783` | 2241 / 32 / 19 table lines | B:1–27/27; F:1–32/32 | 002 / CD | S |
| `DetailedDesign/DD-PHASE_STATE.md` | E / EVD | `b712ef314dd436b68d2a082d9782135ddb360662` | `bdaa8bad0f3bf66ded6dba5f872333c40ee89f57` | 1819 / 20 / 0 table lines | B:1–14/14; F:1–20/20 | 002 / CD | S |
| `DetailedDesign/DD-REVIEW_REQUIRED.md` | E / EVD | `f9b8e1ae3b9b565e55b09f2805961aa8873e5ade` | `1460b7199c37cc201ee8aa383c6fa5a646827b3e` | 1855 / 29 / 0 table lines | B:1–24/24; F:1–29/29 | 002 / CD | S |
| `DetailedDesign/Industries/Education/EDU-00_DETAILED_DESIGN.md` | A / IND | `bfcd2645bad6a47d340f552be91c83e1bdeebc74` | `bfcd2645bad6a47d340f552be91c83e1bdeebc74` | 34052 / 308 / 30 table lines | B:1–308/308; F:1–308/308 | NONE / — | S |
| `DetailedDesign/Industries/Government/GOV-00_DETAILED_DESIGN.md` | A / IND | `40d66c7bd7dc281def3a869938c567155f6fd85c` | `40d66c7bd7dc281def3a869938c567155f6fd85c` | 22971 / 222 / 24 table lines | B:1–222/222; F:1–222/222 | NONE / — | S |
| `DetailedDesign/Industries/Healthcare/HLT-00_DETAILED_DESIGN.md` | A / IND | `57a85d8045c99303e8e292709b7aff6f319cccde` | `fe3192f1000623c55f1bc5d2216e3f577d563103` | 33238 / 235 / 47 table lines | B:1–235/235; F:1–235/235 | 022 / C1 | S |
| `DetailedDesign/Industries/Hospitality/HSP-00_DETAILED_DESIGN.md` | A / IND | `940282529651fd4079d2bf93a1f18815c7870efb` | `940282529651fd4079d2bf93a1f18815c7870efb` | 26727 / 250 / 24 table lines | B:1–250/250; F:1–250/250 | NONE / — | S |
| `DetailedDesign/Industries/Manufacturing/MFG-00_DETAILED_DESIGN.md` | A / IND | `5957f67b6126165e7b993f25d70a152829865a19` | `5957f67b6126165e7b993f25d70a152829865a19` | 28219 / 273 / 30 table lines | B:1–273/273; F:1–273/273 | NONE / — | S |
| `DetailedDesign/Industries/NGO-Temple-Trust/NGO-00_DETAILED_DESIGN.md` | A / IND | `5c20b7813f4cb125adf5b46b2537e9a8ae8851e7` | `5c20b7813f4cb125adf5b46b2537e9a8ae8851e7` | 23004 / 222 / 24 table lines | B:1–222/222; F:1–222/222 | NONE / — | S |
| `DetailedDesign/Industries/ProfessionalServices/PSV-00_DETAILED_DESIGN.md` | A / IND | `b98d02f8f8b5b6c08b778c4e22457346ea18096b` | `1903d47eec7b2fd360b540992aa269828ac4cd32` | 28277 / 273 / 30 table lines | B:1–273/273; F:1–273/273 | 014 / CD | S |
| `DetailedDesign/Industries/Retail/RTL-00_DETAILED_DESIGN.md` | A / IND | `ecc64c08e0ea4b0cbaf1cfb2bff8902bcd0b1f5f` | `ecc64c08e0ea4b0cbaf1cfb2bff8902bcd0b1f5f` | 32975 / 308 / 30 table lines | B:1–308/308; F:1–308/308 | NONE / — | S |
| `DetailedDesign/Industries/Security-Facility/SFM-00_DETAILED_DESIGN.md` | A / IND | `e1e24fc06aa2402edd241b8bd845042ec5fdd07b` | `e1e24fc06aa2402edd241b8bd845042ec5fdd07b` | 23001 / 222 / 24 table lines | B:1–222/222; F:1–222/222 | NONE / — | S |
| `DetailedDesign/WAVE3_CROSS_INDUSTRY_AUDIT.md` | E / EVD | `f18978dbf06453feba697913e4a8abfd631026a0` | `f18978dbf06453feba697913e4a8abfd631026a0` | 3052 / 50 / 24 table lines | B:1–50/50; F:1–50/50 | NONE / — | S |
| `DetailedDesign/WAVE3_MS_COMPLETENESS_MATRIX.md` | E / EVD | `9b55148a35dc186e01832062f02a2bde66fec068` | `9b55148a35dc186e01832062f02a2bde66fec068` | 5302 / 58 / 43 table lines | B:1–58/58; F:1–58/58 | NONE / — | S |

## Development — 3 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `Development/DB_CHECKPOINT.md` | E / EVD | `a5ee3575be0b3aa879fccc41281354e24aa3cacd` | `5e42a469efe925e9a3153c16d6830f2add593997` | 3301 / 62 / 12 table lines | B:1–60/60; F:1–62/62 | 002 / CD | S |
| `Development/DB_IMPLEMENTATION_MATRIX.md` | E / EVD | `81d4208f60e37fbb93a83b2a68d8ef9e7a05b066` | `edab1800352de02322fdd9011635d00706abfd69` | 2153 / 32 / 12 table lines | B:1–34/34; F:1–32/32 | 002 / CD | S |
| `Development/DEVELOPMENT_STATE.md` | E / EVD | `fe2c77e37fa596563ef87abeb17631b830d17a12` | `d23397b8abc4e7624486ae10229f614697297159` | 1718 / 12 / 0 table lines | B:1–38/38; F:1–12/12 | 002 / CD | S |

## Foundation — 16 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `Foundation/F-00_FOUNDATION_OVERVIEW.md` | A / FND | `7d236333b27ade2b54df8c4b7ad773cd02114a8b` | `0437d34e2c76ca1f1180191388312db5483a1b28` | 25874 / 264 / 63 table lines | B:1–261/261; F:1–264/264 | 002 / CD | S |
| `Foundation/F-01_PLATFORM_FOUNDATION.md` | A / FND | `729347b5c9b9e2af8d303e789f302caca13cbdbd` | `729347b5c9b9e2af8d303e789f302caca13cbdbd` | 15567 / 96 / 17 table lines | B:1–96/96; F:1–96/96 | NONE / — | S |
| `Foundation/F-02_END_TO_END_WORKFLOW.md` | A / FND | `4f600f52dcf3d989d175cdcf99b19629ffcb304b` | `4f600f52dcf3d989d175cdcf99b19629ffcb304b` | 10351 / 69 / 0 table lines | B:1–69/69; F:1–69/69 | NONE / — | S |
| `Foundation/F-03_IDENTITY_SECURITY.md` | A / FND | `aea9e4c66093282ad4e200ba86384449d990db4c` | `aea9e4c66093282ad4e200ba86384449d990db4c` | 9381 / 71 / 7 table lines | B:1–71/71; F:1–71/71 | NONE / — | S |
| `Foundation/F-04_DATA_FOUNDATION.md` | A / FND | `018dec7a90619fec1431ebe76fb598d0594c29f9` | `018dec7a90619fec1431ebe76fb598d0594c29f9` | 8931 / 61 / 0 table lines | B:1–61/61; F:1–61/61 | NONE / — | S |
| `Foundation/F-05_AI_FOUNDATION.md` | A / FND | `8972db4ef22412adce6a7682b4975d53abd194bd` | `8972db4ef22412adce6a7682b4975d53abd194bd` | 5683 / 36 / 0 table lines | B:1–36/36; F:1–36/36 | NONE / — | S |
| `Foundation/F-06_EXPERIENCE_LAYER.md` | A / FND | `6527910f288da748a8c4ecf2f7e7a641bdcd629d` | `6527910f288da748a8c4ecf2f7e7a641bdcd629d` | 8491 / 50 / 0 table lines | B:1–50/50; F:1–50/50 | NONE / — | S |
| `Foundation/F-07_INDUSTRIES_1-3.md` | A / FND | `d28d209dc1629c1ce3ba948ee2242ae7938d4367` | `d28d209dc1629c1ce3ba948ee2242ae7938d4367` | 14014 / 106 / 7 table lines | B:1–106/106; F:1–106/106 | NONE / — | S |
| `Foundation/F-08_INDUSTRIES_4-6.md` | A / FND | `b3c01e067f932b9c9fce0cf05b64f7d9b0bd8b69` | `b3c01e067f932b9c9fce0cf05b64f7d9b0bd8b69` | 9539 / 83 / 0 table lines | B:1–83/83; F:1–83/83 | NONE / — | S |
| `Foundation/F-09_INDUSTRIES_7-9.md` | A / FND | `a5fb8a5e6c09bf76a3a79a71bdf9ec325abe3cb7` | `a5fb8a5e6c09bf76a3a79a71bdf9ec325abe3cb7` | 10853 / 83 / 0 table lines | B:1–83/83; F:1–83/83 | NONE / — | S |
| `Foundation/F-10_DESKTOP_FOUNDATION.md` | A / FND | `b082c5ae5aae78f3d2cb346c5299155389cea1bb` | `b082c5ae5aae78f3d2cb346c5299155389cea1bb` | 6270 / 38 / 0 table lines | B:1–38/38; F:1–38/38 | NONE / — | S |
| `Foundation/F-11_DATA_RESIDENCY.md` | A / FND | `a91692581f77278694f5b145a6f8d045355e55ab` | `a91692581f77278694f5b145a6f8d045355e55ab` | 5675 / 38 / 0 table lines | B:1–38/38; F:1–38/38 | NONE / — | S |
| `Foundation/F-12_INDUSTRY_MS_DEEPENING.md` | A / FND | `b979a75ed7ffd94bc9bcb6749a7a312e5e398fd9` | `b979a75ed7ffd94bc9bcb6749a7a312e5e398fd9` | 15521 / 58 / 15 table lines | B:1–58/58; F:1–58/58 | NONE / — | S |
| `Foundation/F-13_MS_DEPTH_COMPLETION.md` | A / FND | `ee8746705aeb69fb7629c92457b128856f512cbe` | `ee8746705aeb69fb7629c92457b128856f512cbe` | 50371 / 207 / 0 table lines | B:1–207/207; F:1–207/207 | NONE / — | S |
| `Foundation/F-14_COMMERCIAL_FOUNDATION.md` | A / FND | `0cdae5bee68ef974734d0711f566909b68e5e969` | `0cdae5bee68ef974734d0711f566909b68e5e969` | 15204 / 82 / 7 table lines | B:1–82/82; F:1–82/82 | NONE / — | S |
| `Foundation/F-15_FOUNDATION_TRUTH_REVALIDATION.md` | E / EVD | `ba333765ee5390796520d45025b2a3cc049211bf` | `a25f2d426510566dfce006ab67e63a2ad9a0dc61` | 7191 / 94 / 0 table lines | B:1–91/91; F:1–94/94 | 002 / CD | S |

## Governing — 5 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `Governing/MASTER_INSTRUCTION_v2_5.md` | C / GOV | `63adccadfa42e91e6d49c54b940c50eee24160c2` | `cb9963058efbb401b6415e0e3559a14e0ee0bc47` | 75279 / 475 / 75 table lines | B:1–472/472; F:1–475/475 | 001/002 / C1+CD | S |
| `Governing/MASTER_PROMPT_v2_5.md` | C / GOV | `665e18ecc35b05f95701eed23f573869477206c2` | `de70da770e169191a5f507b8183af1b26bec71ce` | 28241 / 154 / 42 table lines | B:1–151/151; F:1–154/154 | 001/002 / C1+CD | S |
| `Governing/ULTRA_DEEP_VISION_CENTRIC_ALL_STAGES_CURRENT_STATE_AUDIT_MASTER_PROMPT.md` | C / GOV | `5a44cc555c52c49632e0788ba5d4995559830a3e` | `5a44cc555c52c49632e0788ba5d4995559830a3e` | 31641 / 1313 / 0 table lines | B:1–1313/1313; F:1–1313/1313 | NONE / — | S |
| `Governing/ULTRA_DEEP_VISION_CENTRIC_PRE_DEVELOPMENT_AUDIT_MASTER_PROMPT.md` | H / HIS | `fb7e87ef733d8288097efc47b16003df8b5e7795` | `fb7e87ef733d8288097efc47b16003df8b5e7795` | 801 / 18 / 0 table lines | B:1–18/18; F:1–18/18 | HISTORY / — | H |
| `Governing/ULTRA_DEEP_VISION_CENTRIC_PRE_DEVELOPMENT_AUDIT_MASTER_PROMPT_CLEAN.md` | H / HIS | `1265538305c59133bd620522a2fd63e780490747` | `1265538305c59133bd620522a2fd63e780490747` | 51170 / 1255 / 0 table lines | B:1–1255/1255; F:1–1255/1255 | HISTORY / — | H |

## RawSourceCorpus — 2 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `RawSourceCorpus/Disorganized Data 1.md` | R / RAW | `a9f63a64448a347edd0f2b0c74094284ee953c1b` | `a9f63a64448a347edd0f2b0c74094284ee953c1b` | 30175 / 392 / 50 table lines | B:1–392/392; F:1–392/392 | NONE / — | I |
| `RawSourceCorpus/Disorganized Data 2.md` | R / RAW | `91c461de5e0d171f71d0bb89cd039953a1f1ecfd` | `91c461de5e0d171f71d0bb89cd039953a1f1ecfd` | 114748 / 5047 / 9 table lines | B:1–5047/5047; F:1–5047/5047 | NONE / — | I |

## Registers — 31 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md` | E / EVD | `NEW` | `65b122fa03c571e7b225faf2929cdcb3f14044c1` | 29753 / 238 / 139 table lines | B:NEW; F:1–238/238 | EVIDENCE:001…026 / CD | S |
| `Registers/ALL_STAGES_FILE_COVERAGE_2026-09-13.md` | E / EVD | `NEW` | `SELF_GIT_TREE` | 54587 / 307 / 249 table lines | B:NEW; F:1–307/307 | EVIDENCE:001…026 / CD | S |
| `Registers/ARCHITECTURE_FINAL_AUDIT.md` | E / EVD | `2aace7a48fd22c1d99be1bc327a06adbd6613c0c` | `2aace7a48fd22c1d99be1bc327a06adbd6613c0c` | 2391 / 44 / 0 table lines | B:1–44/44; F:1–44/44 | NONE / — | S |
| `Registers/ARCHITECTURE_NO_LOSS_AUDIT.md` | E / EVD | `1029e31ccb0d2ec56fa9c0faa9ec3babbdff6a23` | `1029e31ccb0d2ec56fa9c0faa9ec3babbdff6a23` | 2282 / 40 / 0 table lines | B:1–40/40; F:1–40/40 | NONE / — | S |
| `Registers/ARCHITECTURE_TRACEABILITY_MATRIX.md` | E / EVD | `4c51576b4af330ba32537f2a58d55301eb30ed0c` | `4c51576b4af330ba32537f2a58d55301eb30ed0c` | 4471 / 35 / 27 table lines | B:1–35/35; F:1–35/35 | NONE / — | S |
| `Registers/D-CHANGELOG.md` | E / EVD | `27436db9ff712e3b484dcff2d0ad18fd6e847aa6` | `c083ba8af326acceb1e0e45a4f1b32c39cc00682` | 13304 / 45 / 41 table lines | B:1–51/51; F:1–45/45 | 002/022 / CD | S |
| `Registers/D-CHECKPOINT.md` | E / EVD | `56f85257588864c6d922fce993b488dd8279dc36` | `5f168c9fa9169d7999a9e998881c251432d93512` | 1590 / 12 / 0 table lines | B:1–32/32; F:1–12/12 | 002 / CD | S |
| `Registers/D-DECISIONS.md` | A / GOV | `75215cb8e2637430ec6ec02643b771a9c9178e3c` | `da98835d6d3c04a4cee50b7efe38730b76382c50` | 23467 / 181 / 47 table lines | B:1–176/176; F:1–181/181 | 002 / CD | S |
| `Registers/D-INDEX.md` | E / EVD | `3a3ae04a795484659c47787f19e8ea2e0a7697a9` | `45534bfd01d84ab0f88910f46fb032e92af41567` | 2008 / 20 / 13 table lines | B:1–28/28; F:1–20/20 | 002 / CD | S |
| `Registers/DD_REQUIREMENT_TRACEABILITY_F5.md` | E / EVD | `498b751b34cecceacd6bacf0be8e94dd2b5b2c9d` | `498b751b34cecceacd6bacf0be8e94dd2b5b2c9d` | 88909 / 340 / 330 table lines | B:1–340/340; F:1–340/340 | NONE / — | S |
| `Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md` | E / EVD | `fe42a4b8ce176883f2a645d3e146058217acfbb0` | `a56c6fe6c498dc874bc7b72e86b41ed7a2d0a067` | 79130 / 403 / 398 table lines | B:1–412/412; F:1–403/403 | 002/025 / CD | S |
| `Registers/F5_END_TO_END_SOURCE_REQUIREMENT_TRACEABILITY.md` | E / EVD | `d005a6a2a30076df7a14a179e1dec5b11aff4b89` | `f7487fa492e53dc3ec7df6d98d62d6f4883f9673` | 551595 / 2980 / 2964 table lines | B:1–2979/2979; F:1–2980/2980 | 002/025 / CD | S |
| `Registers/F5_PARTIAL_REQUIREMENT_CLOSURE.md` | E / EVD | `e4bd5bb9a4540a7040f8304c85f94e4535255d69` | `5e080cee674769ab74aeee72870f31a4a4793b8f` | 50117 / 186 / 181 table lines | B:1–192/192; F:1–186/186 | 002/025 / CD | S |
| `Registers/F5_USER_DIRECTED_REQUIREMENTS.md` | E / EVD | `6a7395483128e22b545a62e9798a2481a95554b6` | `6a7395483128e22b545a62e9798a2481a95554b6` | 49496 / 337 / 330 table lines | B:1–337/337; F:1–337/337 | NONE / — | S |
| `Registers/FINAL_AUDIT_CP-F1-005.md` | H / HIS | `255da801736d4fc84e97e9339400664bd30339fe` | `255da801736d4fc84e97e9339400664bd30339fe` | 5889 / 24 / 8 table lines | B:1–24/24; F:1–24/24 | HISTORY / — | H |
| `Registers/FINAL_PRE_DEVELOPMENT_ADVERSARIAL_AUDIT_2026-09-13.md` | H / HIS | `d808db6cefaaa911f0a24a3cf633a0e2da662a05` | `d808db6cefaaa911f0a24a3cf633a0e2da662a05` | 5647 / 119 / 0 table lines | B:1–119/119; F:1–119/119 | HISTORY / — | H |
| `Registers/ISOLATION_ATTACK_MATRIX.md` | E / EVD | `157b03e8e6499a1a5de2103cb9d8e9aa825d1658` | `161f1b7cabdb38b663c2753b6c12a2f9f08a6ad8` | 10014 / 87 / 50 table lines | B:1–53/53; F:1–87/87 | 002 / CD | S |
| `Registers/MS_COMPLETENESS_MATRIX.md` | E / EVD | `6d0dabada3c10078ca3bfb726f7699a3432d526d` | `6d0dabada3c10078ca3bfb726f7699a3432d526d` | 4308 / 51 / 43 table lines | B:1–51/51; F:1–51/51 | NONE / — | S |
| `Registers/NO_LOSS_AUDIT.md` | E / EVD | `437ce048d5a326d540201c3c6ce1b8835cec998c` | `437ce048d5a326d540201c3c6ce1b8835cec998c` | 2673 / 42 / 0 table lines | B:1–42/42; F:1–42/42 | NONE / — | S |
| `Registers/PHASE1_RAWSOURCE_FOUNDATION_RECONCILIATION_2026-09-12.md` | H / HIS | `853ab4524bf7a7e0913ca328a2b1cbf8d87b4b5a` | `853ab4524bf7a7e0913ca328a2b1cbf8d87b4b5a` | 7972 / 104 / 31 table lines | B:1–104/104; F:1–104/104 | HISTORY / — | H |
| `Registers/PHASE2_ARCHITECTURE_REVALIDATION_2026-09-12.md` | H / HIS | `4659582aa48dd3af3e3ee77bd9cae1f0ad81cd56` | `4659582aa48dd3af3e3ee77bd9cae1f0ad81cd56` | 4077 / 63 / 15 table lines | B:1–63/63; F:1–63/63 | HISTORY / — | H |
| `Registers/PHASE3_DETAILED_DESIGN_REVALIDATION_2026-09-13.md` | H / HIS | `4d3a6efef46cf174e6f1fe3e6338365abdbe09d9` | `4d3a6efef46cf174e6f1fe3e6338365abdbe09d9` | 9455 / 99 / 57 table lines | B:1–99/99; F:1–99/99 | HISTORY / — | H |
| `Registers/PHASE4_CROSS_LAYER_TRACEABILITY_ISOLATION_2026-09-13.md` | H / HIS | `0235443758640e069cbd6069901262cdc389e6b5` | `0235443758640e069cbd6069901262cdc389e6b5` | 4484 / 90 / 11 table lines | B:1–90/90; F:1–90/90 | HISTORY / — | H |
| `Registers/PROJECT_TRUTH_AUDIT_2026-09-10.md` | H / HIS | `d35c8cfb1e018904215e3385a261179b23d00fb7` | `d35c8cfb1e018904215e3385a261179b23d00fb7` | 6677 / 43 / 9 table lines | B:1–43/43; F:1–43/43 | HISTORY / — | H |
| `Registers/REVIEW_REQUIRED.md` | E / EVD | `944a1c9c6c77c2fa680c39c0abeb2088a5c72993` | `5241de597751bbc97c305b02993b9ccd0bcfb645` | 2526 / 40 / 3 table lines | B:1–37/37; F:1–40/40 | 002 / CD | S |
| `Registers/SOURCE_REGISTRY.md` | E / EVD | `3157e8efdffa78141a3f47fac5c801af31b19c45` | `b566005cf3ebb590f624415ca6561d26c0440dec` | 3013 / 34 / 4 table lines | B:1–32/32; F:1–34/34 | 002/025 / CD | S |
| `Registers/TRACEABILITY_EXT_CP-F1-005.md` | H / HIS | `80bbb5f11d299a8981926e5b00aa5edcb27fea78` | `80bbb5f11d299a8981926e5b00aa5edcb27fea78` | 1484 / 11 / 6 table lines | B:1–11/11; F:1–11/11 | HISTORY / — | H |
| `Registers/TRACEABILITY_MATRIX.md` | E / EVD | `db627eb2ab0da3af2b229600df81f9530cc89c2c` | `db627eb2ab0da3af2b229600df81f9530cc89c2c` | 1045 / 18 / 13 table lines | B:1–18/18; F:1–18/18 | NONE / — | S |
| `Registers/TRACEABILITY_MATRIX_REQUIREMENTS.md` | E / EVD | `e64570b35629724b63eebad637bc94726635e545` | `cebd2d4092498c0e3dffe18f8a7151239dcae9b3` | 468621 / 2975 / 2964 table lines | B:1–2973/2973; F:1–2975/2975 | 002/025 / CD | S |
| `Registers/TRACEABILITY_MATRIX_UNIT.md` | E / EVD | `11d9299462f56d25a3797535bc18a5a1cd8ce4d4` | `7483ee50a1d92af0e387d9a843b9de267f857f52` | 58863 / 390 / 376 table lines | B:1–390/390; F:1–390/390 | 002/025 / CD | S |
| `Registers/TRACEABILITY_REQUIREMENTS_REVALIDATION_F5.md` | E / EVD | `1bffc1d802bca7a7e53190e55a92f7f85d2a415c` | `61fc07e158aef852fbbb5ca11cd5d6c75c36b348` | 552701 / 2982 / 2964 table lines | B:1–2980/2980; F:1–2982/2982 | 002/025 / CD | S |

## State — 5 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `State/HANDOFF_NOTE.md` | E / EVD | `68d0b63a1cadcc2057ba731d0272797c18754065` | `12e3d14fb5bf86d9d83894cf10c088138226d5f3` | 1410 / 10 / 0 table lines | B:1–18/18; F:1–10/10 | 002 / CD | S |
| `State/PHASE_SUMMARY.md` | E / EVD | `5d3a3ad882847470a96a61556b2387947140538b` | `58185d777ab515114b78326c8df2f661b15605e0` | 14106 / 184 / 0 table lines | B:1–172/172; F:1–184/184 | 002 / CD | S |
| `State/PRE_DEVELOPMENT_RECOVERY_MANIFEST.json` | H / HIS | `209dd37001db3663d99fa5a9eceba2f7af2dd390` | `209dd37001db3663d99fa5a9eceba2f7af2dd390` | 20731 / 644 / 390 keys | B:1–644/644; F:1–644/644 | HISTORY / — | H |
| `State/PROJECT_MANIFEST.json` | E / EVD | `25eb012d3a53dd3ec32777e841b3bb2978f3dd9a` | `549bbae220ae0a123f3c5cfff52473e4ffb5d07a` | 4430 / 105 / 86 keys | B:1–70/70; F:1–105/105 | 002 / CD | S |
| `State/PROJECT_STATE.md` | E / EVD | `99d8445c022635d3db86aaffe45eaff7421a437b` | `a1f6c08da1658138f7cd3fbcf1f5ae1a1db1153a` | 1814 / 14 / 0 table lines | B:1–22/22; F:1–14/14 | 002 / CD | S |

## database — 60 files

| File | Class / role | Start blob | Current blob | Bytes / lines / records | Full read | Findings / correction | Revalidation |
|---|---|---|---|---|---|---|---|
| `database/README.md` | E / EVD | `9a4b59d0f017e987eb7b743b6ff4582b834a7e8e` | `2f89b4f995c710639fb60283c5cff20522328f9c` | 4138 / 69 / 0 table lines | B:1–64/64; F:1–69/69 | 002 / CD | S |
| `database/migrations/0001_core_bootstrap.sql` | I / DBCORE | `126c6e322bc2b4fefdc3d7c6054a7e2472f87fc2` | `126c6e322bc2b4fefdc3d7c6054a7e2472f87fc2` | 20314 / 528 / 101 SQL leads | B:1–528/528; F:1–528/528 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0002_form_field_parent_rls.sql` | I / DBCORE | `88f101173b131ebf9fe3331bd14537714d7672f7` | `88f101173b131ebf9fe3331bd14537714d7672f7` | 905 / 35 / 7 SQL leads | B:1–35/35; F:1–35/35 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0003_identity_authorization.sql` | I / DBCORE | `29492c9366cb0753bd86515d12b8a99c75045f22` | `29492c9366cb0753bd86515d12b8a99c75045f22` | 12038 / 303 / 51 SQL leads | B:1–303/303; F:1–303/303 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0004_commercial_entitlement.sql` | I / DBCORE | `9410ca5b0114c5bc5052d039ba876a10ce2617f4` | `9410ca5b0114c5bc5052d039ba876a10ce2617f4` | 13844 / 336 / 61 SQL leads | B:1–336/336; F:1–336/336 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0005_security_rls_hardening.sql` | I / DBCORE | `5107129bd74e35484635b777d7dffd7d01d63117` | `5107129bd74e35484635b777d7dffd7d01d63117` | 4468 / 136 / 23 SQL leads | B:1–136/136; F:1–136/136 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0006_document_storage.sql` | I / DBCORE | `1ccc91cc00b7bd16657974c01636ce8ea93f0d0f` | `1ccc91cc00b7bd16657974c01636ce8ea93f0d0f` | 7612 / 204 / 32 SQL leads | B:1–204/204; F:1–204/204 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0007_database_governance.sql` | I / DBCORE | `d242d28acaf0ab5cce645fb2c720ad126a742d09` | `d242d28acaf0ab5cce645fb2c720ad126a742d09` | 4344 / 71 / 6 SQL leads | B:1–71/71; F:1–71/71 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0008_audit_event_outbox_webhook.sql` | I / DBCORE | `b6551c8dbae6efa0f579bfe4a4fb3273e517353e` | `b6551c8dbae6efa0f579bfe4a4fb3273e517353e` | 16842 / 400 / 55 SQL leads | B:1–400/400; F:1–400/400 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0009_database_roles.sql` | I / DBCORE | `5f3f6405d7ffd9e1e7e0d3b64f3c0477b6d487ed` | `5f3f6405d7ffd9e1e7e0d3b64f3c0477b6d487ed` | 4809 / 57 / 35 SQL leads | B:1–57/57; F:1–57/57 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0010_storage_privilege_hardening.sql` | I / DBCORE | `740d7ecebee7a0ceb344754a6d76f1b95b491162` | `740d7ecebee7a0ceb344754a6d76f1b95b491162` | 1027 / 25 / 7 SQL leads | B:1–25/25; F:1–25/25 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0011_ai_catalog_config.sql` | I / DBCORE | `4263ec1f8365033d27ea7d95c1926c74bd37d385` | `4263ec1f8365033d27ea7d95c1926c74bd37d385` | 12576 / 304 / 42 SQL leads | B:1–304/304; F:1–304/304 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0012_ai_rag_memory_usage.sql` | I / DBCORE | `4d43e0adc93b1d40b792c9bd839fb28ab192955b` | `4d43e0adc93b1d40b792c9bd839fb28ab192955b` | 13657 / 335 / 50 SQL leads | B:1–335/335; F:1–335/335 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0013_ai_agents_tools.sql` | I / DBCORE | `43c265d4d91760f877b704f7ca9116c57e4f5cd9` | `43c265d4d91760f877b704f7ca9116c57e4f5cd9` | 7628 / 189 / 30 SQL leads | B:1–189/189; F:1–189/189 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0014_ai_gateway_role.sql` | I / DBCORE | `30d0be3e742998e6d9fba6f27587a3d014bb2177` | `30d0be3e742998e6d9fba6f27587a3d014bb2177` | 2049 / 68 / 16 SQL leads | B:1–68/68; F:1–68/68 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0015_industry_education.sql` | I / DBIND | `fe262c8b853ce699cb08a6d904661dc3c67eb472` | `fe262c8b853ce699cb08a6d904661dc3c67eb472` | 31200 / 714 / 117 SQL leads | B:1–714/714; F:1–714/714 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0016_education_uniqueness_hardening.sql` | I / DBIND | `3e5752419a83d0a9f74cb21a1a5fc2ce2dad1b66` | `3e5752419a83d0a9f74cb21a1a5fc2ce2dad1b66` | 444 / 13 / 2 SQL leads | B:1–13/13; F:1–13/13 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0017_industry_government.sql` | I / DBIND | `7174fb285db88049565d3947d45fec8e2535b409` | `7174fb285db88049565d3947d45fec8e2535b409` | 25414 / 579 / 97 SQL leads | B:1–579/579; F:1–579/579 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0018_industry_hospitality.sql` | I / DBIND | `34e81a555598156d6b41306cc615c95073b6c86b` | `34e81a555598156d6b41306cc615c95073b6c86b` | 25211 / 568 / 98 SQL leads | B:1–568/568; F:1–568/568 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0019_industry_manufacturing.sql` | I / DBIND | `2a4b74e5aa5af34ea33c7c1404823af4f62f30b0` | `2a4b74e5aa5af34ea33c7c1404823af4f62f30b0` | 32330 / 725 / 130 SQL leads | B:1–725/725; F:1–725/725 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0020_industry_retail.sql` | I / DBIND | `6e41baa0845efbc6ddcfa53f82251ccd317d8c31` | `6e41baa0845efbc6ddcfa53f82251ccd317d8c31` | 32083 / 718 / 122 SQL leads | B:1–718/718; F:1–718/718 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0021_industry_professional_services.sql` | I / DBIND | `a504942c6d52b238039f83cdf8763e2f3f84a6e5` | `a504942c6d52b238039f83cdf8763e2f3f84a6e5` | 32533 / 722 / 124 SQL leads | B:1–722/722; F:1–722/722 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0022_industry_ngo_trust.sql` | I / DBIND | `ee9989895250b6e3102de63dc1880eb39ea5a26d` | `ee9989895250b6e3102de63dc1880eb39ea5a26d` | 25630 / 581 / 101 SQL leads | B:1–581/581; F:1–581/581 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0023_industry_security_facility.sql` | I / DBIND | `7b4b184068d1ab9f66439f422a1baa4ebdcf7f44` | `7b4b184068d1ab9f66439f422a1baa4ebdcf7f44` | 25764 / 580 / 106 SQL leads | B:1–580/580; F:1–580/580 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0024_industry_healthcare.sql` | I / DBIND | `5644beb9cda049b1a2caa51db06f4b7ad8c7925f` | `5644beb9cda049b1a2caa51db06f4b7ad8c7925f` | 58790 / 1046 / 208 SQL leads | B:1–1046/1046; F:1–1046/1046 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0025_integration_registry.sql` | I / DBCORE | `191c6641d932b2ebe19c4216062120cad866800d` | `191c6641d932b2ebe19c4216062120cad866800d` | 8536 / 209 / 30 SQL leads | B:1–209/209; F:1–209/209 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0026_workflow_notification.sql` | I / DBCORE | `68ab6753773249cb4e7a2e5b1ead996b82119221` | `68ab6753773249cb4e7a2e5b1ead996b82119221` | 19175 / 400 / 63 SQL leads | B:1–400/400; F:1–400/400 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0027_workflow_notification_roles.sql` | I / DBCORE | `67ee2d2be2da5ddeff7c3ffdba780c70d6fe9dab` | `67ee2d2be2da5ddeff7c3ffdba780c70d6fe9dab` | 2445 / 33 / 20 SQL leads | B:1–33/33; F:1–33/33 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0028_document_integration_roles.sql` | I / DBCORE | `de60135c6b70b44f6d275532410d903421b5f03f` | `de60135c6b70b44f6d275532410d903421b5f03f` | 2792 / 67 / 18 SQL leads | B:1–67/67; F:1–67/67 | CHAIN:003…021/026 / C1…C5 | R |
| `database/migrations/0029_scope_privilege_identity_hardening.sql` | I / DBCORE | `NEW` | `e53a441994f49e2b66216d3c887df0befb2bce5b` | 14645 / 294 / 70 SQL leads | B:NEW; F:1–294/294 | 003…005/017/024 / C1+C3 | R |
| `database/migrations/0030_cross_scope_reference_integrity.sql` | I / DBCORE | `NEW` | `a6c594c7973760d6e77fa9b290b6e7dd4c799b1b` | 42740 / 883 / 137 SQL leads | B:NEW; F:1–883/883 | 006…012/020 / C1 | R |
| `database/migrations/0031_document_workflow_ai_integrity.sql` | I / DBCORE | `NEW` | `97617bed6f645df051b408aef0d1f9081387a5e8` | 76486 / 1409 / 271 SQL leads | B:NEW; F:1–1409/1409 | 007/013…019/021/024 / C1+C2 | R |
| `database/migrations/0032_platform_definition_write_boundary.sql` | I / DBCORE | `NEW` | `b5780fd30ea18a5f3520b48f67b8390d1318f021` | 3106 / 43 / 7 SQL leads | B:NEW; F:1–43/43 | 026 / C5 | R |
| `database/scripts/apply-and-verify.sh` | I / RUN | `a43374b6ebef48ca5afd82867b7e324838ea11f9` | `a6ca5af96a799323d98594dbfe63d0fd62b0925a` | 1229 / 39 / 28 code lines | B:1–27/27; F:1–39/39 | 023 / C3 | R |
| `database/verification/0001_core_bootstrap.verify.sql` | T / DBCORE | `a831c1c675546c040b6da693bc8b7ac4744a7bf7` | `f2595c8e3b0a3806eef1fc17af944cb9b8989995` | 3732 / 131 / 22 SQL leads | B:1–131/131; F:1–131/131 | 002 / CD | R |
| `database/verification/0002_form_field_parent_rls.verify.sql` | T / DBCORE | `9084dfa52dd3d541c9e2e2bc930300e216e9aafe` | `9084dfa52dd3d541c9e2e2bc930300e216e9aafe` | 903 / 30 / 4 SQL leads | B:1–30/30; F:1–30/30 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0003_0005_identity_commercial.verify.sql` | T / DBCORE | `566853de7b764f46fb2dacf12458d4bc37119c6e` | `566853de7b764f46fb2dacf12458d4bc37119c6e` | 4012 / 131 / 20 SQL leads | B:1–131/131; F:1–131/131 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0006_document_storage.verify.sql` | T / DBCORE | `b14754dbbd83a89146a3f4f46050366dcb49361c` | `b14754dbbd83a89146a3f4f46050366dcb49361c` | 2405 / 95 / 14 SQL leads | B:1–95/95; F:1–95/95 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0007_database_governance.verify.sql` | T / DBCORE | `484507869ca7bfebe3e8f2fa5887fc87c105fd58` | `484507869ca7bfebe3e8f2fa5887fc87c105fd58` | 1286 / 43 / 7 SQL leads | B:1–43/43; F:1–43/43 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0008_audit_event_outbox_webhook.verify.sql` | T / DBCORE | `e64e602722abe47444881ca252ae327b367ac495` | `e64e602722abe47444881ca252ae327b367ac495` | 3498 / 121 / 19 SQL leads | B:1–121/121; F:1–121/121 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0009_database_roles.verify.sql` | T / DBCORE | `ecf6b7616237165300c6396e5a533789ed4d30fa` | `ecf6b7616237165300c6396e5a533789ed4d30fa` | 1113 / 39 / 8 SQL leads | B:1–39/39; F:1–39/39 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0010_storage_privilege_hardening.verify.sql` | T / DBCORE | `239c7b458bea8666fa283ab2cefee7c4dfb9c79e` | `239c7b458bea8666fa283ab2cefee7c4dfb9c79e` | 994 / 25 / 4 SQL leads | B:1–25/25; F:1–25/25 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0011_0014_ai.verify.sql` | T / DBCORE | `a944311cd4abdc77a5e5cb92b758c5d978baa005` | `a944311cd4abdc77a5e5cb92b758c5d978baa005` | 2766 / 113 / 18 SQL leads | B:1–113/113; F:1–113/113 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0015_0016_education.verify.sql` | T / DBIND | `4e0d117bd7d2132d4f0eaaf55682764b376063de` | `4e0d117bd7d2132d4f0eaaf55682764b376063de` | 2799 / 79 / 13 SQL leads | B:1–79/79; F:1–79/79 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0017_government.verify.sql` | T / DBIND | `daf9df92d119fdbd8c2939735fdb536ec7ad0da1` | `daf9df92d119fdbd8c2939735fdb536ec7ad0da1` | 2546 / 78 / 13 SQL leads | B:1–78/78; F:1–78/78 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0018_hospitality.verify.sql` | T / DBIND | `de3fd8286b8c228ea233767433507667dacfd88f` | `de3fd8286b8c228ea233767433507667dacfd88f` | 2953 / 90 / 14 SQL leads | B:1–90/90; F:1–90/90 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0019_manufacturing.verify.sql` | T / DBIND | `3884c2a527a4ea9488c6eabadeb99a38ac8e7ccb` | `3884c2a527a4ea9488c6eabadeb99a38ac8e7ccb` | 2984 / 87 / 14 SQL leads | B:1–87/87; F:1–87/87 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0020_retail.verify.sql` | T / DBIND | `e6c26f9945cf19a53aed81da4940164b3e7a728c` | `e6c26f9945cf19a53aed81da4940164b3e7a728c` | 3047 / 87 / 14 SQL leads | B:1–87/87; F:1–87/87 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0021_professional_services.verify.sql` | T / DBIND | `79c1ebcfb116a4b83cb4b7e66671eba1206d76e7` | `79c1ebcfb116a4b83cb4b7e66671eba1206d76e7` | 3252 / 92 / 14 SQL leads | B:1–92/92; F:1–92/92 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0022_ngo_trust.verify.sql` | T / DBIND | `5483c710c16b271f94123d8e70f8ab8f28397a66` | `5483c710c16b271f94123d8e70f8ab8f28397a66` | 3108 / 95 / 14 SQL leads | B:1–95/95; F:1–95/95 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0023_security_facility.verify.sql` | T / DBIND | `1349351e029d539b39f320a2f7033fde70f91dda` | `1349351e029d539b39f320a2f7033fde70f91dda` | 2954 / 91 / 14 SQL leads | B:1–91/91; F:1–91/91 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0024_healthcare.verify.sql` | T / DBIND | `f8ad6bc3ffa34bda1e74f427de9fc1c047c54eea` | `f8ad6bc3ffa34bda1e74f427de9fc1c047c54eea` | 4762 / 107 / 16 SQL leads | B:1–107/107; F:1–107/107 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0025_integration_registry.verify.sql` | T / DBCORE | `86484402163313c6f3bd55599c53f907ba675079` | `86484402163313c6f3bd55599c53f907ba675079` | 1531 / 47 / 11 SQL leads | B:1–47/47; F:1–47/47 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0026_0027_workflow_notification.verify.sql` | T / DBCORE | `c3c972ffb9fdc115c25d99748665ad883d3d609b` | `c3c972ffb9fdc115c25d99748665ad883d3d609b` | 3027 / 73 / 14 SQL leads | B:1–73/73; F:1–73/73 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0028_document_integration_roles.verify.sql` | T / DBCORE | `9552fd3c17e819bdd3ed7d6811ae860eba3f70c2` | `9552fd3c17e819bdd3ed7d6811ae860eba3f70c2` | 1631 / 42 / 10 SQL leads | B:1–42/42; F:1–42/42 | CHAIN:003…021/026 / C1…C5 | R |
| `database/verification/0029_scope_privilege_identity_hardening.verify.sql` | T / DBCORE | `NEW` | `e17d4ed3727d94aad46f92f96eed595662dd5872` | 9145 / 188 / 43 SQL leads | B:NEW; F:1–188/188 | 003…005/017/024 / C1+C3 | R |
| `database/verification/0030_cross_scope_reference_integrity.verify.sql` | T / DBCORE | `NEW` | `b4f3ab130589c8ace22fc743c50a9fcd41373bf8` | 18852 / 347 / 76 SQL leads | B:NEW; F:1–347/347 | 006…012/020 / C1 | R |
| `database/verification/0031_document_workflow_ai_integrity.verify.sql` | T / DBCORE | `NEW` | `6cb001c11128da4a5649eda6eefa129d02c045e3` | 28912 / 489 / 98 SQL leads | B:NEW; F:1–489/489 | 007/013…019/021/024 / C1+C2+C4 | R |
| `database/verification/0032_platform_definition_write_boundary.verify.sql` | T / DBCORE | `NEW` | `0652a6fdc98dae3695bae7a3e547bc043670c026` | 4087 / 73 / 27 SQL leads | B:NEW; F:1–73/73 | 026 / C5 | R |
| `database/verification/0099_all_industries.verify.sql` | T / DBALL | `c5403d79d3f0dee5a92db89a237ea02fe9d2da38` | `c5403d79d3f0dee5a92db89a237ea02fe9d2da38` | 5915 / 191 / 27 SQL leads | B:1–191/191; F:1–191/191 | NONE / — | R |
