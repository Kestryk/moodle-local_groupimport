# T058 ? Heading contrast

The former heading #6a7a8a on #f7f9fc measured 4.17:1. Revision 49072e22
already applies --easyedu-text-muted (#5c6c7d) through late typography. This
cleanup aligns the owning layout declaration with that existing canonical
token, removing the stale fallback without changing the accepted palette.

Sass and diff-check PASS. Native computed colour/contrast to verify; custom
palettes and incomplete axe checks are not certified. No Guide/admin, Kit or
JS edits. Integrator owns generated styles and publication.
