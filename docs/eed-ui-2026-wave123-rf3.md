# EasyStud Waves 1-3 corrective RF3

## Scope

This source-only correction follows the visual review of cumulative EasyStud
preview `9589959`. It is limited to the remaining hierarchy and alignment
issues in Administration, Participant/Group/Grouping modals and Mass Import.

## Corrections

- Administration operational headings now use the quieter section role rather
  than the stronger panel-title role. The Standard Moodle fields and Custom
  profile fields labels use the subordinate control-label tier and no forced
  uppercase treatment, so they cannot dominate their parent heading.
- Participant, Group and Grouping disclosure chevrons are before their titles
  in the generated markup, with an explicit gap and matching grid columns.
  Their titles, counters, field labels and values use the same compact semantic
  tiers. Group image help spacing and the delete-picture checkbox consume the
  existing modal help/toggle primitives.
- Nested Mass Import operational surfaces explicitly inherit the compact
  Student Management baseline. The accepted page identity and introductory
  description are excluded. A one-rem block gap separates that introduction
  from the shared navigation.

## Preservation and exclusions

- No Administration settings key, native multiselect behavior, Moodle form
  submission or stored value changes.
- No entity persistence, modal route, list content, CSV export, disclosure
  Motion lifecycle or reduced-motion behavior changes.
- No Mass Import parsing, preview, import, Restore or Export behavior changes.
- No shared Kit source migration, runtime, cache, fixture, preview or browser
  execution. The broader typography, form, modal and navigation catalogue is
  owned by the dedicated Kit/adoption programme.

## Static validation

`tools/release/test-waves-1-3-rf3-contract.ps1` asserts semantic hierarchy,
left-chevron DOM order, compact field/value tiers, checkbox/help consumption,
Mass Import baseline and intro-navigation spacing in source and generated
assets. Existing modal, typography and release contracts remain regression
gates.
