# Project 047 – File Encryption Tool

## Code
Performs symmetric AES-256-CTR file encryption and decryption using a 32-byte hexadecimal key, applying the cipher stream to encrypt/decrypt files on disk.

---

## Problem
Securing sensitive files requires applying robust cryptographic standards. Symmetric encryption encrypts and decrypts files using a shared key and initialization vectors.

---

## Goal
Build a file encryption tool that parses 32-byte hex keys, instantiates an AES-256 CTR stream cipher, and encrypts/decrypts files.

---

## What I Learn
- AES-256 CTR (Counter Mode) encryption using the `aes`, `cipher`, and `ctr` crates
- Parsing hexadecimal key strings into byte arrays using the `hex` crate
- Instantiating stream ciphers using shared initialization vectors (`IV`) and keys
- In-place byte modification using `apply_keystream` to encrypt or decrypt data buffers
- Reading files to binary buffers with `fs::read` and saving them with `fs::write`
- Reusing symmetric cipher functions since CTR mode encryption and decryption use the same XOR operation
- Handling hex decoding failures during key parsing

---

## Notes
- AES-256-CTR uses symmetric XOR operations, meaning calling the encryption logic twice with the same key and IV restores the original text.
- In production, using a fixed static initialization vector (IV) compromises security; IVs must be randomly generated and stored alongside encrypted files.
- Try generating a random 32-byte hex string (64 characters) to use as the encryption key.
