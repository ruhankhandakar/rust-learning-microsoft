# Project 098 – WebAssembly Image Filter (Rust → WASM)

## Code
Implements an image processing utility compiled to WebAssembly, accepting raw image buffers via `wasm-bindgen`, converting pixels to grayscale, and returning PNG byte vectors.

---

## Problem
Running heavy image processing operations in pure JavaScript can be slow. Compiling Rust image processing libraries to WebAssembly enables fast performance in browsers.

---

## Goal
Build a WebAssembly library that parses binary image buffers, applies grayscale algorithms, writes PNGs, and returns arrays.

---

## What I Learn
- Exposing Rust functions to JavaScript using the `#[wasm_bindgen]` attribute
- Parsing byte buffers directly from memory using the `image::load_from_memory` utility
- Compiling image libraries into compact browser-compatible target formats (`cdylib`)
- Performing pixel grayscale color operations using the `image::grayscale` function
- Buffering output images to virtual memory structures using `std::io::Cursor`
- Saving processed buffers to standard formats (such as PNG or JPEG) via `write_to`
- Transferring ownership of raw byte vectors back to JavaScript environments

---

## Notes
- To load and run the generated WASM library in a browser, compile it using `wasm-pack build --target web` and call the exported function from JavaScript.
- The `image` crate features list in `Cargo.toml` must be configured with `default-features = false` to keep the compiled WebAssembly binary size small.
- Try adding a new image filter (e.g. blur or invert) and export it to JavaScript using the `wasm_bindgen` attribute.
