/* eslint-env node */
// Compile the SM-RENDU modules (amd/src/local/sm/*.js) and the course manager modules
// (amd/src/local/cm/*.js, T055) with the Moodle Babel plugins and Terser.
// Usage: node tools/release/build-sm-amd.js <Moodle build checkout root>
const fs = require('fs');
const path = require('path');
if (!process.argv[2]) { throw new Error('Pass the Moodle build checkout root.'); }
const buildRoot = path.resolve(process.argv[2]);
const pluginRoot = path.resolve(__dirname, '../..');
process.chdir(buildRoot);
global.fetch = undefined;
const babel = require(path.join(buildRoot, 'node_modules/@babel/core'));
const terser = require(path.join(buildRoot, 'node_modules/terser'));
const plugin = name => require.resolve(name, {paths: [buildRoot]});
const srcRoot = path.join(pluginRoot, 'amd/src');
const jsNames = dir => fs.readdirSync(path.join(srcRoot, 'local', dir)).filter(name => name.endsWith('.js')).sort();

// T055: the course manager modules (local/cm) only import what course_manager.js imported, the
// SM-RENDU modules and each other, never course_manager itself, and never in a cycle: the
// course manager AMD wrapper reads their exports once, at definition time.
const cmExternal = ['../../motion', '../../easyedu_bubble', '../../easyedu_guide', '../../searchable_choices', '../../member_selection',
    'core/log', 'core/notification'];
const checkCmModules = () => {
    const names = jsNames('cm').map(name => name.replace(/\.js$/, ''));
    const smNames = jsNames('sm').map(name => name.replace(/\.js$/, ''));
    if (!names.length) {
        throw new Error('No course manager module in amd/src/local/cm.');
    }
    const graph = new Map();
    names.forEach(base => {
        const source = fs.readFileSync(path.join(srcRoot, 'local/cm', base + '.js'), 'utf8').replace(/\r\n/g, '\n');
        const statements = source.match(/^import\b/gm) || [];
        const imports = [...source.matchAll(/^import (?:\* as \w+|\w+|\{[^}]*\}) from '([^']+)';$/gm)].map(match => match[1]);
        if (imports.length !== statements.length) {
            throw new Error(`local/cm/${base}.js: unexpected import statement form.`);
        }
        const deps = [];
        imports.forEach(from => {
            if (from.startsWith('./')) {
                if (!names.includes(from.slice(2))) {
                    throw new Error(`local/cm/${base}.js imports an unknown course manager module: ${from}`);
                }
                deps.push(from.slice(2));
            } else if (from.startsWith('../sm/')) {
                if (!smNames.includes(from.slice(6))) {
                    throw new Error(`local/cm/${base}.js imports an unknown SM-RENDU module: ${from}`);
                }
            } else if (!cmExternal.includes(from)) {
                throw new Error(`local/cm/${base}.js imports a module outside its allowed set: ${from}`);
            }
        });
        if (/^export (let|var)\b/m.test(source)) {
            throw new Error(`local/cm/${base}.js exports a mutable binding: expose a getter/setter instead.`);
        }
        if (/^export default\b/m.test(source)) {
            throw new Error(`local/cm/${base}.js must only use named exports.`);
        }
        graph.set(base, deps);
    });
    const state = new Map();
    const visit = (base, trail) => {
        if (state.get(base) === 'done') {
            return;
        }
        if (state.get(base) === 'visiting') {
            throw new Error('Circular course manager imports: ' + trail.concat(base).join(' -> '));
        }
        state.set(base, 'visiting');
        graph.get(base).forEach(dep => visit(dep, trail.concat(base)));
        state.set(base, 'done');
    };
    names.forEach(base => visit(base, []));
};
checkCmModules();

// SM-RENDU modules import Moodle core modules, each other and the shared course manager helpers
// only. V2 n°10: every search and filter matches through local/sm/filter_engine, a pure module
// (no import, no DOM): the filtering modules must import it, and none may re-implement it.
const smExternal = ['core/mustache', 'core/local/templates/loader', 'core/ajax', 'core/reactive', '../cm/shared'];
const engineUsers = {sm: ['index', 'groups'], cm: ['filters', 'workspace', 'group_cards', 'identifiers', 'shared']};
const checkSmModules = () => {
    const smNames = jsNames('sm').map(name => name.replace(/\.js$/, ''));
    if (!smNames.includes('filter_engine')) {
        throw new Error('Missing the filter engine: amd/src/local/sm/filter_engine.js.');
    }
    const read = (dir, base) => fs.readFileSync(path.join(srcRoot, 'local', dir, base + '.js'), 'utf8').replace(/\r\n/g, '\n');
    smNames.forEach(base => {
        const source = read('sm', base);
        const statements = source.match(/^import\b/gm) || [];
        const imports = [...source.matchAll(/^import (?:\* as \w+|\w+|\{[^}]*\}) from '([^']+)';$/gm)].map(match => match[1]);
        if (imports.length !== statements.length) {
            throw new Error(`local/sm/${base}.js: unexpected import statement form.`);
        }
        if (base === 'filter_engine' && (imports.length || /\bdocument\b|\bwindow\b/.test(source))) {
            throw new Error('local/sm/filter_engine.js must stay pure: no import, no document or window.');
        }
        imports.forEach(from => {
            if (from.startsWith('./') ? !smNames.includes(from.slice(2)) : !smExternal.includes(from)) {
                throw new Error(`local/sm/${base}.js imports a module outside its allowed set: ${from}`);
            }
        });
        if (/^export (let|var|default)\b/m.test(source)) {
            throw new Error(`local/sm/${base}.js must only export named constants.`);
        }
    });
    Object.entries(engineUsers).forEach(([dir, bases]) => bases.forEach(base => {
        const source = read(dir, base);
        const from = dir === 'sm' ? './filter_engine' : '../sm/filter_engine';
        if (source.indexOf(`} from '${from}';`) === -1) {
            throw new Error(`local/${dir}/${base}.js must match through the filter engine (${from}).`);
        }
        if (/\.toLowerCase\(\)/.test(source) || /\.indexOf\(query\)/.test(source)) {
            throw new Error(`local/${dir}/${base}.js re-implements the filter engine (lowercasing or query matching).`);
        }
    }));
};
checkSmModules();

const buildModule = (dir, name) => {
    const sourceDir = path.join(srcRoot, 'local', dir);
    const buildDir = path.join(pluginRoot, 'amd/build/local', dir);
    fs.mkdirSync(buildDir, {recursive: true});
    const base = name.replace(/\.js$/, '');
    const result = babel.transformSync(fs.readFileSync(path.join(sourceDir, name), 'utf8'), {
        filename: path.join(sourceDir, name),
        babelrc: false, configFile: false, sourceMaps: true,
        sourceFileName: `../../../src/local/${dir}/` + name, comments: false,
        // Moodle's add-module-to-define plugin needs the file inside the build checkout;
        // these modules only use named exports, so naming the define() call is all it would do.
        plugins: [plugin('babel-plugin-transform-es2015-modules-amd-lazy'),
            plugin('babel-plugin-system-import-transformer')],
        presets: [[plugin('@babel/preset-env'), {modules: false, useBuiltIns: false}]],
    });
    const moduleName = `local_groupimport/local/${dir}/${base}`;
    if (!/^define\(\[/m.test(result.code)) {
        throw new Error(`Unexpected AMD output for ${dir}/${name}.`);
    }
    const named = result.code.replace(/^define\(\[/m, `define("${moduleName}", [`);
    const dependencies = named.slice(0, named.indexOf(']'));
    if (dir === 'cm' && (/course_manager/.test(dependencies) || !/^define\("[^"]+", \["exports"/.test(named))) {
        throw new Error(`Unexpected dependencies for ${dir}/${name}: ${dependencies}`);
    }
    return terser.minify(named, {mangle: false,
        sourceMap: {content: result.map, filename: base + '.min.js', url: base + '.min.js.map'},
    }).then(output => {
        if (!output.code.startsWith(`define("${moduleName}"`)) {
            throw new Error(`Missing canonical Moodle module name for ${dir}/${name}.`);
        }
        fs.writeFileSync(path.join(buildDir, base + '.min.js'), output.code + '\n');
        fs.writeFileSync(path.join(buildDir, base + '.min.js.map'), output.map + '\n');
        return `${dir}/${base}`;
    });
};

Promise.all(['sm', 'cm'].reduce((all, dir) => all.concat(jsNames(dir).map(name => buildModule(dir, name))), []))
    .then(built => {
        process.stdout.write(`SM-RENDU and course manager AMD rebuilt: ${built.join(', ')}.\n`);
    }).catch(error => { process.stderr.write(error.stack || String(error)); process.exitCode = 1; });
