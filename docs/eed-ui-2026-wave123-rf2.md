# EasyStud Waves 1-3 corrective RF2

## Scope

This source-only correction follows the human review of cumulative EasyStud
preview `f0bc74f`. It repairs only the rejected Wave 1-3 surfaces routed to
`EED-UI-2026-0038-RF2`, `0039-RF2`, `0041-RF2`, `0049-RF3` and the shared
ungrouped-title line box from `0048-RF2`.

## Root causes and correction

- Administration applied the UI base role to the complete Moodle page ID. Its
  inherited font properties therefore reached unrelated page chrome and the
  CCB banner above the form. The role now begins at `#adminsettings`; native
  settings controls and the accepted identifier multiselect stay intact.
- Import-history metadata and actions had matching internal geometry but no
  block rhythm between their two rows. Consumer spacing now separates them at
  desktop and narrow widths without changing Restore or Export behaviour.
- Moodle's profile image keeps a native `.userpicture` inline margin. Matching
  radii could not remove the resulting right seam; the modal avatar now resets
  that margin and padding inside its clipping surface.
- Participant list cards were stretched by their shared CSS-grid row. They now
  align at the start, expose explicit aligned chevrons and share one reusable
  Motion binding. The same binding is attached to Group/Grouping metadata
  disclosures, with native `details` retained for reduced motion.
- Group and Grouping headers previously used the entity family as eyebrow and
  the entity name as modal title. All three entity families now use the same
  `EASYSTUD` plus `Participant details`, `Group details` or `Grouping details`
  hierarchy; entity names remain in their editable/readable body fields.
- The earlier Mass Import pass only remapped selected headings. Ordinary copy
  still inherited the larger surrounding Moodle size, and a prior identity
  layer overrode restored-result headings with a section title. The view now
  owns a compact body baseline, preserves the accepted page introduction and
  remaps result headings to the semantic compact control tier.
- Ungrouped Group titles already consumed the shared title role, but their
  consumer shell still clipped the last pixels of descenders. A narrow
  ungrouped-only padding correction completes that shared line-box fix.

The two Mass Import modal close labels also used the invalid
`get_string('close', 'moodle')` lookup observed in PHP logs. They now use the
existing core `closebuttontitle` string.

## Explicit exclusions

- Entity-data invalidation and re-fetch after mutations (`EED-UI-2026-0050`).
- Mass Import page-introduction/navigation order (`EED-UI-2026-0051`).
- Group Filepicker harmonisation, global Kit modal migration and Navigation.
- Preview publication, cache purge, fixtures and browser execution.

## Static validation boundary

`tools/release/test-waves-1-3-rf2-contract.ps1` asserts the repaired source and
generated AMD/CSS contracts. The established modal, typography, history and
release contracts remain regression gates. Human review is still required
after a separately coordinated managed-preview promotion.
