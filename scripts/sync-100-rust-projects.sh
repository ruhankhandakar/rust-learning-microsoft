#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_REPO="https://github.com/emmaglorypraise/100rustprojects.git"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTENT_DIR="$PROJECT_ROOT/content/100-rust-projects"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "Cloning $UPSTREAM_REPO (shallow)..."
git clone --depth 1 "$UPSTREAM_REPO" "$TMP_DIR/upstream" 2>&1

mkdir -p "$CONTENT_DIR"

echo "Syncing notes/*.md → content/100-rust-projects/"
rsync -a --delete --include="*.md" --exclude="*" "$TMP_DIR/upstream/notes/" "$CONTENT_DIR/"

echo "Copying glossary..."
if [ -f "$TMP_DIR/upstream/glossary.md" ]; then
  cp "$TMP_DIR/upstream/glossary.md" "$CONTENT_DIR/glossary.md"
fi

echo "Copying progress tracker..."
PROGRESS_SRC=""
if [ -f "$TMP_DIR/upstream/ progress.md" ]; then
  PROGRESS_SRC="$TMP_DIR/upstream/ progress.md"
elif [ -f "$TMP_DIR/upstream/progress.md" ]; then
  PROGRESS_SRC="$TMP_DIR/upstream/progress.md"
else
  FOUND="$(find "$TMP_DIR/upstream" -maxdepth 1 -name '*progress.md' -print -quit)"
  if [ -n "$FOUND" ]; then
    PROGRESS_SRC="$FOUND"
  fi
fi
if [ -n "$PROGRESS_SRC" ]; then
  cp "$PROGRESS_SRC" "$CONTENT_DIR/progress.md"
else
  echo "  WARN: no progress.md found upstream"
fi

echo "Syncing projects/*/ → content/100-rust-projects/projects/ (excludes target, .git)"
mkdir -p "$CONTENT_DIR/projects"
if [ -d "$TMP_DIR/upstream/projects" ]; then
  rsync -a --delete \
    --exclude='target/' \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='.DS_Store' \
    "$TMP_DIR/upstream/projects/" "$CONTENT_DIR/projects/"
fi

echo "Writing _project_dirs.json..."
node -e "
const fs = require('fs');
const p = '$TMP_DIR/upstream/projects';
const dirs = fs.existsSync(p)
  ? fs.readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort()
  : [];
fs.writeFileSync('$CONTENT_DIR/_project_dirs.json', JSON.stringify(dirs, null, 0));
console.log('  ', dirs.length, 'project folders');
"

echo "Done."
