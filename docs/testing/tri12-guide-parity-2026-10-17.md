# TRI 12 — Guide copy parity
Base 05a84c57; canonical Kit 57b5d7f. Inventory only; no source merge.
PASS T037 14 assertions, T038 47, roundtrip six callable exports and four modality
combinations plus fallback; exact adapted runtime JS, both templates and three
SCSS modules. Embedded sources equal canonical sources after line endings.
Normalized file hashes are in tri12-guide-parity-2026-10-17.json.

Differences are deliberate adapter contracts: ES module imports/exports versus
Moodle AMD, inline Fullscreen controller, translated defaults, Moodle partial
namespace/hover/checklist labels. No divergent gesture, Motion or Guide behavior
was found by the exact roundtrip. Keep two forms until the post-V2 unification.

The wider read-only sync-easyedu-guide.ps1 -GuideOnly still reports ONE pre-existing
_buttons.scss drift (shared action buttons, outside Guide-owned parity). Do not
claim that broader check is all green; no Apply, no overwrite or style adoption.
That drift belongs to component standardization, separately from TRI12 Guide code.
No runtime, browser, DB, build, publication or new design choice.
