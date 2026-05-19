# Project 069 – Blog API Backend (Posts, Comments, Categories)

## Code
Implements a multi-resource Blog API using Actix-web and PostgreSQL, storing blog posts, comments, and categories inside databases, and executing SQL commands with SQLx.

---

## Problem
Complex APIs need to manage multiple relational data models (like posts, comments, and categories) using foreign keys, database connection pools, and structured routing endpoints.

---

## Goal
Build a backend blog API utilizing PostgreSQL databases, handling tables with foreign keys, executing relational queries, and validating responses.

---

## What I Learn
- Managing complex schemas with foreign keys (e.g. `category_id`, `post_id`) in PostgreSQL
- Sharing database connection pools (`PgPool`) across multi-threaded web routes
- Querying and mapping rows to multiple target structs using `sqlx::query_as`
- Adding records to databases and binding request fields to arguments
- Loading database connection strings from `.env` environment configuration files
- Handling database constraints and foreign key validation failures
- Structuring API routes for multiple resources under a single server instance

---

## Notes
- Using database connection pools (`PgPool`) prevents the overhead of opening a new TCP connection for every incoming HTTP request.
- The `unwrap()` call on database queries in list routes can cause the server to crash if the database goes offline; in production, use proper error handling.
- Try creating the database schemas, inserting categories, and adding posts to verify relational constraints on database tables.