/* eslint-env node */
'use strict';

// Keep the exact historical projection separate from current accepted designs.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const postcss = require('C:/dev/moodle51-build-501/node_modules/postcss');
const root = path.resolve(__dirname, '../..');
const at = (revision, file) => execFileSync('git', ['-C', root, 'show', revision + ':' + file], {
    encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
}).replace(/\r\n/g, '\n');
const current = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const prefix = '.local-groupimport-easystud-easyedu-guide.easyedu-guide.easyedu-guide--discovery .easyedu-guide-scene';
const removedSelectors = [
    prefix + '[data-guide-mode=move] ' + prefix + '__stage::after',
    prefix + '[data-guide-mode=actions] ' + prefix + '__stage::after',
    prefix + '[data-guide-mobile-actions] ' + prefix + '__menu',
];
const projected = postcss.parse(at('8129aef7', 'styles/student-management.css'));
let removed = 0;
let priorities = 0;
projected.walkRules(rule => {
    const selectors = postcss.list.comma(rule.selector);
    if (selectors.some(s => removedSelectors.includes(s))) {
        assert(selectors.every(s => removedSelectors.includes(s)));
        removed += selectors.length;
        rule.remove();
        return;
    }
    if (rule.selector === '.local-groupimport-easystud-action-grip') {
        rule.walkDecls('margin', declaration => {
            assert.equal(declaration.value, '0');
            assert.equal(declaration.important, true);
            declaration.important = false;
            priorities++;
        });
    }
});
function rows(css) {
    const result = [];
    postcss.parse(css).walkRules(rule => {
        const parents = [];
        for (let parent = rule.parent; parent; parent = parent.parent) {
            if (parent.type === 'atrule') {
                parents.unshift([parent.name, parent.params]);
            }
        }
        result.push({parents, selector: rule.selector,
            body: rule.nodes.filter(node => node.type !== 'comment').map(node => [node.prop, node.value, !!node.important])});
    });
    return result;
}
assert.equal(removed, 3);
assert.equal(priorities, 1);
assert.deepEqual(rows(projected.toString()), rows(at('33aeacfb', 'styles/student-management.css')));
for (const file of ['styles.css', 'styles/mass-import.css', 'styles/administration.css']) {
    assert.equal(at('33aeacfb', file), at('8129aef7', file), file + ': historical untouched sheet');
}
assert(!fs.existsSync(path.join(root, 'scss/components/_tutorial.scss')));
// K17-78 retires the grip rather than merely changing its old priority.
postcss.parse(current('styles/student-management.css')).walkRules(rule => {
    const selectors = postcss.list.comma(rule.selector);
    assert(!selectors.some(s => removedSelectors.includes(s)), 'No historical dead branch may return');
    assert(!/\.local-groupimport-easystud-action-grip(?:[^a-zA-Z0-9_-]|$)/.test(rule.selector),
        'K17-78: retired grip stays absent');
});
assert(current('scss/components/_layout.scss').includes('@include easyedu.card-overflow-trigger;'));
module.exports = {removedSelectors};
if (require.main === module) {
    process.stdout.write(JSON.stringify({passed: true, removedSelectors: removed, priorityChanges: priorities,
        rules: rows(projected.toString()).length}) + '\n');
}
