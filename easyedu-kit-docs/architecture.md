# EasyEdu UI Kit Architecture

The EasyEdu UI Kit is an embedded design system for independent Moodle plugins.
It is copied into each plugin at build/development time; Moodle administrators do
not need to install a shared dependency.

## Goals

- Keep EasyEdu plugins visually consistent.
- Keep every plugin installable on its own.
- Keep Moodle themes able to override the visual layer through public CSS
  custom properties.
- Keep SCSS readable for humans who need to maintain, theme or audit it.
- Provide reusable guide/onboarding patterns, not only static component styles.

## Package layers

```text
easyedu-ui-kit/
  scss/easyedu/  Public SCSS tokens and mixins.
  guide/         Generic guide AMD/template/language foundation.
  navigation/    Normalized navigation context, templates and controller.
  docs/          Component API and integration notes.
  examples/      Optional plugin-specific examples.
```

## SCSS API model

The kit avoids emitting global CSS by default. Plugins import the kit and include
mixins under their own root selectors:

```scss
@use "easyedu" as easyedu;

.local-coursebannerbuilder {
  @include easyedu.token-defaults;
  @include easyedu.guide-shell;
}
```

This keeps selectors plugin-owned and makes theme overrides predictable.

## Naming conventions

- Public custom properties use `--easyedu-*`.
- Plugin compatibility aliases may exist, but should stay in plugin-specific
  compatibility mixins.
- Reusable classes in templates use `.easyedu-*`.
- Plugin classes should remain plugin-prefixed, e.g. `.local-coursebannerbuilder`.

## Theming contract

Themes should override variables on a plugin root:

```scss
.local-coursebannerbuilder {
  --easyedu-primary: #005f73;
  --easyedu-accent: #2a9d8f;
  --easyedu-card-radius: 1rem;
}
```

Avoid overriding internal selectors unless a theme intentionally wants a deeper
visual customisation.

## Extraction policy

When extracting from EasyStud/groupimport:

1. Identify the reusable behaviour and visual intent.
2. Convert hard-coded values to tokens where useful.
3. Create a mixin with a Moodle/plugin-neutral name.
4. Keep plugin-specific selectors out of the kit.
5. Document expected HTML, tokens and variants.
6. Add a compile check before tagging.

Navigation extraction additionally requires one permission-resolved server
model for both desktop and responsive wrappers. The compact controller may own
panel state and focus, but it must not reconstruct items from desktop HTML.

Guide synchronization additionally treats the controller, template and guide
SCSS as one reviewed source set. Consumers preserve their Moodle AMD namespace
and product adapter configuration while exposing both shared lifecycle methods,
`init()` and `destroy()`. See
`docs/components/guide-adapter-integration.md`.

## Versioning

- Patch versions: compatible visual/component additions.
- Minor versions: new component families or guide behaviours.
- Major versions: breaking selector, token or mixin changes.
