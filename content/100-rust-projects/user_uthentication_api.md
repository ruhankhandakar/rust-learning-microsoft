# Project 063 – User Authentication API (Actix-Web)

## Code
Implements a user registration and login API using Actix-web, hashing passwords with the `bcrypt` crate, storing credentials in a thread-safe map, and validating user logins.

---

## Problem
Web APIs handling user accounts must hash password strings securely before storage to prevent credential leaks, verify matching hash values during login, and prevent duplicate usernames.

---

## Goal
Build a user auth API that hashes passwords using Bcrypt, prevents username duplication, maps users in shared memory, and validates logins.

---

## What I Learn
- Secure password hashing using Bcrypt algorithms and salt costs (`bcrypt::hash`)
- Verifying stored password hashes against plaintext login attempts using `bcrypt::verify`
- Preventing duplicate registrations by checking key existence in a shared map
- Returning HTTP status codes (e.g. `201 Created`, `401 Unauthorized`, `409 Conflict`)
- Protecting user databases from data corruption using `Mutex` guards
- Extracting JSON structures directly inside routing arguments
- Designing API structures using Serde serialization and deserialization traits

---

## Notes
- Bcrypt salts passwords automatically during hashing, meaning hashing the same password twice yields different output strings.
- Using a high Bcrypt cost (e.g. 10+) increases CPU complexity to defend against brute-force attacks but adds latency to registration and login paths.
- Try registering a user and then attempt to log in using both correct and incorrect credentials to verify validation paths.
