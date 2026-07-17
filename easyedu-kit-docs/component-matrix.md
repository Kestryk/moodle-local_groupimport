# EasyEdu Component Extraction Matrix

This matrix tracks the full EasyStud visual language and its migration into the
portable EasyEdu kit.

Status values:

- `done`: reusable kit API exists and is documented.
- `partial`: foundation exists, but EasyStud refinements still need extraction.
- `todo`: not yet extracted from EasyStud.

| Family | EasyStud sources | Kit target | Status | Notes |
| --- | --- | --- | --- | --- |
| Tokens | `scss/abstracts/_tokens.scss`, `scss/easyedu/_tokens.scss` | `scss/easyedu/_tokens.scss`, `docs/tokens.md` | partial | Need more semantic tokens for guide, tables, drag/drop and responsive. |
| Typography | EasyStud management headings, cards, forms and modals | `components/_typography.scss`, `docs/components/typography.md` | done | One inherited Moodle font family, a short size scale and four weights; authored plugin content remains outside this contract. |
| Animations | `scss/utilities/_animations.scss` | `scss/easyedu/components/_animations.scss` | partial | Modal, slide, pop-in, card/content reveal, pagination swap, success, drag/drop and busy keyframes/mixins exist; exact per-component timing audit remains. |
| Panels/layout | `scss/components/_layout.scss`, `scss/views/_mass-import.scss` | `components/_panels.scss`, `docs/components/panels.md` | partial | Panel/header/actions/split, sticky selection and semantic accent rail primitives exist; plugin-specific panel height orchestration remains. |
| Cards | `scss/components/_participants.scss`, `_structure.scss` | `components/_cards.scss`, `docs/components/cards.md` | partial | Base, rail, selected, expanded, drag-handle, reveal-toggle, preview fade lists, related-tag summaries, density transition and open identity rail primitives exist; domain-specific card layouts remain plugin-owned. |
| Buttons/actions | `_layout.scss`, `_structure.scss`, `_forms.scss` | `components/_buttons.scss`, `docs/components/buttons.md` | partial | Icon/action/close/overflow triggers now include size, state, balanced admin primary nav and admin secondary action primitives; plugin-specific toolbar orchestration remains. |
| Forms/filters | `_forms.scss`, `_structure.scss` | `components/_forms.scss`, `docs/components/forms.md` | partial | Search, segmented toggle, regular/compact segmented single choice, toggle check, selection checkbox, inline reveal panel, more filters, filepicker, colour picker, native select and compact/admin multiselect primitives exist; token detection behaviour remains plugin-owned. |
| Dropdowns/menus | `_forms.scss`, `_interaction.scss`, `_structure.scss` | `components/_menus.scss`, `docs/components/dropdowns.md` | partial | Menu/context/overflow surfaces include size variants and documented states; responsive long-press positioning remains plugin-owned. |
| Tooltips | `scss/components/_tooltips.scss` | `components/_tooltips.scss`, `docs/components/tooltips.md` | partial | Hover bubble, help icon and EasyStud-style custom popover surfaces exist; trigger timing remains plugin-owned. |
| Modals | `_modals.scss`, `_settings-modal.scss`, `_tutorial.scss` | `components/_modals.scss`, `docs/components/modals.md` | partial | Surface/header/icon/section/confirm/settings/detail, contextual semantic chrome, native-modal runtime animation and history-list primitives exist; plugin-specific body layouts remain. |
| Tables/import | `scss/views/_mass-import.scss` | `components/_tables.scss`, `docs/components/tables.md` | partial | Data/preview/status rows, semantic and sticky table surfaces, report summaries, notices and toolbars exist; selectable preview controls remain plugin-owned. |
| Course Banner Builder preview editors | `local/course_banner_builder/scss/components/*` | `components/_course_banner_builder.scss`, `docs/examples/course-banner-builder.md` | partial | Wide preview modals, shared one-rem inline rhythm, preview surfaces, side disclosures, format choices, equal-height slideshow cards with content-sized sections and anchored actions, layer tables, source-chain controls, colour fields, linked range/number controls and help icons now have reusable primitives. JS interaction contracts and action-rail dimensions remain plugin-owned. |
| Badges/tokens | `_structure.scss`, `_participants.scss`, `_settings-modal.scss` | `components/_feedback.scss`, `docs/components/badges.md` | partial | Token, identity badge, count, filled count and overflow toggles exist; plugin-specific colours remain. |
| Empty states | `_structure.scss`, `_participants.scss`, `_mass-import.scss` | `components/_feedback.scss`, `docs/components/empty-states.md` | partial | Base, inline and search variants exist; table-specific copy remains. |
| Drag/drop | `_interaction.scss`, `_structure.scss`, `_tutorial.scss` | `components/_overlays.scss`, `docs/components/drag-drop.md` | partial | Drop overlay, insert drop target, modal file-drop state, file overlay, fixed drag preview, captured preview, stack preview, source placeholder, count badge and disabled zones exist; JS drag ghost behaviour remains plugin-owned. |
| Guide | `_tutorial.scss`, `amd/src/course_manager.js` | `components/_guide.scss`, `guide/`, `docs/components/guide.md` | partial | Base, rich nav, show-in-interface buttons, guided panel feedback, completion message, minimised state, docking, public highlight refresh event and EasyStud-derived learning scenes exist; plugin-specific slide copy, target keys and event completion remain. |
| Responsive | `scss/responsive/_mobile.scss`, `_desktop.scss` | `components/_responsive.scss`, `docs/components/responsive.md` | partial | Stack/action tray surface, summary/buttons, stacked narrow tray, cards/guide hooks and pagination layout helpers exist; filter orchestration remains plugin-owned. |
| Orchestration | `amd/src/course_manager.js` | `docs/components/orchestration.md` | done | Behavioural contract exists for dynamic views, filters, pagination, Ajax mutations, responsive action trays and guided highlight refresh hooks. |

## Next extraction lots

1. Documentation skeleton and manifest.
2. Core component API: buttons, tooltips, dropdowns, empty states, badges.
3. Cards and panels: identity rails, expanded states, action bars.
4. Modals and tables/import.
5. Apply the new motion/modal primitives back to EasyStud selectors where doing so does not change behaviour.
6. Audit remaining settings/detail modal internals: filepicker, metadata lists, field help icons and image previews.
7. Audit responsive filter orchestration and plugin-specific list state transitions against the documented orchestration contract.

## Audit Pass Notes

### Guide

The guide is the highest-risk cross-plugin component. The kit contract now
documents the full distinction between:

- `target`: the real action/completion target;
- `highlightTarget`: the visual area to show the user;
- temporary show-in-interface highlights;
- persistent guided checklist highlights.

Plugins should no longer implement local selector/highlight logic. If a target
can be empty, such as a configured-source table before setup, the plugin must
expose a stable wrapper around the relevant controls and use that wrapper as the
visual highlight target.

The historical EasyStud learning scenes have also been converted into generic
guide primitives. Reusable scenes should now be implemented as data-driven kit
blocks (`visualassignment`, `visualdragdrop`, `visualpaste`,
`visualcontextmenu`, `visualactionflow`, `visualformula`, `visualsteps`,
`visualkeys` and related card/detail variants) rather than copied as
plugin-prefixed HTML. These scenes intentionally favour a shared visual canvas,
small semantic accents and explanatory motion over nested bordered cards.

### Reusable UI Components

The following component families now have import audit checklists in their
component documentation:

- buttons and compact action triggers;
- dropdowns, context menus and overflow menus;
- tooltips and help icons;
- forms, filters, multiselects, file pickers and detected-token inputs;
- modals, Moodle native modal bridges and metadata lists;
- object cards, identity rails, related tags and open container rails.

These checklists should be read before moving UI between EasyStud,
Course Banner Builder or a future EasyEdu plugin. If a plugin still needs a
local override after following the checklist, document why the override is
plugin-specific instead of reusable kit behaviour.

### EasyStud Inverse Audit

The EasyStud / GroupImport UI has been reviewed from the plugin back into the
kit to identify reusable patterns that were still too local.

Newly extracted into the kit:

- `selection-checkbox` for selectable cards, nested members and list rows.
- `inline-reveal-panel` for card-contained search, paste and add-by-text panels.
- `identity-badge` for a single high-priority card title-line label.
- `preview-fade-list` for collapsed child lists with a smoked fade and smooth
  expansion.

Already covered by kit primitives:

- object cards, identity rails and opened container rails;
- related tag summaries and revealed tag rows;
- card reveal toggles and density transitions;
- compact action menus, overflow triggers and context menus;
- drop overlays, drag previews, disabled zones and busy indicators;
- modal shells, settings/detail sections, metadata lists and file drop states;
- guide modal, guided checklist, return panel and viewport-anchored highlights.

Still intentionally plugin-owned:

- Moodle capability checks and action availability;
- exact data attributes and Ajax payloads;
- drag/drop compatibility rules;
- pagination, filter data and result counting;
- guide slide wording, target keys and course-specific examples;
- business decisions about when a card opens, collapses or selects related
  objects.
