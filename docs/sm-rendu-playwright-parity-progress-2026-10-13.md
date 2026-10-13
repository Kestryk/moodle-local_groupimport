# SM-RENDU — Playwright parity progress

Owner Codex2. Product base `c9e1fed8`. Test branch
`work/port4719pg3/easystud-sm-rendu-specs-20261013`.

The initial test commit is `0c03e86b`. Follow-up test preparation corrects
the mobile distinction between the flat Groups catalogue and the Groupings
tree, known-name reads from a catalogue that may still be hidden, and the
difference between the visible page count and the displayed global total.
Product JavaScript, templates, styles, renderer and version are unchanged.

## Shared rules

- `easystud-safe-ajax-reads.cjs` adds only `local_groupimport_get_state` and
  `local_groupimport_get_details` to each spec's existing local read list.
  All 188 routed specs delegate to it; mutation guards remain in place.
- `easystud-lazy-tree.cjs` finds a visible populated grouping by its native
  count badge, opens it and waits for its child cards. Seventeen specs use it.
- Mobile Groups tests use the visible flat catalogue. A grouped-group Move
  test activates Groupings before opening the tree.
- Filtered select-all chooses a group from the current page, verifies that
  displayed result totals narrow, and checks the actual visible selected IDs.
  It does not treat all cards retained in legacy DOM as the current page.
- Five inline-identifier scenarios read an existing group name from the
  native filter's options, which exist before the catalogue is materialised.

## Verification and retained diagnostics

The static contract and JavaScript syntax checks pass. The contract covers
the 188 AJAX routes, 17 lazy-tree call sites and visible-page selection.

Existing course 5 on Perf contains 24 participants, 54 groups and 14 groupings;
`tools/sm/check-state.php` reports parity PASS. No new fixture was created.

The corrected Move test completed all nine combinations (1600/768/390 ×
participants/groups/grouped groups) in legacy mode: Playwright exit code 0.
Its wrapper failed later while registering a path beyond Windows MAX_PATH.
The original raw run is retained as an infrastructure failure, with complete
credential/child/lease cleanup; it is not relabelled as a successful wrapper.
Raw run: `easystud-authenticated-20261013T175151302Z-20700` under the external
`easystud-sm-rendu-spec-parity-20261013/focused-final/after/legacy` directory.

The paired rerun uses the shorter external root
`C:/dev/artifacts/es-parity-N2-20261013`. It selects 20 specs (24 test cases,
including the accessibility smoke tests) and records first error, source line,
source-file hash, mode, captures and wrapper run for each result. Final counts
and code-origin discrepancies are pending; no full parity PASS is claimed.

`Invoke-SmRenduSpecParity.ps1` uses the saved-credential wrapper once per
discovered test, with a fresh profile and Perf leases. It sets only the copy's
rendering mode and the QA account's current Guide welcome preference, then
restores its captured previous values and purges copy caches in `finally`.
Raw matrices, screenshots, discovery and cleanup stay outside Git.

The first diagnostic observed a transient loading state; a later diagnostic
reached ready without JavaScript errors. `sm-rendu-runtime-diagnostic.spec.js`
records the controller/readiness timeline, grouping counts and a capture after
a bounded real-ready wait. Any persistent product discrepancy is returned to
Claude with the exact spec, line, mode and capture.

## Run and next gates

```powershell
.\tools\playwright\Invoke-SmRenduSpecParity.ps1 `
  -CredentialLoaderPath <local-DPAPI-loader> `
  -OrchestrationModulePath <platform-orchestration-module> `
  -MoodleRoot <dedicated-Perf-Moodle-root> `
  -ArtifactRoot <short-external-artifact-root> `
  -Spec <spec-file-list> -Stage after
```

Run the same selected cases against the retained original `c9e1fed8` source
snapshot with `-AllowedSpecRoot <snapshot>/tools/playwright -Stage before`.
Compare status plus first error/source line, keeping historical assertion
failures separate from mode differences. Additional routed specs remain to be
executed in both modes after the focused matrix.

These helpers/specs are local-supervised candidates: auth, an existing course
and copy-only configuration preparation are required. CI promotion needs a
portable disposable environment. No Kit/component AI contract change applies
to test-only tooling. The combined human checklist remains OPEN.
