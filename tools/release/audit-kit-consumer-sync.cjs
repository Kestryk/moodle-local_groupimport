'use strict';
// Source-only I12 consumer gate. Compile an owned staging tree, never a runtime.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const [kitArg, sassArg, postcssArg, outputArg] = process.argv.slice(2);
// 22/10 arbitration: binary differences are forensic data, not visual acceptance.
// Preserve the original strict check as an explicit diagnostic option only.
const requireByteIdentity = process.argv.slice(6).includes('--require-byte-identity');
assert.ok([kitArg, sassArg, postcssArg, outputArg].every(p => p && path.isAbsolute(p)),
    'Pass absolute Kit, Sass, PostCSS and external output paths');
const [kit, sassModule, postcssModule, out] = [kitArg, sassArg, postcssArg, outputArg].map(p => path.resolve(p));
const inside = (p, parent) => p === parent || p.startsWith(parent + path.sep);
assert.ok(!inside(out, root) && !inside(out, kit), 'Evidence must stay outside both sources');
assert.ok(!inside(root, out) && !inside(kit, out), 'Output cannot contain a source repository');
assert.ok(!fs.existsSync(out), 'Preserve previous evidence: choose a new output directory');
require('./verify-build-versions.cjs').assertNode();
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const text = p => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], {encoding: 'utf8'}).trim();
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory()
    ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const inventory = dir => Object.fromEntries(walk(dir).map(p => [path.relative(dir, p).replaceAll('\\', '/'), sha(text(p))]));
const sourceBefore = inventory(path.join(root, 'scss/easyedu'));
const kitBefore = inventory(path.join(kit, 'scss/easyedu'));
const policyPath = path.join(kit, 'docs/audits/i12-compatibility.json');
const policy = fs.existsSync(policyPath) ? JSON.parse(text(policyPath)) : {files: {}};
fs.mkdirSync(out, {recursive: true});
const changes = [...new Set([...Object.keys(sourceBefore), ...Object.keys(kitBefore)])].sort().flatMap(relative => {
    if (sourceBefore[relative] === kitBefore[relative]) return [];
    const exception = policy.files['scss/easyedu/' + relative];
    return [{path: relative, productHash: sourceBefore[relative] || null, kitHash: kitBefore[relative] || null,
        matchesRecordedSource: exception?.sourceHash === sourceBefore[relative],
        compatibilityReason: exception?.reason || null}];
});
const stages = {};
for (const kind of ['before', 'candidate']) {
    const dir = path.join(out, kind);
    fs.mkdirSync(path.join(dir, 'tools/release'), {recursive: true});
    fs.cpSync(path.join(root, 'scss'), path.join(dir, 'scss'), {recursive: true});
    for (const name of ['build-page-styles.cjs', 'build-styles.cjs', 'audit-css.cjs',
        'minify-css.cjs', 'verify-build-versions.cjs', 'build-versions.json']) {
        fs.copyFileSync(path.join(root, 'tools/release', name), path.join(dir, 'tools/release', name));
    }
    if (kind === 'candidate') {
        // This directory was created above from the owned copy, not from a runtime.
        // Current sources have the same file set: retain a precise count check.
        assert.deepEqual(Object.keys(sourceBefore).sort(), Object.keys(kitBefore).sort(),
            'File-set divergence requires a reviewed publication plan');
        fs.cpSync(path.join(kit, 'scss/easyedu'), path.join(dir, 'scss/easyedu'), {recursive: true});
    }
    const sass = require(sassModule);
    const expanded = sass.compile(path.join(dir, 'scss/easystud.scss'),
        {style: 'expanded', charset: false, sourceMap: false, logger: sass.Logger.silent}).css;
    fs.writeFileSync(path.join(dir, 'all-expanded.css'), expanded);
    const build = require(path.join(dir, 'tools/release/build-page-styles.cjs')).build(sassModule, postcssModule);
    stages[kind] = {directory: dir, build};
}
const postcss = require(postcssModule);
const compare = relative => {
    const before = fs.readFileSync(path.join(stages.before.directory, relative));
    const after = fs.readFileSync(path.join(stages.candidate.directory, relative));
    let firstDifference = 0;
    while (firstDifference < Math.min(before.length, after.length) && before[firstDifference] === after[firstDifference]) firstDifference++;
    return {file: relative, identical: before.equals(after), beforeBytes: before.length, afterBytes: after.length,
        beforeHash: sha(before), afterHash: sha(after), firstDifference: before.equals(after) ? null : firstDifference};
};
const css = ['styles.css', ...['student-management', 'mass-import', 'administration', 'guide'].map(n => 'styles/' + n + '.css')].map(compare);
function declarations(file) {
    const result = [];
    postcss.parse(fs.readFileSync(file, 'utf8')).walkDecls(d => {
        const parents = [];
        for (let p = d.parent; p?.type !== 'root'; p = p.parent) {
            parents.unshift(p.type === 'rule' ? p.selector : '@' + p.name + ' ' + p.params);
        }
        result.push({context: parents.join(' > '), property: d.prop, value: d.value, important: Boolean(d.important)});
    });
    return result;
}
const previous = declarations(path.join(stages.before.directory, 'all-expanded.css'));
const next = declarations(path.join(stages.candidate.directory, 'all-expanded.css'));
const counts = rows => {
    const map = new Map();
    for (const row of rows) { const key = JSON.stringify(row); map.set(key, (map.get(key) || 0) + 1); }
    return map;
};
const a = counts(previous), b = counts(next);
const delta = [...new Set([...a.keys(), ...b.keys()])].flatMap(key => {
    const difference = (b.get(key) || 0) - (a.get(key) || 0);
    return difference ? [{...JSON.parse(key), countDelta: difference}] : [];
});
fs.writeFileSync(path.join(out, 'declaration-delta.json'), JSON.stringify(delta, null, 2) + '\n');
assert.deepEqual(inventory(path.join(root, 'scss/easyedu')), sourceBefore, 'Product source changed during the audit');
assert.deepEqual(inventory(path.join(kit, 'scss/easyedu')), kitBefore, 'Kit source changed during the audit');
const result = {product: {root, head: git(root, 'rev-parse', 'HEAD')}, kit: {root: kit, head: git(kit, 'rev-parse', 'HEAD')},
    compiler: {node: process.versions.node, sass: require(sassModule).info.split('\n')[0]},
    changes, css, declarationDeltaCount: delta.length, expanded: compare('all-expanded.css'),
    identical: css.every(r => r.identical), sourceUnchanged: true, runtimeAccess: false,
    byteIdentityRequired: requireByteIdentity, nativeVisualAcceptance: 'not-evaluated-by-this-tool'};
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({identical: result.identical, changedSourceFiles: changes.length, declarationDeltaCount: delta.length,
    css: css.map(({file, identical, beforeBytes, afterBytes}) => ({file, identical, beforeBytes, afterBytes})), sourceUnchanged: true}));
if (requireByteIdentity && !result.identical) process.exitCode = 1;
