# Animations

Include shared keyframes once from a stylesheet entry point:

```scss
@include easyedu.motion-keyframes;
```

Reusable motion helpers:

```scss
.my-region {
  @include easyedu.expandable-region;
}

.my-card-details {
  @include easyedu.content-reveal;
}

.my-new-card {
  @include easyedu.card-open-motion;
}

.my-list.is-page-changing {
  @include easyedu.paginated-list-motion;
}

.my-plugin-root {
  @include easyedu.motion-policy;
  @include easyedu.action-busy-indicator("data-my-plugin-busy-label");
}

// Persistent workspace actions keep the established bottom-end feedback.
.my-workspace-root {
  @include easyedu.action-busy-indicator-bottom-end("data-my-plugin-busy-label");
}

.my-card {
  @include easyedu.transition-standard(background, border-color, box-shadow);
}
```

## Runtime motion controller

Plugins with dynamic lists should vendor `motion/amd/src/easyedu_motion.js` into
their own Moodle AMD namespace. The controller is the canonical runtime for
layout-changing motion and exposes:

- `init(root)` and `isEnabled(element)`;
- `expand(element)`, `collapse(element)` and `resize(element, mutate)`;
- `enter(element)`, `exit(element)` and `swap(element, mutate)`;
- `scroll(element)` and `cancel(element)`;
- the shared `timing.fast`, `timing.normal` and `timing.slow` values.

The plugin root must expose the server policy before first paint:

```html
<div class="my-plugin" data-easyedu-motion-policy="enabled"></div>
```

Use `disabled` when the Moodle administrator disables optional motion. Also add
`easyedu-motion-disabled` to the page body so Moodle-native modals appended
outside the plugin root follow the same policy. `prefers-reduced-motion: reduce`
always wins over the administrator setting.

`expand`, `collapse`, `resize` and `swap` are cancellable. Starting a new motion
on the same element cancels the previous animation and prevents stale completion
callbacks from restoring an obsolete state.

Completed Web Animations must also be cancelled after final-state cleanup.
Leaving a finished animation with `fill: both` attached keeps its last height in
the cascade, breaks later measurements and gradually increases rendering work.

During `expand` and `collapse`, the direct region receives
`is-easyedu-disclosing`. The class is removed after completion or cancellation
and is intended for diagnostics and automated stability checks, not for adding
a second CSS animation.

## Behaviour contracts

- Keep `hidden`, `aria-expanded`, selection and pagination state functional when
  motion is disabled. The controller applies the final state synchronously.
- Use `swap` once on a list for pagination or bulk density changes. Do not animate
  every card independently.
- Use `resize` for a single compact/detail card and for preview lists whose
  collapsed and expanded heights are calculated by the plugin.
- `resize` measures the constrained destination first, then temporarily
  neutralises `min-height` and `max-height` while interpolating. This preserves
  collapsed targets while preventing constraints from fighting the keyframes.
- Use the optional `prepare` callback of `expand` when child measurements
  must be refreshed after a hidden disclosure becomes measurable.
- Disclosure duration is calculated from measured distance and capped by the
  requested timing tier. Short regions therefore finish close to the fast
  token, while unusually tall regions may add at most 40 ms.
- Animate only the direct disclosure region. A group list may grow inside a
  grouping, but the grouping parent must remain `height: auto`.
- Do not combine controller-driven height animation with a CSS `max-height`
  transition on the same element.
- Do not use delayed recalculation chains. If dynamic content changes after an
  Ajax operation, batch one measurement in `requestAnimationFrame`.
- Keep `will-change` temporary. The controller adds and removes it for each run.
- Busy feedback must remain understandable as static text and an ARIA status
  when rotation is disabled.
- The bottom-end busy spinner must keep only `easyedu-busy-spin` on its `::after`
  pseudo-element. Do not combine `easyedu-busy-pop` or another transform
  animation on that element, because competing transforms can make rotation
  appear frozen; keep the label pulse on `::before`.
- A loading skeleton must keep a measured, regular vertical rhythm. Its panel
  children require an explicit `gap`, `align-content: start` and
  `grid-auto-rows: max-content`; browser checks must reject both touching rows
  and oversized gaps before the pattern is reused on another view.

## Timing contract

- `--easyedu-motion-fast: 100ms` for exits and micro-feedback;
- `--easyedu-motion-normal: 160ms` for list entries and ordinary changes;
- `--easyedu-motion-slow: 220ms` for disclosures and modal entrances;
- `--easyedu-motion-layout: 320ms` for a persistent column or region whose
  tracks resize in place;
- `--easyedu-motion-ease: cubic-bezier(0.22, 1, 0.36, 1)` for spatial motion.
- `--easyedu-motion-disclosure-ease: cubic-bezier(0.4, 0, 0.2, 1)` for
  measured height changes that must remain smooth in both directions.

Themes may override the duration tokens, but must not reactivate motion
when the server policy or operating-system preference disables it.

Use `layout-disclosure-transition(...)` for in-place grid/flex track changes.
It deliberately lasts longer than an ordinary control state so the user can
follow the moving boundary. The layout transition is the only geometry owner:
do not add `Motion.swap`, a second opacity entrance or a timeout around the
same column change. Child content may fade with the same layout token.

Measured disclosures may add at most `40ms` for unusually tall content. A
selection handler must not rebuild pagination or sort complete lists before a
card animation; update only the controls whose labels or states changed.

Disclosure timing is also distance-aware: short search, paste and inline-form
panels should complete closer to the fast token rather than inheriting the
duration of a large nested list. Consumers can use `swap(..., {exit: false})`
for an atomic layout replacement followed by one entrance animation; this is
preferred for full-column view changes where a sequential exit and entrance
would feel sluggish.

Scrollable pagination lists should use `resize: false`, `distance: 0px` and
`exitDistance: 0px`. This produces a fade-only replacement and prevents a
temporary scrollbar caused by translated or height-interpolated list content.

## Runtime option recipes

Short inline panel:

```js
Motion.expand(panel, {duration: Motion.timing.slow}).then(completed => {
    if (completed) {
        field.focus();
    }
});
```

The slow tier is a cap, not a forced duration. A short panel will use the
distance-aware duration. Focus only after completion so browser scrolling and
layout do not compete with the opening frames.

Atomic full-view replacement:

```js
Motion.swap(layout, applyViewState, {
    exit: false,
    resize: false,
    enterDuration: Motion.timing.normal,
    swapOpacity: 0.62,
});
```

Fade-only pagination or sorting:

```js
Motion.swap(list, applyPageState, {
    exitDuration: Motion.timing.fast,
    enterDuration: Motion.timing.normal,
    exitDistance: '0px',
    distance: '0px',
    resize: false,
    swapOpacity: 0.55,
});
```

`swap` options:

| Option | Purpose |
| --- | --- |
| `exit` | Set to `false` for one atomic mutation followed by one entrance. |
| `resize` | Set to `false` when the surrounding scroll layout must not interpolate height. |
| `exitDistance` | Translation used during the exit phase; use `0px` for scrollable lists. |
| `distance` | Translation used during entrance or resized replacement. |
| `swapOpacity` | Lowest opacity shown while content is replaced. |
| `exitDuration` / `enterDuration` | Timing-tier overrides for each phase. |

## Failure modes to avoid

- Mixing `setTimeout`, `transitionend` and CSS animations for one state change.
- Setting `max-height: none` midway through a transition.
- Animating a child and each of its auto-sized ancestors simultaneously.
- Starting a pagination scroll before the list replacement reaches its stable
  height.
- Replaying a native modal animation by forcing repeated synchronous reflows.

Motion should be visible enough to explain state changes, but never required to
understand the interface.

Shared keyframes currently include modal transitions, slide entrance, pop-in,
card/content reveal, pagination swap, success pulse, drop pulse, busy spinner,
busy label pulse and demo cursor click.

## Guide learning scenes

Guide scene animations are intentionally more pedagogical than decorative. They
should show a cause/effect relationship: an item moves, a target accepts it, a
menu appears after a right click, pasted text becomes recognised chips, or a
bulk formula expands into several results.

Shared guide-scene keyframes include:

- `easyedu-guide-demo-drag`: moves the active object while keeping it fully
  opaque.
- `easyedu-guide-drop-overlay`: highlights a compatible destination without a
  heavy dashed border.
- `easyedu-guide-scene-panel-in`: makes explanatory panels appear in sequence
  without changing slide height.
- `easyedu-guide-selection-pulse`: shows which selected item is being acted on.
- `easyedu-guide-action-nudge`: draws attention to an action button or second
  selected item.
- `easyedu-guide-filter-pop`: draws attention to filter controls in sequence.
- `easyedu-guide-context-pointer`, `easyedu-guide-click-ring` and
  `easyedu-guide-menu-pop`: explain right click / long press menus.
- `easyedu-guide-caret`: explains text entry in formula and paste examples.
- `easyedu-guide-chip-in`: subtly lifts generated chips/results.

Rules for new guide motion:

- Animate `transform`, `opacity` and shadow intensity before layout properties.
- Keep scene containers dimensionally stable to prevent guide modal jumps.
- Do not stack several transform animations on the same element unless the
  result is explicitly tested.
- Include a useful static state for reduced-motion users.
- Keep highlight realignment in one bounded requestAnimationFrame refresh
  cycle; do not layer competing timeout bursts over scroll animation.
- Reduced motion applies to the complete guide shell, slide, checklist and
  highlight lifecycle, not only the decorative learning scene.
