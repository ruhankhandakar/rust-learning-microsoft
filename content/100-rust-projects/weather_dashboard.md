# Project 073 – Weather Dashboard (Yew + External API)

## Code
Implements a Yew weather dashboard that queries the OpenWeatherMap API, parsing temperature and humidity stats from JSON responses and rendering them dynamically.

---

## Problem
Web dashboards need to fetch data from external APIs based on user inputs, deserialize nested JSON structures, and display loading states during requests.

---

## Goal
Build a Yew weather client that takes user inputs, sends queries to the OpenWeatherMap API, deserializes results, and displays metrics.

---

## What I Learn
- Fetching data from public APIs using `gloo_net::http::Request`
- Triggering side-effect fetches on state changes using Yew's `use_effect_with` hook
- Deserializing nested JSON API responses into matching Rust structure shapes
- Capturing keyboard inputs and input events from text input elements
- Spawning asynchronous futures in WASM environments using `wasm_bindgen_futures`
- Logging parse errors and network failures to the browser console
- Conditionally rendering HTML elements based on state checks

---

## Notes
- To query weather data, you must replace `YOUR_API_KEY` in the source code with a valid key from openweathermap.org.
- The browser will block requests to external APIs if the API does not support Cross-Origin Resource Sharing (CORS).
- Try searching for different cities and check the console logs to see the structure of the returned JSON data.
