# Project 051 – Multi-Client Chat Server

## Code
Implements a multi-client chat server that tracks client socket streams in an `Arc<Mutex<HashMap>>`, spawning listener threads that broadcast incoming messages to all other active clients.

---

## Problem
Building a chat room requires accepting multiple client connections concurrently, maintaining a directory of active client handles, broadcasting messages, and purging dead connections immediately.

---

## Goal
Build a multi-client TCP chat server using thread-safe maps, spawning socket listeners, broadcasting timestamped messages, and removing disconnected clients.

---

## What I Learn
- Storing active socket streams in shared structures using `Arc<Mutex<HashMap<String, TcpStream>>>`
- Concurrent stream broadcasting by iterating mutably over socket collections
- Formatting RFC 3339 timestamps using the `chrono::Utc` crate
- Logging application events at INFO, WARN, and ERROR severity levels using `env_logger`
- Thread closures taking cloned thread-safe references (`Arc::clone`)
- Intercepting broadcast socket errors to detect and remove disconnected clients
- Safeguarding map write access across spawned threads using Mutex locks

---

## Notes
- Iterating and writing to socket connections requires locking the client map; if a write blocks, it will prevent other threads from sending messages until it times out.
- The `env_logger` library is initialized using `env_logger::init()`, which reads level configurations from the `RUST_LOG` environment variable.
- Try testing the chat room server by opening multiple shell terminals and connecting to `127.0.0.1:7878` using `nc`.
