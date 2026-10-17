# A10: shared visually-hidden recipe — candidate, not fully validated

Base5fbdb52e, canonical candidate based on1c88042. Do not claim this complete or
publish it until the owning Guide/canonical synchronization gate is repaired.

The new public visually-hidden mixin lives only in the Kit accessibility partial,
forwarded by its existing public entry. The consumer emits the existing utility
class under the Student Management, Mass Import, administration and portalled
Guide roots on their owning pages. It never adds a site-wide rule to styles.css.
Bootstrap4 supplies sr-only but may lack visually-hidden; Bootstrap5 themes
already supply equivalent geometry. This deterministic scoped alias does not
attempt an impossible CSS test of whether another sheet defined a class.

The explicit single public recipe uses a1px square, absolute positioning,
negative1px margin, cliprect, hidden overflow, nowrap and zero border/padding.
Important flags match common accessibility utilities and prevent ordinary
component layout from exposing the description. It does not use display:none,
visibility:hidden, aria-hidden, JS or altered templates. It is not a focusable
skip-link recipe. Existing nodes retain their text and described-by linkage.

Conservative Node22.11.0/Sass1.79.1build PASS. An exact ordered CSS proof removes
only one announced recipe per page, with the exact selector/declaration list in
the JSON, then requires every original selector/declaration/priority/at-rule
ancestor unchanged. Global CSS byte-identical with0rules. The new Kit partial
and public forwarder are identical in canonical and consumer sources.
Eight offline headless cases(4hosts,with/without a theme utility) have1x1geometry,
clipped paint, visible DOM/accessibility-preserving styles and retained
descriptions. Actual assistive-technology/native Moodle testing is not claimed.

BLOCKED: T037,T038 and mirror roundtrip already fail against this canonical
predecessor. Guide discovery/specimen SCSS and the existing embedded Guide
engine differ before this lot. Their consumer files and mirror have empty
tracked diffs from5fbdb52e. Those files are explicitly owned by Claude; they
are not resynchronized, relaxed or rewritten to manufacture a PASS here.
The Guide's pre-existing private hidden-text helper also remains untouched;
its eventual delegation to this public recipe is an owning-Guide follow-up.
Thus full canonical parity and the required Guide gate remain NOT PASSED.

Official local_codechecker supported non-PHP files0errors/0warnings, no PHP
modified. The new JS proof harness has0ESLint errors/warnings. No frontend source,
template, dependency or runtime changes. Nothing published; canonical main
unchanged. Evidence: C:/dev/artifacts/a10-visually-hidden-20261017/.
