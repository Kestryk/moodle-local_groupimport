// SM-54: exact opt-in adapter, no changes to filters/commands/card Motion.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict'), root = path.resolve(__dirname, '../..');
const kit = path.resolve(process.argv[2]), postcss = require(process.argv[3]);
const base = 'd38a11eee82cc43ef776a6497110df1555555614';
const norm = s => s.replace(/\r\n/g, '\n');
const read = f => norm(fs.readFileSync(path.join(root, f), 'utf8'));
const old = f => norm(cp.execFileSync('git', ['show', `${base}:${f}`], {cwd: root, encoding: 'utf8', maxBuffer: 5000000}));
for (const f of ['scss/easyedu/components/_forms.scss', 'scss/easyedu/_foundation-classes.scss']) {
    assert.equal(read(f), norm(fs.readFileSync(path.join(kit, f), 'utf8')), f + ' canonical identity');
}
let template = read('templates/manage.mustache');
assert.equal((template.match(/easyedu-filter-disclosure--capsule /g) || []).length, 4);
template = template.replace(/easyedu-filter-disclosure--capsule /g, '').replace(
    /                                <span class="easyedu-filter-disclosure__content">\n                                    (<span class="local-groupimport-easystud-advanced-filters__more">.*?<\/span>)\n                                    (<span class="fa fa-chevron-down" aria-hidden="true"><\/span>)\n                                <\/span>/g,
    '                                $1\n                                $2');
assert.equal(template, old('templates/manage.mustache'), 'four exact wrapper/class-only adapters');
const fingerprint = css => {
    const rows = [];
    postcss.parse(css).walkRules(rule => {
        const context = [];
        for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
            if (p.type === 'atrule') context.unshift(`${p.name} ${p.params}`);
        }
        for (const selector of rule.selectors.filter(s => !s.includes('.easyedu-filter-disclosure--capsule'))) {
            rows.push([context, selector, rule.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value, n.important])]);
        }
    });
    return rows;
};
assert.deepEqual(fingerprint(read('styles.css')), fingerprint(old('styles.css')), 'all unrelated CSS/arrow/Show-all preserved');
const files = cp.execFileSync('git', ['ls-files', 'amd', 'motion', 'choices', 'js', 'settings.php', 'ajax.php',
    'manage.php', 'index.php', 'lib.php', 'lang', 'scss/components', 'scss/responsive', 'scss/views'], {cwd: root, encoding: 'utf8'}).trim().split('\n');
for (const file of files) assert.equal(read(file), old(file), file + ' unchanged');
console.log('PASS SM-54 canonical identity, four exact wrappers, whole unrelated CSS/commands/Motion preserved');
