# Project 034 – Trait Object Demo (Dynamic Behavior Switching)

## Code
Demonstrates runtime behavior switching by binding a mutable pointer (`Box<dyn Greeter>`) to different structural implementations (Friendly, Formal, Sarcastic) based on user menus.

---

## Problem
Applications often require changing behaviors dynamically at runtime (such as swapping network strategies or changing user profiles) without restarting or rebuilding contexts.

---

## Goal
Build an interactive greeter app that switches greeting algorithms dynamically at runtime using boxed trait object references.

---

## What I Learn
- Runtime behavior switching by re-binding a mutable `Box<dyn Trait>` variable
- Defining dynamic interface traits (`Greeter`) that take reference parameters
- Zero-sized structures (`Friendly`, `Formal`, `Sarcastic`) acting as behavior capsules
- Dynamic dispatch handling string formatting calculations inside implementations
- Reassigning heap objects inside variable slots (`greeter = Box::new(...)`)
- Structuring menu controls matching selections to strategy assignments
- Dynamic method routing where the program determines the function path at runtime

---

## Notes
- Zero-sized types (ZSTs) do not allocate any actual heap space, meaning the generated box pointer contains metadata but does not trigger memory allocations.
- Re-binding boxed dynamic objects allows changing behaviors cleanly without using conditional logic branches everywhere in the app.
- Try creating a new behavior strategy and mapping it to a menu option to observe how dynamic routing changes.
