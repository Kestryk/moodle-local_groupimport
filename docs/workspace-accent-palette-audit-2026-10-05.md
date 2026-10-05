# Workspace top accents and custom palette (SM-57)

## Source successor

Kit 0.4.111 owns the opt-in `data-easyedu-custom-rails` gradient recipe.
EasyStud's validated adapter returns `primary`, `success`, both or neither.
Both native workspace roots bind that attribute; no presentation is derived
in PHP, no private consumer gradient. Palette defaults retain exact endpoints.
Only `_foundation-classes.scss` and `components/_panels.scss` are synchronized.
Generated CSS changes only by the two theme-root custom-property rules (12 lines).
All unrelated pinned modules and Guide assets remain unchanged.

PHP lint, isolated configuration/role-fallback checks, Kit rail contract and
public SCSS-only archive contract pass. A full-directory sync first revealed an
unrelated Navigation signature downgrade during compilation. All incidental
sync changes were restored via explicit patches against the previously clean
HEAD before a successful build; no broken assets were promoted.

Paired Foundation examples are recorded in the Kit's
`docs/components/custom-semantic-rails-2026-10-05.md`. Default product boards
stay unchanged; custom palette states are source-linked examples, not a new
component family. Native proof is pending the managed preview gate.

`tools/playwright/theme-panel-rails-preview.spec.js` is local-supervised:
actual Student Management/Mass Import roots and both real panels, 1600/768/390,
twelve default/custom/independent/mixed palettes, exact painted endpoints and
unchanged geometry, no settings Save/POST/fixtures. Persistence remains OPEN.

First native run `easystud-authenticated-20261005T144620433Z-41880`
passes all 144 rail paint/geometry samples and both real saved-palette bindings
(primary #ffae00, accent #11fda5). The aggregate gate fails: two bootstrap
Moodle service POSTs were aborted by the test, producing empty page errors.
Cleanup confirms credentials cleared, lease released and child stopped.
Preserve this failed immutable run. The successor permits only core read-only
translation/template methods on the exact service endpoint; no setting/entity
mutation is permitted and request arguments are never logged. This is a
harness correction, not a product fix or a persistence PASS.

The successor run `easystud-authenticated-20261005T145221952Z-40072` again
passes 144 rail records but captures the exact denied method:
`core_message_get_unsent_message`. Moodle's service definition marks it read;
its implementation only retrieves the existing user's draft. Explicitly allow
that method, not its separate write counterpart. No message content or request
arguments are recorded. Retain both failures and completed cleanup.

Read-only source audit under EED-UI-2026-0073. Not an implementation or native
PASS; human checklist remains OPEN. Preserve the user's unfinished phrase
`Et je trouve pas le` without inventing a missing control.

## Verified cause

Both large Student Management columns consume the canonical public classes
`easyedu-workspace-panel` and `easyedu-workspace-panel--success`, from
`scss/easyedu/_workspace-classes.scss`. Their top accents use
`--easyedu-semantic-rail-primary` and `--easyedu-semantic-rail-success`.
The large Mass Import panels consume these same rail roles through the shared
semantic-accent-panel recipe.

Kit 0.4.110 `_tokens.scss` defines literal default gradients:
primary `#0f6cbf` to `#5b9bd8`, success `#1b7f5a` to `#65a97f`.
EasyStud `local_groupimport_get_theme_style()` in `lib.php` updates chosen,
readable, soft and identity rails, but does not provide either semantic panel
rail token. Therefore custom primary/accent settings affect controls but leave
these top accents blue/green. The canonical panel geometry itself is correct;
no private overlay, pseudo-element or consumer-only gradient is justified.

## Bounded successor plan

1. Keep default gradients and accepted panel radius, clipping and overflow.
2. Let the shared Kit own semantic-rail endpoint tokens/recipe and derive
   custom colours without deriving new presentation rules in PHP or templates.
3. Pass only validated palette values from the existing native theme adapter.
   Preserve readable foreground versus chosen decorative-surface distinctions.
4. Document and publish default/custom specimens in Foundations and matching
   product compositions; do not replace the canonical default-blue specimen
   with the local administrator's custom theme.
5. Check both large columns and Mass Import panels at three widths with
   defaults plus dark/light/mixed custom drafts. Verify actual computed
   gradient paint and unchanged soft-surface/text contrast. No settings Save.

The Kit source change, paired publication and served-native successor remain
pending. Existing palette, module pins and generated assets are unchanged by
this audit.
