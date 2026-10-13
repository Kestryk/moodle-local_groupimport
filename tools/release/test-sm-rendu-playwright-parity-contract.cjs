'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const playwrightDir = path.join(root, 'tools', 'playwright');
const {RENDERING_READS, isSafeAjaxRead} = require(path.join(
    playwrightDir, 'easystud-safe-ajax-reads.cjs'
));

const lazySpecs = [
    'accessibility-smoke.spec.js',
    'group-advanced-settings-context-fallback.spec.js',
    'group-expanded-menu-stack.spec.js',
    'nested-group-card-action-count.spec.js',
    'student-card-actions-foundations.spec.js',
    'student-confirmation-footer-preview.spec.js',
    'student-context-menu-foundations.spec.js',
    'student-drag-preview-foundations.spec.js',
    'student-framed-add-active-workspace.spec.js',
    'student-framed-add-successor.spec.js',
    'student-framed-add-themed-successor.spec.js',
    'student-harmonisation-audit.spec.js',
    'student-inline-feedback-foundations.spec.js',
    'student-move-dialog-audit.spec.js',
    'student-textarea-foundations.spec.js',
    'student-text-fields-foundations.spec.js',
    'student-visual-roles-foundations.spec.js',
];

assert.deepEqual([...RENDERING_READS].sort(), [
    'local_groupimport_get_details',
    'local_groupimport_get_state',
]);
assert.equal(isSafeAjaxRead('local_groupimport_get_state', new Set()), true);
assert.equal(isSafeAjaxRead({methodname: 'local_groupimport_get_details'}, new Set()), true);
assert.equal(isSafeAjaxRead('local_groupimport_move_members', new Set()), false);

const specs = fs.readdirSync(playwrightDir).filter(file => file.endsWith('.spec.js'));
const ajaxSpecs = specs.filter(file => fs.readFileSync(path.join(playwrightDir, file), 'utf8')
    .includes('lib/ajax/service.php'));
assert.ok(ajaxSpecs.length >= 188, 'Expected the shared AJAX guard scope to cover all 188 routed specs.');
for (const file of ajaxSpecs) {
    const source = fs.readFileSync(path.join(playwrightDir, file), 'utf8');
    assert.match(source, /easystud-safe-ajax-reads\.cjs/,
        `${file} must use the shared renderer-read allow-list.`);
    assert.match(source, /areSafeAjaxReads\(/,
        `${file} must delegate its permitted reads to the shared helper.`);
}

for (const file of lazySpecs) {
    const source = fs.readFileSync(path.join(playwrightDir, file), 'utf8');
    assert.match(source, /easystud-lazy-tree\.cjs/,
        `${file} must open a populated grouping through the shared helper.`);
    assert.match(source, /openPopulatedGrouping\(/,
        `${file} must wait for lazy child cards before inspecting them.`);
    assert.doesNotMatch(source, /\[data-easystud-grouping-id\][^\n]*:has\(\.local-groupimport-easystud-group\)/,
        `${file} must not select a grouping from children that may not exist yet.`);
}

const filteredSelection = fs.readFileSync(path.join(
    playwrightDir, 'student-filtered-select-all-preview.spec.js'
), 'utf8');
assert.match(filteredSelection, /\[data-easystud-user\]:visible/,
    'Filtered selection must operate on the rendered page only.');
assert.match(filteredSelection, /pageTotal/,
    'Filtered selection must not use a full-DOM card count as a global count.');
assert.doesNotMatch(filteredSelection, /document\.querySelectorAll\([\s\S]*data-easystud-user/,
    'Filtered selection must not rebuild a cross-page user collection from document DOM.');

console.log(JSON.stringify({
    ajaxSpecs: ajaxSpecs.length,
    lazySpecs: lazySpecs.length,
    renderingReads: [...RENDERING_READS].sort(),
    filteredSelection: 'visible-page-only',
}));
