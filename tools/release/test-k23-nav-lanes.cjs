'use strict';
// The lane boundary is opt-in; navigation changes only the responsive drawer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const sass = require(path.resolve(process.argv[2]));
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const before = f => execFileSync('git', ['show', 'f0bb9363:' + f],
    {cwd: root, encoding: 'utf8', maxBuffer: 8e6}).replace(/\r\n/g, '\n');
const nav = read('templates/easyedu_navigation.mustache');
const old = before('templates/easyedu_navigation.mustache');
const marker = '<div class="easyedu-navigation__panel-scroll"';
assert.equal(nav.slice(0, nav.indexOf(marker)), old.slice(0, old.indexOf(marker)), 'Desktop and drawer header unchanged');
const scroll = nav.slice(nav.indexOf(marker));
assert.ok(scroll.indexOf('data-easyedu-display-open') < scroll.indexOf('{{#hasitems}}'));
assert.ok(scroll.includes('class="easyedu-navigation__item" data-easyedu-display-open'));
assert.equal((nav.match(/data-easyedu-display-open/g) || []).length, 2, 'One control per navigation context');
assert.equal((nav.match(/displaypreferences, local_groupimport/g) || []).length, 2, 'Original localized labels');
const file = 'scss/easyedu/components/_panels.scss';
const probes = ['whole', 'start', 'end'].map(segment =>
    `.${segment} { @include workspace-lane(var(--easyedu-participant-rail), ${segment}); }`).join('\n');
const options = {url: pathToFileURL(path.join(root, file)), style: 'expanded', logger: sass.Logger.silent};
const compile = source => sass.compileString(source, options).css;
assert.equal(compile(before(file) + '\n' + probes), compile(read(file) + '\n' + probes),
    'Default Kit lane CSS remains byte-identical for other consumers');
const outlined = compile(read(file) + '\n' + probes.replaceAll('); }', ', $outlined: true); }'));
assert.equal((outlined.match(/border: 0.0625rem solid var\(--easyedu-border\)/g) || []).length, 3);
assert.equal((outlined.match(/border-bottom: 0/g) || []).length, 1, 'No seam below a start segment');
assert.equal((outlined.match(/border-top: 0/g) || []).length, 1, 'No seam above an end segment');
const lanes = read('scss/components/_workspace-lanes.scss');
assert.equal((lanes.match(/\$outlined: true/g) || []).length, 7, 'Complete and split columns use the same definition');
assert.ok(!lanes.slice(0, lanes.indexOf('@container')).includes('border:'), 'No duplicated 5.3 border');
assert.ok(lanes.includes('--easyedu-lane-surface: var(--easyedu-surface);'));
assert.ok(lanes.includes('--easyedu-lane-surface: var(--easyedu-surface-strong);'));
console.log('PASS: responsive order, shared list action, desktop preservation, Kit defaults, seven outlined lane usages and host surfaces');
