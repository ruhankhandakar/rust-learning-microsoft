# Project 037 – Thread Pool

## Code
Implements a thread pool of worker threads that receive and execute closures via a shared channel, synchronizing queue access using thread-safe structures (`Arc` and `Mutex`).

---

## Problem
Spawning a new thread for every incoming task is resource-heavy and slow. Efficient systems pre-allocate a fixed pool of worker threads that wait for tasks from a shared channel.

---

## Goal
Build a thread pool manager that instantiates worker threads, shares an receiver queue using `Arc<Mutex>`, sends jobs as closures, and executes tasks.

---

## What I Learn
- Thread pool architecture using queues and thread-safety primitives
- Dynamic function traits representing single-run closures (`FnOnce()`)
- Sending boxed functions across thread bounds using `Send` and `'static` traits
- Sharing channel receiver ports across threads using `Arc<Mutex<mpsc::Receiver<Job>>>`
- Worker thread loop matching incoming channel values via lock synchronization
- Sending tasks from the thread pool to workers using `Sender` endpoints
- Coordinating task sleeps inside worker execution routines

---

## Notes
- Closures are wrapped in `Box<dyn FnOnce() + Send + 'static>` to define a uniform size and guarantee they can be safely sent to and run on other threads.
- Thread pools must handle graceful shutdowns; dropping the sender signals worker channels to close and worker loops to terminate.
- Try running the program with more tasks than workers to observe how workers queue and complete jobs.
