# Administration and compact filter follow-up

User additions are recorded as R10–R12 in the existing completion queue.
No additional worktree is needed. Human checklist remains open.

## Confirmed integration gaps

- Public colour picker selectors require an `.easyedu-ui` ancestor. Native
  Moodle administration did not supply it. The PHP wrapper repair is preserved
  in visual WIP `d93afc1`, not in the functional preview.
- The native administration adapter targets three profile-field selects by
  name, plus the identification multiselect. The newly added default-view
  select is absent. Importing styles does not automatically opt native Moodle
  markup into Kit components. Reconcile all setting types through a shared
  adapter/enhancement, retaining native names, values, dependencies and no-JS.
- Contrast is rejected in two places: `settings.php` validation and
  `local_groupimport_get_theme_colours()` runtime fallback. Removing only the
  form guard would save a colour that the interface then silently ignores.

## Palette behaviour candidate

Keep six-digit Hex syntax validation. Accept a wider decorative palette and
derive legible foreground/strong action variants where the chosen colour is
too light. Explain adjustment through a nonblocking canonical Kit notice.
The direct primary, accent, identity, info and success roles are used both for
text/icons and filled actions. The candidate retains the exact configured Hex
as `--easyedu-*-chosen` and in the admin picker, derives a 4.5:1-or-better
base role against white, and uses the chosen colour for pale surfaces. A valid
Hex is no longer rejected or silently reset. An existing Kit notice gains a
warning skin and appears dynamically when a readable shade is substituted.
The built-in canonical grouping default is adapted silently, without an
administrator-choice warning; a different custom light Hex shows the guidance.
This does not yet certify contrast against every mixed background or a native
Moodle theme; run that browser matrix before closing R11.
The product Administration page now has a nonblocking adjusted-colour specimen
(`cf371b29-2e8e-8011-8008-bd1dadea4968`) linked to the existing Foundations
Inline notification / Warning component. The close glyph is hidden because
this form explanation is conditional on the current Hex, not dismissible.
Its exported 1440px board was visually inspected; insertion into every full
responsive administration composition remains a separate propagation check.
The final source successor `75d6c4c` is served by Moodle 5.1 preview HEAD
`9d6ed6768d53dc7022df7faf0bfe9536329d20f2`; native read-only run
`easystud-authenticated-20261004T150423519Z-9736` passes three widths,
including real warning paint, default-value suppression and no settings POST.
Its artifact manifest and cleanup JSON are under the external EasyStud
authenticated run root. Human checklist and broader surface contrast remain
open.

Restore defaults should populate the seven existing colour controls from
their PHP defaults and synchronize swatch/Hex/error state. Native Save remains
required; no automatic configuration write. Include this on the Penpot admin
boards and cover keyboard/no-JS/read-only handling.

## Compact filters (not implemented)

Inventory existing Foundations Standard/Library before creating a variant.
Cover all filter roles, searchable single/multiple, selected summary, clear,
chevron, search, options, empty, disabled, invalid and keyboard focus. Use one
compact density modifier from canonical SCSS; preserve usable touch targets
on mobile rather than shrinking every hit area. Propagate EasyStud after the
canonical provider, then compare the actual More Filters and native admin.

## Penpot inspection status

EasyStud page 02 is accessible. Its three root boards are desktop 1440px,
tablet 768px and a board named Mobile/390 whose actual width is 454px. That
discrepancy needs inclusion in the responsive audit. The existing warning's
provider has not yet been verified; no claim that it matches Foundations.
The current connected document is EasyStud, not Foundations.

## Administration adapter candidate

`admin_choices` now routes all non-required native EasyStud settings selects
through the existing Kit single/multiple controller. Native names/options/value
remain authoritative. The adapter supplies the missing `.easyedu-ui` ancestor,
localized labels, native reset synchronization and observed disabled/options
changes. Required fields keep a visible native fallback until the shared
controller supports browser constraint validation. No new paint or private
dropdown implementation is introduced.

The no-JS SCSS adapter now targets all EasyStud single/multiple selects instead
of three enumerated field names. New view-preference rows receive the existing
settings shell. Generated CSS and native promotion remain pending so the
earlier visual WIP is not inadvertently shipped with this candidate.

Validation: PHP syntax, built choice exports and isolated real-browser adapter
tests pass (values, search, multiple selection, Escape, reset after closure,
disabled synchronization, scope, idempotence and required native fallback).
These are not native Moodle or visual-parity passes.

The initial isolated test exposed a separate shared-controller defect: clicking
a Reset below an open in-flow choice can be lost as focusout closes/reflows the
list between pointerdown and click. Native value and summary both remained
unchanged; no JavaScript error occurred. Keep this explicitly OPEN. The passing
reset case first closes with Escape and proves only reset synchronization.
Repair pointer/keyboard dismissal in the canonical Kit before promoting the
admin enhancement; include an unchanged-coordinate click regression.

### Pointer repair successor

Kit 0.4.82 (`ea25c23`) now preserves outside pointerdown-to-up geometry, with
temporary open-only document listeners and cleanup on close/refresh/destroy.
The direct open-list Reset regression now passes at 1600/768/390 in both
motion modes, including a held mouse button. The consumer controller and Kit
source have identical SHA256 `2210491ee7c1c1b4c0f09defd142b0187955a634a1b7484ce3a2eefe5df68cd1`.
The former Escape-first result remains
historical, not substituted evidence. Kit trailing-chevron geometry and shared
single/multiple lifecycle pass at all three widths; transient rotation was
excluded by waiting for the actual animation, not by relaxing the inset gate.
Native preview, visual parity and Foundation publication remain pending.

### Restore palette candidate

The Restore EasyEdu colours control consumes the canonical secondary button,
uses each of the seven PHP setting defaults (no JS palette duplication), updates
swatch/Hex/validity via existing input/change handlers and announces that Save
is required. Readonly/disabled fields are skipped. The control remains hidden
without JavaScript. The isolated browser test passes, including invalid values,
readonly preservation, live status and zero form submissions. PHP lint passes.
Penpot rendering and native administration verification remain pending.

The CSS build now includes the existing Mass Import/administration candidates
and Kit 0.4.82; it is deliberately not promoted piecemeal. Sass emits one
pre-existing mixed-declaration deprecation warning in `components/_layout.scss`.

### Compact choice successor, source only

Kit 0.4.83 adds the explicit compact host modifier (32px / 12px desktop,
44px narrow/coarse-pointer targets). EasyStud's four More Filters select
hooks opt in through that public class only. Canonical and embedded SCSS have
identical SHA256 `FD30961AFEF19A7A04792539F50F05FCB154EED7077532632B545269521CC5BE`.
AMD and Sass builds pass; the custom course-manager builder was brought in
line with the existing closeChoicesWithin import instead of dropping it.
The existing Sass mixed-declaration warning remains unchanged.

Foundations compact multiple states now exist in linked Standard/Library
boards `cf371b29-2e8e-8011-8008-bceb09cc86fa` and
`cf371b29-2e8e-8011-8008-bce9a917bda1`. Six states are read back and visually
inspected through a board export. The isolated browser three-width contract
passes; it does not load Moodle font assets and therefore proves control
geometry/behaviour, not complete painted parity. EasyStud Penpot propagation,
native compact preview and compact roles/toggle/reset siblings remain open.
Runtime still serves 6da2a1, not these later source candidates. Human checklist
remains open; no Guide work or business action was performed.

### Product canonical composition propagation

Page 03 board `df1dc7b5-2b58-807e-8008-bc36e705b19d` now inherits compact
Closed and Compact-touch Open from Foundations, replacing the two linked
choice providers in place. Instance IDs remain
`df1dc7b5-2b58-807e-8008-bc36ec7372f8` and
`df1dc7b5-2b58-807e-8008-bc370dd287e4`. Readback confirms desktop 360x32,
touch 324x254 with 44px trigger/options/search. Existing option/summary copy
is preserved. Full-board export inspected: choice geometry is contained.
Adjacent Toggle and Reset label centring still needs reconciliation; the
large vertical spacing in this specimen is not certified as native parity.
Other interaction/many-role boards retain their previous providers pending
width-specific propagation (184px desktop fields need reduced text lanes).
No claim of all-board completion or runtime promotion is made.

Follow-up: the four Toggle/Reset labels on that product board now explicitly
use fixed text boxes and vertical centring; settled painted centre deltas are
0.5px. The five canonical Foundations Filter toggle/reset masters received
the same text alignment in 08.5.1, with their linked Standard instances in
08.5 updated too. Full-application propagation remains a separate check.

### Remaining visible searchable compositions

Twelve additional visible choice heads on Interaction states, Searchable filter
interactions and Many roles now inherit compact providers. Archived/hidden
references are preserved. Original Any/selected summaries and option labels
remain intact; Any hides the clear action. Width-specific text lanes and
trailing icon positions are normalized for 184/284px desktop and 294px mobile.
All twelve readbacks retain the provider link, have zero outer text overflow,
14px icon-frame end inset and zero vertical icon-frame centre delta. The
Searchable filter interactions whole-board export was visually inspected.
Desktop triggers are 32px; mobile triggers/search/options stay 44px.
This closes choice propagation for these visible specimens, not the remaining
role shortcuts, admin settings, whole-page preview or human checklist.

Re-executed `test-admin-choices-browser.js`: all six width/Motion cases pass,
including a held physical click on Reset below an open list, disabled/native
fallback and selection. `test-admin-colour-reset-browser.js` also passes:
PHP-provided defaults, invalid values, readonly preservation, live status and
zero submissions. These remain isolated tests, not native Moodle proof.

Administration live inventory confirms that the three current full-view boards
still omit the five interface palette settings, Restore colours and the
Complete/default-view settings. Existing colour rows only cover participant
badge background/text. Add these missing source-backed settings before claiming
whole-admin parity or lifting the visual candidate preview hold.

### Administration composition successor

All three full-view boards now include the five source interface colours,
Restore EasyEdu colours (form-only, explicit Save still required), Show complete
view and Default layout. Existing badge settings remain present. Sections below
the insertions and their root containers were extended; no existing settings
were deleted. Desktop palette board: `cf371b29-2e8e-8011-8008-bcfd674cd90e`;
mobile: `cf371b29-2e8e-8011-8008-bcfdaf381927`; tablet:
`cf371b29-2e8e-8011-8008-bcfdb1688c93`. Palette text readbacks have no outer
overflow; the narrow palette export was inspected.

Nine old profile-field Dropdown instances now inherit Searchable single choice
M Closed, preserving their Aucun copy and widths, using 38px desktop and 44px
responsive triggers. Forty-five setting/checkbox helper texts use the 12.16px
Foundation caption role instead of the previous 14.4px body role.

Code maps admin page title/description and native section headings directly
to existing Kit typography mixins (20/14.4/16px). No new pixel-size override
or shared-token change. Show complete view joins the native checkbox layout
adapter. Sass and the isolated compiled-CSS typography test pass at
1600/768/390; all six choice adapter width/Motion cases pass again.
Scenario `tools/release/test-admin-typography-browser.js` is ci-reusable,
isolated, read-only and produces no media. Native-theme precedence and actual
responsive layout still require leased Moodle proof. The board named Mobile
390 still has an outer documentation frame of 454px and must be reconciled;
do not claim a complete 390px viewport pass from the contained palette alone.
Contrast relaxation and canonical warning verification are still open.

Mobile-frame successor: remove only the redundant 32px exterior margins around
the existing 390px native composition, rather than scaling controls. Outer and
inner frames now both measure 390px; board heading boxes are 342px wide with
24px inset. Settled horizontal text-containment scan passes. This corrects the
documented 454px mismatch but does not substitute for native mobile testing.

Show-complete-view checkbox now shares the existing keyboard-focus adapter;
the compiled browser test compares it with enablesimplifiedview at all three
widths. Colour-picker static contract passes. Prepare the ordered local preview
chain (all successors to 8d41b90), not a latest-commit-only cherry-pick.

### Local preview applied, native test in progress

The ten ordered commits from d93afc1 through e5c1a3f were applied without
conflict to the existing preview branch. Runtime HEAD is
`97913658895f84e98871ec361845eba615b50af8`; Moodle caches were purged.
Promotion record: `preview-promotions/easystud/20261004T124456Z.json` under
the external orchestration artifact root. This supersedes the historical
6da2a1 serving state above. No production deployment or settings write.
The new local-supervised `admin-kit-readonly.spec.js` opens native settings,
checks three viewport widths and blocks any settings POST. Record its result
separately; applied code is not itself a passing native visual test.

Native runs `easystud-authenticated-20261004T124511805Z-27020` and
`easystud-authenticated-20261004T124630068Z-18568` pass the initial checks:
title, seven public pickers, dropdown open/Escape, no horizontal overflow or
page errors, no settings POST. Both release their leases and clear credentials.
Targeted palette captures reveal the actual native section h3.main is a sibling
of .formsettingheading, not its child: 18.75px persisted despite the isolated
fixture PASS. Correct the source adapter and fixture to that real topology;
the native successor asserts all five section headings at 16px. Restore help
also adopts the public easyedu-caption class, not an unstyled native paragraph.
Do not relabel the initial passing checks as full typography parity.

The corrected successor dd10604 is now served at runtime
`1fdf1a181099da2eae3ac3e9151dcd273d6ea37a`, caches purged. Native run
`easystud-authenticated-20261004T124903092Z-23644` passes all three widths,
including actual h3.main at 16px, title at 20px, seven contained colour pickers,
searchable default-view dropdown/Escape, restored helper class and no settings
POST/page errors. Targeted scrolled palette captures accompany the top-view
captures. Human acceptance, warning/contrast policy and whole-plugin completion
remain open. More Filters normal-motion regression is run separately.

Native More Filters regression also passes on this serving revision:
`easystud-authenticated-20261004T125017798Z-36180`. Parent closure with and
without an open nested choice preserves final class/inert/ARIA and produces
no page error. No business action or fixture write was requested.

### Native Restore colours continuation

The read-only Administration scenario now temporarily edits Primary and Accent
Hex fields in the browser, clicks Restore EasyEdu colours, verifies the
PHP-provided defaults and the Save-required status, and asserts that no
settings POST occurred. Native Moodle 5.1 run
`easystud-authenticated-20261004T161117598Z-31804` passes at
1600/768/390 with credentials cleared and the runtime lease released. This
proves the in-form reset path, not persisted settings or every possible theme.
Human acceptance remains open.

### Quick role shortcuts

The short-catalogue role buttons now opt into the existing Foundation
Selection action component instead of retaining Bootstrap-only paint. Their
pill geometry is the current consumer composition; `aria-pressed` and the
native role-filter select remain the source of selection state. The many-role
fallback still uses the compact searchable multi-select.

EasyStud Penpot page 03 board `cf371b29-2e8e-8011-8008-bd316bf1dfed`
shows neutral Teacher and selected Student shortcuts as linked Foundation
Selection action instances. Settled text is contained and the exported board
was inspected. Native run `easystud-authenticated-20261004T161537203Z-31692`
passes: 12.48px labels, 30.39px height, neutral-to-selected paint change,
pressed-state reversal, and zero business requests/page errors. This closes
this specific quick-role candidate; other compact-filter roles, full-board
propagation and human acceptance remain open.

### Native trailing-chevron geometry

The existing multiple-choice clear scenario now measures the trailing
chevron and clear affordance after two selections. Native run
`easystud-authenticated-20261004T162612514Z-12796` passes at
1600/768/390: the chevron is 14px from the trigger's end and has zero
vertical-centre delta, while the clear action stays fully inside the trigger
with an 8px desktop / 10px responsive gap before the chevron. Clear preserves
focus, resets the native selected options and emits no business request.
This is browser geometry proof for R02, not human visual acceptance.

### Native Administration caption topology and preview recovery

Moodle 5.1 renders setting help in `.form-setting > .form-text` and default
values in `.form-setting > .form-defaultinfo`; the earlier `.form-description`
selector did not reach either native element. The admin adapter now maps both
to the canonical Kit caption role while retaining the 20px page title, 14.4px
page description and 14.08px setting labels. The first typography test failed
on the absent selector, not on a measured font regression; its diagnostic run
is retained as such.

During the ordered local preview, the Group-image document conflicted with a
shorter runtime copy. Both versions were preserved by accepting the incoming
verified-result and alignment sections after the shared introduction. The
preview now serves `ec3bbf06b13e8707044e1efa7e86102ba2fbbc6c`, includes
the four ordered source commits through `6dbbdbd`, is clean, and received a
managed Moodle cache purge (`20261004T164138Z.json`). The tracked stylesheet
has the same Git blob in source and runtime; raw file hashes differ because of
checkout line endings.

Native run `easystud-authenticated-20261004T164150898Z-9876` passes at
1600/768/390: title, description, label, help and default-value typography,
seven pickers, dropdown Escape, Restore without a settings POST, warning
paint, headings and no horizontal overflow or page errors. Its cleanup record
confirms cleared credentials and released lease. This is browser/runtime proof
of this bounded Administration candidate, not a full visual acceptance or
persisted settings test; R05 and the combined human checklist remain open.

The three Administration Penpot compositions use a linked M searchable-choice
family (38px desktop, 44px tablet/mobile). Live Moodle measures all five
enhanced settings controls within the public `.easyedu-ui` scope at the same
38/44px heights, 14px type and one common radius. The native test now asserts
those values across all five controls, rather than only checking that the
default-view dropdown opens. Penpot's page title says “Administration EasyStud”;
the English and French product title strings are aligned to that identity.
Run `easystud-authenticated-20261004T170609304Z-34728` confirms the title
and all five Kit choice height/font/radius assertions at three widths; no
settings POST or page error occurred. Human visual acceptance remains open.

The same desktop/tablet/mobile boards use a 160px linked Foundation M colour
picker, with 49.6px swatch and 12.48px Hex text. Native Moodle previously
stretched the public control to 282px and rendered its Hex input at 13.12px.
Kit 0.4.86 now fixes M to the source geometry and keeps the Hex lane editable;
the single SCSS partial is synchronized into EasyStud. The native assertion
checks all seven controls and painted bounds. S/L widths and the setting-row
default-value placement remain separate visual follow-ups; this lot does not
declare full Administration parity.

### More Filters parent/choice closure on the current preview

The existing guarded native scenario was rerun against the corrected serving
revision. Run `easystud-authenticated-20261004T164342419Z-35596` passes at
1600/768/390, each with three consecutive cycles of opening the parent and
its nested choice, then closing both with one parent-toggle click. The final
ARIA, hidden/inert and disclosure states agree, with no business request or
page error. This is bounded behavioural proof for R03; human acceptance and
the broader filter interaction checklist remain open.
