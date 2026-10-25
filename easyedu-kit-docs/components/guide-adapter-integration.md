# Guide adapter integration

This document is the copy-ready handoff between the canonical EasyEdu guide and
independently installable Moodle plugins. It defines integration ownership and
packaging; product content and business rules remain outside the UI Kit.

Canonical sources:

- `guide/amd/src/easyedu_guide.js`;
- `guide/templates/easyedu_guide.mustache`;
- `scss/easyedu/components/_guide.scss`;
- `guide/lang/`;
- `docs/components/guide.md`.

## Ownership

| Concern | UI Kit | Product adapter |
| --- | --- | --- |
| Dialog, checklist, highlight and return-panel lifecycle | Owns | Consumes unchanged |
| Focus, keyboard, RTL, reduced motion and forced colours | Owns | Provides localized labels |
| Target resolution and teardown API | Owns | Calls `init()` and `destroy()` |
| Target selectors and routes | Defines interface | Owns concrete values |
| Slides, guided paths and localized content | Provides template vocabulary | Owns content |
| Completion predicates and permissions | Provides events and state vocabulary | Owns business truth |
| Storage | Preserves shared format | Owns stable plugin-specific key |
| Moodle AMD namespace and build output | Documents conversion | Owns namespace and generated artifacts |

EasyStud owns participant/group/grouping actions and responsive-navigation
integration. Course Banner Builder owns source/layer/banner targets, its modal
openers and progression restrictions. Neither adapter may copy the other
product's selectors or completion predicates.

## Atomic source set

A consumer synchronization reviews the JavaScript, Mustache and guide SCSS
together. Copying only the controller can leave missing ARIA or responsive
contracts; copying only styles can leave stale focus and cleanup behavior.
Language examples are merged into the consumer language files rather than
installed as a second Moodle component.

Embedded kit copies and runtime plugin copies have different roles:

- the embedded copy records source provenance and supports later comparison;
- the plugin `amd/src`, `templates` and SCSS paths are runtime sources;
- `amd/build` and compiled CSS are generated consumer artifacts;
- embedded documentation never overrides a newer canonical source.

Record the canonical commit or reviewed source state in the consumer batch.
Do not infer parity only from a kit version string.

## AMD packaging

The canonical controller is an ES module and publicly exports both lifecycle
methods:

```js
export const destroy = rootOrSelector => {
  // Shared cleanup.
};

export const init = (rootOrSelector, rawConfig) => {
  // Shared initialization.
};

export default init;
```

Consumers using the standard Moodle JavaScript build may keep these exports and
let the Moodle toolchain generate the AMD module.

EasyStud and CCB currently carry a direct `define()` wrapper. Until a consumer
batch explicitly changes that build model, conversion must be mechanical:

1. prepend the consumer's existing `define([], function() {` wrapper;
2. change `export const destroy` to `const destroy`;
3. change `export const init` to `const init`;
4. remove `export default init;`;
5. return both public methods;
6. preserve the consumer module namespace in generated build output.

```js
return {
  destroy: destroy,
  init: init
};
```

Do not expose only `init`: responsive navigation, partial-page replacement and
tests need deterministic teardown. Do not hand-edit minified output. Rebuild it
with the consumer's documented Moodle AMD toolchain.

## Lifecycle

Initialize one rendered root with one product-owned configuration:

```js
Guide.init('[data-easyedu-guide-root]', guideConfig);
```

Before removing, replacing or reinitializing that root:

```js
Guide.destroy('[data-easyedu-guide-root]');
```

`destroy()` removes the root's tracked listeners, mutation observer, refresh
frames, timers, active highlight and page scroll lock. It hides transient guide
surfaces but intentionally preserves saved visitor progress.

Do not call `init()` repeatedly on replaced markup without first destroying the
old root. Do not clear storage as a substitute for lifecycle cleanup.

## Adapter configuration

The adapter provides:

- a unique, stable `storageKey`;
- localized `labels`;
- product-owned `targets`;
- product-owned `paths`;
- `unlockPaths` where the product has explanatory progression;
- a completion owner for every action-oriented step;
- optional `highlightStyle` and first-visit policy.

Target selectors must resolve to visible controls or informative wrappers in
the current product view. Hidden, detached and zero-sized targets intentionally
resolve as unavailable. If a step must reveal a target first, use its `open`
sequence rather than weakening target readiness.

For a slide whose usable compact control differs from desktop, keep the shared
semantic `target` and set `targetselectorcompact` and
`targetselectordesktop` in the product slide data. The controller chooses the
matching visible target at the workspace breakpoint, then uses the normal
scroll, focus, highlight and return lifecycle. Do not simulate availability by
changing a user's selection or opening a product action.

Completion modes remain distinct:

- `informational`: viewing the target may complete the step;
- `action`: wait for a successful product action;
- `event`: wait for the configured event;
- `reload`: persist completion only after the action that reloads the page.

Moodle capabilities and server validation remain authoritative. A visually
locked slide is explanatory UI state, not a permission boundary.

## Synchronization sequence

1. Inspect branch, HEAD, upstream and dirty files in the UI Kit and consumer.
2. Register the consumer batch and confirm file ownership.
3. Compare canonical, embedded and runtime copies before writing.
4. Copy the atomic source set without changing product configuration.
5. Apply the existing consumer AMD packaging mechanically.
6. Rebuild AMD and SCSS through the consumer's documented toolchain.
7. Update the consumer changelog, technical docs and embedded provenance.
8. Run static checks before acquiring a runtime lease.
9. Acquire the correct Moodle lease and run focused acceptance.
10. Record exact runtime/version evidence and deferred coverage.

Never reset, clean, stash or overwrite a dirty consumer to make synchronization
easier.

## Acceptance matrix

| Area | Required scenarios | Evidence owner |
| --- | --- | --- |
| Geometry | Wide desktop, reduced-height desktop, tablet portrait/landscape, phone portrait/landscape, 200% zoom | Consumer QA |
| Direction and text | LTR, RTL, long localized labels | Consumer QA |
| Input | Mouse, touch and keyboard-only | Consumer QA |
| Dialog | Open, close, Escape, Tab loop, focus restoration, page scroll lock | Shared contract plus consumer browser |
| Interface target | Visible, off-screen, hidden, removed and replaced targets | Consumer browser |
| Guided panel | Docking, constrained-height scrolling, minimize, close and return | Consumer browser |
| Overlay | Resize, inner scroll, Moodle modal open/close, no stale highlight | Consumer browser |
| Preferences | Reduced motion, forced colours and high contrast | Manual/automated accessibility |
| Progression | Available, blocked, unlocked, event completion and reload restoration | Product adapter tests |
| Collision | Product navigation, Moodle drawer/menu, guide trigger and safe areas | Consumer visual review |

Every result names the Moodle version, theme, viewport, input method and
whether it was automated or manual. A Moodle 5.1 result is not evidence for
4.5, 5.2 or 5.3.

## Rollback and compatibility

The Phase 2A controller keeps existing configuration and storage formats.
Consumer synchronization must therefore be reversible by restoring the prior
vendored source set and rebuilding generated assets. Do not migrate or delete
visitor storage in the adapter batches.

If a product needs a contract-breaking selector, persistence or completion
change, stop and register it as a separate product decision rather than
embedding the exception in the shared controller.

## Containing blocks and stacking

The modal is viewport-fixed. A consumer wrapper that contains both launcher and
modal must not use `transform`, `filter`, `perspective`, `contain: paint` or an
equivalent rule that makes fixed positioning relative to that wrapper. Centre
or animate the launcher through a child element instead.

The launcher wrapper must also avoid a product-level stacking context above
Moodle-native dropdowns. The modal, guided panel and highlight own their
documented elevations; raising their ancestor to repair one menu collision
creates another.
