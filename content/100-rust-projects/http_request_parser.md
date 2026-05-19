# Project 052 – HTTP Request Parser

## Code
Implements a multi-threaded HTTP server that reads raw socket inputs, parses the request lines, and writes back a standard HTTP/1.1 response containing an HTML page.

---

## Problem
Web servers must listen to incoming socket streams, parse text headers to understand client intents, and respond using standard HTTP/1.1 protocols.

---

## Goal
Build a terminal HTTP server that parses request bytes, extracts request headers, and writes compliant HTML responses.

---

## What I Learn
- Binding TCP socket ports and accepting stream inputs using `std::net::TcpListener`
- Reading socket packets into static byte array buffers (`[u8; 1024]`)
- Converting raw bytes to text strings using `String::from_utf8_lossy`
- Parsing HTTP lines and extracting request lines (`GET / HTTP/1.1`) using iterators
- Spawning handler threads for each request to prevent connection blockages
- Structuring raw HTTP response header templates (`HTTP/1.1 200 OK\r\n...`)
- Flushing write buffers to guarantee connection completion before socket termination

---

## Notes
- `String::from_utf8_lossy` replaces invalid UTF-8 sequences with the replacement character ``, preventing parsing panics on binary socket data.
- The `\r\n\r\n` sequence in HTTP responses is critical; it marks the end of headers and the beginning of the body.
- Try loading the server URL (`http://127.0.0.1:8080`) in a web browser to view the HTML page.
