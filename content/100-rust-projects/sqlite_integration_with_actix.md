# Project 066 – SQLite Integration with Actix-Web

## Code
Integrates an Actix-web server with an SQLite database using SQLx, providing asynchronous routes to fetch posts and insert new records into the database.

---

## Problem
In-memory storage is volatile and clears data on server restarts. Persistence requires integrating asynchronous web routes with relational database connections.

---

## Goal
Build a persistent blog API backed by an SQLite database, using SQLx to run async SQL queries and map results to structures.

---

## What I Learn
- Connecting to SQLite database files using the asynchronous `SqlitePool`
- Managing database pools inside web app data states
- Writing asynchronous SQL queries using SQLx's query utilities
- Mapping database row records to structs using `#[derive(FromRow)]`
- Binding query arguments dynamically using the `.bind` syntax to prevent SQL injection
- Executing database statements asynchronously inside web handlers
- Gracefully handling database connection failures during server startups

---

## Notes
- `SqlitePool::connect` manages a connection pool automatically, sharing database connections across multiple thread workers.
- SQLx performs compile-time query validation when using the `query!` macro, though this project uses runtime queries for simplicity.
- Try creating the `posts` table in SQLite before running the server, then send post creation requests to verify persistence.
