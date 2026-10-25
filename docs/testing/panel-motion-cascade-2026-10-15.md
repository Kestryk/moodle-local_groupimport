# K15-23 panel transition ownership

Complement7 identified a second opacity/transform transition on __panel while
Claude's Motion.swap returns a focused panel. Remove those two CSS transitions
and their speculative will-change hint, retaining the shadow transition.
Focus geometry, JS Motion, menu transitions and card styles remain unchanged.
The generated Student Management sheet is rebuilt in conservative mode.
Native view-switch settlement is checked with the quick-fix successor.
Visual relay: SM panel container, Participants/Structure/return, FR1280/390.

Published as7c8c16d9, conservative build PASS. Only student-management.css
changed; global, Guide, Mass Import and admin sheets are unchanged.
Native100223443Z-17800 PASS: FR/EN1280 structure-to-participants return and
390 participant view settle; computed panel transitionProperty is box-shadow.
No page errors, business writes or overflow. This proves the competing CSS
interpolation is absent; it is not a full animation-level/performance audit.
