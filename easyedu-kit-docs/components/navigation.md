# Navigation

EasyEdu navigation uses one server-prepared model with two presentation
variants:

- a desktop rail that composes the established `admin-primary-nav` contract;
- a compact off-canvas panel derived from the Simplified Student View
  reference.

The variants share `sections` and the same item partial. Responsive JavaScript
must never parse or clone rendered desktop HTML.

Status: provisional pending EasyStud consumer comparison and human visual
approval in `EED-NAV-2026-0002`.

## Canonical files

- `scss/easyedu/components/_navigation.scss`;
- `navigation/templates/easyedu_navigation.mustache`;
- `navigation/templates/easyedu_navigation_items.mustache`;
- `navigation/amd/src/easyedu_navigation.js`;
- `navigation/examples/normalized-context.json`;
- `navigation/examples/empty-context.json`.

The canonical history record for this extraction is
`EED-NAV-2026-0001` in the EasyEdu Platform evolution-history registry.

## Normalized context

PHP prepares the complete model after permissions and visibility are resolved.
Items omitted by PHP are not rediscovered in JavaScript.

Root fields:

| Field | Contract |
| --- | --- |
| `rootid`, `panelid` | Stable, unique HTML ids. |
| `anchorselector` | Optional selector for Moodle's visible course-navigation trigger. |
| `navigationlabel` | Accessible name for both navigation variants. |
| `triggerlabel`, `closelabel` | Translated accessible control labels. |
| `triggericon`, `closeicon` | Server-approved icon classes. |
| `hasitems`, `emptylabel` | Explicit empty-navigation contract. |
| `sections` | One ordered source shared by both wrappers. |

Section fields are `id`, `label` and `items`.

Each item has a stable `id`, translated `label`, `kind`, icon and one rendering
mode:

- `islink` with a server-built `url`;
- `isbutton` with a stable plugin-owned `action`;
- `isdisclosure` with `expanded` and `children`.

Optional state fields are `current`, `disabled`, `destructive`, `badge` and
`accessiblelabel`. `haschildren` makes nested data explicit. The same item
shape is used recursively.

Do not place capabilities, raw permission names, sesskeys or unresolved hidden
items in the browser context. A URL or action remains subject to normal Moodle
server-side permission and sesskey checks.

## Mustache architecture

The wrapper renders the same `sections` twice but does not maintain two lists:
both desktop and compact wrappers call
`easyedu_navigation_items.mustache`.

Consumers must rename the partial namespace to their Moodle component. They may
add plugin-specific classes or `data-*` hooks, but must preserve the normalized
fields and public `data-easyedu-navigation-*` controller contract.

## SCSS integration

```scss
@use "easyedu" as easyedu;

.local-example {
  @include easyedu.token-defaults;
}

.local-example-navigation {
  @include easyedu.navigation-component(64rem);
}

html.easyedu-navigation-open {
  @include easyedu.navigation-document-open-state;
}
```

The component composes the older desktop and responsive primitives instead of
forking them. Existing `admin-primary-nav`, `mobile-primary-nav-*` and
`mobile-navigation-link` consumers remain supported.

When a consumer supplies a desktop guide launcher, the launcher wrapper and
its visual label stay outside the destination layout flow. The destination
section remains centred against the full navigation rail, independently of the
launcher width and hover/focus label state. Compact layouts continue to use
their dedicated trigger and panel contract.
Desktop item icons should remain plain Font Awesome glyphs in a stable one-rem
slot with an explicit label gap. Scope the mobile navigation-link primitive to
the compact panel so its card/tile icon treatment cannot override the desktop
admin rail.

## Public navigation tokens

| Token | Default purpose |
| --- | --- |
| `--easyedu-navigation-following-gap` | Space after primary navigation; canonical default `2.5rem`. |
| `--easyedu-navigation-panel-width` | Compact panel width. |
| `--easyedu-navigation-panel-max-width` | Compact panel maximum. |
| `--easyedu-navigation-item-indent` | Nested item indentation. |
| `--easyedu-navigation-trigger-inline-start` | Fixed trigger inline position. |
| `--easyedu-navigation-trigger-gap` | Gap below the resolved Moodle trigger. |
| `--easyedu-navigation-trigger-fallback-top` | Top reference when Moodle's trigger is absent. |
| `--easyedu-navigation-trigger-safe-edge` | Minimum viewport edge clearance. |
| `--easyedu-navigation-layer-trigger` | Fixed trigger layer. |
| `--easyedu-navigation-layer-backdrop` | Compact backdrop layer. |
| `--easyedu-navigation-layer-panel` | Compact panel layer. |

The controller measures the optional Moodle anchor and writes only
`--easyedu-navigation-native-trigger-edge`. This avoids a product-specific
hardcoded offset while handling contexts where Moodle's trigger is absent.

## State contract

- `aria-current="page"` is authoritative for the current destination.
- `.active` is the compatible visual alias.
- `aria-expanded` and the controlled list's `hidden` state remain synchronized.
- Disclosure/list IDs are derived at initialization from the stable root,
  presentation and item IDs, so the two wrappers never emit duplicate IDs.
- disabled buttons use `disabled` and `aria-disabled`; disabled links omit
  navigation behavior and use `aria-disabled` plus `tabindex="-1"`.
- panel open state uses `.is-open`, `aria-hidden`, `inert`, trigger
  `aria-expanded` and the document `easyedu-navigation-open` class together.
- loading is consumer-owned and must not replace the existing items with a
  second data source.

Default, hover, focus-visible, current, expanded, collapsed, disabled, nested,
long-label, RTL, reduced-motion and forced-colors states are part of the
component contract.

## Controller behavior

`init(rootOrSelector)` is idempotent and returns `open`, `close` and
`syncPosition` methods.

The controller:

- opens and closes the compact panel;
- prevents the closed panel from remaining tabbable with `inert`;
- synchronizes `aria-hidden`, `aria-expanded` and the backdrop;
- moves focus to the current focusable item or close control;
- traps Tab inside the modal panel;
- closes on Escape, backdrop, destination or utility activation;
- lets a utility action transfer focus outside the panel, otherwise restores
  focus to the trigger after closing;
- restores focus to the trigger when appropriate;
- derives compact availability from the CSS-rendered trigger, keeping the Sass
  breakpoint as the single source of truth;
- closes when resize makes the compact trigger unavailable;
- measures the optional Moodle trigger on resize and scroll.

The controller does not build navigation items, move the guide launcher or
perform product actions.

## Responsive positioning

The trigger is fixed on the inline-start edge and placed below the measured
Moodle course-navigation trigger. When that control is absent, the documented
fallback token is used. Its block position is clamped so it remains reachable
in a narrow viewport.

The breakpoint passed to `navigation-component()` is authoritative. JavaScript
does not duplicate it in data or a media query.

The panel is the V1 "Kit drawer" (decision of 16/10/2026): 21 rem bounded by
88 vw, radius 20 on the open edge, header tile + title/subtitle + 40 px round
close, spaces as 48 px / radius 12 items sharing one width and 16 px inset, the
Guide launcher, then a tinted participant lane with chevron links. It slides
through `slideDrawer()` in `motion.js` (240 ms ease-out, scrim 200 ms, close
180 ms; reduced = 120 ms fades only; minimal = none), never CSS transitions, and
stays painted during the leave through `.is-closing`. Document scroll is locked
by `html.easyedu-navigation-open`. Safe-area padding, bounded width and
independent scrolling preserve narrow-height access.

Consumers with another fixed banner or toolbar must either anchor to the
highest relevant control or override the public clearance tokens. They must not
add an unexplained local `top` value.

## Accessibility

- The compact panel is a named modal dialog.
- The trigger exposes `aria-controls` and `aria-expanded`.
- The closed panel is `aria-hidden` and inert.
- Focus-visible is never removed without a replacement.
- Escape and focus return are mandatory.
- Current state cannot rely on color alone.
- Forced-colors retains borders and a current-item outline.
- Reduced motion removes meaningful transition duration.
- Long labels wrap inside the label slot without shrinking the icon or badge.
- Empty navigation has explicit readable copy.

## Simplified Student View baseline

Preserved:

- separate desktop and compact regions;
- off-canvas inline-start panel;
- grouped product and Moodle destinations;
- current, expanded and collapsed states;
- close button, backdrop, Escape, focus loop and focus restoration;
- 44px-equivalent touch targets;
- panel width bounded near `22rem`;
- placement relative to Moodle course navigation.

Intentional Phase 2A corrections:

- one server-prepared item source replaces desktop/mobile duplication and DOM
  reconstruction;
- closed content becomes inert and explicitly hidden from assistive technology;
- initial focus targets a focusable element;
- utility activation closes the panel without leaving focus in inert content;
- logical properties and RTL transforms replace left-only rules;
- layer, placement and spacing values become public tokens;
- guide launcher movement is removed from the generic controller.

These corrections address extraction, accessibility and compatibility defects;
they do not redefine the Simplified Student View visual language.

## Compatibility and migration

Phase 2A adds a vendorable reference and does not change consumers.

For an existing plugin:

1. build the normalized model in PHP;
2. adapt/copy the two reference templates to the plugin namespace;
3. copy and namespace the AMD controller;
4. include `navigation-component` under the plugin root;
5. keep legacy entry points until visual comparison passes;
6. remove DOM parsing and duplicate lists only after parity evidence;
7. record the migration in its own canonical batch.

Do not make EasyStud or CCB depend on an installed UI Kit plugin.

## Validation protocol

Static Phase 2A:

- parse example JSON;
- run `scripts/test-navigation-contract.ps1`;
- validate ES-module syntax;
- compile the SCSS public entry point;
- run the strict kit audit;
- inspect Mustache section balance and shared partial usage.

Consumer Phase 2B:

- compare desktop and compact item IDs and order;
- empty and nested models;
- active/expanded/disabled states;
- 1024, 768 and 390px plus narrow-height layouts;
- anchor present/absent, scroll and overlap;
- keyboard open/close, Tab loop, Escape and focus return;
- long labels, RTL, reduced motion and forced colors;
- targeted screenshots and axe checks.

## Course Banner Builder considerations

- CCB currently has separate PHP navigation assemblies for Course/Site,
  Slideshow and Transfer.
- Product format/reset/destructive actions must remain utilities, not primary
  destinations.
- Existing interaction engines remain CCB-owned.
- The embedded kit version and dirty CCB worktree must be reconciled before
  migration.
- Phase 2D must validate four routes, Boost/EasyEdu themes and Moodle 5.1/4.5.
