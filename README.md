# SortLab

SortLab is an open-source educational sorting algorithm playground for CS1 students. It turns algorithm execution into structured events so students can watch comparisons and writes, step backward and forward, hear value-mapped tones, connect each action to code, and compare algorithms without confusing animation speed with computational performance.

![Quick Sort paused during a swap in SortLab Visualize dark mode](docs/screenshots/readme/visualize-dark-active.png)

The guided workspace connects every visible change to narration, statistics, sound, and code. Sandbox scales the same ideas to thousands of Canvas-rendered values with worker-driven playback.

## Live site

[Open SortLab](https://project.christiantadros.com/sortlab/). The app does not require an account.

## Explore every SortLab page

These screenshots show the current interface across guided study, comparison, reference lessons, measured benchmarks, high-scale playback, and project documentation.

### Visualize an algorithm step by step

Visualize keeps controls, the array, and the algorithm guide visible together. Switch themes, inspect active operations, or search the algorithm catalog without leaving the workspace.

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/readme/visualize-light.png" alt="SortLab Visualize page in light mode before playback">
      <br><sub>Light mode with the generated array, operation legend, statistics, and guided pseudocode.</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/readme/algorithm-picker-dark.png" alt="Searchable SortLab algorithm picker in dark mode">
      <br><sub>Dark-mode algorithm picker with custom icons, traits, complexity, search, and family groups.</sub>
    </td>
  </tr>
</table>

### Compare two algorithms on the same input

Compare synchronizes relative progress while preserving each algorithm’s operations and measured execution time. Its sound crossfader can emphasize either side or keep both balanced.

![SortLab Compare page in light mode with two paused algorithm visualizations](docs/screenshots/readme/compare-light.png)

### Learn the ideas behind each sort

Learn starts with a searchable catalog, then opens each algorithm as a focused lesson with key facts, a central idea, worked examples, and implementation guidance.

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/readme/learn-light.png" alt="SortLab Learn algorithm catalog in light mode">
      <br><sub>Light-mode catalog with family, type, stability, and memory filters.</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/readme/learn-detail-dark.png" alt="Quick Sort Hoare lesson in SortLab dark mode">
      <br><sub>Dark-mode Quick Sort lesson with complexity, traits, steps, and a worked example.</sub>
    </td>
  </tr>
</table>

### Benchmark identical arrays

Benchmark runs warm-ups and copied trials in a Web Worker. The result chart reports observed medians for the current browser and device, not universal rankings.

![SortLab Benchmark page in light mode with completed timing results](docs/screenshots/readme/benchmark-light.png)

### Scale up in Sandbox

Sandbox renders large arrays on Canvas and keeps advanced playback, audio, and visual controls in a focused panel. Dataset previews show each distribution before selection.

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/readme/sandbox-dark-complete.png" alt="Completed 1024-value Quick Sort in SortLab Sandbox dark mode">
      <br><sub>Dark-mode completion state for a 1,024-value worker-driven Quick Sort.</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/readme/sandbox-light-dataset-picker.png" alt="SortLab Sandbox dataset picker in light mode">
      <br><sub>Light-mode dataset picker with live visual previews and searchable distributions.</sub>
    </td>
  </tr>
</table>

### Read how SortLab works

About explains the event model, browser limits, timing methodology, accessibility choices, open-source status, and technical stack.

![SortLab About page in dark mode](docs/screenshots/readme/about-dark.png)

### Use the same tools on a phone

The guided visualizer becomes a single-column lesson, while Sandbox uses a draggable control sheet over the Canvas.

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/readme/mobile-visualize-light.png" alt="SortLab Visualize mobile layout in light mode">
      <br><sub>Visualize in a compact light-mode phone layout.</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/readme/mobile-sandbox-dark.png" alt="SortLab Sandbox mobile layout in dark mode">
      <br><sub>Sandbox in a compact dark-mode phone layout.</sub>
    </td>
  </tr>
</table>

## What students can do

- Visualize comparisons, swaps, pivots, ranges, merges, heap operations, bucket assignments, writes, and finalized values using color plus patterns and markers.
- Generate random, nearly sorted, reversed, sorted, few-unique, duplicate-heavy, sawtooth, shuffled-group, or custom integer arrays.
- Reproduce an array with a seed and reuse it across comparisons.
- Start, pause, resume, stop, reset, step backward, step forward, and jump to either end.
- Change speed while a run is active.
- Enable a clean-room Web Audio audibilization engine with value-mapped pitch, bounded polyphony,
  click-free envelopes, automatic gain normalization, and adaptive density.
- Keep Visualize focused with only Sound, Volume, and Classic / Soft / Minimal presets.
- Open Sandbox for 16–16,384 Canvas-rendered values, worker-driven playback, fullscreen and hidden
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

The Code tab supports Pseudocode, C / C++, Java, Python, and TypeScript. It uses aligned
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
- Sandbox supports 16–16,384 values, with an explicit per-algorithm maximum shown in the picker.
  Efficient worker-backed sorts receive the largest limits; quadratic, network, and novelty sorts
  use lower safety caps and remain protected by operation and time budgets.

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
