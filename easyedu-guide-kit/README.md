# EasyEdu Guide Kit

### Completion paint in the unified header

The explicit body role on the live copy must opt back into semantic accent and
strong weight for finished state. Preserve normal copy metrics and all original
scene commands/Motion; consumers copy the canonical recipe, not local CSS.

### Optional recap Motion dependency

The current Guide imports `disclosePanel` and `cancel` from the vendorable Motion
package for its optional recap body only. Preserve that module, then adapt the
dependency to the consumer namespace at the existing AMD synchronization/build
boundary. Runtime builds must name the Guide module with its dependency and
execute its callable exports; the historical zero-dependency replacement is
not sufficient. Templates without recap-toggle/body retain static behavior.

Reusable onboarding foundation for EasyEdu Moodle plugins.

### Unified timed-scene header

Timed scenes compose mode choice, manual Start and the live instruction in
`easyedu-guide-scene__header`. Its Small controls retain their existing command
attributes and one scene-owned live region. Pause/Next appear only during
playing/paused states. The header owns sticky positioning and scroll clearance;
the engine keeps the sibling live-region fallback for historical templates.
Mode choice does not start a manual scene. All phase clocks, pause remaining
time, next-phase gates and card choreography remain unchanged. This first
composition also shows the mode's expected memberships at rest, explicitly
labelled as a preview. Start restores the actual illustrated starting state.
The phase caption counts only applicable steps (desktop Add has two, compact
Add/Move have four); translated caption labels belong to the consumer payload.
Reset returns to the default ready mode. Recap disclosure/reordering is separate.

On phones, mode buttons grow from their intrinsic translated label width and
wrap as whole controls when necessary. Do not force equal zero-basis tracks or
shrink the caption. Check painted text inside each padded button, not only the
header boundary; a contained header can still hide part of its mode caption.

### Discovery creation composition

The opt-in discovery scene groups its labelled pattern field and preview/letter
actions in `easyedu-guide-scene__creation-controls`. Desktop controls share a
bottom baseline; the field has a bounded, shrinkable width and controls wrap on
compact screens. Syntax help follows the controls with the caption role. This
layout does not change the name-pattern parser, scene lifecycle or real commands.
Consumer-adapted runtime templates must receive this wrapper as well as the
embedded shared template; synchronization of the latter alone is insufficient.

Discovery slides can supply a translated `navtitle` for the topic rail; the
full `title` remains the content heading. Other consumers omit it to retain
their existing title. The optional path marker occupies the category lane,
not the title's horizontal space. Discovery body paragraphs consume the same
compact body role as the illustration instead of the legacy larger copy size.

The guide kit is not a complete guide for a specific plugin. It provides the
common behaviour that plugins can embed and configure:

- tutorial modal lifecycle;
- reusable compass launcher button styling;
- slide navigation;
- "show in the interface" highlights;
- guided checklist progress;
- first-visit discovery state;
- responsive-friendly floating checklist;
- custom completion events emitted by plugin actions.

Each plugin keeps its own content, selectors and language strings. This keeps
plugins independent while making the interaction model consistent across the
EasyEdu suite.

Before synchronizing a consumer, follow the canonical
[adapter integration contract](../docs/components/guide-adapter-integration.md)
and its [configuration examples](../docs/examples/guide-adapter-config.md).
They define atomic source copying, the direct AMD wrapper conversion and the
required responsive/accessibility evidence.

## Suggested plugin structure

Copy this folder into a plugin as `easyedu-guide-kit/`, then adapt or move the
files into Moodle-native locations:

```text
your-plugin/
  amd/src/easyedu_guide.js        copied/adapted from guide/amd/src/
  templates/easyedu_guide.mustache copied/adapted from guide/templates/
  lang/en/your_plugin.php         strings copied from guide/lang/en/
  lang/fr/your_plugin.php         strings copied from guide/lang/fr/
```

Keep a small note in the plugin README:

```text
Embedded EasyEdu Guide Kit: v0.1.0
Source: git@github.com:Kestryk/easyedu-ui-kit.git
```

## AMD initialisation contract

The generic module expects a root element and a configuration object:

```js
import {destroy, init} from './easyedu_guide';

init(document.querySelector('[data-easyedu-guide-root]'), {
  storageKey: 'coursebannerbuilder.guide.seen',
  firstVisit: true,
  targets: {
    createLayer: '[data-banner-create-layer]',
    layerList: '[data-banner-layer-list]',
    saveButton: '[data-banner-save]'
  },
  paths: {
    basics: [
      {
        id: 'create-layer',
        title: 'Create a layer',
        target: 'createLayer',
        completeOn: 'easyedu:layer-created'
      }
    ]
  }
});

// Before replacing or removing the root:
destroy(document.querySelector('[data-easyedu-guide-root]'));
```

The modal traps focus, locks page scrolling and restores the launcher on normal
close. `Show in the interface` closes without restoring the launcher, focuses
the visible target and leaves a temporary return panel. `destroy()` removes
tracked listeners and observers, cancels highlight refresh work and releases
the scroll lock without deleting saved guide progress.

## Target convention

Prefer semantic data attributes over fragile CSS implementation selectors:

```html
<button data-easyedu-guide-target="create-layer">Add layer</button>
<section data-easyedu-guide-target="layer-list">...</section>
```

The plugin can then map targets by name:

```js
targets: {
  createLayer: '[data-easyedu-guide-target="create-layer"]'
}
```

Only visible, connected targets are eligible. Hidden or detached matches are
ignored, and an active highlight is cleared if its target leaves the rendered
interface.

## Completion event convention

Plugin actions should complete guided steps by dispatching a custom event after
the real action succeeds:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
  detail: {
    path: 'basics',
    step: 'create-layer'
  }
}));
```

The guide also supports plugin-specific events through each step's `completeOn`
property.

## Refreshing highlights after UI movement

If a guided target moves after a filter, pagination change, card expansion or
Ajax update, ask the guide to recalculate its highlight:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-refresh-highlight', {
  detail: {
    target: 'createLayer',
    dock: true
  }
}));
```

`target` can be a configured target key or a CSS selector. If omitted, the guide
refreshes the current highlighted target. Set `dock: false` only when the plugin
needs to keep the checklist on its current side.

## First visit

Use a plugin-specific `storageKey` so guides do not conflict between plugins.
If the plugin prefers Moodle user preferences instead of browser storage, keep
the same public behaviour but replace the storage adapter in the plugin copy.

## Styling

The guide assumes the EasyEdu SCSS kit is present. Use the shared tokens instead
of hard-coded colours whenever possible. Moodle themes should be able to
override the public `--easyedu-*` variables on the plugin root.

## Completion modes

Set `completionMode` on every step that represents a real operation:

- `informational`: showing the target can complete the step;
- `action`: wait for a successful interface action;
- `event`: wait for `easyedu:guide-step-complete` or `completeOn`;
- `reload`: persist only because the successful action reloads the page.

`waitForCompletion: true` remains available while migrating older guide
configurations. Action, event and reload steps are never completed by clicking
their checklist row.

## Learning scenes

The Mustache template includes reusable data-driven scenes for cards, card
details, assignment flows, filters, identifier paste, context menus, action
flows, drag and drop, creation formulas, workflows, status grids and keyboard
shortcuts. Keep labels in plugin language files and add reusable scene markup
and animations to the kit before using them in another plugin.
