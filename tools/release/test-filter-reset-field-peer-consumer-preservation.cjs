// Current Kit variant contract; eba10dbb removed its four historical consumer opt-ins.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), sass = require(process.argv[2]);
const norm = s => s.replace(/\r\n/g, '\n');
const read = (base, file) => norm(fs.readFileSync(path.join(base, file), 'utf8'));
const block = text => { const start = text.indexOf('@mixin filter-reset-field-peer {');
    let level = 1, end = text.indexOf('{', start) + 1; assert.ok(start > 0); for (; level && end < text.length; end++) { if (text[end] === '{') level++; if (text[end] === '}') level--; } assert.equal(level, 0); return text.slice(start, end); };
assert.equal(block(read(root, 'scss/easyedu/components/_buttons.scss')),
    block(read(process.argv[3], 'scss/easyedu/components/_buttons.scss')), 'The live field-peer variant remains canonical');
const template = read(root, 'templates/manage.mustache');
assert.equal((template.match(/easyedu-filter-reset--field-peer/g) || []).length, 0, 'K16 finish deliberately ended this consumer adoption');
const resets = [...template.matchAll(/<button\b[^>]*\bdata-easystud-reset-(?:filters|catalog-filters|grouping-filters)="[^"]*"[^>]*>/g)];
assert.equal(resets.length, 4, 'All four reset commands remain present');
assert.ok(resets.every(([tag]) => tag.includes('easyedu-filter-reset')), 'Reset commands keep the shared base recipe');
const result = require('./lib/scss-optin-preservation.cjs')(root, sass, 'buttons.filter-reset-field-peer',
    '.easyedu-filter-reset--field-peer');
assert.equal(result.added.length, 2);
const base = result.added.find(row => !row.parents.length), touch = result.added.find(row => row.parents.length);
assert.deepEqual(base.declarations, [['box-sizing', 'border-box', false], ['min-height', 'var(--easyedu-size-m)', false]]);
assert.deepEqual(touch.declarations, [['min-height', 'var(--easyedu-touch-target-min)', false]]);
assert.deepEqual(touch.parents, [['media', '(max-width: 52rem), (pointer: coarse)']]);
const compiled = sass.compile(path.join(root, 'scss/easystud.scss'), {logger: sass.Logger.silent}).css;
assert.match(compiled, /--easyedu-size-m:\s*2\.375rem;/, 'Scale M still resolves to 38px');
assert.match(compiled, /--easyedu-touch-target-min:\s*2\.75rem;/, 'Touch target still resolves to 44px');
console.log(JSON.stringify({passed: true, preservedRules: result.preserved, regularFieldPeer: '38px',
    touchFloorPreserved: true, currentResetCommands: resets.length, obsoleteConsumerOptIns: 0}));