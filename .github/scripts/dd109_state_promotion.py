from pathlib import Path
import json

OLD_CP = "DEV-AI-MODEL-CATALOG-READ-001"
NEW_CP = "DEV-AI-CAPABILITY-CATALOG-READ-001"
IMPL = "c9effecdec6508f730a039b89c3e00588a71fb87"
IMPL_TREE = "024733156623ade9ad58caeb2711e6032da68dbd"
GATE = "0cd3bd299bd2e4a0ca9b6644527d15a701ec9077"
GATE_TREE = "45ebfc04fde83fc4f5f42415d98f288cd5109169"

OLD_EXEC = "Verified executable `e1e53969a3a2869e2c4612e45c65a7a3c66d2d58` / tree `f057bef288113ff61bd3575239cbabc44c756c9a`: **311/311 Core**, **200/200 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **537 blobs / 217 Markdown / 139 source / 79 test files**."
NEW_EXEC = f"Verified executable `{IMPL}` / tree `{IMPL_TREE}`: **311/311 Core**, **205/205 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests."

OLD_GATE = "Corrected promotion invariant gate `392c928ac72c58a4347fd4ceaa89b9c90afd8d71` / tree `06a231745bfc2765be9eae4120195e9b627407b9`: Core run `35745883068`, Database run `35745883189`, Web run `35745883110` — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 108 unique DD definitions**."
NEW_GATE = f"Promotion invariant gate `{GATE}` / tree `{GATE_TREE}`: Core run `35757441004`, Database run `35757440917`, Web run `35757440910` — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 109 unique DD definitions**."

OLD_GATE_JOBS = "Corrected promotion invariant gate `392c928ac72c58a4347fd4ceaa89b9c90afd8d71` / tree `06a231745bfc2765be9eae4120195e9b627407b9`: Core run `35745883068` (Core job `106807278646`, PostgreSQL job `106807279082`), Database run `35745883189` (job `106807278122`), Web run `35745883110` (job `106807277653`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 108 unique DD definitions**."
NEW_GATE_JOBS = f"Promotion invariant gate `{GATE}` / tree `{GATE_TREE}`: Core run `35757441004` (Core job `106846672789`, PostgreSQL job `106846673057`), Database run `35757440917` (job `106846680708`), Web run `35757440910` (job `106846672128`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 109 unique DD definitions**."

OLD_SUMMARY = "DD-108 adds an exact-by-id global `core_ai.ai_model` catalog metadata reader through the dedicated `sbg_ai_gateway_rw` boundary. `providerId`, raw status, capabilities, modality, sensitivity, residency, cost, latency and metadata values remain catalog evidence only; they do not authorize active/current/eligible/preferred model selection, provider/model routing, fallback/retry, credential resolution, inference/embedding, RAG, assistant, agent/tool, tenant/industry AI-policy, quota/budget or other concrete AI Gateway execution semantics. No Tenant/Industry RequestContext, migration, schema, verification SQL, role, grant, RLS policy or product-policy change is introduced by DD-108."
NEW_SUMMARY = "DD-109 adds an exact-by-id global `core_ai.ai_capability` catalog metadata reader through the dedicated `sbg_ai_gateway_rw` boundary. `category`, nullable `requiredEntitlement`, `defaultPolicyClass`, positive `schemaVersion`, and raw `status` remain persisted catalog evidence only; they do not authorize runtime capability eligibility, entitlement/policy evaluation, Tenant/Industry allowed-capability resolution, provisioning selection, provider/model routing, credential resolution, quota/budget decisions, or AI execution. No Tenant/Industry RequestContext, migration, schema, verification SQL, role, grant, RLS policy or product-policy change is introduced by DD-109."

FILES = [
  "Development/DEVELOPMENT_STATE.md",
  "Development/CORE_SERVICE_CHECKPOINT.md",
  "DetailedDesign/DD-CHECKPOINT.md",
  "DetailedDesign/DD-PHASE_STATE.md",
  "DetailedDesign/DD-INDEX.md",
  "State/HANDOFF_NOTE.md",
  "State/PHASE_SUMMARY.md",
  "State/PROJECT_STATE.md",
]

for name in FILES:
    p = Path(name)
    s = p.read_text(encoding="utf-8")
    s = s.replace(OLD_CP, NEW_CP)
    s = s.replace(OLD_EXEC, NEW_EXEC)
    s = s.replace(OLD_GATE_JOBS, NEW_GATE_JOBS)
    s = s.replace(OLD_GATE, NEW_GATE)
    s = s.replace(OLD_SUMMARY, NEW_SUMMARY)
    s = s.replace("Decisions are contiguous through DD-108", "Decisions are contiguous through DD-109")
    s = s.replace("decisions are contiguous through DD-108", "decisions are contiguous through DD-109")
    s = s.replace("DD-001–108", "DD-001–109")
    s = s.replace("DEVELOPMENT_DD108_VERIFICATION_2026-09-22.md", "DEVELOPMENT_DD109_VERIFICATION_2026-09-22.md")
    s = s.replace("AI_MODEL_CATALOG_METADATA_READER_PREREQUISITE_OWNERSHIP_AUDIT.md", "AI_CAPABILITY_CATALOG_METADATA_READER_PREREQUISITE_OWNERSHIP_AUDIT.md")
    s = s.replace("`AIMODEL-PG-001`…`AIMODEL-PG-005` prove exact immutable metadata read, missing/malformed identifier handling, schema-valid raw evidence preservation, non-authorizing catalog facts, exact provider relation evidence and SELECT-only model-catalog authority through the dedicated AI role.", "`AICAP-PG-001`…`AICAP-PG-005` prove exact immutable capability metadata read, missing/malformed identifier handling, nullable/empty schema-valid evidence preservation, non-authorizing capability catalog facts, and SELECT-only capability-catalog authority through the dedicated AI role.")
    s = s.replace("Active/current/eligible/preferred model selection, provider/model routing, health/capability/modality/sensitivity/residency decisions, credential resolution, tenant/industry allowlists, quota/budget execution, scoring/fallback/retry, provider SDK/inference/embedding, `AIProvisioningSnapshot` compilation/current-selection, prompt/policy evaluation, RAG/assistant/agent/tool execution and Workflow/Automation execution/mutation semantics remain unimplemented unless separately source-owned.", "Capability eligibility/authorization, entitlement and default-policy evaluation, effective Tenant/Industry allowed-capability resolution, `AIProvisioningSnapshot` compilation/current-selection, provider/model selection or suitability/routing, sensitivity/residency/quota/budget decisions, credential resolution, provider SDK/inference/embedding/rerank/OCR/media execution, RAG/assistant/agent/tool execution, prompt/policy evaluation and Workflow/Automation execution/mutation semantics remain unimplemented unless separately source-owned.")
    # DD-INDEX has a differently worded current evidence line.
    old_index = "**Current verified executable evidence:** `e1e53969a3a2869e2c4612e45c65a7a3c66d2d58` / tree `f057bef288113ff61bd3575239cbabc44c756c9a` — 311 Core tests, 200 PostgreSQL tests including `AIMODEL-PG-001…005`, full 47/41 bootstrap, Database Verify and Next.js build PASS. Corrected promotion invariant gate `392c928ac72c58a4347fd4ceaa89b9c90afd8d71`: Core run `35745883068`, Database run `35745883189`, Web run `35745883110` — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 108 unique DD definitions**. See [verification evidence](../Registers/DEVELOPMENT_DD109_VERIFICATION_2026-09-22.md)."
    new_index = f"**Current verified executable evidence:** `{IMPL}` / tree `{IMPL_TREE}` — 311 Core tests, 205 PostgreSQL tests including `AICAP-PG-001…005`, full 47/41 bootstrap, Database Verify and Next.js build PASS. Promotion invariant gate `{GATE}`: Core run `35757441004`, Database run `35757440917`, Web run `35757440910` — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 109 unique DD definitions**. See [verification evidence](../Registers/DEVELOPMENT_DD109_VERIFICATION_2026-09-22.md)."
    s = s.replace(old_index, new_index)
    p.write_text(s, encoding="utf-8")

# Structured project manifest update.
mp = Path("State/PROJECT_MANIFEST.json")
data = json.loads(mp.read_text(encoding="utf-8"))
data["checkpoint"] = NEW_CP
data["final_verdict"] = "DD-109 AI CAPABILITY CATALOG METADATA READER IMPLEMENTED / EXACT-HEAD TESTED; RAW CATALOG EVIDENCE ONLY; CAPABILITY AUTHORIZATION, POLICY, ROUTING AND EXECUTION AUTHORITY UNCLAIMED"
data["github"]["verified_code_head"] = IMPL
data["github"]["verified_code_tree"] = IMPL_TREE
data["github"]["state_projection_basis_head"] = GATE
data["development"]["current_phase"] = "AI Capability catalog metadata exact-by-id reader verified; category, entitlement-reference, policy-class and status fields remain non-authorizing evidence"
cs = data["development"]["core_services"]
cs["checkpoint"] = NEW_CP
cs["decision"] = "DD-040–109 current implementation; DD-109 bounded AI Capability catalog metadata PostgreSQL reader"
cs["verified_head"] = IMPL
cs["verified_tree"] = IMPL_TREE
cs["core_ci_run_id"] = 35757441004
cs["core_ci_job_id"] = 106846672789
cs["tests"] = "311/311 PASS"
cs["core_test_counts"] = {"tests":311,"pass":311,"fail":0,"skip":0}
cs["postgres_ci_run_id"] = 35757441004
cs["postgres_ci_job_id"] = 106846673057
cs["postgres_tests"] = "205/205 PASS"
cs["postgres_test_counts"] = {"tests":205,"pass":205,"fail":0,"skip":0}
cs["database_regression_run_id"] = 35757440917
cs["database_regression_job_id"] = 106846680708
cs["database_regression_result"] = "PASS"
cs["promotion_invariant_gate_head"] = GATE
cs["promotion_invariant_gate_tree"] = GATE_TREE
cs["promotion_invariant_gate_web_run_id"] = 35757440910
cs["promotion_invariant_gate_web_job_id"] = 106846672128
cs["promotion_invariant_gate_unique_dd"] = 109

db = data["development"]["database"]
db["ci_verified_head"] = GATE
db["ci_verified_tree"] = GATE_TREE
db["ci_run_id"] = 35757440917
db["ci_job_id"] = 106846680708
db["ci_tested_commit_assertion"] = "PASS_EXACT_BRANCH_HEAD"
db["ci_conclusion"] = "success"
db["feature_head_bootstrap_verified_head"] = GATE
db["feature_head_bootstrap_verified_tree"] = GATE_TREE
db["feature_head_bootstrap_run_id"] = 35757441004
db["feature_head_bootstrap_job_id"] = 106846673057
db["feature_head_bootstrap_result"] = "PASS_47_MIGRATIONS_41_VERIFICATION_FILES_PLUS_205_POSTGRES_TESTS"
mp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# Close the invariant-gate section in the DD-109 verification register.
rp = Path("Registers/DEVELOPMENT_DD109_VERIFICATION_2026-09-22.md")
r = rp.read_text(encoding="utf-8")
old = "This verification-record commit is the intended exact-head invariant gate after canonical DD-109 promotion. Promotion requires Core Service Verify, PostgreSQL/RLS, Database Verify, and Web Boundary Verify to complete successfully at this head, with repository invariants unchanged except the contiguous decision count advancing from 108 to **109 unique DD definitions**.\n\nGate run IDs and exact gate SHA are recorded in the follow-up closure update only after exact-head CI completes successfully."
new = f"Exact invariant-gate head: `{GATE}` / tree `{GATE_TREE}`. Core Service Verify run `35757441004` (Core job `106846672789`, PostgreSQL/RLS job `106846673057`), Database Verify run `35757440917` (job `106846680708`), and Web Boundary Verify run `35757440910` (job `106846672128`) all completed **SUCCESS** against that exact SHA. Repository invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements**, with the contiguous canonical decision count advancing exactly once to **109 unique DD definitions**.\n\nThis green invariant gate authorizes state/checkpoint promotion to `{NEW_CP}`; it does not expand DD-109 runtime semantics."
if old not in r:
    raise SystemExit("DD-109 register invariant-gate placeholder not found")
rp.write_text(r.replace(old,new), encoding="utf-8")
