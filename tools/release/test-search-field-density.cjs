/* eslint-env node */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const [kit, postcssPath, baseline = '6dca72c1'] = process.argv.slice(2);
assert.ok(kit && postcssPath, 'Pass canonical Kit root and PostCSS package path.');
const postcss = require(path.resolve(postcssPath));
const norm = value => value.replace(/\r\n/g, '\n');
const read = file => norm(fs.readFileSync(path.join(root, file), 'utf8'));
const before = file => norm(cp.execFileSync('git', ['show', baseline + ':' + file], {
    cwd: root, encoding: 'utf8', maxBuffer: 8e6,
}));
const mixin = source => source.match(/@mixin search-field-intrinsic \{[^}]+\}/)[0];
assert.equal(mixin(read('scss/easyedu/components/_forms.scss')),
    mixin(norm(fs.readFileSync(path.join(kit, 'scss/easyedu/components/_forms.scss'), 'utf8'))));
const rules = source => {
    const result = [];
    postcss.parse(source).walkRules(rule => {
        if (rule.selector.includes('easyedu-search-field--captioned') ||
                rule.selector.includes('__search-field--structure')) {
            return;
        }
        const parents = [];
        for (let p = rule.parent; p.type !== 'root'; p = p.parent) {
            parents.unshift([p.name, p.params]);
        }
        result.push({parents, selector: rule.selector, decls: rule.nodes.filter(n => n.type === 'decl')
            .map(n => [n.prop, n.value, !!n.important])});
    });
    return result;
};
for (const file of ['styles/student-management.css', 'styles/mass-import.css', 'styles/administration.css', 'styles/guide.css']) {
    assert.deepEqual(rules(read(file)), rules(before(file)), 'Unrelated ordered CSS unchanged: ' + file);
}
for (const file of ['amd/src/local/cm/guide_launcher.js', 'amd/src/local/cm/navigation.js',
    'amd/src/local/cm/group_cards.js', 'amd/src/motion.js', 'templates/manage.mustache',
    'scss/easyedu/_workspace-control-classes.scss']) {
    assert.equal(read(file), before(file), 'Behavior and markup unchanged: ' + file);
}
assert.ok(read('scss/components/_forms.scss').includes(':not(&--structure-focus):not(&--responsive-workspace)'));
assert.ok(read('scss/easyedu/_workspace-control-classes.scss').includes('> .fa, > input { grid-row: 2; }'));
process.stdout.write(JSON.stringify({passed: true, canonicalMixin: true, unrelatedCSS: 'unchanged',
    captionAndSingleInputRow: 'preserved', nativeVisibility: 'desktop guard retained; compact region owns visibility'}) + '\n');
