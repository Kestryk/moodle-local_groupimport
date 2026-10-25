# EasyStud Waves 1-3 corrective RF4/RF5

## Scope

This source-only follow-up completes the remaining accepted hierarchy review
for `UI0038-RF4` (Participant, Group and Grouping) and `UI0049-RF5` (Mass
Import). It is limited to the local consumer stylesheet and the generated
Course Manager modal markup.

## Corrections

- Use the accepted Participant native-profile action as the exact reference
  for Group and Grouping footer height, spacing, border and button treatment.
- Keep Group and Grouping titles, field labels, values, counters and metadata
  badges on the same compact semantic roles and two-column proportions as the
  Participant detail surface.
- Make the Group/Grouping help affordance a keyboard-reachable local button
  with the CCB Slideshow question-mark geometry and hover-help data contract.
  It has no CCB runtime import or dependency.
- Apply the existing compact control token to the explicitly named Mass Import
  operational paragraphs. The page identity and introduction remain unchanged,
  as do import, preview, restore and export behavior.

## Preservation and exclusions

- No entity persistence, form names, values, modal routes or disclosure Motion
  lifecycle changes.
- No shared UI Kit or CCB source change, runtime, cache, fixture, preview or
  browser execution.
- No Mass Import parsing or workflow behavior change.

## Static validation

`tools/release/test-waves-1-3-rf4-contract.ps1` checks the Participant
reference mapping, Group/Grouping roles and proportions, local help control,
Mass Import paragraph selectors and generated Sass/AMD synchronization.
