# Project 009 – Prime Number Checker

## Code
Validates whether a user-entered number is prime, and compiles a list of all prime numbers leading up to that value.

---

## Problem
Many cryptographic and mathematical routines depend on identifying prime numbers, requiring fast primality test loops and modular filters to build sequences of primes.

---

## Goal
Build a command-line tool that tests a positive integer for primality, finds all primes up to that number, and prints the results.

---

## What I Learn
- Primality test algorithm optimizing checking limits to `(n as f64).sqrt()`
- Safe float casting using `as` to perform square root math on integer values
- Inclusive range syntax (`2..=n`) in loops to ensure bounds are evaluated
- Custom helper functions returning vectors (`Vec<u32>`) of calculated values
- Boolean flags and short-circuit logic inside conditional loops
- Input validation to reject numbers less than or equal to 1
- Performance optimizations like skipping even numbers in primality checks

---

## Notes
- Calculating the square root of `n` as a loop limit reduces the time complexity of checks from $O(n)$ to $O(\sqrt{n})$.
- Standard integer parsing can fail if a user enters a number too large for `u32`; error checks are needed to catch overflow.
- Try entering a large prime (e.g., 7919) to test the efficiency of the trial division algorithm.