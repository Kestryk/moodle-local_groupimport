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
