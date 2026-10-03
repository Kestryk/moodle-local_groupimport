# More filters - SM-17 / EED-UI-2026-0073

Kit `7c4118166d1914df05aa8335e47bed786ebb2669` owns the two byte-identical
form/responsive recipes, 0.4.61 source checkpoint. Hover is 72% primary-soft plus
28% surface with the ordinary control border; Expanded/focus/Disabled remain
distinct. Legacy mobile delegates to the Touch recipe instead of forking its
border, gap and radius. Source CSS changes only eight declarations in four
hover rules. No plugin SCSS paint, template, controller, API or Motion changes.

Foundations 08.5/08.5.1 reconciles five existing Wide pairs and publishes five
Touch pairs. All share Inter 12.16px, a measured 6.72px painted gap, canonical
24px transparent linked chevron root and centred text/glyph. Touch is 44px,
Wide illustrative height 34px represents native 33.59375px. Focus uses the
shared ring; Disabled 0.62 opacity is explicit. Ten recursive pairs have no
unexplained geometry/paint/provider mismatch or descendant overflow.

EasyStud page 03 updates twelve visible Wide controls and four Touch controls.
Three unified mobile filter shells grow 12px to retain 8px bottom padding for
the 44px touch row. Their Search fields/content stay native to the existing
composition, not a second separate block. Hidden superseded compositions stay
recoverable. Shared-library notification is acknowledged; a click timed out
after dispatch, then settled state was inspected rather than clicked again.
All sixteen controls retain linked providers, zero overflow and centred paint.
No competing product Library is created. SM-14 historical readbacks stay pinned;
this successor supersedes its temporary touch density override.

## Verification and evidence

`test-student-more-filters-contract.ps1 -KitRoot <kit>` guards exact canonical
files and unchanged behavior/template/Motion against `d0083b5`.
Kit compile/type/hover gates pass; isolated `filter-disclosure-20261003-b`
passes three widths with inherited Arial harness family, geometry, hover,
keyboard focus, Expanded/Disabled and no Moodle/network/credentials.
First isolated run uses the browser's default serif family and is retained as
intermediate, not native typography/icon proof. Source controls still inherit
the Moodle family; only the test harness supplies a font.

Readbacks: `testing/student-more-filters-{foundations,product}-2026-10-03.json`.
External source/product captures: `EasyEdu/artifacts/penpot/more-filters-20261003`
with `standard-touch.png`, `library-touch.png` and settled mobile board capture.
The first product crop retains the transient library banner, not final proof.
All artifacts are manifested; retention is dry-run only. Human checklist open.

Native scenario `student-more-filters-preview.spec.js`, exact test
`More filters share calm hover touch geometry and retain disclosure Motion`,
is local-supervised under the `easystud-filter-panel-geometry` family. It uses
existing data, blocks business POST, opens/closes without modifying membership,
and observes the original normal-motion transition, ARIA and inert states.
Clean pushed preview/cache/saved-credentials lease is required before running.
Native proof remains pending until a successor evidence record is written.

## Portable Platform-owner update

Propose ten paired Foundation IDs and sixteen inherited product controls for
the crosswalk, native scenario as local-supervised, Kit contract as ci-reusable.
Keep source, recursive readback, agent capture inspection, native proof and
human acceptance separate. Shared dirty planning/registry/batch files are not
edited by this window. SM-15 extra-role fixture, SM-16 Skeleton and SM-11
whole-board toolbar remain open; this increment does not certify them.
