# Project 065 – JWT Authentication in Actix-Web

## Code
Implements JSON Web Token (JWT) authentication, signing tokens on successful logins, verifying headers on protected paths, and decoding payloads.

---

## Problem
Securing APIs requires verifying user identities without maintaining server-side session databases. Signed JWT tokens allow stateless authentication.

---

## Goal
Build a token verification server that encodes claims upon credential validation, inspects request headers, decodes JWT signatures, and restricts access.

---

## What I Learn
- Formatting and signing JWT token payload structures using the `jsonwebtoken` crate
- Setting expiration rules for token lifecycles using `chrono::Utc` timestamps
- Retrieving and reading specific request headers using the `HttpRequest` handle
- Extracting bearer token structures from header values using string prefixes
- Decoding and validating tokens with signature keys and validation settings
- Returning `401 Unauthorized` responses for invalid or missing tokens
- Decoupling user session states from memory databases

---

## Notes
- HS256 algorithm uses symmetric signing, meaning the same secret key is used to both sign new tokens and verify existing tokens.
- Keep the secret key secure and change it in production environments; weak keys are vulnerable to offline brute-force attacks.
- Try making a request to the protected route without a token, and then with a signed token generated via login to test security paths.
