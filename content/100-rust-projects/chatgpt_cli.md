# Project 091 – ChatGPT API CLI Tool (OpenAI-powered)

## Code
Prompts user queries in the terminal and sends HTTP POST requests to the OpenAI Chat Completions API using `reqwest`, serializing the message payload and handling API errors.

---

## Problem
Building CLI integrations with web APIs requires handling dynamic client payload formats, loading authorization tokens, sending headers, and matching JSON responses.

---

## Goal
Build a terminal OpenAI assistant client that loads environment variables, sends chat futures, handles success JSONs, and prints API errors.

---

## What I Learn
- Initializing async main runtimes using the `#[tokio::main]` wrapper
- Loading local credentials from `.env` configuration files using the `dotenvy` library
- Constructing and formatting API authorization headers with Bearer tokens
- Serializing OpenAI request bodies containing message history lists with Serde
- Deserializing success payloads (`ChatResponse`) and error payloads (`ApiError`) conditionally
- Handling JSON parsing errors and matching fallback raw text blocks
- Buffering keyboard line inputs and flushing console prompts

---

## Notes
- To use the client, you must set a valid `OPENAI_API_KEY` environment variable in a local `.env` file.
- The program uses a conditional deserialize pattern (first attempting `ChatResponse`, then `ApiError`) to handle unexpected API response shapes.
- Try asking the assistant questions and check the raw response prints to explore token usage and response metadata.
