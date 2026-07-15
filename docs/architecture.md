# Architecture

## System shape

SortLab is a static React + TypeScript + Vite application. Sorting, playback, sound, comparison, catalog filtering, and benchmarks run entirely in the browser. There is no backend, API, database, account system, or telemetry.

The production path is:

1. Node builds immutable hashed frontend assets.
2. Unprivileged Nginx serves the assets and SPA fallback.
3. Docker Compose binds only the dev-lab LAN IP and port.
4. Arcane discovers and manages the on-disk Compose project.

## Module boundaries

- `src/algorithms/engine.ts`: generator implementations, event snapshots, counters, and final correctness guard.
- `src/algorithms/registry.ts`: the single typed source for algorithm names, aliases, families, icon assignments, picker copy, complexity, traits, restrictions, education, warnings, and pseudocode.
- `src/data/datasets.ts`: typed dataset names, descriptions, miniature previews, constraints, and generation metadata.
- `src/components/RichCombobox.tsx`: shared ARIA combobox/listbox behavior, keyboard movement, optional search, grouped options, outside-click close, and focus restoration.
- `src/components/ControlSidebar.tsx`: selection, playback, audio, switch, slider, and help sections.
- `src/components/Icon.tsx`: the single Lucide icon vocabulary for routes, actions, algorithms, and datasets.
- `src/components/MathNotation.tsx`: semantic, accessible rendering of the registry’s bounded Big-O notation.
- `src/code/algorithmCode.ts`: typed seven-language snippets with stable semantic line IDs, token metadata, explanations, and guarded phase fallbacks.
- `src/components/CodePanel.tsx`: Code and Explain tabs, persisted language selection, active-line state, compact complexity, and traits.
- `src/components/EventProgress.tsx`: bounded, non-interactive event milestones with progress semantics.
- `src/hooks/useSortPlayer.ts`: event materialization, requestAnimationFrame playback, batching, shared audio-engine events, status, and history navigation.
- `src/components/BarVisualizer.tsx`: value-height mapping, patterns, markers, state legend, numeric-label density, and accessible narration.
- `src/audio/`: shared-context Web Audio engine, bounded voices, ADSR scheduling, frequency and scale mapping, deterministic density, normalization, presets, persistence, and cleanup.
- `src/sandbox/`: typed high-scale configuration, Canvas 2D renderer, compact operation queue, worker protocol, and worker implementations.
- `src/hooks/useSandboxPlayer.ts`: Sandbox worker lifecycle, backpressure, frame batching, renderer coordination, sampled audio, persistence, statistics, and completion state.
- `src/benchmark/benchmark.worker.ts`: identical copied arrays, warm-up, timed trials, medians, skip rules, and cooperative cancellation checkpoints.
- `src/components/*Page.tsx`: Visualize, Sandbox, Compare, Learn, and Benchmark product surfaces.

## Event and history model

Each generator owns a copied working array and yields a discriminated `SortEvent`. Events contain an immutable array snapshot, affected indices, semantic code-line ID, deterministic narration, phase, cumulative counters, and optional engine-only active range. The code registry maps the same semantic IDs into every supported language so playback history and language switching retain the correct highlight.

The player materializes the stream only after validation and caps it at 250,000 events. This trades memory for exact, instant previous/next/jump behavior at educational visualization sizes. Large benchmark inputs never use this history path.

## Rendering and performance

- `requestAnimationFrame` drives animation.
- High playback speeds batch up to 16 events per frame.
- React state stores only the event index and bounded stream; derived array/status values are not duplicated.
- Labels automatically disappear on dense mobile visualizations.
- Benchmark work is isolated in a Worker and yields between trials so cancellation messages can be processed.
- Sandbox work is isolated in a dedicated Worker, streams 512-operation batches, and uses ACK-based
  24,000 / 8,000 queue backpressure. Canvas redraw is capped at 30 or 60 fps.
- Audio nodes are short-lived and disconnected on completion; deterministic sampling, a 12-voice
  default limit, inverse-square-root gain normalization, and a compressor bound dense playback.

## Accessibility

Controls use semantic buttons, labels, inputs, tables, headings, regions, tabs, comboboxes,
listboxes, labeled option groups, and switches. The custom pickers implement Arrow Up/Down,
Home/End, Enter, Escape, type-to-search, outside-click closing, and focus restoration. Visual states
combine color with hatching, borders, icons, labels, and narration. Bar geometry reserves separate
marker and value headroom. The active code line has a non-color pointer, border, and
screen-reader text. Formulas expose plain-language labels. Keyboard focus remains visible, a skip
link reaches the active main surface, and `prefers-reduced-motion` disables transition duration
while retaining discrete state changes. Core mobile actions are at least 44 pixels tall.

## Security

Nginx provides CSP, frame denial, content-type protection, a restrictive permissions policy, no-referrer policy, immutable hashed-asset caching, and no-store HTML. Compose runs a non-root process with no capabilities, no new privileges, a read-only filesystem, no Docker socket or host mounts, and a dedicated bridge whose published port is bound only to the LAN address.
