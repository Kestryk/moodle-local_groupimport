# Entity metadata lists - source-preserving Kit transfer

Batch `EED-UI-2026-0073`; consumer base `e18d6b8`. This is a source checkpoint,
not a release, production deployment or human approval.

## Implementation

Canonical `scss/easyedu/components/_entity-metadata.scss` exposes opt-in
settings and readonly-detail list recipes. Titles/counts, count labels, four
semantic roles, chips, primary/secondary metadata, scroll/hidden CSV tables,
full-summary focus, empty states and description surfaces now come from the Kit.
The plugin removes 205 net SCSS lines and keeps selector/composition adapters.

Native controller, Mustache, Motion, responsive grids, conditional contents,
CSV handlers, list predicates and chevron rotation/reduced-motion ownership
remain unchanged. No new inline style, command or business request is added.
Legacy 650/720/760 weights are deliberately preserved, not silently normalized.
This is not yet whole-body public-class adoption or pixel parity for lists.

## Verification

- Baseline: `%LOCALAPPDATA%/EasyEdu/handoff-snapshots/student-completion-20261003/entity-lists-baseline/before.css`.
- Complete compiled CSS blob remains `c7b7945a536938555cbc77a917d3eb8df69be7e4`;
  all 12,973 emitted selector/property sequences match.
- Native controller `29316919fb4183bf8e4454a3e98b8b8b9ce5e911`, Mustache
  `ff82011e41b34b47ea4356dc6b08da2cb69d52bb`, Motion
  `3ecbd088a82bf7b91a003dfcbf22035f5cc715d2` are pinned unchanged.
- Kit: `scripts/test-entity-metadata-contract.ps1` and
  `scripts/test-entity-fields-contract.ps1` compile both APIs.
- Consumer: `tools/release/test-student-entity-metadata-contract.ps1 -KitRoot
  <canonical checkout> -BaselineCssPath <saved before.css>` verifies source
  identity, native source hashes, predicates and whole-CSS preservation.
- Field/Textarea/footer gates accept the explicit additive metadata export pin;
  historical field/browser/readback evidence stays immutable.

The prior nine native field/dialog cases remain evidence for the same CSS/AMD
assets; they are not relabelled as a fresh metadata-browser or Penpot-list PASS.
Foreign CCB overlays, full translated/RTL/forced-colour states, image/file/Close,
public-class migration and the global human checklist remain open.

## Penpot field reconciliation (separate from list extraction)

Foundations 08.4/08.4.1 now carries twelve shared Regular/Narrow field specimens:
detail, optional empty detail, readonly count/empty, editable and textarea.
The optional empty-detail composition uses the existing opt-in empty value role;
it does not change native Participant values. Textarea height/rows are illustrative
consumer composition, not a newly imposed native height.

Standard host `a301101d-ddc2-807b-8008-bb6dd6dc6194`, Library host
`a301101d-ddc2-807b-8008-bb6b608ca7c5`: twelve recursive fingerprints match,
and all text paint stays within the field. Caption/value/editing roles are
Inter 12.16/600/#62788E, 14.08/400/#263B4F, 13.76/400 respectively. Readonly
empty values use #8A9BAD. Existing source focus #86B7E0 remains explicitly
separate from the general Foundation focus palette; no all-state claim.

EasyStud page 04 replaces seventeen isolated fields in Participant (7), Group
(5) and Grouping (5) with linked Foundation instances. Original specimens stay
hidden/recoverable. Values, native content, image/file/list bodies and footers
are retained. Enrolment-key help is aligned to its caption; count capsules fit
their text. Readback: `testing/student-entity-fields-penpot-2026-10-03.json`.
The old field-caption palette gap is resolved for these seventeen specimens,
not for all modals or every responsive composition.

`tools/release/test-student-entity-fields-penpot-readback.ps1 -KitRoot <kit>`
checks the saved twelve pairs/seventeen providers, source pins, roles and painted
containment. This is a snapshot contract, not a fresh live-editor or all-state
test. The six inspected external viewport captures are pinned; scoped retention
dry-run found one manifest, zero candidates/deletions, six protected files,
zero unmanaged media and no errors.

## Evidence capture and efficiency

An editor write timed out while its tab was suspended. Settled readback found
all ten initial masters, so none were duplicated. The two readonly-empty masters
were then added explicitly. Refreshing an already connected library through
`connectLibrary` exposes new providers without bulk-updating unrelated copies.

Product board raster exports timed out; retain this as an export failure, not
visual acceptance. The bounded owned-tab capture helper fits one specimen at a
time and saves viewport PNGs outside Git. It never reloads/closes a potentially
unsaved tab. Register and pin captures, then run scoped retention dry-run only.

No reliable billing/token telemetry is available; no consumption number is
invented. Use smaller editor operations, exact paths/pins, compile/equality
gates before runtime and bounded single-specimen captures. Avoid parallel
Penpot raster exports and keep storage-bound helpers scoped to their live file.

Preflight detected that copying the differently scoped canonical AI contract
would remove existing consumer-only native-dialog guardrails. Restore all
baseline rules and add the new extraction/editor rule explicitly. The metadata
gate checks their preservation. Keep the first preflight snapshot recoverable;
the corrected verified snapshot supersedes it for handoff.

## Portable Platform-owner proposal

Add the two field hosts and seventeen product references to the source/Penpot
crosswalk using the saved readback; `human_visual_validated` stays false. Record
the opt-in metadata API and pending list publication/public-class migration.
Shared dirty Platform plan/state/registry files are not edited by this window.
