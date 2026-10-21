/* eslint-env node */
/**
 * I15 : build AMD pilote par manifeste, pour remplacer progressivement les
 * scripts build-*-amd.* ecrits a la main (22 scripts, chacun reecrivant les
 * imports ESM par substitution de chaine, voir AUDIT-REFACTORING-CODE-20261021.md).
 *
 * Ce script ne touche QUE les modules listes dans amd-build-manifest.json
 * (section "migrated"). Les autres build-*-amd.* restent inchanges et
 * continuent de fonctionner tels quels : la migration se fait module par
 * module, jamais en bloc.
 *
 * Usage :
 *   node tools/release/build-amd.cjs <toolchain-dir-contenant-terser> [moduleId ...]
 * Sans moduleId : construit tous les modules migres du manifeste.
 */
require('./verify-build-versions.cjs').assertNode();
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const toolchainRoot = process.argv[2];
if (!toolchainRoot) throw new Error('Supply the directory containing terser.');
const terser = require(path.join(path.resolve(toolchainRoot), 'terser'));

const root = path.resolve(__dirname, '../..');
const manifestPath = path.join(__dirname, 'amd-build-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const requestedIds = process.argv.slice(3);
const entries = requestedIds.length
    ? manifest.migrated.filter(entry => requestedIds.includes(entry.id))
    : manifest.migrated;
if (requestedIds.length && entries.length !== requestedIds.length) {
    const known = new Set(manifest.migrated.map(entry => entry.id));
    const missing = requestedIds.filter(id => !known.has(id));
    throw new Error('Unknown module id(s) in manifest: ' + missing.join(', '));
}

function buildOne(entry) {
    const sourcePath = path.join(root, entry.source);
    let source = fs.readFileSync(sourcePath, 'utf8');

    for (const guard of entry.guards || []) {
        if (!source.includes(guard)) {
            throw new Error(`${entry.id}: missing expected fragment, source drifted: ${guard}`);
        }
    }

    for (const rule of entry.replacements || []) {
        if (rule.global) {
            source = source.split(rule.find).join(rule.with);
        } else {
            assert.ok(source.includes(rule.find), `${entry.id}: replacement target not found: ${rule.find}`);
            source = source.replace(rule.find, rule.with);
        }
    }

    let exportNames;
    if (entry.exports === 'auto') {
        exportNames = [...source.matchAll(/^const ([A-Za-z_$][\w$]*)\s*=/gm)]
            .map(match => match[1])
            .filter(name => (entry.exportsBaseline || []).length === 0 || entry.exportsBaseline.includes(name));
        // When "auto", the manifest's replacements already turned every
        // `export const X =` into `const X =`; recover the export list from
        // the ORIGINAL source instead, matching build-searchable-choices-amd.js.
        const original = fs.readFileSync(sourcePath, 'utf8');
        exportNames = [...original.matchAll(/^export const ([A-Za-z_$][\w$]*)\s*=/gm)].map(match => match[1]);
        for (const required of entry.exportsRequired || []) {
            if (!exportNames.includes(required)) {
                throw new Error(`${entry.id}: expected export missing: ${required}`);
            }
        }
    } else {
        exportNames = entry.exports || [];
    }

    const deps = entry.deps || [];
    const amdDeps = deps.map(dep => `"${dep.amd}"`).join(', ');
    const params = deps.map(dep => dep.param).join(', ');
    const defineHeader = amdDeps
        ? `define("${entry.amdName}", [${amdDeps}], function(${params}) {\n`
        : `define("${entry.amdName}", [], function() {\n`;

    const wrapped = defineHeader + source + `\nreturn {${exportNames.join(', ')}};\n});`;

    const filename = entry.output;
    return terser.minify({[`../src/${path.basename(entry.source)}`]: wrapped}, {
        compress: true, mangle: false, sourceMap: {filename, url: `${filename}.map`},
    }).then(result => {
        if (!result.code || !result.map) throw new Error(`${entry.id}: incomplete AMD build.`);
        fs.writeFileSync(path.join(root, 'amd/build', filename), `${result.code}\n`);
        fs.writeFileSync(path.join(root, 'amd/build', `${filename}.map`), `${result.map}\n`);
        console.log(`${entry.id}: AMD built (${filename}).`);
    });
}

(async () => {
    for (const entry of entries) {
        await buildOne(entry);
    }
})().catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
});
