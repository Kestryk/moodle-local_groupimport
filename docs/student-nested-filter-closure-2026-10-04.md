# Nested More Filters closure — 2026-10-04

## Scope

SM-31 fixes the case where an open searchable multiple-choice disclosure could
consume the first attempt to close its enclosing More Filters panel. Kit
0.4.74 exports `closeChoicesWithin(container)`. EasyStud invokes it before the
parent panel becomes inert and starts its existing collapse Motion.

For pointer input with an open nested overlay, the enclosing control completes
its collapse during `pointerdown`, before the browser moves focus. The matching
physical `click` is deduplicated; keyboard activation keeps the ordinary
`click` collapse path. This event order prevents the nested focusout lifecycle
and resulting layout shift from consuming the first pointer action.

The helper is scoped to enhanced native selects inside the supplied panel. It
does not change selected options, rebuild the catalogue, install a global
outside-click listener, submit a form or issue a request. The accepted More
Filters animation, ARIA state and focus-visible treatment remain unchanged.

## Evidence status

Kit source/package contracts and the generated consumer AMD pass. Managed run
`easystud-authenticated-20261003T223352684Z-32348` repeated the native sequence
three times at each of 1600/768/390 px: open More Filters, open the multiple
picker, click More Filters once. All nine cycles closed both disclosures, with
no blocked request, page error or fixture. Human acceptance remains open in the
combined checklist.

Durable runtime proof:
`docs/testing/student-nested-filter-close-preview-2026-10-04.json`.
