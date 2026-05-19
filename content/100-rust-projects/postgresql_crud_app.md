# Project 067 – PostgreSQL CRUD App with SQLx + Actix-Web

## Code
Implements a persistent Todo API backend using Actix-web and PostgreSQL, executing CRUD queries with SQLx, retrieving returning records, and checking database health status.

---

## Problem
Persistent Todo managers need to connect to external databases, execute CRUD commands asynchronously, handle query errors, and return status summaries.

---

## Goal
Build a PostgreSQL CRUD API using SQLx and Actix-web, connecting to databases, executing database mutations, and validating connections.

---

## What I Learn
- Connecting to PostgreSQL databases using `PgPoolOptions` configuration builders
- Loading database connection strings from `.env` environment files using `dotenvy`
- Executing SQL updates and deletions, checking affected rows via `rows_affected()`
- Mapping query results directly to structures using `sqlx::query_as`
- Retrieving newly created record fields using database `RETURNING` queries
- Building health-check routes validating database connection statuses
- Configuring connection pools with custom pool limits (`max_connections`)

---

## Notes
- `connect_lazy` creates a connection pool immediately without validating connection settings, deferring actual validation until the first query runs.
- `dotenvy::dotenv()` loads environment variables from a local `.env` file, keeping database credentials out of version control.
- Try running a PostgreSQL database, setting the `DATABASE_URL` variable, and querying `/health` to verify integration.