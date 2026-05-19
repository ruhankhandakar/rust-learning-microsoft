# Project 079 – Text Adventure Game (CLI RPG)

## Code
Implements a text adventure game in the console, modeling room layouts as an enum, managing player states, and evaluating user commands to update room locations.

---

## Problem
Text adventure games and command engines must track application state, parse string inputs, match inputs to state-action pairs, and manage inventories.

---

## Goal
Build a terminal text RPG that models player states and rooms, parses inputs, and updates game states.

---

## What I Learn
- Representing distinct game locations using enums (`Room`)
- Tracking player inventories and names inside mutable structs (`Player`)
- Matching state-action pairs using pattern matching (e.g. `(Room, command)`)
- Adding items to dynamic arrays using `inventory.push()`
- Checking item existence in vectors using `inventory.contains`
- Standardizing user inputs using `.to_lowercase()`
- Controlling the main game loop and exiting on win conditions

---

## Notes
- Pattern matching on state-action tuples (`(&player.current_room, command.as_str())`) prevents invalid transitions (like searching the cave while in the forest).
- The game loop runs indefinitely until the player enters the treasure room, which triggers a `break` statement.
- Try adding a new room (e.g. "Castle") or item (e.g. "Sword") and map new command transitions in the match block.