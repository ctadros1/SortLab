# SortLab

SortLab is a local-first educational sorting algorithm playground for CS1 students. It turns algorithm execution into structured events so students can watch comparisons and writes, step backward and forward, hear value-mapped tones, connect each action to pseudocode, and compare algorithms without confusing animation speed with computational performance.

![SortLab desktop interface](docs/design/after/visualize-light-1440x1000.png)

The interface uses an icon-led three-region workspace: compact controls on the left, the sorting
canvas in the center, and a sticky algorithm guide on the right. At narrower widths the guide and
controls continue below the canvas without changing the sorting behavior.

Sandbox is a separate high-scale Canvas experience for cinematic, worker-driven runs with up to
4,096 values and advanced sound and rendering controls.

![SortLab Sandbox](docs/design/after/sandbox-default-1440x1000.png)

## LAN access

- URL: `http://192.168.75.59:8787`
- Project directory: `/srv/docker/projects/sorting-playground`
- Container: `sorting-playground`
- Image: `sorting-playground:1.0.0`
- Arcane: `http://192.168.75.59:3552`

The service binds only to the dev-lab LAN address. It has no accounts, database, analytics, telemetry, external fonts, ads, third-party scripts, or public exposure.

## What students can do

- Visualize comparisons, swaps, pivots, ranges, merges, heap operations, bucket assignments, writes, and finalized values using color plus patterns and markers.
- Generate random, nearly sorted, reversed, sorted, few-unique, duplicate-heavy, sawtooth, shuffled-group, or custom integer arrays.
- Reproduce an array with a seed and reuse it across comparisons.
- Start, pause, resume, stop, reset, step backward, step forward, and jump to either end.
- Change speed while a run is active.
- Enable a clean-room Web Audio audibilization engine with value-mapped pitch, bounded polyphony,
  click-free envelopes, automatic gain normalization, and adaptive density.
- Keep Visualize focused with only Sound, Volume, and Classic / Soft / Minimal presets.
- Open Sandbox for 64–4,096 Canvas-rendered values, worker-driven playback, fullscreen and hidden
  interface modes, six visual presets, and advanced audio controls.
- Read deterministic narration, live operation counters, recursion depth, phase, JavaScript execution time, and pseudocode highlighting.
- Compare two algorithms on the same array with synchronized playback and a measured execution summary.
- Explore 44 curated teaching algorithms in Visualize and search the complete 200-plus algorithm
  Sandbox library with explicit Native, Conceptual, Simulated, or Experimental labels.
- Run cancellable, warm-up-based Web Worker benchmarks with identical copied inputs and median results.
- Switch between light, dark, and system themes.

## Pickers and controls

The Algorithm field is a searchable custom combobox rather than a native browser menu. Use Up/Down
Arrow to move, Home/End to jump, Enter to select, Escape to close, or begin typing while the field
has focus. Focus returns to the trigger after the list closes.

Algorithms are grouped as Exchange, Selection, Insertion, Merge, Partition / quick, Heap-based,
Distribution, Network, Hybrid, and Novelty and impractical sorts. Each option includes its local
Lucide motif, teaching description, family, important traits, complexity, and any safety warning.
Search matches names, aliases, families, and teaching terms. Incompatible choices remain visible
with their constraint explained.

The Dataset picker omits search because its option set is short. Each option uses a six-bar preview,
text label and description, and a check state—without a repeated inline icon. Binary preferences
use accessible switches with visible on/off state; speed and volume remain labeled sliders.
Playback uses labeled icon buttons, and the primary button changes from Start to Pause to Resume as
the player state changes.

## Algorithm guide

The desktop Visualize controls form an independently scrolling left rail. The right Algorithm Guide
fills the viewport below the header while leaving wheel scrolling with the main document. Both rails
return to normal document flow on narrower screens.

The Code tab supports Pseudocode, C, C++, Java, Python, JavaScript, and TypeScript. It uses aligned
line numbers, lightweight token styling, a single active-line marker, and a live explanation. The
selected language is saved locally, and changing languages during playback preserves the active
semantic operation. The Explain tab summarizes the current phase and operation, invariant, key
thing to notice, worked example, and common mistake.

Event progress is a non-interactive, bounded milestone display rather than a seek control. The
legend places labels before their matching state symbols and exposes only meaningful bar states.
The compact guide presents Worst, Average, and Best complexity followed by Stable, In place, and
Adaptive traits; space complexity remains available in Learn. Values use a shared semantic renderer
with `<var>` and `<sup>` so notation such as O(n²), O(n log n), and O(d(n + b)) remains readable to
assistive technology and in both themes. See [`docs/visualize.md`](docs/visualize.md) for extension
and accessibility details.

## Visualize keyboard shortcuts

| Key         | Action                  |
| ----------- | ----------------------- |
| Space       | Start, pause, or resume |
| Left Arrow  | Previous event          |
| Right Arrow | Next event              |
| R           | Reset                   |
| S           | Shuffle/regenerate      |
| M           | Toggle sound            |
| Escape      | Stop                    |

Keyboard shortcuts do not fire while focus is inside an input, button, or textarea. Every icon-only
theme action has an accessible name and tooltip; the page also includes a skip link, visible focus,
tab semantics, labeled groups, screen-reader operation updates, and reduced-motion support.

Sandbox adds `H` for interface visibility, `F` for fullscreen, and Up/Down Arrow for speed. Its
controls remain recoverable with a visible Show controls button and Escape restores the interface
before leaving fullscreen.

## Supported algorithms

### Introductory and exchange/insertion sorts

Bubble Sort, Cocktail Shaker Sort, Odd–Even Sort, Comb Sort, Gnome Sort, Selection Sort, Double
Selection Sort, Insertion Sort, Binary Insertion Sort, Shell Sort, and Library Sort.

### Efficient comparison and hybrid sorts

Merge Sort, Bottom-Up Merge Sort, Natural Merge Sort, Quick Sort, Three-Way Quick Sort, Dual-Pivot
Quicksort, Heap Sort, Smoothsort, Timsort, and Introsort.

### Distribution sorts

Counting Sort, Pigeonhole Sort, Bucket Sort, Radix Sort (LSD), Radix Sort (MSD), Binary Radix Sort,
American Flag Sort, and Flashsort.

### Specialized, network, and novelty sorts

Cycle Sort, Pancake Sort, Strand Sort, Tree Sort, Tournament Sort, Patience Sort, Bitonic Sort,
Batcher Odd–Even Merge Sort, simulated Parallel Merge and Sample Sort, Bogo Sort, Stooge Sort,
Slowsort, simulated Sleep Sort, and simulated Bead Sort.

The TimSort, IntroSort, MSD Radix, Tournament, Batcher, and Bogo implementations are explicitly labeled educational approximations where their teaching-oriented behavior differs from a production library or formal optimized implementation. No claim is made that they match Python, Java, V8, or the C++ standard library.

## Safety and performance limits

- Normal visual runs: maximum 120 values; the UI defaults to 32.
- Counting and Pigeonhole Sort: value range capped at 5,000.
- Bitonic and Batcher network views: power-of-two sizes only, up to 128.
- Stooge Sort: maximum 30; recommended 12.
- Slow Sort: maximum 22; recommended 10.
- Bogo Sort: maximum 8; recommended 6. A bounded shuffle attempt count falls back to Insertion Sort so cancellation and completion remain safe.
- Stored event history is capped at 250,000 events. Every event carries a bounded array snapshot, making previous-step behavior exact and fast for visualization-sized arrays.
- Benchmark mode supports up to 50,000 values and skips quadratic/pathological choices above 5,000.
- Sandbox tiers are 64–4,096. Quick, merge, heap, radix, counting, and bitonic reach 4,096; Shell
  reaches 2,048; quadratic classics stop at 512; networks require powers of two. Novelty entries
  remain searchable but are capped as low as 6–8 values and protected by operation/time budgets.

The visualizer materializes bounded event streams so reverse stepping is immediate. The benchmark worker uses unanimated implementations, a warm-up, copied identical arrays, multiple trials, median display, and cancellation checkpoints. Results remain device-, browser-, JIT-, workload-, and implementation-specific.

## Local development

Requires Node.js 22 or later.

```bash
npm ci
npm run dev
```

Quality gates:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:browser
npm run build
npm audit
```

## Production and Arcane deployment

Arcane watches `/srv/docker/projects`, so the on-disk Compose file is the source of truth.

```bash
cd /srv/docker/projects/sorting-playground
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

The production image is a multi-stage Node build served by unprivileged Nginx on container port 8080. Compose maps only `192.168.75.59:8787`, drops Linux capabilities, forbids privilege escalation, uses a read-only root filesystem, gives Nginx a small temporary filesystem, rotates logs, and attaches an isolated project bridge.

## Updating

1. Create a backup before changing deployed source.
2. Update files in `/srv/docker/projects/sorting-playground`.
3. Run all quality gates.
4. Rebuild and recreate only this project.

```bash
cd /srv/docker/projects/sorting-playground
docker compose build
docker compose up -d --force-recreate
docker compose ps
curl -fsS http://192.168.75.59:8787/healthz
```

## Rollback

Stop the current project, restore a known source archive into the same directory without restoring `.env`, review `.env`, then rebuild:

```bash
cd /srv/docker/projects/sorting-playground
docker compose down
tar -xzf /srv/docker/backups/<sorting-playground-backup>.tar.gz -C /srv/docker/projects/sorting-playground
docker compose config
docker compose build
docker compose up -d
```

Never delete the current project before confirming the archive contents. Keep `.env` outside archives and preserve it separately with restricted permissions when changing deployment values.

## Adding an algorithm

1. Implement a generator in `src/algorithms/engine.ts`. It must mutate only its local working copy and yield structured, snapshot-backed events with accurate counters, narration, phase, and `codeLine` identifiers.
2. Add it to `algorithmImplementations` using a stable ID.
3. Register exactly one centralized metadata entry in `src/algorithms/registry.ts` with complexity, traits, restrictions, size limits, pseudocode, explanations, use cases, disadvantages, comparisons, implementation notes, and common mistakes.
4. Assign one typed motif in `algorithmIconAssignments`. Reuse the small vocabulary in
   `src/components/Icon.tsx`; do not introduce a one-off icon library or decorative illustration.
5. Ensure every yielded `codeLine` maps to an appropriate pseudocode line or intentionally uses a documented generic operation.
6. Add or adjust input validation in `validateAlgorithmInput`.
7. Run the property-style catalog test and add focused tests for special constraints.
8. Verify picker search, comparison mode, reverse stepping, narration, counters, patterns,
   dark/light themes, and mobile rendering.

## Adding a dataset

1. Add one typed entry to `src/data/datasets.ts` with an ID, name, description, icon ID, six-value
   preview, search terms, and any constraint copy.
2. Add the generator branch in `src/utils/array.ts` when the dataset is generated rather than custom.
3. Provide a compact preview pattern; do not add a repeated icon beside the Dataset text label.
4. Test metadata completeness, seeded output, picker keyboard selection, and the 390px layout.

## Troubleshooting

- **Container is unhealthy:** run `docker compose logs --tail=200 web` and confirm the read-only/temp-file configuration is intact.
- **Port will not bind:** run `sudo ss -lntup` and `docker ps --format '{{.Names}} {{.Ports}}'`; choose a new unused high port in `.env`.
- **Arcane does not show the project:** confirm `compose.yaml` is directly under `/srv/docker/projects/sorting-playground`, wait for the filesystem watcher, then refresh Arcane. Do not edit Arcane’s database.
- **No sound:** click a playback control first. Browsers require a user gesture before Web Audio can start.
- **Network sort error:** use a power-of-two size such as 8, 16, 32, or 64.
- **Counting Sort error:** narrow the maximum-minus-minimum value range to 5,000 or less.
- **Benchmark feels different between runs:** increase trials and close unrelated workloads; the result is still an observation, not a universal ranking.

More detail is available in `docs/architecture.md`, `docs/algorithms.md`,
`docs/audio-engine.md`, `docs/sandbox.md`, `docs/deployment.md`, and `docs/testing.md`.
