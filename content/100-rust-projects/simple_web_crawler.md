# Project 038 – Simple Parallel Web Crawler

## Code
Crawls a collection of web URLs in parallel using 4 worker threads that read from a shared queue channel, fetching headers with the `reqwest` crate and handling network errors.

---

## Problem
Fetching many websites sequentially is slow due to network latency. Running requests in parallel speeds up crawls but requires sharing URLs, handling connection timeouts, and logging outcomes safely.

---

## Goal
Build a parallel web client using thread queues, fetching HTTP pages with `reqwest`, reporting errors, and dropping handles to exit cleanly.

---

## What I Learn
- Blocking HTTP client requests using `reqwest::blocking::get`
- Sharing a channel receiver endpoint across threads with `Arc<Mutex<Receiver<String>>>`
- Transmitting string URLs over threads using standard send channels
- Intercepting HTTP network failures and parsing error details safely
- Standard channel teardown using `drop(tx)` to notify threads that the queue is empty
- Rejoining handles to coordinate main program termination
- Adding and importing external network dependencies in package configurations

---

## Notes
- Explicitly calling `drop(tx)` drops the transmitter handle, allowing worker threads to exit their loops when the channel runs out of messages.
- The `reqwest` crate must be imported with the `blocking` feature flag enabled since standard `reqwest` APIs are asynchronous.
- Try introducing a parsing step to extract links from retrieved HTML and queue them back to the crawler.
