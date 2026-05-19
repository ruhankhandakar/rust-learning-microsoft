# Project 083 – Encrypted Notes Manager (AES Secure CLI)

## Code
Secures note logs on disk using AES-256-CBC encryption via `aes` and `cbc` crates, encoding encrypted blocks into hex formats, and decrypting notes line-by-line.

---

## Problem
Storing personal notes in plain text on disk poses security risks. Restricting access requires applying symmetric block ciphers, padding inputs to block lengths, and encoding data.

---

## Goal
Build a notes utility that takes notes from keyboard prompts, encrypts values using AES-256-CBC with PKCS7 padding, writes hex records, and decodes records.

---

## What I Learn
- AES-256 CBC (Cipher Block Chaining) encryption and decryption using `aes` and `cbc` crates
- Padding text to match block boundaries using `Pkcs7` padding algorithms
- Allocating encryption buffers to match padded sizes
- Encoding encrypted binary buffers to hex strings using the `hex` crate
- Appending encrypted data lines to files using `OpenOptions::append`
- Reading files line-by-line and decoding hex strings back to raw bytes
- Converting byte buffers to readable strings using `String::from_utf8_lossy`

---

## Notes
- AES-CBC mode requires an Initialization Vector (IV) to ensure that encrypting the same text twice yields different ciphertexts.
- In this demo, the key and IV are hardcoded in the binary; in production, keys should be derived from user-entered passwords using KDFs (like Argon2).
- Try running the notes manager, saving multiple notes, and inspecting the raw content of `notes.db` to verify encryption.
