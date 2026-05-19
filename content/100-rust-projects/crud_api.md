# Project 064 – CRUD API with Actix-Web

## Code
Implements a RESTful CRUD API server managing blog posts stored in an in-memory `HashMap` guarded by a Mutex, supporting resource listing, retrieving by ID, creation, updates, and deletion.

---

## Problem
Web services must handle CRUD operations on target resources, extracting identifiers from URL paths, verifying resource existence, and returning appropriate HTTP responses.

---

## Goal
Build a CRUD API using Actix-web, mapping database operations to a thread-safe map, extracting path IDs, and validating requests.

---

## What I Learn
- Mapping REST routes to standard CRUD verbs (GET, POST, PUT, DELETE)
- Extracting parameter values from URL path segments using `web::Path<T>`
- Retrieving single values from maps and handling missing records safely
- Inserting and updating map records using shared Mutex write locks
- Deleting resources by key using `HashMap::remove`
- Returning structured JSON data formats representing collections
- Registering parameter routes using placeholder brackets (e.g. `/posts/{id}`)

---

## Notes
- Using `id.into_inner()` extracts the nested parameter value from the `web::Path<T>` wrapper, resolving it to the underlying type (e.g. `usize`).
- Changes made to the in-memory map are volatile; restarting the server clears all registered blog posts.
- Try creating a post with a POST request, querying it with a GET request, and then deleting it to test the full CRUD lifecycle.