# Algorithm catalog notes

SortLab includes 36 algorithms organized into ten teaching families. The typed registry is authoritative for names, aliases, complexity, stability, in-place/adaptive traits, warnings, restrictions, size limits, pseudocode, and educational copy.

The picker presents those families as Exchange sorts, Selection sorts, Insertion sorts, Merge
sorts, Partition / quick sorts, Heap-based sorts, Distribution sorts, Network sorts, Hybrid sorts,
and Novelty and impractical sorts. Search includes aliases and family terms, while the registry’s
typed icon assignment keeps every option visually distinct without creating 36 unrelated styles.

## Complexity variables

- `n`: number of input items.
- `k`: integer value range or number of buckets, depending on the algorithm.
- `d`: number of processed digits.
- `b`: radix base or bucket count.

Big-O describes growth, not exact runtime. Constants, branch behavior, locality, distribution, engine optimization, and hardware matter.

## Input behavior

All implementations preserve duplicates and the input multiset. Negative safe integers are supported, including by Counting/Pigeonhole through an offset and by Radix through sign-aware grouping. Network algorithms require a power-of-two length. Counting/Pigeonhole reject excessive value ranges before execution.

## Educational approximations

- **TimSort-Inspired:** fixed-size insertion-sorted runs followed by stable merges; not production TimSort.
- **IntroSort-Inspired:** Quick Sort, insertion-sorted small ranges, and depth-limited heap fallback; not a standard-library clone.
- **MSD Radix:** sign-aware ordering with a teaching-level top-digit visualization.
- **Tournament Sort:** explicit shrinking-pool matches for visibility rather than an optimized tournament tree.
- **Batcher Odd–Even:** repeated odd-even network phases for clarity rather than a hardware-optimized schedule.
- **Bogo Sort:** bounded deterministic shuffles followed by Insertion Sort when the safety limit is reached.

## Correctness contract

Every registered algorithm must:

1. return nondecreasing output;
2. preserve length and value counts;
3. handle empty and one-element arrays when permitted;
4. handle duplicates, sorted, reversed, and randomized arrays;
5. handle negative values or clearly reject them;
6. emit bounded events that the visualizer can apply and replay;
7. finish with a `markSorted` event only after the engine’s independent sortedness guard passes.
