'use strict';
// Current K17-62/69 contract: preserve every unrelated ordered rule and behaviour.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const [kitArg, sassArg, postcssArg, baseline = 'e8a1b83a'] = process.argv.slice(2);
assert.ok(kitArg && sassArg && postcssArg, 'Usage: <kit-root> <Sass1.79.1-module> <PostCSS-module> [baseline-ref]');
const kit = path.resolve(kitArg), sass = require(path.resolve(sassArg)), postcss = require(path.resolve(postcssArg));
const {compactDeclarations} = require('./build-styles.cjs');
const versions = require('./verify-build-versions.cjs');
versions.assertNode(); versions.assertSass(sass);
const norm = value => value.replace(/\r\n/g, '\n');
const read = (base, file) => norm(fs.readFileSync(path.join(base, file), 'utf8'));
const before = file => norm(execFileSync('git', ['show', baseline + ':' + file],
    {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}));
// Earlier pinned historical chrome snapshots predate the current Guide content,
// bubble, Motion and split page CSS. Freeze these complete behaviours on the
// explicitly selected integrated predecessor; no template/controller carve-out.
for (const file of ['amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js',
    'amd/src/course_manager.js', 'amd/src/easyedu_bubble.js', 'amd/src/motion.js',
    'classes/local/guide_discovery.php', 'templates/easyedu_guide.mustache']) {
    assert.equal(read(root, file), before(file), 'Complete behaviour/markup unchanged: ' + file);
}
for (const file of ['_preferences-classes.scss', 'components/_card-actions.scss', 'components/_guide.scss',
    'components/_guide-discovery.scss', 'components/_guide-specimen.scss', 'components/_animations.scss']) {
    assert.equal(read(root, 'scss/easyedu/' + file), read(kit, 'scss/easyedu/' + file), 'Canonical parity: ' + file);
}
const direct = read(root, 'scss/easyedu/components/_card-actions.scss');
assert.equal(direct.replace('@mixin card-direct-action($size: 1.85rem) {', '@mixin card-direct-action {')
    .replace('height: $size;', 'height: 1.85rem;').replace('width: $size;', 'width: 1.85rem;'),
    before('scss/easyedu/components/_card-actions.scss'), 'Unparameterised card action retains every default and state');
assert.match(read(root, 'scss/easyedu/_preferences-classes.scss'), /card-direct-action\(\$size: 2rem\)/,
    'Desktop32 is an explicit shared action variant');
// Compile the predecessor from a read-only in-memory Git importer. No worktree,
// runtime, temporary source files or historical generated-CSS oracle are used.
const files = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', baseline, '--', 'scss'],
    {cwd: root, encoding: 'utf8'}).trim().split('\n'));
const importer = {
    canonicalize(url, options) {
        if (url.startsWith('sass:')) { return null; }
        const base = options.containingUrl ? path.posix.dirname(options.containingUrl.pathname) : '/scss';
        const wanted = url.startsWith('git-baseline:') ? new URL(url).pathname : path.posix.resolve(base, url);
        const directory = path.posix.dirname(wanted), name = path.posix.basename(wanted);
        for (const candidate of [wanted, wanted + '.scss', directory + '/_' + name + '.scss',
            wanted + '/_index.scss', wanted + '/index.scss']) {
            if (files.has(candidate.replace(/^\//, ''))) { return new URL('git-baseline:' + candidate); }
        }
        return null;
    },
    load(url) { return {contents: before(url.pathname.replace(/^\//, '')), syntax: 'scss'}; },
};
const settings = {style: 'expanded', charset: false, sourceMap: false, logger: sass.Logger.silent};
const prior = sass.compileString(before('scss/easystud.scss'), {...settings,
    url: new URL('git-baseline:/scss/easystud.scss'), importers: [importer]}).css;
const current = sass.compile(path.join(root, 'scss/easystud.scss'), settings).css;
const allowed = selector => /\.easyedu-direct-icon(?:[\s.:>,]|$)/.test(selector) ||
    /\.easyedu-guide-modal__(?:step-count|footer-actions)$/.test(selector) ||
    /\.easyedu-guide-modal__footer-actions \.btn(?:-primary)?$/.test(selector);
const ordered = css => {
    const rows = [];
    postcss.parse(compactDeclarations(css)).walkRules(rule => {
        const selectors = postcss.list.comma(rule.selector).filter(selector => !allowed(selector));
        if (!selectors.length) { return; }
        const ancestry = []; let node = rule.parent;
        while (node.type !== 'root') { ancestry.unshift('@' + node.name + ' ' + node.params); node = node.parent; }
        rows.push({ancestry, selectors, declarations: rule.nodes.filter(item => item.type === 'decl')
            .map(item => [item.prop, item.value, Boolean(item.important)])});
    });
    return rows;
};
const oldRules = ordered(prior), newRules = ordered(current);
assert.deepEqual(newRules, oldRules, 'Every unrelated declaration, selector and conditional order is preserved');
assert.match(read(root, 'scss/easyedu/components/_guide-discovery.scss'), /height: 0\.25rem;/,
    'Retain the accepted accent track');
assert.equal(postcss.parse(read(root, 'styles.css')).nodes.filter(node => node.type !== 'comment').length, 0,
    'No site-wide CSS restored');
console.log(JSON.stringify({passed: true, baseline, unrelatedOrderedRules: newRules.length,
    frozenBehaviours: 7, canonicalFiles: 6, pageCssAware: true, runtimeAccess: false}));
