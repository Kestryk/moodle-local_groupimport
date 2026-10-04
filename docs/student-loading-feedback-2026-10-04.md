# Skeleton feedback successor - SM-40

The native diagnostic at 1600/768/390 proves enabled Motion and an advancing
3.2s sweep, not a missing animation. Shared pale-cue sweep opacity now uses
Kit 0.4.93's 0.20/0.60 edge/highlight values. The same tokens are included in
Student Management, Administration and Mass Import roots; all loading frames
stay quiet and static. No animation preference is bypassed.

Student Management depicts only its eyebrow/title/description header slots:
remove two fictitious header-action placeholders and the obsolete minimum
header height. Both columns call the same shared Skeleton filter-region recipe
and contain the same Search/filter cues. Card-copy background lines already
have the shared animated overlay; they were not missing keyframes.

Canonical Kit pin: `115939a05f45c947e568dd6657f086945fe6885b`.
Updated `_tokens.scss` and `_loading.scss` are byte-identical to their providers.
Sass 1.79.1 rebuild succeeds; its existing mixed-declarations warning remains.
`test-loading-feedback-successor.ps1` passes exact two-edit template comparison
and unchanged native controllers, bootstrap, business endpoints and original
card Motion against `0b21bcd`. Historical strict SM-16/SM-15 gates remain pinned;
their old template hashes do not certify this explicitly requested successor.

Paired Foundation filter states and corrected Motion notes are documented in
the Kit `docs/components/loading-feedback-2026-10-04.md`. The existing gradient
midpoint was already compatible with the requested stronger subtle sweep; do
not repaint or detach its twelve original providers. Full product loading
compositions, complete Mass Import/Admin native lifecycle and human acceptance
remain open until their evidence is appended here.

New immutable successor scenario: `student-loading-feedback-preview.spec.js`.
It holds only native AMD initialization GETs briefly, verifies running Motion,
three header slots, paired filter geometry and real QA role options, then
releases the hold and checks native readiness/ARIA. No upload/Send/Move or
fixture removal. External captures are not source files.
