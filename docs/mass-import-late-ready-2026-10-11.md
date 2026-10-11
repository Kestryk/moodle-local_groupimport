# R10-16 readiness sub-lot — Mass Import late initialization

R10-17 first native run43272 fails before any Preview click: the real Mass
Import root becomes degraded after the original fail-open deadline, then AMD
sets data-easyedu-loading-ready=1 without recovering its state. No page error,
business write or guard failure is recorded. Original spec/run stays immutable;
cleanup is complete. This is not a passing empty-file interaction test.

The existing loading bootstrap already exposes a bounded opt-in used by Student
Management: data-easyedu-loading-recover-late-ready=1. Mass Import now consumes
that same option through one root attribute. The original deadline, fail-open
reveal, interaction restoration, visual-stability checks, observers and cleanup
are unchanged. Late ready changes state only after real initialization/stability;
it never replays Skeleton, moves focus or invents component readiness.

No shared engine/SCSS/AMD change or new Foundation family is applicable. This
is not a claim of faster loading or the complete intelligent local Skeleton
R10-16 feature. The latter still requires deferred-component inventory and
targeted placeholders tied to their actual lifecycles. Existing Student late-
ready evidence and every accepted Motion contract remain pinned.

Run the unchanged strict empty-picker native scenario after ordered preview.
Retain ready=ready, actual AMD marker, real picker readiness and no POST rules;
do not accept degraded as a successful widget state or extend its readiness
deadline. Source successor reconstructs the exact prior index minus this one
opt-in and preserves the bootstrap/Motion/parser/Guide/styles. Native results
remain separate from this source correction and human acceptance.
