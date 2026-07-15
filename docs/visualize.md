# Visualize interface

Visualize is SortLab's guided learning surface. Its layout keeps controls, sorting state, and the
Algorithm Guide distinct without turning the page into three competing scroll regions.

## Desktop and responsive layout

Above the desktop breakpoint, the control rail is fixed below the 72-pixel application header and
uses its own vertical scrollbar. Its height is the remaining dynamic viewport height, its width is
stable, and contained overscroll prevents the document from moving while the rail can still move.
The center column never renders beneath it.

The Algorithm Guide starts below the header and reaches the viewport bottom. It intentionally does
not contain vertical wheel scrolling: a wheel gesture over its tabs, code, summaries, or empty space
continues to scroll the document. Code lines may scroll horizontally. Tablet and mobile layouts put
both sidebars back into normal document flow and prevent horizontal page overflow.

## Code and semantic highlighting

The Code tab supports Pseudocode, C, C++, Java, Python, JavaScript, and TypeScript. The selected
language is persisted under `sortlab.visualize.code-language` and defaults to Pseudocode. Its custom
combobox supports Arrow Up/Down, Home/End, Enter, Escape, and visible focus.

`src/code/algorithmCode.ts` is the typed source for snippets. Every line has a stable semantic ID,
such as `partition.choose-pivot` or `merge.write-back`. Sorting events refer to those IDs rather than
language-specific line numbers. All language variants retain the same IDs, so changing language or
moving Previous, Next, Beginning, or End preserves the correct operation highlight. An unknown
low-level event resolves only to a relevant phase fallback and emits a development warning instead
of highlighting an unrelated line.

To add an algorithm snippet:

1. Add its emitted semantic IDs to `semanticIdsByAlgorithm` in execution order.
2. Add concise teaching text and explanations for new operations.
3. Keep each language's lines focused on algorithm logic rather than runnable-program boilerplate.
4. Run the registry completeness tests; every emitted ID must exist in all seven languages.

## Progress, legend, and summaries

Event progress uses at most 48 representative milestones and exposes `role="progressbar"`, current
step, total steps, and percentage. It has no thumb, slider semantics, pointer behavior, or seek
interaction.

Legend labels precede their decorative state symbols. Comparing, Swapping, Pivot, Selected minimum,
Current maximum, Current write, and Sorted remain available when relevant. Algorithm range data may
still exist internally, but it is intentionally not rendered as a learner-facing state. State cues
combine color with shape, hatch, text, or borders.

The compact Algorithm Guide shows complexity in the order Worst, Average, Best. Stable, In place,
and Adaptive appear beneath as compact semantic statuses. Space complexity is intentionally omitted
from this surface and remains available in Learn and the algorithm catalog.

## Accessibility

Tabs use tab semantics, the language picker uses the shared ARIA combobox/listbox implementation,
and the selected language stays visible. The active code line combines an announced current state,
left marker, border, and background. Progress is read-only to assistive technology. Formula markup
uses semantic variables and superscripts with accessible text, while reduced-motion preferences
remove nonessential transitions without hiding state changes.
