# EasyStud SCSS structure

`easystud.scss` is the Sass entry point. It should only orchestrate partials with `@use` so the visual system can be reused in other plugins, such as Course Banner Builder.

## Folders

- `easyedu/`: plugin-agnostic visual language. This is the first layer to copy into another plugin. It contains public tokens, documented mixins and theme override examples.
- `abstracts/`: shared design tokens and CSS custom properties.
- `components/`: reusable EasyStud UI pieces such as cards, filters, modals, tutorial, tooltips and drag/context interactions.
- `views/`: page-specific layouts, currently the mass import view.
- `responsive/`: breakpoint-specific overrides.
- `utilities/`: shared animations and motion helpers.

## Shared EasyEdu tokens

The reusable public variables are named `--easyedu-*`. The current plugin keeps backward-compatible aliases named `--local-groupimport-easystud-*`, but new themes and plugins should prefer the generic names.

Recommended transfer path for another plugin:

1. Copy `scss/easyedu/`.
2. Import `easyedu` in the target plugin entry point.
3. Include `@include easyedu.token-defaults;` on the target plugin root selector.
4. Build target-specific compatibility aliases only if the plugin already has existing custom properties.

Example:

```scss
@use "easyedu" as easyedu;

.local-coursebanner-builder {
  @include easyedu.token-defaults;

  color: var(--easyedu-text);
}
```

## Moodle theme overrides

Most colours, radii and spacing are exposed as CSS custom properties on `.local-groupimport-easystud` and `.local-groupimport-import`. A Moodle theme can override them by targeting those plugin roots instead of editing compiled CSS.

Example:

```scss
.local-groupimport-easystud {
  --easyedu-primary: #005f73;
  --easyedu-accent: #2a9d8f;
  --easyedu-radius: 0.9rem;
}
```

See `easyedu/_theme-overrides.example.scss` for a fuller example.

For the portable kit details and mixin examples, see `easyedu/README.md`.

## Synchronising the embedded kit

The embedded tree is reconciled in bounded batches. Its pinned source commit,
canonical tree hash and current full-tree parity flag live in
`easyedu-kit-docs/easyedu-kit.json`. Do not claim a complete Kit copy while
`fullTreeIdentical` is `false`; follow the canonical drift ledger and preserve
the explicitly deferred Student management, Guide and navigation files.

Plugins remain independent for Moodle users, but maintainers can synchronise the
shared kit into each plugin with:

```powershell
.\tools\sync-easyedu-kit.ps1 -TargetPluginRoots "C:\path\to\local\coursebannerbuilder"
```

The script replaces `scss/easyedu/`; run it only after every deferred drift row
has been promoted or moved out of the embedded tree. Plugin-specific component
files are not touched.

## Compilation

After editing SCSS, compile from the plugin root:

```powershell
sass scss\easystud.scss styles.css --no-source-map
```
