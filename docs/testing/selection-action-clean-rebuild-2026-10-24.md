# Reproducible Mass Import palette build

Rebuild the integrated sources with Node 22.11.0 and Sass 1.79.1 using both
release styles builders. Remove the generated sheets first; require the actual
Mass Import output rule to use primary ink for resting border and text before
packaging a committed archive. Source-only integration does not certify the
compiled CSS shipped by Git archive.

The rebuild on dc67b8b3 changes only styles/mass-import.css. Native verification
and direct HTTP stylesheet readback are recorded in the external deployment
report for 24 October 2026. No product SCSS, templates, PHP or AMD changed.
