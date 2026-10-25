# EasyStud Wave 10 - Administration identity, Skeleton and page order

## Scope

This source-only wave combines three compatible presentation corrections:

- `EED-UI-2026-0033-RF5`: the Administration Skeleton mirrors the four real
  settings sections and their eleven full-width overview/control blocks;
- `EED-UI-2026-0034-RF1`: Administration receives the common EasyStud eyebrow,
  current-page title and short description;
- `EED-UI-2026-0051-RF2`: Student Management renders its existing title,
  description and Navigation before content, in that order.

## Preservation boundary

The change does not alter Moodle `admin_setting_*` controls, the learner-field
multiselect, stored configuration, dependency rules, course permissions,
participant/group/grouping behavior or any AJAX endpoint. The accepted
Administration loading lifecycle, no-script fallback, fail-open deadline,
Motion/reduced-motion handling and `aria-busy` ownership remain unchanged.
Mass Import already has the requested title-description-Navigation order and is
left intact.

## Validation boundary

Static validation covers PHP and language syntax, UTF-8 language parity, the
focused Wave 10 source/generated-CSS contract, established Administration
loading and typography contracts, the official Sass build, release validation
and `git diff --check`. No runtime promotion, cache purge, fixture mutation,
preview or browser session is part of this source wave.

Human review after a managed preview must compare Administration loading and
ready states at desktop and narrow widths, then check Student Management at the
same widths. Acceptance requires representative Skeleton geometry, the common
Administration identity, visible separation between description and Navigation
and no change to the native multiselect or settings behavior.
