# Git workflow for `local_groupimport`

This repository currently supports two parallel tracks:

- `main`: stable production line for the existing `Group import CSV` plugin.
- `develop/easyedu-refactor`: integration line for the future `EasyStud` experience.

## Branch roles

- `main`
  - Keep this branch releasable at all times.
  - Do not merge in-progress refactor work here.
  - Only merge fully validated release branches here.

- `develop/easyedu-refactor`
  - Main integration branch for the ongoing refactor.
  - All EasyStud feature branches should branch from this line.
  - This branch can evolve freely until the new version is ready for stabilization.

- `feature/*`
  - Short-lived branches for focused work.
  - Examples:
    - `feature/easyedu-ui`
    - `feature/easyedu-bulk-actions`
    - `fix/easyedu-styles`
  - Branch from `develop/easyedu-refactor`.
  - Merge back into `develop/easyedu-refactor`.

- `release/*`
  - Created only when the refactor is ready for hardening.
  - Example: `release/easyedu-1.0`
  - Use for testing, cleanup, versioning, and final Moodle compliance checks.
  - Merge to `main` only when validated.

## Current repository baseline

- Stable baseline tag for the existing production plugin:
  - `v1.0-groupimport-csv`

- Active refactor integration branch:
  - `develop/easyedu-refactor`

## Important Moodle note

During the refactor, keep the technical plugin identity unchanged:

- Folder: `local/groupimport`
- Component: `local_groupimport`

This avoids unnecessary migration complexity while the new version is still under development.
The functional / product naming can evolve later without immediately changing the technical plugin identity.

## Recommended daily workflow

1. Update local refactor branch:
   - `git checkout develop/easyedu-refactor`
   - `git pull`

2. Create a focused branch:
   - `git checkout -b feature/my-change`

3. Commit small coherent changes.

4. Merge back into `develop/easyedu-refactor` after validation.

5. Create `release/*` only when the refactor is functionally complete.

6. Merge `release/*` into `main` only for the final public version.

## Multi-machine development

Before changing workstation, follow the canonical
[EasyEdu project handoff procedure](https://github.com/Kestryk/workstation-sync/blob/main/docs/PROJECT-HANDOFF.md).
Create a recovery snapshot, commit and push all source changes, then resume only
from a clean checkout with `git pull --ff-only`. Use a pushed WIP commit for
unfinished work; do not transfer work with stash or Syncthing worktrees.

## Release validation

Run the non-destructive release audit before creating a release branch or a
Moodle plugin package:

```powershell
.\tools\release\validate-plugin.ps1
```

The audit compares the current code with the historical
`v1.0-groupimport-csv` tag, verifies the technical component, chronological
upgrade savepoints, XMLDB version, feature defaults, current user-tour targets
and production-package exclusions.

To also build and inspect a production ZIP in the system temporary directory:

```powershell
.\tools\release\validate-plugin.ps1 -BuildArchive
```

This validation does not modify the Moodle database. A release candidate must
still be rehearsed on a disposable copy of an existing Moodle site before it
is merged into `main`.

On the supported local Moodle Windows stack, run the isolated legacy-upgrade
rehearsal with:

```powershell
.\tools\release\test-legacy-upgrade.ps1
```

The script clones the local database into a uniquely named temporary database,
recreates the `v1.0-groupimport-csv` plugin state, executes the real Moodle
local-plugin upgrade pipeline, verifies the resulting schema and configuration,
then removes the temporary database and dataroot. It never points the upgrade
runner at the source database.
