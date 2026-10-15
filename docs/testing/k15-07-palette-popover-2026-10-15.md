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

## 15 October continuation after Claude T020 response

The preceding stop was resolved by Claudea8c6364b. T020 strict successor
074257632Z-30888 passes0px at1600/1920; selection, actual numeric role choice
and palette relay also pass, with exact config restoration. Palette adoption
5ac22a37 is now served8bf44269, followed by proof/runtime21ce402b, purgePASS.

K15-07 native075225174Z-41788 PASS:16hover cases,1280/390 x default semantic
roles/current configured test palette x no marker/primary/success/both. Default
roles are calculated by the actual PHP contrast helper; substitutions are DOM
only, restored afterwards. No admin palette configuration or business data is
changed. Minimum custom-role white contrast4.7453 and arrow5.6144, unchanged
size/padding/radius in every case, primary precedence, classic green with no
marker. Existing long-copy typography remains untouched by the additive recipe.

Keep failed predecessors074548824Z-18832,
074759709Z-23288 and075005479Z-27860. The first started hovering while an automatic
scroll removed the tooltip; the second bounded only a window-frame boundary;
window-only stability still missed a nested Moodle scroller in the third.
The final successor waits all actual scroll ancestors and uses the same paint,
geometry and AA oracles. It does not alter product Motion or tooltip dismissal.
Keyboard focus and Mass Import/admin1280/390 completion proof are pending.

Native075415483Z-47324PASS: actual Shift+Tab/Tab back to the participant eye opens its focus popover at1280/390; MI/admin1280/390 ready, correct isolated sheet, no horizontal overflow, five admin choices.0browser errors/0business writes. These page checks do not certify arbitrary Moodle help popovers. K15-07 visual relay: tooltip/popover-surface + palette-aware-popover, SM details hover and keyboard focus, default/configured palettes,1280/390; MI/admin delivery unchanged. Human/Penpot acceptance stays open.
