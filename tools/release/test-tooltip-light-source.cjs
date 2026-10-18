/* eslint-env node */
'use strict';

// Current Light recipe contract; historical whole-file oracle is archived byte-for-byte.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const guard = require('./verify-build-versions.cjs');
guard.assertNode();
const root = path.resolve(__dirname, '../..');
const [kitRoot, sassRoot, postcssRoot] = process.argv.slice(2);
assert.ok([kitRoot, sassRoot, postcssRoot].every(value => value && path.isAbsolute(value)),
    'Supply absolute canonical Kit, Sass1.79.1 and PostCSS package paths');
const sass = require(sassRoot);
guard.assertSass(sass);
const postcss = require(postcssRoot);
const normalize = text => text.replace(/\r\n/g, '\n');
const read = (base, file) => normalize(fs.readFileSync(path.join(base, file), 'utf8'));
const show = file => normalize(execFileSync('git', ['-C', root, 'show', '817dea20:' + file],
    {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}));
const modulePath = 'scss/easyedu/components/_tooltips.scss';
const recipe = text => text.slice(text.indexOf('// Existing Foundations Light Short/Long specimens,'),
    text.indexOf('@mixin popover-surface'));
const canonical = read(kitRoot, modulePath);
const consumer = read(root, modulePath);
assert.match(recipe(canonical), /@mixin foundation-light-tooltip/);
assert.equal(canonical, consumer, 'Complete canonical and embedded tooltip recipes match');
assert.equal(consumer, show(modulePath), 'Every accepted legacy tooltip recipe remains unchanged');
assert.doesNotMatch(canonical + consumer, /popover-control-label|PLACEHOLDER/);
function tooltipRows(css) {
    const rows = [];
    postcss.parse(css).walkRules(rule => {
        if (!/tooltip|hover-popover|popover/i.test(rule.selector)) {
            return;
        }
        // G2D changes this specimen-only popover layout, not the Light recipe.
        // Its complete canonical definition is independently compared below.
        if (rule.selector === '.local-groupimport-easystud-easyedu-guide.easyedu-guide.easyedu-guide--discovery ' +
                '.easyedu-guide-spec__popover' || rule.selector === '.easyedu-ui .easyedu-control-tooltip') {
            return;
        }
        const parents = [];
        for (let parent = rule.parent; parent; parent = parent.parent) {
            if (parent.type === 'atrule') {
                parents.unshift([parent.name, parent.params]);
            }
        }
        rows.push({parents, selectors: postcss.list.comma(rule.selector),
            declarations: rule.nodes.filter(node => node.type === 'decl')
                .map(node => [node.prop, node.value, !!node.important])});
    });
    return rows;
}
const specimenModule = 'scss/easyedu/components/_guide-specimen.scss';
assert.equal(read(root, specimenModule), read(kitRoot, specimenModule),
    'Accepted G2D specimen popover keeps its complete canonical definition');
assert.equal(read(root, 'amd/src/easyedu_bubble.js'), read(kitRoot, 'guide/amd/src/easyedu_bubble.js'),
    'K-BUBBLE keeps its single complete canonical renderer');
for (const file of ['styles/student-management.css', 'styles/mass-import.css', 'styles/administration.css']) {
    assert.doesNotMatch(read(root, file), /\.easyedu-control-tooltip\s*\{/,
        'K-BUBBLE retired surface must remain absent, not merely exempt from comparison');
    assert.deepEqual(tooltipRows(read(root, file)), tooltipRows(show(file)), file + ': ordered tooltip cascade is unchanged');
}
let globalRules = 0;
postcss.parse(read(root, 'styles.css')).walkRules(() => globalRules++);
assert.equal(globalRules, 0, 'No tooltip CSS is restored to the global sheet');
const css = sass.compileString('@use "easyedu" as e; .short { @include e.foundation-light-tooltip; } ' +
    '.long { @include e.foundation-light-tooltip(true); }', {
    loadPaths: [path.join(kitRoot, 'scss')], style: 'expanded', charset: false, logger: sass.Logger.silent,
}).css;
for (const [selector, size, weight, align, height] of [['short', '.74', '700', 'center', '2.125'],
    ['long', '.76', '600', 'left', '4']]) {
    let body;
    postcss.parse(css).walkRules(rule => {
        if (rule.selector === '.' + selector) {
            body = rule;
        }
    });
    assert.ok(body);
    const declarations = new Map(body.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
    for (const [property, value] of [['font-size', '0' + size + 'rem'], ['font-weight', weight], ['line-height', '1.35'],
        ['text-align', align], ['min-height', height + 'rem'], ['box-sizing', 'border-box']]) {
        assert.equal(declarations.get(property), value, selector + ': original Light specimen role ' + property);
    }
}
process.stdout.write(JSON.stringify({surface: 'tooltip-Light-current-source', passed: true,
    specimenAssertions: 12, pageCascades: 3, globalRules, fullRecipeUnchanged: true, runtimeAccess: false}) + '\n');
