# DD-10 — EXPERIENCE / APPLICATION DETAILED DESIGN
**Wave:** 2 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-01 §3 · F-06 · A-08 · ADR-011 · DD-02/DD-03/DD-04/DD-06/DD-08

## 1. Canonical four-surface ownership
| Surface | Responsibility | Must not own |
|---|---|---|
| Public SaaS Website | public marketing/content/trust/legal/signup/demo/quote | tenant operations, platform administration |
| Platform Application | Platform Owner/Super Admin/authorized staff operations | tenant industry business workflows |
| Tenant Management Application | tenant administration/configuration/commercial/security | operational industry transactions |
| Reusable Industry Experiences | tenant-bound industry-domain operations | separate identity/backend/platform admin |

All authenticated surfaces use DD-02 RequestContext, DD-03 access decision, DD-04 entitlements, DD-06 OperationContracts and DD-08 document access. UI visibility is advisory only.

## 2. Screen contract standard
Every authenticated screen is specified by: Screen ID · Surface · Route · Purpose · Users · scopeClass · permission · entitlement · Industry Context requirement · query operations · commands · form/validation where applicable · empty/loading/error/restricted states · audit behavior · responsive behavior · accessibility.

Public pages use equivalent content fields: Page ID · route · content owner · Payload CMS ownership · public/private · CTA · auth transition · localization · SEO/metadata · accessibility · responsive behavior · analytics event family.

## 3. Public SaaS Website inventory
All public content is Payload CMS 3-managed unless marked application-generated. Final copy/assets are not part of DD.

| ID | Route | Capability / content owner | CMS | CTA / auth transition | Localization / SEO / metadata | A11y / responsive | Analytics |
|---|---|---|---|---|---|---|---|
| PUB-001 | `/` | Home · Marketing | Yes | Start Free, Demo, Quote → signup/forms | locale canonical/hreflang, OG, structured organization/software | WCAG AA, mobile-first | view_home, cta_click |
| PUB-002 | `/platform` | Platform overview · Product | Yes | Explore/Start Free | product schema/OG | AA/responsive diagrams | view_platform |
| PUB-003 | `/features` | Core features · Product | Yes | compare/plan | SEO feature taxonomy | AA/cards reflow | feature_view |
| PUB-004 | `/solutions` | solution catalog · Product | Yes | solution detail/demo | localized slugs/meta | AA | solution_view |
| PUB-005 | `/industries` | nine equal industries · Product | Yes | industry detail | no default Healthcare priority | AA/grid | industry_catalog_view |
| PUB-006 | `/industries/[slug]` | industry overview | Yes | plan/demo | per-industry SEO | AA | industry_view |
| PUB-007 | `/pricing` | plan comparison · Commercial | CMS + commercial projection | choose plan | price/meta rules | AA/table alternative | pricing_view |
| PUB-008 | `/trials` | trial explanation | Yes | start eligible trial → signup | SEO | AA | trial_view |
| PUB-009 | `/plans/[code]` | plan detail | CMS + commercial projection | select route | plan structured data | AA | plan_view |
| PUB-010 | `/signup` | self-serve onboarding entry | App form | authenticate/create identity | noindex sensitive steps | form AA | signup_start/complete |
| PUB-011 | `/demo` | demo request | CMS + form | submit lead | localized metadata | form AA | demo_submit |
| PUB-012 | `/quote` | quote request | CMS + form | submit lead | localized metadata | form AA | quote_submit |
| PUB-013 | `/company` | company story/about | Yes | contact/careers | organization metadata | AA | company_view |
| PUB-014 | `/team` | team | Yes | contact/careers | Person metadata where approved | AA | team_view |
| PUB-015 | `/careers` | careers | Yes | vacancy/application external or governed form | JobPosting when applicable | AA | careers_view |
| PUB-016 | `/contact` | contact | Yes + form | submit | LocalBusiness/Contact metadata as applicable | form AA | contact_submit |
| PUB-017 | `/faq` | FAQ | Yes | help/contact | FAQ structured data | AA accordion keyboard | faq_view |
| PUB-018 | `/testimonials` | testimonials | Yes | case studies | approved attribution metadata | AA | testimonial_view |
| PUB-019 | `/reviews` | customer reviews | Yes | plans/contact | no fabricated ratings | AA | review_view |
| PUB-020 | `/success-stories` | success stories | Yes | case study/demo | Article metadata | AA | success_story_view |
| PUB-021 | `/case-studies/[slug]` | case study | Yes | demo/contact | Article/OG | AA | case_study_view |
| PUB-022 | `/blog` | blog index | Yes | subscribe | Collection metadata | AA | blog_view |
| PUB-023 | `/blog/[slug]` | blog article | Yes | subscribe/related | Article schema | AA | article_view |
| PUB-024 | `/articles` | knowledge articles | Yes | docs/help | Article metadata | AA | articles_view |
| PUB-025 | `/knowledge-base` | public KB | Yes | search/help | searchable metadata | AA | kb_search/view |
| PUB-026 | `/docs` | public documentation hub | Yes | API/docs links | TechArticle metadata where useful | AA | docs_view |
| PUB-027 | `/downloads` | approved downloads | Yes + DocumentMeta public projection | download | file metadata/checksum where public | AA | download_start |
| PUB-028 | `/help` | help center | Yes | KB/contact/status | SEO | AA | help_view |
| PUB-029 | `/trust` | trust center | Yes + system projections | security/status/legal | trust metadata | AA | trust_view |
| PUB-030 | `/status` | status/uptime | service projection | incident detail | noindex optional | AA | status_view |
| PUB-031 | `/legal/privacy` | privacy | Yes | none/contact | version/effective date metadata | AA | legal_view |
| PUB-032 | `/legal/terms` | terms | Yes | none | version/effective date | AA | legal_view |
| PUB-033 | `/legal/cookies` | cookie policy | Yes | consent settings | version metadata | AA | legal_view |
| PUB-034 | `/legal/refund` | refund policy | Yes | billing/contact | version metadata | AA | legal_view |
| PUB-035 | `/legal/sla` | SLA public terms | Yes | enterprise quote | version metadata | AA | legal_view |
| PUB-036 | `/legal/dpa` | DPA | Yes | enterprise/contact | version metadata | AA | legal_view |
| PUB-037 | `/media` | media/image gallery | Yes | related content | image alt/licensing metadata | AA responsive media | media_view |
| PUB-038 | `/videos` | video gallery | Yes | related content | VideoObject where applicable | captions/transcripts | video_view |
| PUB-039 | `/events` | events | Yes | register | Event metadata | AA | event_view/register |
| PUB-040 | `/newsletter` | newsletter | Yes + form | subscribe | consent metadata | form AA | newsletter_submit |
| PUB-041 | `/forms/[slug]` | governed public forms | Yes + form schema | submit | noindex depending sensitivity | form AA | form_submit |
| PUB-042 | `/lp/[slug]` | landing pages | Yes | campaign-specific | canonical/OG policy | AA | landing_view/cta |
| PUB-043 | CMS preview/admin boundary | content workflow | Payload admin, not public app | authenticated CMS | noindex | admin AA | editorial audit |

Public form submissions create server-side OperationContracts; spam/rate/consent controls apply. Analytics identifiers must not leak sensitive form fields.

## 4. Platform Application route hierarchy
Base: `/platform`; scope primarily PLATFORM_GLOBAL. Tenant-targeted support/elevation views switch to explicit governed tenant/context target and never become implicit wildcard access.

| Screen ID | Route | Purpose / users | Scope | Permission | Core operations | Audit |
|---|---|---|---|---|---|---|
| PLT-001 | /platform | executive/ops dashboard | PLATFORM_GLOBAL | core.platform.dashboard.view | platform projections | view only |
| PLT-002 | /platform/tenants | tenant directory/admin | PLATFORM_GLOBAL | core.tenancy.tenant.view/manage | tenant list/create/status | mutations audited |
| PLT-003 | /platform/catalog/plans | plan/version catalog | PLATFORM_GLOBAL | core.commercial.plan.manage | plan/version publish/retire | all changes |
| PLT-004 | /platform/catalog/industries | industry catalog | PLATFORM_GLOBAL | core.catalog.industry.manage | catalog activation definitions | changes |
| PLT-005 | /platform/catalog/modules | MS/module catalog | PLATFORM_GLOBAL | core.catalog.module.manage | module metadata | changes |
| PLT-006 | /platform/commercial/policies | route/commercial policy | PLATFORM_GLOBAL | core.commercial.policy.manage | policy versioning | mandatory |
| PLT-007 | /platform/features | feature flags | PLATFORM_GLOBAL | core.config.feature.manage | flag/version | mandatory |
| PLT-008 | /platform/operators | platform principals/roles | PLATFORM_GLOBAL | core.identity.operator.manage | operator/role admin | mandatory |
| PLT-009 | /platform/support | support cases/elevation | PLATFORM_GLOBAL→explicit target | core.support.elevation.request/use | elevation lifecycle | mandatory high-risk |
| PLT-010 | /platform/ai/providers | AI provider/model registry | PLATFORM_GLOBAL | core.ai.provider.manage | DD-09 operations | mandatory |
| PLT-011 | /platform/integrations | integration definitions/adapters | PLATFORM_GLOBAL | core.integration.registry.manage | integration registry | mandatory |
| PLT-012 | /platform/security | security/compliance posture | PLATFORM_GLOBAL | core.security.posture.view/manage | DD-16 policies | mandatory |
| PLT-013 | /platform/audit | platform audit explorer | PLATFORM_GLOBAL | core.audit.platform.view | filtered audit queries | access audited |
| PLT-014 | /platform/operations | deployment/health visibility | PLATFORM_GLOBAL | core.operations.view | read-only DD-14/DD-15 projections | access recorded where sensitive |

All screens define loading skeleton, no-data guidance, safe error state, restricted/step-up state, keyboard navigation, focus management, screen-reader labels, responsive table/card alternatives.

## 5. Tenant Management Application
Base `/manage`; default scope TENANT_CORE. Industry Context is required only when configuring an industry-owned activation/configuration and is explicitly selected.

| ID | Route | Purpose | Permission / entitlement | Scope | Operations |
|---|---|---|---|---|---|
| TEN-001 | /manage | tenant admin dashboard | core.tenancy.dashboard.view | TENANT_CORE | admin projections |
| TEN-002 | /manage/profile | tenant profile | core.tenancy.profile.manage | TENANT_CORE | profile/config |
| TEN-003 | /manage/org | branches/departments/locations | core.tenancy.org.manage | TENANT_CORE | org CRUD/workflows |
| TEN-004 | /manage/industries | primary/enabled industries | core.tenancy.industry.manage + license | TENANT_CORE/TENANT_INDUSTRY selector | activate/configure |
| TEN-005 | /manage/subscription | subscription/plan | core.commercial.subscription.view/change | TENANT_CORE | DD-04 operations |
| TEN-006 | /manage/licenses | licenses | core.commercial.license.manage | TENANT_CORE | assignment/status |
| TEN-007 | /manage/addons | add-ons | core.commercial.addon.manage | TENANT_CORE | purchase/activate |
| TEN-008 | /manage/usage | usage meters | core.commercial.usage.view | TENANT_CORE | queries |
| TEN-009 | /manage/systems | MS activations | core.tenancy.ms.manage + entitlement | TENANT_INDUSTRY | activation/config |
| TEN-010 | /manage/modules | modules/features | core.tenancy.module.manage | TENANT_INDUSTRY where industry-owned | config |
| TEN-011 | /manage/users | memberships | core.identity.membership.manage | TENANT_CORE | invite/suspend |
| TEN-012 | /manage/roles | roles/permissions | core.identity.role.manage | TENANT_CORE/TENANT_INDUSTRY | DD-03 |
| TEN-013 | /manage/api | API credentials | core.integration.api_credential.manage + API entitlement | TENANT_CORE | create/rotate/revoke |
| TEN-014 | /manage/integrations | tenant integrations | core.integration.tenant.manage | TENANT_CORE/TENANT_INDUSTRY | DD-06 extension |
| TEN-015 | /manage/webhooks | webhook subscriptions | core.integration.webhook.manage | TENANT_CORE/TENANT_INDUSTRY | DD-07 |
| TEN-016 | /manage/domains | domains/subdomains | core.config.domain.manage | TENANT_CORE | verify/map |
| TEN-017 | /manage/branding | branding/theme | core.config.brand.manage | TENANT_CORE | config versions |
| TEN-018 | /manage/notifications | notification preferences/providers | core.notification.config.manage | TENANT_CORE | configuration |
| TEN-019 | /manage/ai | tenant/industry AI config | core.ai.config.manage + AI entitlement | TENANT_CORE/TENANT_INDUSTRY | DD-09 |
| TEN-020 | /manage/security | security/MFA/device/session policies | core.security.policy.manage | TENANT_CORE | DD-16 |
| TEN-021 | /manage/billing | invoices/payments | core.billing.view/manage | TENANT_CORE | billing operations |
| TEN-022 | /manage/documents | config/legal/admin documents | core.document.admin | TENANT_CORE | DD-08 |
| TEN-023 | /manage/audit | tenant audit | core.audit.tenant.view | TENANT_CORE | scoped query/export |
| TEN-024 | /manage/settings | tenant configuration | core.config.manage | TENANT_CORE | configuration |

Operational POS, LIS, exams, production, citizen cases, etc. never appear here except configuration links; those belong Industry Experiences.

## 6. Reusable Industry Experience shell
Base route is tenant-domain dependent; shell route prefix may be `/app`. Shell owns:
- verified session/client workspace bootstrap;
- explicit tenant switcher when multiple memberships;
- explicit industry switcher for enabled/permitted industries;
- org-unit workspace selector;
- entitlement/RBAC/ABAC-composed navigation;
- notification center;
- task/inbox;
- global search;
- help/profile/theme;
- offline/sync indicator.

Industry packages own their domain routes/screens and are Wave 3.

## 7. Navigation composition contract
Input:
`NavigationInput{principalId, tenantId, industryContextId?, orgUnitId?, entitlementSnapshotVersion, permissionVersion, applicablePolicyVersion, activatedModules[], channel}`.

Process:
1 load server-approved navigation manifest for surface/channel;
2 filter by scope/module activation;
3 filter by entitlement hint;
4 filter by RBAC permission hint;
5 apply ABAC visibility restrictions;
6 render hierarchy/order;
7 every actual query/command re-runs server access decision.

Navigation cache key includes tenant + industry + org + entitlement + permission/policy versions + channel. Context switch invalidates prior private navigation/data state.

## 8. Common state contract
Every screen supports:
- Loading: deterministic skeleton/progress without stale sibling-context data.
- Empty: actionable, permission-safe explanation.
- Error: safe error code/correlation, no secret/stack.
- Restricted: deny/restrict/upgrade/step-up state from DD-03.
- Offline: only where DD-11 classifies capability offline-capable.

## 9. Accessibility/responsive
WCAG 2.1 AA baseline: keyboard complete, visible focus, semantic landmarks, labels/errors, contrast, motion preference, captions/transcripts where media, no color-only state. Mobile/tablet/desktop layouts preserve capability, not just visual shrink.

## 10. Analytics/privacy
Public analytics uses consent policy where required. Authenticated product analytics records route/screen capability events with tenant/context pseudonymous attribution only where policy permits; never raw form/health/financial content.

## 11. Acceptance
Public ≠ Platform ≠ Tenant Management ≠ Industry Operations; context switch clears incompatible private state; no screen bypasses server guard; no Healthcare-first navigation behavior; industry domain screens remain deferred to Wave 3.
