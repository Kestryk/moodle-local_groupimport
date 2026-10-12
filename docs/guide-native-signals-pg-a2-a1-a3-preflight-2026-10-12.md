# PG-A2 → A1 → A3 — current-source preflight

EED-UI-2026-0073 / EXEC-02, after S1 native gates. Read-only diagnosis at
Sourceae870ed; no Course Manager, PHP, template, language or generated asset
change. No progression migration, business action or native PASS claimed.

## PG-A2: all real Participant menu entry methods

The common `showMenu` receives all three real openings: card-action button,
contextmenu, and responsive long-press (520ms existing timer). Only the separate
contextmenu listener currently calls `emitGuidedCompletion(root,2,'actions')`,
and it does so for Group/Grouping/Member/Paste-field as well as Participant.
Button and long-press have no equivalent try-context signal.

Bounded correction: emit after successful common menu reveal, only for
`type === 'participant'` and an actual connected card owned by the workspace.
Remove the unqualified contextmenu completion. Do not change menu geometry,
actions, focus, pointer timing or Motion. The existing getContextTarget checks
Member/Group/Grouping before Participant; keep that distinction. A source
Member row must not impersonate the global Participant card exercise.

Required proof: native button/right-click/long-press Participant positives;
Group/Grouping/Member/Paste-field negatives; no completion while Guide hides
the checklist, on another path, while locked, after Reset, or on menu Cancel.
Source helper proof and actual gesture evidence remain separate.

## PG-A1: selection, not transfer confirmation

Two `emitGuidedCompletion(root,1,'actions')` calls currently occur after server
success in Participant transfer and Group assignment. They certify try-selection
without a Participant checkbox gesture. Retain the business callbacks but remove
this path's false signals in its scoped successor; bind a real selected-Participant
state transition through existing selection authority. Checkbox Space, mouse,
Ctrl/Shift/results semantics and source-member exclusivity must remain original.
Never certify selection from render, menu-opening side effects, confirmation,
Guide opener, loading readiness or arbitrary class presence.

## PG-A3: typed order without rewriting historical IDs

manage.php's retained try-actions array has try-drag, try-selection, try-context
but no requiresStep. Broad `emitGuidedCompletion` maps numeric0/1/2 directly.
The existing `emitNativePathCompletion` already guards visible matching path,
connected root, next unfinished enabled step and exact semantic ID. Reuse that
authority rather than adding a second Guide engine or a new storage schema.
Add requiresStep dependencies while retaining all original IDs/title/targets.
Drag completion must name the intended real action; do not let Group movement
or Add/Move events accidentally certify Participant selection or context menu.
Inventory the actual drag emitter before implementing this last part.

Tests must preserve old completed history, non-active/locked/obsolete-session
behavior, native transactional responses and original array identifiers.
No automatic reset/re-exposure of dormant paths (PG-A4 human decision), no Save
wording changes (PG-A5) and no grouping opener changes (PG-A7) in these lots.

This preflight can proceed while Moodle startup is unavailable; activation
waits the S1 gates. Original61 tasks and every SM/R10 request remain preserved.
