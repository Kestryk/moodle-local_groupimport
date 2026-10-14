# Searchable choices

## Intrinsic inline width (0.4.109, SM-55)

The panel uses `contain: inline-size` so option contents do not affect the
host's intrinsic width. Long unselected options wrap/scroll inside the existing
frame instead of widening a native inline wrapper only while the panel exists.
The trigger summary remains the width authority; no hard-coded native width or
positioned overlay is added. `test-choice-native-inline-terminal-browser.cjs`
now covers twelve fixed/intrinsic single/multiple cases at three widths. Keep
the 390px uncontained failure and fresh native result distinct from the earlier
fixed-width baseline proof. Preserve viewport containment and readable options.

## Native inline baseline (0.4.108, SM-55)

The host uses grid flow so its baseline remains the trigger's first row rather
than the last descendant of a disappearing panel. Moodle Boost wraps selects
in inline-block `.defaultsnext` beside inline-block `.form-defaultinfo`.
A block host lets the panel change that baseline even when host bottom is
continuous, making native default/help copy and ancestor height jump at hide.
No Moodle selector, private offset, font, paint or Motion timing is added.

`scripts/test-choice-native-inline-terminal-browser.cjs <playwright-package>
<new-external-run> <sass-package>` reproduces that inline ancestry with actual
canonical CSS/controller/Motion. Compare ancestor/default/help top and height
before hidden and after cleanup at three widths for single/multiple fields.
The predecessor failure, fixture realm-reset correction, isolated PASS and
native execution must be recorded separately. A successful block fixture alone
does not certify native ancestry or all modal/filter consumers.

## Terminal outside spacing (0.4.107, SM-55)

Framed choices pass `collapseMargins: true` to canonical `disclosePanel`.
Vertical outside margins now reach zero with height/padding/border instead of
remaining at 8px until the list becomes hidden. The option does not repaint
controls, change 360ms timing, or change other consumers' card Motion.

`scripts/test-choice-terminal-spacing-browser.cjs <playwright-package>
<new-external-run> <sass-package> [exact-predecessor-sha]` checks the exact terminal
frame before hidden/cleanup, then the following help text's final position.
Single/multiple and regular/compact at 1600/768/390 pass alongside reduced Motion,
focus and style cleanup. The same exact oracle fails the 2662aa1 predecessor by
8px. Initial fractional-before-end probes also included border pixel quantization
(10px predecessor/2px successor); preserve those runs as scoped diagnostic
evidence, not evidence that the exact endpoint needs a weaker tolerance.
The existing framed pointer/reversal/destroy regression also passes at three
widths. Native Administration/modal proof and paired visual specifications
remain separate; no Penpot write occurs while Guide owns its connection.

## Framed Motion opt-in (0.4.95)

Use `enhanceSelect(select, labels, {motion: Motion})` (or the multiple variant)
to inject the canonical `disclosePanel`/`cancel` API. The controller adds the
shared `easyedu-searchable-choice--framed` class: the panel and chevron consume
the same 360ms duration. The panel starts at zero before being unhidden and
interpolates vertical frame insets, preventing the old 18px final-hide jump.
Existing default consumers keep their 220ms slow-token lifecycle unchanged.

Keep the original native select, local search, focus, inert state, physical
outside-pointer pause/resume and destroy cleanup. Never copy the Motion engine
into a private dropdown or add an additional consumer height animation.
`scripts/test-framed-choices-browser.cjs` passes three widths for frame/timing,
selection/focus, reversal, held-pointer stability and reduced/disabled/destroy.
The isolated pointer window deliberately uses 2s, as the legacy regression does;
the real recipe remains 360ms. The first 360ms held-pointer test missed the
moving target before pointerdown; it is retained as failed harness evidence.
Legacy single/multiple regression also passes. Native consumer proof is separate.

### Closing-list pointer continuity (0.4.88)

An in-flow list remains able to move a following action during its exit
animation, even after Escape has updated `aria-expanded` to false. Keep the
temporary pointer listeners until closure settles. An outside pointerdown
pauses the active animation; pointerup/cancel resumes it after click dispatch.
Native option values, keyboard blur, existing duration/easing and reduced
motion remain unchanged. The shared isolated test holds a physical pointer
over the following action during closure at three widths; consumer native
Reset proof remains a separate gate. No new SCSS or Penpot geometry is needed.

## Compact density candidate (2026-10-04)

Add `easyedu-searchable-choice--compact` to the enhanced host for either mode.
It uses the Foundation small field: 12px type and 32px trigger, search and
option minimum heights. Icons are not scaled with the control. The multiple
clear target stays 28px, vertically centred inside the trigger. At 48rem and
below, or with a coarse primary pointer, trigger/search/options retain 44px
minimum targets and clear retains 36px. Long options can grow and wrap.
The same authoritative native select and disclosure controller remain in use.

Isolated Chromium contract passes regular and compact controls at 1600/768/390
(`choice-compact-20261004-03`). The first two runs caught a 2px content-box
search-height discrepancy, now corrected at the shared compact wrapper.
These fixtures prove geometry and interaction, not the Moodle font/icon paint:
they do not load the consumer's font assets. Coarse-pointer desktop, complete
Product publication and native preview remain separate gates.

Foundations 08.4 / 08.4.1 now has six paired linked compact multiple states:
Closed, Open, Focus-visible, Disabled, No-results and Touch-open. Standard
board `cf371b29-2e8e-8011-8008-bceb09cc86fa`, Library board
`cf371b29-2e8e-8011-8008-bce9a917bda1`. Search S provider:
`cf371b29-2e8e-8011-8008-bcea5da99d71`. Settled readback confirms links,
matching main/copy sizes and 12px text; exported Standard board inspected.
Open variants use the upward chevron; no-results explicitly preserves the
selected summary. This is agent inspection, not human acceptance. Dedicated
compact single-choice and Search S state galleries remain to complete.

## 0.4.82 pointer dismissal and trailing geometry

An open in-flow list temporarily tracks outside pointer down/up/cancel at the
document level. Pointer-driven focusout defers collapse until release so the
following button cannot move away before its click. Keyboard blur and Escape
still close immediately through the same Motion lifecycle. Tracking and pending
timers are removed on close, refresh and destroy; there is no permanent global
listener. Six isolated admin adapter checks exercise a held physical pointer
and direct Reset beneath an open list at 1600/768/390 in both motion modes.

Multiple triggers reserve the clear action's lane between summary and chevron,
not through enlarged end padding. The chevron retains the canonical end inset,
zero icon margin and centred paint. Three-width isolated geometry/lifecycle
checks pass after waiting for the actual chevron transition to settle. Native
consumer, Foundations publication and human acceptance remain separate gates.

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
 normally; no innerHTML or network command is introduced.
The trigger's accessible name contains both the translated destination label
and its current selected value, including after `refresh`.

When a consumer collapses an enclosing filter/modal disclosure, call
`closeChoicesWithin(container)` before making that container inert. It closes
only enhanced native selects inside that container, in the same event, and
returns the number closed. It does not install a global outside-click listener,
change native values or issue a request. This prevents the first click from
closing only the nested dropdown while leaving its parent open.

The trigger uses the Foundation text-field recipe: 2.375rem high, 0.875rem UI
type, 0.875rem painted text inset and control-radius. The disclosure panel is
in-flow, 0.5rem below, 0.5rem inset, and scrolls its bounded 12rem option list.
Option rows are 2.375rem minimum, with selected/hover/focus primary-soft paint.
At 48rem and below, trigger/options have 2.75rem touch targets. Widths are
responsive, not fixed by the illustrative Penpot specimens. Typography inherits
the Kit UI family; consumers supply translated plain text.

Opening and closing use one interruptible disclosure Motion contract. The
controller measures the in-flow panel and animates its height, opacity and
small block-start offset with the shared slow/easing tokens; the chevron uses
the same duration. Reversing direction cancels the current animation from its
painted height, so rapid clicks do not flash the whole list or leave stale
space. The panel becomes inert while closing and is hidden only after Motion
finishes. Reduced-motion and browsers without Web Animations complete the same
state change immediately. Consumers must not add a second height transition.

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

Pass a localized `clear` label to expose the multiple field's trailing clear-all
button whenever at least one native option is selected. It clears selected
options including those hidden by the current search, emits exactly one native
`change`, keeps an open panel open, and returns focus to its search field. The
button disappears at zero selections and follows the native select's disabled
state. Single-choice controls never render it.
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

## Dense catalogues

Large catalogues reuse this same search/scroll/selection recipe; option labels
wrap without changing the trigger's density. The consumer owns the rule that
chooses quick shortcuts versus the searchable picker, not private paint or a
new dropdown. EasyStud's source-backed example retains quick role buttons for
up to six nonempty enabled choices; above six, it uses the shared multiple picker
at every width. Below 768px it uses that picker at every count.

The Foundations Standard/Library catalogue usage text is paired and contained;
no provider, component paint or source SCSS changes are needed. EasyStud's new
page-03 dense Desktop/Mobile composition inherits existing Foundation providers,
preserving the short-catalogue board. Readbacks:
`docs/testing/student-role-density-{foundations,product}-2026-10-03.json`
in the consumer. Native twelve-role/three-nologin-user proof passes search,
selection, original OR filtering, reset and containment at 1600/768/390.
Both fixture and runtime leases are released; pre-existing relationship hashes
match after native cleanup. Test roles/users are temporary. Human acceptance,
all languages and complete product-view parity are not inferred from this gate.

## Setting width opt-in (0.4.210, R10-26/K12)
`setting-choice-width` gives setting wrappers and controls a common12rem minimum
bounded by available width, maximum min(100%,28rem), full available width below
48rem. Apply to both the native inline wrapper and enhanced host so short labels
cannot shrink the field. Existing intrinsic-width consumers remain unchanged.
No controller, typography, state, Motion or selection behavior changes.
Consumer: EasyStud admin all enhanced fields and native single-select fallbacks.
Native short/long/search/keyboard and neighbour flow proof recorded by consumer;
publication/human/Penpot acceptance remains separate.
