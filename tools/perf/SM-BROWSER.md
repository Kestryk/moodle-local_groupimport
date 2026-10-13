# SM-RENDU3b browser measurement

Codex2 measurement branch only: product HEADcbccc7e, prerequisite282f1bc,
Claude ad62069/90ea17b/fe28c6b/09793fe/31e30d1; regenerated conflicting AMD
from merged source, no controller/renderer changes. version2026101200 unchanged.
Run Invoke-SmBrowser.ps1 with explicit workstation loader/orchestration/PHP/
copy paths and a fresh external output directory. Discovery-one precedes
fixture mutation. Parent owns runtime/cache -perf- leases; child fixture lease.
Rendering setting saved exactly (including absent), restored in both finally
paths; native fixture cleanup/hash and owned orphan-state-row cleanup retained.

One native FR1280 sample per mode, legacy then reactive, same course/entities.
Caches enabled, shared host/browser cache; no router or CSSCoverage instrument.
Readiness records both markers, uses manager-initialised for legacy and sm-ready
for reactive; raw flags retained. HTML bytes come from browser NavigationTiming
decodedBodySize, not an extra143MB body copy or an unrelated CLI request.

Synchronous DOM click/input dispatch cost excludes pointer/hardware latency.
Logical page/count completion is followed by ten full consecutive rAF intervals
under60ms, with a warm-up frame. End-to-calm includes Playwright/CDP observation
overhead and is not a pure isolated component timer. Native path/method only
network log; no cookies/sesskeys/HTML saved. Node settings helper outside timers.

Observation at240s can fail while a blocked main thread later returns ready.
Keep that failure and record late marker/costs, never relabel as3/5s SLA PASS.
Pred800 initial helper skipped its legacy actions on timeout and counted a
partial first rAF interval; keep it immutable, distinguish strict successor.
At800 the predecessor observed legacy299s late, reactive149s /17.9MB /60843DOM;
on-demand interactions used zero requests. These are not final-renderer targets:
grouping tree3c remains, hardware/MySQL shared, no human acceptance.

Scenario local-supervised, not CI-ready: saved credentials and native owned
fixture. No heavyweight snapshot/restore/bundle/matrix outside a milestone.
Source, native measurement, product SLA and human review are separate gates.
