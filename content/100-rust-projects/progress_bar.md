# Project 078 – Command-Line Progress Bar (with indicatif)

## Code
Displays an animated, colored command-line progress bar using the `indicatif` crate, updating progress states inside loops and using thread sleeps to simulate task durations.

---

## Problem
Command-line utilities running long-running operations need to show progress to prevent users from thinking the application has frozen.

---

## Goal
Build a terminal utility that displays animated progress bars, customize progress style templates, and print success messages.

---

## What I Learn
- Instantiating and configuring progress bars using the `indicatif::ProgressBar` struct
- Setting custom progress styles and layouts using `ProgressStyle::with_template`
- Configuring custom animation characters (e.g. `=>-` for progress bars)
- Updating bar messages dynamically using `set_message`
- Incrementing progress states sequentially using `inc(1)`
- Simulating long-running workloads using `std::thread::sleep`
- Finishing progress animations with custom success messages using `finish_with_message`

---

## Notes
- `indicatif` automatically handles terminal dimensions, wrapping text and sizing progress bars to fit the active terminal window.
- Using templates requires calling `unwrap()` because invalid template syntax strings will trigger style parsing failures.
- Try changing the sleep duration and progress character styling to customize the animation.