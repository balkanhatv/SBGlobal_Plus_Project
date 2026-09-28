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
  "Registers/DD_REQUIREMENT_TRACEABILITY_F5.md",
  "State/PROJECT_STATE.md", "State/HANDOFF_NOTE.md",
  "State/PHASE_SUMMARY.md", "Development/CORE_SERVICE_CHECKPOINT.md",
  "Development/DEVELOPMENT_STATE.md", "Development/DB_CHECKPOINT.md",
  "Development/DB_IMPLEMENTATION_MATRIX.md",
  "Registers/D-INDEX.md", "Registers/D-CHECKPOINT.md", "Registers/REVIEW_REQUIRED.md",
  "Registers/SOURCE_REGISTRY.md", "Registers/ISOLATION_ATTACK_MATRIX.md",
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
  "DetailedDesign/DD-29_FINAL_REVIEW_REQUIRED_SWEEP.md",
  "DetailedDesign/DD-30_FINAL_REQUIREMENT_TRACEABILITY_AUDIT.md",
  "DetailedDesign/DD-31_FINAL_DEVELOPMENT_QA_DETERMINISM.md",
  "DetailedDesign/WAVE3_CROSS_INDUSTRY_AUDIT.md",
  "DetailedDesign/DD-CHECKPOINT.md", "DetailedDesign/DD-PHASE_STATE.md",
  "DetailedDesign/DD-REVIEW_REQUIRED.md",
];

test("REPO-007: active checkpoint projections distinguish governed feature evidence from current audit basis", () => {
  const m = JSON.parse(read("State/PROJECT_MANIFEST.json"));
  const feature = m.current_feature_verification;
  const auditHead = m.github.current_downstream_verified_head;
  const auditTree = m.github.current_downstream_verified_tree;

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
  const runtimeAudit = m.vision_audit_2026_09_26.downstream_bounded_runtime_audit.report;
  assert.equal(m.current_audit_overlay.current_verification, runtimeAudit);
  assert.equal(m.continuation.current_verification, runtimeAudit);
  assert.ok(read(runtimeAudit).includes(auditHead));

  for (const path of projections) {
    const firstLines = read(path).split("\n").slice(0, 8).join("\n");
    const match = firstLines.match(/\*\*Current checkpoint:\*\* `([^`]+)`/);
    assert.equal(match?.[1], m.checkpoint, `${path}: stale or absent active checkpoint`);
    assert.ok(firstLines.includes(auditHead), `${path}: stale active audit basis`);
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
