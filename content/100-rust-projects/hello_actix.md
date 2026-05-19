# Project 061 – Hello Actix-Web App

## Code
Implements a basic Actix-web server hosting multiple routes, managing global visitor counts inside shared application states, logging access, and serving basic HTML and JSON query payloads.

---

## Problem
Building web services requires routing incoming HTTP requests to specific handler functions, parsing parameters from queries, returning different content-types, and tracking server metrics across connections.

---

## Goal
Build an Actix-web server that registers routes, shares thread-safe count variables, parses query structures, returns HTML/JSON payloads, and handles missing routes.

---

## What I Learn
- Registering routes using routing attributes like `#[get("/")]` and `#[post("/...")]`
- Managing shared state across connections using the `web::Data<T>` container
- Protecting application counts against write contentions using `std::sync::Mutex`
- Initializing system-wide server logs using `env_logger` and logging handlers
- Deserializing incoming client query parameters into structures using `web::Query`
- Formulating JSON responder structures and custom error structures
- Handling invalid paths using custom `.default_service()` fallbacks

---

## Notes
- Actix-web handler states are wrapped in `web::Data`, which is an `Arc` under the hood. Mutex locks must be used to perform mutations across threads.
- `env_logger` is initialized using environment filters, enabling control over log verbosity without re-compiling the binary.
- Try starting the server and making requests to `/greet?name=Rust` and `/metrics` using your browser.
