# Student Management workspace preferences

## Product behavior

Administrators can now control the initial Simplified student management
workspace without changing its established interactions:

- **Show Complete view** includes or removes the combined desktop workspace;
- **Default student management view** selects Participants & groups, Complete
  view, or Groups & groupings when the manager opens;
- when Complete view is hidden but remains stored as an older default, the
  server safely falls back to Participants & groups;
- on compact layouts, the desktop structure preference opens **Groups** while
  the other desktop preferences open **Participants**. The native mobile
  Participants / Groups / Groupings switcher remains intact.

Missing settings preserve the historical three-view experience and Complete
view default. This protects existing sites until an administrator makes an
explicit choice.

## Implementation contract

`local_groupimport_get_workspace_layout_preferences()` is the sole
normalization point. PHP renders only available desktop controls and publishes
the normalized desktop/mobile defaults as root data attributes. The existing
AMD controllers consume those attributes and keep the existing Motion swap;
they do not create a parallel transition.

The loading Skeleton mirrors the two- or three-control desktop composition so
the hidden Complete view does not flash during bootstrap.

## Validation boundary

The static contract verifies settings, normalization, conditional markup and
preference-aware AMD initialization. PHPUnit covers missing values, a stale
hidden Complete default and the compact structure mapping. A managed Moodle
preview must still verify the three-view default, two-view configuration and
compact initial workspace before this behavior is considered browser-proven.
Human acceptance remains part of the combined EasyStud checklist.

The focused local-supervised scenario is
`tools/playwright/Invoke-EasyStudWorkspacePreferencesSupervised.ps1`. Its
fixture holds the dedicated write lease, records both prior configuration
values outside Git, applies the two-view/structure-first case, blocks every
plugin business request and restores the exact missing-or-present state in
`finally`.

## Moodle 5.1 preview checkpoint

Source commits `0cfacb4` and `983ac71` were applied to the clean local preview
as `6793374` and `c2d5270`. The feature code and supervised test candidate are
therefore present in the served checkout.

Historical checkpoint only: the cache/browser gate was blocked before fixture setup; the Moodle 5.1 MariaDB
process does not start because its data directory lacks `aria_log.00000001`
and referenced `phpmyadmin/pma__*.ibd` tablespaces. The cache purge consequently
returns `Database connection failed`. No workspace preference was changed and
the supervised fixture did not execute. Database recovery is a separate
runtime operation; source/static readiness does not count as browser proof.

## 2026-10-04 current verification boundary

The historical database startup failure is no longer a current blocker:
managed cache purges and authenticated non-mutating Navigation/card-search
checks now pass on Moodle 5.1. The view-preference static contract passes again.
This does not certify persisted administrator preferences or the two-view
fixture scenario, which has not been executed in this continuation. Keep the
dedicated configuration-fixture/write-lease gate separate from read-only
open/Close audits; no setting was changed by this verification.
