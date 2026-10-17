/* eslint-env node */
'use strict';

// K16-31: REPORT ONLY. Exceptions are deliberately narrow and visible in JSON.
// E01 scss/easyedu/**: embedded Kit definitions/adapters are the allowed source,
//     not local consumer overrides. This test does not certify canonical parity.
// E02 easyedu-guide-kit/**: distribution mirror; checking it again doubles counts.
// E03 styles/**, styles.css, amd/build/**: generated outputs, never source repairs.
// E04 vendor/node_modules, .git, tools/tests/docs: dependencies or non-product
//     fixtures/examples. Their styles are not the plugin's active source cascade.
// E05 course_banner_builder/local_course_banner_builder: K18-01 defers all CCB
//     work until EasyStud V2. Never traverse it, even when --root names CCB.
// No declaration-level exception: token-valued overrides, responsive rules,
// disabled states, focus and !important remain findings, never silently allowed.
// Layout-only gap/margin/position/display and animation timing are out of scope.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {assertNode} = require('./verify-build-versions.cjs');

const EXCEPTIONS = [
    {id: 'E01', pattern: '^scss/easyedu/', reason: 'Kit embarqué : définitions et adaptateurs autorisés.'},
    {id: 'E02', pattern: '^easyedu-guide-kit/', reason: 'Miroir distribué, pas une seconde adoption locale.'},
    {id: 'E03', pattern: '^(?:styles/|styles\\.css$|amd/build/)', reason: 'Sorties générées, exclues des sources.'},
    {id: 'E04', pattern: '(?:^|/)(?:vendor|node_modules|\\.git|tools|tests|docs|easyedu-kit-docs)(?:/|$)',
        reason: 'Dépendances et exemples/fixtures hors cascade produit.'},
    {id: 'E05', pattern: '(?:^|/)(?:course_banner_builder|local_course_banner_builder)(?:/|$)',
        reason: 'K18-01 : CCB hors périmètre jusqu’à EasyStud V2, sans parcours de ses sources.'},
];

// F01–F22 match the 17/10 standardisation inventory; F23–F26 extend the requested
// coverage to dialog shells, feedback, cards and skeletons. Families can overlap.
const FAMILIES = [
    ['F01', 'Fermer / Dismiss', /(?:close|dismiss|btn-close|fa-times)(?:\b|_)/i],
    ['F02', 'Boutons-icônes et retrait',
        /(?:icon-button|action-icon|member-remove|remove-member|entity-remove|__remove|__edit|header-action)/i],
    ['F03', 'Chevrons et dépliage', /(?:chevron|members-toggle|fold|expand|collapse|disclosure|section-toggle)/i],
    ['F04', 'Compteurs et badges', /(?:badge|counter|__count|count-bubble|count-pill)/i],
    ['F05', 'Pastilles de métadonnées', /(?:token|pill|tag(?:s)?(?:[-_\s.#:[\]]|$)|primary-badge|card-label)/i],
    ['F06', 'Déclencheurs de menu', /(?:more-actions|moreactions|card-menu|context-trigger|menu-trigger|__more|dropdown-toggle)/i],
    ['F07', 'Menus et sous-menus', /(?:menu|dropdown|context-action|action-list)/i],
    ['F08', 'Recherche et effacement', /(?:search|clear-search|search-clear|__clear)/i],
    ['F09', 'Pieds et actions de dialogue', /(?:dialog-footer|modal-footer|footer-action|footer-link)/i],
    ['F10', 'Sélection globale et Réinitialiser', /(?:select-all|selectall|deselect|reset|selection-action|selection-recovery)/i],
    ['F11', 'Plus / Moins de filtres', /(?:filter-disclosure|advanced-filters|more-filters|morefilters|lessfilters)/i],
    ['F12', 'Pagination et tri', /(?:pagination|paginator|page-link|page-item|sort-menu|sort-trigger|__sort)/i],
    ['F13', 'Bascules et sélecteurs de vue', /(?:toggle|switch|segmented|view-selector|view-option|view-button|view-tab)/i],
    ['F14', 'Cases, radios et sélection de ligne',
        /(?:checkbox|radio|check-input|entity-select|member-select|selection-box|__check|__select(?:\b|_))/i],
    ['F15', 'Choix recherchables et selects', /(?:select(?:\b|_)|searchable|choice|combobox)/i],
    ['F16', 'Champs et création en place', /(?:input|form-control|field|inline-create|quick-create|quickcreate|rename)/i],
    ['F17', 'Zones de texte et éditeurs', /(?:textarea|editor|text-area)/i],
    ['F18', 'Dépôt fichier et image', /(?:filepicker|filemanager|upload|dropzone|deposit|image-deposit)/i],
    ['F19', 'Sélecteurs de couleur', /(?:color-picker|colour-picker|colorpicker|colourpicker|swatch)/i],
    ['F20', 'Aide, bulles et popovers', /(?:tooltip|popover|bubble|help-icon|help-button|help-control)/i],
    ['F21', 'Commandes du Guide', /(?:guide.*(?:nav|command|play|pause|start|reset|footer|button)|guided.*(?:action|button))/i],
    ['F22', 'Boutons texte et actions', /(?:button|\bbtn\b|__action|text-action|small-action)/i],
    ['F23', 'Dialogues et fenêtres', /(?:dialog|modal)/i],
    ['F24', 'Messages et états vides', /(?:notification|feedback|message|alert|empty-state|empty-line|__empty|notice|toast)/i],
    ['F25', 'Cartes et lignes liées', /(?:card|identity|related-person|easystud-user|easystud-group)/i],
    ['F26', 'Squelettes', /(?:skeleton|loading-surface|loading-placeholder)/i],
];

const PROPERTY = new RegExp('^(?:(?:min-|max-)?(?:height|block-size)|padding(?:-.+)?|border(?:-.+)?|' +
    'font-size|line-height|(?:background(?:-.+)?|color|fill|stroke)|box-shadow|outline(?:-.+)?)$', 'i');

/** Locate the existing parser; never install a dependency during an audit. */
function parser(modules) {
    const search = [path.resolve(__dirname, '../..'), ...(modules ? [modules] : [])];
    try {
        return require(require.resolve('postcss-scss', {paths: search}));
    } catch (error) {
        throw new Error('postcss-scss absent : passer --modules <node_modules absolu> de la chaîne Moodle existante.');
    }
}

function exception(file) {
    return EXCEPTIONS.find(item => new RegExp(item.pattern).test(file));
}

/** Resolve literal nesting only; Sass interpolation is recorded, not executed. */
function selectorFor(node, postcss) {
    const chain = [];
    for (let current = node.parent; current; current = current.parent) {
        if (current.type === 'rule') {
            chain.unshift({kind: 'rule', text: current.selector});
        } else if (current.type === 'atrule' && current.name === 'mixin') {
            chain.unshift({kind: 'mixin', text: '@mixin ' + current.params});
        }
    }
    let selectors = [''];
    const mixins = [];
    for (const item of chain) {
        if (item.kind === 'mixin') {
            mixins.push(item.text);
            continue;
        }
        const children = postcss.list.comma(item.text);
        if (selectors.length * children.length > 256) {
            return {selector: chain.map(item => item.text).join(' / '), mixins, bounded: true};
        }
        selectors = selectors.flatMap(parent => children.map(child => {
            if (child.includes('&')) {
                return child.replace(/&/g, parent || '&');
            }
            return (parent ? parent + ' ' : '') + child;
        }));
    }
    return {selector: selectors.filter(Boolean).join(', '), mixins, bounded: false};
}

function scanText(text, file, syntax, postcss, localMixins = {}) {
    const root = syntax.parse(text, {from: file});
    const findings = [];
    root.walkDecls(declaration => {
        if (!PROPERTY.test(declaration.prop)) {
            return;
        }
        const resolved = selectorFor(declaration, postcss);
        const target = resolved.selector + ' ' + resolved.mixins.join(' ');
        const families = FAMILIES.filter(([, , pattern]) => pattern.test(target)).map(([id]) => id);
        for (const mixin of resolved.mixins) {
            const name = mixin.replace(/^@mixin\s+/, '').split(/[\s(]/)[0];
            families.push(...(localMixins[name] || []));
        }
        const uniqueFamilies = [...new Set(families)].sort();
        if (!families.length) {
            return;
        }
        const conditions = [];
        for (let parent = declaration.parent; parent; parent = parent.parent) {
            if (parent.type === 'atrule' && parent.name !== 'mixin') {
                conditions.unshift('@' + parent.name + ' ' + parent.params);
            }
        }
        findings.push({
            file, line: declaration.source.start.line, column: declaration.source.start.column,
            selector: resolved.selector, mixins: resolved.mixins, conditions,
            property: declaration.prop, value: declaration.value, important: Boolean(declaration.important),
            families: uniqueFamilies, focus: /:focus|focus-visible|focus-within|is-focused/.test(target),
            dynamic: /#\{|\$/.test(target), boundedSelectorExpansion: resolved.bounded,
            status: 'à examiner — redéfinition locale candidate, pas un défaut visuel prouvé',
        });
    });
    return findings;
}

function walk(root) {
    const files = [];
    const skipped = [];
    const rootException = exception(path.resolve(root).split(path.sep).join('/') + '/');
    if (rootException && rootException.id === 'E05') {
        return {files, skipped: [{file: '.', exception: 'E05', reason: rootException.reason}]};
    }
    function visit(directory) {
        for (const entry of fs.readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
            const absolute = path.join(directory, entry.name);
            const file = path.relative(root, absolute).split(path.sep).join('/');
            const excluded = exception(file + (entry.isDirectory() ? '/' : ''));
            if (excluded) {
                skipped.push({file, exception: excluded.id});
            } else if (entry.isSymbolicLink()) {
                skipped.push({file, exception: 'symlink', reason: 'Ne pas sortir du worktree ni parcourir une jonction.'});
            } else if (entry.isDirectory()) {
                visit(absolute);
            } else if (/\.(?:scss|css)$/i.test(entry.name)) {
                files.push(file);
            }
        }
    }
    visit(root);
    return {files, skipped};
}

function selfTest(syntax, postcss) {
    const checks = [];
    function check(name, source, inspect) {
        inspect(scanText(source, 'scss/components/_fixture.scss', syntax, postcss));
        checks.push(name);
    }
    check('nested BEM and state', '.host { &__button { padding: 4px; &:focus-visible { box-shadow: 0 0 0 2px red; } } }', rows => {
        assert.equal(rows.length, 2);
        assert.equal(rows[1].selector, '.host__button:focus-visible');
        assert.equal(rows[1].focus, true);
    });
    check('responsive token values remain findings',
        '@media (max-width: 400px) { .btn { height: var(--size) !important; } }', rows => {
        assert.equal(rows[0].important, true);
        assert.equal(rows[0].conditions.length, 1);
    });
    check('comments and layout are not declarations',
        '/* .button {height:99px} */ .button { gap:8px; margin:4px; display:flex; }', rows => assert.equal(rows.length, 0));
    check('local mixin', '@mixin small-icon-button { min-height:2rem; }', rows => assert.equal(rows.length, 1));
    const indirect = scanText('@mixin plain { height:32px; }', 'fixture.scss', syntax, postcss, {plain: ['F22']});
    assert.deepEqual(indirect[0].families, ['F22']);
    check('Sass interpolation explicit', '.card-#{$kind} { color:red; }', rows => assert.equal(rows[0].dynamic, true));
    check('checkbox switch skeleton and bubble',
        '.checkbox {padding:0} .switch {border-radius:8px} .skeleton {background:#eee} .bubble {font-size:12px}',
        rows => assert.equal(rows.length, 4));
    check('native input and dialog', 'input, dialog { line-height:1.5; }',
        rows => assert.ok(rows[0].families.includes('F16') && rows[0].families.includes('F23')));
    check('functional commas and declaration position', '.button:is(.a,.b), .btn {\n padding:0;\n}',
        rows => assert.equal(rows[0].line, 2));
    assert.ok(exception('scss/easyedu/components/_buttons.scss'));
    assert.ok(exception('styles/student-management.css'));
    assert.ok(exception('easyedu-guide-kit/scss/_guide.scss'));
    assert.equal(exception('local/course_banner_builder/scss/_controls.scss').id, 'E05');
    assert.equal(exception('local_course_banner_builder/styles.scss').id, 'E05');
    assert.deepEqual(walk(path.resolve('not-present', 'course_banner_builder')).files, []);
    assert.equal(exception('scss/components/_buttons.scss'), undefined);
    assert.throws(() => syntax.parse('.btn { color: red;'));
    process.stdout.write('PASS Kit single-source parser: ' + checks.length +
        ' fixture contracts, indirect mixin, invalid syntax and 7 exclusion checks (CCB never traversed).\n');
}

function collectMixins(source, root, syntax, postcss) {
    const texts = {};
    const localMixins = {};
    const mixinEdges = [];
    for (const file of source.files) {
        texts[file] = fs.readFileSync(path.join(root, file), 'utf8');
        try {
            syntax.parse(texts[file], {from: file}).walkAtRules('include', include => {
                const name = include.params.split(/[\s(]/)[0];
                const context = selectorFor(include, postcss);
                const matching = FAMILIES.filter(([, , pattern]) => pattern.test(context.selector)).map(([id]) => id);
                localMixins[name] = [...new Set([...(localMixins[name] || []), ...matching])];
                for (const owner of context.mixins) {
                    mixinEdges.push({owner: owner.replace(/^@mixin\s+/, '').split(/[\s(]/)[0], name});
                }
            });
        } catch (error) {
            // The actual scan below records the parse error once with its file.
        }
    }
    // Bounded monotonic propagation, including transitive locally named includes.
    for (let pass = 0; pass <= mixinEdges.length; pass++) {
        let changed = false;
        for (const edge of mixinEdges) {
            const previous = localMixins[edge.name] || [];
            const next = [...new Set([...previous, ...(localMixins[edge.owner] || [])])];
            if (next.length !== previous.length) {
                changed = true;
                localMixins[edge.name] = next;
            }
        }
        if (!changed) {
            break;
        }
    }
    return {texts, localMixins};
}

function main() {
    assertNode();
    const options = {};
    for (let index = 2; index < process.argv.length; index++) {
        const key = process.argv[index];
        if (key === '--self-test') {
            options.selfTest = true;
        } else if (['--root', '--modules', '--json', '--text'].includes(key) && process.argv[index + 1]) {
            options[key.slice(2)] = process.argv[++index];
        } else {
            throw new Error('Usage: node test-kit-single-source.cjs [--root absolu] [--modules node_modules absolu] ' +
                '[--json sortie] [--text sortie] [--self-test]');
        }
    }
    for (const name of ['root', 'modules', 'json', 'text']) {
        if (options[name] && !path.isAbsolute(options[name])) {
            throw new Error('--' + name + ' exige un chemin absolu.');
        }
    }
    if (options.json && path.extname(options.json) !== '.json') {
        throw new Error('--json exige une sortie .json, jamais une source SCSS/CSS.');
    }
    if (options.text && path.extname(options.text) !== '.txt') {
        throw new Error('--text exige une sortie .txt, jamais une source SCSS/CSS.');
    }
    const syntax = parser(options.modules);
    const postcss = require(require.resolve('postcss', {
        paths: [path.resolve(__dirname, '../..'), options.modules].filter(Boolean),
    }));
    if (options.selfTest) {
        selfTest(syntax, postcss);
        return;
    }
    const root = options.root || path.resolve(__dirname, '../..');
    const source = walk(root);
    const findings = [];
    const parseErrors = [];
    const hashes = {};
    const {texts, localMixins} = collectMixins(source, root, syntax, postcss);
    for (const file of source.files) {
        const text = texts[file];
        hashes[file] = crypto.createHash('sha256').update(text).digest('hex');
        try {
            findings.push(...scanText(text, file, syntax, postcss, localMixins));
        } catch (error) {
            parseErrors.push({file, message: error.reason || error.message, line: error.line || null});
        }
    }
    const families = FAMILIES.map(([id, name]) => ({
        id, name, declarations: findings.filter(row => row.families.includes(id)).length,
    }));
    const report = {
        schemaVersion: 1, mode: 'report-only', exitOnFindings: 0, root, node: process.version,
        inventoryReference: 'STANDARDISATION/INVENTAIRE-CONTROLES-2026-10-17.md (F01–F22) + couverture demandée F23–F26',
        exceptions: EXCEPTIONS, sourceFiles: source.files, skipped: source.skipped, hashes,
        summary: {files: source.files.length, declarations: findings.length, parseErrors: parseErrors.length},
        families, parseErrors, findings, localMixinFamilies: localMixins,
        limits: [
            'Reconnaissance lexicale des familles : candidats qui se recouvrent, pas un verdict CSS calculé.',
            'Pas de compilation Sass, expansion de mixin, résolution de variable ou de cascade/imports ; ' +
                'les partiels morts restent visibles.',
            'Les includes locaux littéraux propagent les familles ; includes/noms interpolés non évalués.',
            'Nesting littéral développé au maximum 256 combinaisons, interpolation Sass marquée dynamique.',
            'Affectations de custom properties, styles PHP/markup/JS et composants générés à l’exécution hors périmètre.',
            'Une déclaration utilisant un jeton Kit reste locale ; aucune exception automatique pour var() ou @media.',
        ],
    };
    const readable = [
        'Kit unique — RAPPORT SEULEMENT : ' + findings.length + ' déclarations candidates, ' + source.files.length +
            ' sources, ' + parseErrors.length + ' erreurs de lecture.',
        ...families.map(family => family.id + ' ' + family.name + ': ' + family.declarations),
        ...findings.map(row => row.file + ':' + row.line + ' [' + row.families.join(',') + '] ' + row.selector +
            ' | ' + row.property + ': ' + row.value + (row.important ? ' !important' : '')),
        ...parseErrors.map(error => 'LECTURE ' + error.file + ':' + error.line + ' ' + error.message),
    ].join('\n') + '\n';
    if (options.json) {
        fs.writeFileSync(options.json, JSON.stringify(report, null, 2) + '\n');
        process.stdout.write(readable);
    } else {
        process.stdout.write(JSON.stringify(report, null, 2) + '\n');
        process.stderr.write(readable);
    }
    if (options.text) {
        fs.writeFileSync(options.text, readable);
    }
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        process.stderr.write(error.message + '\n');
        process.exitCode = 2;
    }
}

module.exports = {EXCEPTIONS, FAMILIES, exception, scanText, selectorFor};
