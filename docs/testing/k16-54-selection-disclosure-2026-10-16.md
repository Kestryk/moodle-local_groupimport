# K16-54 - Select all unfolds Group members

Base7d03e98f; branch work/codex1/easystud-k16-54-20261016. Functional scope only. The existing call to setGroupMembersExpanded(root,group,true) moves before the model/legacy branch split and before any member selection. It remains conditional on selecting, not deselecting; the helper is the exact chevron entry point and keeps Motion/aria-expanded untouched. No SCSS, template, component class or long-list implementation changes.

Both requested builds (SM and Course Manager) passed; only selection_controls.min.js and its map differ after rebuilding. The native spec substitutes this generated module in the browser response only, asserts the replacement occurred, and uses the real controller, model, chevron helper and animation. Nothing is published to localhost. The supervised disposable fixture has groups of2,8,12members and exact-owner cleanup; business write requests are blocked during the browser checks.

The existing R10-05 policy intentionally hides Select all at2members. This case verifies the existing chevron round trip and absent selection control, without introducing a visual change. Groups8/12 verify expansion through the native helper before any selection, exact full-model selected counts, deselection retaining expansion, already-open selection creating no disclosure change, and the long-list footer only visible expanded.

Required sequence: one FR1600 eight-member pilot first, then FR/EN1600/390 with all three group sizes (12matrix cases). Zero page/console errors and business writes required. Results and cleanup recorded below after completion. Human/Claude audit remains separate; this branch is not a localhost publication.

## Result - PASS

Run easystud-authenticated-20261016T143857644Z-8628 passed. Pilot8/8selected then0; matrix12/12cases over FR/EN1600/390 and2/8/12members. Every selecting action used the native chevron helper before model selection;8/8and12/12selected,0after deselection, expansion retained, already-open selection did not change disclosure. Four12-member footer checks passed folded-hidden/open-visible/folded-hidden. Two-member controls stay hidden per the existing threshold, with chevron round-trip passing. Zero page/console errors and business writes. Candidate AMD substitution was observed seven times.

Fixture cleanup complete; pre-existing relationships unchanged; credentials cleared, lease released, child stopped. Full measured report: docs/testing/k16-54-results-2026-10-16.json. Runtime HEAD remains d0160623; another operator's uncommitted _structure.scss and student-management.css were observed afterward and were left untouched. No candidate files were copied into the runtime or published. Only SM/CM builds were run; no stylesheet/template/class modification.
