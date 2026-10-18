// Exercise the actual shared body renderer without a Moodle runtime.
/* global __dirname, process */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const text = fs.readFileSync(path.join(root, 'amd/src/local/cm/advanced_settings.js'), 'utf8').replace(/\r\n/g, '\n');
const start = text.indexOf('const renderAdvancedBody =');
const end = text.indexOf('\nexport const openAdvancedSettingsModal', start);
assert.ok(start > 0 && end > start);
const field = (label, name, value) => '<input name="' + name + '" value="' + value + '">';
const helpers = {
    getLabels: () => ({}),
    getAdvancedValue: (item, key) => item[key] || '',
    getAdvancedGroupMemberRows: () => [{id: 1, name: 'Known member'}],
    getAdvancedGroupGroupingRows: () => [{id: 2, name: 'Known grouping'}],
    getAdvancedGroupingGroupRows: () => [{id: 3, name: 'Known group'}],
    getAdvancedCountLabel: () => '1',
    entityCount: () => '1',
    entityIcon: value => value,
    entityIdentity: (type, icon, name) => '<header>' + type + ':' + name + '</header>',
    entityErrorNotice: () => '<aside>Retry</aside>',
    entitySkeletonField: () => '<div data-skeleton-field></div>',
    entitySection: (title, body, type) => '<section data-type="' + type + '">' + body + '</section>',
    renderAdvancedInput: field,
    renderAdvancedTextarea: field,
    renderAdvancedReadonly: field,
    renderMemberSection: () => '<details>Known member</details>',
    entityRelationRows: rows => rows.map(row => row.name).join('|'),
    entityRelationSection: section => '<details>' + section.content + '</details>',
    renderAdvancedImageSection: () => '<div data-loaded-image></div>',
    escapeHtml: value => value,
};
const render = vm.runInNewContext('(() => {' + text.slice(start, end) + '\nreturn renderAdvancedBody;})()', helpers);
let cases = 0;
for (const type of ['group', 'grouping']) {
    const item = {type, name: 'Known name', idnumber: 'Loaded ID', 'raw-description': 'Loaded description',
        getAttribute: () => '3'};
    const loading = render({}, item, 'loading');
    assert.ok(loading.includes('<header>' + type + ':Known name</header>'));
    assert.ok(loading.includes('<input disabled name="name" value="Known name">'));
    assert.ok(loading.includes(type === 'group' ? 'Known member' : 'Known group'));
    assert.equal((loading.match(/data-skeleton-field/g) || []).length, 1);
    assert.ok(loading.includes('Loaded ID') && !loading.includes('Loaded description'));
    assert.equal(loading.includes('data-loaded-image'), type === 'group');
    const ready = render({}, item, 'ready');
    assert.ok(ready.includes('Loaded ID') && ready.includes('Loaded description'));
    assert.ok(!ready.includes('data-skeleton-field') && !ready.includes('<input disabled'));
    assert.equal(ready.includes('data-loaded-image'), type === 'group');
    assert.ok(render({}, item, 'error').includes('Retry'));
    cases += 3;
}
process.stdout.write(JSON.stringify({surface: 'entity-deferred-fields', passed: true, cases}) + '\n');
