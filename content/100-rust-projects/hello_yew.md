# Project 071 – Hello Yew App

## Code
Implements a client-side web application using the Yew web framework, managing an interactive counter state with functional components and compiling to WebAssembly.

---

## Problem
Building dynamic single-page web applications (SPAs) typically requires JavaScript. Running Rust in browser engines requires compiling code to WebAssembly and rendering HTML trees.

---

## Goal
Build a basic web interface using Yew, managing page state hooks, attaching event callbacks, and rendering HTML templates.

---

## What I Learn
- Structuring web page components in Rust using the Yew framework
- Compiling libraries to WebAssembly formats using `cdylib` and `rlib` configurations
- Managing component-level counter states using Yew's `use_state` hook
- Attaching event bindings to button clicks using the `Callback` type
- Instantiating and rendering root components using `yew::Renderer`
- Configuring interface features like window handles using the `web-sys` crate
- Creating HTML layouts using the Yew framework's `html!` macro

---

## Notes
- WebAssembly applications run inside a browser sandbox, meaning they cannot directly invoke native OS APIs (such as file I/O or network bindings) without JS bridges.
- The `use_state` hook triggers a component re-render every time the inner value changes, keeping the DOM synchronized with state changes.
- Try installing the Trunk compiler (`cargo install trunk`) and running `trunk serve` to view the Yew app in your local browser.
