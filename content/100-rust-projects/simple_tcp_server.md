# Project 049 – TCP Server

## Code
Implements a multi-threaded TCP echo server listening on `127.0.0.1:7878` that spawns a thread for each incoming connection to read and echo back messages.

---

## Problem
Network servers need to handle multiple clients concurrently, reading incoming streams line-by-line and writing replies without blocking other connections.

---

## Goal
Build a multi-threaded TCP Echo Server that binds to local ports, spawns worker threads, processes client inputs, and returns echo messages.

---

## What I Learn
- Binding local network sockets using `std::net::TcpListener`
- Accepting incoming socket streams using `listener.incoming()` iterators
- Spawning handler threads using `thread::spawn` to manage concurrent connections
- Cloning socket references safely using `stream.try_clone` for split I/O reads/writes
- Reading network sockets line-by-line using `BufReader` and `lines()`
- Writing raw byte responses to connection streams using `write_all`
- Retrieving client connection details using `stream.peer_addr`

---

## Notes
- Cloning a `TcpStream` creates a new handle pointing to the same socket, allowing one thread to read while another writes.
- Spawning a new OS thread per connection is simple but does not scale to thousands of active connections; asynchronous runtimes (like Tokio) are preferred for high-concurrency applications.
- Try testing the server using utility tools like `nc` or `telnet` (e.g. `nc 127.0.0.1 7878`) to verify it echoes inputs.
