const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), kit = path.resolve(process.argv[2]), base = '8c5d6c4';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => cp.execFileSync('git', ['show', `${base}:${file}`], {cwd: root, encoding: 'utf8', maxBuffer: 3000000}).replace(/\r\n/g, '\n');
for (const file of ['scss/easyedu/_workspace-classes.scss', 'scss/easyedu/_tokens.scss']) {
    assert.equal(read(file), fs.readFileSync(path.join(kit, file), 'utf8').replace(/\r\n/g, '\n'), file + ' canonical identity');
}
const normalize = css => css
    .replace(/--easyedu-workspace-title-size(?:-narrow)?:[^;]+;/g, '')
    .replace(/\.easyedu-ui \.easyedu-workspace(?:-eyebrow|-description|-title-control \.select-menu > \.dropdown-toggle)\s*\{[^{}]*\}/g, '')
    .replace(/\s+/g, ' ').trim();
assert.equal(normalize(read('styles.css')), normalize(old('styles.css')), 'Entire non-header CSS unchanged');
const workspace = read('scss/easyedu/_workspace-classes.scss');
for (const role of ['type-eyebrow', 'type-page-title', 'type-body']) assert.ok(workspace.includes(`@include type.${role};`));
assert.ok(!/font: 700 0\.875rem|font: 400 1rem/.test(workspace));
for (const file of ['amd/src/course_manager.js', 'amd/src/motion.js', 'amd/src/searchable_choices.js',
    'templates/manage.mustache', 'settings.php', 'index.php', 'ajax.php', 'manage.php']) {
    assert.equal(read(file), old(file), 'Unchanged lifecycle/content/commands: ' + file);
}
console.log('PASS canonical header roles; all other CSS, native content, Motion and commands unchanged');
