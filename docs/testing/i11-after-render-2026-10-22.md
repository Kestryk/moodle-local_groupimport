# I11 — scoped presentation updates after rendering

The course manager now shares one workspace-scoped mutation collector between
accessible names, card-menu decoration and back-to-top geometry. List renderers
declare their transaction and the cards they replaced. Nested synchronous renders
are delivered together before paint; changes outside those renderers still use
the collector's child-list and character-data fallback.

`local/cm/after_render` publishes `easystud:after-render` on its own workspace:

- `generation`: increasing number within that workspace;
- `subtrees`: connected changed scopes, with descendants covered by an ancestor removed;
- `addedNodes` / `removedNodes`: connected additions and detached removals;
- `addedCards` / `removedCards`: the corresponding unique card elements;
- `geometryFields`: `cards` / `height` from a renderer and `content` from other mutations.

This is a presentation queue containing DOM nodes, not a participant/model cache.
Independent workspaces have independent collectors. The event does not bubble.
Consumers must preserve unrelated changes made by another listener. Menu decoration
in the same delivery is already consumed by accessible naming and must not create
another delivery solely to name that menu.

Accessible naming reduces changed scopes to their owning cards before processing.
Card menus inspect only added cards after their initial binding. Back-to-top
geometry keeps its existing coalesced animation-frame scheduling, scroll/resize,
native modal events and floating-surface attribute observer. The native participant
navigation and targeted Guide observers are unchanged. Motion, permissions, course
state, filtering, payloads and participant data are unchanged.

## Isolated contract

Run with Node 22.11.0 and an explicit Playwright module path:

```text
node tools/release/test-after-render-browser.cjs <absolute-playwright-module-path>
```

This loads the generated AMD module in a headless native DOM, without Moodle or a
database. It checks nested transactions, scopes, card deltas, generation, external
text updates, independent roots and synchronous listener side effects.

## Native A/B protocol

The immutable reference is `8f7a5f1f`. On an exclusively reserved Moodle test copy,
use course 71 at 390 × 844, touch enabled, with 800 existing participants. Run each
arm in a fresh browser context: actual Moodle ancestor scrolling, five participant
pages and one DOM-only batch of twenty cards produced by the real card renderer.
Repeat with the `verify-with-filters` guided path. No database mutation is needed.

Count both mutation callbacks and the work they schedule, including the new shared
flush and its listeners. CDP task/script/layout/style durations are a separate gate;
lower callback time alone does not prove lower browser cost. Query counting and CPU
tracing are separate diagnostic runs so their overhead does not pollute timings.
Keep any initial series affected by machine drift. A counterbalanced ABBA
successor can reuse one owned headless browser process, with a fresh context for
each run; report both protocols rather than merging their samples or hiding a
slower reference. Measure synchronous style/layout work inside callback timestamp
intervals separately from total browser style/layout work.
Check external renaming and pagination names, participant/group menus, Guide target
replacement, and native modal appearance/removal in FR and EN. Restore the runtime
from its verified backup and release only the owned lock afterwards.

The detailed A/B results and replay scripts are delivered in the external review
report `RAPPORT-I11-APRES-RENDU-AB-20261022.md` and its manifested evidence directory.
Source and this bounded native scenario do not certify a full product visual audit.
