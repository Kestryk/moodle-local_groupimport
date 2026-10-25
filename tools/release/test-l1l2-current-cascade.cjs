/* eslint-env node */
'use strict';

// One current-root proof; historical cleanups stay pinned to their historical revisions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const [sassPath, postcssPath, kitPath, output, base = 'HEAD'] = process.argv.slice(2);
assert.ok([sassPath, postcssPath, kitPath, output].every(value => value && path.isAbsolute(value)),
    'Pass absolute Sass, PostCSS, canonical Kit and external proof paths');
const postcss = require(postcssPath);
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const before = file => execFileSync('git', ['-C', root, 'show', base + ':' + file],
    {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}).replace(/\r\n/g, '\n');
const sheets = ['styles.css', 'styles/student-management.css', 'styles/mass-import.css', 'styles/administration.css'];
const baseline = Object.fromEntries(sheets.map(file => [file, before(file)]));
const removedSelectors = []; // All three historical removals are already present in this base.
const priorityChanges = []; // K17-78 retired the grip; current-root proof compares its absence.
const build = require('./build-page-styles.cjs').build(sassPath, postcssPath);
function ordered(css) {
    const result = [];
    postcss.parse(css).walk(node => {
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
            result.push(['rule', parents, postcss.list.comma(node.selector)]);
        } else if (node.type === 'decl') {
            result.push(['decl', parents, node.parent.selector || null, node.prop, node.value, !!node.important]);
        } else if (node.type === 'atrule') {
            result.push(['at', parents, node.name, node.params]);
        }
    });
    return result;
}
const proof = {base, passed: false, removedSelectors, priorityChanges, sheets: {}, build,
    canonicalGuideFiles: [], runtimeAccess: false, published: false};
for (const file of sheets) {
    const oldRows = ordered(baseline[file]);
    const newRows = ordered(read(file));
    assert.deepEqual(newRows, oldRows, file + ': ordered selectors, declarations, priorities and at-rule ancestry');
    proof.sheets[file] = {orderedNodes: newRows.length, byteIdenticalAfterLf: read(file) === baseline[file]};
}
let globalRules = 0;
postcss.parse(read('styles.css')).walkRules(() => globalRules++);
assert.equal(globalRules, 0);
proof.globalRules = globalRules;
const single = '.local-groupimport-easystud-easyedu-guide.easyedu-guide';
assert.ok(read('scss/components/_easyedu-guide.scss').includes(single));
assert.ok(!read('scss/components/_easyedu-guide.scss').includes('.path-local-groupimport .easyedu-guide'));
const scene = single + '.easyedu-guide--discovery .easyedu-guide-scene';
const historicalRemovedSelectors = [scene + '[data-guide-mode=move] ' + scene + '__stage::after',
    scene + '[data-guide-mode=actions] ' + scene + '__stage::after',
    scene + '[data-guide-mobile-actions] ' + scene + '__menu'];
postcss.parse(read('styles/student-management.css')).walkRules(rule => {
    assert.ok(!postcss.list.comma(rule.selector).some(selector => historicalRemovedSelectors.includes(selector)),
        'Do not reintroduce unreachable self-nested Guide scene selectors');
    assert.ok(!/\.local-groupimport-easystud-action-grip(?:[^a-zA-Z0-9_-]|$)/.test(rule.selector),
        'K17-78: the retired grip cannot return under any selector');
});
proof.historicalRemovedSelectors = historicalRemovedSelectors;
for (const file of ['_guide.scss', '_guide-discovery.scss', '_guide-specimen.scss', '_animations.scss',
    '_card-actions.scss', '_responsive.scss']) {
    const relative = 'scss/easyedu/components/' + file;
    assert.equal(read(relative), fs.readFileSync(path.join(kitPath, relative), 'utf8').replace(/\r\n/g, '\n'), relative);
    proof.canonicalGuideFiles.push(relative);
}
assert.equal(read('scss/easyedu/_tokens.scss'),
    fs.readFileSync(path.join(kitPath, 'scss/easyedu/_tokens.scss'), 'utf8').replace(/\r\n/g, '\n'));
proof.canonicalGuideFiles.push('scss/easyedu/_tokens.scss');
proof.canonicalSharedFiles = [];
function compareShared(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), {withFileTypes: true})) {
        const relative = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            compareShared(relative);
        } else if (entry.name.endsWith('.scss')) {
            assert.equal(read(relative), fs.readFileSync(path.join(kitPath, relative), 'utf8').replace(/\r\n/g, '\n'),
                relative + ': complete shared SCSS definition matches the served consumer');
            proof.canonicalSharedFiles.push(relative.replace(/\\/g, '/'));
        }
    }
}
compareShared('scss/easyedu');
proof.passed = true;
fs.writeFileSync(output, JSON.stringify(proof, null, 2) + '\n');
process.stdout.write(JSON.stringify({passed: true, sheets: sheets.length, globalRules, newRemovals: 0,
    canonicalGuideFiles: proof.canonicalGuideFiles.length, canonicalSharedFiles: proof.canonicalSharedFiles.length}) + '\n');
