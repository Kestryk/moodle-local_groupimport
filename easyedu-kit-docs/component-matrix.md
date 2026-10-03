# EasyEdu Component Extraction Matrix

Modal footers: regular Destination/entity and compact native Message share
right-aligned, wrapping `foundation-dialog-actions` with matched paired
geometry. Four Foundation Standard/Library pairs and eleven EasyStud hosts
have recorded readbacks and a scoped local preview proof; human acceptance
is deferred. Explicit neutral/Danger confirmation and identity-surface
extractions are subsequent source candidates, not covered by that older run.

Modal opt-ins: `easyedu-modal-layer` (fixed-root ordering above navigation) and
`easyedu-lookup-dialog` (neutral identifier lookup composition). Consumers own
focus, lookup data and Motion; paired Penpot/runtime evidence stays separate.
Neutral lookup Desktop/Narrow now has paired 09.2/09.2.1 linked specimens;
EasyStud owns the longer helper and wrapping result tokens. This is not
whole-dialog state coverage or human acceptance.

This matrix tracks the full EasyStud visual language and its migration into the
portable EasyEdu kit.

Status values:

- `done`: reusable kit API exists and is documented.
- `partial`: foundation exists, but EasyStud refinements still need extraction.
- `todo`: not yet extracted from EasyStud.

| Family | EasyStud sources | Kit target | Status | Notes |
| --- | --- | --- | --- | --- |
| Tokens | `scss/abstracts/_tokens.scss`, `scss/easyedu/_tokens.scss` | `scss/easyedu/_tokens.scss`, `docs/tokens.md` | partial | Focus geometry and semantic colours are public under `EED-UI-2026-0002`; guide, tables, drag/drop and responsive still need additional non-focus tokens. |
| Focus-visible | Shared interactive component families | `components/_focus.scss`, `docs/components/focus.md` | partial | One `0.18rem` geometry, semantic colours, base-shadow composition and forced-colors outline are implemented. `contained-context-ring` keeps non-interactive identity-rail/dense-card context inside its boundary while the real child control keeps the outer ring; Moodle 5.1 consumer browser parity remains. |
| Typography | EasyStud management headings, cards, forms and modals | `components/_typography.scss`, `docs/components/typography.md` | done | One inherited Moodle font family, a short size scale and four weights; authored plugin content remains outside this contract. |
| Animations | `scss/utilities/_animations.scss` | `scss/easyedu/components/_animations.scss` | partial | Modal, slide, pop-in, card/content reveal, pagination swap, success, drag/drop and busy keyframes/mixins exist. Persistent track changes use one 320ms layout-disclosure transition instead of stacking a swap animation over geometry; exact remaining per-component timing audit remains. |
| Loading/skeletons | `scss/components/_layout.scss`, `scss/views/_mass-import.scss`, `scss/views/_admin-settings.scss` | `components/_loading.scss`, `docs/components/loading.md` | partial | K3.1 separates static inline-start internal cards from static block-start structural left/right containers. Direct/overlay shimmer, bounded cue rhythm and opacity handoff remain public; consumer geometry, readiness and fail-open timing remain plugin-owned. |
| Navigation Skeleton | All EasyEdu views with real navigation | `components/_navigation-skeleton.scss`, `docs/components/navigation-skeleton.md`, `docs/components/skeleton-coverage.md` | partial | K3.1 makes a compact static one-line frame, decorative Guide-start circle and one internal cue canonical. RTL, reduced-motion and forced-colors safeguards are Kit-owned; markup, lifecycle and consumer validation remain separately owned. |
| Panels/layout | `scss/components/_layout.scss`, `scss/views/_mass-import.scss` | `components/_panels.scss`, `docs/components/panels.md` | partial | Panel/header/actions/split, sticky selection and semantic accent rail primitives exist; plugin-specific panel height orchestration remains. |
| Cards | `scss/components/_participants.scss`, `_structure.scss` | `components/_cards.scss`, `docs/components/cards.md` | partial | Base, rail, selected, expanded, drag-handle, reveal-toggle, preview fade lists, related-tag summaries, density transition, contained focus context, open identity rail, shared identity/member typography and source-preserving related-person row/removal recipes exist. Foundation/native member density is still unresolved; domain-specific card body layouts remain plugin-owned. |
| Buttons/actions | `_layout.scss`, `_structure.scss`, `_forms.scss` | `components/_buttons.scss`, `docs/components/buttons.md` | partial | Icon/action/close/overflow triggers include size, state, balanced admin primary nav, responsive guide-hiding and admin secondary actions. `action-content` plus public `easyedu-action-with-icon` provide one fixed icon slot and token gap even when Moodle owns the button skin; plugin-specific toolbar orchestration remains. |
| Forms/filters | `_forms.scss`, `_structure.scss` | `components/_forms.scss`, `components/_text-fields.scss`, `components/_textareas.scss`, `docs/components/forms.md` | partial | Native Text-field and Textarea S/M/L recipes map their eighteen Foundations masters (six states each), sharing internal field paint without sharing geometry; native consumer/human proof remains separate. Search, segmented toggle, regular/compact segmented single choice, subtly animated selection checkbox, inline reveal panel, more filters, filepicker, colour picker, native select and compact/admin multiselect primitives exist. Textarea consumers preserve rows/resizing and require panel reflow. M/L selected-file states expose type and removal; single/multiple limits and token detection remain consumer-owned. |
| Dropdowns/menus | `_forms.scss`, `_interaction.scss`, `_structure.scss` | `components/_menus.scss`, `docs/components/dropdowns.md` | partial | Menu/context/overflow surfaces include size variants and documented states; responsive long-press positioning remains plugin-owned. |
| Tooltips | `scss/components/_tooltips.scss` | `components/_tooltips.scss`, `docs/components/tooltips.md` | partial | Hover bubble, help icon and EasyStud-style custom popover surfaces exist; trigger timing remains plugin-owned. |
| Modals | `_modals.scss`, `_settings-modal.scss`, `_tutorial.scss` | `components/_modals.scss`, `_dialog-classes.scss`, `docs/components/modals.md` | partial | Surface/header/icon/section/confirm/settings/detail, opt-in entity chrome and right-aligned matched native actions, shared metadata-disclosure focus, contextual semantic chrome, native-modal runtime animation and history-list primitives exist; plugin-specific body layouts remain. |
| Tables/import | `scss/views/_mass-import.scss` | `components/_tables.scss`, `docs/components/tables.md` | partial | Data/preview/status rows, semantic and sticky table surfaces, report summaries, toolbars and additive draggable object-row cell states, including an opt-in affordance, exist; selection, ordering and overflow remain plugin-owned. |
| Course Banner Builder preview editors | `local/course_banner_builder/scss/components/*` | `components/_course_banner_builder.scss`, `docs/examples/course-banner-builder.md` | partial | Wide preview modals, shared one-rem inline rhythm, preview surfaces, side disclosures, format choices, equal-height slideshow cards with content-sized sections and anchored actions, layer tables, source-chain controls, colour fields, linked range/number controls and help icons now have reusable primitives. JS interaction contracts and action-rail dimensions remain plugin-owned. |
| Badges/tokens | `_structure.scss`, `_participants.scss`, `_settings-modal.scss` | `components/_feedback.scss`, `docs/components/badges.md` | partial | Token, identity badge, count, filled count and overflow toggles exist; plugin-specific colours remain. |
| Empty states | `_structure.scss`, `_participants.scss`, `_mass-import.scss` | `components/_feedback.scss`, `docs/components/empty-states.md` | partial | Base, inline and search variants exist; table-specific copy remains. |
| Drag/drop | `_interaction.scss`, `_structure.scss`, `_tutorial.scss` | `components/_overlays.scss`, `components/_tables.scss`, `docs/components/drag-drop.md` | partial | Drop overlay, insert drop target, fixed previews and source placeholders remain available; native table rows use non-destructive object-row cell states while JS drag behaviour remains plugin-owned. |
| Guide | `_tutorial.scss`, `amd/src/course_manager.js` | `components/_guide.scss`, `guide/`, `docs/components/guide.md`, `docs/components/guide-adapter-integration.md` | partial | `EED-UI-2026-0003` provides the responsive/focus lifecycle; `EED-UI-2026-0004` adds atomic source synchronization, `init`/`destroy` AMD packaging, adapter ownership and the cross-product acceptance matrix. Consumer parity and browser approval remain gated. |
| Navigation | `templates/manage.mustache`, `amd/src/course_manager.js`, `scss/responsive/_desktop.scss` | `components/_navigation.scss`, `navigation/`, `docs/components/navigation.md` | partial | The vendorable source contract includes one normalized context, shared item partial, separate desktop/compact wrappers, accessible panel controller and an optional Guide launcher/body-portal bridge. EasyStud and CCB reconnection plus browser parity remain consumer-owned batches. |
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
8. Adapt the stable Navigation source contract in each approved consumer batch,
   then validate visual, keyboard and accessibility parity before any
   cross-product promotion decision.

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
