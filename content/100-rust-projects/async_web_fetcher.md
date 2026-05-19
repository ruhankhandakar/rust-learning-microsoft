# Project 077 – Async Web Fetcher (Tokio + Reqwest)

## Code
Fetches web page content asynchronously using the `reqwest` crate, executing the async entry point within the `tokio` runtime and printing a body preview.

---

## Problem
Performing network requests synchronously blocks threads, wasting CPU cycles on network latency. Asynchronous runtimes allow programs to run other tasks while waiting for network responses.

---

## Goal
Build an asynchronous CLI web fetcher using Reqwest and Tokio, printing response lengths and body previews.

---

## What I Learn
- Initializing asynchronous main entry points using the `#[tokio::main]` macro
- Sending HTTP GET requests asynchronously using `reqwest::get` and `.await`
- Extracting response body text asynchronously using the `text()` method
- Handling network connection timeouts and HTTP errors using `reqwest::Error`
- Restricting text previews using range bounds and safe minimum helpers
- Configuring dependencies in `Cargo.toml` with specific async features
- Understanding future execution paths in async runtimes

---

## Notes
- The `#[tokio::main]` macro transforms the synchronous `fn main()` into an async executor wrapper that manages the thread pool.
- Running `.await` yields control back to the scheduler, allowing other spawned tasks to execute while waiting for network packets.
- Try changing the target URL to fetch JSON data from a public API and observe the output format.
