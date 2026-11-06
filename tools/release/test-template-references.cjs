#!/usr/bin/env node
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Template references and display-preferences prefetch contract (gate CI de base, 06/11/2026).
 *
 * f50625a4 renamed every AMD module with Moodle's "-lazy" suffix and also renamed, by mistake, the
 * Mustache template requested by display_preferences-lazy.js. That template does not exist; the idle
 * prefetch swallowed the rejection, but Moodle 4.5 doRender had already opened its
 * "core/templates:doRender" Pending and never resolves it on a load rejection, so every Behat step
 * on an EasyStud page waited forever.
 *
 * Part 1 (static): every template name requested by source, built AMD, PHP or a Mustache partial
 * resolves to templates/<name>.mustache, and every AMD module name requested by PHP or AMD resolves
 * to amd/src/<name>.js. Module names and template names are checked separately.
 * Part 2 (behaviour): the real amd/src/display_preferences-lazy.js init/idle prefetch runs against a
 * doRender double with the Moodle 4.5 Pending contract (Pending opened before the template load,
 * resolved only after a successful render). The prefetch must request an existing template, append
 * the dialog and leave no Pending. A control run of the same harness on the pre-fix template name
 * must leave "core/templates:doRender" pending, proving the harness detects the regression.
 *
 * Usage: node tools/release/test-template-references.cjs [pluginRoot]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const failures = [];
let assertions = 0;
const check = (condition, message) => {
    assertions++;
    if (!condition) {
        failures.push(message);
    }
};

const walk = (dir, accept, out = []) => {
    if (!fs.existsSync(dir)) {
        return out;
    }
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        if (['node_modules', 'vendor', '.git'].includes(entry.name)) {
            continue;
        }
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, accept, out);
        } else if (accept(full)) {
            out.push(full);
        }
    }
    return out;
};
const rel = file => path.relative(root, file).split(path.sep).join('/');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// Inventory of real templates and AMD modules.
const templateDir = path.join(root, 'templates');
const templates = new Set(walk(templateDir, f => f.endsWith('.mustache'))
    .map(f => 'local_groupimport/' + path.relative(templateDir, f).split(path.sep).join('/').replace(/\.mustache$/, '')));
const amdDir = path.join(root, 'amd', 'src');
const modules = new Set(walk(amdDir, f => f.endsWith('.js'))
    .map(f => 'local_groupimport/' + path.relative(amdDir, f).split(path.sep).join('/').replace(/\.js$/, '')));
check(templates.has('local_groupimport/display_preferences'), 'templates/display_preferences.mustache is missing.');
check(modules.has('local_groupimport/display_preferences-lazy'), 'amd/src/display_preferences-lazy.js is missing.');

// Part 1: static references.
const name = '([\'"])(local_groupimport/[A-Za-z0-9_/-]+)\\1';
const templatePatterns = [
    new RegExp('\\b(?:renderForPromise|renderTemplate|render|getTemplate|getTemplateSource|prefetchTemplates?)\\(\\s*' + name, 'g'),
    new RegExp('\\btemplateName\\s*=\\s*' + name, 'g'),
];
const phpTemplatePattern = new RegExp('\\b(?:render_from_template|prefetch_template)\\(\\s*' + name, 'g');
const phpModulePattern = new RegExp('\\bjs_call_amd\\(\\s*' + name, 'g');
const partialPattern = /\{\{[<>]\s*(local_groupimport\/[A-Za-z0-9_/-]+)\s*\}\}/g;
const amdModulePatterns = [
    new RegExp('\\b(?:define|require)\\(\\s*\\[([^\\]]*)\\]', 'g'),
    new RegExp('\\bimport\\s+(?:[^\'"]*?\\s+from\\s+)?' + name, 'g'),
];

const templateRefs = [];
const moduleRefs = [];
const collect = (file, text, pattern, group, sink) => {
    for (const match of text.matchAll(pattern)) {
        sink.push({ref: match[group], where: rel(file) + ':' + lineOf(text, match.index)});
    }
};
const isGenerated = file => /[\\/]amd[\\/]build[\\/]/.test(file);
for (const file of walk(path.join(root, 'amd'), f => /\.js$/.test(f))) {
    const text = fs.readFileSync(file, 'utf8');
    templatePatterns.forEach(pattern => collect(file, text, pattern, 2, templateRefs));
    if (!isGenerated(file)) {
        for (const match of text.matchAll(amdModulePatterns[0])) {
            for (const dep of match[1].matchAll(/(['"])(local_groupimport\/[A-Za-z0-9_/-]+)\1/g)) {
                moduleRefs.push({ref: dep[2], where: rel(file) + ':' + lineOf(text, match.index)});
            }
        }
        collect(file, text, amdModulePatterns[1], 2, moduleRefs);
    }
}
for (const file of walk(root, f => f.endsWith('.php'))) {
    const text = fs.readFileSync(file, 'utf8');
    collect(file, text, phpTemplatePattern, 2, templateRefs);
    collect(file, text, phpModulePattern, 2, moduleRefs);
}
for (const file of walk(templateDir, f => f.endsWith('.mustache'))) {
    collect(file, fs.readFileSync(file, 'utf8'), partialPattern, 1, templateRefs);
}

check(templateRefs.length > 10, `Template reference scan found only ${templateRefs.length} references.`);
check(moduleRefs.length > 10, `AMD module reference scan found only ${moduleRefs.length} references.`);
for (const {ref, where} of templateRefs) {
    check(templates.has(ref), `${where} requests template ${ref}, but templates/${ref.slice(18)}.mustache does not exist.`);
}
for (const {ref, where} of moduleRefs) {
    check(modules.has(ref), `${where} requests AMD module ${ref}, but amd/src/${ref.slice(18)}.js does not exist.`);
}
const builtPrefs = path.join(root, 'amd', 'build', 'display_preferences-lazy.min.js');
check(fs.existsSync(builtPrefs) &&
    /renderForPromise\(\s*["']local_groupimport\/display_preferences["']/.test(fs.readFileSync(builtPrefs, 'utf8')),
'amd/build/display_preferences-lazy.min.js does not request local_groupimport/display_preferences (stale build?).');

// Part 2: behaviour of the real module against the Moodle 4.5 doRender Pending contract.
const stubElement = () => {
    const element = {
        textContent: 'Default', hidden: false, checked: false, open: false, elements: [],
        addEventListener() {}, removeEventListener() {}, setAttribute() {}, removeAttribute() {},
        getAttribute() {
            return '';
        },
        focus() {}, close() {}, showModal() {},
        matches() {
            return false;
        },
        contains() {
            return false;
        },
        closest() {
            return null;
        },
        querySelector() {
            return stubElement();
        },
        querySelectorAll() {
            return [];
        },
    };
    return element;
};

const runPrefetch = async source => {
    const pendings = new Set();
    const requested = [];
    const appended = [];
    const idle = [];
    const uiRoot = stubElement();
    uiRoot.querySelector = () => stubElement();
    const Templates = {
        // Mirrors lib/amd/src/local/templates/renderer.js doRender (Moodle 4.5): the Pending is opened
        // before the template is loaded and resolved only at the end of a successful render.
        renderForPromise(templateName) {
            const pending = {key: 'core/templates:doRender', templateName};
            pendings.add(pending);
            requested.push(templateName);
            const file = path.join(templateDir, templateName.replace(/^local_groupimport\//, '') + '.mustache');
            return new Promise((resolve, reject) => setImmediate(() => {
                if (!templateName.startsWith('local_groupimport/') || !fs.existsSync(file)) {
                    reject(new Error(`Template ${templateName} not found (filenotfound).`));
                    return;
                }
                pendings.delete(pending);
                resolve({html: fs.readFileSync(file, 'utf8'), js: ''});
            }));
        },
        appendNodeContents(target, html) {
            appended.push({target, html});
        },
    };
    const Motion = {exit: () => Promise.resolve(), enter() {}, setLevel() {}};
    const Bubble = {createBubbleController: () => ({
        show() {}, hide() {}, release() {}, dismiss() {}, scheduleHide() {},
        isActive: () => false, isOpen: () => false, contains: () => false,
    })};
    const deps = {
        'core/templates': Templates,
        'core_user/repository': {setUserPreference: () => Promise.resolve()},
        'core/notification': {exception() {}},
        'local_groupimport/motion-lazy': Motion,
        'local_groupimport/easyedu_bubble-lazy': Bubble,
    };
    let factoryResult = null;
    const define = (names, factory) => {
        factoryResult = factory(...names.map(dep => {
            if (!(dep in deps)) {
                throw new Error('Unexpected dependency ' + dep);
            }
            return deps[dep];
        }));
    };
    const document = {
        readyState: 'complete',
        addEventListener() {},
        querySelector: selector => (selector === '.easyedu-ui' ? uiRoot : null),
    };
    const window = {
        requestIdleCallback: callback => idle.push(callback),
        setTimeout: callback => idle.push(callback),
        addEventListener() {},
    };
    vm.runInNewContext(source, {define, document, window, Element: function Element() {}}, {filename: 'display_preferences-lazy.js'});
    factoryResult.init('full', 'default');
    while (idle.length) {
        idle.shift()();
    }
    for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setImmediate(resolve));
    }
    return {requested, appended, pending: [...pendings].map(p => p.key)};
};

(async() => {
    const sourceFile = path.join(amdDir, 'display_preferences-lazy.js');
    const source = fs.readFileSync(sourceFile, 'utf8');
    const fixed = await runPrefetch(source);
    check(fixed.requested.length === 1, `Idle prefetch requested ${fixed.requested.length} renders instead of 1.`);
    check(fixed.requested[0] === 'local_groupimport/display_preferences',
        `Idle prefetch requested ${fixed.requested[0]} instead of local_groupimport/display_preferences.`);
    check(fixed.appended.length === 1 && /data-easyedu-display-dialog/.test(fixed.appended[0].html),
        'Idle prefetch did not append the display preferences dialog.');
    check(fixed.pending.length === 0, `Idle prefetch left pending: ${fixed.pending.join(', ')}.`);

    // Control: the pre-fix template name must be detected by the same harness.
    const broken = source.replace("renderForPromise('local_groupimport/display_preferences'",
        "renderForPromise('local_groupimport/display_preferences-lazy'");
    check(broken !== source, 'Control mutation did not apply; the harness no longer targets the render call.');
    const control = await runPrefetch(broken);
    check(control.appended.length === 0 && control.pending.includes('core/templates:doRender'),
        'Control: the pre-fix template name no longer leaves core/templates:doRender pending; harness is vacuous.');

    const result = {
        passed: failures.length === 0,
        assertions,
        templateReferences: templateRefs.length,
        moduleReferences: moduleRefs.length,
        prefetch: {requested: fixed.requested, appended: fixed.appended.length, pending: fixed.pending},
        control: {appended: control.appended.length, pending: control.pending},
        failures,
    };
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exitCode = failures.length ? 1 : 0;
})().catch(error => {
    process.stderr.write(String(error && error.stack || error) + '\n');
    process.exitCode = 1;
});
