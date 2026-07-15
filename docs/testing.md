# Testing

## Automated gates

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

The Vitest suite iterates over every registry entry and verifies supported edge cases plus seeded randomized arrays. It independently checks ascending output and multiset preservation. Focused tests cover snapshot immutability, monotonic counters, metadata completeness, custom input errors, seeded generation, size/range restrictions, forward/back/reset transitions, benchmark cancellation state, and audio frequency bounds.

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

## Visual review ledger

The design references live in `docs/design/`. Compare the accepted desktop and mobile concepts with the latest browser renders for:

1. three-region desktop composition and single-column mobile continuation;
2. dominant bar canvas and restrained control chrome;
3. true-white light palette and complete dark theme;
4. UI and monospace type hierarchy;
5. state colors plus hatching, borders, and markers;
6. pseudocode highlight and explanation hierarchy;
7. responsive labels, touch targets, and overflow;
8. chart scales, titles, labels, caveats, and non-color distinction.

IAB is the primary interaction runner. If its high-resolution screenshot capture is unreliable, use the installed local headless Chrome only for deterministic screenshot capture after IAB interactions have passed; do not substitute screenshot capture for functional testing.
