from pathlib import Path

files = {
    Path('DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md'): '\n## DD-108 — AI Model Catalog Metadata Reader\n',
    Path('DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md'): '\n### AIMODEL-PG-001 — Exact model catalog metadata read\n',
}

for path, marker in files.items():
    text = path.read_text(encoding='utf-8')
    if marker not in text:
        raise SystemExit(f'expected duplicate marker missing: {path}')
    before, after = text.split(marker, 1)
    if not after.strip():
        raise SystemExit(f'empty duplicate tail unexpected: {path}')
    path.write_text(before.rstrip() + '\n', encoding='utf-8')
