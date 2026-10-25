# EED-UI-2026-0038-RF1 - Participant, Group and Grouping card modals

## Scope

This consumer-only EasyStud correction covers the Participant detail modal and
the existing Group and Grouping settings modals. It keeps their current Moodle
routes, data hooks, form submission and AJAX actions intact.

## Delivered behaviour

- Modal titles, participant identity and related-list labels use the existing
  embedded EasyEdu semantic typography hierarchy.
- The Group and Grouping modal body is an internal scroll owner, so long forms
  and high-volume metadata remain inside the viewport. Related lists retain
  their bounded internal scrolling and do not create horizontal overflow.
- Group and Grouping Save, Cancel and Edit in Moodle actions share one footer,
  common compact action height and the Kit hover/focus/disabled treatment. The
  Participant native Moodle-profile action keeps the same compact geometry with
  a separate, readable top edge.
- Participant Roles, Groups and Groupings remain separate native `details`
  controls. With normal motion enabled, only the selected list content uses
  the existing cancellable Motion disclosure. With reduced motion, the browser
  keeps its immediate native `details` state change.
- Moodle profile images now use the avatar clipping radius, which removes the
  exposed white corner seam. The existing open-card inner left focus rail is
  intentionally preserved and is outside this modal-only change.

## Explicit exclusions

- Group image Filepicker markup, upload/drop behaviour and Kit 0007 work.
- Moodle business logic, AJAX endpoints, permissions and persistence.
- Mass Import, Administration and Navigation surfaces.
- Browser/managed-preview execution and runtime fixture changes.

## Static validation boundary

`tools/release/test-card-modal-contract.ps1` checks the source and generated
CSS hooks for scrolling, typography, avatar clipping, action alignment,
contained counters, the normal/reduced-motion disclosure split, and the
unchanged Group Filepicker boundary. It does not replace a browser check.

The future visual review should open one Participant, one Group and one
Grouping card with short and large related lists. Verify that each participant
section can open/close independently, reduced motion is immediate, the modal
body scrolls without page overflow, all three Group/Grouping actions align,
and an open card still keeps its inner left focus edge.
