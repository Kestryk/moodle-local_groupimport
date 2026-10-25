# Course Banner Builder Integration Notes

This example describes how Course Banner Builder should consume EasyEdu UI Kit
`v0.4.1+`.

## Preview-side accordions

The trigger and its revealed panel form one component. Keep them adjacent in
the DOM and preserve the plugin-owned `aria-expanded`, `aria-controls` and
open/close events.

```scss
.my-image-trigger {
  @include easyedu.preview-side-accordion-trigger(var(--easyedu-primary));
}

.my-image-panel {
  @include easyedu.preview-side-accordion-panel(var(--easyedu-primary));
}
```

Use a stable semantic accent for each editor family. Do not insert a second
close button inside the revealed panel: the persistent trigger remains the
accordion header and closes the panel.

The trigger and panel must share the same accent rail, border colour and soft
surface tint. A closed trigger remains visibly different from a command button,
while an open trigger removes its lower radii and visually joins the panel.
Use a compact icon tile and an end chevron to communicate disclosure state.
Preview-side accordion triggers must remain positionally stable on hover and
active states; command-button lift and press transforms do not apply to them.
Their collapsed height must match adjacent compact preview commands. When the
panel opens, compensate any parent grid or flex gap between the trigger and
panel so their shared border reads as one continuous disclosure; retain normal
spacing only after the complete trigger/panel group.

Banner format selectors use `format-choice-card`,
`format-choice-card-hover` and `format-choice-card-selected`. These mixins style
only the choice surface and must not alter the plugin-owned format skeleton
dimensions used to explain the final page placement.

Slideshow administration cards separate context activation from content-source
and playback controls. Use `slideshow-activation-band`,
`slideshow-settings-section`, `slideshow-section-title` and
`slideshow-toggle-row`, passing the context accent through a CSS custom
property. Field names, checkbox values and editor-launch hooks remain owned by
the plugin.

Use `slideshow-admin-grid`, `slideshow-card-layout`,
`slideshow-card-body-layout` and `slideshow-settings-grid` together so sibling
Course/Site cards share one height while Content and Controls sections stop at
their real content height. Anchor appearance/reset controls with
`slideshow-action-zone`; do not create fixed heights or stretch coloured
sections merely to align card footers.

`slideshow-toggle-row` owns checked, unchecked, focus and disabled surfaces.
The plugin still owns input values and event handling. Context-specific primary
actions may use the same accent variable, but must preserve sufficient text
contrast and must not add raised shadows.

## Sync

```powershell
.\sync-easyedu-kit.ps1 -IncludeGuide -IncludeDocs -TargetPluginRoots @(
  "C:\dev\Moodle 51\MoodleWindowsInstaller-latest-501\server\moodle\local\coursebannerbuilder"
)
```

## SCSS entry point

```scss
@use "easyedu" as easyedu;

@include easyedu.motion-keyframes;

.local-coursebannerbuilder {
  @include easyedu.token-defaults;
  @include easyedu.guide-shell;
  @include easyedu.guide-rich-navigation;
  @include easyedu.guide-visuals;
  @include easyedu.guided-panel;
}
```

## Suggested component mapping

| Course Banner Builder concept | EasyEdu component |
| --- | --- |
| Main editor/card containers | `panel-shell`, `panel-header`, `split-layout` |
| Layers | `object-card`, `identity-rail`, `selectable-card`, `drag-handle` |
| Image upload | `filepicker`, `file-drop-overlay`, `image-preview` |
| Layer settings modal | `settings-modal-dialog`, `settings-modal-field`, `metadata-list` |
| Source picker dropdowns | `menu-surface`, `menu-item`, `dropdown-menu` |
| Inline help | `hover-help-host`, `help-icon` |
| Guide | `guide-shell`, `guide-rich-navigation`, `guide-visuals`, `guided-panel` |
| Wide modal with preview | `modal-with-preview`, `preview-surface` |
| Shared preview-modal spacing | `preview-modal-content-shell`, `preview-modal-inline-rhythm` |
| Preview toolbar below a banner | `banner-preview-toolbar` |
| Action buttons beside a preview | `banner-preview-side-actions`, `accordion-action-button` |
| Layer/source tables | `layer-table`, `source-chain` |
| Colour fields | `color-picker-field` |
| Linked slider + number controls | `linked-range-number` |
| Custom help bubbles | `help-tooltip`, `tooltip-surface` |

## Guide scene mapping

Course Banner Builder should use the shared guide learning scenes instead of
plugin-local illustration markup. Recommended mapping:

| Course Banner Builder guide topic | Shared guide scene |
| --- | --- |
| Source -> layers -> banner concept | `visualassignment` |
| Source picker / configured source selection | `visualfiltersdemo` |
| Source settings after choosing a source | `visualsteps` with `layout: status` |
| Visual editor / preview interaction | `visualdragdrop` |
| Layer table and layer guided path | `visualactionflow` |
| Toolbar actions | `visualactionflow` |
| Slideshow context / appearance / preview / save flow | `visualassignment`, `visualcards`, `visualfiltersdemo`, `visualactionflow` |

Slides that launch a guided path should still include a compact visual scene
when it helps explain the pending action. The scene should stay data-driven and
use labels/icons only; do not duplicate the kit template in Course Banner
Builder.

## High-risk Course Banner Builder areas

Course Banner Builder has interaction-heavy previews. The kit should style
these surfaces without changing plugin-owned DOM hooks:

- keep existing `data-*` attributes used by crop, drag, resize, undo and redo;
- avoid changing preview positioning, z-index or transform calculations in a
  visual-only pass;
- apply shared style through scoped plugin selectors and mixins;
- validate image crop/resize, border sliders, title dragging and slideshow
  previews after every sizeable visual change.

Prefer adding an adapter component in the plugin, for example
`_easyedu-harmonisation.scss`, instead of rewriting older functional SCSS.

Preview-modal chrome uses a common `1rem` inline rhythm. Keep any larger
padding on the body end edge when it reserves the preview action rail; only the
start edge, header and visible footer should be normalised by the kit. Title
editors whose scroll grid owns the padding should keep the outer body unpadded.

## Guide target naming

Use semantic target attributes in Course Banner Builder templates:

```html
<button data-easyedu-guide-target="create-layer">Add layer</button>
<section data-easyedu-guide-target="layer-list">...</section>
<button data-easyedu-guide-target="save-banner">Save</button>
```

Then configure the guide:

```js
init('[data-easyedu-guide-root]', {
  storageKey: 'local_coursebannerbuilder.easyedu_guide.seen',
  firstVisit: true,
  targets: {
    createLayer: '[data-easyedu-guide-target="create-layer"]',
    layerList: '[data-easyedu-guide-target="layer-list"]',
    sourcePickers: '[data-easyedu-guide-target="source-pickers"]',
    sourcePicker: '[data-source-dropdown="category"]',
    sourceParentPicker: '[data-source-dropdown="summary-sourceparent"]',
    saveBanner: '[data-easyedu-guide-target="save-banner"]'
  },
  paths: {
    basics: [
      {
        id: 'create-layer',
        title: 'Create a first layer',
        target: 'createLayer',
        completeOn: 'coursebannerbuilder:layer-created'
      },
      {
        id: 'organise-layers',
        title: 'Organise layers',
        target: 'layerList',
        completeOn: 'coursebannerbuilder:layer-moved'
      }
    ]
  }
});
```

For source-related guide steps, avoid targeting the Moodle page navigation,
generic section headers or the configured-source table. The table can be empty
when the user has not configured anything yet, so it is a poor onboarding
target. The stable targets are the actual source UI elements:

- `sourcePickers`: a plugin-owned wrapper such as
  `data-easyedu-guide-target="source-pickers"` around the category and custom
  field dropdowns;
- `sourcePicker`: `[data-source-dropdown="category"]`, the primary "Choose a
  source" dropdown;
- `sourceParentPicker`: `[data-source-dropdown="summary-sourceparent"]`, the
  configured source parent dropdown in the selected-source summary.

If a guided path needs to wait for a real submit button but visually show the
two dropdowns, keep `target` on the real action and use `highlightTarget` for
the dropdown wrapper:

```js
{
  id: 'select-source',
  title: 'Select source',
  target: 'selectSourceButton',
  highlightTarget: 'sourcePickers',
  completeOnClick: true
}
```

Do not point the step at a nav item or an empty table only because it has the
same text label.

After a real action succeeds:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
  detail: {
    path: 'basics',
    step: 'create-layer'
  }
}));
```
