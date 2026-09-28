# CSV disclosure regression

`mass-import-disclosure-motion.spec.js` is a local-supervised scenario using
the authenticated wrapper and a temporary native Moodle draft upload. It never
executes the import. The repository selection response is awaited before
filling its replacement upload form; Moodle passes `action=list` in the URL.

At 1440px it records four complete cycles: column width, chevron position and
rotation, CSV identity position, copy opacity and CSS transition progress.
Positions are relative to the card, not the viewport (page scroll anchoring
must not masquerade as an icon jump). The grid uses a 560ms CSS timeline;
its minimum-width rail clamps the final section of the interpolated fr track,
so visible width interpolation and CSS duration are checked separately.

Passed on 2026-09-28 against runtime `89becc8127f53b1cdbfeb1abba854a30f3668812`:
`easystud-authenticated-20260928T201209144Z-57948`. Four cycles, stable CSV
starting-edge anchoring, chevron continuity and reduced motion passed.
External cycle-1 capture inspected: retained CSV identity above the centred
toggle, contained results column and centred status copy. Human accepted the
status labels and previous animation except CSV jump; this final CSV change
still awaits human acceptance. Earlier failed harness runs are not passes.
