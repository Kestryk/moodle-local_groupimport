# Guide step labels — K27-02 (supersedes K21-04)

Student Management and Mass Import guided-card step labels both inherit the
same guide-visuals capsule (white 74%, 999px radius, inset border, 0.18rem /
0.44rem padding). The Discovery mixin supplies numbering, typography and
wrapping, without removing that surface. The K19-02 text-only reset, scoped
to `.easyedu-guide--mass-import` and kept "intentional" by K21-04, was
removed by K27-02 (27/10/2026): Kevin asked for the same habillage
everywhere, so Mass Import no longer strips the capsule to plain text.
Floating checklist items, commands and the Guide engine are unchanged.
No second capsule component or product-local override is introduced; both
guides render `.easyedu-guide-guided-card__steps li` from the shared Kit
markup (`templates/easyedu_guide.mustache`).
