# Personal display preferences / Guide mirror handoff — 2026-10-17

This additive branch combines accepted ANIM `88d8e83d` and Guide mirror
`dd986649` on `abf3c636`. Only CHANGELOG/intake unions were needed; consumer
Guide E1–E4 markup is preserved. No source conflict was resolved.
The generic Guide exposes two `data-easyedu-display-open` controls with a
consumer-supplied `displaypreferenceslabel`; Moodle keeps its existing `str`
adapter, initialization and persistence. No generic Guide engine action is
invented and no new dependency is introduced.

The canonical Kit receives `_preferences-classes.scss` verbatim and the generic
`display_preferences` composition. This single class recipe is shared with
EasyStud. Product name and translated text are parameters; Moodle preference
storage and native-dialog lifecycle remain the product adapter's responsibility.
The existing ANIM native six-case evidence remains its own evidence; this
additive handoff proves isolated preferences behavior and exact mirror parity.
It is not published to localhost or another runtime by this mirror lot.
