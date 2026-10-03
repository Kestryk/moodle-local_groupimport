# Student entity dialog chrome - 2026-10-02

Batch: `EED-UI-2026-0073`. Portable continuation of
`student-workspace-controls-2026-10-02.md`.

Continuation 2026-10-03: modal actions now align right with matching pair
density. `student-modal-footers-2026-10-03.md` and its new readback supersede
the centred footer/source pins below, not the unchanged historical header
publication or old browser assets. New preview/human gates remain pending.

## Outcome and limits

An uncommitted Kit 0.4.55 candidate now owns the opt-in entity header,
title/eyebrow/icon tile, surface border, root layer and right-aligned matched regular actions.
EasyStud imports the identical `_dialog-classes.scss` and adds classes to the
existing template/JS markup. Its duplicate header/footer paint is removed;
generated CSS/AMD are rebuilt from source. There are no new inline styles,
business commands, PHP API changes or plugin-version changes.

This is not a whole-dialog parity claim. Existing body fields, metadata lists,
image picker, generic Close control and responsive dialog dimensions remain
consumer-owned. Original disclosure/open-close Motion and focus are preserved
in source, not newly browser-certified. Human review remains unchecked.

## Source inventory preserved

| Dialog | Existing contents and actions |
| --- | --- |
| Participant | Read-only name/email, username, ID, institution, department, city, country, language, roles/groups/groupings, description and optional native-profile URL. No Save/Cancel editing footer. |
| Group | Name, ID, enrolment key, description, member/grouping counts and exportable lists, image selection and delete-picture control. Native `updategroupadvanced`, Save/Cancel and optional native link remain. |
| Grouping | Name, ID, description, group count/list and read-only configuration. Native `updategroupingadvanced`, Save/Cancel and optional native link remain. No invented Group-only image/password controls. |

Counts, hidden CSV tables, permissions, loading and persistence paths are not
rewritten. The new scenario only opens and closes existing course entities;
it never saves, sends, uploads, exports, follows native links or creates data.

## Paired Penpot record

Machine-readable IDs and readback:
`testing/student-entity-dialog-chrome-penpot-2026-10-02.json`.

- Foundations file: `40e06342-8830-80d6-8008-96572effc11c`.
- Standard page: `2b150968-5877-802e-8008-97c286173199`.
- Library page: `81455adb-6787-8068-8008-9ce6186bf6ef`.
- Header components: Desktop `c937b22a-fc4d-8004-8008-bae32deee79a`,
  Narrow `c937b22a-fc4d-8004-8008-bae3711770b7`.
- EasyStud file/page: `220f6449-533e-815b-8008-ad9958d032a1` /
  `cef95197-06bc-809e-8008-aeff9a955b2c`.

Publish by source-preserving instance -> detach -> component. The generic
Shell M main is untouched; hidden legacy body/footer descendants are retained
recoverably inside the new header-only family. Desktop and Narrow copies
match the visible Library geometry, fills and typography including Inter.
Product uses three linked Desktop headers; no product-local main was created.

The three headers use Inter 16px/700 `#264861` titles and 10px/700 primary-blue
eyebrows, a 32px tile with 16px entity glyph, canonical soft gradient and
`#cfe0ef` border. Seven actions keep linked regular Primary/Secondary sources.
All label paint is contained, row-centre deltas are effectively zero, the five
icon actions have 10.4px icon-box/label gaps, and label vertical deltas are
<=0.401px. None of the three existing hosts has visible descendant overflow.

Five final screenshots were inspected under
`%LOCALAPPDATA%/EasyEdu/artifacts/easystud/penpot/entity-dialog-chrome-20261002/`:
`foundation-entity-header-standard.png`, `foundation-entity-header-library.png`,
`easystud-participant.png`, `easystud-group.png`, `easystud-grouping.png`.
These are owned-CDP editor captures, not Moodle screenshots or human acceptance.
The editor library-update notice was dismissed; no bulk component update ran.

## Source and discovery checks

Passed: Sass build, approved existing Terser AMD build, ES-module/build/spec
syntax, entity source/pin/recorded-readback contract, existing card-modal
contract, Kit compact-portal compile fixture, Clipboard/workspace source
contracts and `git diff --check`. Use explicit `-KitRoot` for consumer tests.
The recorded-readback contract checks saved evidence, not fresh Penpot paint.
The existing entity-modal live-membership rehydration source contract also
passes. The final canonical/mirrored modal docs share Git blob
`ad54fd30e1b7978053e11e74b9be5047f46ca635`.

Sass retains its pre-existing mixed-declarations warning in `_layout.scss`.
`test-wave9-modal-panels-contract.ps1` still fails its older Administration
hint-selector location assertion. At baseline HEAD the requested selector is
already absent from `_typography-identity.scss`; current hint/child-span styles
are in `_admin-settings.scss`. Neither unrelated Administration source nor its
test was changed to make this tranche appear fully passing.

Discovery-only run `easystud-authenticated-20261002T213648242Z-48188` selected
exactly one test, runner exit 0. Its result remains `incomplete`, not a browser
PASS. Cleanup reports no runtime lease or fixture requested, credentials
cleared and owned child stopped. Scenario:
`tools/playwright/student-entity-dialog-chrome.spec.js`, exact test name
`Student entity dialogs preserve conditional content and Foundation chrome`.
It targets 1600/768/390 in normal-motion mode. Full disclosure timing, all
states, RTL/forced-colors and other Moodle versions remain outside this proof.

## Integration gate and ownership

Kit branch `work/port4719pg3/eed-ui-2026-0073-kit-phase0-mass-admin`, baseline
`29e8d4f983308dd181375dbc8a0e2cf8fffec6df`.
Consumer branch
`work/port4719pg3/easystud-foundations-student-management-20260928`, baseline
`3c5f9ebda69efd89bc13607d46b9918a381c1e73`.
These candidates are dirty/uncommitted, not a pushed or transferable handoff.
Both work branches keep their origin upstream; local ahead/behind is 0/0
before these uncommitted changes. No source commit or push was performed.
Current shared runtime remains clean on
`preview/moodle51/easystud-phase0-mass-admin` at
`333b7539932749b354b1070350412cc33b6d29bb`; no new promotion/cache purge or
authenticated test ran. The preceding Clipboard proof certifies its pinned
assets only, not this candidate.

The next gate requires named user authority for the owned Kit/consumer
commit+push, managed local Moodle 5.1 preview/cache refresh and this exact
open/cancel scenario. Use the supervised wrappers with bounded runtime/lease
waiting, immutable source, saved-credential loader and external manifested
captures. Do not manually copy runtime files or bypass a conflict/base failure.

Platform-owner proposal: update 0073, the source-component crosswalk,
plan/state and scenario registry with the paired IDs, source/pin data and the
explicit pending runtime/human flags. Shared dirty Platform files are owned
elsewhere and remain untouched. The human checklist stays open, including
body/Close parity and complete responsive product compositions.

## Cleanup and efficiency

Both evidence folders have scoped retention inventories; no delete/Apply was
requested. No credentials, browser profiles or heavy media are added to Git.
Run-scoped reports are `retention-20261002T215746Z.json` for the Penpot folder
and `retention-20261002T215750Z.json` for discovery. Each reports one protected
manifest, zero candidates/unmanaged files/deletions/errors. Five PNGs are
pinned in the Penpot manifest; its status remains `incomplete`.
No services, Moodle data or another window's worktree were changed. No verified
transfer snapshot is claimed. Source reversal should be an owned review/revert
after publication, never a reset of dirty work; Penpot legacy parts remain
recoverable.

No per-task token/billing telemetry is available. Avoidable effort came from
broad output, stale inherited font family, asynchronous library loading and
flex labels being recentered after an edit. Future passes should inspect
effective visible ancestry, use shape IDs instead of proxy object identity,
read actual Inter/font/paint after reflow and keep added glyphs outside linked
copies. Prefer focused editor captures and run-scoped retention over repeated
whole-board exports or a global inventory.
Two preflight harness mistakes were corrected before the final PASS: an
automatic PowerShell-variable collision and a guessed workspace script name.
Resolve script paths first and use task-specific names for script variables.
