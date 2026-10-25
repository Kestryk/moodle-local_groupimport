# EasyEdu Motion Runtime

This folder is the canonical, vendorable runtime for EasyEdu layout motion.
Each Moodle plugin ships its own namespaced copy, so consumers have no runtime
dependency on the UI kit repository.

## Vendoring

Run the kit synchroniser with `-IncludeMotion`, copy
`amd/src/easyedu_motion.js` into the consumer AMD namespace, and update its
`@module` declaration. Keep the public method and data-attribute contract.

The server-rendered root must expose the policy before first paint:

```html
<div class="local-example" data-easyedu-motion-policy="enabled"></div>
```

Use `disabled` when the plugin administrator disables optional motion. Add
`easyedu-motion-disabled` to `body` for Moodle modals rendered outside the
plugin root. `prefers-reduced-motion: reduce` always takes priority.

Initialise once from the plugin entry point:

```js
import * as Motion from './motion';

Motion.init(root);
```

## Public API

- `init(root)` and `isEnabled(element)` manage policy.
- `expand`, `collapse` and `resize` own measured height changes.
- `enter`, `exit` and `swap` own opacity/translation replacements.
- `scroll` follows the active reduced-motion policy.
- `cancel` interrupts an in-flight operation and cleans temporary styles.
- `timing.fast`, `timing.normal` and `timing.slow` expose 100/160/220 ms caps.

Every operation returns a promise. A resolved value of `false` means another
operation cancelled it; do not apply focus or stale completion work.

## Required recipes

### Short search or paste panel

```js
const transition = open ? Motion.expand(panel) : Motion.collapse(panel);
transition.then(completed => {
    if (completed && open) {
        input.focus();
    }
});
```

Duration is distance-aware. Do not create a plugin-specific short-panel timer.

### Single compact/detail card

```js
Motion.resize(card, () => {
    card.classList.toggle('is-expanded', expanded);
});
```

Resolve tag overflow and other height-changing metadata inside the mutation,
before the runtime measures the destination.

### Full-column view switch

```js
Motion.swap(layout, applyViewState, {
    exit: false,
    resize: false,
    enterDuration: Motion.timing.normal,
    swapOpacity: 0.62,
});
```

Recompute filters and pagination once inside `applyViewState`. Never call the
same global pagination refresh from several nested filter helpers.

### Pagination and sorting

```js
Motion.swap(list, applyPageState, {
    exitDistance: '0px',
    distance: '0px',
    resize: false,
    swapOpacity: 0.55,
});
```

Scrollable lists must use fade-only replacement. Translating or interpolating
their height can temporarily create a scrollbar and move the column content.

### Nested structures

Animate only the direct disclosure region. Keep auto-sized ancestors natural.
When opening a secondary region such as search also reveals a large parent,
apply the parent state atomically and animate only the user-requested region.

## Performance rules

- Batch DOM reads before writes; never hide one token between width reads.
- Do not rebuild all paginated lists for a selection-label change.
- Do not run focus, smooth scroll or preview rendering during opening frames.
- Remove completed Web Animation effects after final-state cleanup.
- Keep `will-change` only for the active operation.
- Avoid delayed resize chains and competing CSS layout transitions.

## Validation

Validate normal motion, reduced motion, repeated clicks and cancellation.
For scrollable pagination, sample `clientWidth` during every frame and verify
that no temporary scrollbar reduces the usable width. EasyStud's reference
implementation is `tools/playwright/motion-audit.spec.js` in GroupImport.
