# Typography

EasyEdu inherits the active Moodle theme font. It does not ship or force a
separate typeface. Shared roles keep administration interfaces consistent while
allowing themes to remain the visual owner of the font family.

## Public roles

- `type-page-title`: main heading for one plugin view.
- `type-modal-title`: Moodle modal heading.
- `type-panel-title`: primary title inside a management panel.
- `type-section-title`: compact subsection heading.
- `type-card-title`: repeated object or settings-card heading.
- `type-control-label`: important field or action label.
- `type-body`: ordinary administration copy.
- `type-caption`: secondary metadata and help text.
- `type-eyebrow`: short uppercase category label.

The roles use one font family, a short size scale and four weights. Letter
spacing is always zero so typography remains stable across Moodle themes and
languages.

Penpot Foundations uses Inter as the visual proxy for this contract. Runtime
SCSS keeps `--easyedu-font-family-ui: inherit`, so Moodle's active theme remains
the font provider. A product must never introduce another page-title alias or
local title scale to imitate the Penpot specimen.

Shared utility controls use the regular weight for disclosure labels, Sort
captions and selected Sort values. Result-count badges use the semibold weight
to remain scannable without competing with headings. Consumers must use these
roles consistently across views and responsive breakpoints.

```scss
.local-example {
  @include easyedu.token-defaults;

  h1 {
    @include easyedu.type-page-title;
  }

  .local-example-panel-title {
    @include easyedu.type-panel-title;
  }
}
```

## Scope boundary

These roles apply to application chrome: navigation, headings, labels, panels,
tables and modal titles. They must not replace user-configurable typography.
For example, Course Banner Builder banner and slideshow text continues to use
its runtime font, size, weight and line-height variables.

## Import audit checklist

- Keep `--easyedu-font-family-ui: inherit` unless a Moodle theme overrides it.
- Map existing headings by semantic role, not by their current pixel size.
- Do not introduce a fifth font weight for a local variation.
- Do not add negative or decorative letter spacing.
- Check long translated headings at narrow widths.
- Keep truncation and wrapping decisions in the consuming component.
- Exclude authored preview/final content from administration typography passes.
