# Project 031 – Plugin System with Traits

## Code
Defines a generic `Plugin` trait and three concrete implementations (Uppercase, Reverse, Duplicate) that are stored in a vector of boxed trait objects and executed dynamically.

---

## Problem
In modular software, components need to be loaded, registered, and executed dynamically at runtime without the main application knowing their specific compile-time types.

---

## Goal
Build a dynamic plugin system that stores diverse plugin behaviors in a single container utilizing trait objects and box allocation, executing selections dynamically.

---

## What I Learn
- Trait declarations defining shared interfaces (`Plugin`) with generic signatures
- Dynamic dispatch utilizing trait objects (`dyn Plugin`) inside heap boxes (`Box<dyn Plugin>`)
- Heterogeneous collections storing different concrete types in a single vector (`Vec<Box<dyn Plugin>>`)
- Dynamically routing function calls via trait dispatch hooks
- Safe array boundary matching using range validations (`1..=plugins.len()`)
- Parsing inputs to array indices with appropriate offset conversions (`num - 1`)
- Standard console prompting loops referencing trait elements

---

## Notes
- Trait objects (`dyn Trait`) run using dynamic dispatch, which uses vtables at runtime and carries a minor performance cost compared to static templates.
- A trait is only "object safe" (can be turned into a trait object) if its methods do not return `Self` and do not use generic type parameters.
- Try implementing a new plugin (e.g. `Rot13Plugin` or `SlugifyPlugin`) and register it in the plugins vector.
