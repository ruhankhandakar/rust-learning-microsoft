# Project 086 – Time Zone Converter CLI

## Code
Converts datetime strings across timezones, validating inputs against IANA names and abbreviations with `chrono` and `chrono-tz`, and checking for DST gaps/ambiguities.

---

## Problem
Converting times across regions requires checking for IANA designations, mapping abbreviations (like EST), parsing formats, and handling DST changes.

---

## Goal
Build a timezone converter that accepts datetime inputs, maps abbreviations, handles local-to-target conversions, and flags DST errors.

---

## What I Learn
- Parsing and manipulating timezones using the `chrono-tz` crate
- Mapping common abbreviations (like PST, EST, GMT) to IANA timezone names using `HashMap`
- Handling the "now" keyword to fetch current UTC times and project them locally
- Parsing date and time strings across multiple formats using `NaiveDateTime::parse_from_str`
- Converting times from local to target zones using `from_local_datetime`
- Handling ambiguous DST transitions (when clocks fall back) using `LocalResult::Ambiguous`
- Handling non-existent times (when clocks spring forward) using `LocalResult::None`

---

## Notes
- Timezone abbreviations are not unique (e.g. "CST" can mean Central Standard Time in North America or China Standard Time), so mapping them requires making assumptions.
- Daylight Saving Time shifts create ambiguous states where the same clock time occurs twice, or nonexistent states where clock times are skipped.
- Try entering a datetime during a DST transition (e.g. spring forward or autumn fallback) to check how the converter handles anomalies.
