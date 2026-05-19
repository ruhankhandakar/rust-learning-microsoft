# Project 062 – REST API Server with Actix-Web

## Code
Implements a REST API server managing a collection of books stored in an in-memory vector protected by a Mutex, supporting GET requests to list books and POST requests to add books.

---

## Problem
In-memory web APIs must share data collections across threads, parse JSON payloads from client requests, and return data formatted in standard JSON arrays.

---

## Goal
Build a book registry server using Actix-web, wrapping dynamic vectors in thread-safe containers, deserializing request payloads, and outputting JSON book records.

---

## What I Learn
- Storing collections in shared memory using `web::Data<AppState>`
- Protecting vector modifications against concurrent thread access using Mutex locks
- Deserializing client JSON payloads using the `web::Json<T>` extractor
- Serializing list responses to JSON arrays automatically using Responder structures
- Binding routes to path targets using `web::get().to(...)` and `web::post().to(...)`
- Instantiating server configurations using `HttpServer::new` closures
- Structuring model types bounding them with Serde traits

---

## Notes
- `book.into_inner()` extracts the nested `Book` struct from the `web::Json<Book>` wrapper, transferring ownership of the parsed book.
- A standard Mutex blocks threads waiting for access; for high-performance databases, using databases or concurrent maps is preferred.
- Try testing the server by sending a POST request with a book JSON payload using tools like curl.
