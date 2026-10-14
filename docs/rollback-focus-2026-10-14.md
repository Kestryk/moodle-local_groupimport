# T058 Rollback focus — 2026-10-14

Kevin explicitly extends the Codex2 exception to initRollbackModal in csv_import.js.
Initial focus now selects Cancel/Close rather than the destructive submit action.
Tab/Shift+Tab wrap among visible enabled stops; handled nested keys retain priority.
Escape is modal-scoped, prevents bubbling, closes with existing Motion and restores
the exact History opener after History becomes visible. Cancel/backdrop use the
same closure. No import/rollback request, payload, History or other function changes.

Build: Moodle Babel/Terser from C:/dev/moodle51-build-501, named AMD generated.
Perf deployment: only csv_import source/build/map replaced, prior files retained in
C:/dev/artifacts/es-rollback-deploy-20261014 with SHA256 manifest; cache purge under
dedicated Perf/runtime leases. Other runtime assets remain on 49072e22.

Native successor: FR1280/390, normal/reduced motion, legacy/reactive; Cancel,
Escape, backdrop, both Tab boundaries and return focus. No fixture or business write.
Initial spec failed before opening History because synchronous visibility selected
the compact menu during loading; immutable evidence at C:/dev/artifacts/es-rb14.
The ready successor waits for either visible native opener before choosing the path.
Results: PASS both modes, 24 cycles (12 per mode), no page errors or blocked business writes.
Evidence: C:/dev/artifacts/es-next14/after/matrix.json. Final AMD SHA256 matches deployed AMD exactly; final source-map line offsets reflect a whitespace-only lint correction.
Scoped lint: no new errors; full file retains the pre-existing History max-len at line 707 and warnings.

Moodle 4.5: standard DOM APIs and existing Motion only; runtime compatibility gate
remains separate. No UI Kit/Penpot paint change. Human acceptance remains open.
