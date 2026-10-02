# EasyStud Playwright audits

## Student harmonisation and compact portals

`student-harmonisation-audit.spec.js` is `local-supervised`, read-only business
scope. Exact grep: `Student harmonisation records native controls dialogs and
drag anatomy`. It records 1600/768/390 workspace typography, opens/cancels Move
and native Message at desktop/mobile, then starts/ends Participant/Group drag.
It never confirms, sends, drops, creates, removes or changes fixtures. Native
portal font/tokens, centred footer and compact non-interactive anatomy are
asserted. Evidence: `harmonisation-native.json` and named external PNGs.
The responsive switcher is the real native entity-view switcher, not a hidden
desktop layout toggle. Phone Message also asserts that content minus header,
footer and capped textarea leaves under 40px, preventing a fixed-shell blank
region. Original normal-motion card transitions are not disabled by this audit.
Use the saved-credentials wrapper with `-WaitForLease`; run only after the
managed candidate promotion. Failed runs are preserved, not overwritten.

The focused `student-drag-preview-foundations.spec.js` retains four
Single/Multiple Participant/Group cases, allowed/denied target start/over/end
and cleanup. Its former full-clone checkbox expectation is superseded by the
user-requested compact identity/title preview (zero controls, at most 288px).

## Experimental name-priority comparison

The refined 3:1 candidate passes the focused 390px comparison; the earlier
failed 1.6:1 trial remains historical evidence. The participant metadata spec
is the managed-preview follow-up at 1600/768/390 and asserts phone name/email
space and eye separation. Partial names remain expected for long content.

`student-mobile-name-priority.spec.js` is `local-supervised`, not a deployed
preview test. Exact grep: `Compare canonical name-priority tracks against the
served participant row`. It reads the candidate tracks from source-generated
`styles.css`, injects a temporary stylesheet into the owned page, compares name
width and removes it in `finally`. No runtime file or data is changed. The
first run FAILED the name-width gain gate; do not waive it or call the
candidate visually accepted. Rebuild source Sass before any new experiment.

## Participant metadata inspection

`student-participant-metadata.spec.js` is a `local-supervised` scenario selected
by `Participant metadata retains contents and responsive containment`.
It captures the first populated participant before/after temporary selection
at 1600/768/390px, checks visible element containment, and records metadata
row/token counts, typography, card height and name truncation. Selection is
cleared at each width. Use the saved-credentials wrapper with `-WaitForLease`.
No membership action or saved preference is changed. It does not assert
complete business-content correctness, modal details or animation timing.

Evidence: `participant-metadata.json` and six `participant-<width>-<state>.png`
captures in the external manifested run directory. Mobile selection intentionally
does not expand cards: `updateSelectionActions` requires
`!isResponsiveWorkspace()` for single-participant expansion.

## Student card Foundations actions

`student-card-actions-foundations.spec.js` is one `local-supervised` read-only
scenario for a populated course, selected by the exact grep
`Student card direct actions match Foundations across responsive widths`.
Run with the saved-credentials wrapper and `-WaitForLease`, only after the
candidate has been applied to the managed preview. It checks 1600/768/390px
geometry, transparent resting actions, icon centring, hover, keyboard focus
and existing responsive action visibility. It never activates a business
action. Pressed/disabled states retain source-contract coverage; this scenario
does not claim their runtime coverage or card animation coverage.

Artifacts: `card-actions-geometry.json`, `card-actions-1600.png`,
`card-actions-768.png`, `card-actions-390.png` and
`card-actions-keyboard-focus.png` under the runner's external manifested output.
Acceptance: icons centred, no resting circles or clipped controls, no horizontal
overflow, keyboard focus visible and responsive action menus still available.

The scenario saves `card-action-hover-cascade.json` with matched background
rules and actual hover/hit-test state. State assertions remain failures but
are soft so independent viewport evidence is still collected. Transparent
paint checks require zero alpha, accepting Moodle's equivalent transparent
white serialization. Do not weaken nontransparent hover/focus expectations.

## Authenticated Moodle 5.1 runner

Authenticated EasyStud checks must use
`Invoke-EasyStudPlaywrightWithSavedCredentials.ps1`. The runner accepts the
workstation-local DPAPI loader and EasyEdu orchestration module as parameters;
versioned commands therefore contain no fixed `C:` or `D:` root.

```powershell
$loader = '<local DPAPI loader path>'
$orchestration = '<local EasyEduOrchestration.psm1 path>'

.\tools\playwright\Invoke-EasyStudPlaywrightWithSavedCredentials.ps1 `
    -CredentialLoaderPath $loader `
    -OrchestrationModulePath $orchestration `
    -WaitForLease
```

The runner executes `playwright test --list` first and refuses zero, two or
more selected tests. Only after that gate does it acquire the shared
`groupimport-active-runtime-write` lease and load the saved credential into the
current PowerShell process. The credential is inherited only by the owned Node
child and is cleared in `finally`; no password, cookie or authentication file
is written. Cache purges and fixture writes use their own explicit resources
rather than this test lease.

`playwright.config.js`, the Playwright CLI and `node_modules` always remain in
the runtime checkout. The supervised runner passes the runtime configuration to
both `--list` and the child run, so an exact `-Spec` is resolved from
`tools/playwright` rather than Playwright's implicit `./tests` directory. The
config does not own artifact output; the runner still supplies an external
manifested output path for every real run.

Use `-Spec` and an exact `-Grep` for another scenario. The one-test gate cannot
be disabled. `-DiscoveryOnly` validates selection and artifact registration
without loading credentials or taking the runtime lease.

### EED-UI-2026-0035 action-button alignment

Run `Invoke-EasyStudActionButtonAlignmentSupervised.ps1` for the focused
alignment review. Its required `-MoodleRoot` and `-RuntimeRunnerPath` identify
the managed Moodle checkout and its served runner only at execution time; no
versioned path is used. The supervisor
discovers one test first, then creates a disposable course/group fixture and
passes the resulting manager URL to the spec. It removes the fixture in
`finally`; no fixed course is used.

The dedicated native-drawer clearance scenario is
`easystud-navigation-native-drawer-clearance.spec.js` /
`easystud-navigation-native-drawer-clearance`. It uses only the 390 x 844
viewport and asserts exclusively that the fixed EasyEdu Navigation trigger does
not overlap Moodle's visible `[data-region="drawer-toggle"]` opener. It must be
run only after Platform allowlists that exact identifier for `easystud-moodle51`;
do not substitute any case from `responsive-audit.spec.js`.

`navigation-skeleton-zoom.spec.js` / `Navigation Skeleton stays contained at
320/390 with isolated native 100/200 zoom` is the focused source-owned
Navigation Skeleton check. It covers Student Management and Mass Import at
320 and 390 CSS px in LTR and RTL. Its isolated per-run Chromium profile sets
the 100% or 200% per-host preference before launch; it never sends Ctrl+plus,
Ctrl+zero or any desktop-window automation, so it cannot alter a user's active
browser profile or zoom. For Mass Import, it also reveals the existing busy
label and checks that the compact spinner fits its label at 320 px/native 200%;
the same LTR cell writes one full-window review capture.

`group-expanded-menu-stack.spec.js` / `expanded Group More-actions menu stays
above revealed participant members` is the focused desktop regression for
EED-UI-2026-0028-B. It selects the existing Complete view, expands a nested
Group's existing participant-member disclosure, opens its existing
More-actions control, records an external review capture and verifies the
open card retains the menu stack. It then exercises the existing Escape route;
it creates no groups, members, permissions or other fixture data.

### Participant role-filter integrity

`participant-role-filter-integrity.spec.js` owns the focused non-destructive
course-5 diagnostic for the Participant role filter. It opens the Participant
advanced-filters panel, selects Teacher through the visible control, verifies
that the Student-only canonical participant card is hidden, records any
separate group-member representation for that user, and records the Course
Manager AMD resource actually served by Moodle. Its exact run remains one test
and uses the saved-credential wrapper; it does not create or change enrolments,
roles, fixtures, caches or settings.

```powershell
.\tools\playwright\Invoke-EasyStudPlaywrightWithSavedCredentials.ps1 `
    -CredentialLoaderPath $loader `
    -OrchestrationModulePath $orchestration `
    -Spec 'participant-role-filter-integrity.spec.js' `
    -Grep 'Teacher role filter hides the Student-only canonical participant card' `
    -WaitForLease
```

The responsive card-menu alignment check is
`responsive-audit.spec.js` / `responsive card menu triggers align with their
card row controls`. At 768 px it compares the vertical centres of the menu
trigger and the relevant Participant, Group and Grouping row control with a
maximum two-pixel delta, and writes three external screenshots.

The EED-UI-2026-0030 global-controls check is
`global-controls-pagination.spec.js` / `EED-UI-2026-0030 global controls,
ungrouped disclosure and pagination parity`. It is one focused scenario for
desktop and 390 px mobile: top action centring (including a disabled action),
the Complete-view `Groups without grouping` surface and disclosure, the four
Participants/Groups Complete/Groups Structure/Groupings Structure pagination
owners, bottom-of-block non-fixed placement, compact arrow focus, and two
explicit human-review captures. Use discovery-only first; it has no browser,
credential, lease, fixture or cache activity until separately authorised.

The cumulative Platform-wave handoff uses exactly one human-validation bundle:
`platform-wave-0030-0033.spec.js` / `EED-UI-2026-0030-0033 Platform wave:
global controls plus Mass Import and Administration no-script lifecycle`. It
contains the 0030 desktop/mobile control review and normal/no-script checks
for Mass Import and Administration. Its six named captures are listed in
`docs/testing/eed-ui-2026-0030-0033-platform-wave-validation.md`. Run no
other scenario for this candidate until that one bundle has been reviewed.

The same file also owns `Guide target audit resolves every slide and guided
step to an actionable control`. The supervised scenario runs the full Guide
target inventory at 1280 x 900 and 390 x 844: each Show in interface slide and
guided-path step must first open, then visibly highlight, its usable desktop or
compact control. It intentionally checks the desktop Move participant/card
variant against the compact participant-card More actions variant; it never
treats an invisible native selection input as an actionable target.
It also checks the deliberately long Guided Path card at both viewports: its
copy and start action must stay inside the green surface, with the action below
the explanation rather than competing for the desktop text row.
Before it writes either review capture, it waits for the normal-motion Guide
entry to finish and for the dialog to be fully opaque; the evidence therefore
shows the settled modal rather than a transparent animation frame.
When the test opens a Show-in-interface target, it dispatches that real button
handler with Playwright force-click semantics: a decorative, continuous slide
animation must not be mistaken for an unavailable user action. The following
checks still require the modal to close, the real target to be highlighted and
the return control to work.

The responsive selected-action tray check is `selected-action-tray.spec.js` /
`selected group action tray remains contained at intermediate responsive width`.
At 777 px it opens a Group, selects it, and checks that the count has its own
row above all four actions. It also checks tray/action containment and the
absence of hidden horizontal action-row overflow. It writes one external
screenshot; it is `local-supervised` because it requires the leased
authenticated Moodle 5.1 fixture.

The EED-UI-2026-0023 message-modal check is
`message-modal-responsive.spec.js` / `responsive native Send message modal
remains opaque and contained`. At 390 x 844 it selects one visible
participant, opens Moodle's native Send message modal, and proves the
EasyStud-decorated dialog/content surfaces are opaque and bounded, only the
body scrolls, the compact textarea keeps its fixed height, and there is no
horizontal overflow. It captures `message-modal-responsive-390.png` in the
external run output, then closes the modal using Moodle's native close control;
it never enters or sends a message. It is `local-supervised` and requires an
authenticated Moodle 5.1 fixture with participant-messaging capability.

Run only after an explicit runtime-review authorization, using the
authenticated runner, its exact title, and the `groupimport-active-runtime-write`
lease:

```powershell
.\tools\playwright\Invoke-EasyStudPlaywrightWithSavedCredentials.ps1 `
    -CredentialLoaderPath $loader `
    -OrchestrationModulePath $orchestration `
    -Spec 'message-modal-responsive.spec.js' `
    -Grep 'responsive native Send message modal remains opaque and contained' `
    -WaitForLease
```

The responsive expanded-Grouping rail check is
`grouping-rail-containment.spec.js` / `responsive expanded Grouping rail stays
inside its card`. At 390 px it opens a Grouping and checks that the expanded
rail and its icon stay within the unchanged card width, checks the rail as the
hit target at several heights, and rejects horizontal overflow. It also detects
any fixed shared-navigation trigger that covers the rail. It writes one
external screenshot and is `local-supervised` because it uses the leased
authenticated Moodle 5.1 fixture.

The reusable desktop navigation centring matrix is kept in
`responsive-audit.spec.js`. Run each exact title separately through the
authenticated runner:

- `desktop navigation remains centred at 1280`;
- `desktop navigation remains centred at 1440`;
- `desktop navigation remains centred at 1920`;
- `desktop navigation remains centred at rtl-1440`.

Each case proves that guide hover does not move the destinations or create
horizontal overflow. These specs are retained as candidates for the paused
Docker/CI visual-regression plan; they do not authorize Docker execution.

The compact-trigger matrix uses the following exact titles, each selected and
run separately: `responsive navigation trigger remains left-centred at
tablet-landscape`, `… at tablet-portrait` and `… at phone`. It proves the
left-edge fixed half-pill remains at its stable nearest-centre placement after
scroll/resize events, avoids the live Moodle drawer and participant selector,
reveals its hover label completely and creates no horizontal overflow.

The `desktop layouts and guide launcher remain available` case additionally
opens and closes the Guide modal. The page readiness ordering initialises the
Guide AMD before the manager AMD so this click path is not raced by the loading
skeleton gate. It also asserts viewport-sized modal and dialog geometry, so a
DOM-visible but collapsed navigation-slot modal is treated as a failure.
The same case opens Moodle's native participant select-menu and verifies that
the guide source has no elevated stacking context and does not paint above an
overlapping menu. It finishes at the compact breakpoint and records
`guide-desktop.png` plus `guide-mobile.png` in the run's external Playwright
output for the explicit human visual gate. These captures are registered in the
external artifact manifest and must not be copied into Git.

`mobile Guide modal aligns its internal content` is the focused compact-layout
case. It verifies the title and close control share a row, the slide uses one
content column, the interface action has its own full-width row, and footer
actions remain within the viewport. It also finds a visible guided-path card
and verifies its centred vertical composition and full-width child action. It
writes `guide-mobile-internal-alignment.png` and
`guide-mobile-guided-path-composition.png` to the external run output. A
failure that still reports the former two-column layout after source and Sass
checks is evidence of a stale Moodle theme aggregate, not a reason to weaken
the test.

When a reviewed spec belongs to a separate `local_groupimport` source checkout,
pass that checkout's own `tools/playwright` directory as `-AllowedSpecRoot`.
The runner verifies that root against the checkout's `version.php`; it does not
accept an arbitrary directory or a spec outside the allowlisted root.

For an external spec, the runner passes its absolute path and creates a short-
lived configuration outside both checkouts. That configuration imports the
runtime configuration and overrides only `testDir`; the source checkout never
needs `node_modules`. `NODE_PATH` temporarily includes the runtime modules for
the owned Node child and is restored in all cases. Use `-DiscoveryOnly` first:
it must report exactly one selected external test without loading credentials,
taking a runtime lease or launching a browser.

Browser output and the isolated profile are written below the external
`EASYEDU_PLAYWRIGHT_ARTIFACTS_ROOT`, or below the local application-data
default when that process variable is unset. The chosen artifact root must be
external to both the runtime and external source checkouts. Each run contains
`runner-result.json`, `cleanup.json`, `phase-progress.jsonl`, sanitized logs
and `artifact-manifest.json`. Use `-ArtifactRoot` only for another external
location; the checkout and any ancestor containing it are rejected.

## Accessibility smoke

The accessibility smoke uses `@axe-core/playwright` and targets only regions
owned by the plugin. It is explicit and non-destructive:

```powershell
.\tools\playwright\Invoke-EasyStudPlaywrightWithSavedCredentials.ps1 `
    -CredentialLoaderPath $loader `
    -OrchestrationModulePath $orchestration `
    -Spec 'accessibility-smoke.spec.js' `
    -Grep '<exact test title>' `
    -WaitForLease
```

It fails on critical or serious axe violations within
`#local-groupimport-easystud` or `#local-groupimport-import`. It is not a
required CI gate until the platform provides a deterministic authenticated
course fixture. See `docs/testing/accessibility.md`.

This Playwright scenario validates the shared motion controller in normal and
reduced-motion modes. It does not change Moodle data or administration settings.

The historical scenario-specific launchers remain useful for unauthenticated
discovery, but they are not the approved path for an authenticated run until
they delegate credential handling to the DPAPI-backed runner.

The audit intentionally uses one browser worker because the local Moodle
Windows stack becomes unreliable under several simultaneous login requests.

The card-title and selection audit verifies the shared EasyEdu compact,
regular and container title hierarchy, grouping disclosure accessibility,
semantic checkbox colour and desktop/mobile hit areas:

    npx playwright test .\card-title-selection-audit.spec.js `
        --reporter=line --workers=1 --timeout=90000

Override the target course when needed:

    .\tools\playwright\Invoke-EasyStudPlaywrightWithSavedCredentials.ps1 `
        -CredentialLoaderPath $loader `
        -OrchestrationModulePath $orchestration `
        -MoodleUrl 'http://localhost/local/groupimport/manage.php?id=8' `
        -WaitForLease

Run the same scenario after disabling **Enable interface animations** in the
plugin administration page to validate the server policy. Browser execution is
deliberately manual because visual audits are comparatively expensive.

## Mass Import and administration audit

The Mass Import audit checks the shared EasyEdu navigation,
centred page containment, the left-anchored guide launcher, desktop and mobile
containment, the history modal, the Excel example download and the legacy-safe
feature setting. Run it through the authenticated runner with its exact test
title and one worker.

### Phase 0 desktop and mobile composition

`phase0-mass-admin-responsive.spec.js` / `Phase 0 Mass Import and
Administration stay composed at desktop and 390px` is the read-only,
local-supervised visual matrix for the Foundations Phase 0 consumer. It checks
both pages at 1440 x 1000 and 390 x 844, requires the expected two-column to
one-column recomposition, rejects horizontal overflow, checks the square
centred section-icon tiles and writes four review captures. It does not change
settings, imports or course fixtures.

Run discovery first, then the exact one-test scenario through the saved-
credential wrapper. When the spec belongs to a separate source worktree, pass
that worktree's own `tools/playwright` directory through `-AllowedSpecRoot`.

### Focused Mass Import navigation

`mass-import-navigation-audit.spec.js` is a read-only, single-test regression
for the navigation consumer introduced by `EED-NAV-2026-0005`. It checks the
shared navigation is a sibling before the Mass Import loading root, exposes
only the two product destinations, marks Mass group import current and keeps
the compact trigger/panel usable at 390 px without horizontal overflow.

From the plugin root, use configured local paths rather than versioned drive
letters:

```powershell
$loader = '<credential-loader-path>'
$orchestration = '<easyedu-orchestration-module-path>'

.\tools\playwright\Invoke-EasyStudPlaywrightWithSavedCredentials.ps1 `
    -CredentialLoaderPath $loader `
    -OrchestrationModulePath $orchestration `
    -Spec 'mass-import-navigation-audit.spec.js' `
    -Grep 'Mass Import uses the shared navigation without entering the loading root' `
    -MoodleUrl 'http://localhost/local/groupimport/index.php?id=8' `
    -WaitForLease
```

Run the wrapper with `-DiscoveryOnly` first and confirm it selects exactly one
test. The wrapper uses the process-local saved credential and an external
artifact manifest; it does not require, print or persist credentials.

The restoration audit intentionally creates and removes one prefixed group,
grouping and history record. It verifies import, manual deletion, state restore
and annotated XLSX export, then cleans up its data in `finally`. It requires the
same shared lease and single-test discovery gate.

The read-only audit also replaces the file in an active preview and confirms
that mixed username and email identifiers are recognised before import.

The canonical artifact-retention policy is
`<EASYEDU_PLATFORM_ROOT>\docs\development\playwright-artifact-retention.md`.

## Visual artifact policy

The local-supervised Phase 0 responsive scenario covers 1440, 1024 and 390px.
It records numbered overlapping viewport captures by scrolling Moodle's real
inner scroll container. Review every numbered image; `fullPage` alone can
miss everything below the first viewport in Boost. This scenario does not
submit an import or save administration settings.

All three launchers write Playwright output outside the Git worktree and
register a manifest with the shared EasyEdu orchestration tooling:

- `run-motion-audit.ps1` uses `easystud\motion`;
- `run-mass-import-audit.ps1` uses `easystud\mass-import`;
- `run-mass-import-restore-audit.ps1` uses `easystud\mass-import-restore`.

The default root is `%LOCALAPPDATA%\EasyEdu\artifacts`. Set
`EASYEDU_PLAYWRIGHT_ARTIFACTS_ROOT` to use another approved local root when a
workstation stores heavy artifacts on a separate configured volume.
Set `EASYEDU_ARTIFACT_MANIFEST_SCRIPT` only when the shared orchestration
checkout is not at its standard path. Do not point either variable into Git or
Syncthing-managed project folders.

Each run keeps its Playwright output in a unique run directory and writes a
manifest containing the status and generated media. The shared retention tool
is dry-run by default; unmanifested legacy captures are inventory-only and
must not be deleted automatically. Read the canonical policy before pruning:
`<EASYEDU_PLATFORM_ROOT>\docs\development\playwright-artifact-retention.md`.
