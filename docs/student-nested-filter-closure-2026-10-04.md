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

Kit source and package contracts pass. Consumer source, generated AMD and the
repeatable native sequence — open More Filters, open the multiple picker, click
More Filters once — remain to be built and verified at 1600/768/390 px. Human
acceptance remains open in the combined checklist.
