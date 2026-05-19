# Project 033 – Polymorphic Shape Renderer

## Code
Calculates areas of custom geometric shapes (Circle, Rectangle, Triangle) by defining a shared `Shape` trait and storing dynamically created shapes in a vector of boxed trait objects.

---

## Problem
Graphics engines and CAD tools need to handle collections of different shapes, compute areas, and render them polymorphically without hardcoding type assertions.

---

## Goal
Build an area calculator that stores varied struct instances in a single dynamic vector, calculating areas dynamically using a shared trait.

---

## What I Learn
- Custom mathematical formulas implemented inside trait structures
- Rust's standard mathematical constants like `std::f64::consts::PI`
- Polymorphic collections represented by `Vec<Box<dyn Shape>>`
- Heap-allocating structs inside boxes (`Box::new`) to resolve varying type sizes
- Trait bounds defining shared calculations (`area`) and descriptors (`name`)
- Iterating collections of dynamic trait objects using `iter` loops
- Parsing options to dynamically instantiate and add shapes to vectors

---

## Notes
- The shapes vector must contain `Box<dyn Shape>` because `Circle`, `Rectangle`, and `Triangle` have different sizes in memory, so they cannot be stored directly in a vector.
- `Box` allocation transfers ownership to the heap, representing shape objects via standard word-sized pointers.
- Try implementing a new shape (e.g. `Square` or `Pentagon`) and verify it integrates with the existing calculation loops.
