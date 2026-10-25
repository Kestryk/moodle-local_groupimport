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

## Scoped native successor intake

`student-entity-body-successor.spec.js` retains the original entity-dialog
assertions and actual course data. Additions are explicit read-only request
guards, non-consuming unsent-draft bootstrap and saved-palette-aware icon
paint. One-test discovery PASS 170623694Z-34936. Desktop settings open followed
by resize is responsive body geometry proof only, not a mobile entry point.
Fresh live Penpot readback reconfirms the same four IDs and Inter 14.08/400
values, 12.16/600 captions. No design/source style change is justified yet.
Native result pending; Grouping body/optional/empty and human gates OPEN.

## Fresh scoped native result

Run `easystud-authenticated-20261005T170755545Z-45416` PASS, source protocol
`db34c492`, runtime `324bd396`: Participant, Group and Grouping at 1600/768/390
(nine cases, 42 measurement records). Actual value family is
`"EasyEdu Inter", Inter, sans-serif`, 14.08px/400. Caption family is Inter,
12.16px/600; native edit controls remain the separate 13.76px role. All nine
bodies retain their expected fields/list counts, viewport containment, shared
Close geometry/hover and action-row density/end alignment. Participant remains
read-only; Group keeps image/enrolment/delete controls; Grouping omits them.
Native opening/Cancel and desktop return focus pass. No Save, upload, export,
navigation, fixture or membership writes. Errors/denied requests zero; child,
credentials, lease and fixture cleanup all complete. Manifested retention
dry-run has zero deletions. Mobile Participant/Grouping captures inspected.

The value-font complaint is not reproduced in this currently served revision;
no additional SCSS override or font family is added. This is not whole-body
human acceptance: native nonempty descriptions/optional profile fields were
not manufactured, and desktop-open-then-resize is not mobile settings entry.
The 390px captures show the native sticky navigation launcher protruding over
the modal's left edge; retain that SM-49 layering/visibility follow-up instead
of hiding it for the screenshot. Participant avatar lifecycle is not covered.

Live Grouping full-dialog export inspected at
`cef95197-06bc-809e-8008-aeffae533daf`: field type is current, but its older
Groups list still uses 13px/700 legacy rows while the separately corrected
native metadata specimen uses 13.44px/canonical primary-then-chips. Full-dialog
propagation and paired Settings-list/row Foundation publication remain OPEN
as already tracked in student-entity-metadata-native-2026-10-03.md. Do not claim
that the native font PASS closes these distinct design-composition gaps.

## Paired list publication successor

The Settings-list/Row source catalogue now has paired source-preserving
Open/Closed/Empty/Row instances. Full Group and Grouping lists use those linked
families and the actual 13.44/600 primary role, retaining original names, counts,
IDs and native max-height excerpt. Settled type/containment readback passes;
the full Grouping export has been inspected. See
entity-settings-list-publication-2026-10-05.md for paired semantic chip publication
and the inspected full Group export. No stylesheet/controller/runtime change, no
human acceptance claim; historical native proof and remaining optional/mobile
gates above remain intact.
