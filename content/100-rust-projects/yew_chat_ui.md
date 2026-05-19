# Project 068 – Todo App / Yew Chat Client

## Code
Implements a frontend client using the Yew web framework, establishing WebSocket connections with `web-sys`, sending message logs on events, and rendering text lists.

---

## Problem
Building interactive web frontends in Rust requires compiling code to WebAssembly (WASM), handling user inputs, managing component state, and communicating via WebSockets.

---

## Goal
Build a Yew web frontend that connects to local WebSockets, captures input events, sends text payloads, and updates UI state dynamically.

---

## What I Learn
- Structuring frontend web components in Rust using the Yew framework
- Compiling Rust code to WebAssembly targets with `cdylib` crate settings
- Managing local component states using Yew's `use_state` hook
- Managing WebSocket connection objects using browser APIs via `web_sys::WebSocket`
- Binding input events and extracting input values from page elements
- Emitting callbacks on user actions using Yew's `Callback` utilities
- Registering connection side-effects using the `use_effect` hook

---

## Notes
- To compile and run Yew apps, developers use WASM builders like Trunk to bundle code and serve the application in a local browser.
- JavaScript callbacks are wrapped in Rust `Closure` elements, which must be explicitly forgotten (`onmessage.forget()`) to prevent them from being garbage-collected early.
- Try running the WebSocket Echo Server (Project 055), opening the Yew chat client in a browser, and sending messages to verify echo logs.
