import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const projections = [
  "README_FOUNDATION.md", "State/PROJECT_STATE.md", "State/HANDOFF_NOTE.md",
  "State/PHASE_SUMMARY.md", "Development/CORE_SERVICE_CHECKPOINT.md",
  "Development/DEVELOPMENT_STATE.md", "Development/DB_CHECKPOINT.md",
  "Registers/D-INDEX.md", "Registers/D-CHECKPOINT.md", "Registers/REVIEW_REQUIRED.md",
  "Registers/SOURCE_REGISTRY.md", "DetailedDesign/DD-INDEX.md",
  "DetailedDesign/DD-CHECKPOINT.md", "DetailedDesign/DD-PHASE_STATE.md",
  "DetailedDesign/DD-REVIEW_REQUIRED.md",
];

test("REPO-007: all active checkpoint projections share one verified basis and continuation", () => {
  const m = JSON.parse(read("State/PROJECT_MANIFEST.json"));
  const current = m.current_feature_verification;
  for (const value of [current, m.current_audit_overlay, m.continuation, m.development.core_services]) {
    assert.equal(value.checkpoint, m.checkpoint, "Conflicting active checkpoint");
  }
  for (const head of [m.github.verified_code_head, m.github.state_projection_basis_head,
    m.current_audit_overlay.verified_executable_basis, m.continuation.verified_code_head,
    m.development.core_services.verified_head, m.development.database.ci_verified_head]) {
    assert.equal(head, current.verified_head, "Conflicting verified HEAD");
  }
  for (const tree of [m.github.verified_code_tree, m.current_audit_overlay.verified_executable_tree,
    m.continuation.verified_code_tree, m.development.core_services.verified_tree,
    m.development.database.ci_verified_tree]) {
    assert.equal(tree, current.verified_tree, "Conflicting verified tree");
  }
  assert.equal(m.current_phase, m.development.current_phase);
  assert.equal(m.continuation.next_action, m.development.next_action);
  assert.equal(m.development.core_services.next_action, m.development.next_action);
  assert.equal(m.current_audit_overlay.current_verification, current.evidence);
  assert.equal(m.continuation.current_verification, current.evidence);
  assert.ok(read(current.evidence).includes(current.verified_head));
  for (const path of projections) {
    const firstLines = read(path).split("\n").slice(0, 5).join("\n");
    const match = firstLines.match(/\*\*Current checkpoint:\*\* `([^`]+)`/);
    assert.equal(match?.[1], m.checkpoint, `${path}: stale or absent active checkpoint`);
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
