# Project 075 – Admin Dashboard UI with Yew

## Code
Implements a Yew admin dashboard UI featuring metrics cards, simulating a database delay using `gloo_timers` to update metric states.

---

## Problem
Dashboard interfaces must display key metrics, pass properties to child components, and handle asynchronous data updates from background services.

---

## Goal
Build a Yew dashboard interface that uses child components, handles property parameters, and simulates data loading delays.

---

## What I Learn
- Defining reusable UI components using properties with `#[derive(Properties)]`
- Rendering child components and passing values to properties
- Simulating asynchronous data fetches using `gloo_timers::callback::Timeout`
- Managing global dashboard states using functional component state hooks
- Styling elements in Yew using inline style strings
- Binding WASM startup entry points using `#[wasm_bindgen(start)]`
- Formulating floating-point numbers into currency formats

---

## Notes
- Yew properties require implementing `PartialEq` so the framework can skip re-rendering child components if properties have not changed.
- `Timeout::forget` keeps the timer active in the browser background; failing to forget or keep the timer handle drops it immediately, preventing execution.
- Try adding a new metric card (e.g. "Conversion Rate") and verify it updates along with other cards.
