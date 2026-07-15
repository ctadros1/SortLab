# Audio engine

SortLab audibilizes sorting operations with a clean-room TypeScript/Web Audio implementation. It
was designed after studying the public behavior and architecture of Timo Bingmann's
[The Sound of Sorting](https://github.com/bingmann/sound-of-sorting), including the repository at
commit `5cfcaf752593c8cbcf52555dd22745599a7d8b1b`, its README, authorship file, GPL-3.0 license, and
sound-related C++ files.

## Licensing conclusion and attribution

The reference project is licensed under GPL-3.0. SortLab does not copy, translate, compile, embed,
or distribute its C++ source. The browser engine independently implements documented behavior and
general DSP concepts: value-derived pitch, triangular oscillation, an ADSR-style gain envelope,
bounded oscillator mixing, comparison-triggered notes, and gain reduction under polyphony. The
reference repository remains inspiration and technical background, not a code dependency.

If future work directly adapts reference source, stop before merging it and assess the resulting
GPL obligations for the full distributed work. Do not paste reference code into this project under
the current licensing model.

## Architecture

- `AudioEngine.ts` owns the single, lazily created `AudioContext`, master gain,
  `DynamicsCompressorNode`, voice set, preferences, lifecycle listeners, completion sequence, and
  diagnostics.
- `AudioVoice.ts` owns one oscillator and its gain node. It schedules a short note, cancels safely,
  disconnects nodes after release, and notifies the engine exactly once.
- `AudioScheduler.ts` deterministically samples dense event streams. It caps effective note density
  without relying on wall-clock race conditions.
- `frequencyMapping.ts` maps the active dataset range to pitch and optionally quantizes it.
- `envelopes.ts` validates envelope values and schedules click-free ramps.
- `presets.ts` defines the shared Classic, Soft, and Minimal presets.
- `preferences.ts` loads and stores the compact Visualize preferences.

The context is created only after a user action attempts playback. It is reused for the whole app.
Route changes, stop, pause, reset, visibility changes, component cleanup, and Sandbox worker
cancellation all release active voices.

## Frequency mapping

Classic maps the minimum and maximum values in the active dataset linearly to 120 Hz and 1,212 Hz.
The mapper accepts negative values, clamps values outside the supplied range, returns the midpoint
for equal-value arrays, and never returns `NaN` or infinity. Sandbox can choose:

- Continuous: no pitch quantization
- Chromatic: nearest semitone
- Pentatonic: nearest major-pentatonic degree
- Major scale: nearest major-scale degree

Visualize does not expose pitch modes; its preset chooses the mode.

## Envelope and waveform

Classic uses a triangle oscillator with attack `0.006 s`, decay `0.026 s`, sustain level `0.34`,
release `0.05 s`, and note duration `0.07 s`. The engine uses scheduled gain ramps rather than
abrupt gain changes. Sandbox additionally supports sine, square, and sawtooth waveforms and exposes
the envelope controls.

## Event mapping

Comparisons are primary and play the compared values. Swap and pivot events use short accents;
writes are available but disabled by the core presets; completion uses six sampled ascending notes
rather than one note for every value. Stopping or navigating cancels the sequence cleanly.

## Polyphony and loudness

Classic permits at most 12 simultaneous voices. When the limit is reached, the oldest voice is
released before a new one is admitted. With automatic normalization enabled, per-voice gain is
scaled using `1 / sqrt(activeVoiceCount + 1)` and then multiplied by the preset gain. A conservative
master gain and compressor prevent dense comparison bursts from clipping or jumping abruptly in
loudness.

## High-speed density

The scheduler derives a deterministic sampling stride from preset density and playback speed.
Detailed samples most events, Balanced samples dense streams, and Sparse increases the stride and
reduces polyphony. Swap and pivot accents remain favored. This keeps Maximum-mode playback audible
without attempting to create a note for every streamed operation.

## Product controls

Visualize intentionally exposes only Sound, Volume, and Classic / Soft / Minimal. Waveform, pitch,
frequency range, ADSR, density, polyphony, per-operation toggles, and normalization remain in
Sandbox's Audio settings disclosure. Both experiences configure the same engine.

## Adding a preset

1. Add a typed `SoundPresetId` in `src/audio/audioTypes.ts`.
2. Register the complete configuration in `src/audio/presets.ts`.
3. Keep levels conservative and use non-zero attack and release times.
4. Add preset, persistence, density, and cancellation tests.
5. Verify Visualize remains limited to the approved compact presets.

## Tests

Unit tests cover frequency boundaries, equal and negative datasets, clamping, musical quantization,
ADSR scheduling, voice limiting, inverse-square-root normalization, deterministic density,
cancellation, context reuse, preset integrity, persistence, and route cleanup. Browser tests verify
user-gesture initialization, mute and volume, all Visualize presets, stop and route cancellation,
high-speed playback, and console cleanliness.
