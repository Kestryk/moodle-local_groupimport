# EasyStud / GroupImport Mapping

This note records how the EasyStud / GroupImport interface maps to reusable
EasyEdu UI kit primitives. Use it as a reference when porting the visual system
to another Moodle plugin.

## Runtime Management View

| EasyStud area | Kit primitives | Plugin-owned behaviour |
| --- | --- | --- |
| Participant cards | `object-card`, `identity-rail`, `selectable-card`, `selection-checkbox`, `identity-badge`, `density-transition` | Which participant fields are shown, single-selection expansion, Moodle profile links and role/group data. |
| Group cards | `object-card`, `identity-rail`, `selectable-card`, `preview-fade-list`, `card-reveal-toggle`, `related-tags-summary`, `inline-reveal-panel` | Member assignment, text identifier parsing, group image/settings actions and membership search. |
| Grouping cards | `object-card`, `open-identity-rail-base`, `open-identity-rail-state`, `preview-fade-list`, `inline-reveal-panel` | Which groups belong to a grouping and whether moving is additive or replacing. |
| Groups without grouping container | panel primitives, empty-state primitives, search-field primitives | Whether the container is initially collapsed and which groups are listed. |
| Column filters | `search-field`, `more-filters`, `toggle-check`, `multi-select-list(small)`, `native-select` | Filter data sources, result counts and column-specific sort modes. |
| Action bars | action buttons, compact overflow menus, sticky selection panel | Permissions, selected object type, responsive hiding and action availability. |
| Drag/drop | drop overlays, insert drop target, fixed drag preview, source placeholder, disabled zones | Compatibility rules, Ajax mutation, destination choices and Moodle confirmation logic. |
| Guided help | guide modal, navigation cards, guided panel, return panel, viewport highlight | Slide content, target keys, guided path completion rules and course-specific examples. |

## Admin And Import Views

| EasyStud area | Kit primitives | Plugin-owned behaviour |
| --- | --- | --- |
| Admin identifier settings | settings/admin panel, colour picker, multi-select list, help icon | Available Moodle user profile fields and plugin config storage. |
| Mass import upload | filepicker, file drop overlay, import panels, preview toolbar | CSV/XLSX parsing, detection rules and import execution. |
| Preview tables and reports | data table, report summary, status row, selectable preview controls | Row validation, conflict detection and import history. |
| Object settings modals | settings modal shell, metadata sections, metadata scroll lists, filepicker | Moodle group/grouping fields, file storage and export actions. |

## Extraction Boundary

Move style, sizing, states and reusable interaction surfaces into the kit.
Keep Moodle data rules, capabilities, AJAX endpoints and business decisions in
the plugin.

If a plugin needs local CSS after using the mapped primitive, document whether
the reason is:

- `domain layout`: the card body has plugin-specific information density;
- `business state`: the visual state depends on Moodle permissions or data;
- `temporary gap`: the kit primitive should be expanded in a future release.

## Motion integration reference

EasyStud vendors `motion/amd/src/easyedu_motion.js` as
`local_groupimport/motion` and exposes the administrator policy on the manager
root before JavaScript starts.

- Participant compact/detail uses `Motion.resize` on the selected card only.
- Group member lists use measured `resize` and leave grouping ancestors at
  natural height.
- Search and identifier panels use distance-aware `expand` / `collapse`, then
  focus their field only after the returned promise completes.
- Participants / complete / groups-and-groupings view changes use one atomic
  `swap` with `exit: false` and `resize: false`.
- Pagination and sorting use fade-only `swap` with both distances set to zero.
- Selection changes update selection controls without rebuilding every page.

The reference browser regression suite is
`tools/playwright/motion-audit.spec.js` in the GroupImport plugin. It covers
intermediate card height, repeated disclosures, reduced motion, compact panels,
atomic view changes and pagination width stability.
