'use strict';
// Scroll-lock ownership and exact restoration, independent of the layout oracle.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || path.resolve(__dirname, '../../amd/src/easyedu_guide.js'), 'utf8');
const block = source.slice(source.indexOf('let pageScrollPadding = null;'), source.indexOf('const getFocusableElements ='));
assert.ok(block.startsWith('let pageScrollPadding = null;'));
for (const [width, value, priority, computed, gutter] of [[15, '', '', '0px', 'auto'],
    [15, '1rem', 'important', '16px', 'auto'], [0, '', '', '0px', 'auto'], [15, '', '', '0px', 'stable']]) {
    const style = new Map(value ? [['padding-right', {value, priority}]] : []);
    const classes = new Set();
    const html = {clientWidth: 1600 - width, classList: {add: n => classes.add(n), remove: n => classes.delete(n)},
        style: {getPropertyValue: n => style.get(n)?.value || '', getPropertyPriority: n => style.get(n)?.priority || '',
            setProperty: (n, v, p) => style.set(n, {value: v, priority: p}), removeProperty: n => style.delete(n)}};
    const api = vm.runInNewContext('const openGuideRoots = new Set(); const PAGE_SCROLL_LOCK_CLASS = "locked";' + block +
        '\n({lockPageScroll, unlockPageScroll})', {document: {documentElement: html},
        window: {innerWidth: 1600, getComputedStyle: () => ({paddingRight: computed, scrollbarGutter: gutter})}});
    const first = {}, second = {};
    api.lockPageScroll(first);
    const locked = width && gutter !== 'stable' ? `${parseFloat(computed) + width}px` : value;
    assert.equal(html.style.getPropertyValue('padding-right'), locked);
    html.clientWidth = 1600;
    api.lockPageScroll(first);
    api.lockPageScroll(second);
    assert.equal(html.style.getPropertyValue('padding-right'), locked, 'No accumulated padding');
    api.unlockPageScroll(first);
    assert.ok(classes.has('locked'), 'Second Guide still owns the lock');
    assert.equal(html.style.getPropertyValue('padding-right'), locked);
    api.unlockPageScroll(second);
    assert.equal(classes.size, 0);
    assert.equal(html.style.getPropertyValue('padding-right'), value);
    assert.equal(html.style.getPropertyPriority('padding-right'), priority);
    api.unlockPageScroll(second);
    assert.equal(html.style.getPropertyValue('padding-right'), value, 'Idempotent cleanup');
}
console.log('PASS: real lock functions preserve ownership, padding, priority and zero-scrollbar state.');
