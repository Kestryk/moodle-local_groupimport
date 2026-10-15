# K15-07 palette popovers, 15 October

Claude a2202a7b (Source ac3a7b39) supplies root semantic variables and the
space-separated custom-palette marker to the body-hosted popover. This resolves
the source-ownership blocker recorded in k15-07-reserved-palette-relay-2026-10-15.md.

Kit 0.4.212 / 30c7989 adds the opt-in palette-aware-popover mixin. The consumer
opts in after popover-surface. With no marker the old dark-green gradient,
white text, arrow, size and Motion remain unchanged. Primary uses the readable
primary-strong role; success uses the readable accent role. Primary takes
precedence when both tokens are present. Custom gradients and arrows darken the
semantic role, use white text and omit the white glow. The server's readable
roles, rather than arbitrary raw chosen colours, supply AA contrast.

Kit unit proof: classic recipe CSS is byte-identical to 49ef47e; palette rules
are emitted only by the opt-in mixin. Native recipe uses four temporary DOM
markers, actual root-to-body relay, settled paint, invariant geometry and white
contrast >=4.5 against the semantic surface and arrow. No configuration or
business data is changed. The prepared recipe also retains the selection and
role-filter checks blocked by the preceding T020 recipe. It has NOT been run.
Native result and publication are pending: Kevin's stop rule was triggered by
the unexplained9.75px T020 difference at1600 and1920 before this lot could be
served. Source preparation is not native proof or human acceptance.

Consumer synchronization is additive: preserve the existing runtime tooltip
and contextual-help mixins, append only the new palette recipe, and add only
consumerSync.palettePopoverK1507_20261015 to the manifest. Conservative rebuild
adds four rules to student-management.css; other page sheets and the global
comment-only styles.css are unchanged.

Visual relay to Claude: tooltip component / palette-aware-popover recipe /
Student Management participant details hover / ready and hovered / FR1280.
Human acceptance and Penpot propagation remain open.
