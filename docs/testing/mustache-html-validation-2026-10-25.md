# Mustache fragment and HTML validation

The Mustache examples use Moodle's example-context extractor and renderer.
Validate the resulting documents with the HTML validator used by Moodle CI.
Preserve the example JSON without adjacent closing object braces: `}}` terminates
a Mustache comment even inside its example JSON.

## Semantic elements

The Guide's return/resume live regions retain `role="status"`, their live-region
attributes, classes, hidden state and commands on neutral `div` elements. An
`aside` cannot take this role. The compact navigation dialog likewise retains
its modal semantics on a `div`, rather than an `aside` with an invalid dialog role.
No command, focus handler, class or data selector changes.

Student Management's no-JavaScript recovery now lives in the page layout SCSS.
Moodle's early body bootstrap adds `body.jsenabled`; without that bootstrap the
existing position/visibility declarations still reveal the real-content host.
This replaces an invalid body `noscript > style`, retaining both declarations.

## Parent-dependent fragments

`easyedu_navigation_items` emits list items inside the navigation wrapper's lists.
`sm/context_action` emits menu items inside the management page's menu/submenus.
Their standalone body-wrapped documents are intentionally incomplete HTML.
Moodle's JSON context mechanism cannot supply a wrapping parent.

The two exact filenames are therefore listed in their directory-local
`.mustachelintignore`, Moodle's standard HTML-only exemption. Their context JSON
and Mustache rendering remain checked. The navigation example already supplies
list entries. The management example now supplies both a direct action and a
submenu action, so both real menu parent paths are validated. Do not replace
these exact filenames with directory-wide patterns or remove their roles.

## Regression gate

Render all 26 tracked templates: no missing contexts, empty output or exceptions.
Validate 24 complete documents, including both fragment consumers. Compare native
Student Management, Guide and compact navigation before/after in FR/EN at desktop
and mobile widths, retaining independent failed harness runs and exact runtime
restoration evidence. No JavaScript source or test fixture changes are required.
