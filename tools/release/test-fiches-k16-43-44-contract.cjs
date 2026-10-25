/* eslint-env node */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const source = read('amd/src/local/cm/entity_dialog.js');
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
function renderer(name, end) {
    const start = source.indexOf('export const ' + name + ' =');
    assert.ok(start >= 0);
    return vm.runInNewContext(source.slice(start, source.indexOf(end, start)).replace('export const ', 'const ') +
        '\n' + name, {escapeHtml, prefix: 'entity', listSequence: 0, visibleRelationLimit: 8,
        extraAttribute: index => index >= 8 ? ' hidden' : '',
        countLabel: (template, count) => template.replace('__count__', count),
        moreButton: (count, label) => '<button data-count="' + count + '">' + label + '</button>',
        exportTable: () => '<table data-export="1"></table>'});
}
const rows = renderer('entityRelationRows', '/**\n * Hidden CSV table');
const rendered = rows(Array.from({length: 10}, (_, index) => ({name: 'Group <' + index + '>', members: index})),
    'group', {moreTemplate: 'Show __count__ more', metaTemplate: '__count__ members'});
assert.equal((rendered.match(/easyedu-related-person-row--group"/g) || []).length, 10);
assert.equal((rendered.match(/ hidden/g) || []).length, 2);
assert.ok(rendered.includes('Show 2 more'));
assert.ok(rendered.includes('Group &lt;0&gt;'));
assert.ok(rendered.includes('title="Group &lt;0&gt;"'));
assert.ok(rendered.includes('0 members'));
assert.ok(!rendered.includes('data-easystud-entity-remove'), 'Relationship rows do not invent remove commands');
assert.ok(rows([{name: 'A'}], 'grouping').includes('easyedu-related-person-row--grouping'));
assert.ok(rows([], 'group', {emptyLabel: 'No <groups>'}).includes('No &lt;groups&gt;'));
const section = renderer('entityRelationSection', '/**\n * Error state');
for (const type of ['role', 'group', 'grouping', 'groups', 'groupings', 'members']) {
    const html = section({type, title: 'Name', countText: '999 members', content: rendered});
    assert.ok(!html.includes('__relation-count'), 'No summary counter for ' + type);
    assert.ok(html.includes(rendered));
}
const advanced = read('amd/src/local/cm/advanced_settings.js');
assert.ok(advanced.includes('getAdvancedCountLabel(root, item, true), entityCount('), 'Identity context retained');
assert.ok(advanced.includes('easyedu-filepicker easyedu-filepicker--compact'));
assert.ok(advanced.includes('data-easystud-advanced-file-trigger="1"'));
assert.ok(advanced.includes('data-easystud-advanced-file-input="1"'));
assert.ok(!read('scss/components/_entity-dialog.scss').includes('&-entity__deposit-trigger'));
assert.ok(read('scss/easyedu/components/_cards.scss').includes('@media (hover: none), (pointer: coarse)'));
assert.ok(read('scss/easyedu/_tokens.scss').includes('--easyedu-related-person-remove-size: 1.45rem;'));
console.log(JSON.stringify({passed: true, scope: 'Actual relation renderers, escaping, disclosure, summary/context, Kit hooks'}));
