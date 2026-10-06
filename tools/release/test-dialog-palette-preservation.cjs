const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = 'be0c5e6033b649d898daa7cf3ff3b8e1229b48c0';
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const old = f => execFileSync('git', ['show', `${baseline}:${f}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
let blocks = 0;
const cleanCss = read('styles.css').replace(/(?:\.easyedu-ui\[data-easyedu-dialog-palette[^{}]*|\.easyedu-ui \.easyedu-dialog-header-palette[^{}]*)\{[^{}]*\}\n\n/g, block => {
    assert.ok(!/\b(?:width|height|padding|margin|font-size|transform|transition|position|display)\s*:/.test(block));
    blocks++; return '';
});
assert.equal(blocks, 5); assert.ok(cleanCss === old('styles.css'), 'Complete unrelated CSS identity');
assert.ok(read('templates/manage.mustache') === old('templates/manage.mustache')
    .replace('    data-easyedu-custom-rails="{{themerailroles}}"', '$&\n    data-easyedu-dialog-palette="{{themerailroles}}"')
    .replace('modal__header easyedu-entity-dialog__header"', 'modal__header easyedu-entity-dialog__header easyedu-dialog-header-palette--primary"')
    .replace('aria-labelledby="local-groupimport-easystud-move-title"\n    >\n        <div class="local-groupimport-easystud-modal__dialog">\n            <div class="local-groupimport-easystud-modal__header">',
        'aria-labelledby="local-groupimport-easystud-move-title"\n    >\n        <div class="local-groupimport-easystud-modal__dialog">\n            <div class="local-groupimport-easystud-modal__header easyedu-dialog-header-palette--primary easyedu-dialog-header-palette--plain">'),
    'Only root-role flag and two header modifiers in Mustache');
assert.ok(read('index.php') === old('index.php')
    .replace("    'data-easyedu-custom-rails' => $themerailroles,", "$&\n    'data-easyedu-dialog-palette' => $themerailroles,")
    .replace("['class' => 'easyedu-dialog-header']", "['class' => 'easyedu-dialog-header easyedu-dialog-header-palette--primary']"),
    'Mass root/header classes only; rollback/data unchanged');
const addition = "\n    const header = node.querySelector('.modal-header');\n    if (header) {\n        header.classList.add('easyedu-dialog-header-palette--primary');\n    }\n";
assert.ok(read('amd/src/course_manager.js') === old('amd/src/course_manager.js')
    .replace('    const theme = window.getComputedStyle(workspace);\n', '$&' +
        '    // These opt-in tokens disappear on Restore defaults. A reused portal must\n' +
        '    // not retain its previous custom tint when the root no longer supplies it.\n' +
        "    portal.style.removeProperty('--easyedu-dialog-palette-primary-header');\n" +
        "    portal.style.removeProperty('--easyedu-dialog-palette-success-header');\n")
    .replace("    node.classList.toggle('is-loading', !node.querySelector('#bulk-message'));\n", '$&' + addition)
    .replace('settings-modal__header easyedu-entity-dialog__header">',
        'settings-modal__header easyedu-entity-dialog__header easyedu-dialog-header-palette--success">'),
    'Header decoration and two optional relay resets only; commands/loading/Motion preserved');
for (const f of ['lib.php', 'manage.php', 'settings.php', 'ajax.php', 'amd/src/motion.js', 'amd/build/motion.min.js',
    'amd/src/searchable_choices.js', 'amd/build/searchable_choices.min.js', 'scss/components/_modals.scss',
    'scss/components/_settings-modal.scss', 'scss/easyedu/_tokens.scss', 'scss/easyedu/adapters/_moodle-message-dialog.scss',
    'scss/easyedu/components/_guide.scss', 'scss/easyedu/_workspace-control-classes.scss']) {
    assert.equal(read(f), old(f), `${f}: identity`);
}
for (const f of ['scss/easyedu/_dialog-classes.scss', 'scss/easyedu/_dialog-palette-classes.scss']) {
    assert.equal(read(f), fs.readFileSync(path.resolve(process.argv[2], f), 'utf8').replace(/\r\n/g, '\n'), 'Canonical module identity');
}
console.log('PASS five shared paint blocks, exact root/header adapters and complete unrelated CSS/commands/Motion/Guide identity.');
