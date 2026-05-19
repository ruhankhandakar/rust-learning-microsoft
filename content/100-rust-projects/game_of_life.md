# Project 090 – Conway’s Game of Life (Terminal Grid Simulation)

## Code
Implements Conway's Game of Life in the terminal, managing grid state arrays, counting active neighbors, and clearing the screen on iterations using ANSI escape codes.

---

## Problem
Terminal-based simulations require managing cell states, counting neighbors while handling index boundaries, and updating displays smoothly at fixed intervals.

---

## Goal
Build Conway's Game of Life in the terminal, configuring initial glider seeds, executing state ticks, and drawing grid maps.

---

## What I Learn
- Representing fixed-size grid matrices using two-dimensional arrays
- Clearing terminals and resetting cursors using ANSI escape codes (`\x1B[2J\x1B[1;1H`)
- Counting neighbor cells using wrapping addition (`wrapping_add`) to avoid out-of-bounds errors
- Applying Conway's cell survival rules via pattern matching (e.g. `(alive, neighbors)`)
- Seeding initial glider patterns on coordinates
- Implementing delay intervals between simulation steps using `std::thread::sleep`
- Rendering grids in the console using emoji block characters

---

## Notes
- `wrapping_add` prevents index panics on grid boundaries, though it causes the grid edge cells to wrap around.
- Pattern matching on state-neighbor count tuples simplifies the survival rule logic.
- Try changing the glider seed location or size variables to explore different simulation dynamics.
