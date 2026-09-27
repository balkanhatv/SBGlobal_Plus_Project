# Source fidelity reconciliation — 2026-09-27

**Status: source-fidelity correction HEAD exact-HEAD verified; final Architecture citation/state synchronization awaiting its own exact-HEAD gate. Full vision audit IN PROGRESS; forward development remains held.**

Continuation baseline: `0258d787c17ccdfb5c3c7782702907400b96a57d`, tree `522d8e152e060ab7181b25eaccbcf94498482d7d`. Branch `docs/architecture-branch-2`; PR #2 remains draft/unmerged. DD-208 remains the latest governed checkpoint; no DD-209 is opened.

## Root causes and targeted corrections

| Finding | Severity | Evidence / cause | Correction |
|---|---|---|---|
| VC27-01 | P2 | Same-named headings in different embedded source documents contaminated child extraction. The two ledgers agreed with each other, including 34 extraction placeholders, so REPO-002 passed despite false source attribution. | Restore 85 texts directly from their own immutable source lists (34 placeholders + 51 wrong-section/ordinal texts); preserve all 2,962 IDs; explicitly locate 21 surplus legacy IDs as provenance aliases. Strengthen existing REPO-002 to compare all rows against their actual source parent. |
| VC27-02 | P2 | Blanket UD-TECH-01 supersession marked the reference-use/no-copy governance section obsolete and routed AI-development instructions into product AI owners. | Route S2.1-U032 to Governing MI §22. Ten substantive/reference-use rows remain active; its table header is provenance. Stack replacement does not repeal code-origin restrictions. |
| VC27-03 | P2 | September 13 dependency projections called current execution Database-only and services/tests not started, although DD-208 Core, PostgreSQL and bounded Web evidence exists. Provider placeholders also conflated required provider names with external credentials. | Route execution truth to the live manifest/evidence; retain per-requirement completion as unasserted. Restore 13 source provider names as active capability requirements; credentials/endpoints/models remain external configuration inputs. |
| VC27-04 | P2 | F-14 and A-04/A-07 retained obsolete guard-stage ordinals; A-01 grouped snapshot resolution before credential validation despite the canonical A-03/A-04 sequence. A-03 validation responsibilities could be misread as an alternative pipeline. | Remove brittle ordinals; align A-01 snapshot placement with A-03 §3/A-04 §5 and clarify that validation responsibilities do not bypass access guards. No runtime change. |
| VC27-05 | P2 | A-08 retained billing-only/blanket-block suspension UI language after F-14/A-04 had restored governed read-only business-data and recovery paths. | Align the shell with the current server-authorized restricted operation contracts; preserve DD-04 §11 generic-deny boundary and paused writes/integrations/API. No new endpoint or permission. |

RawSource is unchanged. No Industry, MS, table, API, provider implementation or product requirement is added. Existing tests are retained and strengthened. The new source locator inventory is evidence plumbing, not runtime functionality or full no-loss certification.

## Source review and semantic conclusions

Both source documents have now been read through their complete text (S1 392 lines; S2 5,047 lines), including all nine embedded S2 documents. Complete reading is not complete source-to-owner certification. [SOURCE_SPAN_COVERAGE_2026-09-27.json](SOURCE_SPAN_COVERAGE_2026-09-27.json) locates all 372 heading units and exposes glyph bullets omitted by the historical child enumerator. Prose and those bullets remain material even when a parent has zero child IDs.

| Reviewed relationship | Actual owner / conclusion |
|---|---|
| S1 Industry/MS list and S2 Healthcare primacy | F-01 §1, F-07/08/09, F-12/13 and CR-05 preserve nine equal Industries and 41 MS, including source-named PSV studio management. S2 flagship wording is superseded; healthcare detail is retained within HLT. No equal-table-count requirement is inferred. |
| S2.1 historical stack vs active stack | D-DECISIONS UD-TECH-01 / MI §22 / F-01 §8 govern. This supersession is specific to technology choices; business, governance and security obligations survive. |
| S2.5 Scope and S2.2 §30 | F-06 §4 and DD-26 retain two logical tenant apps with dynamic roles. Platform mobile is separate. Future Enterprise Apps is not permission to add a third tenant binary. |
| S2.6 provider list and AI scope | F-05 §2 and A-07 §3 own provider abstraction and the 13 source-named providers. Registry availability is not operational provider integration or tenant authorization. DD-208 remains a necessary allowlist floor, not AI runtime completion. |
| S2.5 Authentication/Security/Observability | F-03/F-06, A-03/A-08/A-11 own human identity, device security and telemetry. Source JWT/Refresh Token text is retained as source; Clerk governs the active first-party session boundary. Biometric/device/MFA/root detection obligations are not removed by stack supersession. |
| S2.8 design scale, notifications, accessibility | F-06 §6 / A-08 own the shared experience layer. UI radius tokens differ legitimately from S2.7 product semantic defaults. Keyboard navigation, ARIA and focus ring are source obligations; mobile dark-mode/offline bullets cannot replace them. |
| S1 commercial/security/residency intent and S2 commercial rules | F-01/02/03/11/14 preserve governed entitlements, no deletion on expiry, source security programs and Regional Data Home. Source claims of readiness and certification remain goals, not proof of deployed compliance. |
| Industry-specific WHAT/WHY/WHO | F-07/08/09/12/13 contain distinct workflow/rule owners across all nine suites. This review does not yet reconcile every requirement to every DD contract, table, test or UI. |

## Stable IDs and explicit provenance aliases

The inventory still has **2,962 stable IDs**. It is not valid to describe the number alone as 2,962 distinct atomic obligations: structural aliases and duplicate provenance already existed. Twenty-one additional legacy IDs resulted from a longer list in the wrong same-named source section. Their original text remains, but their actual source parent and current DUPLICATE_PROVENANCE disposition are now explicit. The first real list entries at each affected parent are restored; surplus IDs are retained for historical continuity rather than given invented requirements. Historical pre-correction values remain in Git.

| Legacy IDs | Actual source parent | Why retained |
|---|---|---|
| S2.5-U176-R005–R009 | S2.4-U160 (Database Scope) | Five surplus rows copied from the nine-item Database scope; Mobile scope has four items. |
| S2.7-U256-R003–R017 | S2.2-U056 (production content: Tenant Web Portal) | Fifteen surplus rows copied from the 17-item production-content list; the Defaults parent has two items. |
| S2.8-U318-R006 | S2.5-U200 (Mobile Accessibility) | Surplus Offline Support row; UI Design System Accessibility has five items. |

## Exact source-text repairs

Every row below is a correction to an existing ID, with an exact immutable S2 source-line locator. It is not a new requirement. Source spelling and symbols are retained.

| ID | S2 line | Restored text |
|---|---:|---|
| S2.4-U167-R001 | 3169 | Indexes |
| S2.4-U167-R002 | 3170 | Composite Indexes |
| S2.4-U167-R003 | 3171 | Query Optimization |
| S2.4-U167-R004 | 3172 | Pagination |
| S2.4-U167-R005 | 3173 | Caching |
| S2.4-U167-R006 | 3174 | Lazy Loading |
| S2.4-U167-R007 | 3175 | Eager Loading |
| S2.4-U167-R008 | 3176 | Table Partitioning Ready |
| S2.4-U167-R009 | 3177 | Read Replica Ready |
| S2.5-U176-R001 | 3258 | 🆕 Tenant Staff App |
| S2.5-U176-R002 | 3259 | 🆕 Tenant User/Customer App |
| S2.5-U176-R003 | 3260 | 🆕 Super Admin App |
| S2.5-U176-R004 | 3261 | Future Enterprise Apps |
| S2.5-U180-R001 | 3279 | Clean Architecture |
| S2.5-U180-R002 | 3280 | Feature Based Architecture |
| S2.5-U180-R003 | 3281 | Repository Pattern |
| S2.5-U180-R004 | 3282 | Service Layer |
| S2.5-U180-R005 | 3283 | Dependency Injection |
| S2.5-U180-R006 | 3284 | MVVM Compatible |
| S2.5-U180-R007 | 3285 | Offline First |
| S2.5-U180-R008 | 3286 | API First |
| S2.5-U180-R009 | 3287 | Multi Tenant |
| S2.5-U188-R001 | 3343 | OTP Login |
| S2.5-U188-R002 | 3344 | JWT |
| S2.5-U188-R003 | 3345 | Refresh Token |
| S2.5-U188-R004 | 3346 | Biometric Login |
| S2.5-U188-R005 | 3347 | Fingerprint |
| S2.5-U188-R006 | 3348 | Face ID |
| S2.5-U188-R007 | 3349 | Device Binding |
| S2.5-U188-R008 | 3350 | Session Management |
| S2.5-U188-R009 | 3351 | Multi-Factor Authentication (MFA) Support |
| S2.5-U188-R010 | 3352 | 🆕 Enterprise SSO / OAuth 2.0 / OIDC (Tenant Staff App) |
| S2.5-U189-R002 | 3357 | Encrypted Storage |
| S2.5-U189-R003 | 3358 | SSL Pinning |
| S2.5-U189-R004 | 3359 | Certificate Validation |
| S2.5-U189-R005 | 3360 | API Encryption |
| S2.5-U189-R006 | 3361 | Token Expiry |
| S2.5-U189-R007 | 3362 | Logout All Devices |
| S2.5-U189-R008 | 3363 | Root/Jailbreak Detection |
| S2.5-U198-R001 | 3459 | Lazy Loading |
| S2.5-U198-R002 | 3460 | Image Compression |
| S2.5-U198-R003 | 3461 | Background Processing |
| S2.5-U198-R004 | 3462 | Pagination |
| S2.5-U198-R005 | 3463 | Infinite Scroll |
| S2.5-U198-R006 | 3464 | Code Splitting |
| S2.5-U199-R001 | 3468 | Crash Reporting |
| S2.5-U199-R002 | 3469 | Performance Monitoring |
| S2.5-U199-R003 | 3470 | Analytics Events |
| S2.6-U209-R002 | 3552 | Super Admin Portal |
| S2.6-U209-R007 | 3557 | Mobile Apps |
| S2.6-U209-R008 | 3558 | APIs |
| S2.6-U209-R009 | 3559 | Reports |
| S2.6-U209-R010 | 3560 | Analytics |
| S2.6-U210-R001 | 3566 | OpenAI |
| S2.6-U210-R002 | 3567 | Anthropic Claude |
| S2.6-U210-R003 | 3568 | Google Gemini |
| S2.6-U210-R004 | 3569 | Amazon Bedrock |
| S2.6-U210-R005 | 3570 | Microsoft Azure OpenAI |
| S2.6-U210-R006 | 3571 | OpenRouter |
| S2.6-U210-R007 | 3572 | Ollama (Self Hosted) |
| S2.6-U210-R008 | 3573 | LM Studio |
| S2.6-U210-R009 | 3574 | Hugging Face Inference |
| S2.6-U210-R010 | 3575 | AWS SageMaker |
| S2.6-U210-R011 | 3576 | Grok |
| S2.6-U210-R012 | 3577 | DeepSeek |
| S2.6-U210-R013 | 3578 | Custom Enterprise LLM |
| S2.7-U256-R001 | 4179 | Reports |
| S2.7-U256-R002 | 4180 | Notifications |
| S2.8-U276-R001 | 4489 | Small: 6px |
| S2.8-U276-R002 | 4490 | Medium: 8px |
| S2.8-U276-R003 | 4491 | Large: 12px |
| S2.8-U276-R004 | 4492 | XL: 16px |
| S2.8-U276-R005 | 4493 | Round: 999px |
| S2.8-U310-R001 | 4782 | Bell |
| S2.8-U310-R002 | 4783 | Popup |
| S2.8-U310-R003 | 4784 | Toast |
| S2.8-U310-R004 | 4785 | Email |
| S2.8-U310-R005 | 4786 | SMS |
| S2.8-U310-R006 | 4787 | WhatsApp |
| S2.8-U310-R007 | 4788 | Push |
| S2.8-U318-R001 | 4852 | Keyboard Navigation |
| S2.8-U318-R002 | 4853 | High Contrast |
| S2.8-U318-R003 | 4854 | ARIA Labels |
| S2.8-U318-R004 | 4855 | Focus Ring |
| S2.8-U318-R005 | 4856 | Screen Reader Support |

## Verification and remaining gate

The strengthened REPO-002 first failed on the unchanged ledger at S2.4-U167-R001: Database Performance incorrectly said Fast page loading instead of Indexes. The original cross-ledger equality assertion remains; an independent source-parent assertion now covers all 2,962 rows. It proves text provenance, not owner sufficiency, atomic completeness or implementation.

Correction HEAD `ea371dd1cf11666293b669acc80ab29d3e91ae9f`, tree `327e3aa93088d3eec09a0150b89b29325953ee98`, passed all four hosted jobs. Each downloaded log asserts that exact HEAD/tree:

| Gate | Run | Job | Result |
|---|---:|---:|---|
| Core/server | 36289471768 | 108536650020 | 700/700; zero failed/skipped |
| PostgreSQL + full database bootstrap | 36289471768 | 108536649884 | 505/505; zero failed/skipped |
| Database | 36289471770 | 108536649880 | all 48 migrations / 42 verification files PASS |
| Web | 36289471801 | 108536650155 | PASS |

Local build + Core/server also passed 700/700. REPO-001–008 pass. All four requirement/projection ID sets are unchanged, every subset text/disposition/owner matches its master route, and zero extraction placeholders remain. The immutable-source comparison covers all 2,962 inventory rows, including explicitly located aliases. No local PostgreSQL result is claimed.

The final synchronization additionally completes VC27-04 Architecture citation/order alignment and VC27-05 suspension-shell consistency. Its own exact-HEAD four-job gate is required; the above parent gate does not by itself certify those final document edits. The final closure SHA and its observed CI are recorded in PR #2 to avoid a self-referential commit hash in its own manifest.

A-00/A-01/A-03/A-04/A-06/A-08/A-09 were additionally reviewed against the canonical context/commercial/surface owners; A-07 guard references were reconciled. Full semantic review of the remaining Architecture/ADR, DD, implementation, SQL/RLS, tests and historical state/register chain remains unfinished. Do not continue feature development merely because these targeted corrections pass.
