# Intrinsic pagination flow guard

`pagination-flow-guard` is an explicit opt-in for existing list bars. Flexible side groups preserve a centred pager while space allows. The selection, pager and tools wrap as groups before their intrinsic widths collide; their inner controls also wrap instead of overflowing. The existing narrow boundary keeps the pager on its second row. Reuse the current gap, control recipes, selection state, sort dropdown and native handlers. No viewport-specific rule per entity and no new spacing token.

Parameters identify the consumer selection, controls, tools and decorative spacer selectors. The default breakpoint is the established 25rem narrow boundary. Legacy `pagination-narrow-layout` and other default pagination recipes are unchanged; consumers choose the guard explicitly. A single consumer inclusion covers Participants, both Groups lists, Groupings, and the section pagination bars.

The two side groups reuse the existing compact tools inset symmetrically. A selection group with only hidden children takes no lane, keeping a standalone bottom pager centred. This changes no action state or visibility decision owned by the application.
