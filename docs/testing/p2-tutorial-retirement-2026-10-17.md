# P2 ? retire the obsolete tutorial markup and main stylesheet

Base 4110785e; branch work/codex1/easystud-p2-20261017. No runtime access.
Remove the two inverted useeasyeduguide sections (inactive because manage.php
always sets the flag true) and the old components/_tutorial.scss module.
Keep the exact existing workspace selection-disabled/footer rules and invocation
of canonical guided-panel in components/_workspace-shared.scss, at the same
cascade position. This is relocation, not a new component definition or visual
variant. Shared Guide template/data, translated labels and resolvers remain intact.
No Penpot update needed: current rendered controls and active CSS do not change.

Build styles only in this dedicated source worktree, using Sass 1.79.1 and the
conservative page builder. Student Management loses 46610 bytes; global, Mass
Import and administration CSS are byte-identical after line-ending normalization.

PASS: test-tutorial-retirement.cjs (13 assertions) independently compiles original
4110785e and current Sass, compares all 4132 active ordered rules/declarations and
media contexts, excluding only explicitly named legacy tutorial/discovery/panel
selectors. It also compares active generated-page CSS and all unrelated page CSS.
Expanded CSS reduction: 49880 bytes. No font, target size, spacing or Motion change.
The real Mustache fixture compares current rendered markup FR/EN and both density
flags (12 assertions); only CRLF and inter-tag whitespace are normalized.
T037 (14), T038 (47), security-escaping and filter-engine PASS; fixture PHP lint
and CJS syntax PASS. No browser/native/human acceptance claim.

Remaining reserved cleanup (P2 not completely closed):
- amd/src/local/cm/guide.js: bindTutorialModal, starting at line 421, returns
  immediately when the shared Guide root exists; the legacy fallback is dormant.
- amd/src/course_manager.js imports/calls this binder; local/cm/navigation.js
  contains its legacy opener fallback. Both are Claude-owned and unchanged.
- Old-only selector fragments in forms/modals/responsive/animation adapters and
  legacy translation keys remain; some tutorial-named payload fields still feed
  the current shared Guide and must not be mechanically deleted.
Claude should remove the dead binder/call/opener together and audit the residual
selectors, preserving bindSharedGuideTargets, shared context/labels and current
Guide actions. No visual decision was made and no reserved module was edited.
