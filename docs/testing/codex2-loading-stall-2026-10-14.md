# Single-mode AMD stall regression, 14 October 2026

Claude `b5f44a7a` was integrated as `e552cb05` and served as `c155904b` by
Codex1. Slow script/request progress postpones degradation; stalled AMD must
still produce the native `amd-timeout` around8s and recover when released.

## Deployed copy and scope

Only `js/loading_state_bootstrap.js` was copied from Codex1's published Source
to `C:/dev/Moodle 51 Perf/moodle/local/groupimport`. Its SHA256 matches Source:
`28E403A2718CB5C7D769E50BBAB38244601B1AAF841C36CBF954ADB483AAD0E6`.
Before/after hashes and original file: `C:/dev/artifacts/es-loading-progress-deploy`.
Runtime/cache leases and purge pass; no source cherry-pick or principal change.
Upgraded read-only preflight confirms sole on-demand mode and no renderingmode
configuration row. Historical mode-changing specs remain unchanged.

New successors allow the native plugin get/list reads needed by this renderer;
they keep business-write blocking, native RequireJS route holds, real controller,
ARIA/inert/skeleton/content checks, timeout reason, late recovery and original
checkbox geometry/focus/Space oracles. No product controller is called by tests.

## Native results on :8051

| Successor | Run | Result | Native amd-timeout |
| --- | --- | --- | --- |
| student-card-checkbox-owned-loading-on-demand-successor.spec.js | easystud-authenticated-20261014T154535295Z-46208 | PASS | 8710ms |
| student-card-checkbox-late-loading-settled-successor.spec.js | easystud-authenticated-20261014T154800676Z-40264 | PASS | 8724ms |

Owned holds every native AMD aggregate for a separately owned navigation;
late holds the real `core/first.js` GET. Both first let authentication settle,
then navigate the diagnostic document. Both capture native degraded state
before release, prove `amd-timeout`, recover to `ready` and manager initialized1,
then verify actual Tab/Space select/deselect and retained focus on participant,
group and grouping cards at390/768/320. Each records84 entries, zero pageerror
and zero blocked business commands. The elapsed oracle is7900..10999ms to allow
real resource completions/scheduling while still detecting a moved30s timeout.

Artifacts: `C:/dev/artifacts/es-owned-loading-sole` and
`C:/dev/artifacts/es-late-loading-settled`; each contains manifested
`native-amd-timeout.png`, `mobile-selection-paint.json`, runner and cleanup.
Requested progress change preserves the stalled-loading contract on this copy.
Principal cold-load proof by Codex1 is separate; no principal stall is claimed.

Retained predecessor: `student-card-checkbox-late-loading-on-demand-successor`
run `154411687Z-34728` in `es-late-loading-sole` failed at login click's15s
navigation wait. Its route waited on the redirect document without diagnostic
query state. No valid elapsed measurement/product failure inferred. The settled
successor owns authentication and the measured navigation separately, retaining
all native fail-open and keyboard assertions. No unchanged rerun.

No new visual source change or Penpot operation in this proof lot. Human visual,
Moodle4.5 and guided business-write replay remain separate gates. A-CHECKLIST
is now served `63d77549`; subsequent Guide tests must use its served assets.
