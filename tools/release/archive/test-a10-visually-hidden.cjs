/* eslint-env node */
'use strict';

// Exact additive CSS gate: no existing ordered rule/declaration may change.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const [postcssPath, canonicalRoot, output, base = '817dea20'] = process.argv.slice(2);
assert.ok([postcssPath, canonicalRoot, output].every(value => value && path.isAbsolute(value)),
    'Pass absolute PostCSS, canonical Kit and external proof paths');
const postcss = require(postcssPath);
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const baseline = file => execFileSync('git', ['-C', root, 'show', base + ':' + file],
    {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}).replace(/\r\n/g, '\n');
const selectors = {
    'student-management': ['.local-groupimport-easystud .visually-hidden', '.easyedu-guide .visually-hidden'],
    'mass-import': ['.local-groupimport-import .visually-hidden'],
    'administration': ['.local-groupimport-admin .visually-hidden'],
};
const expected = [['border', '0', true], ['clip', 'rect(0, 0, 0, 0)', true], ['height', '1px', true],
    ['margin', '-1px', true], ['overflow', 'hidden', true], ['padding', '0', true],
    ['position', 'absolute', true], ['white-space', 'nowrap', true], ['width', '1px', true]];
function ordered(ast) {
    const rows = [];
    ast.walk(node => {
        if (node.type === 'comment') {
            return;
        }
        const parents = [];
        for (let parent = node.parent; parent; parent = parent.parent) {
            if (parent.type === 'atrule') {
                parents.unshift([parent.name, parent.params]);
            }
        }
        if (node.type === 'rule') {
            rows.push(['rule', parents, postcss.list.comma(node.selector)]);
        } else if (node.type === 'decl') {
            rows.push(['decl', parents, node.parent.selector || null, node.prop, node.value, !!node.important]);
        } else if (node.type === 'atrule') {
            rows.push(['at', parents, node.name, node.params]);
        }
    });
    return rows;
}
const proof = {base, pages: {}, addedDefinition: expected, canonicalRecipeFiles: [],
    canonicalSharedFiles: 0, preExistingCanonicalDrift: [], runtimeAccess: false};
for (const [page, allowed] of Object.entries(selectors)) {
    const file = 'styles/' + page + '.css';
    const current = postcss.parse(read(file));
    let added = 0;
    current.walkRules(rule => {
        const names = postcss.list.comma(rule.selector);
        if (!names.some(name => allowed.includes(name))) {
            return;
        }
        assert.deepEqual(names, allowed, page + ': exact announced selector set');
        assert.equal(rule.parent.type, 'root', page + ': no hidden conditional change');
        assert.deepEqual(rule.nodes.filter(node => node.type === 'decl')
            .map(node => [node.prop, node.value, !!node.important]), expected);
        rule.remove();
        added++;
    });
    assert.equal(added, 1, page + ': exactly one added shared recipe');
    assert.deepEqual(ordered(current), ordered(postcss.parse(baseline(file))), page + ': old ordered CSS is unchanged');
    proof.pages[page] = {addedRules: added, selectors: allowed, priorOrderedCssUnchanged: true};
}
assert.equal(read('styles.css'), baseline('styles.css'));
let globalRules = 0;
postcss.parse(read('styles.css')).walkRules(() => globalRules++);
assert.equal(globalRules, 0);
function compareShared(directory) {
    for (const item of fs.readdirSync(path.join(root, directory), {withFileTypes: true})) {
        const relative = path.join(directory, item.name);
        if (item.isDirectory()) {
            compareShared(relative);
        } else if (item.name.endsWith('.scss')) {
            proof.canonicalSharedFiles++;
            const canonical = fs.readFileSync(path.join(canonicalRoot, relative), 'utf8').replace(/\r\n/g, '\n');
            const owned = ['_components.scss', 'components/_accessibility.scss'].some(name =>
                relative.replace(/\\/g, '/') === 'scss/easyedu/' + name);
            if (owned) {
                assert.equal(read(relative), canonical, relative + ': canonical recipe and consumer match');
                proof.canonicalRecipeFiles.push(relative.replace(/\\/g, '/'));
            } else if (read(relative) !== canonical) {
                assert.equal(read(relative), baseline(relative.replace(/\\/g, '/')),
                    relative + ': inherited drift must not become a product edit');
                proof.preExistingCanonicalDrift.push(relative.replace(/\\/g, '/'));
            }
        }
    }
}
compareShared('scss/easyedu');
assert.ok(!read('scss/easyedu/components/_accessibility.scss').includes('display: none'));
assert.ok(read('scss/easyedu/_components.scss').includes('@forward "components/accessibility";'));
proof.globalRules = globalRules;
proof.additiveCssPassed = true;
proof.canonicalRecipePassed = true;
proof.fullCanonicalParity = proof.preExistingCanonicalDrift.length === 0;
proof.passed = proof.fullCanonicalParity;
assert.equal(proof.preExistingCanonicalDrift.length, 0, 'Full shared Kit parity is required after the owning Guide relay');
fs.writeFileSync(output, JSON.stringify(proof, null, 2) + '\n');
process.stdout.write(JSON.stringify({additiveCssPassed: true, pageRecipes: 3, globalRules,
    canonicalRecipeFiles: proof.canonicalRecipeFiles.length, existingCssUnchanged: true,
    fullCanonicalParity: proof.fullCanonicalParity, preExistingCanonicalDrift: proof.preExistingCanonicalDrift}) + '\n');
