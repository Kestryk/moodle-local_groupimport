# Workspace top accents and custom palette (SM-57)

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
