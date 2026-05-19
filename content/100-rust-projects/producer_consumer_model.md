# Project 039 – Producer-Consumer Model

## Code
Implements the Producer-Consumer pattern using a bounded channel (`sync_channel(3)`), running a fast producer and a slow consumer on separate threads to demonstrate backpressure.

---

## Problem
In pipeline processing, fast data sources can overwhelm slower targets, exhausting system memory. Restricting the transmission queue size applies backpressure, forcing sources to slow down.

---

## Goal
Build a thread demonstration of the Producer-Consumer pattern, using bounded channels to limit queue sizes and observing task flow rates.

---

## What I Learn
- Producer-Consumer thread architectures using communication channels
- Bounded buffers using `std::sync::mpsc::sync_channel` with defined capacity rules
- Backpressure behaviors where the sender blocks when the queue reaches capacity
- Custom synchronization loops using sleep timers to represent heavy workloads
- Consuming channels using implicit iterators like `while let Ok(task) = rx.recv()`
- Moving variable bounds into thread closures
- Main thread synchronization strategies to wait for consumer completion

---

## Notes
- `sync_channel(3)` blocks the producer on `.send()` if there are already 3 unprocessed items in the channel, preventing infinite queue growth.
- The consumer loop terminates automatically when the producer exits and the channel's transmitter is dropped, signaling there are no more tasks.
- Try changing the buffer size to 1 or 10 to see how the task pacing changes in the logs.
