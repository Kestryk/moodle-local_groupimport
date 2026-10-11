# R10-07 / SM-65 — ungrouped filter keyboard track focus

Scope: the two native trailing catalogue switches only. Canonical Kit0.4.167
already exposes `filter-toggle-track-focus` / `easyedu-filter-toggle--track-focus`
(original public introduction0.4.124). Import that exact21-line mixin and one
public class; apply the class in `manage.mustache` twice. No consumer override,
new density, controller, command, card/view/filter Motion or Guide change.

Pointer activation no longer paints a caption-wide ring. Real native keyboard
`:focus-visible` paints the existing shared ring around the36x20px track only.
The caption/44px target,14px thumb, native checked semantics, disabled and
forced-colours policies remain. Unopted generic/trailing controls retain their
old focus skin. Reset height/action composition are separate R10-08/13 lots.

## Evidence gates

- Complete consumer preservation against2df6a01 passes: remove exactly the
  three new CSS rules and recover all previous generated CSS; remove only the
  optional source/class and two label modifiers and recover their exact files.
  PHP, AMD source/build/map and all Motion remain unchanged. Sass1.79.1 is the
  consumer compiler. The test uses SHA256 with bounded first-difference output
  rather than dumping the multi-megabyte stylesheet on failure.
- Current public contract test passes48 isolated records at1600/768/390,
  LTR/RTL, pointer/Tab/Space, disabled Off/On, reduced and forced-colours.
  External run `kit/filter-track-focus-current-20261011-a`, owned browser closed.
- Foundations original Focus remains recoverable/unchanged. New source and
  Standard states retain the original Off/On source geometry and typography;
  only keyboard states move the2.88px/.22 ring onto the track. Four linked
  product examples reuse those exact providers. Saved GET, painted labels and
  source/Standard/product rasters are checked separately. IDs are retained in
  `testing/filter-track-focus-publication-2026-10-11.json`.
- The first cross-page caption clone failed after partial publication. Exact
  IDs were reconciled, source controls were not rebuilt/replayed, and ordinary
  same-style captions completed the retained hosts. Duplicate SVG IDs in the
  editor preview required a qualified renderer-layer screenshot successor;
  the failed capture remains retained. Neither error changed native UI code.
- Native served successor is **pending**: actual desktop Participants/Structure
  and compact Groups routes at1600/768/390; EN and FR, eight states per route.
  Test source is local-supervised and becomes immutable when a run starts.
  Plugin business POST/unknown core writes are blocked; client filter changes
  and temporary disabled/checked specimens are restored in `finally`.

Human combined checklist stays OPEN. Isolated or Penpot evidence is not native
Moodle evidence, settings persistence or human acceptance. No new role/data
fixture is required. Platform planning/scenario owner receives this backlink;
its shared files are not concurrently edited.

## Next

Promote the pushed bounded consumer commit through the managed local preview
lane, purge under its own lease, execute the one exact native scenario in EN
and FR, and retain cleanup/status. Then continue R10-08/09/10/13 in order,
without colliding with Claude's independent composition audit.
