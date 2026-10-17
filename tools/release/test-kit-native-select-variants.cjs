/* eslint-env node */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {assertNode} = require('./verify-build-versions.cjs');
assertNode();
const [sassPath, postcssPath] = process.argv.slice(2);
assert(sassPath && postcssPath && path.isAbsolute(sassPath) && path.isAbsolute(postcssPath),
    'Pass absolute paths to the existing Sass and PostCSS packages.');
const sass = require(sassPath);
const postcss = require(postcssPath);
const root = path.resolve(__dirname, '../..');
const css = sass.compileString('@use "forms" as f; ' +
    '.regular { @include f.native-select-control; } ' +
    '.native { @include f.native-select-control($native-affordance: true); } ' +
    '.touch { @include f.native-select-control(touch, $native-affordance: true); }', {
    loadPaths: [path.join(root, 'scss/easyedu/components')],
}).css;
const rules = postcss.parse(css);
function declaration(selector, property) {
    let value;
    rules.walkRules(selector, rule => rule.walkDecls(property, item => {
        value = item.value;
    }));
    return value;
}
assert.equal(declaration('.regular', 'background'), 'var(--easyedu-surface)');
assert.equal(declaration('.regular', 'min-height'), 'var(--easyedu-control-height)');
assert.equal(declaration('.native', 'background'), undefined);
assert.equal(declaration('.native', 'background-color'), 'var(--easyedu-surface)');
assert.equal(declaration('.touch', 'min-height'), 'var(--easyedu-touch-target-min)');
assert.equal(declaration('.touch', 'font-size'), declaration('.regular', 'font-size'));
assert.equal(declaration('.touch', 'padding'), declaration('.regular', 'padding'));
const disabledRules = [];
rules.walkRules(rule => {
    if (rule.selector.includes('.touch:disabled')) {
        const properties = [];
        rule.walkDecls(item => properties.push(item.prop));
        disabledRules.push(properties);
    }
});
assert.equal(disabledRules.length, 1);
assert(disabledRules[0].includes('background-color'));
assert(!disabledRules[0].includes('background'), 'Keep the native theme arrow when disabled too.');
process.stdout.write('PASS native select: legacy defaults, shared touch metric and native arrow in rest/disabled.\n');
