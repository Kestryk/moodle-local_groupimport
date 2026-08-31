# EED-UI-2026-0034 - EasyStud typography and identity

## Scope

This consumer lot maps existing EasyStud application chrome to the semantic
typography roles established by EasyEdu UI Kit 0005. It covers Simplified
Student Management, Mass group import and the EasyStud Administration page.

The active Moodle theme remains the font owner. EasyStud does not load or
force a typeface. Page identities, panel and modal titles, section headings,
control labels, body copy and eyebrows use the existing Kit size scale and its
regular, medium, semibold and strong weights. Decorative negative tracking and
local numeric weights are not introduced by this adoption layer.

## Consumer mapping

- Student Management keeps its existing page structure, card title mixins,
  count badges and accepted global controls. Its eyebrow, panel titles, column
  labels, filter labels and modal titles now consume the semantic Kit roles.
- Mass group import uses `type-page-identity` for its visible page title and
  aligns its eyebrow, introduction, cards, field labels and report headings to
  the same hierarchy.
- Its page and upload-section headings no longer carry Bootstrap `h4`/`h5`
  utility classes: the Kit roles own their size, weight and line height,
  matching CCB and Student Management.
- The shared EasyStud card-title role reserves a 1.35 line height so lowercase
  descenders remain visible in every card title, including later cards in a
  list.
- Administration replaces the heavy Automatic user identification family with
  page, panel, section and control-label roles while retaining Moodle's native
  form markup and all current setting semantics.
- Administration RF1 adds the common EasyStud eyebrow, an Administration page
  title and a short description before the native settings sections. The
  identity is a non-setting heading, so it changes no stored value, dependency
  rule or multiselect behavior.

## Non-regression boundary

This lot changes typography only. Navigation and Guide typography belong to
`EED-UI-2026-0040`; Administration multiselect composition belongs to 0039;
Mass Import actions and lifecycle belong to 0041. Pagination, responsive
geometry, Skeleton states, generated markup and JavaScript are unchanged.

Student Management RF2 renders its existing title selector, description,
Navigation and content in that exact order. Mass Import already follows the
same identity-introduction-Navigation sequence and is retained unchanged.
Human visual review remains required after a separately authorized preview.
The source/static handoff does not claim browser acceptance.
