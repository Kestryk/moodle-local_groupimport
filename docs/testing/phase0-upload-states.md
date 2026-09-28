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
The additional global-to-local drag transition assertions require the next run.

When holding a request, await the route callback with a polled counter (the
request event can arrive first). Release and await the pending continuation
before unregistering the route. Otherwise the test can fail with a false
`Route is already handled` cleanup error. This is a test contract, not a
product retry strategy. Browser success does not imply human Penpot acceptance.
