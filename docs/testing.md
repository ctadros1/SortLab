# Testing

## Automated gates

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:browser
npm run build
npm audit
```

The Vitest suite iterates over every registry entry and verifies supported edge cases plus seeded randomized arrays. It independently checks ascending output and multiset preservation. Focused tests cover snapshot immutability, monotonic counters, metadata completeness, custom input errors, seeded generation, size/range restrictions, forward/back/reset transitions, benchmark cancellation state, and audio frequency bounds.

The redesign suite additionally checks algorithm grouping, name/alias/family search, all 36 icon
assignments, pathological warnings, all dataset previews, combobox filtering and disabled-option
navigation, selected option rendering, switch state, semantic formula output, marker mapping, and
responsive marker/value headroom rules. Visualize coverage verifies all algorithms against the
seven-language semantic code registry, bounded milestone progress, legend ordering, statistics
boundaries, persisted language choice, and the compact complexity/traits contract.

Audio tests cover mapping boundaries, equal and negative datasets, clamping, pitch quantization,
ADSR scheduling, voice limits, gain normalization, density, cancellation, context reuse, presets,
persistence, and route cleanup. Sandbox tests cover algorithm filtering, amount and power-of-two
limits, visual presets, protocol guards, batching, backpressure, cancellation, hidden-interface and
keyboard state, persistence, and completion timing.

## Browser interaction matrix

Verify in the built application:

- Start, pause, resume, stop, reset, next, previous, beginning, and end.
- Speed change during a run.
- Sound toggle after a user gesture.
- Custom input success and error recovery.
- Safety warnings and a complete tiny Bogo run.
- Two-way same-array comparison and sorted final panels.
- Catalog search, filters, table selection, detail content, and complexity chart.
- Benchmark warm-up, results, skip warning, and cancellation.
- Light, dark, and system themes.
- 1440, 1024, 768, and 390 pixel widths with no horizontal overflow.
- Algorithm and dataset picker grouping, search, Arrow/Home/End/Enter/Escape behavior, warnings,
  focus restoration, and mobile popover containment.
- Switch announcement, Start/Pause/Resume transitions, Code/Explain tabs, seven language choices,
  live semantic active lines across recursive, distribution, and network algorithms, semantic
  superscripts, and non-colliding active markers.
- Visualize exposes exactly Sound, Volume, and Classic / Soft / Minimal while each preset applies.
- Sandbox Canvas rendering, algorithm and Dataset selection, amount changes, large Merge completion,
  advanced audio settings, fast stop, route cleanup, restricted quadratic amounts, interface hide
  and restore, fullscreen capability, completion state, mobile controls, and console cleanliness.
- The profiling suite records wall and animation time, operation throughput, frame rate, Long Tasks,
  queue size, stop latency, heap samples, and audio voice counts at 256, 1,024, and 4,096 values.

## Visual review ledger

The design references live in `docs/design/`. Compare the accepted desktop and mobile concepts with the latest browser renders for:

1. three-region desktop composition and single-column mobile continuation;
2. dominant bar canvas and restrained control chrome;
3. true-white light palette and complete dark theme;
4. UI and monospace type hierarchy;
5. state colors plus hatching, borders, and markers;
6. code highlight, language selection, and explanation hierarchy;
7. responsive labels, touch targets, and overflow;
8. chart scales, titles, labels, caveats, and non-color distinction.

IAB is the primary interaction runner. If its high-resolution screenshot capture is unreliable, use the installed local headless Chrome only for deterministic screenshot capture after IAB interactions have passed; do not substitute screenshot capture for functional testing.

Accepted redesign captures are in `docs/design/after/`. Baseline captures are retained in
`docs/design/before/` for direct density, hierarchy, marker, theme, and overflow comparison.
