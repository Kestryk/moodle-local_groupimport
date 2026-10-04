# Administration and compact filter follow-up

User additions are recorded as R10–R12 in the existing completion queue.
No additional worktree is needed. Human checklist remains open.

## Confirmed integration gaps

- Public colour picker selectors require an `.easyedu-ui` ancestor. Native
  Moodle administration did not supply it. The PHP wrapper repair is preserved
  in visual WIP `d93afc1`, not in the functional preview.
- The native administration adapter targets three profile-field selects by
  name, plus the identification multiselect. The newly added default-view
  select is absent. Importing styles does not automatically opt native Moodle
  markup into Kit components. Reconcile all setting types through a shared
  adapter/enhancement, retaining native names, values, dependencies and no-JS.
- Contrast is rejected in two places: `settings.php` validation and
  `local_groupimport_get_theme_colours()` runtime fallback. Removing only the
  form guard would save a colour that the interface then silently ignores.

## Proposed palette behaviour (not implemented)

Keep six-digit Hex syntax validation. Accept a wider decorative palette and
derive legible foreground/strong action variants where the chosen colour is
too light. Explain adjustment through a nonblocking canonical Kit notice.
Audit every affected token consumer before relaxing validation; primary is
currently both a background and an icon/text colour. A numeric threshold-only
change would not be safe. Preserve the configured colour in the admin picker.

Restore defaults should populate the seven existing colour controls from
their PHP defaults and synchronize swatch/Hex/error state. Native Save remains
required; no automatic configuration write. Include this on the Penpot admin
boards and cover keyboard/no-JS/read-only handling.

## Compact filters (not implemented)

Inventory existing Foundations Standard/Library before creating a variant.
Cover all filter roles, searchable single/multiple, selected summary, clear,
chevron, search, options, empty, disabled, invalid and keyboard focus. Use one
compact density modifier from canonical SCSS; preserve usable touch targets
on mobile rather than shrinking every hit area. Propagate EasyStud after the
canonical provider, then compare the actual More Filters and native admin.

## Penpot inspection status

EasyStud page 02 is accessible. Its three root boards are desktop 1440px,
tablet 768px and a board named Mobile/390 whose actual width is 454px. That
discrepancy needs inclusion in the responsive audit. The existing warning's
provider has not yet been verified; no claim that it matches Foundations.
The current connected document is EasyStud, not Foundations.
