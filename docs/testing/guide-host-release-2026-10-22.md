# Guide close after an external native fullscreen exit

Source baseline: `9dd3076e`. The earlier fix already waited for host release when
Close itself exited native fullscreen. It did not cover a browser exit followed
quickly by Close: browser ownership was gone, so both the controller's early
return and the modal's ownership-only guard bypassed the pending release.

## Native reproduction and result

Chromium headless on Moodle 5.1 and 5.3, authenticated Student Management, 1600
px. Native fullscreen is entered through its visible control. The external-exit
case uses the real `document.exitFullscreen()` API, then clicks Close without
forcing it. The parked host and browser ownership are measured independently.
Motion levels use their real scope attribute; no duration or fullscreen event
is stubbed. No account, course or membership is created.

| External exit then Close | Host exposed before, 5.1 | Before, 5.3 | After, both |
|---|---:|---:|---:|
| Full animation | 99.5 ms | 41.6 ms | 0 ms |
| Reduced | 101.8 ms | 142.3 ms | 0 ms |
| Minimal | 220 ms | 256.1 ms | 0 ms |

Each version also passes ordinary Close and Close directly from native
fullscreen: **5/5 per version**. After the fix, no sampled frame hides the modal
while blocks remain parked. Card position/size and window scroll deltas are
zero in every case; no JavaScript or console error is recorded.

The final 5.1 confirmation uses the dedicated runtime and course 5, with the
loaded `isHostParked` API checked in every snapshot. An earlier pool run also
passed, but subsequent external source changes on that runtime prevent using it
as the final source-pinned proof. Those concurrent files were preserved. The
5.3 and final dedicated 5.1 results are the ten cases counted below.

The affected fullscreen controller is identical before and after the title/tab
layout change. Its existing ownership-only guard is also present on the
reported production source. The measured fault is a release race, not evidence
that the new title row requires different parked dimensions. No K22 layout,
SCSS, placeholder size, timer or animation duration is changed.

## Implementation and source boundary

The controller now exposes `isHostParked()` and awaits the release promise even
when browser fullscreen ownership has already ended. Modal Close awaits the
controller while either state is active. The separate Escape handler's existing
semantics are retained. The shared Kit, embedded controller and AMD adapter use
the same controller and Close implementation.

The embedded/canonical controller had not received the earlier release-promise
fix even though the product adapter had it. Its missing waiters/release promise
are included here, preventing a future mirror update from restoring that fault.
Canonical delivery: `f3a3c46`, on the dedicated
`fix/codex2-guide-unpark-barrier-20261022` branch. Integrate that controller
change alongside the consumer; the canonical default branch is untouched here.

The focused asynchronous regression test rejects the parent product controller
on browser-exit-before-close, then passes owned exit, browser exit, teardown and
idle exit on the fix. Rebuild the named AMD/map with the pinned release builder.

## Checks and known unrelated gaps

- `test-guide-fullscreen-release.cjs`: PASS after, FAIL on the parent controller.
- Native probes: 10/10, zero exposure, zero geometry/scroll delta and zero errors.
- Controller and complete Close function parity: canonical / embedded / adapter
  identical; JavaScript build and diff whitespace checks pass.
- The strict whole-Guide canonical mirror test already fails before this lot:
  the canonical main Guide differs from its newer embedded consumer. Its
  unrelated 96 additions / 3 removals are not silently imported here.
- T038 already fails on the unrelated shared Discovery SCSS parity gate. No
  SCSS changes are made in this lot. Historical finished-paint tests are not
  relevant to this release barrier and are not claimed as executed.

Reusable native probe: `tools/playwright/guide-host-release-native.cjs`. Supply
base URL, course id, absolute evidence directory, optional label, and the
`EASYEDU_TEACHER_USERNAME` / `EASYEDU_TEACHER_PASSWORD` environment variables.
`PLAYWRIGHT_MODULE` and `QA_CHROME_EXECUTABLE` can select installed tooling.
Generated JSON, videos and screenshots remain outside the repository.

This probe is a supervised native regression candidate. The shared platform
scenario registry was left unchanged because that checkout has concurrent
uncommitted work; registering the candidate is a separate integration step.
