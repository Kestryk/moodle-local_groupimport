# EasyStud navigation integration

## Kit Navigation/Guide surface adoption (`EED-UI-2026-0040`)

EasyStud consumes the source-only Navigation/Guide foundations from UI Kit
`EED-KIT-2026-0006` commit
`e38d52f73c592944a13315762281b5e2415104a8`. The adoption is deliberately
selective because the consumer retains established EasyStud composition and
interaction adaptations.

The shared changes are limited to:

- Navigation labels inheriting the Moodle theme UI family and shared medium
  weight, with shared title and eyebrow typography roles;
- a neutral resting surface and border around the existing Guide launcher;
- shared drawer surface tokens and a viewport-sized compact panel;
- a fixed safe-area header plus an independently scrolling body containing the
  existing Guide slot, destinations and participant links;
- long compact-trigger label containment without changing the trigger's
  accepted left-edge placement or hover expansion.

The new `.easyedu-navigation__panel-scroll` wrapper changes containment only.
It preserves the order, selectors and Mustache conditions of the existing
Guide slot, destination sections and native participant-link projection.
Routes, capabilities, labels, Guide copy, target keys, completion and
persistence rules remain consumer-owned and unchanged.

Navigation/Guide AMD, Skeleton markup/lifecycle and Mass Import behavior are
also unchanged. Desktop/mobile appearance, drawer scrolling, focus return,
RTL, reduced motion and forced colours require managed preview review.

## Fixed compact trigger placement (EED-NAV-2026-0010)

The compact EasyStud navigation trigger is a fixed, left-edge half-pill. It
may cover ordinary responsive content, including the participant workspace,
but it must never cover Moodle's native drawer-opening button.

The controller measures only the configured Moodle drawer-toggle region and
publishes its lower edge. The consumer SCSS uses that edge as a lower bound for
the trigger centre, including phone layouts up to `40rem`; it does not use the
participant selector, an open participant menu, Guide or Grouping geometry.
This preserves the ordinary-content overlay contract while keeping the native
Moodle opener reachable.

The trigger keeps the phone token-sized centre offset when no native drawer
opener is present. This keeps it clear of the expanded Grouping identity rail
without a Grouping-card geometry change.
The trigger keeps its vertical translation under
`prefers-reduced-motion`; only the horizontal hover movement is suppressed.

The dedicated `responsive navigation trigger remains left-centred at …`
This integration uses the isolated 390 x 844 scenario
`easystud-navigation-native-drawer-clearance`, which verifies only that the
EasyEdu trigger does not overlap Moodle's visible drawer-opening button. It is
separate from `responsive-audit.spec.js`, so no broader audit case is selected;
Platform must allowlist the exact identifier for `easystud-moodle51` first.

## Mass Import shared consumer (EED-NAV-2026-0005, 2026-08-03)

Mass Import now consumes the same canonical `easyedu_navigation` template as
Simplified Student View. Under the user-approved narrow Skeleton exception,
`index.php` replaces only the former
`local-groupimport-import__header-actions` rail in its established location:
after the workspace title and introductory copy, before the workflow body.
The Skeleton bootstrap, loading container attributes, Skeleton markup,
real-content wrapper and Skeleton SCSS remain unchanged.

The normalized context preserves the existing page actions as four items:
Simplified student management (when enabled), Mass group import (current),
Download example and Import history. Back to course is intentionally omitted.
Import history is a consumer-owned shared-navigation action: both desktop and
compact buttons open the existing modal. When the compact panel closes, modal
focus returns to the visible navigation handle rather than its hidden source
button.

Mass Import has no participant selector slot and does not render a Guide
launcher yet. The UI Kit navigation contract reserves the existing Guide
launcher language and compact slot for the later Guide-owned implementation;
the generic rail neither initializes nor relocates the Guide.

At phone widths the compact trigger uses the stable viewport-centred placement
directly. It does not apply the participant-selector clearance used by
Simplified Student View, because that control is absent here. The focused
`mass-import-navigation-audit.spec.js` scenario proves desktop and 390 px
rendering, replacement of the legacy rail, all four retained actions, compact
history modal/focus return, current state, horizontal containment and absence
of browser console/page errors. The EasyStud trigger hides while its compact
panel is open, so it cannot overlap Moodle's independently-owned drawer
control. Raw screenshots remain outside Git and are registered by the
authenticated runner's artifact manifest.

The packaged runtime has no cache-purge CLI script. After targeted official
AMD generation, it refreshes only Moodle `theme`, `js` and `template` caches
through the supported `purge_caches()` API under the dedicated cache-purge
lease. The authenticated runner uses the GroupImport active-runtime lease by
default; a fixture lease is not a substitute for runtime ownership.

## Responsive Guide launcher post-mortem (2026-07-31)

### Incident

In the compact navigation panel, `Open guide` appeared without its intended
gradient-row treatment and did not display the Guide modal.

### Cause

The responsive adapter cloned only `.easyedu-guide__launcher` into the panel.
The clone did not have the surrounding EasyStud Guide root required by the
compact selector, so it lost the full-width styling. Its click forwarded to the
original launcher, but the initialized modal remained inside the desktop
navigation branch, which is hidden at the compact breakpoint.

The runtime also retained Moodle's aggregated theme, JavaScript and Mustache
cache after the corrected AMD asset was promoted. The first authenticated check
therefore still received the earlier compact CSS and correctly reported the
narrow launcher; this was a deployment-cache state, not a second DOM defect.

### Correction

The adapter now moves the one initialized `[data-easyedu-guide-root]` between
the desktop source and compact panel according to the responsive panel state.
It never clones a launcher or creates a second guide root, so its event
bindings, modal and storage state remain intact.

After generated AMD promotion, the runtime refreshes only Moodle's `theme`,
`js` and `template` caches before browser proof. The packaged runtime has no
`admin/cli/purge_caches.php`; the equivalent supported `purge_caches()` API is
called in CLI mode under the exclusive cache-purge lease.

### Prevention

`test-navigation-integration.ps1` now rejects a cloned launcher and requires
the complete root movement. The focused responsive browser scenario remains
the runtime gate for style, modal opening and compact-panel containment.
On 2026-07-31, that scenario selected one test and passed after the selective
cache refresh; its manifested external evidence is retained under the
EasyEdu artifact policy.
The user approved the repaired compact Guide behavior on 2026-08-01; this
approval does not broaden the navigation migration beyond Simplified Student
View.

### Regression recovery (2026-08-01)

The prior recovery was incomplete once the navigation adapter returned to its
safer body-portal design. The adapter correctly kept the initialized Guide
root out of the transformed compact drawer and placed only a forwarding
launcher in the drawer. However, the generated stylesheet still required the
desktop Guide root above that cloned launcher, and the modal retained level
`1060` while the drawer used `1066`. The result was exactly the observed
regression: an unstyled compact button and a modal that could paint behind the
open drawer.

The durable contract is now:

- one initialized Guide root is portalled to `document.body` at the compact
  breakpoint; no overlay surface lives in the transformed drawer;
- the compact launcher is a forwarding button only, and its full-width
  gradient selector targets the launcher in the navigation slot directly;
- the fixed modal uses one level above
  `--easyedu-navigation-layer-panel`, rather than a competing literal
  `z-index`;
- the focused 390 px browser case proves body portal ownership, visible
  launcher styling, dialog paint above the drawer, close and focus return.

The previous static check that rejected all launcher clones is intentionally
superseded: a clone is safe only for the launcher, never for the initialized
Guide root. `playwright.config.js` is also passed to both the supervised
discovery and child invocation, so the one-test gate cannot silently resolve
zero files through Playwright's implicit `./tests` directory.

The first focused run, `easystud-authenticated-20260801T115332298Z-41304`,
correctly failed before opening the modal: its fresh profile received the
current theme aggregate but the cloned button did not inherit the Guide root's
gradient custom property. The selector and body portal were already present;
the missing inherited token was the final styling defect. The token is now
declared on the compact launcher itself. After a second selective
theme/JS/template refresh, one discovered scenario passed in
`easystud-authenticated-20260801T115748885Z-22484`. Its external screenshot
proves the Guide dialog paints above the still-open compact drawer; both runs
registered manifests and complete credential/profile/lease cleanup.

The Simplified Student View consumes the EasyEdu navigation contract from the
vendored UI Kit package. `manage.php` prepares one normalized context after
Moodle permissions and visibility have been resolved; the desktop and compact
presentations render that same context through
`local_groupimport/easyedu_navigation_items.mustache`.

## Ownership and compatibility

- Moodle's `core\output\participants_action_bar` remains the source for native
  participant destinations and third-party visibility.
- EasyStud owns its manager, CSV import and clipboard utility entries.
- The existing `local_groupimport/navigation` AMD module remains loaded by the
  plugin's legacy Moodle callback for native course-navigation compatibility.
  It is outside the new responsive drawer and is intentionally not removed in
  this batch; its future consolidation is an EED-NAV-2026-0003 candidate.
- The guide launcher remains a consumer-owned adjacent control. Its localized
  capsule uses the established launcher gradient and stays out of flow; the
  navigation controller measures it on hover/focus and switches from the
  right-side position to a top/right-aligned position when collision or
  viewport checks require it. This is intentionally plugin-local and does not
  introduce a new UI Kit contract.
- On desktop, the guide launcher wrapper is also absolutely positioned at the
  rail start edge. The destination section therefore uses the complete rail
  width and remains centred on the rail itself; neither the guide button nor
  its revealed capsule contributes to the centring calculation.
- Desktop destination items keep the established EasyStud admin-rail language:
  plain Font Awesome glyphs occupy a fixed one-rem slot with a short explicit
  gap before the label. The richer mobile navigation-link treatment is scoped
  to the compact panel and must not leak into the desktop rail.
- The desktop guide source deliberately has no `z-index` stacking context.
  Moodle's native participant `select-menu` must paint above the launcher when
  it is open; the guide modal keeps its own fixed elevation and is not trapped
  by the launcher wrapper.
- The desktop guide source must not establish a transformed containing block:
  the guide modal is `position: fixed` and remains inside the launcher root, so
  the source uses a calculated half-height offset instead of
  `transform: translateY(-50%)`. This keeps the modal viewport-sized rather
  than collapsing it to the narrow launcher slot.

## Deliberate differences from the previous baseline

The previous view parsed the rendered Moodle tertiary navigation and cloned
its links into a second compact list. The Phase 2B consumer now removes that
reconstruction: PHP normalizes the source once and both variants use the same
ordered sections and item IDs. The panel is explicitly inert and hidden while
closed, and its controller owns Escape, backdrop, focus return and Tab-loop
behavior. These are contract corrections, not a route or permission change.

The product section keeps the existing manager, import and clipboard actions;
the native participant control is supplied by Moodle's action-bar export and
rendered through `core/select_menu`. The control is moved as one DOM node
between the desktop source and compact slot, preserving its title, options,
URLs and permission filtering. An empty native export therefore still renders
the product destinations and a translated empty state remains available for a
genuinely empty context.

In the compact panel only, Moodle's participant options are also presented in
their own `Course participants` category. The controller copies the server-
owned dropdown headers and destination URLs into keyboard-operable links after
the native menu has rendered, observes the Moodle container if that menu is
replaced asynchronously, and keeps the copy in sync. It does not change the
desktop rail, the native combobox, its permissions or its selected value. This
restores the previous responsive information architecture while keeping the
source of truth in Moodle's action-bar export.

## Validation

Run the focused static contract from the plugin root:

```powershell
.\tools\release\test-navigation-integration.ps1
```

Also run PHP lint, ES-module/AMD syntax checks, the Sass build and the central
EasyEdu evolution-history gate. Authenticated browser, axe and assistive
technology checks remain explicit release evidence and must not be inferred
from static checks.

The authenticated responsive audit treats the rendered Moodle select menu and
the EasyStud product navigation as complementary contracts. The combobox must
show the EasyStud current-page title, while its options remain the
Moodle-owned participant destinations; the EasyStud manager link separately
carries `aria-current="page"`. The audit must not require
`[data-selected-option]`, because Moodle emits that helper only for the optional
inline-label rendering branch, and it must not pretend that the EasyStud title
is a selected native participant option.

Desktop centring evidence is collected independently at 1280, 1440 and
1920 pixels, plus a 1440-pixel RTL case. Each case compares the union of the
visible destination items with the full rail centre before and after revealing
the guide label, and rejects document or EasyStud-root horizontal overflow.

The desktop acceptance also checks that the first destination icon uses the
plain flex-aligned one-rem slot, remains vertically centred in its item and
has no tile background. This prevents the compact panel's card icon treatment
from regressing into the desktop rail.

The four authenticated cases passed on 2026-07-29 with one worker and one
discovered test per run. Credentials remained process-local, the shared
fixture lease was released after every case and generated evidence stayed in
the external manifested artifact root.

On 2026-07-30 the same desktop/RTL matrix was rerun after the legacy icon
restoration, followed by tablet-landscape, tablet-portrait and phone workspace
cases. All seven runs selected exactly one test, passed without page or console
errors, and recorded credential and lease cleanup in their external manifests.

On 2026-07-30 the responsive trigger and compact Guide-row treatment were then
validated separately at phone (390 px), tablet-portrait (768 px) and
tablet-landscape (1024 px). Each run selected exactly one test and proved the
fixed left-edge handle, minimum touch target, no-overlap geometry, and visible
aligned Guide row without page or console errors.
The external manifests were
`easystud-authenticated-20260730T093833278Z-24092`,
`easystud-authenticated-20260730T094016881Z-30284` and
`easystud-authenticated-20260730T094051388Z-37128`.

The later full-width Guide-button revision was compiled and served with an
identical stylesheet hash on 2026-07-30. Its one-test authenticated run
`easystud-authenticated-20260730T101508606Z-22244` stopped before the Guide
assertions because the Moodle page remained in its pre-existing
`local-groupimport-easystud--booting` state. The manifest records released
lease, cleared credentials and an external cleaned profile; no visual
acceptance is claimed from this failed run.

The responsive audit enables the non-secret loading diagnostic query only for
its isolated run. If the loading gate does not settle, it records the manager
state and controller event sequence in the test failure instead of treating a
timeout as a Guide-button result.

After that diagnostic addition, the same single focused scenario passed in
`easystud-authenticated-20260730T105704580Z-35172`. It exercised the compact
Guide button across its responsive cases with no page or console error; the
manifest records a released lease, cleared credentials and external profile
cleanup. No screenshot was requested or produced by this source-based audit.

The inverse-hover revision was then accepted by the same one-test responsive
audit in `easystud-authenticated-20260730T125337515Z-35388`. It verifies the
white hover surface, gradient border/icon/label treatment, enlarged label and
responsive icon alignment; its external manifest records complete cleanup.

The Guide modal acceptance case also passed on 2026-07-29 after ordering the
Guide AMD initialisation before the manager AMD. This prevents the loading
readiness gate from exposing a clickable Guide button before its modal handler
is attached. The acceptance now also checks that the fixed modal covers the
viewport and that its dialog is wider and taller than the launcher rail; the
packaged Moodle runtime required an authenticated web cache purge after the
stylesheet source change before the focused rerun could consume the rebuilt
stylesheet.

## Handoff

The canonical transverse record is `EED-NAV-2026-0003`. Its source, Sass
correction and official AMD output are present in the complete Moodle checkout
and synchronized to the local runtime. Authenticated desktop centring now
covers the approved width matrix and RTL. Human visual approval was received
for the restored desktop icon treatment on 2026-07-30. Reduced motion,
assistive-technology review and broader collision cases remain release
evidence rather than inferred results.

## Responsive-trigger implementation and guide evolution

The compact trigger is a fixed Moodle-familiar left-edge handle: its outer
edge is flat against the viewport and its inner edge is rounded into the page.
At rest it remains icon-led; on hover or keyboard focus it expands with the
localized, explicit title `Ouvrir le menu EasyStud` (or its active-language
equivalent), then returns to its compact form. The controller offsets it below
the lowest currently visible native Moodle drawer control, participant selector
or open participant menu, and hides it while the panel is open. This makes the
handle persistent without allowing it to cover those controls or the panel.

Within the compact panel, the existing Guide launcher is one full-width
navigation button just below the panel header. Its compass icon shares the
same icon column as the EasyStud tool rows and its permanent localized
`Open guide` / `Ouvrir le guide` label is part of that same button: neither
the icon nor the label creates a second capsule or hover-help bubble. The
launcher deliberately has no `data-easystud-hover-help` attribute in its
responsive consumer template; its visible label and accessible name are the
single source of guidance. The background keeps the two established EasyEdu
launcher colours but uses a white overlay for a lighter gradient. Hover and
keyboard focus change the button to a white surface with a gradient border,
then move that same gradient onto the enlarged icon and label.
The resting overlay uses 48% to 28% white so the gradient remains visibly
darker than the first compact-button iteration while preserving its contrast.
The label uses a flexible, non-clipping text area with explicit line-height
and vertical padding, so `Open guide` / `Ouvrir le guide` remain entirely
visible within the button.
The Guide remains a plugin-local consumer adaptation; its dialog itself has
not been made responsive.

The responsive audit proves the trigger's fixed left-edge position, compact and
hover-expanded label states, minimum touch target and collision state, plus the
Guide label and icon alignment, at phone, tablet-landscape and tablet-portrait
widths.
Narrow-height, RTL and zoomed layouts remain part of the next broader collision
matrix.

Before the Guide dialog is made responsive, a separate responsive-guide
evolution must define one shared contract for EasyStud, the EasyEdu UI Kit and
Course Banner Builder (CCB): viewport-safe dialog/panel geometry, responsive
content hierarchy, focus trapping and restoration, keyboard/Escape behavior,
reduced motion, safe-area handling, scroll containment, localization and
Moodle theme overrides.

- No production guide or UI Kit/CCB change belongs in this plugin correction.
- The dedicated guide window should propose the reusable contract and
  acceptance matrix before another implementation batch is created.
