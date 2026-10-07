# Guide G8 — user review, 7 October 2026

Continuation of EED-UI-2026-0073/G7. Existing Source/Kit worktrees only.
Baseline Sourcecb30107, Kit461d268/0.4.139, runtimeae7913c5.
Keep Overview, natural cards, native business commands and all earlier open lots.
Paired Guide Penpot, canonical Kit, local preview and human review are separate
gates. No business mutations to manufacture presentation proof.

## Ordered lots — every new request retained

1. G8-A Header: keep icon, compose canonical modal title/subtitle type, colours
   and Close. Guided-path invitation: correct phone layout, compact numbered
   pills and natural-height Start, not a full-column stretched action.
2. G8-B Illustration: dashed target at the card edge, correct identity colour;
   no recap flash before fade; clarify Add versus Move before animation,
   consequences and scope. Visible pointer on compact teaching illustrations
   without implying mobile right-click/drag are actual supported gestures.
3. G8-C Persistence: NEVER auto-render a completed checklist on reload. For an
   unfinished path show a compact Resume/Cancel invitation only; Resume reveals
   checklist. Expire invitation after20s with cancellable shared-policy motion.
4. G8-D Progression: checklist stays operable with destination modal. Automatic
   next-step highlight; previous completed steps re-highlight without corrupting
   progression or blocking future steps. Proper prerequisite locks/striped
   pills and checklist rows unlock after real prior success, no obscuring overlay.
5. G8-E Completed state: replace "Everything is set…" surface with a clean
   canonical completion message. Starting an already-completed path restarts
   that path. Guide invitation alone has an adjacent Reset when begun. Preserve
   other paths; restart changes Guide progress only, never course data.
6. G8-F Content handoff: separate copyable prompt for the curriculum window,
   requesting structured, interpretable proposals: purpose explained BEFORE
   motion, actors, actions, consequences, semantic targets, prerequisites,
   completion signals, native/mobile differences and safety constraints.

All six lots planned at intake. Global human checklist remains OPEN.

## Evidence / remaining work

Additional user review: after closing Guide, the navigation launcher must not
retain hover colour. Cause: broad `:focus` shared active paint matches restored
opener focus. Canonical Kit fix uses `:focus-visible`, preserving keyboard cue
and real hover. Isolated successor asserts computed icon resting/hover/keyboard
paint and focus preservation after pointer Close and keyboard Escape at three
widths. Native publication and Penpot remain separate gates.

Record source commits, Penpot exact IDs/export, served asset pins and tests here.
Do not silently close G7/Foundation or older SM/G4/G5 acceptance gates.

### 7 October continuation / verified checkpoint

- Kit7293383 /0.4.141 and Sourcee610333 implement the pointer-close correction;
  both private branches pushed. Managed preview applied Source483e53c then
  e610333 in order on runtime622b2cf; cache purge passed.
- Isolated G8 passes1280/768/390: resting pointer-close paint with restored
  opener focus, actual hover and keyboard focus/ Escape, reload suppression,
  explicit resume/cancel,20s expiry, path-local reset/restart and compact pills.
  The fixture now includes the actual consumer token root, not undefined palette
  variables. Keep normal-motion/native checks separate.
- G7 presentation successor passes actual synchronized cursor/ghost transforms,
  overlap-time drop state, selected comparison, persistent step frame at the
  three widths, long-list scroll, reduced Restore and cleanup.
- Penpot current file/page verified as GuideEasyStud b564c72c-f31f-81ec-8008-
  ad9958b272bd /b564c72c-f31f-81ec-8008-ad9958b272be. Existing G8 board
  4ee6f77a-1dfb-809b-8008-c0e8547f6d75 read back and exported/inspected;
  five existing header title shapes read back16px. Pointer-close contract note
  4ee6f77a-1dfb-809b-8008-c0ed43d4deaf added and settled readback confirmed after
  correcting its resize API. These are Guide-local compositions, not Foundation
  Library publication or global human acceptance.
- Native supervised run17776 FAILED at prior-step pointer review: visible
  checklist was intercepted by native destination modal. Before failure, native
  launcher pointer-close resting paint/focus passed1280; next-target highlight
  and native destination selection reached the confirmation target. No page
  errors or blocked business writes. Cleanup released lease/stopped child/cleared
  credentials. Keep manifest and failed oracle, not a full native PASS.
- Root cause: old checklist1070 equals public native-modal1070; DOM paint order
  lets the modal intercept it. Kit0.4.142 derives Discovery layer from the public
  modal role plus one. Successor records actual ancestors and elementFromPoint
  and retains normal previous-step click (no force). Three-width native proof
  still required. No Create/Move/Save/Send test transaction is authorized.
- Native39412 stopped before login: the new15s interaction timeout also shortened
  navigation. Read-only login health check returned200, actual login form and no
  database error. Restore an independent60s native navigation budget; keep15s
  interactions and strict normal-pointer hit-target oracle unchanged. This run
  says nothing about the new checklist layer. Runtimec68d987 serves Sourcefab45f0.
- Native28888 confirms the actual1280 pointer-close resting paint, normal
  checklist hit-target1071, native destination open/select/cancel and earlier
  review/later reopen. It then fails at768 looking for the desktop Move button,
  which the existing compact UI deliberately hides in favour of its sticky
  command delegate. Product Guide target now includes that real compact control;
  successor clicks it normally. Do not invent a new mobile action or force a
  hidden desktop command for this test. Phone/native full matrix still pending.
- Native35588 passes the desktop review again, then identifies the real compact
  collision: the expanded checklist covers the native destination choice. Kit
  0.4.143 keeps its steps scrollable in a shorter panel and vertically docks
  away from the external dialog target. Checklist and native field must both
  remain normally clickable; no hidden panel, pointer-through or force-click.
- Native18920 reaches the real tablet choice/confirmation highlight without
  checklist collision. Its centre oracle then measured an earlier row outside
  the newly bounded scroll viewport. Successor scrolls that real row normally
  before elementFromPoint (same strict true oracle and normal click). Source
  inspection also found Restore writes a boolean expanded attribute while
  re-render incorrectly compared it to the string1; Kit0.4.144 preserves that
  explicit Restore with hasAttribute. Full phone/native matrix remains open.
- Native8116 confirms desktop again but identifies an intermittent tablet
  highlight race: fast native Move completion can be followed by the pending
  predecessor beforeHighlight close. Kit0.4.145 clears old step-open timers on
  successful later completion, preserving original delays. Isolated rapid
  selection/open progression proves only the latest destination-open request
  survives (no obsolete close), plus explicit phone Restore remains expanded.
  Preserve native failure, don't increase the strict next-highlight timeout.
