# Intrinsic section icon width (SM-53)

Canonical section-icon-tile limited its FA child/pseudo box to one em. Moodle
FA6 cloud has 1.25em advance: the actual paint was 1.5-2px right of centre at
1600/768/390. Crops/cleanup are retained in EasyStud's cloud-painted-centre audit.

The canonical rule now bounds intrinsic width to the tile rather than one em.
It does not stretch the icon, reduce its font size, add a translate offset or
change palette/density/radius/Motion. Applies uniformly to FA-on-tile, nested
FA and decorative inline vectors. Compact stays35.2/17; regular stays40.8/20.
Narrow glyphs keep intrinsic width.

Eleven existing Foundations08.4.1 cloud-bearing L regular/multiple/compact
providers and linked08.4 counterparts already centre vector paint. Eighteen
EasyStud compact compositions do too; do not mutate correct design geometry.
See consumer docs/testing/cloud-painted-penpot-readback-2026-10-05.json. S/M
file rows use other file icons, not invented cloud-deposit variants.

Public compile/complete consumer CSS preservation and native painted successor
are separate gates. Native FA/vector ink scale, upload/removal lifecycle,
localized labels and human acceptance remain open.
