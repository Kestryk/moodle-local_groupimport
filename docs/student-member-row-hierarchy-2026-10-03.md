# Student member-row hierarchy — 2026-10-03

## Requested correction

Participants listed inside a Group card must read as subordinate content, not
as a second Group title. The accepted native row behavior, disclosure Motion,
selection routing, remove command and responsive containment stay unchanged.

## Source candidate

The shared `related-person-name` recipe now reads the dedicated
`--easyedu-related-person-name-color` token, default `#49657a`, rather than the
owning card-title role `#264861`. Font family, 13px size, 600 weight and 1.35
line-height remain unchanged. This gives the title/member hierarchy a measurable
contrast without weakening the member name into tertiary metadata.

The existing native compact row remains the geometry source: no card/list
Motion, max-height, focus containment, selection command or DOM structure is
changed. Penpot Foundation and every active EasyStud Group composition must
adopt the quieter text role and reconcile the old 52px/32px design specimen
against the 42px compact native composition before visual acceptance.

Kit checkpoint `2263171` publishes version 0.4.68. Foundation Standard and
Library each contain eight linked rows at 42px; the EasyStud Student management
page contains twelve linked compositions at widths 236, 282, 522 and 624px.
Every read-back reports Inter 13px/600 `#49657a` and zero vertical centre delta
for name, checkbox and 32px remove surface. The representative PNG export timed
out after 120 seconds, so this is structural/paint readback rather than agent or
human visual acceptance. See
`docs/testing/student-member-row-hierarchy-penpot-2026-10-03.json`.

## Gates

- Kit related-person contract and SCSS-only package privacy test.
- Canonical/embedded `_tokens.scss` and `_cards.scss` hashes.
- Consumer Sass rebuild and focused member-row source contract.
- Foundation Standard/Library readback, then EasyStud product propagation.
- Managed Moodle 5.1 read-only responsive geometry/paint/focus proof.
- Combined human checklist remains open.

No member is moved or removed by these tests. No card/disclosure animation is
rewritten.
