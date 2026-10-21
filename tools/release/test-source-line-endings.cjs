'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const attributes = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8');
for (const extension of ['js', 'scss', 'css']) {
    assert.ok(attributes.split(/\r?\n/).includes(`*.${extension} text eol=lf`), `${extension} enforces LF`);
}
const files = execFileSync('git', ['ls-files', '-z', '--', '*.js', '*.scss', '*.css'],
    {cwd: root, encoding: 'utf8'}).split('\0').filter(Boolean);
const failures = files.filter(file => fs.readFileSync(path.join(root, file), 'utf8').includes('\r'));
assert.deepEqual(failures, [], 'Tracked JS/SCSS/CSS use LF in this worktree');
console.log(`PASS: ${files.length} tracked JS/SCSS/CSS files use LF`);
