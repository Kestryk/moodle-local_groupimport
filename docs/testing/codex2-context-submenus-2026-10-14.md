# Context-menu spec adaptation, 14 October 2026

Claude31386438 is published asbbb5fd59 by Codex1. Copy/add commands now live
inside native context submenus; Advanced settings stays at the top level. This
QA lot changes tools/specs only, preserving existing panel, lookup, palette,
focus, geometry and business-write assertions.

## Adapted callers

Each of the following adds one helper import and one native submenu-open call
immediately before its existing action locator/click:

- manual-card-email-identifier-recognition.spec.js
- manual-card-identifier-availability.spec.js
- manual-card-identifier-recognition.spec.js
- student-framed-add-active-workspace.spec.js
- student-framed-add-successor.spec.js
- student-framed-add-themed-successor.spec.js
- student-inline-feedback-foundations.spec.js
- student-textarea-foundations.spec.js
- guide-card-identifier-availability.spec.js
- guide-card-identifier-committed-availability.spec.js
- guide-card-identifier-settled-availability.spec.js

The twelfth, n2-four-f7-integration-native.spec.js, keeps its closed top-level
inventory and adds a separate child inventory after actual submenu opening.
It does not count closed submenu children as visible top-level actions.
Its historical mode setters/dual matrix remain dormant, rejected by the
single-mode runner; this lot never executes or revives those mutations. Current
single-mode menu inventory is exercised by the focused new native successor.

## Shared helper contract

`context-submenu-inventory-helper.cjs` maps group-paste-emails and
group-add-copied-users to add-participants, grouping-paste-groups and
grouping-add-copied-groups to add-groups, and every copy-* action to copy.
`openContextSubmenu(scope, action, fieldKey?)` clicks/taps the native trigger,
requires expanded=true and a visible submenu, then requires the requested
action visible. Repeated opens keep an already-expanded submenu open. Copy
participant fields may specify their actual data-easystud-context-field key.

Native product source also flattens a submenu with exactly one available item.
The helper accepts that only when the real group is is-flattened, trigger is
hidden, submenu role is group and exactly one child is visible. It does not
force visibility, invent availability, inject CSS or fall back to hidden clicks.
The inventory waits the actual second child before taking a snapshot; it then
closes the submenu by its native click/tap toggle, retaining the parent menu.
This avoids making inventory dependent on keyboard focus scrolling, which
separately closes a desktop context menu. Helpers/spec predecessors are kept
for their failed run evidence.

## Dedicated copy preparation

Only the published31386438 product patch is applied to the existing external
component-loading stage, preserving K21/Mass Import/K16 and A-CHECKLIST. AMD is
regenerated with the installed build toolchain. Sass1.79.1 uses the required
build-styles.cjs conservative command,35 added/2 removed lines compared with
the same staged baseline, no @charset. Twelve runtime files copied under8051
runtime/cache leases with hashes/backups and purgePASS; no active source or
principal product mutation. `C:/dev/artifacts/es-context-submenus-stage` and
`C:/dev/artifacts/es-context-submenus-deploy/manifest.json` retain evidence.

## Verification scope

All12 caller specs plus helpers parse; diffs in each of the11 action callers
are exactly two added lines, with original Guide trailing newlines preserved.
The focused native test uses existing course5, sole on-demand mode, FR1280/390,
participants/groups/groupings. It inventories only native available commands,
opens Copy/add submenus, checks desktop flyout/mobile accordion and first-level
Advanced settings, opens/cancels identifier panels, and blocks all business
writes. It neither clicks copied-user/group mutation actions nor reads/writes
the system clipboard. Availability/opening proof is separate from execution.

Retained first run `easystud-authenticated-20261014T184909737Z-43952`,
`es-context-submenus-native`, failed on the desktop-only hidden Close button,
after native Copy inventory and child Escape passed. Recipe error only.
Close successor `185120378Z-21776`, `es-context-submenus-native-close`, failed
because a visible submenu surface preceded painted children; unchanged menu
assertions retained with a new child-ready helper/successor, no product fix.
Ready successor `185249078Z-47068`, `es-context-submenus-native-ready`, records
the participant Copy children, then finds the desktop parent menu closed before
the next open. The final inventory helper uses click/tap close; its Copy probe
uses actual child focus with preventScroll before Escape. No product change
or keyboard accessibility acceptance is inferred from these recipe revisions.
Inventory successor `185515579Z-52080`, `es-context-submenus-native-inventory`,
still observes a desktop menu close during its snapshot. Its test/run stays
immutable. Final successor centers cards with instant native scroll before
opening menus, avoiding pending document scrolling that closes desktop menus.

Final `context-submenu-native-painted-successor.spec.js`, run
`easystud-authenticated-20261014T185711367Z-48264` in
`C:/dev/artifacts/es-context-submenus-native-painted`, is PASS for all6 cells:
FR390/1280 participant/group/grouping. Copy children and the4 add actions are
available after their native triggers; add flyouts use fixed desktop positioning
and static mobile accordion positioning. Group/grouping identifier panels open,
receive focus, then cancel. Both Advanced settings commands are explicitly
first-level on mobile; desktop keeps its direct header tools. Zero pageerrors
and zero attempted business writes. Grouping screenshots at both widths were
visually inspected. No native hover, flattened-case or copy execution acceptance
is claimed. Existing full12 scenario suites were not rerun; shared routing is
proved natively and their remaining oracles remain intact.

Existing page-free SM loading/ready gates and published K16 remain unchanged.
Guided writing paths3/7/11 stay scopedPASS; path10 native hidden next cue remains
open for Claude. No unchanged guided-path or loading replay in this lot.
No new visual source/Kit/Penpot work; human and Moodle4.5 gates stay separate.
AI contract applicability: this document records the QA routing change; no new
reusable product API contract, no AGENTS.md or separately owned Kit edit.
