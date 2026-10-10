# R10-30: explicit demonstration entry, source activation

User request: every timed illustration needs an explicit Start demonstration
button before playback, with an In progress state. This is not the guided-path
Start command and does not create course data. Four timed consumer scenes now
opt into the shared entry. Source activation is not a served-preview claim.

## Current source inventory

- applyActiveSlide invokes playDiscoveryScene on entry to the visible modal.
- membership, actions and inspection start timed choreography on that call.
- concepts is static. Creation initializes an interactive fictional name
  exercise, with Preview/Letters/Clear and Enter; it is not timed choreography.
- membership Add/Move controls currently both select a mode and start playback.
- Replay starts the stored mode. Reset restores the illustration and returns
  before a new controller is created. Pause/Next share the existing scene clock.
- stopDiscoveryScene owns abort/teardown; its semantics must be preserved.

## Intended shared state contract

| State | Start control | Existing playback controls | Expected scene |
| --- | --- | --- | --- |
| Ready | Start demonstration, enabled | Pause/Next disabled | Natural initial cards |
| Playing | In progress, disabled | Pause/Next retain current clock | Existing choreography |
| Paused | In progress, disabled | Resume/Next retain remaining time | Frozen scene |
| Finished | Replay demonstration, enabled | Pause/Next disabled | Completion and recap |
| Reset/re-entry | Start demonstration, enabled | Pause/Next disabled | Restored initial cards |

Compare Add/Move remains a mode choice. It must not silently restart an active
scene or issue a native membership action. The chosen mode is used by the
explicit Start command; mode-switch behavior during playback needs a bounded
test and clear feedback, not an undocumented automatic replay. Preserve the
existing buttons/pressed palette and the natural scene return.

## Publication and activation gates

Reuse canonical Small/Default button geometry, icon/text gap, focus and disabled
states. Catalogue linked Ready/Playing/Finished examples at desktop/mobile in
Foundations, then Guide; no custom consumer button CSS. Source/Standard saved
geometry and focused painted examples precede consumer activation.

Add localized EN/FR data defaults and the shared template/engine atomically.
Keep old curriculum IDs, reading/path storage, real actions, creation exercise,
Motion timings and pause/phase ownership. Tests must cover idle entry, explicit
start, rapid repeat, mode selection, pause/resume/next, finish, reset, departure,
re-entry and teardown, normal/reduced/disabled policies and three widths.
No forced hidden controls or course/settings writes in the native test.

## Current proof boundary

The common template/engine/SCSS and EN/FR labels are synchronized from the Kit.
Four timed consumer scenes opt in; concepts and the creation exercise do not.
Legacy templates without the optional Start control retain autoplay. Add/Move
is idle mode selection, disabled during playback. Start replaces duplicate Replay;
Reset, clock, Pause/Next, choreography, paths and native commands retain their roles.

Reuse is Selection action / Small / Primary solid (not icon-only Core S):
30.4px height, Inter600/12.48px, 5.6px icon gap. Entry invokes the existing mixin,
with no inline template paint or consumer override.

Foundations Desktop/Phone providers under EasyEdu / Guide Discovery /
Demonstration entry: bc076afe-ee85-8033-8008-c51d158db93e and
bc076afe-ee85-8033-8008-c51d15a8dcee. Library/Standards saved readback passes20
linked controls. Guide copies7aaaed58-7fa9-80c8-8008-c51f3e500479 and
7aaaed58-7fa9-80c8-8008-c51f3edd44a7 pass10. The reader also checks relative
rows/insets and containment. Paired desktop/phone captures inspected in both files.

External evidence: EasyEdu/artifacts/easystud/penpot/
guide-demonstration-entry-20261010 under the local artifact root. Four
*-contained.png captures are passing focused evidence. Earlier generic-label,
clipped-parent and wrong-tab captures remain diagnostics, not proof. Owned9225
manages switching; the user's other channel is untouched.

Before activation,48 isolated cases passed: four scenes, EN/FR,1280/768/390,
normal/reduced motion. Successor fixture now checks actual consumer opt-ins
rather than injecting flags. Served/native and human acceptance remain pending.

### Served successor

Source d7a25f6 and its documentary predecessor d80424a are served in order at
runtime c698aa72 with caches purged. Native run47904 passes12 cases: four scenes
at1280/768/390, idle, explicit Start, disabled/running, Pause/Resume, phase
advance, completion, replay, reset and compact Small paint. No page errors or
business/settings writes; credentials, owned child and lease cleanup completed.
See guide-demonstration-entry-native-2026-10-10.json. Native configured normal
motion is not separate native French/reduced-motion proof. Human review stays
open; the earlier source-only paragraph is retained as chronology, not current status.

## Reusable integration lessons (R10-33)

SDK text overrides can leave stale paint until native text layout refresh.
Measure intrinsic button width afterward without changing source density.
Append linked roots to the intended page rather than the previously selected
board. Check child containment after moves. Select preserved editor tabs by
actual inspector/selection, never unstable CDP order. Retain unknown edits and
avoid broad pending Library updates. These are avoidable round trips; precise
model/provider token costs are unavailable.
