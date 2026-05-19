# Project 072 – Frontend Todo List (Yew + REST API)

## Code
Implements a Yew todo list frontend that fetches task data from a local REST API using `gloo-net`, loading tasks asynchronously and rendering them dynamically.

---

## Problem
Single-page web applications need to fetch data from backend servers, parse JSON lists, handle network latency, and update user interfaces once data arrives.

---

## Goal
Build a Yew task dashboard that triggers asynchronous GET requests, processes JSON arrays into structs, and displays records.

---

## What I Learn
- Fetching JSON lists from external server routes using `gloo_net::http::Request`
- Spawning asynchronous tasks inside WASM environments using `wasm_bindgen_futures::spawn_local`
- Triggering side-effect fetches on mount using Yew's `use_effect_with` hook
- Deserializing incoming JSON arrays into Rust vectors of structs using Serde
- Rendering HTML lists dynamically from vectors using map iterators
- Displaying loading indicators while asynchronous network queries are active
- Logging request errors to the browser console using `web_sys::console`

---

## Notes
- `wasm_bindgen_futures::spawn_local` allows running async futures on the browser's single-threaded event loop.
- If the backend API server is down, the console will show connection errors and the loading indicator will stop.
- Try running this frontend along with the PostgreSQL CRUD App (Project 067) to view your actual todo items in the browser.
