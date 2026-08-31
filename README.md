# EasyStud for Moodle

EasyStud is a Moodle local plugin for managing course participants, groups and
groupings. It keeps the original Mass Import workflow compatible while adding
an optional simplified student management interface.

The technical identity remains `local_groupimport` so sites can upgrade from
the historical Group Import CSV plugin without moving data or changing URLs.

## Main features

### Mass Import

- Accepts CSV, XLS and XLSX files.
- Detects common column names and lets teachers review editable rows before import.
- Identifies learners automatically with every field enabled by the administrator:
  username, email, ID number or approved custom profile fields.
- Allows different identifier types in the same file.
- Creates missing groups and optional groupings.
- Supports additive imports and explicit synchronisation of the groups listed in a file.
- Records reversible operations in a course-level history.
- Can restore an import without discarding unrelated changes made later.
- Provides a styled Excel example with instructions and representative rows.
- Keeps the Mass Import view behind a server-rendered loading skeleton until
  its AMD controls are ready, using the shared bottom-end `Loading in progress`
  indicator during bootstrap and real actions.

### Simplified student management

- Manages enrolled participants, groups and groupings from one responsive view.
- Supports search, filters, pagination, multiple selection, context menus and drag-and-drop.
- Uses Moodle-native group APIs and does not enrol new course users.
- Includes the EasyStud contextual guide and guided paths.
- Can be enabled or disabled globally by an administrator.

### Administration settings

- Keeps Moodle's native settings APIs and controls while showing a structural
  EasyStud skeleton until dependency/show-hide controls settle.
- Uses the common EasyStud page identity and a Skeleton whose section/card
  rhythm represents the settings that will replace it.
- Reuses the shared bottom-end `Loading in progress` indicator during the
  settings bootstrap.

## Upgrade behaviour

Existing installations remain in Mass Import-only mode after upgrading. An
administrator can enable **Simplified student management** from:

`Site administration > Plugins > Local plugins > EasyStud`

Fresh installations enable the complete EasyStud experience by default.

When the simplified view is disabled:

- Moodle's native Participants link is left unchanged;
- the EasyStud manager is not added to course navigation;
- direct manager access returns to Mass Import with an information notice;
- Mass Import, its history and its reports remain available.

## Import file format

The importer requires a learner identifier and a group name. A grouping name is
optional. Friendly header variants such as `student`, `email`, `group`,
`groupname`, `grouping` and their French equivalents are recognised.

| Column | Required | Purpose |
| --- | --- | --- |
| Learner identifier | Yes | Any administrator-enabled unique user field |
| Group name | Yes | Existing or new Moodle group |
| Grouping name | No | Existing or new Moodle grouping |

Use **Download example** in Mass Import to obtain the formatted XLSX workbook.

## Reimport strategies

- **Keep current placements** adds only missing memberships and assignments.
- **Synchronise listed groups** makes the memberships and grouping assignments
  of each listed group match the selected preview rows.

The replacement strategy only affects groups included in the confirmed rows.
Every addition and removal is stored in the reversible history.

## Permissions and data

The course tools require `moodle/course:managegroups`. EasyStud never creates
users or enrols users into a course.

Import history stores the acting user, uploaded filename, summary counters and
the reversible operation journal. The plugin implements Moodle's Privacy API
for export and deletion of this data.

## Development

- Moodle requirement: 5.1 or later on this refactor branch.
- SCSS entry point: `scss/easystud.scss`.
- Compile styles with `sass scss/easystud.scss styles.css --no-source-map`.
- Playwright documentation: `tools/playwright/README.md`.
- Mass Import loading contract: `docs/testing/mass-import-loading-state.md`.
- Administration settings loading contract: `docs/testing/admin-settings-loading-state.md`.
- Authenticated Playwright checks use the DPAPI-backed
  `tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1` runner
  with configurable local loader and orchestration paths.
- Shared EasyEdu contracts: `easyedu-kit-docs/`.
- Multi-machine workflow: follow the canonical
  [EasyEdu handoff procedure](https://github.com/Kestryk/workstation-sync/blob/main/docs/PROJECT-HANDOFF.md).

The embedded EasyEdu kit and development documentation are excluded from
production packages through `.gitattributes` where appropriate.

## License

GNU General Public License v3 or later.
