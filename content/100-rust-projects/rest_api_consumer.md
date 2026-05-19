# Project 053 – REST API Consumer

## Code
Fetches random jokes from a public REST API endpoint using the `reqwest` crate and parses the JSON response into a strongly typed struct using `serde::Deserialize`.

---

## Problem
Integrating with web services requires sending HTTP GET requests, verifying network statuses, parsing JSON response payloads, and mapping them to structured fields.

---

## Goal
Build a terminal REST client that queries joke API endpoints, deserializes JSON structures into typed fields, and prints outputs.

---

## What I Learn
- Blocking GET network requests using `reqwest::blocking::get`
- Deserializing JSON structures into typed structs using `#[derive(Deserialize)]`
- Overriding reserved language keywords in structs using raw identifiers (e.g. `r#type`)
- Parsing JSON responses directly using the `json::<T>` helper method
- Returning dynamic error pointers (`Box<dyn std::error::Error>`) from network tasks
- Prompting console user interactions before sending requests
- Declaring external network features in project configuration structures

---

## Notes
- Raw identifiers like `r#type` allow developers to use Rust keywords (like `type`) as struct field names without compiler errors.
- The `json::<T>()` method uses Serde under the hood to convert response strings into structures, validating shapes automatically.
- Try changing the target endpoint to query other public APIs (like weather or facts) and verify how structures decode.
