# Project 082 – Interactive Quiz Engine (CSV-Based Quiz Game)

## Code
Loads quiz questions from a CSV file using Serde, offering difficulty choices to limit the question count, evaluating user answers case-insensitively, and scoring progress.

---

## Problem
Interactive terminal games require parsing data tables from files, validating user menu choices, looping questions, comparing text inputs, and formatting percentages.

---

## Goal
Build a CSV-based quiz game that parses question lists, manages difficulty selections, validates keyboard inputs, and prints final scores.

---

## What I Learn
- Deserializing file rows to structures using `csv::ReaderBuilder` and Serde
- Parsing user menu choices and applying defaults on invalid inputs
- Iterating vectors of structures up to calculated length limits using `min` and `take`
- Prompting and reading user inputs using `stdin` and flushing stdout
- Performing case-insensitive string comparisons using `eq_ignore_ascii_case`
- Converting integers to floats (`score as f32`) to calculate percentage rates
- Structuring tabular data using custom formats in CSV files

---

## Notes
- CSV parsing loads all questions into memory; for massive databases, loading records on the fly keeps memory usage low.
- `eq_ignore_ascii_case` is a standard string method that performs case-insensitive comparisons without allocating new uppercase/lowercase strings.
- Try creating a `questions.csv` containing columns like "question,answer" and run the quiz game to test.
