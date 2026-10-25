/* eslint-env node */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const acorn = require('acorn');

// Bound current production declarations by syntax, including exported declarations.
module.exports = (root, file, names) => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const tree = acorn.parse(source, {sourceType: 'module', ecmaVersion: 'latest'});
    return names.map(name => {
        const matches = tree.body.map(node => node.type === 'ExportNamedDeclaration' ? node.declaration : node)
            .filter(node => node && (node.type === 'VariableDeclaration' ?
                node.declarations.some(item => item.id.name === name) : node.id?.name === name));
        assert.equal(matches.length, 1, file + ': one actual declaration ' + name);
        return source.slice(matches[0].start, matches[0].end);
    }).join('\n');
};
