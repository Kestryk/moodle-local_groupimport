/* eslint-env node */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const [kit, sassPath, postcssPath, baseline = '348be719'] = process.argv.slice(2);
assert.ok(kit && sassPath && postcssPath, 'Pass Kit root, Sass 1.79.1 and PostCSS package paths.');
const sass = require(path.resolve(sassPath));
const postcss = require(path.resolve(postcssPath));
require('./verify-build-versions.cjs').assertNode();
require('./verify-build-versions.cjs').assertSass(sass);
const norm = value => value.replace(/\r\n/g, '\n');
const read = file => norm(fs.readFileSync(path.join(root, file), 'utf8'));
const before = file => norm(execFileSync('git', ['show', baseline + ':' + file], {
    cwd: root, encoding: 'utf8', maxBuffer: 8e6,
}));
const scss = 'scss/easyedu/components/_guide.scss';
const block = source => source.slice(source.indexOf('  // Library / Guide launcher / Desktop / Default;'),
    source.indexOf('  .easyedu-guide-modal {'));
const addition = block(read(scss));
assert.ok(addition.includes('easyedu-guide__launcher--floating'));
assert.equal(block(norm(fs.readFileSync(path.join(kit, scss), 'utf8'))), addition, 'Canonical variant parity');
assert.equal(read(scss).replace(addition, ''), before(scss), 'Existing Guide SCSS unchanged');
for (const file of ['amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js', 'amd/src/motion.js',
    'easyedu-guide-kit/amd/src/easyedu_guide_fullscreen.js', 'templates/easyedu_guide.mustache',
    'scss/easyedu/components/_guide-discovery.scss', 'amd/src/local/mi/guide.js']) {
    assert.equal(read(file), before(file), 'Existing Guide/MI behavior unchanged: ' + file);
}
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'easyedu-floating-guide-'));
try {
    fs.cpSync(path.join(root, 'scss'), path.join(temporary, 'scss'), {recursive: true});
    fs.writeFileSync(path.join(temporary, scss), before(scss));
    const compile = base => sass.compile(path.join(base, 'scss/easystud.scss'), {
        charset: false, logger: sass.Logger.silent,
    }).css;
    const rules = css => {
        const rows = [];
        postcss.parse(css).walkRules(rule => {
            if (rule.selector.includes('easyedu-guide__launcher--floating')) {
                return;
            }
            const parents = [];
            for (let parent = rule.parent; parent.type !== 'root'; parent = parent.parent) {
                parents.unshift([parent.name, parent.params]);
            }
            rows.push({parents, selector: rule.selector, declarations: rule.nodes.filter(n => n.type === 'decl')
                .map(n => [n.prop, n.value, !!n.important])});
        });
        return rows;
    };
    const oldRules = rules(compile(temporary));
    assert.deepEqual(rules(compile(root)), oldRules, 'Every unrelated ordered CSS rule remains identical');
    assert.deepEqual(rules(read('styles/guide.css')), rules(before('styles/guide.css')),
        'Delivered CSS changes only the floating variant');
    process.stdout.write(JSON.stringify({passed: true, preservedRules: oldRules.length, canonicalVariant: true}) + '\n');
} finally {
    assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temporary).startsWith('easyedu-floating-guide-'));
    fs.rmSync(temporary, {recursive: true, force: true});
}
