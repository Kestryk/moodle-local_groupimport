// Static preparation only: compile an in-memory 600 candidate, never write Kit/consumer SCSS.
// Usage: node <this-file> <canonical-kit-root> <established-sass-module-root>
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {execFileSync} = require('node:child_process');
const kit = path.resolve(process.argv[2] || '');
const sassRoot = path.resolve(process.argv[3] || '');
assert.ok(process.argv[2] && process.argv[3], 'Explicit Kit and established compiler required');
const sass = require(sassRoot);
assert.ok(sass.info.includes('1.89.2'), 'Use the established consumer Sass 1.89.2');
const source = path.resolve(__dirname, '../..');
const relative = 'scss/easyedu/components/_cards.scss';
const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const pinned = execFileSync('git', ['show', '8d84fe0347601263f48f133f2e5827f4c06e3de4:' + relative],
    {cwd: kit, encoding: 'utf8'}).replace(/\r\n/g, '\n');
assert.equal(read(path.join(kit, relative)), pinned, 'Canonical source must still be the unactivated baseline');
assert.equal(read(path.join(source, relative)), pinned, 'Embedded recipe must retain baseline until saved design gate');
const before = '  font-size: var(--easyedu-card-identity-title-size);\n' +
    '  font-weight: var(--easyedu-font-weight-strong);';
assert.equal(pinned.split(before).length, 2, 'One exact identity-weight declaration');
const after = before.replace('--easyedu-font-weight-strong', '--easyedu-font-weight-semibold');
const candidate = pinned.replace(before, after);
assert.equal(candidate.replace(after, before), pinned, 'No unrelated source modification');
const probes = '\n' + ['compact', 'regular', 'container'].map(density =>
    `.candidate-card--${density} { @include card-title(${density}, var(--easyedu-card-identity-title-color)); }`).join('\n') +
    '\n.unrelated-section { @include typography.type-section-title; }' +
    '\n.unrelated-modal { @include typography.type-modal-title; }' +
    '\n.unrelated-member { @include related-person-name; }';
const compile = body => sass.compileString(body + probes, {
    url: pathToFileURL(path.join(kit, relative)), style: 'expanded', logger: sass.Logger.silent
}).css.replace(/\r\n/g, '\n');
const baselineCss = compile(pinned), candidateCss = compile(candidate);
let correctedBlocks = 0;
const restoredCss = candidateCss.replace(/\.candidate-card--(compact|regular|container)\s*\{[^}]*\}/g, block => {
    assert.equal(block.split('font-weight: var(--easyedu-font-weight-semibold);').length, 2);
    const declarations = [...block.matchAll(/font-weight:\s*([^;]+);/g)];
    assert.equal(declarations.at(-1)[1], 'var(--easyedu-font-weight-semibold)');
    assert.ok(block.includes('font-size: var(--easyedu-card-identity-title-size);'));
    assert.ok(block.includes('color: var(--easyedu-card-identity-title-color);'));
    correctedBlocks++;
    return block.replace('font-weight: var(--easyedu-font-weight-semibold);',
        'font-weight: var(--easyedu-font-weight-strong);');
});
assert.equal(correctedBlocks, 3);
assert.equal(restoredCss, baselineCss, 'Every emitted declaration except the three identity weights preserved');
assert.match(read(path.join(kit, 'scss/easyedu/_tokens.scss')), /--easyedu-font-weight-semibold:\s*600;/);
console.log(JSON.stringify({status: 'passed-static-candidate-only', densities: 3,
    unrelatedHeadingAndMemberCssPreserved: true, sharedSourceWritten: false,
    savedPenpotVerified: false, consumerActivated: false, nativeVerified: false, humanAccepted: false}));
