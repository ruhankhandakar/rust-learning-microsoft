# Project 092 – Browser Automation with Fantoccini (WebDriver Client in Rust)

## Code
Automates browser actions using the `fantoccini` crate, connecting to a WebDriver server to navigate to target URLs, click page links, and capture screenshots.

---

## Problem
Performing automated website testing or web scraping requires running actual browser engines (like Chrome or Firefox) to execute JavaScript and capture layouts.

---

## Goal
Build a WebDriver client in Rust that drives browser navigation, queries page titles, clicks element links, and writes screenshot files.

---

## What I Learn
- Connecting to WebDriver server ports (e.g. Chrome's ChromeDriver) using `ClientBuilder`
- Directing browser navigations asynchronously using the `goto` method and `.await`
- Querying active browser page properties like document titles
- Locating DOM elements matching search criteria using `Locator` parameters
- Automating clicks on located elements using the WebDriver protocol
- Capturing raw PNG screenshot buffers and writing files to disk
- Shutting down browser sessions cleanly using `close`

---

## Notes
- A WebDriver service (like `chromedriver` on port 9515 or `geckodriver` for Firefox) must be running locally for the script to execute successfully.
- `fantoccini` is an asynchronous high-level WebDriver client designed to interface directly with W3C WebDriver endpoints.
- Try running ChromeDriver in the background, executing the automation script, and inspecting the generated `screenshot.png`.
