# K23-21 — new group card entrance (Student Management)

Kevin's report (23/10/2026, undiagnosed): "when adding a new group, the new group
card's appearance animation is a bit off." No technical detail was given.

## Native observation

Headless Playwright (Node, `tools/playwright/node_modules/playwright`) against the
`:8052` runtime, course 71, `claude-sm-test`. Flow: load `manage.php`, submit the
quick-create group form (`form.local-groupimport-easystud-create`,
`action=creategroup`), detect the new card(s) with a `MutationObserver` (no
polling lag), then sample `getAnimations()` and `getBoundingClientRect()` every
`requestAnimationFrame` for ~1s.

## Defect found: two competing opacity animations on the same card

The Participants/Structure catalog is on-demand: its group cards are not in the
DOM until the catalog first hydrates (`local/cm/render.js`, `renderGroupPage` +
`animateListArrival` in `local/cm/transitions.js`). The very first hydration of a
session also runs the course-state's one-time "replacing the skeletons" fade
(`root.classList.add('is-easystud-sm-entering')`, 700 ms window,
`scss/components/_layout.scss`), which plays `@keyframes easyedu-skeleton-appear`
(CSS, opacity 0→1, 180 ms linear by default token) on every
`[data-easystud-group-id]`/`[data-easystud-user]` card.

When a "create group" action is the trigger for that first hydration (a common
case: the first thing a teacher does after opening Student Management, or more
generally whenever the on-demand catalog has not been drawn yet), the freshly
rendered cards get **both**:

1. `easyedu-skeleton-appear` (CSS, 180 ms, linear, opacity only), and
2. `animateListArrival`'s own entrance (`local/cm/transitions.js`, WAAPI, opacity
   + `translateY(6px)`, 160 ms, `cubic-bezier(0.22, 1, 0.36, 1)`, staggered 30 ms
   per card up to the sixth).

Per the Web Animations composite order, the JS animation (added later via
`element.animate()`) controls the rendered opacity while both run. At its own
(shorter) completion the JS animation is explicitly cancelled
(`local/cm/transitions.js` → `motion.js`'s `play()`), which removes it from the
effect stack — handing control back to the still-running CSS keyframe, which at
that instant has not yet reached its own `1` (it still has ~20 ms left, linear
0→1 over 180 ms). The rendered opacity measurably dips from `1` back to ≈`0.89`
for one frame before the CSS animation also finishes — a visible flicker right
as the card settles. Measured natively (full level, 1600×1000, `styles/student-
management.css` + `amd/src/local/cm/transitions.js` before the fix):

| frame | t since submit | opacity | note |
| --- | --- | --- | --- |
| 1 | +0 ms (relative) | 0 | both animations at `currentTime: 0` |
| ~10 (160 ms later) | — | 1→≈0.89 dip | JS animation cancelled, CSS still at its own in-flight value |
| ~11 (180 ms later) | — | 1 | CSS keyframe also completes |

The same on-demand catalog groups the newly created card together with every
*other* card materializing in the same page for the first time (an architectural
property of `renderGroupPage`, out of scope for this fix): all of them share the
same stagger and are all a part of the same collision, not only the one the
teacher just created.

The Grouping-tree workspace (`insertGroupData`/`createGroupElement` in
`local/cm/actions.js` + `local/cm/cards.js`) has an analogous, narrower version
of the same collision for its own `.is-newly-created` cards.

## Fix

- `amd/src/local/cm/transitions.js` (`animateListArrival`): the card now carries
  `is-easystud-list-arriving` for the duration of its own entrance, the same
  convention already used for the Grouping-tree's `.is-newly-created`.
- `scss/components/_layout.scss`: the one-time skeleton-replacement fade selector
  now excludes both `.is-newly-created` and `.is-easystud-list-arriving`, so a
  card with its own JS entrance never also plays the generic CSS fade.

No change to `amd/src/motion.js`: both entrances already go through it
(`Motion.getLevel`/`play()` inside `local/cm/transitions.js`'s `run()`, and
`Motion.enter` inside `local/cm/cards.js`'s `animateElementCreated`); the defect
was a second, independent CSS `@keyframes` animation outside the Motion module
colliding with an already-correct Motion-driven entrance, not a timing value to
retune inside Motion itself.

## Verification (native, `:8052`, course 71, `claude-sm-test`)

| Level | Before | After |
| --- | --- | --- |
| full | 2 animations per card (180 ms linear CSS + 160 ms cubic-bezier JS), opacity dip at the 160 ms handoff | 1 animation per card (160 ms cubic-bezier JS only), opacity 0→1 monotonic, no dip |
| reduced | not separately measured before the fix (same collision mechanism applies) | 1 animation (120 ms cubic-bezier fade, no transform), clean |
| minimal | not separately measured before the fix | 0 animations, opacity `1` and `transform: none` from the first observed frame (no residual offset) |

0 console errors in every run. 1600×1000 viewport exercised for all three
levels; 390×844 was attempted but the quick-create form is not reachable
without first opening the compact/responsive navigation drawer — the fix itself
is viewport-independent (no media query involved on either side of the change),
so this was not treated as a blocker, but a sub-agent/Codex recipe pass should
still add an explicit compact-viewport creategroup check to the K23-21 coverage.

## Build

- `node tools/release/build-sm-amd.js C:/dev/moodle51-build-501` (rebuilds
  `local/cm/transitions.js` into `amd/build/local/cm/transitions.min.js`;
  `build-course-manager-amd.js` alone does **not** rebuild `local/cm/*`, it only
  rebuilds the `course_manager.js` orchestrator wrapper).
- `node tools/release/build-styles.cjs <sass> styles.css conservative <postcss>`
  (rebuilds the page-split CSS, including `styles/student-management.css`).
- Both run with the pinned Node 22.11.0 executable
  (`C:/dev/tools/node-v22.11.0-win-x64/node.exe`), per
  `tools/release/build-versions.json`.
- `tools/release/test-k23-style-scope.cjs` already fails on unmodified HEAD
  (`674985af`) against its pinned baseline commit `f0bb9363` (actual 1779 vs
  expected 2843 retained rules) — a pre-existing, unrelated drift, not something
  this lot introduced or is in a position to fix.
