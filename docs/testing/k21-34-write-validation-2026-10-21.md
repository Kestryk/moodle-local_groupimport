# K21-34 — Bounded atomic native writes

Base: `0802e4c6`, after K21-33. No change to POST/session/login/capability guards.

- `manage.php` creation already validates every generated name through
  `local_groupimport_extract_create_names()`. Its existing 500-name aggregate
  limit and 254-character per-name limit remain. Both POST rename fallbacks now
  call the same validator before any update.
- AJAX `renamegroup` now validates names like `renamegrouping`.
- `duplicategroup`: count memberships plus grouping links before reading the
  collections or writing, using the existing `bulk_action::MAX_ITEMS = 500`.
  Recheck the actual loaded count when entering `bulk_action::run`. The new
  group, members and assignments commit together. A native API returning false
  aborts the transaction, just like an exception.
- `duplicategrouping`: preflight at most 500 links; create/assign in one
  transaction. Course filtering and native APIs/events are retained.
- `deletegroupings`: bound the submitted array, including duplicates, at 500;
  deduplicate inside one transaction and preserve the existing foreign-course
  exclusion. A failed native deletion rolls back earlier deletions.

`test-k21-write-paths.cjs <absolute PHP CLI path>` executes the actual extracted
endpoint branches with native API/transaction doubles: **19 checks PASS**.
It covers successful responses, both POST name rejections, multibyte overlength
names, foreign-course objects, mid-batch native false returns, rollbacks,
exactly 500 allowed relationships and oversized requests rejected before writes.
The existing S4 fixture passes **44 checks each** for `ajax` and `manage`;
escaping and filter-engine contracts pass. PHP syntax and full MoodleCS pass.

This is isolated execution, not a native SQL transaction/HTTP certification.
The copies used for the preceding visual audit were not redeployed. No AMD or
style build is required. The unrelated `addgroups` transaction observation in
the broader refactoring report is outside these three requested actions.

Intake JSON is not edited: it already contains unresolved conflict markers at
the base. This document and the changelog retain the delivery record.
