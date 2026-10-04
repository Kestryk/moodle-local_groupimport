# Searchable choice disclosure Motion — 2026-10-04

EasyStud consumes UI Kit `0.4.80` for searchable single and multiple choices
used in More Filters and destination dialogs.

The controller measures the current painted height and the destination content
height, then animates height, opacity and a small entry offset. Reversing the
disclosure cancels the running animation and continues from the current painted
geometry. The chevron uses the same shared duration. Closing makes the panel
inert immediately and applies `hidden` only after Motion completes.

Native selects remain authoritative. Search, selection, clear-all, filtering,
Move destinations and business requests are unchanged. Reduced-motion and
browsers without Web Animations complete immediately.

Static Kit and generated AMD/Sass checks pass. Native Moodle browser proof,
Penpot propagation and human acceptance remain open because the local database
and Penpot connector are unavailable.
