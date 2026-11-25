#!/bin/sh
# Netlify sets CONTEXT. Only production builds migrate, so previews and local builds never touch a database.
set -e
if [ "$CONTEXT" != "production" ]; then
  echo "Skipping database migrations (CONTEXT=${CONTEXT:-local})"
  exit 0
fi
case "$TURSO_DATABASE_URL" in
  libsql://*|https://*) ;;
  *) echo "TURSO_DATABASE_URL must point at the production Turso database" >&2; exit 1 ;;
esac
echo "Running database migrations"
tsx db/migrate.ts
