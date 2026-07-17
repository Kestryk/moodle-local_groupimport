# Changelog

All notable changes to `local_groupimport` are documented here.

Maintenance convention:

- Changes are grouped by work day to avoid one entry per micro-adjustment.
- The `Unreleased` entry contains changes currently present in the worktree but not yet shipped in a version/tag.
- Retrospective entries are reconstructed from the local Git history and the available development context.

## Unreleased

### 2026-07-17

- Kept participant detail actions fixed at the same desktop card coordinates
  while compact cards expand into full details.
- Removed the Groups without groupings container from the dedicated Groupings
  workspace while preserving its data and its complete-view behaviour.
- Replaced split More filters labels and chevrons with one accessible,
  animated disclosure button using compact desktop and touch-sized variants.
- Updated the embedded EasyEdu contracts to UI kit `0.4.44`.

### 2026-07-16

- Restored the historical desktop EasyStud action navigation as a dedicated
  region while retaining the categorised off-canvas navigation on compact
  screens.
- Anchored participant detail and card-menu actions to terminal header slots,
  aligned compact list spacing and added subtle non-draggable grouping hover
  feedback.
- Restored the approved blue card-action menu glyph on compact layouts while
  retaining one shared action resolver for click, long press and selection.
- Restored the Moodle AMD wrapper for the rebuilt course manager so RequireJS
  can initialise EasyStud actions and the participant navigation integration.
- Stopped the responsive card-menu observer from repeatedly replacing its own
  action-grip markup, which created an unbounded detached DOM tree and blocked
  clicks, context menus and the browser main thread.
- Kept mobile-only grouping occupancy filters out of the desktop structure
  workspace, restored the requested blue menu icon on every card and prevented
  desktop focus classes from hiding participants after a responsive switch.
- Grouped the mobile drawer into styled EasyStud tools and Course participants
  sections, including the native enrolled-users, mass-import and clipboard
  destinations.
- Removed a self-triggering responsive Back to top observer that could keep
  the browser main thread busy after card and panel mutations. Synchronisation
  is now frame-coalesced, observes only relevant floating surfaces and avoids
  redundant DOM writes; the manager also rejects duplicate AMD initialisation.
- Restored the full semantic identity-rail width on responsive participant,
  group and grouping cards while containing every card inside the viewport.
- Repaired independent More filters disclosure animation, conditional Reset
  controls and the native hidden-state contract for grouping filters.
- Normalised every responsive card action button to the canonical action-grip
  and kept click, long press and the bottom action sheet on one resolver.
- Expanded the mobile navigation panel with the complete Moodle participant
  navigation, kept EasyGuide adjacent to its trigger and added an accessible
  safe-area-aware Back to top control.
- Synced and documented EasyEdu UI kit 0.4.41 responsive rail, navigation,
  disclosure and sticky-surface contracts.

### 2026-07-15

- Finalised the three responsive Participants, Groups and Groupings
  workspaces with a scrollable all-destination navigation rail, direct group
  catalogue, independent mobile filters and stable one-row list tools.
- Reused the established nested-group menu trigger for the mobile context
  sheet, removed duplicate card menus and restored responsive inline rename
  with touch-sized Save and Cancel controls.
- Contained expanded grouping rails within the viewport and added a real
  accessible responsive action-status pill for Ajax operations.
- Synced and documented EasyEdu UI kit 0.4.39 responsive navigation,
  pagination, panel-spacing, rail-containment and busy-state primitives.
- Replaced the compact primary-navigation rail with an accessible off-canvas
  panel, including backdrop, Escape handling, explicit close and focus return.
- Removed the desktop-only ungrouped container from the mobile Groups view,
  restored the exhaustive flat catalogue and its independent grouping filters,
  and replaced card-style filter chevrons with compact disclosure buttons.
- Reduced mobile identity rails, contained expanded grouping cards, widened
  group-member lists and refined the touch-friendly inline rename surface.
- Synced EasyEdu UI kit 0.4.40 and added Playwright coverage for navigation,
  flat group catalogues, filters, card containment and responsive rename.
- Restored the original desktop More filters markup after the responsive
  disclosure regression, kept both structure-view panels independent and
  forced the mobile flat Groups catalogue to render its cards rather than only
  clearing the parent hidden attribute.

### 2026-07-14

- Restored the copy-or-move choice when a nested group is dragged from one
  grouping to another in the dedicated Groups & Groupings view. Groups dragged
  from the exhaustive catalog remain additive and dropping into the same
  grouping remains a no-op.
- Reworked simplified management below 1024 px into three exclusive mobile
  workspaces for Participants, Groups and Groupings while preserving the three
  historical desktop layouts unchanged.
- Added an explicit card action trigger and a safe-area-aware bottom action
  sheet shared with long press, retained compact participant cards during
  selection, disabled tactile drag feedback and kept only available actions in
  the sticky mobile selection tray.
- Temporarily disabled every EasyStud guide surface in the responsive
  workspace and restored the active desktop layout when returning above the
  breakpoint without marking guide progress as completed.
- Synced the EasyEdu UI kit 0.4.38 responsive primitives, touch-target token,
  Moodle colour-picker group and AI/component documentation into the plugin.

### 2026-07-13

- Kept the Mass Import and simplified-management accent rails inside their
  rounded panel borders, including expanded and collapsed preview states, and
  synchronised the reusable panel contract from EasyEdu UI kit 0.4.37.
- Centred the simplified-management navigation actions independently of the
  EasyStud guide launcher and promoted the balanced rail structure to EasyEdu
  UI kit 0.4.32.
- Expanded Mass Import to the full available course-content width while
  preserving centred gutters and responsive containment.
- Hardened the accessible segmented reimport strategy against translated-title
  clipping and documented regular and compact design-system variants.
- Removed the duplicate preview search-selection action. The single leading
  button now switches between all-row and filtered-result scope dynamically.
- Moved the reimport strategy heading fully inside its choice panel while
  retaining an accessible native legend, and synced EasyEdu UI kit 0.4.33.
- Restored deliberate spacing around the annotated Excel export action and
  applied the shared icon-slot/action-button contract.
- Increased icon/label spacing through the theme-overridable
  `--easyedu-action-icon-gap` token and synced EasyEdu UI kit 0.4.34.
- Reordered historical upgrade savepoints, added coverage for the legacy-safe
  feature flag and refreshed only unchanged obsolete Moodle user tours.
- Updated the Mass Import tour for CSV/Excel preview, automatic identifier
  detection and the current interface targets.
- Added a non-destructive release validator that compares the current plugin
  with the historical CSV tag, audits the complete upgrade chain and can build
  an inspected production ZIP without modifying Moodle data.
- Added a disposable legacy-upgrade rehearsal for the local Moodle Windows
  stack. It clones the database, recreates the public CSV release state, runs
  Moodle's real local-plugin upgrade pipeline and verifies schema, settings and
  tour migration before automatically removing the test environment.
- Updated the Mass Import browser contract for the contained segmented-choice
  geometry and the theme-overridable action icon gap.
- Expanded browser coverage for actual file replacement with mixed automatic
  identifiers, non-empty annotated XLSX exports and a dedicated restoration
  audit launcher using the packaged Moodle PHP runtime.
- Cleared the remaining Moodle coding-style warnings in production PHP and
  synchronised EasyEdu UI kit 0.4.35 with compliant reusable guide language
  examples.
- Removed the final Sass mixed-declaration deprecation from the plugin tooltip
  integration without changing its visual result.

### 2026-07-12

- Restored the shared compact rounded treatment for guide navigation and
  guided actions. The administration navigation mixin now targets direct child
  buttons only, so it no longer makes modal actions square and oversized.

### 2026-07-11

- Expanded Mass Import into a recoverable workflow: confirmed imports now store
  their complete target state and can recreate manually deleted groups,
  groupings, memberships and assignments. Restoring is idempotent and remains
  available after a previous restore.
- Added annotated Excel report exports after import and from course history.
  The first three columns remain directly reimportable while status, details and
  semantic row colours make errors and warnings easy to review.
- Replaced raw reimport radios with the accessible EasyEdu segmented-choice
  control and aligned Mass Import icons, rollback actions and modal spacing.
- Adopted the exact Course Banner Builder primary navigation rail in the
  simplified manager and Mass Import, including icon placement, active state
  and a guide launcher anchored at the far left.
- Centred the Mass Import canvas within the course content area and matched the
  horizontal breathing room used by simplified student management.
- Right-aligned the final administration save action following Moodle form
  conventions and added a reusable kit spacing contract for form actions and
  icon-plus-label buttons.
- Finished the reimport strategy controls. Teachers can keep existing
  placements or synchronise only the groups listed in the selected preview
  rows; replacement removals are included in the recoverable import journal.
- Added Moodle XMLDB installation metadata and upgraded the history table with
  reversible operation and rollback attribution fields.
- Replaced the CSV example with a formatted XLSX workbook containing an import
  sheet, representative mixed identifiers and a dedicated instruction sheet.
- Hardened automatic user matching so duplicate email, ID number or custom
  field values are treated as ambiguous instead of selecting an arbitrary user.
- Completed the preview replacement workflow, stabilised the sticky upload
  panel control and fixed full-window file drops by waiting for and forwarding
  to Moodle's native filepicker APIs.
- Aligned the Mass Import and simplified manager navigation with the EasyEdu
  primary navigation contract already used by Course Banner Builder.
- Reworked plugin administration around an EasyEdu feature surface and added a
  legacy-safe opt-in for simplified student management.
- Renamed the visible plugin administration identity to EasyStud while retaining
  the `local_groupimport` component and routes for upgrade compatibility.
- Replaced the obsolete null Privacy provider with metadata, export and deletion
  support for course import history.
- Added a reusable read-only Playwright audit for Mass Import navigation,
  responsive containment, history, Excel download, file preview/replacement and
  administration settings.
- Synced EasyEdu UI kit 0.4.31, including shared typography plus the new
  reusable history action/state primitives, documentation, AI contracts, guide
  reference and motion reference packages.
- Added a legacy-safe administrator switch for the optional simplified student
  management view. Existing installations retain the historical mass-import-only
  workflow after upgrade, while fresh installations enable the complete EasyStud
  experience by default.
- Made course navigation, participant-page replacement, direct manager access
  and Mass Import actions consistently respect the simplified-view setting.
- Styled the new feature switch and the existing motion preference with the
  EasyEdu administration setting surfaces.
- Replaced duplicated Mass Import card rails and contextual modal gradients
  with the canonical EasyEdu semantic panel and modal contracts, preserving the
  existing EasyStud appearance and interactions.
- Synced EasyEdu UI kit 0.4.27 non-guide tokens and documentation for semantic
  modals, accent panels and sticky/semantic tables.
- Fixed the single-participant selection exception that prevented density
  motion from starting and allowed profile content to overlap the next card.
- Corrected EasyStud guided checklist targets so steps switch to the relevant
  view, open the needed grouping/group panels and highlight the exact creation
  or paste field instead of a generic list container.
- Reduced guided-step over-scrolling by avoiding centred target scrolling for
  large checklist targets such as drag/drop and context-menu practice cards.
- Synced the EasyEdu guide minimized checklist state so the close action no
  longer remains visible while the panel is collapsed.
- Smoothed guided checklist focus transitions by delaying page alignment until
  inner column scrolling has settled, and widened guided-path slide cards to
  match the explanatory guide blocks.
- Removed retained Web Animation effects so group member lists can reliably
  complete repeated open, close and reopen cycles.
- Retuned shared motion to 100/160/220 ms with a bounded 260 ms maximum for
  tall disclosures, making ordinary interactions more responsive.
- Stopped rebuilding and sorting every paginated list during selection changes
  and batched participant tag measurements to reduce forced layouts.
- Extended the Playwright audit with real intermediate-height and repeated
  disclosure assertions; all normal and reduced-motion scenarios pass.
- Made short search and paste panels distance-aware, delayed field focus until
  opening completes and replaced two-phase view changes with one atomic entrance.
- Changed pagination and sort replacements to fade-only swaps so scrollable
  columns no longer gain a temporary scrollbar or shift their cards sideways.
- Synced EasyEdu UI kit 0.4.28 (`28c578c`) with the complete motion runtime
  package, reusable recipes, AI contracts and updated guide behaviour.
- Added a versioned French handoff prompt covering repository state, reusable
  contracts, measured performance, validation and forbidden regressions.

### 2026-07-10

- Rebuilt EasyStud motion around one cancellable AMD controller with consistent
  120/180/240 ms timings and an administrator switch for optional animations.
- Added complete reduced-motion handling for the simplified manager, mass group
  import and Moodle-native message modals.
- Reworked pagination, participant compact/detail changes, group member lists,
  grouping disclosures, advanced filters, inline panels and layout switching to
  avoid overlapping transitions and nested-card tremble.
- Replaced delayed grouping resize chains and legacy creation/removal keyframes
  with single measured transitions and stable final states.
- Added a reusable Playwright motion audit and isolated PowerShell launcher for
  normal, reduced-motion and interrupted-interaction coverage.
- Corrected participant and grouping disclosure measurements and softened
  pagination swaps so transitions remain continuous instead of jumping or
  blinking.
- Added a balanced easing for tall participant, group and grouping disclosures
  so opening and closing remain perceptible across the full duration.
- Added bounded adaptive disclosure durations up to 300 ms so large groups and
  groupings remain visibly animated without slowing ordinary cards.
- Removed retained Web Animation fill effects that could clamp participant and
  member-list heights, block a second opening and accumulate rendering work.
- Shortened ordinary motion and capped large disclosures at 300 ms, while
  avoiding a full responsive-list recalculation after each member toggle.

- Synced the shared EasyEdu guide scene styling so EasyStud keeps the
  historical rich learning animations while using the reusable kit primitives.
- Updated the embedded EasyEdu guide documentation for soft pedagogical
  canvases, restored drag/drop, paste, context-menu, formula and guided-path
  motion, and Course Banner Builder scene mapping.
- Synced the reusable `guide-adjacent-action` button primitive from the kit so
  guide-adjacent controls compile consistently across EasyEdu plugins.
- Synced the hardened EasyEdu guide scene layouts so long translated slide
  text, guided-path buttons and checklist labels wrap inside their containers,
  with Playwright coverage confirming no slide overflow across the 20-step
  EasyStud guide.
- Synced the animated guide pointer refinement so context-menu learning scenes
  keep their motion without causing horizontal overflow.
- Synced the restored EasyEdu guide action and checklist styling so EasyStud
  guide buttons stay blue, learning surfaces are centred, guided-path cards
  use a stronger green surface without an extra rail, and checklist rows avoid
  internal text overflow.
- Fixed the guided checklist return action so it says `Return to guide`,
  restored the solid blue `Show in the interface` action, strengthened the
  teaching animations for context-menu and drag/drop slides, and removed the
  remaining situational completion-message overflow.
- Increased spacing around EasyStud guide `Show in the interface` actions and
  enlarged the introductory flow/card learning scenes so the first slides feel
  more balanced.

### 2026-07-09

- Restored the rich EasyStud learning scenes in the shared EasyEdu guide instead
  of reducing the existing 20-slide content to generic pills.
- Reconnected guided checklists to successful EasyStud actions and prevented
  steps from completing when their checklist row is clicked.
- Restored the checklist completion message and populated return-to-guide panel
  through the canonical EasyEdu template contract.
- Restored the EasyStud guide launcher as an icon-only control with its
  hover-help bubble, while keeping it aligned inside the shared EasyEdu admin
  navigation rail.
- Synced the embedded EasyEdu admin navigation and popover primitives so
  EasyStud remains the visual reference for Course Banner Builder.
- Added the generic EasyEdu guide template, Moodle AMD wrapper and scoped SCSS root so EasyStud can migrate from the legacy local tutorial to the shared kit guide contract incrementally.
- Kept the legacy EasyStud tutorial as a guarded fallback only, while rendering
  the active 20-slide guide through the shared EasyEdu guide contract.
- Rendered the EasyStud guide through the shared EasyEdu guide template and mapped the legacy tutorial visuals to reusable guide visual cards, steps and keyboard blocks.

### 2026-07-06

- Synced the embedded EasyEdu UI kit `v0.4.26` SCSS, guide assets and documentation after the inverse EasyStud audit.
- Added the EasyStud / GroupImport kit mapping documentation to clarify which UI primitives are reusable and which behaviours remain plugin-owned.
- Reused the new kit primitives for EasyStud selection checkboxes, participant identity badges, inline reveal panels and group member preview fade lists.
- Regenerated the plugin stylesheet after the kit sync.

### 2026-07-05

- Synced EasyEdu UI kit AI contracts and manifest into `easyedu-kit-docs` so future kit integrations keep the same implementation, guide parity and Moodle plugin review rules.
- Marked `easyedu-kit-docs` as `export-ignore` so development-only kit documentation remains versioned but is excluded from production release archives.

### 2026-07-03

- Refined EasyStud responsive JavaScript orchestration for collapsible filters, pagination, density switches, nested card toggles and mobile action recalculation.
- Improved touch long-press handling so context menus stay touch-specific and no longer interfere with desktop mouse interactions.
- Added stronger accessibility/state synchronisation for long grouping-tag summaries and participant tag overflow toggles.
- Fixed mobile EasyStud overflow found during the Playwright visual audit by constraining the action tray, preserving readable pagination select buttons and fully hiding inactive panels on narrow screens.
- Synced EasyEdu UI kit `v0.4.23` with safer wrapped mobile action tray primitives.
- Synced EasyEdu UI kit `v0.4.24` with a stronger drag preview count badge for readable multi-item drag stacks.
- Restyled the plugin administration settings page with an EasyEdu overview card, field chips and a clearer native Moodle multiselect for automatic user identification fields.
- Added admin-configurable participant card custom profile fields, including a compact coloured badge and two optional full-detail metadata tags.
- Synced EasyEdu UI kit `v0.4.25` with reusable native colour picker primitives for Moodle admin/settings forms.
- Fixed lingering EasyStud UI regressions around the native message modal sizing/loading state, complete-view grouping open rails and paginated list transitions.

### 2026-07-02

- Added participant messaging from EasyStud by reusing Moodle's native messaging flow from the `Enrolled users` page.
- Added a messaging action button for selected participants, gated by Moodle's `moodle/site:sendmessage` and `moodle/course:bulkmessaging` capabilities.
- Added the messaging action to the context menu for participants and members displayed inside groups.
- Restyled Moodle's native send-message modal to match the EasyStud/EasyEdu visual language.
- Added a shared entrance animation for Moodle native modals decorated by EasyStud.
- Restored and strengthened the EasyStud guide checklist success message when all guided path steps are complete.
- Synced the embedded EasyEdu guide copy with UI kit `v0.4.4`.
- Synced EasyEdu UI kit `v0.4.5` with reusable motion primitives, destructive/move modal primitives and drag preview helpers.
- Synced EasyEdu UI kit `v0.4.6` with reusable settings/detail modal filepicker, help icon and image placeholder primitives.
- Synced EasyEdu UI kit `v0.4.7` with reusable metadata list section primitives for settings/detail modals.
- Synced EasyEdu UI kit `v0.4.8` with a reusable Moodle native modal loading state.
- Harmonised the native Moodle send-message loading state so the EasyStud modal animation and loader styling are applied earlier.
- Synced EasyEdu UI kit `v0.4.9` with standardised guide modal size tokens aligned with the EasyStud tutorial modal.
- Synced EasyEdu UI kit `v0.4.10` with replayable native Moodle modal entrance animations.
- Restored the send-message modal entrance animation after Moodle's loading phase and enlarged the message textarea.
- Synced EasyEdu UI kit `v0.4.11` with reusable report/preview table primitives, history-list modal primitives and guided-step documentation hooks.
- Synced EasyEdu UI kit `v0.4.12` with sticky selection panel primitives and responsive long-press/action-tray guidance.
- Reused EasyEdu context-menu primitives for the EasyStud contextual menu to reduce local styling duplication.
- Synced EasyEdu UI kit `v0.4.13` with reusable modal file-drop overlay primitives for advanced settings dialogs.
- Synced EasyEdu UI kit `v0.4.14` with richer pagination primitives for select-all/results, counters, sort controls and placeholder alignment.
- Synced EasyEdu UI kit `v0.4.15` with a reusable card reveal toggle for expanding hidden card content.
- Synced EasyEdu UI kit `v0.4.16` with reusable open identity rail primitives for expanded grouping/container cards.
- Synced EasyEdu UI kit `v0.4.17` with reusable insert drop-target and configurable drag-disabled primitives.
- Synced EasyEdu UI kit `v0.4.18` with a public guided highlight refresh event for UI transitions, pagination and Ajax updates.
- Connected EasyStud layout switches, filters, pagination, collapsible cards and Ajax list updates to the reusable guided highlight refresh event.
- Synced EasyEdu UI kit `v0.4.19` with orchestration documentation for dynamic views, filters, pagination, Ajax mutations and guided-path highlight refresh timing.
- Synced EasyEdu UI kit `v0.4.20` with reusable card related-tag summaries and compact/detail density transition primitives.
- Reused the new EasyEdu card primitives for EasyStud group grouping-tag summaries and participant compact/full-detail transitions.
- Synced EasyEdu UI kit `v0.4.21` with reusable custom drag preview, stacked drag and source-placeholder primitives.
- Reused the new drag/drop primitives for EasyStud drag previews and dragged card placeholders.
- Synced EasyEdu UI kit `v0.4.22` with reusable mobile action tray primitives for responsive selection actions.
- Reused the new responsive action tray primitives in EasyStud tablet/mobile layouts.

## 0.3.0-beta - 2026-07-02

- Synced EasyEdu UI kit `v0.4.3` to refine the compact action menu trigger.
- Adjusted compact action menu styling so it reads closer to EasyEdu labels/buttons.
- Reduced and softened hover/focus treatment for compact action buttons in dense action rows.

### 2026-07-01

- Synced EasyEdu UI kit `v0.4.2` into the plugin.
- Added the reusable `easyedu-guide-kit` foundation: AMD module, Mustache template, language files, documentation and Moodle integration example.
- Extracted and documented many EasyEdu primitives: animations, buttons, cards, badges, menus, modals, forms, overlays, pagination, tables, tooltips, responsive helpers and guide patterns.
- Enriched the EasyStud guide with rich navigation, guided paths, floating checklist, interface highlights and keyboard behaviour.
- Improved hover help bubbles and compact action menus.
- Documented the EasyEdu kit and integration notes for Course Banner Builder.

### 2026-06-30

- Major redesign of the EasyStud simplified management view for participants, groups and groupings.
- Added three layout modes: participants and groups, complete view, groups and groupings.
- Added and refined multi-selection for participants, group members, groups and groupings.
- Added move, delete, remove members, remove groups from groupings, duplicate and advanced edit actions.
- Added desktop and mobile context menus that adapt to the current selection.
- Added a more complete responsive interface: adaptive columns, mobile actions, card density and touch-oriented behaviours.
- Added detailed participant, group and grouping cards with icons, identity rails, selection states, filters and animations.
- Added detail/settings modals for participants, groups and groupings.
- Added a rich EasyStud guide with slides, visual examples, guided paths, floating checklist and interface highlighting.
- Redesigned the mass group import view with harmonised styles, drag-and-drop area, file detection, preview and clearer import reports.
- Added more flexible CSV/Excel interpretation and automatic user identifier detection.
- Added an embedded EasyEdu kit foundation: tokens, SCSS mixins, documentation, sync script and reusable structure.
- Reorganised SCSS into dedicated components to improve maintenance, Moodle theme overrides and reuse in other plugins.

### 2026-06-15

- Migrated EasyStud refinements to Moodle 5.1.
- Improved multi-selection and contextual action handling.
- Added and refined move/delete actions for participants, groups and groupings.
- Added dynamic Ajax behaviour for several actions to reduce full page reloads.
- Improved toast notifications and user feedback messages.
- Adjusted cards, action buttons, filters and empty states visually.

### 2026-06-14

- Created the EasyEdu/EasyStud refactor branch and prepared the dedicated Git workflow, separate from the historical plugin version.
- Added the initial EasyStud simplified management view on Moodle 4.5.
- Added the first interactive interface for participants, groups and groupings.
- Added initial drag-and-drop, group/grouping creation, CSV import and Moodle native view navigation actions.
- Started the Moodle 5.1 migration and prepared the development branch.
- Improved the visual clarity of the EasyStud interface.

## Historical Versions

### 2026-02-13

- Updated README content and release information.
- Changed the declared maturity from beta to stable for the historical plugin version.

### 2026-02-12

- Fixed empty `{}` placeholders in import messages.

### 2026-02-10

- Minor code cleanup.

### 2026-01-07

- Fixed CodeChecker issues.
- Initial commit of the historical Group Import CSV plugin.
