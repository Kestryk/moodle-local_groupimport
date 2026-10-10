// Non-visual extraction only. Does not certify a new tooltip or Guide behavior.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const base = '952b46652dbc0ecad762f6e615c3af701c9667ce';
const normalize = value => value.replace(/\r\n/g, '\n');
const prior = normalize(execFileSync('git', ['show', base + ':styles.css'],
    {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}));
assert.equal(normalize(fs.readFileSync(path.join(root, 'styles.css'), 'utf8')), prior,
    'Complete compiled CSS unchanged');
const changed = execFileSync('git', ['diff', '--name-only', base, '--',
    'amd', 'templates', 'lang', '*.php', 'scss'], {cwd: root, encoding: 'utf8'}).trim().split(/\r?\n/).filter(Boolean);
assert.deepEqual(changed, ['scss/components/_tooltips.scss', 'scss/easyedu/components/_tooltips.scss'],
    'No native controller, template, language, Motion or other SCSS changes');
const consumer = fs.readFileSync(path.join(root, 'scss/components/_tooltips.scss'), 'utf8');
assert.match(consumer, /@include easyedu\.popover-long-copy;/);
assert.doesNotMatch(consumer, /font-size:|font-weight:|line-height:|padding:/);
if (process.argv[2]) {
    const kitRoot = path.resolve(process.argv[2]);
    const kit = normalize(fs.readFileSync(path.join(kitRoot, 'scss/easyedu/components/_tooltips.scss'), 'utf8'));
    const embedded = normalize(fs.readFileSync(path.join(root, 'scss/easyedu/components/_tooltips.scss'), 'utf8'));
    const recipe = text => text.slice(text.indexOf('// Existing dense long-copy help recipe.'),
        text.indexOf('@mixin positioned-popover-arrows'));
    assert.ok(recipe(kit).includes('@mixin popover-long-copy'));
    assert.equal(recipe(kit), recipe(embedded), 'New canonical recipe synchronized exactly');
    const priorKit = normalize(execFileSync('git', ['show',
        '88d6473305f22cb2dd377fdf88dcdf022a7b0d14:scss/easyedu/components/_tooltips.scss'],
        {cwd: kitRoot, encoding: 'utf8'}));
    assert.equal(kit.replace(recipe(kit), ''), priorKit, 'Other canonical recipes preserved');
    // Existing consumer help-icon/focus additions predate this lot. Do not
    // downgrade them or pretend the entire independently pinned module matches.
}
console.log('PASS complete CSS/native preservation and class-adapter long-copy recipe; no new visual claim.');
