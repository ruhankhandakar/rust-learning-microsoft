# Project 070 – E-Commerce Backend with Actix-Web + PostgreSQL

## Code
Implements a backend for an E-Commerce API using Actix-web and PostgreSQL, storing product listings and customer details inside databases, and querying records with SQLx.

---

## Problem
E-commerce services need databases to store inventories and customer profiles, requiring CRUD endpoints to query and add products and customers.

---

## Goal
Build an E-commerce API backed by PostgreSQL, managing product inventories and customer profiles, and writing SQL queries with SQLx.

---

## What I Learn
- Storing multiple database structures (`Product`, `Customer`) in PostgreSQL tables
- Managing database connection pools across routes using Actix `web::Data`
- Running SQL select queries and mapping records to structs using `sqlx::query_as`
- Binding decimal numbers (`f64`) to SQL query arguments for price fields
- Catching SQL query execution failures and returning appropriate HTTP responses
- Loading database URLs from local configuration environments
- Constructing JSON responses representing database collections

---

## Notes
- `f64` price fields are mapped to floating-point columns in SQL; in production, decimal types (like `sqlx::types::BigDecimal`) are preferred to prevent rounding errors.
- Using `PgPool::connect` connects to PostgreSQL databases, checking connection parameters immediately upon startup.
- Try creating the database schemas, adding products and customers, and listing items to verify database CRUD operations.