# EasyStud release test checklist

Use this checklist for a release candidate or before merging a branch that
changes EasyStud behavior. Attach command output or a link to retained CI
evidence.

## Repository and compatibility

- [ ] The intended plugin repository and branch are confirmed.
- [ ] The worktree contains only understood changes.
- [ ] `local_groupimport` remains the technical component name.
- [ ] `version.php`, savepoints and `db/upgrade.php` are coherent.
- [ ] Upgrade from the historical import-only version has been tested.
- [ ] Missing `enablesimplifiedview` preserves the legacy-safe behavior.
- [ ] Packaging excludes `tools/`, `docs/` and embedded development contracts.
- [ ] No credentials, local URLs, reports or browser state are tracked.
- [ ] `git diff --check` passes.

## Moodle coding gates

- [ ] `moodle-plugin-ci phplint`
- [ ] `moodle-plugin-ci phpcs --max-warnings 0`
- [ ] `moodle-plugin-ci phpdoc --max-warnings 0`
- [ ] `moodle-plugin-ci validate`
- [ ] `moodle-plugin-ci savepoints`
- [ ] `moodle-plugin-ci mustache`
- [ ] `moodle-plugin-ci grunt --max-lint-warnings 0`
- [ ] `moodle-plugin-ci phpunit`
- [ ] `moodle-plugin-ci behat --profile chrome`

For every unchecked command, record whether the reason is missing tooling,
missing fixture, an upstream Moodle issue or a confirmed plugin failure.

## Functional acceptance

- [ ] Moodle Participants navigation opens EasyStud when enabled.
- [ ] Import-only navigation remains available when EasyStud is disabled.
- [ ] Complete, Participants & Groups and Groups & Groupings views work.
- [ ] Participant compact/full-detail transitions preserve actions and focus.
- [ ] Single/multiple selection and type exclusivity work.
- [ ] Clear selection resets all visible and hidden selection state.
- [ ] Move, delete and remove actions work through buttons and modals.
- [ ] Desktop context menu and mobile long press expose equivalent actions.
- [ ] Participant-to-group and group-to-grouping drag/drop work.
- [ ] Non-drag alternatives complete the same operations.
- [ ] Pagination, Select all/Select results and sort controls stay coherent.
- [ ] Participant, group and grouping filters/search reset correctly.
- [ ] Group/grouping create, duplicate, rename, settings and delete work.
- [ ] Identifier entry resolves only unambiguous users or groups.
- [ ] Toasts report affected and already-existing counts.
- [ ] Empty and filtered-empty states update without reloading.

## Mass import

- [ ] CSV preview interprets enabled identifiers.
- [ ] XLSX preview interprets enabled identifiers.
- [ ] Unknown, ambiguous and duplicate rows are reported.
- [ ] Preview selection and search do not mutate course data.
- [ ] Replace file works from preview.
- [ ] Applying an import creates the expected memberships and groupings.
- [ ] History records enough evidence to understand the import.
- [ ] Restore returns a disposable course to the selected import state.
- [ ] Downloaded reports and examples contain no real personal data.

## Guide

- [ ] All slides fit the modal at supported viewport sizes.
- [ ] Previous/Next, keyboard navigation and progress work.
- [ ] Show in interface highlights the intended target below Moodle navigation.
- [ ] Highlight follows scroll/resize and clears on dismiss or timeout.
- [ ] Locked slides and unlock paths retain their expected behavior.
- [ ] Guided checklists validate real actions and show completion feedback.
- [ ] Minimise, close and Return to guide preserve or clear state correctly.
- [ ] Empty-course demonstrations do not depend on missing real cards.

## Accessibility and responsive

- [ ] Playwright axe smoke has no critical or serious plugin-region violations.
- [ ] Moodle Behat accessibility smoke passes where Behat is configured.
- [ ] Keyboard-only protocol in `accessibility.md` is complete.
- [ ] Collapsed member lists keep clipped actions out of `Tab`, restore them
      when opened and return focus to their disclosure control on collapse.
- [ ] Modal names, focus trap, close path and trigger focus return are correct.
- [ ] Focus indicators are visible and not clipped.
- [ ] Colour is not the only selection, error or status indicator.
- [ ] Desktop 100% and 200% zoom have no horizontal page overflow.
- [ ] 390, 768 and 1024 pixel responsive checks pass.
- [ ] Mobile action tray, long press and stacked workspaces are usable.
- [ ] Every drag operation has a non-drag alternative.

## Matrix and release decision

- [ ] Moodle 5.1 minimum-version validation is recorded.
- [ ] Moodle 5.2 platform matrix validation targets the release commit.
- [ ] Required matrix checks passed after the last code change.
- [ ] Flaky or opt-in tests are identified and are not presented as passing
      required gates.
- [ ] Known failures have an owner, severity, workaround and target release.
- [ ] Changelog describes the user-visible and testing changes.
- [ ] Release decision and evidence location are recorded.
