/* eslint-env node */
'use strict';

// Use Moodle's complete AMD pipeline, not a second implementation of Babel/Rollup.
require('./verify-build-versions.cjs').assertNode();
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');

const pluginRoot = path.resolve(__dirname, '../..');
const checkout = process.argv[2] && path.resolve(process.argv[2]);
const checkOnly = process.argv.includes('--check');
if (!checkout || process.argv.slice(3).some(arg => arg !== '--check')) {
    throw new Error('Usage: node tools/release/build-amd-official.cjs MOODLE_BUILD_ROOT [--check]');
}
const required = ['Gruntfile.js', 'package.json', 'npm-shrinkwrap.json', '.eslintrc',
    '.grunt/tasks/javascript.js', '.grunt/babel-plugin-add-module-to-define.js',
    'lib/components.json', 'lib/plugins.json', 'node_modules/grunt/bin/grunt'];
for (const name of required) {
    if (!fs.existsSync(path.join(checkout, name))) {
        throw new Error('Incomplete Moodle build checkout: ' + name);
    }
}
const walk = directory => fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
        throw new Error('Unexpected symlink in build inputs: ' + file);
    }
    return entry.isDirectory() ? walk(file) : [file];
});
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceRoot = path.join(pluginRoot, 'amd/src');
const inputs = new Map(walk(sourceRoot).map(file => [file, digest(file)]));
const tempPrefix = path.join(os.tmpdir(), 'easystud-official-amd-');
const staging = fs.mkdtempSync(tempPrefix);
try {
    // Never install dependencies, change a shared checkout or build in a served Moodle.
    // Resolve dependencies from the caller's installed, lockfile-managed build checkout.
    fs.cpSync(path.join(checkout, '.grunt'), path.join(staging, '.grunt'), {recursive: true});
    for (const name of ['Gruntfile.js', 'package.json', 'npm-shrinkwrap.json', '.eslintrc', '.stylelintrc',
        '.gherkin-lintrc', 'phpcs.xml.dist', 'lib/components.json', 'lib/plugins.json']) {
        const source = path.join(checkout, name);
        if (fs.existsSync(source)) {
            fs.mkdirSync(path.dirname(path.join(staging, name)), {recursive: true});
            fs.copyFileSync(source, path.join(staging, name));
        }
    }
    fs.symlinkSync(path.join(checkout, 'node_modules'), path.join(staging, 'node_modules'),
        process.platform === 'win32' ? 'junction' : 'dir');
    const localDirectory = JSON.parse(fs.readFileSync(path.join(staging, 'lib/components.json'), 'utf8')).plugintypes.local;
    if (!['local', 'public/local'].includes(localDirectory)) {
        throw new Error('Unsupported Moodle local-plugin directory: ' + localDirectory);
    }
    const componentRelative = localDirectory + '/groupimport';
    const component = path.join(staging, componentRelative);
    fs.mkdirSync(component, {recursive: true});
    fs.copyFileSync(path.join(pluginRoot, 'version.php'), path.join(component, 'version.php'));
    fs.cpSync(sourceRoot, path.join(component, 'amd/src'), {recursive: true});
    // CI checks out LF (see .gitattributes). Normalize only disposable staged inputs;
    // otherwise Windows line endings alter both ESLint results and sourcesContent.
    for (const file of walk(path.join(component, 'amd/src'))) {
        if (file.endsWith('.js')) {
            fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
        }
    }
    const result = spawnSync(process.execPath, [path.join(staging, 'node_modules/grunt/bin/grunt'),
        'amd', '--root=' + componentRelative + '/amd', '--max-lint-warnings=0'], {
        cwd: staging, stdio: 'inherit', env: {...process.env, PWD: staging},
    });
    if (result.error || result.status !== 0) {
        throw result.error || new Error('Official Moodle grunt amd failed: ' + result.status);
    }
    for (const [file, before] of inputs) {
        if (digest(file) !== before) {
            throw new Error('Source changed during build; refusing to publish stale output: ' + file);
        }
    }
    const output = path.join(component, 'amd/build');
    const generated = walk(output).map(file => path.relative(output, file)).sort();
    const expected = [...inputs.keys()].filter(file => file.endsWith('.js')).flatMap(file => {
        const relative = path.relative(sourceRoot, file).replace(/\.js$/, '.min.js');
        return [relative, relative + '.map'];
    }).sort();
    if (JSON.stringify(expected) !== JSON.stringify(generated)) {
        throw new Error('Official output does not match the complete source/module inventory.');
    }
    const target = path.join(pluginRoot, 'amd/build');
    const existing = fs.existsSync(target) ? walk(target).map(file => path.relative(target, file)).sort() : [];
    const obsolete = existing.filter(file => !generated.includes(file));
    if (obsolete.length) {
        throw new Error('Review obsolete outputs explicitly; nothing deleted: ' + obsolete.join(', '));
    }
    const differences = generated.filter(file => !fs.existsSync(path.join(target, file)) ||
        !fs.readFileSync(path.join(target, file)).equals(fs.readFileSync(path.join(output, file))));
    if (checkOnly && differences.length) {
        throw new Error('Official AMD output is stale: ' + differences.join(', '));
    }
    if (!checkOnly) {
        for (const file of differences) {
            fs.mkdirSync(path.dirname(path.join(target, file)), {recursive: true});
            fs.copyFileSync(path.join(output, file), path.join(target, file));
        }
    }
    console.log(JSON.stringify({mode: checkOnly ? 'check' : 'build', modules: expected.length / 2,
        files: generated.length, changed: differences.length, lockfileSha256: digest(path.join(checkout, 'npm-shrinkwrap.json'))}));
} finally {
    // mkdtemp owns this exact absolute directory; never traverse the dependency junction.
    if (!path.resolve(staging).startsWith(path.resolve(tempPrefix))) {
        throw new Error('Unexpected temporary build path; cleanup refused.');
    }
    const dependencies = path.join(staging, 'node_modules');
    if (fs.existsSync(dependencies)) {
        fs.unlinkSync(dependencies);
    }
    fs.rmSync(staging, {recursive: true, force: true});
}
