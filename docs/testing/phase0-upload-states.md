# Phase 0 upload states

`tools/playwright/phase0-mass-admin-responsive.spec.js` covers the Mass Import
deposit at desktop, tablet and mobile widths as part of one supervised scenario.
It distinguishes the EasyStud deposit's drag highlight from Moodle's native file
upload progress.

## Drag highlight

The scenario dispatches a file-bearing `dragenter`, `dragover` and `dragleave`
to `.easyedu-file-deposit`. The deposit must add `is-dragover` while the file is
over it and remove the class when the pointer leaves. This state-only probe is
not dropped or uploaded.

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
- the file picker button remains inside the deposit and the preview button
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
the active runtime lease and a mutable user draft area. The current change is
specification and documentation only. No browser, runtime, credential or
server validation was performed for this update.
