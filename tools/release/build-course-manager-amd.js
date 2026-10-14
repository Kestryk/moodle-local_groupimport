/* eslint-env node */

const fs = require('fs');
const path = require('path');

const terserPackageRoot = process.argv[2];
if (!terserPackageRoot) {
    throw new Error('Pass the absolute directory containing the Moodle toolchain terser package.');
}

const pluginRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(pluginRoot, 'amd', 'src', 'course_manager.js');
const buildPath = path.join(pluginRoot, 'amd', 'build', 'course_manager.min.js');
const mapPath = `${buildPath}.map`;
const moduleName = 'local_groupimport/course_manager';
const terser = require(path.join(path.resolve(terserPackageRoot), 'terser'));

const source = fs.readFileSync(sourcePath, 'utf8');
const lf = source.replace(/\r\n/g, '\n');

// T055: course_manager.js is the orchestrator; its code lives in amd/src/local/cm (built by
// build-sm-amd.js). Every import statement must be one of these exact forms, each turned into an
// AMD dependency of the wrapper; any other import fails the build.
const fixedImports = [
    {text: "import * as Motion from './motion';", dependency: 'local_groupimport/motion', param: 'Motion', required: true},
    {text: "import * as Guide from './easyedu_guide';", dependency: 'local_groupimport/easyedu_guide', param: 'Guide'},
    {text: "import Log from 'core/log';", dependency: 'core/log', param: 'Log'},
    {text: "import Notification from 'core/notification';", dependency: 'core/notification', param: 'Notification'},
];
const namedSources = [
    {pattern: /^\.\/(searchable_choices|member_selection)$/, dependency: name => `local_groupimport/${name}`,
        exists: () => true},
    {pattern: /^\.\/local\/sm\/([a-z_]+)$/, dependency: name => `local_groupimport/local/sm/${name}`,
        exists: name => fs.existsSync(path.join(pluginRoot, 'amd', 'src', 'local', 'sm', `${name}.js`))},
    {pattern: /^\.\/local\/cm\/([a-z_]+)$/, dependency: name => `local_groupimport/local/cm/${name}`,
        exists: name => fs.existsSync(path.join(pluginRoot, 'amd', 'src', 'local', 'cm', `${name}.js`))},
];
const paramFor = dependency => dependency.replace(/^local_groupimport\//, '').split(/[/_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');

const statements = lf.match(/^import\b/gm) || [];
const dependencies = [];
let namedSource = lf;
let handled = 0;
fixedImports.forEach(entry => {
    const count = lf.split(entry.text).length - 1;
    if (count > 1 || (entry.required && count !== 1)) {
        throw new Error(`The course manager AMD source must contain exactly once: ${entry.text}`);
    }
    if (count === 1) {
        namedSource = namedSource.replace(entry.text, '');
        dependencies.push({dependency: entry.dependency, param: entry.param});
        handled++;
    }
});
const cmImported = [];
namedSource = namedSource.replace(/^import \{([^}]*)\} from '([^']+)';$/gm, (match, names, from) => {
    const sourceEntry = namedSources.find(entry => entry.pattern.test(from));
    if (!sourceEntry) {
        throw new Error(`The course manager AMD source imports from an unexpected module: ${from}`);
    }
    const name = from.match(sourceEntry.pattern)[1];
    if (!sourceEntry.exists(name)) {
        throw new Error(`The course manager AMD source imports a missing module: ${from}`);
    }
    const dependency = sourceEntry.dependency(name);
    if (dependencies.some(entry => entry.dependency === dependency)) {
        throw new Error(`The course manager AMD source imports ${from} twice.`);
    }
    if (from.startsWith('./local/cm/')) {
        cmImported.push(name);
    }
    const param = paramFor(dependency);
    dependencies.push({dependency, param});
    handled++;
    return 'const {' + names.replace(/\s+/g, ' ').trim().replace(/,$/, '') + '} = ' + param + ';';
});
if (handled !== statements.length || /^import\b/m.test(namedSource)) {
    throw new Error('The course manager AMD source contains an import statement this build does not know.');
}
if (namedSource.split('export const init =').length !== 2 || /^export\b(?! const init =)/m.test(namedSource)) {
    throw new Error('The course manager AMD source must export init only.');
}
if (!cmImported.length) {
    throw new Error('The course manager AMD source does not import its local/cm modules.');
}

// Every local/cm module must be loaded, directly or through another local/cm module.
const cmDir = path.join(pluginRoot, 'amd', 'src', 'local', 'cm');
const cmModules = fs.readdirSync(cmDir).filter(name => name.endsWith('.js')).map(name => name.replace(/\.js$/, ''));
const reached = new Set();
const reach = name => {
    if (reached.has(name)) {
        return;
    }
    reached.add(name);
    const text = fs.readFileSync(path.join(cmDir, `${name}.js`), 'utf8');
    [...text.matchAll(/from '\.\/([a-z_]+)';/g)].forEach(match => reach(match[1]));
};
cmImported.forEach(reach);
const orphans = cmModules.filter(name => !reached.has(name));
if (orphans.length) {
    throw new Error(`Course manager modules never loaded: ${orphans.join(', ')}`);
}

namedSource = namedSource.replace('export const init =', 'const init =');
const wrappedSource = `define("${moduleName}", [${dependencies.map(entry => JSON.stringify(entry.dependency)).join(', ')}], ` +
    `function(${dependencies.map(entry => entry.param).join(', ')}) {\n` +
    `${namedSource}\nreturn {init: init};\n});`;

terser.minify(
    {'../src/course_manager.js': wrappedSource},
    {
        compress: true,
        mangle: false,
        sourceMap: {
            filename: path.basename(buildPath),
            url: path.basename(mapPath)
        }
    }
).then(result => {
    if (!result.code || !result.map || !result.code.includes(`define("${moduleName}"`)) {
        throw new Error('Terser did not produce the expected Course Manager AMD build and source map.');
    }
    fs.writeFileSync(buildPath, `${result.code}\n`, 'utf8');
    fs.writeFileSync(mapPath, `${result.map}\n`, 'utf8');
    process.stdout.write(`EasyStud course manager AMD build completed (${dependencies.length} dependencies).\n`);
}).catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
});
