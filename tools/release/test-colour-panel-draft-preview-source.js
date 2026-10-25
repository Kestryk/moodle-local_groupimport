// SM-58 bounded successor: preserve SM-46 and all later unrelated source pins.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), kit = path.resolve(process.argv[2]);
const postcss = require(process.argv[3]), base = '087956f4d2a02a34bc73950eddda090be7be1cb7';
const norm = s => s.replace(/\r\n/g, '\n');
const read = f => norm(fs.readFileSync(path.join(root, f), 'utf8'));
const old = f => norm(cp.execFileSync('git', ['show', `${base}:${f}`], {
    cwd: root, encoding: 'utf8', maxBuffer: 5000000,
}));
for (const [consumer, canonical] of [
    ['js/easyedu_colour_picker.js', 'colour-picker/colour-picker.js'],
    ['scss/easyedu/components/_color-panel.scss', 'scss/easyedu/components/_color-panel.scss'],
]) assert.equal(read(consumer), norm(fs.readFileSync(path.join(kit, canonical), 'utf8')), consumer);
const controller = read('js/easyedu_colour_picker.js')
    .replace("        var header = el('div', 'easyedu-color-panel__header', null, dialog);\n", '')
    .replace("var title = el('h2', 'easyedu-color-panel__title', labels.title, header);",
        "var title = el('h2', 'easyedu-color-panel__title', labels.title, dialog);")
    .replace(/        \/\/ The editable Hex already names the draft\.[\s\S]*?preview\.setAttribute\('aria-hidden', 'true'\);\n/, '');
assert.equal(controller, old('js/easyedu_colour_picker.js'), 'all draft/HSV/focus/commands preserved');
const fingerprint = css => {
    const rows = [];
    postcss.parse(css).walkRules(rule => {
        const context = [];
        for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
            if (p.type === 'atrule') context.unshift(`${p.name} ${p.params}`);
        }
        for (const selector of rule.selectors.filter(s => !s.includes('easyedu-color-panel') &&
                !s.includes('easyedu-color-picker__trigger'))) {
            rows.push([context, selector, rule.nodes.filter(n => n.type === 'decl')
                .map(n => [n.prop, n.value, n.important])]);
        }
    });
    return rows;
};
assert.deepEqual(fingerprint(read('styles.css')), fingerprint(old('styles.css')), 'whole unrelated CSS unchanged');
const files = cp.execFileSync('git', ['ls-files', 'amd', 'motion', 'choices', 'templates', 'settings.php',
    'ajax.php', 'manage.php', 'index.php', 'lib.php', 'lang', 'js/admin_settings_loading.js',
    'scss/components', 'scss/responsive', 'scss/views'], {cwd: root, encoding: 'utf8'}).trim().split('\n');
for (const file of files) assert.equal(read(file), old(file), file + ' unchanged');
console.log('PASS SM-58 canonical identity, exact DOM-only successor, unrelated CSS/business/Motion/settings authority preserved');
