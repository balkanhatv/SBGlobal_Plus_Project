#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C
shopt -s nullglob

: "${DATABASE_URL:?DATABASE_URL is required}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/database/migrations"
VERIFY_DIR="$ROOT_DIR/database/verification"

command -v psql >/dev/null 2>&1 || {
  echo "psql is required" >&2
  exit 127
}

# This is a clean-database verification harness, not a production upgrade runner.
# Bash glob ordering is deterministic under LC_ALL=C; unlike process substitution,
# absent directories/files cannot silently produce an empty successful run.
migration_files=("$MIGRATIONS_DIR"/*.sql)
verification_files=("$VERIFY_DIR"/*.sql)
if (( ${#migration_files[@]} == 0 || ${#verification_files[@]} == 0 )); then
  echo "Both migration and verification inventories must be nonempty" >&2
  exit 1
fi

echo "Applying migrations..."
for file in "${migration_files[@]}"; do
  echo "  -> $(basename "$file")"
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$file"
done

echo "Running verification SQL..."
for file in "${verification_files[@]}"; do
  echo "  -> $(basename "$file")"
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$file"
done

echo "Database bootstrap verification PASS"
