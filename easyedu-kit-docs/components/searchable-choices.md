# Searchable choices

Opt-in `searchable-choice-classes` and `choices/searchable_choices.js` enhance a
labelled native single/multiple select. They do not replace a command menu or introduce
an ARIA combobox. The native select remains the authoritative value and no-JS
fallback; only a completed enhancement hides it. Preserve the consumer's data
hooks, option values, disabled options and business submit handler.

`enhanceSelect(select, {label, search, empty})` returns `host`, `trigger`,
`refresh(labels)`, `close(returnFocus)` and `destroy()`. Rebuild options in the
native select, then call `refresh`; searching never deselects or deletes them.
Choosing emits native `change` and returns focus to the disclosure trigger.
Escape closes only an open choice panel, not its enclosing dialog. Tab exits
normally; no global event listener, innerHTML or network command is introduced.
The trigger's accessible name contains both the translated destination label
and its current selected value, including after `refresh`.

The trigger uses the Foundation text-field recipe: 2.375rem high, 0.875rem UI
type, 0.875rem painted text inset and control-radius. The disclosure panel is
in-flow, 0.5rem below, 0.5rem inset, and scrolls its bounded 12rem option list.
Option rows are 2.375rem minimum, with selected/hover/focus primary-soft paint.
At 48rem and below, trigger/options have 2.75rem touch targets. Widths are
responsive, not fixed by the illustrative Penpot specimens. Typography inherits
the Kit UI family; consumers supply translated plain text.

The labelled group contains native buttons with `aria-pressed`; it is not a
fake listbox with incomplete arrow-key behaviour. Search is a separately
labelled search input. Empty search results have a status message, but searching
does not disable a previously selected valid destination. Native select labels
are retargeted only after successful initialisation and restored by `destroy`.

The inherited Moodle font token is applied as a `font-family` longhand, separate
from size, weight and line-height. `inherit` cannot serve as the family part of
a `font` shorthand; a shorthand with that substitution would lose its density.

Accessibility reference: [WAI disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).
`enhanceMultipleSelect(select, {label, search, empty, none, count})` is the
multiple-mode extension. `count` replaces `__count__` with the
number of selected native options. The visible summary is none/one label/count;
all chosen options retain their pressed/check state in the expanded list.
Independent native toggle buttons are used, not an incomplete ARIA multiselect
listbox. Choosing keeps the panel open and emits one native change. Filtering
does not reconstruct options or clear any hidden selection. Native external
change/reset handlers must emit change after modifying options; `refresh`
rebuilds a changed catalogue without changing chosen values.
Both modes use one internal disclosure/search/list lifecycle and the same SCSS
recipe; there is no copied product stylesheet or separate visual exception.
Six multiple-mode Standard/Library pairs (Closed, Open, No-results,
Responsive-open, Focus-visible, Disabled) are published in Foundations. EasyStud
inherits the controls in one contained filter block, retaining native mobile
role/grouping visibility rules. Source and isolated HTML gates pass; native
consumer preview and human acceptance are separate gates.

Foundations paired specimens: Standard 08.4 and Library 08.4.1,
file `40e06342-8830-80d6-8008-96572effc11c`. Closed/Open/No-results/Responsive
open definitions share the canonical field/icon providers. The selected check
must be the topmost child so changing its row cannot put it below another
opaque option. A linked-provider refresh requires renewed icon positioning,
text lanes and paint readback; neither linkage nor root width proves alignment.
EasyStud records the detailed IDs/readbacks and the isolated three-width
interaction gate in `docs/student-searchable-destinations-2026-10-03.md`.
Multiple readbacks are in the consumer's
`docs/testing/student-searchable-multiple-{foundations,product}-2026-10-03.json`.
The isolated multiple browser contract additionally checks selected-value
retention, independent pressed states, disabled/safe-text options, reset,
destroy/label restoration and single-choice regression at 1600/768/390.
Native Small/Regular/Large field sizes remain 12/14/14px with 32/38/48px heights.
These are source-backed measurements, not native Moodle theme or human proof.
Human acceptance and full consumer-state coverage remain pending.
