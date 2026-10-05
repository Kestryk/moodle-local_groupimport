# Read-only entity-field typography follow-up (SM-51)

Source and live Product Penpot inspection under EED-UI-2026-0073; not a fresh
native modal or whole-body parity PASS. Human checklist remains OPEN.

The canonical `entity-field-value` already includes `typography.type-body`,
then the control-sized 14.08px value and regular weight. It resolves the same
`--easyedu-font-family-ui` as paragraph text. Participant `entity-detail-field`
and Group/Grouping `entity-settings-field` consume this shared recipe. The
existing native entity-dialog scenario requires Inter/14.08px/400 values and
12.16px/600 quiet captions, but it has not been rerun in this tranche.

Live Product page 04 (`cef95197-06bc-809e-8008-aeff9a955b2c`) readback confirms
the active Username, City, Country and Language field compositions all use
Inter/14.08px/400 values, and Inter/12.16px/600 captions:

- Username: `a301101d-ddc2-807b-8008-bb6e79102ecd`.
- City: `a301101d-ddc2-807b-8008-bb6e7c4dedae`.
- Country: `a301101d-ddc2-807b-8008-bb6e7d27363e`.
- Language: `a301101d-ddc2-807b-8008-bb6e7ea17b00`.

Do not misclassify hidden Open Sans shell descendants as the current rendered
fields. A broad text search matched 250 nodes, mostly hidden legacy/provider
content; visibility-qualified readback identified five active exact-name
matches, then inspected the four actual field hosts and their values. No font,
colour, content, geometry or Motion was changed by this audit.

Next: fresh scoped native Participant/Grouping body inspection at desktop and
mobile, then correct any genuine discrepancy through shared recipes and linked
Foundations, not speculative font overrides. Grouping body arrangement and
optional/empty fields remain OPEN.
