# Sandbox

Sandbox is SortLab's high-scale presentation mode at `#sandbox`. It is deliberately separate from
Visualize: Canvas, speed, audio customization, and cinematic playback take priority over
pseudocode, narration, reverse stepping, and teaching cards.

![Sandbox desktop](design/after/sandbox-default-1440x1000.png)

## Rendering architecture

React owns controls and coarse UI state only. `SandboxRenderer` draws the array on one high-DPI
Canvas 2D surface through a `ResizeObserver`; it never creates a DOM element per value. Canvas size
tracks CSS size and device pixel ratio, and redraws are capped at the selected 30 or 60 fps target.
Background tabs, route changes, and unmounts release the renderer, worker, and audio resources.

WebGL was not justified by profiling at the supported 4,096-value ceiling. Canvas 2D kept the
pipeline smaller and remained responsive at that limit.

## Worker and batching model

`sandbox.worker.ts` executes a Sandbox-specific implementation and emits compact numeric operation
tuples in 512-operation batches. The main thread applies bounded batches once per animation frame:

- Real-time: 12 operations per 60 fps frame
- Fast: 480 operations per 60 fps frame
- Maximum: 3,200 operations per 60 fps frame

The queue asks the worker to pause at a 24,000-operation high-water mark and resumes it at 8,000.
Because one already-sent 512-operation batch may arrive at the boundary, its strict batch-bounded
ceiling is 24,448 operations; the final profile peaked at 20,992. A new run terminates the old
worker, stop responds immediately, route changes terminate work, and no unbounded event history is
retained.

## Algorithms and amount limits

Sandbox currently provides 12 registry-backed choices:

- Recommended: Quick Sort (Hoare), Merge Sort, Heap Sort, Radix Sort (LSD)
- Fast comparison sorts: Quick Sort, Bottom-Up Merge Sort, Shell Sort
- Distribution sorts: Counting Sort
- Quadratic classics: Optimized Bubble Sort, Selection Sort, Insertion Sort
- Network sorts: Bitonic Sort

Quick, merge, heap, radix, counting, and bitonic support up to 4,096 values. Shell Sort supports
2,048. The quadratic classics stop at 512. Bitonic Sort requires a power-of-two amount. Bogo Sort,
Slow Sort, and Stooge Sort are excluded from this pipeline. Unavailable amounts stay visible with a
reason, and the run cannot start with an invalid combination.

Supported tiers are 64, 128, 256, 512, 1,024, 2,048, and 4,096. Profiling did not justify exposing
8,192.

## Controls and persistence

The floating controls island provides algorithm, Dataset, amount, speed mode, Start / Pause /
Resume, Stop, Reset, Shuffle, Sound, Fullscreen, and Hide interface. Audio settings exposes the
shared engine's preset, waveform, pitch mode, frequency range, ADSR, density, polyphony,
operation-type toggles, and automatic normalization. Visual settings exposes bar gap, width mode,
active brightness, trail, background, values, statistics, legend, completion, quality, and frame
target.

Algorithm, Dataset, amount, speed, visual choices, audio choices, and volume persist locally.
Hidden-interface state intentionally does not persist, and sorting never starts on page load.

## Visual presets

Classic, Neon, Monochrome, Heatmap, Spectrum, and Terminal are centralized in
`src/sandbox/config.ts`. Dense bars communicate active and sorted state with color, brightness,
opacity, and the completion sweep; Sandbox never places marker icons above individual bars.

To add a visual preset, extend `SandboxVisualPresetId`, add all required colors to
`sandboxVisualPresets`, then add registry, persistence, dark-contrast, 4,096-bar, and mobile tests.

## Hidden interface and fullscreen

Hide interface removes the controls island, compresses the header to a translucent 42 px strip,
and leaves a visible Show controls button above the statistics overlay. `H` restores the interface;
Escape restores it before handling fullscreen. Keyboard focus entering the compact header also
restores controls. Space remains available for playback.

Fullscreen uses the browser Fullscreen API when available. Canvas size follows fullscreen entry
and exit, audio continues, and controls remain recoverable. Unsupported browsers keep the control
disabled without changing the route.

Keyboard controls are Space, R, S, M, H, F, Escape, and Arrow Up / Arrow Down for speed.

## Completion sequence

Completion draws a left-to-right sorted sweep whose duration is clamped between 650 and 2,200 ms
and scales with the square root of the amount. Audio plays six ascending sampled notes, not
thousands. The summary offers a New array action and the user can reset or start again immediately.

## Measured profile

Measurements used Chromium, the production-style Canvas/worker path, Maximum mode, a 60 fps
target, Long Tasks API observation, heap sampling where available, queue diagnostics, and engine
voice diagnostics. Results are local observations, not benchmark claims.

| Algorithm        | Values | Wall time | Animation | Streamed ops | Observed fps | Peak queue | Long tasks |
| ---------------- | -----: | --------: | --------: | -----------: | -----------: | ---------: | ---------: |
| Quick Sort Hoare |    256 |    285 ms |    200 ms |        3,138 |           37 |          0 | 1 / 159 ms |
| Quick Sort Hoare |  1,024 |    173 ms |    100 ms |       14,954 |           54 |      7,530 |          0 |
| Quick Sort Hoare |  4,096 |    510 ms |    400 ms |       74,808 |           55 |     14,464 |          0 |
| Merge Sort       |  4,096 |    511 ms |    500 ms |       87,485 |           60 |      8,320 |          0 |
| Heap Sort        |  4,096 |    765 ms |    700 ms |      130,690 |           60 |     20,992 |          0 |
| Radix Sort LSD   |  4,096 |     92 ms |      0 ms |        8,192 |           56 |      4,992 |          0 |
| Optimized Bubble |    256 |    631 ms |    300 ms |       49,605 |           58 |          0 |          0 |

The first 159 ms long task occurred during initial page/audio setup; subsequent measured sorting
runs recorded no long task. Measured stop latency was 28 ms. Peak sampled heap growth at 4,096 was
about 10.83 MB for Heap Sort, with other 4,096 runs lower. Active audio voices stayed at or below
the configured 12-voice cap.

## Responsive layout

Desktop uses a floating island. Below 900 px the island becomes a bottom panel while the canvas
remains dominant. At 390 px, inputs use two columns where useful, action buttons retain 44 px touch
height, statistics collapse to four primary values, tooltips no longer create overflow, and the
panel remains vertically scrollable.
