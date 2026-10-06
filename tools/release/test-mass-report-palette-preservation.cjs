// SM-64 successor, independently pinned; do not weaken earlier SM-59 guards.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '9726efb1f93cc5c215899ad77b8caabea7d86931';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
let blocks = 0;
const css = read('styles.css').replace(/(?:\.easyedu-ui\[data-easyedu-report-palette[^{}]*|\.easyedu-ui \.easyedu-button--outline-primary\.btn[^{}]*)\{[^{}]*\}\n*/g, block => {
    assert.ok(!/\b(?:width|height|padding|margin|font|font-size|transition|animation|position|display|gap)\s*:/.test(block),
        'Palette adds no layout/type/Motion declarations');
    blocks++; return '';
});
assert.equal(blocks, 7);
// The inserted family follows a media group whose preceding newline is kept.
assert.equal(css, old('styles.css'), 'Full unrelated CSS and default report recipe identity');
let index = old('index.php').replace("    'data-easyedu-dialog-palette' => $themerailroles,",
    "$&\n    'data-easyedu-report-palette' => $themerailroles,");
for (const [before, after] of [
    ['local-groupimport-import-summary__item--success', 'easyedu-report-summary--success'],
    ['local-groupimport-import-report__title--success', 'easyedu-report-title--success'],
    ['local-groupimport-import-report--success', 'easyedu-report-list--success'],
    ['local-groupimport-import__export-results', 'easyedu-button--outline-primary'],
]) index = index.replaceAll(`${before}'`, `${before} ${after}'`);
assert.equal(read('index.php'), index, 'Only role flag and public classes; data/import/history/Export unchanged');
assert.equal(read('scss/views/_mass-import.scss'), old('scss/views/_mass-import.scss')
    .replace('easyedu.report-summary-item(#eef8f2, #cfe7d9, #1f6748)', 'easyedu.report-success-summary')
    .replace('easyedu.report-title(#1f6748)', 'easyedu.report-success-title')
    .replace('    background: #e4f5eb;\n    color: #1f6748;', '    @include easyedu.report-success-glyph;'),
    'Exact default recipes moved to canonical Kit, not recoloured privately');
for (const file of ['lib.php', 'manage.php', 'settings.php', 'ajax.php', 'templates/manage.mustache',
    'amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/src/motion.js', 'amd/build/motion.min.js',
    'amd/src/csv_import.js', 'amd/build/csv_import.min.js', 'scss/easyedu/_tokens.scss', 'scss/easyedu/components/_buttons.scss',
    'scss/easyedu/components/_tables.scss', 'scss/easyedu/components/_guide.scss', 'scss/easyedu/_dialog-palette-classes.scss']) {
    assert.equal(read(file), old(file), `${file}: full identity`);
}
for (const file of ['scss/easyedu/_report-palette-classes.scss', 'scss/easyedu/components/_reports.scss',
    'scss/easyedu/_data-classes.scss']) {
    assert.equal(read(file), fs.readFileSync(path.resolve(process.argv[2], file), 'utf8').replace(/\r\n/g, '\n'),
        `${file}: canonical module identity`);
}
console.log('PASS SM-64 seven scoped paint blocks; full unrelated/default CSS, PHP commands, controllers, Motion and Guide preserved.');
