import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const projections = [
  "README_FOUNDATION.md", "Foundation/F-00_FOUNDATION_OVERVIEW.md",
  "Foundation/F-15_FOUNDATION_TRUTH_REVALIDATION.md",
  "Architecture/A-00_ARCHITECTURE_OVERVIEW.md",
  "Architecture/ARCHITECTURE_REVALIDATION_NOTICE.md",
  "Registers/ARCHITECTURE_FINAL_AUDIT.md",
  "Registers/ARCHITECTURE_NO_LOSS_AUDIT.md",
  "Registers/ARCHITECTURE_TRACEABILITY_MATRIX.md",
  "Registers/NO_LOSS_AUDIT.md",
  "Registers/DD_REQUIREMENT_TRACEABILITY_F5.md",
  "State/PROJECT_STATE.md", "State/HANDOFF_NOTE.md",
  "State/PHASE_SUMMARY.md", "Development/CORE_SERVICE_CHECKPOINT.md",
  "Development/DEVELOPMENT_STATE.md", "Development/DB_CHECKPOINT.md",
  "Development/DB_IMPLEMENTATION_MATRIX.md",
  "Registers/D-INDEX.md", "Registers/D-CHECKPOINT.md", "Registers/REVIEW_REQUIRED.md",
  "Registers/SOURCE_REGISTRY.md", "Registers/ISOLATION_ATTACK_MATRIX.md",
  "Registers/MS_COMPLETENESS_MATRIX.md",
  "Registers/PROJECT_TRUTH_AUDIT_2026-09-10.md",
  "Registers/PHASE4_CROSS_LAYER_TRACEABILITY_ISOLATION_2026-09-13.md",
  "Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md",
  "Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-17.md",
  "Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-21.md",
  "Registers/DEVELOPMENT_VISION_AUDIT_VERIFICATION_2026-09-21.md",
  "Registers/PHASE1_RAWSOURCE_FOUNDATION_RECONCILIATION_2026-09-12.md",
  "Registers/PHASE2_ARCHITECTURE_REVALIDATION_2026-09-12.md",
  "Registers/PHASE3_DETAILED_DESIGN_REVALIDATION_2026-09-13.md",
  "Registers/FINAL_PRE_DEVELOPMENT_ADVERSARIAL_AUDIT_2026-09-13.md",
  "Registers/FINAL_AUDIT_CP-F1-005.md",
  "Registers/VISION_CENTRIC_AUDIT_2026-09-21.md",
  "Registers/VISION_CENTRIC_AUDIT_2026-09-24.md",
  "Registers/VISION_CENTRIC_AUDIT_2026-09-25.md",
  "Registers/TRACEABILITY_EXT_CP-F1-005.md",
  "DetailedDesign/DD-INDEX.md", "DetailedDesign/DD-00_DETAILED_DESIGN_OVERVIEW.md",
  "DetailedDesign/DD-19_DETAILED_DESIGN_TRACEABILITY.md",
  "DetailedDesign/DD-20_DETAILED_DESIGN_FINAL_AUDIT.md",
  "DetailedDesign/DD-20B_WAVE2_AUDIT.md",
  "DetailedDesign/DD-20C_WAVE3_ADVERSARIAL_AUDIT.md",
  "DetailedDesign/DD-20D_OVERALL_DETAILED_DESIGN_AUDIT.md",
  "DetailedDesign/DD-20H_LEGACY_COMBINED_AUDIT_HISTORY.md",
  "DetailedDesign/DD-22H_STATE_ENUM_DERIVATION_HISTORY.md",
  "DetailedDesign/DD-27_41_MS_DETERMINISM_AUDIT.md",
  "DetailedDesign/DD-28_FINAL_NAMED_KPI_COVERAGE.md",
  "DetailedDesign/DD-29_FINAL_REVIEW_REQUIRED_SWEEP.md",
  "DetailedDesign/DD-30_FINAL_REQUIREMENT_TRACEABILITY_AUDIT.md",
  "DetailedDesign/DD-31_FINAL_DEVELOPMENT_QA_DETERMINISM.md",
  "DetailedDesign/WAVE3_CROSS_INDUSTRY_AUDIT.md",
  "DetailedDesign/WAVE3_MS_COMPLETENESS_MATRIX.md",
  "DetailedDesign/DD-CHECKPOINT.md", "DetailedDesign/DD-PHASE_STATE.md",
  "DetailedDesign/DD-REVIEW_REQUIRED.md",
];

test("REPO-011: active checkpoint narratives agree with the manifest beyond their headers", () => {
  const m = JSON.parse(read("State/PROJECT_MANIFEST.json"));
  const feature = m.current_feature_verification;
  const paths = [
    "README_FOUNDATION.md", "State/PROJECT_STATE.md", "State/HANDOFF_NOTE.md",
    "State/PHASE_SUMMARY.md", "Development/CORE_SERVICE_CHECKPOINT.md",
    "Development/DEVELOPMENT_STATE.md", "Development/DB_CHECKPOINT.md",
    "Registers/D-CHECKPOINT.md", "DetailedDesign/DD-CHECKPOINT.md",
    "DetailedDesign/DD-PHASE_STATE.md", "DetailedDesign/DD-REVIEW_REQUIRED.md",
    "DetailedDesign/DD-INDEX.md", "Registers/D-INDEX.md", "Registers/REVIEW_REQUIRED.md",
  ];
  for (const path of paths) {
    // Historical sections retain their own evidence; these paragraphs are current.
    const body = read(path).split("\n").slice(7, 19).join("\n");
    const currentBatch = body.match(/^DD-\d+…(DD-\d+) is the current governed/m);
    assert.equal(currentBatch?.[1], feature.decision_id, `${path}: stale active batch narrative`);
    assert.ok(body.includes(m.github.current_downstream_verified_head), `${path}: stale narrative HEAD`);
    assert.ok(body.includes(m.github.current_downstream_verified_tree), `${path}: stale narrative tree`);
    assert.ok(body.includes(m.development.core_services.tests.replace(" PASS", " Core")), `${path}: stale Core count`);
    assert.ok(body.includes(m.development.core_services.postgres_tests.replace(" PASS", " PostgreSQL")), `${path}: stale PostgreSQL count`);
    assert.ok(body.includes(feature.evidence), `${path}: stale feature evidence`);
    assert.ok(body.includes(feature.source_audit), `${path}: stale source audit`);
    assert.ok(body.includes(`Next: ${m.continuation.next_action}`), `${path}: stale continuation instruction`);
  }
  assert.ok(!read("State/HANDOFF_NOTE.md").split("## Historical")[0]
    .match(/Fetch the branch again[^\n]*DD-\d+/), "Handoff has a second batch-specific continuation instruction");
  for (const path of projections) {
    const content = read(path);
    assert.ok(!content.includes("> **Current project overlay"), `${path}: duplicate dated current overlay`);
    const updated = content.split("\n").slice(0, 8).join("\n").match(/\*\*Updated:\*\* (\d{4}-\d{2}-\d{2})/);
    if (updated) assert.equal(updated[1], m.updated, `${path}: stale current update date`);
  }
});

test("REPO-007: active checkpoint projections distinguish governed feature evidence from current audit basis", () => {
  const m = JSON.parse(read("State/PROJECT_MANIFEST.json"));
  const feature = m.current_feature_verification;
  const currentDecisionToken = feature.decision_id.replace("-", "");
  assert.ok(m.gates.detailed_design.includes(currentDecisionToken), "Stale canonical Detailed Design gate token");
  assert.ok(m.gates.core_services.includes(currentDecisionToken), "Stale canonical Core services gate token");
  const auditHead = m.github.current_downstream_verified_head;
  const auditTree = m.github.current_downstream_verified_tree;
  const ci = m.github.current_downstream_verified_ci;
  const core = m.development.core_services;
  const database = m.development.database;

  // Current CI must describe the current audit basis, not a preserved older
  // feature/promotion run. Keep historical feature proof independently owned.
  assert.equal(ci.core_pass, core.core_test_counts.pass, "Stale current Core CI count");
  assert.equal(ci.postgres_pass, core.postgres_test_counts.pass, "Stale current PostgreSQL CI count");
  assert.equal(ci.verified_head, auditHead, "Current CI is not bound to its audit HEAD");
  assert.equal(ci.verified_tree, auditTree, "Current CI is not bound to its audit tree");
  for (const [field, expected] of [
    ["core_run_id", core.core_ci_run_id],
    ["core_job_id", core.core_ci_job_id],
    ["core_run_id", core.postgres_ci_run_id],
    ["postgres_job_id", core.postgres_ci_job_id],
    ["database_run_id", core.database_regression_run_id],
    ["database_job_id", core.database_regression_job_id],
    ["database_run_id", database.ci_run_id],
    ["database_job_id", database.ci_job_id],
    ["database_migrations", database.migration_count],
    ["database_verification_files", database.verification_file_count],
  ]) assert.equal(ci[field], expected, `Conflicting current CI ${field}`);
  for (const field of ["core_run_id", "core_job_id", "postgres_job_id",
    "database_run_id", "database_job_id", "web_run_id", "web_job_id"]) {
    assert.ok(Number.isSafeInteger(ci[field]) && ci[field] > 0, `Missing current CI ${field}`);
  }
  if (auditHead === feature.verified_head) {
    assert.equal(ci.core_run_id, feature.core.run_id);
    assert.equal(ci.core_job_id, feature.core.job_id);
    assert.equal(ci.postgres_job_id, feature.postgres.job_id);
    assert.equal(ci.database_run_id, feature.database.run_id);
    assert.equal(ci.database_job_id, feature.database.job_id);
    assert.equal(ci.web_run_id, feature.web.run_id);
    assert.equal(ci.web_job_id, feature.web.job_id);
  }
  assert.ok(m.development.application_api_ui_scope_note.includes(`through ${feature.decision_id}`),
    "Stale current backend/application scope decision");

  for (const value of [feature, m.current_audit_overlay, m.continuation, m.development.core_services]) {
    assert.equal(value.checkpoint, m.checkpoint, "Conflicting active checkpoint");
  }

  assert.equal(feature.verified_head, m.current_feature_verification.verified_head);
  assert.equal(feature.verified_tree, m.current_feature_verification.verified_tree);
  assert.ok(read(feature.evidence).includes(feature.verified_head));

  for (const head of [m.github.verified_code_head, m.github.state_projection_basis_head,
    m.current_audit_overlay.verified_executable_basis, m.continuation.verified_code_head,
    m.development.core_services.verified_head, m.development.database.ci_verified_head]) {
    assert.equal(head, auditHead, "Conflicting current audit verified HEAD");
  }
  for (const tree of [m.github.verified_code_tree, m.current_audit_overlay.verified_executable_tree,
    m.continuation.verified_code_tree, m.development.core_services.verified_tree,
    m.development.database.ci_verified_tree]) {
    assert.equal(tree, auditTree, "Conflicting current audit verified tree");
  }

  assert.equal(m.current_phase, m.development.current_phase);
  assert.equal(m.continuation.next_action, m.development.next_action);
  assert.equal(m.development.core_services.next_action, m.development.next_action);
  const boundedRuntime = m.vision_audit_2026_09_26.downstream_bounded_runtime_audit;
  const runtimeAudit = boundedRuntime.report;
  const latestRuntimeFinding = boundedRuntime.current_verified_basis.finding_ids.at(-1);
  assert.ok(/^VC27-\d+$/.test(latestRuntimeFinding), "Missing bounded runtime finding id");
  assert.equal(
    boundedRuntime.status,
    `BOUNDED_CLEAN_WITH_VERIFIED_FAIL_CLOSED_CORRECTIONS_THROUGH_${latestRuntimeFinding.replace("-", "_")}_COMPLETE_PROJECT_AUDIT_CLOSED`,
    "Bounded runtime status is stale against the verified finding basis",
  );
  assert.equal(m.current_audit_overlay.current_verification, runtimeAudit);
  assert.equal(m.continuation.current_verification, runtimeAudit);
  assert.ok(read(runtimeAudit).includes(auditHead));

  for (const path of projections) {
    const firstLines = read(path).split("\n").slice(0, 8).join("\n");
    const match = firstLines.match(/\*\*Current checkpoint:\*\* `([^`]+)`/);
    assert.equal(match?.[1], m.checkpoint, `${path}: stale or absent active checkpoint`);
    assert.ok(firstLines.includes(auditHead), `${path}: stale active audit basis`);
    assert.ok(firstLines.includes(`Current audit gate (${m.updated})`), `${path}: closed audit gate date does not match manifest.updated`);
    assert.ok(firstLines.includes("**CLEAN / CLOSED**"), `${path}: audit gate is not closed`);
    assert.ok(!firstLines.includes("DD-209 is not authorized"), `${path}: stale DD-209 lock`);
    assert.ok(!firstLines.includes("audit hold"), `${path}: stale audit-hold marker`);
  }
});

test("REPO-010: governance evidence changes reach all exact-head verification workflows", () => {
  const required = [
    ".github/workflows/**", "RawSourceCorpus/**", "Governing/**", "Foundation/**",
    "Architecture/**", "DetailedDesign/**", "Development/**", "Registers/**",
    "State/**", "tests/core/**", "README_FOUNDATION.md",
  ];
  for (const workflow of [
    ".github/workflows/core-service-verify.yml",
    ".github/workflows/database-verify.yml",
    ".github/workflows/web-dependency-lock.yml",
  ]) {
    const content = read(workflow);
    const pushStart = content.indexOf("  push:");
    const pullStart = content.indexOf("  pull_request:");
    const dispatchStart = content.indexOf("  workflow_dispatch:");
    assert.ok(pushStart >= 0 && pullStart > pushStart && dispatchStart > pullStart, workflow);
    const push = content.slice(pushStart, pullStart);
    const pull = content.slice(pullStart, dispatchStart);
    for (const path of required) {
      assert.ok(push.includes(`- "${path}"`), `${workflow}: push does not cover ${path}`);
      assert.ok(pull.includes(`- "${path}"`), `${workflow}: pull_request does not cover ${path}`);
    }
  }
});

test("REPO-008: current feature has canonical decision, acceptance and executable evidence", () => {
  const m = JSON.parse(read("State/PROJECT_MANIFEST.json"));
  const feature = m.current_feature_verification;
  const decisions = [...read("DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md")
    .matchAll(/^## (DD-\d+)\b/gm)].map(match => match[1]);
  assert.equal(feature.decision_id, decisions.at(-1), "Implementation promotion is incomplete");
  assert.ok(read(feature.source_audit).includes(feature.decision_id));
  const contracts = read("DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md");
  const executableTests = feature.test_files.map(read).join("\n");
  assert.ok(feature.acceptance_ids.length > 0);
  for (const id of feature.acceptance_ids) {
    assert.ok(contracts.includes(`### ${id} `), `Missing canonical acceptance: ${id}`);
    assert.ok(executableTests.includes(id), `Missing executable acceptance: ${id}`);
  }
  assert.ok(read("DetailedDesign/DD-19_DETAILED_DESIGN_TRACEABILITY.md")
    .includes(feature.source_audit));
});
