# Accepted Guide/canonical parity on817dea20

Consumer production and embedded mirror are unchanged. The canonical candidate
starts at4c27185, the last dedicated Kit tip. That predecessor contains the
pending hidden-text utility but emits no CSS on its own; this parity delivery
does not activate it in the consumer. The consumer is the visual authority.

Exact canonical copies cover accepted90933976(K17-33 stacked title/hint),
dc7dad16/46250fef(K17-38 details branding and144px height), fec6e2c1 and7c132f2e
(bubble real-size/top-boundary placement and immediate Escape suppression).
Four canonical files change: two Guide SCSS partials and the existing Guide
engine/shared-bubble mirror modules discovered from the checked-in mirror.
No visual value, template, runtime source or generated consumer asset changes.

T03717,T03849 and roundtrip6Guide/3bubbleexports/3modules/7SCSS/7templates PASS.
The existing embedded consumer mirror already reconstructs the exact accepted
engine. No product mirror adjustment is necessary. The source branch contains
only a corrected historical test and evidence, no frontend module path pin.

test-tooltip-light-source was independently stale: it compared all legacy Kit
recipes to older revisions and assumed styles.css was the old global bundle.
Its exact predecessor is archived byte-for-byte. The successor requires the
entire canonical/consumer tooltip source equal to accepted817dea20, all ordered
tooltip/popover selectors/declarations/priorities/at-rule ancestry identical in
each of the three owning page sheets, and global0rules. All12original Light
Short/Long values remain asserted through Sass1.79.1 compilation; no value is
changed and no unrelated rule is ignored within the tooltip projection.
The test now accepts explicit absolute Kit, Sass and PostCSS package paths and
checks exact Node22.11.0/Sass1.79.1; it never calls an unknown global Sass binary.

No Moodle/runtime access, publication or main merge. Other-consumer acceptance
is separate. Detailed immutable predecessor failure and current proofs:
C:/dev/artifacts/guide-parity-817dea20-20261017/.
