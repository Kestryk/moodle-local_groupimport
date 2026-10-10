// Existing Light family mapping only; behavior/native integration remain open.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
assert.ok(process.argv[2], 'Supply canonical Kit root');
const kitRoot = path.resolve(process.argv[2]);
const normalize = text => text.replace(/\r\n/g, '\n');
const modulePath = 'scss/easyedu/components/_tooltips.scss';
const show = (cwd, revision, file) => normalize(execFileSync('git', ['show', revision + ':' + file],
    {cwd, encoding:'utf8', maxBuffer:16 * 1024 * 1024}));
const recipe = text => text.slice(text.indexOf('// Existing Foundations Light Short/Long specimens,'),
    text.indexOf('@mixin popover-surface'));
const canonical = normalize(fs.readFileSync(path.join(kitRoot, modulePath), 'utf8'));
const embedded = normalize(fs.readFileSync(path.join(root, modulePath), 'utf8'));
assert.match(recipe(canonical), /@mixin foundation-light-tooltip/);
assert.equal(recipe(canonical), recipe(embedded));
for (const [cwd, current, revision] of [[kitRoot, canonical, '585c6a75d1556471193f16e6d65f5f88b999db7b'],
    [root, embedded, '2e6adc5f438a1b133af0e3a2fdcac08dcf5762a3']]) {
    assert.equal(current.replace(recipe(current), ''), show(cwd, revision, modulePath), 'All legacy recipes unchanged');
}
assert.equal(normalize(fs.readFileSync(path.join(root, 'styles.css'), 'utf8')),
    show(root, '2e6adc5f438a1b133af0e3a2fdcac08dcf5762a3', 'styles.css'), 'Full consumer CSS unchanged');
assert.doesNotMatch(canonical + embedded, /popover-control-label|PLACEHOLDER/);
const css = execFileSync('sass', ['--stdin', '--no-source-map', '--quiet', '--load-path=' + path.join(kitRoot, 'scss')],
    {encoding:'utf8', shell:process.platform === 'win32', input:
        '@use "easyedu" as e; .short { @include e.foundation-light-tooltip; } .long { @include e.foundation-light-tooltip(true); }'});
for (const [selector, size, weight, align, height] of [['short','.74','700','center','2.125'], ['long','.76','600','left','4']]) {
    const body = css.match(new RegExp('\\.' + selector + ' \\{([^}]+)\\}'))?.[1];
    assert.ok(body);
    for (const declaration of ['font-size: 0' + size + 'rem', 'font-weight: ' + weight, 'line-height: 1.35',
        'text-align: ' + align, 'min-height: ' + height + 'rem', 'box-sizing: border-box']) {
        assert.ok(body.includes(declaration), selector + ' ' + declaration);
    }
}
console.log('PASS selected Light Short/Long source roles, canonical/embedded recipe, legacy modules and full CSS preservation.');
