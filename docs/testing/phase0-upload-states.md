# Phase 0 upload states

`tools/playwright/phase0-mass-admin-responsive.spec.js` covers the Mass Import
deposit at desktop, tablet and mobile widths as part of one supervised scenario.
It distinguishes the EasyStud deposit's drag highlight from Moodle's native file
upload progress.

## Drag highlight

The scenario dispatches a file-bearing `dragenter`, `dragover` and `dragleave`
to `.easyedu-file-deposit`. The deposit must add `is-dragover` while the file is
over it and remove the class when the pointer leaves. This state-only probe is
not dropped or uploaded. Enter through the body first, then the deposit: the
global veil must disappear without clearing the deposit highlight. Capture
`phase0-dragover-<viewport>.png` before leaving the deposit.

## Native draft upload

The scenario dispatches the CSV draft through Moodle's `.filepicker-filelist`
drop target. Moodle's `core_dndupload` handler owns the request and its
`.dndupload-progressbars` row. A Playwright route matches only
`/repository/repository_ajax.php?action=upload` and holds the request for at
most 10 seconds, long enough to capture the native uploading state. A `finally`
block releases the route and removes the interception even if an assertion
fails.

While the route is held, the scenario checks that:

- the progress row names the draft CSV and remains inside the deposit;
- the progress track remains inside the deposit and its ARIA progress bar starts
  at zero;
- the file picker button stays below (not over) the progress row and remains
  inside the deposit, and the preview button
  remains inside the upload card while disabled during upload;
- the cloud tile and glyph remain square and centred, using the shared icon
  geometry assertion.

The test captures this state as `phase0-uploading-<viewport>.png`. Once the
request is released, it checks that Moodle displays the uploaded filename and
removes the transient progress bar.

## Safety and validation status

The fixture is one generated CSV with a single synthetic participant row. The
scenario uploads it to Moodle's draft area and opens the import preview only;
it does not confirm or apply an import, change course membership, or save
administration settings. Each viewport uses a unique filename to avoid draft
name collisions.

This remains `local-supervised`: it requires an authenticated Moodle course,
the active runtime lease and a mutable user draft area.

The supervised run `easystud-authenticated-20260928T073603038Z-58848` passed
against runtime `3bbd07b` at desktop, tablet and 390px. Desktop and mobile
uploading captures were inspected: filename, progress and chooser are separate.
The strengthened run `easystud-authenticated-20260928T074244276Z-62256` also
passed on runtime `3d43b45` (source `dbd09b8`, canonical Kit `9ca120f`). It
checks global-to-local drag feedback and explicit progress/chooser separation
at all three widths. Captures are in that run's external artifact directory;
desktop/mobile uploading and drag-over evidence is pinned for 30 days.
No actual import or administration save was executed. Product Penpot was then
completed with desktop board `01e728c3-f1ef-80b3-8008-b5077a35e3e4`, containing
linked instance `01e728c3-f1ef-80b3-8008-b5077b99bda5` of Foundations Uploading
component `01e728c3-f1ef-80b3-8008-b455f30e0638`. Its descendants are contained
after the product-width overrides. The measured introduction-to-navigation gap
is 18px and is consumed through `.easyedu-page-header`. This is agent readback
and export evidence; human visual acceptance remains separate.

When holding a request, await the route callback with a polled counter (the
request event can arrive first). Release and await the pending continuation
before unregistering the route. Otherwise the test can fail with a false
`Route is already handled` cleanup error. This is a test contract, not a
product retry strategy. Browser success does not imply human Penpot acceptance.

The next runtime reload exposed a bootstrap race: the AMD ready attribute could
already be `1` before its MutationObserver was attached, leaving the page in the
fail-open `degraded` state. The bootstrap now checks the current attribute once
immediately after observation; this preserves the degraded deadline for real
failures and does not weaken the browser assertion that normal startup is
`ready`.

After that correction, supervised run
`easystud-authenticated-20260928T081351958Z-25900` passed on runtime `c7d9b41`
at desktop, tablet and 390px. It also asserts the measured 18px page-header
gap. This is the final automated checkpoint for this correction lot; visual
human acceptance remains pending.
