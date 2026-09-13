#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/database/migrations"
VERIFY_DIR="$ROOT_DIR/database/verification"

command -v psql >/dev/null 2>&1 || {
  echo "psql is required" >&2
  exit 127
}

echo "Applying migrations..."
while IFS= read -r file; do
  echo "  -> $(basename "$file")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort)

echo "Running verification SQL..."
while IFS= read -r file; do
  echo "  -> $(basename "$file")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done < <(find "$VERIFY_DIR" -maxdepth 1 -type f -name '*.sql' | sort)

echo "Database bootstrap verification PASS"
