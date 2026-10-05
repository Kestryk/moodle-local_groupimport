# SM-47 - Native compact menu composition

Product Penpot only: the generic Foundations menu remains unchanged. Current
page-03 specimen `cef95197-06bc-809e-8008-aeff2352f110` has three product rows
and Guide below them, but omits Moodle's native participant navigation groups.
The real template places Guide first, EasyStud tools next, then native sections.

Authority is `local_groupimport_build_navigation_context` in `manage.php`,
`templates/easyedu_navigation.mustache` and
`bindResponsiveParticipantNavigation` in `amd/src/course_manager.js`.
Moodle's exported action bar resolves capabilities and third-party entries.
The controller copies its original group headings and destination order,
without following links or replacing native desktop markup. Preserve that
authority, routes, commands, original drawer Motion and Guide project boundary.

`student-mobile-navigation-inventory.spec.js` is a saved-credential one-test
local-supervised CI candidate, course 5 at 768/390. It opens/closes the drawer,
compares every copied group/destination with native labels/order/URLs in memory,
records only safe pathnames (not URL queries), and captures top/bottom by actual
scrolling. No destination, Guide or business command is invoked. Media stays
external and manifested; all runtime/credential cleanup is required.
Native inventory and product update are pending. Human checklist OPEN.
