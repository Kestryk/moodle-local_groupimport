'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
assert(process.argv[2], 'Pass the absolute PostCSS module path');
const postcss = require(path.resolve(process.argv[2]));
const readRules = css => {
    const rules = [];
    postcss.parse(css).walkRules(rule => {
        const parents = [];
        for (let node = rule.parent; node && node.type !== 'root'; node = node.parent) {
            parents.unshift([node.name, node.params]);
        }
        rules.push({selector: rule.selector, parents, declarations: rule.nodes.filter(n => n.type === 'decl')
            .map(n => [n.prop, n.value, n.important || false])});
    });
    return rules;
};
const file = 'styles/student-management.css';
const before = readRules(cp.execFileSync('git', ['show', 'f0bb9363:' + file], {cwd: root, encoding: 'utf8',
    maxBuffer: 8e6}));
const after = readRules(fs.readFileSync(path.join(root, file), 'utf8'));
let index = 0;
const added = [];
for (const rule of after) {
    if (JSON.stringify(rule) === JSON.stringify(before[index])) {
        index++;
    } else if (rule.selector === before[index]?.selector &&
            JSON.stringify(rule.parents) === JSON.stringify(before[index].parents)) {
        // Sass keeps declarations preceding nested rules in their existing parent rule.
        // Retain every old declaration in order; isolate only the announced additions.
        const original = before[index].declarations;
        let declaration = 0;
        const extra = [];
        for (const current of rule.declarations) {
            if (JSON.stringify(current) === JSON.stringify(original[declaration])) {
                declaration++;
            } else {
                extra.push(current);
            }
        }
        assert.equal(declaration, original.length, 'original parent declarations are unchanged');
        added.push({...rule, declarations: extra});
        index++;
    } else {
        added.push(rule);
    }
}
assert.equal(index, before.length, 'every original rule/declaration remains in the original order');
assert.ok(added.length > 0);
for (const rule of added) {
    assert.ok(rule.selector.split(',').every(selector =>
        selector.includes('#local-groupimport-easystud.local-groupimport-easystud--responsive-workspace') &&
        /person-card|easystud-user|easystud-tree__section\[data-easystud-grouping-id\]/.test(selector)),
    'only explicit responsive Person/Grouping opt-ins may be added: ' + rule.selector);
    assert.ok(rule.declarations.every(([prop]) => ['text-align', 'justify-content', 'top', 'margin-block', 'padding-block']
        .includes(prop)), 'no colour, typography, size or Motion change');
}
console.log(JSON.stringify({passed: true, originalRulesRetained: before.length, addedResponsiveRules: added.length,
    desktopRulesUnchanged: true}));
