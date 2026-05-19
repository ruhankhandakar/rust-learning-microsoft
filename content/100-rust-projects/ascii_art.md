# Project 084 – Generative ASCII Art Tool

## Code
Generates mathematical wave patterns and random static patterns in the terminal, mapping coordinate brightness levels to character density arrays.

---

## Problem
Rendering retro graphical animations in terminal interfaces requires translating coordinates to pixels and mapping values to ASCII character arrays.

---

## Goal
Build an ASCII art generator that takes menu selections, calculates wave equations, maps floats to density characters, and renders grids.

---

## What I Learn
- Rendering retro terminal grid coordinates using nested loops
- Implementing sinusoids and cosines using standard math constants like `std::f64::consts::PI`
- Normalizing values (like sinusoids) to fit standard float bounds (`0.0` to `1.0`)
- Generating random floats using the external `rand::Rng` helper trait
- Mapping values to character arrays by index rounding
- Flushing outputs and reading console inputs
- Drawing coordinate lines without allocating intermediate buffers

---

## Notes
- The wave pattern uses standard mathematical normalization: `(fx.sin() + fy.cos() + 2.0) / 4.0` guarantees that values map to the 0-1 range.
- Terminal character heights are usually taller than widths, meaning circles can look like ovals unless adjusted for aspect ratio.
- Try tweaking the wave multiplier to change the density and frequency of the output pattern.
