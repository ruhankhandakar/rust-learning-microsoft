# Project 050 – TCP Client

## Code
Implements a TCP client that connects to `127.0.0.1:7878`, spawning a thread to continuously print incoming server messages while the main thread forwards console inputs to the server.

---

## Problem
Interactive network clients must listen for server updates while simultaneously accepting user keyboard inputs, which requires coordinating concurrent input and output.

---

## Goal
Build a terminal TCP client that connects to a server, spawns a listening thread, reads console inputs, and sends messages.

---

## What I Learn
- Connecting to remote TCP addresses using `std::net::TcpStream::connect`
- Spawning background threads to listen to socket streams asynchronously
- Reading socket inputs line-by-line using `BufReader` and `lines()`
- Reading user console inputs using `io::stdin().lock().lines()`
- Writing input lines to socket streams and appending newline delimiters (`\n`)
- Cleanly disconnecting when the user enters the "exit" command
- Handling server disconnects and exiting loops gracefully

---

## Notes
- `stream.try_clone()` duplicates the stream reference, allowing the background receiver thread to read while the main thread writes to stdin.
- Locking stdin with `stdin.lock()` prevents synchronization overhead, making input reading faster.
- Try running the client alongside the TCP Echo Server (Project 049) to verify bidirectional communication.
