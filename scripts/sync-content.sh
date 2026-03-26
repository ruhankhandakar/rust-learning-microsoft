#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_REPO="https://github.com/microsoft/RustTraining.git"
BOOKS=(async-book c-cpp-book csharp-book engineering-book python-book rust-patterns-book type-driven-correctness-book)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTENT_DIR="$PROJECT_ROOT/content"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "Cloning $UPSTREAM_REPO (shallow)..."
git clone --depth 1 "$UPSTREAM_REPO" "$TMP_DIR/upstream" 2>&1

changed=0

for book in "${BOOKS[@]}"; do
  src="$TMP_DIR/upstream/$book/src"
  dest="$CONTENT_DIR/$book"

  if [ ! -d "$src" ]; then
    echo "  SKIP $book — no src/ directory upstream"
    continue
  fi

  mkdir -p "$dest"

  # Sync .md files from upstream src/ into our flat content/<book>/
  rsync -a --delete --include="*.md" --exclude="*" "$src/" "$dest/"

  echo "  OK   $book"
done

# Check if anything actually changed
cd "$PROJECT_ROOT"
if git diff --quiet -- content/; then
  echo ""
  echo "No content changes detected."
  exit 0
fi

echo ""
echo "Content changes detected:"
git diff --stat -- content/
exit 0
