# Foundations Student Management migration

## Flat allowed-drop affordance — 2026-10-01

Danger run `easystud-authenticated-20261001T191849868Z-38092` passed behavior,
native refusal, dimensions and colors on preview `e6a9c5d`, but capture inspection
found the indicator absent. The collapsed Grouping rail uses `::after` with
`display:none`; the new recipe had not reset it. Kit `dc73b7c` adds explicit
display and clears the rail's bottom inset. The test now asserts display too.
This passing run is not visual acceptance; final rendering proof is pending.

Allowed-state run `easystud-authenticated-20261001T191414061Z-42704` passes
Participant/Group Single/Multiple on preview `726dcb0`; no drop or mutation,
cleanup complete. Earlier `190811181Z-25960` failed because the harness never
opened a Grouping to reveal the Group target; `191226898Z-8628` failed a
fractional-border assertion. The shared authored border is 1.5px; its computed
width snaps to device pixels, as specified in
[CSS Backgrounds and Borders](https://drafts.csswg.org/css-backgrounds-3/#border-width).
The corrected scenario compares a native 1.5px probe and retains a separate
static authored-width contract. These failures are not silently waived.

Kit `ef6bd6e` adds the paired Danger recipe from linked main
`3a2df4fd-35b1-804c-8008-a5a396ce8d39`: normalized xmark, #c9271e glyph,
#fff4f2 surface and #d96b63 border. Sizes S/M/L keep 32/40/48px circles with
16/20/24px slots. The EasyStud adapter shows it only while participants hover
an already disabled empty Grouping. Eligible nested Group targets take
precedence; refusal does not preventDefault or enable dropping. Transient
feedback clears on leave/end and return to an allowed Group. No endpoint,
membership logic or disclosure animation changes. Danger browser proof pending.
Target-only screenshots temporarily hide the decorative preview so the
indicator is not covered; native drag state and target geometry remain intact.

Kit `dc9d312` replaces the legacy insert-target 43.2px font plus with the
linked Foundations 40px circle, 20px SVG slot and 1.5px blue border. Normalized
glyph paint is 13.5416px square, centred in the slot. Existing receiving-card
gradient, semantic rail and shadows match the read-back Penpot target and stay
unchanged. No AMD, eligibility, membership or animation change.
The exact embedded overlays blob is `5db6f471f45fd87f144c306ea41ed5673906be9b`.
Native dragover/dragleave assertions extend the preview scenario to Participant
and Group allowed targets, Single/Multiple. Preview/browser proof pending;
denied/danger, cancelled/error feedback and mobile drag coverage remain open.

## Foundations drag preview - implementation slice

Penpot product page03 already includes linked Participant Single, Group Single
and Group Multiple previews with a primary moving outline and Dragging badge.
The plugin now consumes canonical `drag-preview-moving-outline`, moving-badge/
icon and count-placement recipes. The old participant-specific gradient/shadow/
radius and dark outside counter overrides are removed. Source card contents,
semantic rails, root drag event flow and existing Motion are preserved.

The body portal relays resolved workspace Kit/theme custom properties and font
family; it does not invent replacement CSS values. Moving label uses Moodle's
template string helper and English/French language strings. Decorative clone
is inert/aria-hidden. Multi-selection count retains `+N` extra items, not total.
The native-drag spec never sends drop or confirms a membership operation.
Declared floor is Moodle5.1; no other-version executable compatibility is claimed.
Official template reference: https://moodledev.io/docs/5.1/guides/templates

Visual acceptance is deferred at the user's request. Track it in
`foundations-review-checklist.md`; do not confuse technical proof with acceptance.

## Narrow selection and native member disclosure - 2026-10-01

Final supervised candidate run `easystud-authenticated-20261001T180425356Z-36668`
passes four widths plus selection/deselection at 320px. Selected mobile cards
remain compact and readable; the source-defined detailed single-participant
exception is preserved. Transition property/duration/easing declarations match
across selection and the unselected height is restored. The name stays a block
so ellipsis works; shared experimental recipe owns its aligned line box.
The selected screenshot centres the card above the real sticky actions sheet,
without hiding or changing that product control. No served style is changed.

Existing native member-list run `easystud-authenticated-20261001T180240745Z-42952`
passes at 1440px: transitional `is-easyedu-disclosing` on open/close, collapsed
member actions inert and outside Tab order, restoration on opening and focus
returned to the toggle on closing. No membership mutation or fixture request.
This proves the existing desktop disclosure, not every mobile/card animation.
All runs complete cleanup. Paired Penpot 320px specimens and acceptance of the
taller density remain pending; the candidate is not embedded or deployed.

## Readable narrow-card candidate - supervised only

Read-only run `easystud-authenticated-20261001T173544066Z-30468` confirms the
320px card reserves 61.6px left and 56px right, leaving 103.53px for its headline.
Separate readable-density run `easystud-authenticated-20261001T174225409Z-44504`
passes at 320/390/768/1600: name 66.75px and email 103.53px at 320px, complete
primary badge, aligned name/checkbox/eye centres, unchanged wider card-local
geometry and text contents. Height grows 45.97 -> 93.125px; no control or
Motion is removed. This is not deployed or accepted: paired Foundation/Product
320px specimens and acceptance of the taller density remain required.

Comparison `20261001T173931972Z-44892` stopped at 390px on a harness error:
viewport coordinates were compared during Moodle scroll anchoring. Local
coordinate comparisons pass in `20261001T174054938Z-44536`; final run above
adds checkbox/name-centre gates and corrected fixture alignment. Injections
are removed in finally. Runtime stays `c58f0d1`; no consumer SCSS, generated
CSS, template, animation or business data changed. Tests remain exploratory.

Geometry evidence is not normal-motion acceptance. The isolated fixture now
uses a numeric 6rem compact maximum rather than `none`; before embedding it,
run dedicated selected/unselected and disclosure transition regressions.

Final numeric-endpoint run `easystud-authenticated-20261001T174755379Z-44640`
passes the same four-width geometry comparison. No runtime promotion.

## 320px readability investigation — not deployed

The enhanced metadata run exposes a residual 20.52px name lane at 320px
for the primary-badge participant (390px remains 54.55px). A temporary
canonical two-row fixture was tested in `student-narrow-identity-candidate.spec.js`
using external `EASYEDU_NARROW_PARTICIPANT_CANDIDATE_CSS`; it failed the
explicit >50px name / >80px email gate. Actual candidate: name 34.20px,
email 66.75px, height 52.80px versus 45.97px. No runtime stylesheet is modified;
the injected style is removed in finally. No business data/fixture is changed.
The 320px case therefore remains open, not accepted from containment alone.
Next investigation must account for the primary badge, full checkbox/menu
targets and terminal eye action together, preserving content and Motion.

## Compact sorting ownership and metadata reconciliation — 2026-10-01

The sort trigger and option selectors now call canonical `list-sort-trigger`
and `list-sort-option`, preserving all declarations and their cascade order.
Placement, opening/closing, keyboard routing and permissions remain local.
The complete generated CSS is byte-identical to its saved baseline:
`A573A49150B053BBC717810CEC5D3A7DD5912D33CBECAAD25A87580B2430CD14`.
Validate with `test-student-list-sort-contract.ps1 -KitRoot <kit>
-BaselineCss <external-baseline.css>`. The new public recipes do not redefine
every Dropdown S control or imply new human visual acceptance.

Penpot product page 03: 20 visible detailed metadata labels across five cards
now use Inter / 10.72px / 700 / 0.6432px tracking / #627387, a 84px label lane
and 8.8px value gap. Sixty value surfaces/texts move together. All label
painted bounds fit; compact phone cards and hidden archives remain unchanged.
Foundations Detailed Participant Hover main and its Standards copy receive the
same four-label role/grid. Original font/fill/width/value positions are stored
as `metadataCanonicalBefore`. Full main PNG export timed out; do not infer
visual acceptance from successful setters. Existing code already uses this
metadata role, so no runtime CSS adjustment or card-animation change is needed.

The metadata regression now covers 1600/768/390/320 and verifies visible
labels' role/tracking plus desktop label/value gap, preserving selection and
normal native animation settling. Browser results belong to the canonical batch.

## Filter-disclosure typography harmonization — 2026-10-01

`filter-disclosure-type` is the single Kit label role: inherited Inter family,
0.76rem (12.16px at the 16px root), regular weight, line-height 1.1. Forms
wide/touch and the legacy responsive helper consume it without local font
overrides. Foundations has 28 applicable labels across Standards, Library and
card compositions; EasyStud has 25 linked instances on page 03. Existing
component IDs, geometry and state paints are preserved. Penpot rollback data
is stored on changed labels as `filterTypographyBefore`.

The supervised `student-filter-typography.spec.js` verifies typography at
1600/768/390/320, mobile entity views and normal-motion open/close transitions.
It changes only ephemeral disclosure/view state, not memberships/settings.
Browser proof and human acceptance remain separate from source parity.

## Utility-control ownership extraction — 2026-10-01

The adapter `scss/components/_control-typography.scss` now calls canonical Kit
recipes instead of defining inherited font/weight and action-decoration rules.
Only selector ownership remains in EasyStud. `control-regular-type` applies to
More filters and Sort labels/values, `control-count-type` to counts, and
`action-text-treatment` to action triggers/menu entries. Its explicit legacy
priority preserves the previous rule; new consumers default to normal priority.
No blanket link reset, new theme override, size, geometry or motion change.

`tools/release/test-student-control-treatment-contract.ps1 -KitRoot <kit-root>
-BaselineCss <external-baseline.css>` checks canonical source parity,
selector-only adaptation and full file SHA256 equality. The complete generated
CSS remains `2A5B83D3876FCF9AEB9C555916F2BA4DEE07CA277B70FDE802C534CE019CF79F`.
Current source/served CSS also matches after checkout line-ending normalization.
Sass retains its existing loading/layout mixed-declaration warning.

This is source extraction, not a new visual acceptance or browser test. The
existing Penpot designs do not need duplicate components; their documented
typography must still be reconciled during later visual migration. No JS/AMD,
Mustache, translations, membership data or runtime settings change, so no new
functional workflow documentation is required. Canonical Kit source is
`24df5ad11c6af6297e021fbe07eba57d9720bd2d`; module blob is
`722c312e6c7bcd8509f15bfb60c92350b411202b`. Managed promotion results are
recorded separately in the canonical batch, not inferred from this extraction.

## Narrow pagination publication and integration — 2026-10-01

The dedicated Penpot browser is reachable through Playwright. Foregrounding its
tab and reopening its existing MCP button reconnects the relay after a file
switch; no credential extraction, alternate profile or VAE browser operation.

Foundations component `005a9cd7-189f-802f-8008-b916a75b1f13`, main
`005a9cd7-189f-802f-8008-b916a4da74a7`, is published on `08.2.2` with
320/390-width specimens, and linked twice on `08.2` in Standards section
`005a9cd7-189f-802f-8008-b917d3c19320`. Existing Select all, Dropdown S and
Pagination navigation controls are nested links. Dropdown compact dimensions
are explicit source overrides, not a new skin. The page indicator has a 34
canvas-pixel lane to prevent Inter proxy wrapping; its painted text remains
centred. An initial export exposed wrapped page text and an upward chevron;
both were corrected and the final linked export inspected. Descendant
containment passes after text metrics settle; this is not human acceptance.

Product page 03 receives three linked mobile top bars:
`005a9cd7-189f-802f-8008-b918a45e7d8b` (Participants),
`005a9cd7-189f-802f-8008-b918a5df79e5` (Groups),
`005a9cd7-189f-802f-8008-b918a70f92a3` (Groupings).
The old standalone participant Select all is hidden recoverably. Following
content moves by measured 52.5/90.5 canvas pixels to preserve a 16px card gap;
bottom pagination and existing card interiors/motion are unchanged.

EasyStud consumes the exact canonical narrow placement module from Kit
`4737661`. Only the adapter invokes the recipe; no local visual overrides or
new JS/AMD/template behavior. Source build and managed preview checks follow;
the previous temporary-browser proof is not deployment evidence.

## Narrow pagination investigation — 2026-10-01

The served Participant top bar overlaps sorting and page controls by 26.578px
at 390px. Desktop/tablet geometry passes in baseline run
`easystud-authenticated-20261001T064307765Z-30520`. No blanket typography or
theme defect was inferred: the 108.797px sort button plus caption occupies
136.5px and overflows its equal side track.

The canonical Kit candidate `pagination-narrow-layout` allocates selection and
sorting to row 1, page controls centred on row 2, at `25rem` and below. Existing
skin, font, DOM, behaviors and motion are untouched. Temporary-browser run
`easystud-authenticated-20261001T064808840Z-42304` passes 1600/768/390/320,
peer separation, full-bar page centring and open-menu containment. The 390
default and 320 open-menu captures were inspected. This is NOT deployment or
whole-view acceptance; only the sampled Participant top bar is covered.

Evidence: external authenticated run above,
`playwright-output/student-pagination-contain-cf505-ed-across-responsive-widths/`,
with `pagination-geometry.json`, four default captures and four menu captures.
Cleanup confirms credentials cleared, lease released and no fixture requested.
The optional fixture is compiled from canonical Kit source and injected only
for the test; it is removed in finally. Its missing-file validation now happens
during test discovery, avoiding credential/lease acquisition for a missing build.
The earlier harness-only missing-file run is retained, not product evidence.

Penpot health check reports a frozen plugin tab. Foundations Standard/Library
publication and linked product propagation remain required before consumer
integration. The active Moodle preview is still `6b3824f`; no runtime stylesheet,
cache, business data or card animation changed in this slice.

## Latest served checkpoint — 2026-10-01

Managed preview applied source through `55f3099` to runtime
`6b3824fb8497c1959da6a835f78494a303220eb8`, on clean branch
`preview/moodle51/easystud-phase0-mass-admin`. Cache purge succeeded.
Authenticated run `easystud-authenticated-20261001T062511059Z-17208` PASSED
the registered participant metadata scenario at 1600/768/390px, unselected
and selected. The phone's sampled name now has 54.547px and email 32.391px;
card height stays 45.969px. Desktop selected height remains 191.813px.
The 390px selected capture was inspected: eye/menu, primary badge and tray
remain present, and compact names retain more visible characters.

This closes the bounded identity-track correction technically. It does not
claim complete Student Management acceptance or full visibility of long names.
Foundations responsive recipe documentation remains queued, along with the
already human-accepted unified filters and centred view-selector instances.
No source/AMD motion edit or membership/data action occurred.

Artifacts: external authenticated run above, subdirectory
`playwright-output/student-participant-metada-cce7a--and-responsive-containment/`,
with six viewport screenshots and `participant-metadata.json`. Cleanup confirms
credentials cleared, lease released, owned child stopped and no fixture requested.

## Responsive name-priority correction — 2026-10-01

Canonical Kit `a29dcc2655937b113f3932af594bc3c86aba3f65` revises the
failed 1.6:1 trial to 3:1 identity/email tracks. Canonical and embedded module
blob: `c46260faf9a98871d23eb9e3746a6be876fc2c99`. The generated CSS change
remains one responsive grid declaration; no JS, template, action movement,
content removal or motion modification. Detailed-state overrides remain later.

Temporary-page comparison `easystud-authenticated-20261001T062130513Z-41764`
PASSED: sampled name 37.453 -> 54.547px, identity lane 72 -> 97.172px,
email 57.563 -> 32.391px, card height 45.969px unchanged, eye x=253.406px
unchanged. Screenshot inspected. Long names still truncate in a single row;
this is an allocation improvement, not a promise of fully visible names.
Credentials cleared, lease released and owned child stopped. No fixture/data
write. This supersedes the failed experiment's deployment prohibition for the
3:1 correction only; managed runtime proof is still pending below.

The preserved participant-state scenario now checks a >50px sampled name
lane and >20px email at 390px, including separation from the eye, before and
after temporary selection. Existing desktop/tablet containment checks remain.
Foundations responsive recipe update stays queued for a connected source pass.

## WIP responsive-name experiment — not deployed

User validated Penpot unified filters and centred selectors, then authorized
continuing. A canonical `person-card-responsive-tracks` candidate changes only
the identity/email grid ratio from 0.72:1 (72px minimum identity) to 1.6:1.
Canonical and embedded module blob: `63b6df9be0cac6e9eb68a3d752a0c1df8319e11a`.
Generated CSS differs by exactly that one declaration; no template, JS,
content, breakpoint, card height or animation edits.

Supervised run `easystud-authenticated-20261001T060748666Z-46584` FAILED:
sampled name width rose from 37.453125 to 42.25px, below the requested >10px
gain. Source spec `student-mobile-name-priority.spec.js` reads the compiled
candidate declaration and temporarily injects only that declaration into the
owned browser page. Its `finally` removes the stylesheet. No runtime files,
cache or business data were changed. Remaining assertions and screenshot were
not reached; do not claim containment or visual acceptance of this candidate.

Cleanup confirms credentials cleared, lease released and owned child stopped.
The failed run and its error context remain in the external authenticated
artifact directory. Source header/action/metadata contracts and Sass compile
passed, with the existing loading mixed-decls warning. The full-CSS equality
record for metadata extraction remains historical, not applicable here.

Do not preview-promote this WIP: next inspect how the primary badge and name
share the identity lane, retaining email and actions. Merely increasing the
grid ratio is insufficient at phone width. Foundation recipes are unchanged.

## Browser checkpoint — 2026-10-01 / participant states

Read-only authenticated run `easystud-authenticated-20261001T052852195Z-37172`
passed one scenario on runtime `10f3c86d69e4d62ad941b980bf8c0b2ef6525855`.
No preview promotion was needed: the metadata source extraction preserves
the served CSS. Six states cover unselected/selected at 1600/768/390px.
Visible name/email/eye/metadata boxes remain horizontally inside the sampled
card; the first participant retains four metadata rows in the DOM. Desktop
selected and mobile selected screenshots were inspected.

Important result: desktop selection grows the sampled card from 45.97px to
191.81px; tablet/mobile selection keeps 45.97px. Source explicitly requires
`selectedUsers.length === 1 && !isResponsiveWorkspace()` for expansion in
`updateSelectionActions`. The Penpot mobile selected-expanded example is
therefore NOT the actual selection behavior. Do not change runtime expansion
or motion simply to imitate that drawing. Correct the composition or clearly
separate a genuine detailed-view state once its trigger is verified.

At 390px the sampled name has 37px available for 81px of text, versus the
full 81px at desktop/tablet. This is a confirmed readability issue, not
horizontal overflow. It remains open; this run is not full card acceptance.
Business-content completeness and motion timing were not asserted.

Artifacts live under the external authenticated run directory:
`playwright-output/student-participant-metada-cce7a--and-responsive-containment/`.
The JSON report records geometry, typography and token counts without copying
identity strings. Cleanup confirms cleared credentials, released lease and
stopped owned child, with no fixture requested. Retention dry-run protects this
run and deletes zero files. Penpot suspended during browser work; no design
mutation was attempted after that suspension.

## Latest checkpoint — 2026-10-01 / metadata extraction

The five metadata recipes now live in canonical
`scss/easyedu/components/_card-metadata.scss` and are consumed by the existing
participant and mobile adapters. Module blob:
`d3e0430f9c339c0b31f03508a8b53a1f2c42066f`. Roles, groups, groupings and custom
fields retain all Mustache content and show-more controls. No template,
JavaScript, motion, card geometry or generated asset change is needed.

Live EasyStud Penpot readback found desktop metadata labels at 10px and mobile
labels at 9px (0.625rem/0.5625rem); existing code remains 0.67rem. This is an
explicit unresolved visual reconciliation, not a new approved font scale.
The mobile Participants board still places Alice Martin and email on one
line (108/124-unit text lanes), while selected Samira has email below.
Do not switch all compact cards to two lines without checking the preserved
height/reveal contract. Narrow-name readability and dense Sort/pagination
remain open. Some nested mobile identifier-entry examples also remain in
the board tree; visibility and source parity need their own audit.

Source validation passed: canonical/embedded parity, public Sass API, five
metadata adapters, existing header and direct-action contracts. Full compiled
CSS before/after is identical after line-ending/final-newline normalization:
`C3D7419CAEF23CE52C7DD22AF808858D5114BF599031DCB6E89D549127170523`.
The pre-existing loading/layout Sass mixed-decls warning remains.

```powershell
./tools/release/test-student-card-metadata-contract.ps1 -KitRoot <kit-checkout> -BaselineSha256 C3D7419CAEF23CE52C7DD22AF808858D5114BF599031DCB6E89D549127170523
```

This slice is source-only. No new browser run, runtime promotion, cache purge,
Penpot write or business-data mutation. Previous direct-action preview evidence
below is historical, not proof of metadata/mobile visual completion.

## Scope and evidence boundary — 2026-09-28

User authorized starting Student Management after the CSV disclosure correction.
This isolated first slice migrates workspace identity, typography and large
panel chrome to the canonical Kit class API. It preserves native title menu,
navigation, all card contents, data attributes, forms, membership actions,
mobile overflow menus and existing panel-height/scroll behavior.

Source of presentation: EasyStud Penpot page
`92c1c225-95fb-802e-8008-ae9f13d0b0b9`; desktop Complete view
`92c1c225-95fb-802e-8008-ae9f13f14484`, mobile Participants
`cef95197-06bc-809e-8008-aeeaa9e3ad0d`. Live readback measured desktop title
30px, description 16px, column title 22px; mobile title 23px, description 13px.
The shared `workspace-classes` module owns these rem-based responsive recipes.

Old local title-dropdown decoration and panel paint were removed, not patched
with another product stylesheet. Existing panel behavior remains local.
Default desktop columns become equal-width with the measured 32px gutter.
Navigation and layout-toggle spacing no longer accumulates three margins.

## Remaining slices

2026-09-30: the user accepted the Penpot controls and requested resuming the
Student Management implementation. This is not blanket acceptance of every
composition or a completed runtime migration.

The first card slice now consumes canonical `person-card-headline` and
`selectable-card-header` recipes in all five existing header contexts:
detailed, compact and selected-compact participants, groups, and groupings.
Selector specificity, DOM, content, action slots and responsive overrides are
unchanged. No JavaScript, animation, template or business behavior was edited.
The previous embedded 1.35 card-title line-height fix is promoted to canonical
Kit rather than lost during synchronization.

Canonical candidate: `scss/easyedu/components/_cards.scss`, Git blob
`886821d943874bfd9a0dcfa604650853c39dea72`, based on Kit `ce8a701`.
Both source worktrees remain uncommitted; the manifest records the candidate
separately from the last committed synchronization, without inventing a SHA.

Validation: the Kit's five-variant compilation contract, consumer adapter and
canonical-hash contract, and both Phase 0 regression contracts pass. Full CSS
compiled before/after has identical SHA256
`D8A3B655C053D97CCEC50CE3964DC886601C11AA2B3B4D501171AA83C935DC25`.
Rebuilding `styles.css` produces no tracked asset change. This proves a
source-preserving extraction, not a new visual or accessibility acceptance.
Existing Sass `mixed-decls` deprecation in the loading/layout integration is
unchanged. Moodle floor remains 5.1 (`2025100600`); no runtime, browser session,
cache, lease, database or other Moodle version was exercised in this slice.

Reproduce using the local paths supplied as parameters, not stored in source:

```powershell
./tools/release/test-student-card-header-contract.ps1 -KitRoot <canonical-checkout> -BaselineCss <before.css>
./tools/release/test-phase0-mass-admin-contract.ps1
sass scss/easystud.scss styles.css --no-source-map
```

Baseline and after artifacts are under the workstation-local EasyEdu artifact
root, folder `student-header-extraction-33e5ac766cd24738991979df45aee947`.
Omit `-BaselineCss` for the normal source contract; the full extraction parity
check requires the preserved baseline from the same compiler version.

The next implementation slice is the card action/control styling and metadata
contents against the accepted Foundations variants, retaining this geometry.
Header extraction alone must not be described as complete card styling.

### Action and metadata preflight after header extraction

Source inspection found explicit migration targets, not yet changed:

- Participant details action still defines a circular local border and a
  1.7rem desktop control, overridden to 1.85rem on mobile. Its grid placement
  is independent of that paint and must remain intact.
- Group search, mail, duplication, settings and unlink actions still have
  multiple local border/colour/focus recipes. Preserve each selector and
  semantic action while reconciling their appearance with the accepted linked
  Foundations controls; do not normalize colours by guesswork.
- Responsive workspace rules intentionally hide the desktop action family
  and retain the existing overflow menu. A shared recipe must not override
  this visibility or introduce duplicate mobile actions.
- Participant metadata labels still use local 0.67rem/700 typography,
  0.06em tracking and an uppercase treatment. Measure the accepted label role
  before replacing it. The metadata grid currently reserves 5.25rem for labels
  and wraps tags in a separate flexible lane; preserve contents and overflow.
- `templates/manage.mustache` renders the native details button and repeated
  metadata sections. Existing controls and labels are not empty decorative
  placeholders and must survive this migration.

Penpot read-only connection identified `EasyStud — Product views`. The next
shape inspection was rejected because the browser tab had no heartbeat for
45 seconds. No component values were returned, no Penpot mutation occurred,
and no new action/metadata styling was implemented. Resume from the linked
action instances once the user focuses the tab; do not substitute the older
source colours for the approved Foundation values.

- Layout-mode and mobile entity selectors; source-backed active/disabled states.
- Filters, quick creation, participant compact/expanded metadata and actions.
- Group/grouping contents, overflow, inline search/add-by-identifier, drag/drop.
- Context menus, populated modals and keyboard/reduced-motion coverage.

No assertion of complete Student Management migration follows from this slice.
Browser checks must inspect desktop, tablet and phone using real populated
cards without submitting imports, memberships, messages or settings.

## Verified first-slice evidence

### Direct-action continuation — 2026-09-30

Penpot reconnected successfully to EasyStud. Read-only inspection through its
connected Foundations Library returned the Direct icon main
`10fc9fee-0b8e-807e-8008-98ead919bfd2` and all five sibling states. The main is
29.6px square (1.85rem), with a 15.2px icon slot (0.95rem), transparent rest
surface and no visible border. Hover #f7fbff/#bdd0e5; pressed #eaf4ff/#b8d5ef;
focus #8abce3 plus 2.88px primary-22% ring; disabled
#f0f4f8/#d7e1ea/#9aa9b8 without reduced root opacity. Product eye instances
use #0b5ea8 glyph overrides; this implementation follows the canonical
#0f6cbf primary instead. That known product override is not silently claimed
as pixel parity.

New canonical `_card-actions.scss` is mirrored exactly in the consumer, blob
`8eb641a622b1ec1ab48abcea0c8e71773cd9e211`. Five families consume the mixin:
participant details and group mail/identifier-add, duplicate, member-search and
settings controls. Existing selector/event ownership remains unchanged.
Participant details now use the measured 1.85rem size rather than the older
1.7rem desktop override. Group controls retain their 1.85rem size. Metadata,
unlink, rename, container-search and responsive overflow remain separate work.

Sass build, Phase 0 contract, header source contract and the new action contract
pass. `test-student-card-actions-contract.ps1 -KitRoot <canonical-checkout>
-BaselineCss <before.css>` checks source equality, all five states/families
and unchanged compiled CSS outside these actions. The earlier full-stylesheet
equality applies only to the header extraction, not this intentional paint
change. No AMD/template/responsive source was edited. No Penpot mutation,
runtime deployment, cache change or browser visual validation was performed.
Both source worktrees remain uncommitted. The earlier Sass deprecation remains.

Next: managed preview and desktop/tablet/mobile action-state verification,
then metadata and remaining card controls. Do not claim full-view completion.

Preview preparation: the user explicitly authorized the bounded Kit/consumer
commit and push, local Moodle 5.1 preview apply, cache purge and focused card
test. Canonical Kit source is now pushed at
`d9e7a6ac425c2f3c9b5066bdfb00b44f94400e25`. The earlier uncommitted status is a
historical checkpoint, superseded for Kit by this SHA. Runtime preflight found
a clean `preview/moodle51/easystud-phase0-mass-admin` at `8a9edf2`, no active
runtime lease. The new one-test scenario is documented in `tools/playwright/README.md`;
syntax checks pass. Runtime execution results will be recorded separately.

### Earlier workspace-shell evidence

### Preview result — 2026-09-30

Final focused verification: source `ed6c588` is served by clean runtime
`10f3c86d69e4d62ad941b980bf8c0b2ef6525855`; cache purge succeeded. Run
`easystud-authenticated-20260930T143615684Z-10648` PASSED at 1600/768/390px,
including hover background and keyboard-focus border/ring. Desktop focus,
tablet and mobile captures were inspected. Cleanup confirms credentials
cleared, owned child stopped, no fixture requested and runtime lease released.
The preceding run `20260930T143427129Z-30832` failed only because the test
compared transparent black to transparent white; the assertion now checks
zero alpha irrespective of RGB, without changing the visual contract.

Evidence: external authenticated run folder, subdirectory
`playwright-output/student-card-actions-found-84f7b-ns-across-responsive-widths/`:
`card-actions-1600.png`, `card-actions-keyboard-focus.png`,
`card-actions-768.png`, `card-actions-390.png`, `card-actions-geometry.json`
and `card-action-hover-cascade.json`. No whole-view acceptance is implied.
At 390px the existing name/email lane is highly truncated and Sort/pagination
is dense; carry these into the next content/responsive pass rather than
silently claiming complete mobile fidelity. Nested group visible states and
runtime pressed/disabled coverage remain outside this focused scenario.

Follow-up diagnosis (user authorized continuation): run
`easystud-authenticated-20260930T143020831Z-35428` recorded `:hover=true`, the
pointer over the correct control and no inline override. Its matched CSS
evidence shows later Bootstrap `.btn:hover` using `--bs-btn-hover-bg` after the
equally specific Kit state rule. Desktop/tablet/mobile geometry completed;
hover and focus border failed. The test remains failed, not waived.

Canonical Kit fix `0c783026e075e4c3d513c50116dd95350e05e917` qualifies native
`.btn` composition in the shared recipe. Module blob
`c8a0540980702fc634dd8a83e766abc85270bf20` matches the embedded copy. No local
`!important` override or animation change. Follow-up browser proof is pending.
The test now saves `card-action-hover-cascade.json` and collects independent
viewport results with soft assertions, retaining a failing exit on state errors.

User authorized resolution of the documentation-only cherry-pick conflict.
The bounded resolution retained all added text; the final document exactly
matches source commit `a946f70939e396dc4ea7608bacb4f45a3e33946c`.
Runtime is clean at `3f21e8ccc24529c9bfe98ed5358a0f6bb60f5730` on
`preview/moodle51/easystud-phase0-mass-admin`. Managed promotion records that
source commit as applied; cache purge completed successfully.

Focused authenticated run `easystud-authenticated-20260930T130015901Z-25220`
FAILED at the desktop eye hover assertion: expected background
`rgb(247, 251, 255)`, computed `rgba(0, 0, 0, 0)`. Desktop dimensions, icon
slot centring, resting surfaces and horizontal-overflow assertions preceding
that check passed. The desktop screenshot was inspected. Keyboard focus,
tablet and mobile were not reached and are NOT validated. No unchanged retry
or speculative CSS override was performed. Matched-cascade/hover-state
diagnosis is still required; source inspection alone does not establish cause.

Evidence is in the external EasyEdu authenticated artifact root under that run:
`playwright.stdout.log`, `cleanup.json`, and
`playwright-output/student-card-actions-found-84f7b-ns-across-responsive-widths/`
(`card-actions-1600.png`, `card-actions-geometry.json`, `error-context.md`).
Cleanup confirms credentials cleared, runtime lease released and owned child
stopped. No fixture was requested. Existing files and all business data remain
untouched. The preview is deployed but not visually accepted.

Canonical Kit `ce8a701`, consumer `374f88c`, Moodle 5.1 preview `8a9edf2`.
Sass compilation and the pinned embedded-module contract passed. Authenticated
run `easystud-authenticated-20260928T201728645Z-51068` passed at 1600, 768
and 390px: Inter, 30px/23px title, no horizontal document overflow, equal
desktop columns and no panel shadows. Desktop/mobile viewport captures were
inspected; the earlier root capture clipped content because Moodle scrolls
its page wrapper, so the preserved test now captures the actual viewport.
Cleanup confirms cleared credentials and released runtime lease. No membership,
message, import or settings mutation occurred. Human acceptance is pending.

The cards and filters in these captures still use their existing implementation;
the test proves only this shell slice. In particular compact participant names,
filter density, mobile sorting and card action alignment need their own pass.

## Execution-efficiency note

### Foundations drag-preview implementation — 2026-10-01

Kit `dea2825`, consumer `33f7e92`, preview `819906f` implement the Penpot
moving outline/badge and inset additional-item counter. Native dragstart/dragend
run `easystud-authenticated-20261001T184004729Z-38420` passed Participant and
Group Single/Multiple: 2px outline, Inter, 12px badge, 16px icon, two rear layers
and `+1` only for two selected items. No drop or business-data mutation occurred.
Credentials cleared, lease released, child stopped; no fixture was requested.

Screenshot inspection then revealed exposed native checkbox inputs. The
shared preview's blanket descendant opacity reset was the cause: hidden inputs
and unchecked custom marks were forced visible. Kit `8b8d83f` now resets only
the front card. The browser scenario adds hidden-input and checked-mark
assertions. Corrected preview proof is pending, not inferred from the first run.
Human visual acceptance is deferred to `foundations-review-checklist.md`.
Allowed/denied target affordances and whole-view drag coverage remain separate.

Corrected Moodle preview `f45e2f5` serves consumer `e254532`, Kit `8b8d83f`.
Run `easystud-authenticated-20261001T184936379Z-41280` passed the extended
hidden-input/mark checks. Further run
`easystud-authenticated-20261001T185153936Z-4892` also verifies custom checkbox
width, height and radius against each source: 18.3906px square, 6.4px radius.
Native input opacity is 0 in all four cases. No drop or membership change.
Captures and computed geometry remain external; no human acceptance inferred.

Page-scoped Penpot readback confirms the allowed insert specimen
`92c1c225-95fb-802e-8008-aeafea3eb9f0` uses a linked 40px flat affordance:
`#edf6fc` surface, 1.5px `#8abce3` stroke, 20px icon slot and blue plus.
The old 43.2px font-plus recipe is still served on allowed targets and is the
next source gap; do not claim it migrated with the moving-card flair.

### Mobile pagination source boundary — 2026-10-01

Managed preview `f25a7c4` serves the shared narrow layout. Run
`easystud-authenticated-20261001T120027082Z-33336` reached Participants at
1600/768/390 and Groups at 390 with passing geometry, then failed a harness
assumption that mobile Groupings also has pagination. `getPaginationConfigs`
only includes groupings under desktop structure focus; `bindMobileEntityViews`
clears that class. This is not a missing product feature. The supervised test
now requires zero visible Groupings pagination bars. Corrected run
`easystud-authenticated-20261001T121212215Z-39680` passes at 1600/768/390/320;
Groups pagination and Groupings absence pass at both phone widths. Cleanup
confirms credentials cleared, runtime lease released and no fixture mutation.
The 320px Groups/menu capture was inspected. Initial Penpot recovery timed out;
subsequent direct page-scoped readback and focused PNG confirm Groupings top
and footer pagination hidden recoverably, card restored to y=5094 and contained.
Participants and Groups retain their linked Foundation pagination instances.
Use `currentPage.getShapeById` for known IDs on this page rather than repeated
global scans. This is a verified bounded recovery, not whole-view acceptance.
No runtime
JavaScript, card animation or membership data is modified.

Most avoidable work in this continuation came from the disclosure harness:
viewport-relative measurements misread scroll anchoring, and repository form
replacement required awaiting Moodle's URL `action=list` response. Preserve
the corrected small test instead of repeating broad page audits. No reliable
per-task token counter was available, so no token savings are claimed.
