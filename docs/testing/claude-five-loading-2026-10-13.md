# Five Claude commits — CL-SPECIMEN and T061 part 1

EED-UI-2026-0073 / N1. Source cherry-picks in order:
a667f7df -> d53925a8; 9dd156b4 -> 4f6e58d2; 6ddcd146 -> c7afb652;
49072e22 -> d84d7af8; 823e1426 -> e837bf08.
Only CHANGELOG conflicts occurred and all entries were preserved as authorised.
The first three changes were already served; grouped publication reuses their
recorded provenance and applies the two new ones plus the build/check follow-up.

All four requested AMD families are rebuilt using the existing Moodle toolchain,
including five local/sm modules with specimen. manage.php PHP lint and bootstrap
JavaScript syntax pass. No new API, PHP or Bootstrap dependency is introduced.
The generated specimen source map embeds this checkout's exact source bytes.

The single targeted native scenario runs 1280 FR then EN in both modes using
the disposable integration fixture. On demand, it holds the real get_state
response to observe the visible frame with component list skeletons, busy and
inert, with no participant cards yet; it releases that response and requires
ready, real cards, no component skeletons and usable controls. This controlled
delay is presentation/lifecycle evidence, not a performance timing measurement.
Current and Mass Import must reach ready without opting into loading-frame.
Actual badges and Move Tab/Shift+Tab/Escape/return-focus are rechecked in all cases.

The served specimen module renders participant, catalog-group and tree-group
cards. The probe verifies detached/inert/aria-hidden cards without live hooks
or IDs, and no change to real-card queries when appended then removed.
No Guide anatomy composition or skeleton Kit recipe is activated by this probe.

The spec finally sets legacy; the wrapper removes its exact fixture and records
credentials, child and lease cleanup. Native outcome is recorded in the handoff.
T061 part 2 remains a later series B lot, with Penpot before canonical Kit recipes.
Existing AGENTS and proof rules apply; no new AGENTS or visual component contract.

## Served result

One grouped publication with purge: 20261013T204435Z, HEAD f89ee98c.
Served mappings: a667f7df -> f38a914a; 9dd156b4 -> cf82bbf1;
6ddcd146 -> 2d5bbba3; 49072e22 -> b21f347b; 823e1426 -> 20614e73.

Native PASS: easystud-authenticated-20261013T205212967Z-42024, four cases
FR/legacy, FR/reactive, EN/legacy, EN/reactive, zero page errors.
Real count badges, Move initial/Tab/Shift+Tab/Escape/return focus, ready frame
and Mass Import including its native filepicker wrapper pass in every case.
Both reactive samples have loading + busy + inert, one visible list skeleton
for the one-person fixture, and zero participant cards before response release.
After release the page is ready, interactive, with cards and no list skeletons.
Three specimens per case pass their inert/detached/hook isolation checks.
The FR/EN screenshots show the native frame; the list is below the captured
viewport, so list-skeleton evidence is the native DOM geometry assertion.

External manifest, claude-five.json and screenshots retained. Exact fixture
course 73, groups and groupings removed; credentials, child and lease cleanup
pass. A final explicit CLI restore under runtime lease and a fresh process
read confirm legacy in configuration and database.

Retain failed predecessors: 204510574Z-24144 stopped on a 5s Moodle picker
wait; 204748616Z-51040 passed FR/legacy but sampled the held reactive state
after the 8s fail-open deadline. Their fixture cleanup passes. The final
successor waits up to 60s for the native picker and samples the transient
frame after two animation frames, without waiting for all fonts/animations.
All original loading/busy/inert/no-cards assertions remain strict.
These harness corrections introduced no product change or second publication.
