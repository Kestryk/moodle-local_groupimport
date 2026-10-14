# T058 integrated panels and keyboard transfer

Kevin authorizes only Course Manager window/focus functions. The change adds
panel-owned Escape and safe focus restoration to setInlinePanelOpen and
setRenameEditing. Search and identifier panels reuse their existing native Cancel;
renaming also reuses Cancel. Closures preserve search reset, original callbacks
and Motion. Tab remains in the document sequence, with no modal trap or global
keyboard listener. A handled nested Escape retains priority.

The opener is captured before opening. On closure, restore it only if it still
exists and is visible, and the old focus remains inside the closed panel or has
fallen to the body/another hidden node. A deliberate visible destination selected
by another callback retains focus. Cancelled disclosure transitions do not restore.
Restoration waits one animation frame so the queued native card normalization
cannot immediately drop it again. A reopened panel keeps focus. Reduced Search
also recovers its own visible action if synchronous preparation already lost focus.

Source allowlist: new focus helpers, setInlinePanelOpen, setRenameEditing; generated
Course Manager AMD/map. No local/sm, tutorial or business command code changes.

Native evidence on the existing Perf course5: Group and Grouping Search,
identifier addition and renaming; direct actions or native menus; keyboard
Enter opening, initial field focus, Tab leaving, Escape and Cancel return.
FR1280, normal/reduced motion, both rendering modes. Normal Search/Add must expose
the actual is-easyedu-disclosing state and a nonzero WAAPI duration; reduced
Search/Add must use no WAAPI animation and the existing global CSS reduction.

Keyboard drag alternative: focus the native selection checkbox, press Space,
then activate the native Move action with Enter for Participant, Group and Member.
Assert the actual Move context, initial focus inside, nested chooser Escape,
destination selected with Tab/Space, confirmation reached through Tab, and Escape
returning to its trigger. No drag, Add/Move submission, membership write or fixture is involved.
The checks prove access to the native transfer workflow, not execution of a
real transfer; real writes are reserved for the later dedicated-course replay.

Before evidence: es-panels-before contains real Search/Add initial focus PASS,
Escape/Cancel return FAIL. An earlier auth15s timeout and a menu-only routing
failure are retained separately. The native baseline then stopped while measuring
the hidden rename opener: its successor captures the opener node before opening.

Build and exact source reconstruction: PASS; no unrelated source change.
First candidate: normal panels and all three native Move contexts pass; reduced
Search return fails in both modes. The narrow native diagnostic records an actual
focus call to the correct opener, followed by focus on body. Preserve its JSON and
captures at es-panels-focus-diagnostic. This is a product timing defect, not a
stale opener handle. The successor waits the exact focused endpoint and retains
the same return-focus predicates.

Native final: PASS C:/dev/artifacts/es-panels-after-v3/after/matrix.json.
Both modes provide12 panel cases each (24 close cycles each) and6 complete
keyboard access scenarios each:48 closes and12 keyboard transfers in total.
Normal disclosure samples are329–347ms; reduced samples have no WAAPI animation
and CSS duration at most0.001ms. Zero page errors, blocked business-write attempts
or created fixtures. The Member confirmation-focus screenshot was inspected.
Deployment: only Course Manager source/build/map on8051, prior files and SHA256
manifests at es-panels-deploy14, es-panels-deploy14-v2 and es-panels-deploy14-v3.
Principal runtime untouched. Full lint retains69 existing errors; the pinned
before/after diagnostic comparison introduces no new errors or warnings.

No paint, recipe, responsive layout or Penpot component changes. Human acceptance,
Moodle4.5 runtime and the remaining global accessibility audit stay separate.

Guided writes remain gated by publication of A-CHECKLIST and CL-PARCOURS:
path3 steps2–6; path7 step4; path10 steps1–3; path11 steps4–5. Run only on a
dedicated test course on8051 and verify checked step, highlight and end frame.
Codex1 passation still records A-CHECKLIST as future work; no test course created.
These native access proofs do not close the global contrast/mobile audit or
the later real-transfer/Guide completion gates. Modes and Guide preference are
restored by the paired supervisor; no runtime lease remains after final cleanup.
