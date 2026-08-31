# EasyEdu Component Contract

This document defines reusable component contracts that agents must preserve
when moving UI from one plugin to another.

## Inverse visual audit

When a consuming plugin has a more complete visual result than the kit, audit
the rendered plugin and promote the reusable finish into the canonical kit
before copying it to another plugin.

Must:

- compare computed backgrounds, borders, radii, spacing and states;
- preserve plugin-owned ids, `data-*`, DOM order and interaction classes;
- use `context-modal-surface` plus a semantic variant for shared modal chrome;
- use `semantic-accent-panel` for reusable coloured rails;
- use `semantic-table-surface` or `sticky-data-table` without changing columns
  or overflow ownership;
- validate the source plugin still renders equivalently after extraction.

Must not:

- approximate an EasyStud gradient or rail with a new local value;
- move crop, resize, drag/drop or sticky-preview behaviour into visual mixins;
- hide action menus by applying unreviewed clipping to their parent surface.

For guide visual parity, also use `ai/GUIDE_PARITY_CHECKLIST.md`. That checklist
is mandatory when a guide implementation is compared with EasyStud, Course
Banner Builder or another plugin using the same guide kit.

## Administration typography

Must:

- inherit the active Moodle theme font through `--easyedu-font-family-ui`;
- use the shared typography roles for page, modal, panel, section, card,
  control, body, caption and eyebrow text;
- use `type-page-identity` for plugin view identity headings; it is an alias of
  `type-page-title` and does not introduce a local scale;
- use only the shared regular, medium, semibold and strong weights for reusable
  administration chrome;
- preserve plugin-owned wrapping, truncation and responsive layout rules.
- use `type-caption` for compact operational explanations and native setting
  descriptions when they accompany controls; reserve `type-body` for ordinary
  explanatory copy that is intentionally more prominent.
- use the shared mobile entity-switcher, context-sheet, card-menu and touch
  target contracts before adding plugin-local responsive surfaces;
- keep all primary navigation destinations reachable in the compact rail and
  reuse an existing card action trigger instead of injecting a duplicate;

Must not:

- introduce plugin-local title scales when a shared role exists;
- use negative or decorative letter spacing;
- apply administration roles to user-configurable banner, slideshow or authored
  preview content.

## Balanced administration navigation

Must:

- keep the guide wrapper as the first direct child of the navigation rail;
- use `.easyedu-admin-primary-nav--balanced` when menu actions must be centred
  independently of the guide;
- wrap those actions in `.easyedu-admin-primary-nav__actions`;
- retain a start-aligned horizontal scroller on narrow screens.

Must not:

- centre the guide with the menu actions;
- add empty balancing markup or plugin-local left/right offsets;
- allow translated action labels to wrap onto a second line.

## Shared desktop and responsive navigation

Canonical files:

- `scss/easyedu/components/_navigation.scss`;
- `navigation/`;
- `docs/components/navigation.md`.

Must:

- prepare one ordered, permission-resolved `sections/items` context in PHP;
- render desktop and compact wrappers through the same item partial;
- keep stable item IDs, URLs, labels, icons, hierarchy and current state;
- synchronize `aria-expanded`, `aria-hidden`, `hidden`, `inert` and focus;
- keep the compact trigger fixed at the logical inline edge and near the visual
  viewport centre; do not re-position it from scroll-sensitive Moodle or
  participant geometry. A documented phone breakpoint may use the smallest
  stable offset required to clear a centred native control;
- use logical properties, RTL behavior, reduced motion and forced colors;
- keep releases, deployments and human visual approval separate from code
  completion.

Must not:

- parse or clone desktop navigation HTML into the compact panel;
- maintain independent desktop and responsive destination arrays;
- move product-specific guide launchers or business actions in the generic
  controller;
- mark the provisional component mandatory before consumer comparison and
  human approval.

## Shared keyboard focus

Canonical files:

- `scss/easyedu/components/_focus.scss`;
- `scss/easyedu/_tokens.scss`;
- `docs/components/focus.md`.

Must:

- use `focus.ring(...)` for shared keyboard-focus paint;
- keep the public `0.18rem` geometry consistent across component families;
- retain the component radius and paint around the complete interactive target;
- use semantic colour variants without changing thickness;
- pass elevation or active shadows through `$base-shadow` so the focus ring
  remains outermost;
- reserve the ring width inside containers that clip or scroll;
- retain the transparent outline used by forced-colors mode.

Must not:

- define component-local focus widths;
- use hover-only shadows as the only focus indicator;
- clip a focusable child against an `overflow: hidden` edge;
- remove the outline and ring together.

## Segmented single choice

Must:

- use a native `fieldset`, `legend` and radios sharing one `name`;
- use the contained structure with an accessible `__legend`, visible internal
  `__label` and bordered `__body`;
- keep each radio immediately before its visual surface;
- allow the legend and option descriptions to wrap without clipping;
- use the regular density for explanatory strategies and `compact` only in
  dense settings/filter surfaces;
- preserve checked, hover, focus-visible and disabled semantics.

Must not:

- replace radios with non-semantic clickable cards;
- expose the native legend visually over the component border or force
  translated titles to one line;
- use this component for multi-select or binary on/off controls.

## Slideshow administration surfaces

Must:

- combine `slideshow-admin-grid`, `slideshow-card-layout` and
  `slideshow-card-body-layout` when Course/Site or equivalent context cards
  must share one height;
- use `slideshow-settings-grid` so each Content/Controls section stops at its
  real content height;
- use `slideshow-action-zone` to align editor and reset actions without fixed
  card heights;
- preserve checked, unchecked, focus and disabled semantics through
  `slideshow-toggle-row`;
- pass one stable semantic accent through the complete card;
- preserve plugin-owned input names, values, ids, modal targets and event
  handlers.

Must not:

- stretch tinted settings sections only to align sibling card footers;
- use fixed content heights to equalise context cards;
- reference private or undefined visual tokens when a public `--easyedu-*`
  token exists;
- move activation, persistence or preview behaviour into the visual mixins.

## Guide: show in interface selector

Canonical files:

- `guide/amd/src/easyedu_guide.js`
- `guide/templates/easyedu_guide.mustache`
- `scss/easyedu/components/_guide.scss`
- `docs/components/guide.md`

Must:

- resolve targets by configured target key or CSS selector;
- close the guide modal while preserving the highlight;
- scroll the target into view;
- use a `position: fixed` viewport-anchored highlight;
- keep the highlight aligned during scroll and resize;
- refresh after Bootstrap modal open/close, CSS transitions, animations, DOM
  mutations and `easyedu:guide-refresh-highlight`;
- dock guided checklists away from the highlighted target;
- show the sticky return-to-guide panel;
- clear the highlight when the return panel is dismissed;
- clear the highlight automatically when the temporary return panel auto-hides;
- allow return to the guide without losing context;
- add the stable `is-easyedu-guide-highlight-target` class to the highlighted
  target while active.

Must not:

- implement plugin-local absolute-position selectors;
- let the outline drift during scroll;
- depend on one static measurement after the click;
- use native `title` tooltips for guide actions;
- replace the kit selector with a local style that only approximates it.

Show-in-interface highlights are temporary. Guided checklist highlights are
temporary too, but only the highlight disappears: the checklist panel remains
visible so the user can continue the guided path without the selector staying on
screen indefinitely.

The highlight controller must keep one active target, one auto-hide timer and
one requestAnimationFrame refresh loop. It must not use competing hard timers,
persistent suppressed states, or an unbounded document-wide MutationObserver.
Use the shared `highlightStyle` option for visual variants such as
`pulse-blue`; never fork the lifecycle code just to change the look.

## Guide: responsive shell, focus and teardown

Must:

- keep ancestors of the fixed guide modal free of `transform`, `filter`,
  `perspective`, `contain: paint` or equivalent containing-block rules;
- keep launcher wrappers from creating a stacking context above Moodle-native
  dropdowns;
- trap focus inside the open dialog and restore the opener on normal close;
- lock page scrolling while any guide modal is open;
- focus a visible interface target when `Show in the interface` is used;
- reverse horizontal keyboard and rail movement in RTL;
- use safe-area insets and a bounded `vh`/`dvh` bottom-sheet layout on narrow
  or short viewports;
- keep guided-panel header and actions reachable while only the step region
  owns constrained-height scrolling;
- ignore hidden or detached targets and clear an active highlight when its
  target leaves the interface;
- observe only the active target's local subtree;
- expose and call `destroy()` before a guide root is replaced or removed;
- remove tracked listeners, observers, frames, timers, owned highlights and
  page-scroll locks during teardown;
- retain understandable boundaries in forced-colours mode and immediate state
  changes under reduced motion.

Must not:

- centre or animate a launcher by transforming a root that also contains the
  fixed modal;
- leave focus inside hidden dialog content or restore it when the workflow
  deliberately focuses an interface target;
- use fixed reusable title IDs that collide when multiple guide roots render;
- allow the whole guided panel or page to become a second scroll owner;
- keep geometry for a hidden, zero-sized or detached target;
- observe the complete document subtree for one active highlight;
- erase persisted visitor progress during lifecycle teardown.

## Guide: consumer adapter and packaging

Canonical handoff:

- `docs/components/guide-adapter-integration.md`;
- `docs/examples/guide-adapter-config.md`.

Must:

- synchronize the controller, Mustache and guide SCSS as one reviewed source
  set;
- compare canonical, embedded and runtime copies before writing;
- preserve product-owned selectors, routes, content, localization, permissions
  and completion predicates;
- preserve the consumer's approved Moodle AMD build model and module namespace;
- expose both `init` and `destroy` from direct AMD wrappers;
- remove both named `export` keywords and `export default init` when converting
  the canonical ES module into an existing direct `define()` wrapper;
- rebuild generated AMD and CSS artifacts with the consumer toolchain;
- record the canonical source state, exact runtime version and deferred
  compatibility coverage.

Must not:

- synchronize only JavaScript, template or SCSS when their contracts changed
  together;
- hand-edit minified AMD or compiled CSS;
- copy EasyStud configuration into CCB or CCB configuration into EasyStud;
- treat visual slide locking as Moodle permission enforcement;
- call `init` on replaced markup without destroying the old guide root;
- claim consumer or cross-version parity from static build success.

## Guide: action target versus visual target

Some guided checklist steps must wait for a real action target while visually
highlighting a more helpful parent area. For example, a "select source" step may
complete when the submit button is clicked, but the user should see the source
dropdown wrapper rather than an empty configured-source table.

Must:

- support `highlightTarget` on checklist steps;
- support `targetselector` on slide-level show-in-interface buttons when the
  concrete selector is known server-side;
- resolve `highlightTarget` by configured target key or CSS selector;
- keep `target` as the real action/completion target;
- highlight `highlightTarget` when it is provided, otherwise fall back to
  `showTarget`, then `target`;
- highlight the first available checklist step immediately when a guided path
  starts;
- keep the highlight layer above Moodle modal content and below the guided
  checklist;
- target stable controls such as dropdown wrappers, creation rows or buttons
  instead of empty result tables.

Must not:

- point onboarding steps to empty tables when the course/plugin has no data yet;
- point source-selection steps to Moodle navigation just because the label is
  similar;
- duplicate both old and new selectors for the same step.

## Guide: locked slides and unlock paths

Must:

- allow slides to declare `requires`;
- add `is-locked` to unavailable navigation cards;
- keep locked navigation cards clickable so the user can read why they are
  locked;
- skip locked slides in next/previous and keyboard navigation;
- use short one-word badges such as `Locked`;
- display long explanations in `.easyedu-guide-slide__locked`;
- support `requirestitle`, `requirescontent`, `unlockpath` and `unlocklabel`;
- render unlock paths with the alternate unlock checklist style;
- keep unlock paths separate from normal practice paths.

Must not:

- use long requirement text inside navigation badges;
- use a pointer cursor on locked navigation cards because they remain clickable
  to explain how to unlock the slide;
- share the same path name for a normal guided path and an unlock path.

## Guide: learning visuals and guided-path slides

Must:

- use kit-owned visual blocks for reusable guide illustrations;
- use the kit scene catalogue for learning slides: `visualcards`,
  `visualcarddetail`, `visualassignment`, `visualfiltersdemo`,
  `visualpaste`, `visualcontextmenu`, `visualactionflow`,
  `visualdragdrop`, `visualformula`, `visualsteps` and `visualkeys`;
- use `.easyedu-guide-guided-card` for slides that launch a guided path;
- keep the guided path explanation, step preview and start button in the same
  card so the action does not feel detached from the slide content;
- add any new cross-plugin animation or visual pattern to the kit before using
  it in a plugin.
- provide responsive and reduced-motion states for every animated scene.

Must not:

- copy EasyStud-only visual class names into another plugin;
- create local guide animation keyframes when a kit animation exists;
- leave guided-path slides as plain text plus an isolated button.

## Runtime motion

Canonical sources:

- `motion/amd/src/easyedu_motion.js`
- `motion/README.md`
- `docs/components/animations.md`

Must:

- vendor and namespace the canonical controller instead of creating a second
  plugin-specific motion engine;
- expose `data-easyedu-motion-policy` in server-rendered markup;
- let `prefers-reduced-motion` override the administrator policy;
- use distance-aware disclosures for short search and paste panels;
- use one atomic `swap` for full-view changes;
- use fade-only swaps with zero translation and no height interpolation for
  pagination inside scrollable columns;
- await disclosure completion before focusing a field;
- cancel completed Web Animation fill effects after cleanup;
- batch DOM reads before writes and recalculate pagination only once per action;
- test repeated open/close/open cycles and widths during pagination.
- keep the bottom-end busy spinner's `::after` on the single
  `easyedu-busy-spin` transform animation; put label pulsing on `::before` so
  competing transforms cannot freeze the visible rotation.

Must not:

- combine controller-owned height motion with CSS `max-height` transitions;
- animate a disclosure and each auto-sized ancestor simultaneously;
- translate a scrollable pagination list;
- rebuild every sorted/paginated list for a checkbox-only state change;
- use timeout chains to repair stale heights after an animation.

## Guide: checklist persistence

Must:

- support `requiresStep` dependencies between checklist steps;
- support `requiresStepLabel`;
- show a disabled/locked visual state for blocked checklist steps with
  `data-easyedu-guide-lock-message`;
- use the same subtle striped locked visual language for blocked checklist
  steps and locked navigation cards;
- show the required step title inside the blocked-step overlay so the user sees
  exactly which checklist step unlocks the current one;
- support `completeOnClick` for actions that reload the page;
- require every checklist step to declare its completion ownership with
  `completionMode` when it represents a real action;
- keep `action`, `event` and `reload` steps pending when their checklist row
  is clicked;
- support `waitForCompletion` only as a compatibility alias while migrating
  older plugin configurations;
- complete event-owned steps through `easyedu:guide-step-complete` after the
  underlying operation succeeds;
- match `completeOnClick` targets from the clicked element with
  `closest(selector)` so repeated controls such as dropdown options all work;
- persist active path, active step, completed steps and active slide;
- restore the checklist after reload;
- clear checklist progress, highlights and return panels when the checklist is
  closed or when the main guide is opened normally;
- when minimized, display the pending active step and visited counter.

Must not:

- mark `completeOnClick` steps complete when the user only clicks the checklist;
- mark action, event or reload steps complete from the checklist click;
- resolve only the first matching `completeOnClick` target with `querySelector`;
- lose the guide context after a real page reload;
- show only a generic title in the minimized checklist.
- close or hide the checklist when a guided highlight auto-hides.

## Compact action menus

Canonical files:

- `scss/easyedu/components/_menus.scss`
- `docs/components/dropdowns.md`

Must:

- use the kit compact action trigger for overflow/action menus;
- use readable menu items with accessible focus states;
- avoid custom hover bubbles inside menus when the visible item label is enough;
- keep menus above neighbouring cards and panels.

Must not:

- use bare `...` buttons for action menus;
- create plugin-specific menu item spacing when a kit primitive exists;
- add native `title` to menu items that already have visible labels.

## Buttons and controls

Canonical files:

- `scss/easyedu/components/_buttons.scss`
- `docs/components/buttons.md`

Must:

- use button size and state primitives from the kit;
- keep icon alignment stable;
- support hover, active, focus-visible and disabled states;
- use Moodle-compatible button markup.

Must not:

- hard-code button heights or radii locally for reusable controls;
- use inconsistent icon-only hit areas;
- rely on text-only affordances where the kit defines an icon control.

## Cards and identity rails

Canonical files:

- `scss/easyedu/components/_cards.scss`
- `docs/components/cards.md`

Must:

- use `object-card`, `identity-rail` and `selectable-card` for manipulable
  objects;
- use `card-title-row`, `card-title-main` and `card-title-actions` for card
  headers that combine identity, metadata, counters and persistent actions;
- use `card-title(compact)` for dense participant/person cards,
  `card-title(regular)` for standard object cards and `card-title(container)`
  for expandable parent cards;
- use `card-disclosure-title`, `card-disclosure-icon` and
  `card-disclosure-expanded-icon` when a container title opens or closes its
  contents; pass the entity semantic colour to `card-disclosure-icon($color)`
  and apply rotation from the button's explicit `aria-expanded` state;
- use `card-selection-slot` with `selection-checkbox(..., card)` for selectable
  cards;
- reserve the complete overlay checkbox hit target plus a visible title gap,
  and align its visual square with the card title line;
- keep overlay selectors out of named grid areas so they cannot create an
  implicit row below a card title;
- let `pagination-select-button` own flex and text alignment even when a plugin
  applies a compact height;
- keep changing Select/Deselect wording in a stable direct child label `<span>`
  instead of replacing the pagination button structure;
- keep selection, page controls and sort tools on the same vertical centre;
- scope pagination label colours to their component instead of styling every
  descendant `<span>`;
- use `open-identity-rail-base` / `open-identity-rail-state` for opened
  container cards;
- use `preview-fade-list` with `card-reveal-toggle` for collapsed child lists
  such as members, groups inside a grouping, layers inside a folder, or similar
  nested content;
- use related-tag summary/detail primitives when related labels become too long
  for a single row;
- expose real selection controls in addition to visual selected states.

Must not:

- create a second left rail to fake an opened container state;
- create plugin-local card title font sizes, weights or disclosure chevrons
  when the shared title primitives cover the structure;
- allow title context, count badges or actions to compete for the same flexible
  width;
- show drag handles on objects that are not draggable in the current view;
- let related tags push badges or action buttons onto a new line.
- implement one-off gradients for collapsed child previews.

## Forms, filters and admin controls

Canonical files:

- `scss/easyedu/components/_forms.scss`
- `docs/components/forms.md`

Must:

- use compact form sizes in dense runtime filters and regular/large sizes in
  admin settings;
- use `selection-checkbox` for selectable cards, nested items and list rows;
- use the `card` checkbox variant for object cards and its `large` size on
  touch layouts; keep the real checkbox input and native indeterminate state;
- use `inline-reveal-panel` for card-contained search, paste, add-by-text or
  similar controls that expand inside a card;
- use `toggle-check` for binary filters inside EasyEdu filter boxes;
- use `multi-select-list(small)` for runtime filters and
  `multi-select-list(regular|large)` for settings/admin screens;
- keep focus rings on the full control wrapper;
- render `filter-disclosure-trigger` focus with the defined
  `--easyedu-control-focus-border` and `--easyedu-focus-ring` tokens.
- render filter disclosures, Sort captions and selected Sort values with the
  regular typography token; render result counts with the semibold token.

Must not:

- use admin-sized multiselects inside card/list filter panels;
- make allowed checkboxes look disabled because another nested card type owns
  the parent container;
- restyle checked card selectors by entity type outside the semantic
  `$checked-color` argument;
- replace native selects with custom lists unless keyboard and screen-reader
  behaviour is rebuilt deliberately;
- put long help text in labels when a help icon/tooltip is more appropriate.
- reuse a card reveal chevron as the trigger for a responsive filter panel.
- reference private or undefined focus variables from a reusable form mixin.
- add text underlining to overflow-action triggers or visible menu actions in
  hover, active or focus states; keep the focus ring as the focus indicator.
- replace an established desktop filter-disclosure wrapper globally when only
  its compact presentation needs to change; preserve the markup and scope the
  alternate styling to the responsive breakpoint.

Responsive plugin navigation may use `mobile-primary-nav-rail` or the
`mobile-primary-nav-trigger` / `mobile-primary-nav-panel` /
`mobile-primary-nav-backdrop` family. The off-canvas variant must preserve all
destinations, Escape, backdrop close and focus return without replacing native
Moodle course navigation.

## Badges, tokens and counters

Canonical files:

- `scss/easyedu/components/_feedback.scss`
- `docs/components/badges.md`

Must:

- use `identity-badge` for one high-priority title-line metadata badge;
- use count badge variants for numeric counts;
- use token overflow toggles for collapsed metadata lists.

Must not:

- use identity badges for numeric counters;
- let title-line metadata push primary actions out of the card header;
- rely on raw text for `+N` or collapse controls when a token style exists.

## Modals and metadata surfaces

Canonical files:

- `scss/easyedu/components/_modals.scss`
- `docs/components/modals.md`

Must:

- use `modal-runtime-animation` for custom and Moodle native modals;
- use `native-modal-loading` when a Moodle native modal resolves content
  asynchronously;
- use `settings-modal-dialog`, `metadata-section`, `metadata-scroll-list`,
  `metadata-item-chip` and `metadata-empty` for rich object detail/settings
  modals;
- use `settings-modal-filepicker` and `modal-file-drop-state` for image/file
  uploads.

Must not:

- leave raw `x` close controls;
- let a modal exceed the viewport because related lists are not collapsed into
  metadata sections;
- restyle file pickers independently in each plugin.
# Responsive compact-workspace contract

- Preserve semantic identity rails at their desktop width; reserve horizontal
  room around cards instead of shrinking the rail or clipping its icon.
- A mobile navigation panel must expose both plugin tools and the complete
  native Moodle destination set. Keep the guide launcher adjacent to, but
  outside, the panel trigger unless the product deliberately hides guide access
  in compact navigation with `admin-primary-nav-hide-guide-launcher`.
- Never defeat `[hidden]` with unconditional `display: block !important`.
- Reuse and normalise an existing card menu trigger; never render two triggers.
- Keep trigger normalisation idempotent and preserve an established semantic
  menu glyph; a MutationObserver must not recreate its own child markup.
- Style plugin tools and native Moodle destinations with the same mobile
  navigation-link primitive, grouped under explicit section headings.
- Clear desktop-only focus classes while an independent mobile entity view is
  active, and never expose mobile-only filters from desktop selectors.
- Sticky Back to top controls must respect safe areas and yield to modals,
  context sheets, action trays and busy states.
## Responsive navigation and cards

- Preserve desktop primary navigation as a dedicated DOM region when adding an
  off-canvas responsive alternative. Mobile classes must not own desktop nodes.
- Compact navigation rows must not look like raw links and must retain active,
  focus and touch-target states.
- Reserve a terminal card-action column before placing the canonical mobile
  menu. Never overlay identity text, badges or a participant details action.
- Use non-draggable hover feedback only on fine pointers and never add a grab
  cursor or drag affordance to a non-draggable container.
- A filter disclosure is one native button containing its label and chevron.
  Use the wide variant for a full-column desktop bar, compact for card-owned
  disclosures and the 44px touch variant on responsive layouts; never split
  the clickable label and icon or borrow a member-list reveal class.
- Keep the card-menu touch target at least 44px while applying quiet hover/open
  feedback to its smaller inner visual surface. Focus-visible still belongs to
  the complete target; do not add a persistent shadow, border or gradient.
- Equal-height paired filter surfaces use grid stretch. Their disclosure state,
  measured content and Reset controls remain independent.
- Persistent card actions must not move when detail rows expand or collapse.
- Responsive entity ownership must be explicit in the DOM. Never infer it from
  a translated label, child index or incidental template order.
