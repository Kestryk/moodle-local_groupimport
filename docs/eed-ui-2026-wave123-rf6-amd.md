# EasyStud Waves RF6 - AMD runtime format repair

## Failure

The RF4 source commit contained a generated `course_manager.min.js` beginning
with a top-level ES module `import`. Moodle serves plugin AMD bundles through
RequireJS aggregation, so the invalid bundle was parsed while loading
`core/first` and `core_form/changechecker`. Both failed with `No define call`,
which also prevented CCB and EasyStud initialisation.

## Repair

`course_manager.min.js` and its source map are rebuilt through Moodle Grunt in
an isolated copied component stage with Node 22.11. The runtime bundle now
starts with `define("local_groupimport/course_manager", ...)` and contains no
top-level `import` or `export` declaration.

The new release contract checks every generated EasyStud JavaScript bundle,
not only Course Manager, so a raw ESM artefact cannot be promoted again.

## Boundaries

- No source JavaScript, SCSS, PHP, data, import behavior or modal behavior is
  changed.
- No browser scenario is required. The managed preview must be repaired once,
  Moodle caches purged, and the two failing RequireJS URLs re-read before human
  visual review resumes.
