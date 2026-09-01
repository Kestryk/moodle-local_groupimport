# EED-UI-2026-0052 - canonical contextual help

Date: 2026-09-01

## Inventory

The EasyStud source contains one question-mark renderer,
`renderFieldHelp`, with two non-empty consumers in the Group settings modal:

- Enrollment key help;
- Group image help.

The `fa-question` and `fa-question-circle` glyphs in Guide and tutorial content
are decorative illustrations (`aria-hidden="true"`), not contextual-help
triggers. Controls using `data-easystud-hover-help` elsewhere are named action
buttons with their own icons, not question marks. The retired
`local-groupimport-easystud-help-dot` selector had no markup consumer.

## Migration

- Embedded only the required `EED-KIT-2026-0009` tooltip primitive and its
  component contract from UI Kit source `f9d8247`.
- The EasyStud modal selector now includes
  `easyedu.contextual-help-control` directly; it no longer duplicates geometry,
  border, colour, hover, focus or disabled states.
- Removed the foreign `local-course-banner-builder-help-dot` class and the
  unused local 1.35 rem help-dot variant.

The native button, `aria-label`, `data-easystud-hover-help`, focus binding and
popover creation/removal code are unchanged. Enrollment copy and the accepted
Group image toggle are outside this visual migration.

## Validation boundary

Sass and Course Manager AMD are rebuilt from source. Static contracts reject
the retired 1.35 rem/local visual variants and preserve the two semantic help
sources. Runtime appearance and browser popover behavior remain part of the
cumulative managed-preview review.
