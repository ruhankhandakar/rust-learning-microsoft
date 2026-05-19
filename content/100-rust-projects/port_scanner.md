# Project 054 – Port Scanner

## Code
Scans a target host's port range (1 to 1024 by default), checking for open ports using connection timeouts on TCP socket addresses.

---

## Problem
Network security tools need to identify open services on hosts. Scanning ports requires resolving domain names, iterating ports, and using connection timeouts to skip closed ports.

---

## Goal
Build a terminal port scanner that parses hosts and port ranges, resolves domain names, tests connections with timeouts, and logs open ports.

---

## What I Learn
- Resolving DNS hostnames and ports to socket addresses using `to_socket_addrs`
- Checking TCP port availability using timeout limits with `TcpStream::connect_timeout`
- Configuring timeout durations using `std::time::Duration::from_millis`
- Iterating inclusive port ranges using range generators (`start..=end`)
- Matching IP formats and socket structures using the `SocketAddr` type
- Safe type parsing converting string choices to 16-bit integers (`u16`)
- Handling offline hosts or DNS lookup failures gracefully

---

## Notes
- `to_socket_addrs()` can return multiple IP addresses for a single host (like IPv4 and IPv6 variants); scanning loops must iterate over all returned addresses.
- Using a short timeout (e.g. 300ms) speeds up scans but might miss open ports on high-latency networks.
- Try scanning your local loopback address (`127.0.0.1`) after running the TCP Echo Server (Project 049) to verify it detects port 7878.
