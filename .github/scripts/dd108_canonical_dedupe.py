from pathlib import Path

TARGETS = [
    (Path('DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md'), '## DD-108 — AI Model Catalog Metadata Reader'),
    (Path('DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md'), '### AIMODEL-PG-001 — Exact model catalog metadata read'),
]

for path, marker in TARGETS:
    text = path.read_text(encoding='utf-8')
    first = text.find(marker)
    if first < 0:
        raise SystemExit(f'missing canonical marker in {path}')
    second = text.find(marker, first + len(marker))
    if second >= 0:
        trailing = text[second:]
        path.write_text(text[:second].rstrip() + '\n', encoding='utf-8')
