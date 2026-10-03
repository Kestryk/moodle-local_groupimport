# Student message modal completion — 2026-10-03

## Scope

SM-21 completes the visual contract of Moodle's native bulk-message portal
without replacing its form or sending behavior. The source candidate consumes
EasyEdu UI Kit `0.4.71` (`5851a0f`). The successors correct the native painted
Close from 32.4px to the intended 30.4px border box and restore the visible
glyph removed with Bootstrap's background image.

The shared adapter now:

- applies the canonical 1.9rem modal-header Close control;
- keeps the Inter 16px/700 modal title and existing header/body/footer chrome;
- removes the browser resize grip from the message textarea at every width;
- retains the matched compact, right-aligned Cancel/Send actions;
- replaces the framed radial loader and its blue shadow with the shared quiet,
  unboxed spinner.

Moodle still owns recipients, native asynchronous content, focus trap,
validation, Send/Cancel events and message delivery. The consumer retains only
the portal decoration, token relay and existing EasyEdu entrance/exit Motion.

## Evidence status

The pre-change supervised baseline
`easystud-authenticated-20261003T201931662Z-32504` passes at 1600, 768 and
390px and confirms the footer pair and responsive body. Its captures also show
the native raw header Close and desktop textarea resize grip that this lot
corrects. No message was entered or sent and no fixture was created.

Static Kit contracts pass for the compact portal, canonical Close and SCSS-only
distribution. The consumer Sass build passes with the existing unrelated
mixed-declarations warning. Managed post-change Moodle proof and Penpot
Loading/Sending/Error publication remain pending. Human acceptance remains in
the combined checklist.

## Safety and rollback

Browser proof may select an existing participant, open the native modal and
Cancel only. It must block or avoid Send and all message POST requests.
Rollback is the coherent Kit and consumer source commit; never hand-edit the
generated CSS or reset the shared Moodle runtime.
