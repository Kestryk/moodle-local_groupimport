# Mobile participant membership density (SM-50)

EED-UI-2026-0073. Existing Source/Kit worktrees, Guide and shared Platform plans
remain independently owned. Source candidate only until explicitly promoted
and tested; no human acceptance claim.

## Behavior contract

- At the native responsive breakpoint (<=1024px), preserve participant identity,
  roles and configured custom fields and existing responsive avatar visibility
  (the native phone layout already hides the avatar). Default hiding applies only to
  Groups/Groupings membership rows, regardless of total course participant count.
- Reuse the existing density action, existing Kit button/type/palette and native
  Motion. Mobile copy is Show/Hide groups and groupings (localized); desktop
  Compact list/Full details remains unchanged.
- In mobile compact mode, sole participant selection reveals that card's
  memberships; a second selection collapses them. Deselection from two to one
  reveals the survivor. Manual full mode reveals all memberships and takes
  precedence until compact mode is restored.
- Store desktop card density independently and restore it across breakpoints.
  Never apply participant membership mode to Grouping cards. Existing filters,
  selection commands, member selection, More Filters and Guide remain native.
- New hooks label only the two existing membership rows. Native HTML `hidden`
  uses Moodle's existing Bootstrap hidden rule; no inline style, additional
  SCSS declaration or new font/animation family is introduced.

## Source baseline and pending proof

Base `02d8013`, scoped rows in `templates/manage.mustache`, localized data labels
in `manage.php`/language files and a separate participant-density controller
inside the existing AMD. Source-preservation guard reconstructs untouched
commands/Guide/disclosures, verifies exact template adapters and unchanged CSS.
Isolated states cover 390/768/1024/1600, zero/one/two/deselection/manual mode and
breakpoint restoration; they are not actual browser Motion/checkbox proof.

Product page 03 was inspected before source implementation: existing mobile
Participants board `cef95197-06bc-809e-8008-aeeaa9e3ad0d` still shows compact
shells only, without the requested role/profile/membership density compositions.
The successor is now published on that mobile board and on the Tablet board
`92c1c225-95fb-802e-8008-aeaca893efac`; old compact-only specimens remain hidden,
recoverable. Four two-card behavior cases are on the dedicated product board
`8a982f17-c9c0-80e9-8008-beaaf2c3fa3b` (page 03, x80/y14810). Cards, checkboxes,
Eye and More actions retain Foundation links; metadata reuses existing product
specimens and their Inter styling. Their inherited old 13px/dark title override
was replaced with the existing Kit identity role, 14px/700 `#264861`, in all
twelve new phone/tablet compositions, not a new token or CSS patch.
No new product-local masters or styling
family. This consumer visibility rule does not require a new Foundation paint
recipe; do not silently promote a product-specific controller into the Kit.
Canonical `docs/components/cards.md` and Kit AI/changelog record the consumer
visibility contract, without bumping 0.4.113. Broader legacy Foundation title
override reconciliation stays tracked under the existing card audit, not closed
by these twelve product usage copies.

Ten phone cards passed current visible descendant containment and header-centre
readback (zero title/checkbox vertical delta); native geometry is still pending.
The owned editor checkpoint `sole-selected-editor.png` in external manifested
run `sm50-density-20261005` was inspected; its MCP toolbar overlaps the specimen's
top edge and it is not an unobstructed pixel-parity export. MCP export stalled,
no unsaved editor was closed, and readback reconciled the completed write before
continuing (no duplicate board). One checkpoint pinned; retention dry-run zero
eligible/deleted/error. Tablet post-swap descendant settling is checked separately.

Build, PHP lint and 32 isolated state/preservation checks pass. No-op refreshes
do not remeasure or reanimate unchanged cards; each changed card gets its own
existing Motion.resize callback. One-test supervised discovery passes, without
credential loading, runtime/data writes or a native PASS claim.

Pending: native three-width/320px containment, zero/one/two plus filtering,
manual action through actual mobile overflow, caption/ARIA/focus and normal
resize/swap transitions/reduced policy. Inspect mobile checkbox/title tracks,
roles/fields and unrelated Grouping states. No business POST/fixtures required.

Declared minimum: Moodle 5.1 (`version.php` unchanged). No other Moodle version
is certified by isolated tests. References consulted:
[Moodle coding style](https://moodledev.io/general/development/policies/codingstyle)
and [Moodle 5.1 JavaScript](https://moodledev.io/docs/5.1/guides/javascript).

## Native failure and bounded title-track successor

SM-50 `2a6b6b1` was served by request `20261005T201827Z-8105db4d3f`
(runtime `a9cd5fe2`, clean). Its first native 390px zero-selected case failed:
the 44px selection hit target overlaps the name. Run
`easystud-authenticated-20261005T201916853Z-25976` retains the assertion,
error context and successful credential/lease/child cleanup; no business writes.
This is a real layout failure, not completed native behavior coverage.

The successor opts into canonical Kit 0.4.114
`person-card-selection-title-clearance` at the existing <=560px/full breakpoint.
It reserves only the title/badge lane (2.02rem), retaining metadata/email width,
44px target, desktop/compact CSS and all JS/Motion. The complete CSS delta is
exactly one three-line rule, compiled with Sass 1.79.1; older Sass 1.58.3
introduced unrelated selector drift and its output was replaced by this build.
The complete responsive module matches Kit `5387a80` after line-ending
normalization; its pre-existing experimental narrow mixins are not opted into
by this lot. No other independently pinned Kit module is overwritten.
`test-mobile-participant-title-clearance.cjs` proves the complete unrelated CSS
and reruns the pinned historical controller/template/build/design checks.
The native successor keeps all strict oracles and records geometry before an
assertion. Its result, paired shared recipe readback and human review stay open
until independently recorded; the earlier failed run is never reclassified PASS.

Second served run `easystud-authenticated-20261005T204100100Z-16336`
(Source `d6c89f0`, runtime `5bff69a7`) passes eight 390px geometry/selection
records and four native 136ms resize transitions, then times out on the assumed
panel-overflow access. Native source audit confirms responsive panel actions
are intentionally hidden at <=1024px; the manual membership control was not
actually accessible. This is an implementation omission, not complete PASS.
Cleanup is complete, no business POST or fixture occurred, retention dry-run
is non-destructive. The strict successor uses a dedicated existing Kit selection
action/tray button outside that hidden bar, forwarding to the same controller.
It appears only in the participant view, updates localized label/pressed/icon,
and hides on desktop; no additional CSS or Motion recipe. Five isolated bind
states now cover actual mobile access and forwarding. The native test uses
that real control and the existing responsive Clear selection proxy; action
timeouts are bounded at 15 seconds instead of consuming the full 5-minute test.
Six Product controls reuse linked Foundation Neutral selection actions and
Expand/Compress icons; source/control glyph size and padding stay canonical.
The obsolete panel-overflow note is corrected and full-view controls no longer
overlap filters, top pagination or the first card. Readback/native successor
and human acceptance are still separate gates.

## Previous lot's managed publication

SM-51 documentation promotion request `20261005T192922Z-681e270c05` completed:
Source `02d8013` -> runtime `12404f6f`, clean checkout and unchanged CSS/AMD
blobs `4fce5021`/`bd1b85d5`. The managed profile did purge Moodle caches
(`cachePurged: true`) despite no explicit refresh flag. Record the actual
worker result, not an inferred no-purge statement. No native browser or fixture
write was performed by this design/documentation lot.
