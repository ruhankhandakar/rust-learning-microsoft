# Project 055 – WebSocket Echo Server

## Code
Implements an asynchronous WebSocket echo server using `tokio` and `tokio-tungstenite`, spawning async tasks to handle connections, parse frames (text, binary, ping), and echo them back.

---

## Problem
Standard TCP sockets transmit raw bytes. Web clients need structured WebSocket connections to stream text and binary frames bidirectionally without HTTP overhead.

---

## Goal
Build an asynchronous WebSocket Echo Server that handles connection handshakes, splits read/write streams, parses message types, and returns echo frames.

---

## What I Learn
- Writing asynchronous entry points using the `#[tokio::main]` macro attribute
- Binding async TCP listener loops using `tokio::net::TcpListener`
- Upgrading standard TCP sockets to WebSocket connections using `accept_async`
- Splitting WebSocket connections into write and read channels using `.split()`
- Consuming message streams asynchronously using the `futures_util::StreamExt` trait
- Pattern matching incoming frames (Text, Binary, Ping, Close)
- Sending message streams back asynchronously using the `futures_util::SinkExt` trait

---

## Notes
- Asynchronous tasks spawned with `tokio::spawn` run concurrently on a multi-threaded work-stealing scheduler, keeping the main loop responsive.
- Splitting the WebSocket stream into `write` and `read` channels allows handling reads and writes independently without resource conflicts.
- Try testing the server using browser-based console scripts or command-line WebSocket clients (like `wscat`).