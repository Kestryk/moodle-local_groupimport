# EasyStud guide integration

EasyStud consumes the canonical responsive guide from
`C:\dev\easyedu-ui-kit` through the contract documented in
`docs/components/guide-adapter-integration.md` in that repository.

The Moodle component remains `local_groupimport`.

## Source ownership

Shared copies:

- `easyedu-guide-kit/amd/src/easyedu_guide.js`;
- `easyedu-guide-kit/templates/easyedu_guide.mustache`;
- `scss/easyedu/components/_guide.scss`;
- `amd/src/easyedu_guide.js`, mechanically wrapped for direct Moodle AMD.

Product-owned integration:

- `templates/easyedu_guide.mustache`, which retains the localized responsive
  launcher label `guidehoverlabel`;
- guide configuration prepared by EasyStud PHP;
- participant, group and grouping targets, actions and completion events;
- EasyStud responsive-navigation placement.

The product template may differ from the canonical template only where the
launcher composition is explicitly EasyStud-owned. Shared dialog, landmark and
live-region markup remains aligned.

## Guide header identity

The shared Guide header supports the optional guideeyebrow and
guidemodaltitle values. EasyStud uses them as the visible hierarchy
“GUIDE EASYSTUD” then “Simplified student management”, while the dialog keeps
the complete localized Guide name as its accessible name. This removes the
legacy header subtitle without creating a plugin-local typography, colour or
Close-control variant. Consumers without the optional values retain the shared
title/subtitle fallback.

## Synchronization

Check without writing:

```powershell
.\tools\release\sync-easyedu-guide.ps1 `
  -CanonicalKitRoot C:\dev\easyedu-ui-kit
```

Apply the four proven shared-source updates:

```powershell
.\tools\release\sync-easyedu-guide.ps1 `
  -CanonicalKitRoot C:\dev\easyedu-ui-kit `
  -Apply
```

The script updates only the embedded controller/template, runtime shared SCSS
and generated direct-AMD source. It does not touch the EasyStud runtime
Mustache adapter, product configuration, generated AMD build or compiled CSS.

The wrapper transformation removes the canonical ES-module exports and returns
both:

```js
return {
  destroy: destroy,
  init: init
};
```

Run the focused source check after synchronization:

```powershell
.\tools\release\test-easyedu-guide-integration.ps1 `
  -CanonicalKitRoot C:\dev\easyedu-ui-kit
```

## Build and runtime boundary

After source checks:

1. rebuild `amd/build/easyedu_guide.min.js` and its map with Moodle's normal
   Grunt toolchain when present;
2. compile `scss/easystud.scss` to `styles.css`;
3. run source/build parity and plugin release checks;
4. acquire `moodle51-active-fixture-write`;
5. purge Moodle caches only while owning the runtime;
6. execute the focused authenticated guide scenario.

Browser evidence is Moodle 5.1-only until the final compatibility phase.
Moodle 4.5, 5.2 and 5.3 must not be inferred from that result.

## Phase 2C validation evidence

On 2026-07-30, the EasyStud consumer synchronization passed:

- canonical/embedded/runtime source alignment through
  `test-easyedu-guide-integration.ps1`;
- the focused navigation integration contract;
- the plugin release validator, JavaScript syntax checks and scoped
  `git diff --check`;
- Dart Sass `1.77.8` compilation of `scss/easystud.scss` to `styles.css`;
- the authenticated Moodle 5.1 scenario
  `desktop layouts and guide launcher remain available`.

The authenticated run was
`easystud-authenticated-20260730T131445127Z-30784`. It selected exactly one
test, passed with exit code `0`, kept its profile outside the checkout, cleared
the process-local credential variables and released
`moodle51-active-fixture-write`. Its evidence is under the external
`%LOCALAPPDATA%\EasyEdu\artifacts\easystud\authenticated` root.

No Moodle cache purge was performed in this batch. The passing result therefore
records the asset state served by the already active Moodle 5.1 runtime; it is
not a cross-version or deployment claim.

The later mobile internal-alignment pass keeps the compact header close action
beside the title, lets the slide content use its full width and places `Show in
the interface` below the title as a full-width action. Source synchronization,
Sass compilation and the static guide contract pass. The authenticated mobile
scenario records the still-cached Moodle theme aggregate rather than these new
rules; do not claim its runtime acceptance until that aggregate is refreshed by
an approved runtime operation.

## Responsive composition correction

`EED-UI-2026-0006` extends the compact contract to the complete Guide
composition: the compass/title/subtitle group is centred by balanced header
slots, Previous/Next controls precede the centred Step label, compact slides
and guided paths use centred text, a single full-width vertical flow (not
split columns), and their identity accent moves to the top.
Learning scenes and guided paths stack vertically; flow arrows point down the
reading order and child icons stay smaller than their parent hierarchy.

The canonical Mustache and SCSS, embedded template and runtime SCSS align, and
Sass rebuilt `styles.css`. After the owned theme-cache refresh, the focused
authenticated Moodle 5.1 run `easystud-authenticated-20260731T095402229Z-11096`
selected exactly one scenario and passed: computed title/copy alignment is
centred, the footer is ordered actions then Step, the top accent replaces the
left rail, vertical flow arrows are active, and the guided-path body and start
action share the full stacked card width. Its manifest records the two external
captures and complete DPAPI/profile/lease cleanup.

The guided-path start action is the final full-width row, below the centred
icon and body. Both the body and action stretch across the stacked card. The
compact slide icon is centred and no left rail remains once the top accent is
active. Its primary surface has a darker visible border so it is recognisable
as the guided-path child action.

## Responsive interaction contract

Every EasyStud `Show in the interface` action declares the exact workspace it
must open before its highlight can resolve: participant cards, filters and
actions use **Participants**; group cards, group creation and pasted user
identifiers use **Groups**; grouping cards, grouping creation and grouping
guided steps use **Groupings**. On desktop these keys fall back to the existing
Participants or Structure layouts. The Guide then closes, highlights the
visible target and exposes its return panel. Guided-path checklist progress is
preserved when returning to the Guide or closing the checklist; real EasyStud
completion events remain the authority for marking operational steps complete.
Leaving the Guide for either an interface target or guided path also closes the
compact navigation drawer. The drawer stays independent and reopens through its
ordinary menu trigger.

After the workspace transition, slides carrying a product-specific
`highlightopen` action forward it as the shared Guide's `show-after-open`
request. EasyStud handles the resulting `easyedu:guide-open-target` event to
open the actual card, input or add-groups panel before the shared controller
resolves the highlight. This keeps responsive destinations concrete instead of
stopping at a workspace tab.

## Compact navigation overlay boundary

At the compact breakpoint, the navigation consumer may expose a forwarding
Guide launcher in its off-canvas panel, but it must portal the one initialized
`[data-easyedu-guide-root]` outside that transformed panel. EasyStud uses
`document.body` as that global overlay boundary. The compact button is styled
by its navigation-slot selector directly; it must not depend on a Guide root
wrapper that is intentionally absent from the drawer.

The fixed dialog must paint above the navigation panel token. The focused
390 px scenario `compact Guide launcher portals its modal above navigation`
checks portal parentage, background styling, modal/drawer elevation, visible
paint ownership at the dialog centre, close and focus return. The supervised
runner must first list exactly that one title through its versioned
`tools/playwright/playwright.config.js`; it never loads credentials or takes a
fixture lease during discovery.

On the active Moodle 5.1.3 runtime, source/generated CSS parity and the
navigation integration contract passed. The final exact authenticated run was
`easystud-authenticated-20260801T115748885Z-22484`: one selected test,
external isolated profile, modal paint and focus-return assertions passed,
empty stderr, and released fixture lease/process-local credentials. The
preceding failed run is retained only as manifested diagnosis of the missing
inherited compact gradient token. Moodle 4.5 and 5.2 were not executed for
this plugin-local responsive correction; Moodle 5.3 remains a future target.

The Windows installer checkout does not include Moodle's `package.json` or
`node_modules`. On that checkout only, the focused fallback builder may reuse
the `terser` package from a separately validated local Moodle 5.1 toolchain:

```powershell
node .\tools\release\build-easyedu-guide-amd.js `
  C:\path\to\moodle\node_modules
```

This builder handles only the already-AMD guide source, injects the stable
`local_groupimport/easyedu_guide` name, disables variable mangling and writes
the minified file plus source map. It must not replace the normal Grunt build
for ES-module sources or other AMD files.

## Checklist desktop containment

The fixed guided checklist owns a bounded inline size and a shrinkable,
internally scrollable step region. Consumer overrides must keep `min-width: 0`
on the panel, header and step labels; translated labels wrap within the panel
instead of growing past its border. This is a shared UI Kit rule, not a local
EasyStud width override.

On compact viewports it starts reduced: the single visible item is the active,
clickable checklist step, including its number, title and explanation. When all
steps are complete, this same bounded area shows the completion feedback and
the return-to-Guide action instead of an obsolete active step.

## Preservation

- Keep storage keys and saved progress unchanged.
- Keep `requiresStep`, `unlockPaths`, locked-slide explanations and real-action
  completion.
- Call `destroy()` before replacing or reinitializing a guide root.
- Do not add a second focus trap, target resolver, highlight controller or
  scroll animation in EasyStud.
- Do not redesign responsive navigation in the guide synchronization batch.
