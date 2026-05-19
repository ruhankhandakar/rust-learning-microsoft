# Project 097 – CLI Soundboard App (with rodio Audio Playback)

## Code
Implements a command-line soundboard using the `rodio` crate, letting users choose options to decode and play audio tracks through their system's default output devices.

---

## Problem
Building audio interfaces requires accessing default OS sound cards, decoding encoded audio files (such as WAV or MP3 files), and managing playbacks.

---

## Goal
Build a terminal soundboard that maps key choices, instantiates audio output streams, decodes WAV files, and plays tracks.

---

## What I Learn
- Instantiating audio output devices and stream handles using `OutputStream::try_default`
- Managing audio playbacks and tracks using `rodio::Sink`
- Opening files and buffering readers using `std::fs::File` and `BufReader`
- Decoding WAV file streams asynchronously using `rodio::Decoder`
- Feeding audio decoder sources to output sinks using `.append`
- Blocking execution thread tracks until playback completes using `sleep_until_end`
- Mapping user selections to audio paths using a `HashMap`

---

## Notes
- Letting the `OutputStream` variable (`_stream`) fall out of scope immediately terminates audio playback, so it must be kept alive for the duration of the sound.
- `rodio` utilizes the standard `cpal` library to communicate with OS audio APIs (such as ALSA on Linux, CoreAudio on macOS, or WASAPI on Windows).
- Try adding a new sound effect (WAV format) in the `sounds/` directory, map it in the choices map, and play it.
