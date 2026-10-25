# Foundation publication and EasyStud consumers

Successor of EED-UI-2026-0073. UI Kit commit
`c80961f901ba27267a31555123fa0033c8b944f7` releases 0.4.90 with the public
`easyedu-icon-tile--warning` and `easyedu-icon-tile--danger` palette modifiers.
Primary and Success retain their original recipes. Success uses accent tokens.
The consumer imports the identical `_foundation-classes.scss`; its only emitted
CSS changes are the two new modifier blocks. No PHP, Mustache, controller,
duration, easing or card/column Motion changes.

## Shared source and product linkage

Foundations file `40e06342-8830-80d6-8008-96572effc11c` publishes eight section
icon tiles: Primary, Success, Warning and Danger in Regular 40.8px/20px glyph
and Compact 35.2px/17px glyph. Standard and Library recursive geometry/paint
fingerprints match. Hosts are separated from existing boards by 80px.
The Kit private evidence is
`docs/testing/foundation-tile-filter-publication-2026-10-04.json`.

EasyStud file `220f6449-533e-815b-8008-ad9958d032a1`, page 01:
39 existing main-header wrappers now link to Compact source providers
(18 Primary, 18 Success, 3 Danger). Original glyph components are retained.
Glyph descendants are normalized from the linked 24px master, not their painted
bounds. Settled readback verifies provider and glyph links, 17px centred roots,
containment and unchanged 35.2px tile geometry. Desktop/mobile Validation
exports were inspected internally. Old wrappers remain hidden in their
original parent, recoverable by the old IDs; no material design was deleted.
They are not counted as live controls or a completed archive-page cleanup.
Exact old/new/provider IDs are in
`docs/testing/foundation-section-tile-consumers-2026-10-04.json`.

Foundation Filter On now links to Primary `#0f6cbf`; Reset Rest/Hover/Focus
use the shared 11.52px radius and canonical soft/focus paint. New Touch source
states are 294x44. EasyStud page 03 Reset
`df1dc7b5-2b58-807e-8008-bc370f07f6c0` links to Touch Rest provider
`cf371b29-2e8e-8011-8008-bd539713c88a`; its settled label is centred and contained.

## Evidence boundary

Expanded shared Reset/semantic-tile browser checks pass at 1600/768/390:
`filter-tile-controls-20261004-190100`. SCSS-only package export 0.4.90 contains
43 SCSS entries and no internal docs/agent material. These are isolated proofs.
Native nested parent closure baseline
`easystud-authenticated-20261004T184303674Z-12180` passes three cycles at each
of 1600/768/390, preserving transition, ARIA/inert and nested closure. It has
no fixture/data write or page error; credentials, child and lease were cleaned.
This run predates the new palette classes, so is not the native 0.4.90 proof.

Managed preview `b542e770d9fdf6aba5ba8b182e6763834af6ecfd` serves 0.4.90,
with caches purged. Native successor
`easystud-authenticated-20261004T190630471Z-37384` passes initial Mass Import
at 1600/768/390 with the real picker ready, compact identities, caption/dash,
responsive lanes and transient settled CSV framing. Cleanup confirms cleared
credentials, stopped child and released lease; no fixture or data write.
This does not certify native Warning/Danger/upload/report lifecycle.
The nine Preview introductions are now added with downstream geometry proof;
see the successor below. Full lifecycle and combined human acceptance remain
open. No actual import, message, Move/Drop or settings save was executed.
Guide remains deferred until the EasyStud component programme.

## Integration and recovery

Build with the consumer's existing Sass 1.79.1 toolchain. Using the newer Kit
fixture compiler to rebuild this legacy consumer changes selector nesting and
media grouping; that unrelated generated drift must not be promoted. Compare
the full CSS diff, not only the presence of new classes. The unchanged
mixed-declarations warning at `_layout.scss:101` remains a separate follow-up.
Promote the previous documentation commit before this source successor,
then purge through the managed runtime gate. Recovery is an additive source
revert/new preview commit, never a reset of a shared checkout.

Platform planning/crosswalk files belong to the planning owner and are not
edited here. This source-owned successor is the portable exact evidence backlink.

## Nine Preview introduction successor

Read `index.php:1251-1294` and EN/FR `csvreportintro`: the results-header
introduction precedes counters and the Preview notice in every preview state.
Nine product boards now include that exact FR copy in 14.4px Inter, followed by
a separate counter row and the unchanged existing content. Desktop titles no
longer share their text lane with summary badges. Remaining content shifts by
one measured delta (57.2/71.2/77.2px); internal gaps, button sizes and all table
cells stay unchanged. Three loose linked desktop tables are reparented to their
actual results panel with preserved original position before the common shift.
Collapsed desktop upload rails match the expanded results-panel height.
Shell surfaces grow without stretching their top accent. Course/outer mobile
frames contain the full content, including notes previously outside the course
frame. Root rows are packed with 80px minimum separation; 24 active outer boards
have zero intersection after settling. Desktop and mobile exports were inspected.

Exact old/new heights, affected child IDs, root movements, text containment,
provider links and relative-body preservation are recorded in
`docs/testing/mass-import-preview-introductions-2026-10-04.json`.
This is source-backed Penpot composition, not a native preview-upload test or
whole-view acceptance. No plugin layout/source behavior change was necessary:
the served PHP already renders this introduction. Originals remain recoverable
through IDs/Git evidence; no design content is deleted.
