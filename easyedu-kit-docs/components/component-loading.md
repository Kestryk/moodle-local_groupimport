# Component loading and workspace reading rhythm

K18-C-MI (18 October 2026) consumes the existing loading tokens and Motion
restrictions without a second skeleton palette or animation.

`loading-control-capsule` paints the **actual unbound control** as a shimmering
capsule, including native submit inputs. It keeps width, height, padding and
border width. Text and child icons are temporarily hidden; no duplicate action
or page is rendered. The consumer owns readiness and must prevent interaction
until bindings exist. Use `loading-control-reveal` once when the real control
becomes ready. Reduced/minimal motion and forced colours remain static through
the existing loading primitives.

Known server content stays visible. Do not fabricate a preview or duplicate
headings, navigation, panels, empty states or counters as loading placeholders.
An empty result returned by the server is already known and needs no skeleton.
The native Moodle picker must be initialized before an import page is ready.
`moodle-file-deposit-pending` reserves Moodle's already-rendered picker wrapper
while its inline `display:none` waits for YUI. The single Kit adapter override
is restricted to the consumer's inert loading state; native binding reveals the
same wrapper, without a second picker or synthetic control.

`workspace-reading-rhythm` opts form/report pages into title/body line-height
1.5; `type-workspace-reading-title` reuses the page-title role with semibold
weight. The applied K18-15 proportions are page title 20/30 px, section title
16/24 px and body 14.4/21.6 px at the 16 px baseline. Condensed workspace
defaults are unchanged. Actions keep the existing Core Action 37.6/44 px.
`easyedu-form--workspace` promotes the native Choose file action to the existing
44 px touch target at all widths (minimum width 180 px, bounded by its track).
The primary submit uses the existing 44 px target on narrow screens. The native
repository, draft, progress and validation callbacks are unchanged.

Consumer proof must compare real-control rectangles in loading/ready states,
check no overflow at desktop/touch widths, and verify no animation under
reduced/minimal motion. Source parity does not certify browser or human review.

The native input label has no ordinary child span. Use
`control-label-natural-metrics($native: true)` in the workspace Moodle adapter.
It sets the browser's natural line metrics; the existing control height, font,
padding and radius remain intact. Native Chrome shadow-text Range measurements
are centred within 0.008 px horizontally and 0 px vertically in FR/EN at
1600/1280/768/390. These measurements do not certify every browser engine.

`moodle-file-deposit-workspace-tokens` defines an 18 rem minimum page-grid
track and an 11.25 rem action minimum. The consumer can keep its column ratio
while a Moodle drawer reduces the available width, then use its existing
stacked responsive layout. Do not force the complete translated native picker
into the illustrative 180 px deposit height; its real help/requirements remain.

Base 0428c2a retained the GMI-C2/C3/C4 Guide assets. Loading footprint roles
already consumed by EasyStud at 665bd86a were also carried back unchanged:
control-regular/compact/tall, card-title/card-title-detailed/action, physical
height opt-in, workspace frames and settings/import pending insets. This avoids
removing prior K16-80 definitions when synchronising the entire loading file.
