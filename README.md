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
- Lets administrators hide the combined Complete view and choose which
  available workspace opens first; compact layouts keep their native
  Participants / Groups / Groupings navigation.

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

## Languages

EasyStud includes English, French, European Portuguese (`pt`) and German (`de`).
Enable the corresponding Moodle language pack to use it in the interface.
See the [translation conventions and validation](docs/localisation-pt-de-2026-10-25.md).

## Development

Internal release scripts are indexed by purpose, prerequisites and last documented result in
[the test suite catalogue](docs/testing/TEST-SUITE-CATALOGUE.md).

- Personal Display and animations (ANIM): `docs/display-preferences-2026-10-17.md`.
- Build release AMD with `node tools/release/build-amd-official.cjs MOODLE_BUILD_ROOT`;
  verify with the same command plus `--check`. This runs Moodle's official Grunt
  pipeline, including zero-warning ESLint, in isolated staging. Historical
  module-specific builders must be followed by this canonical build before a
  release commit. See [the AMD build contract](docs/testing/official-amd-build-2026-10-25.md).

- The manifest allows installation from Moodle 4.5 (`version.php`). Native
  Moodle 4.5 installation, upgrade and functional certification remain pending
  phase 10 (K18-04). Moodle 5.3 also needs its version-specific release evidence;
  do not infer certified support from the minimum-version field alone.
- SCSS entry point: `scss/easystud.scss`.
- Build page styles with the pinned Node executable and the conservative
  builder: `tools/release/build-styles.cjs SASS_ROOT styles.css conservative POSTCSS_ROOT`.
  The site-wide `styles.css` is intentionally kept free of EasyStud rules.
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

### Release build toolchain provenance

`tools/release/build-versions.json` pins Node 22.11.0 and Sass 1.79.1. Release
builders reject a different Node version before build work; CSS builders also
check the loaded Sass version. No dependency upgrade is required. Use the
portable Node 22.11.0 executable and the existing Sass/PostCSS packages. The
release check and parity evidence are documented in
`docs/testing/tri38-exact-versions-2026-10-17.md` and
`docs/testing/node22-build-parity-2026-10-17.md`. The older
`tri38-toolchain-2026-10-17.md` report is a historical Node 20 inspection, not
the current toolchain status.
