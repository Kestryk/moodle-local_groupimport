/* eslint-env node */
'use strict';

// Generalized from local_groupimport/tools/release/test-kit-single-source.cjs.
// A finding is source evidence for review, never a claim of a rendered visual defect.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const SCHEMA = 1;
const ENGINE = '1.0.1';
const slash = value => value.split(path.sep).join('/');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const normalize = text => text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const digest = text => hash(normalize(text));
const SKIP = new Set(['.git', 'node_modules', 'vendor', 'tests', 'testing', 'tools', 'scripts', 'docs',
    'easyedu-kit-docs', 'screenshots', 'captures', 'fixtures', 'examples']);
const MIRRORS = ['scss/easyedu/', 'easyedu-guide-kit/', 'easyedu-motion-kit/', 'easyedu-navigation-kit/'];
const PROPERTY = /^(?:(?:min-|max-)?(?:height|block-size)|padding(?:-.+)?|border(?:-.+)?|font(?:-.+)?|line-height|background(?:-.+)?|color|fill|stroke|box-shadow|outline(?:-.+)?|transition(?:-.+)?|animation(?:-.+)?)$/i;
// The family vocabulary and literal-nesting resolution come from the original scanner.
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



function resolveInside(root, relative) {
    root = path.resolve(root);
    if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) {
        throw new Error('Expected a repository-relative path without parent traversal');
    }
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(root + path.sep)) { throw new Error('Path outside the plugin root'); }
    let cursor = absolute;
    while (cursor !== root) {
        if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) {
            throw new Error('Symlink/junction is not an audit source: ' + relative);
        }
        cursor = path.dirname(cursor);
    }
    return absolute;
}

function readJson(file, fallback) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')) : fallback;
}

function dependencies(modules) {
    const search = [modules, process.cwd(), path.resolve(__dirname, '../..')].filter(Boolean);
    const load = name => {
        try { return require(require.resolve(name, {paths: search})); }
        catch (error) { throw new Error(name + ' is required; pass --modules ABSOLUTE_NODE_MODULES'); }
    };
    return {syntax: load('postcss-scss'), postcss: load('postcss')};
}

// Preserve literal strings and line positions. This avoids matching commented-out code.
// It is deliberately lexical; PHP/JS runtime-generated markup needs a separate browser audit.
function withoutComments(text) {
    let result = '', quote = '', line = false, block = false, escaped = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i], next = text[i + 1];
        if (line) {
            if (char === '\n') { line = false; result += char; } else { result += ' '; }
        } else if (block) {
            if (char === '*' && next === '/') { result += '  '; i++; block = false; }
            else { result += char === '\n' ? '\n' : ' '; }
        } else if (quote) {
            result += char;
            if (escaped) { escaped = false; }
            else if (char === '\\') { escaped = true; }
            else if (char === quote) { quote = ''; }
        } else if (char === '"' || char === "'" || char === '`') { quote = char; result += char; }
        else if (char === '/' && next === '/') { line = true; result += '  '; i++; }
        else if (char === '/' && next === '*') { block = true; result += '  '; i++; }
        else { result += char; }
    }
    return result.replace(/\{\{![\s\S]*?\}\}|<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, ' '));
}

function inventory(root) {
    const product = [], mirror = [], excluded = [];
    const visit = relative => {
        const absolute = relative ? resolveInside(root, relative) : root;
        for (const entry of fs.readdirSync(absolute, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
            const file = (relative ? relative + '/' : '') + entry.name;
            if (entry.isSymbolicLink()) { excluded.push({file, reason: 'symlink'}); continue; }
            if (file === 'amd/build' || file.startsWith('amd/build/')) {
                excluded.push({file, reason: 'generated AMD; never traversed'}); continue;
            }
            const isMirror = MIRRORS.some(prefix => (file + '/').startsWith(prefix));
            if (entry.isDirectory()) {
                if (!isMirror && (SKIP.has(entry.name) || file === 'styles' || entry.name.startsWith('.'))) {
                    excluded.push({file, reason: 'non-product or generated tree'});
                } else { visit(file); }
            } else if (entry.isFile() && !/\.secret\.|credentials|auth\.json/i.test(entry.name)) {
                if (isMirror && /\.(?:scss|css|js|mustache)$/i.test(file) && !file.endsWith('.min.js')) { mirror.push(file); }
                else if (/\.(?:scss|css|php|mustache|js)$/i.test(file) && !file.endsWith('.min.js')) { product.push(file); }
            }
        }
    };
    visit('');
    return {product, mirror, excluded};
}

function finding(rule, file, line, details) {
    const identity = {rule, file, ...details};
    // Location is intentionally excluded: inserting a comment must not create a new debt item.
    return {rule, file, line, ...details, fingerprint: hash(JSON.stringify(identity))};
}

function familiesFor(selector) {
    return FAMILIES.filter(([, , pattern]) => pattern.test(selector)).map(([id]) => id);
}

function scanStyles(text, file, syntax, postcss, authority = null) {
    text=normalize(text);
    const tree = syntax.parse(text, {from: file});
    const findings = [], calls = [];
    tree.walkAtRules('include', include => {
        if (/^[\w-]+\.[\w-]+/.test(include.params)) {
            const call=include.params.split(/[\s(]/)[0];
            const [namespace,name]=call.split('.');
            const verified=authority ? authority.namespaces.has(namespace)&&authority.mixins.has(name) : null;
            calls.push({file, line: include.source.start.line, call, verified});
            if(verified===false){findings.push(finding('R1',file,include.source.start.line,
                {kind:'unverified-mixin-call',call}));}
        }
    });
    tree.walkDecls(decl => {
        const context = selectorFor(decl, postcss);
        const target = context.selector + ' ' + context.mixins.join(' ');
        const details = {selector: context.selector, property: decl.prop, value: decl.value,
            important: Boolean(decl.important), families: familiesFor(target),
            conditions: []};
        for (let owner = decl.parent; owner; owner = owner.parent) {
            if (owner.type === 'atrule' && owner.name !== 'mixin') {
                details.conditions.unshift('@' + owner.name + ' ' + owner.params);
            }
        }
        if (!decl.prop.startsWith('--') && PROPERTY.test(decl.prop)) {
            const rule = /\.(?:local-[\w-]+|easyexam|easystud|ccb)[\w-]*/.test(target) && details.families.length ? 'R4' : 'R1';
            findings.push(finding(rule, file, decl.source.start.line, details));
        }
        if (file === 'styles.css') {
            findings.push(finding('R6', file, decl.source.start.line, details));
        }
        const literal = /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b|\b(?:rgb|rgba|hsl|hsla)\([^)]*\)|(?<![\w-])(?:\d*\.)?\d+(?:ms|s)\b/gi;
        for (const match of decl.value.matchAll(literal)) {
            findings.push(finding('R2', file, decl.source.start.line,
                {selector: context.selector, property: decl.prop, literal: match[0]}));
        }
    });
    return {findings, calls};
}

function scanCode(text, file, kitClasses) {
    const clean = withoutComments(normalize(text)), findings = [];
    const line = offset => clean.slice(0, offset).split('\n').length;
    const recordMatches = (regex, inspect) => {
        for (const match of clean.matchAll(regex)) { inspect(match, line(match.index)); }
    };
    recordMatches(/#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b|\b(?:rgb|rgba|hsl|hsla)\([^\n)]*\)|(?<![\w-])(?:\d*\.)?\d+(?:ms|s)\b/gi,
        (match, row) => findings.push(finding('R2', file, row, {literal: match[0]})));
    recordMatches(/\b(?:duration|transitionDuration|animationDuration)\s*[:=]\s*(\d+(?:\.\d+)?)/g,
        (match, row) => findings.push(finding('R2', file, row, {property: 'duration', literal: match[1]})));
    recordMatches(/\bjs_init_code\s*\(/g, (match, row) => findings.push(finding('R3', file, row, {kind: 'js_init_code'})));
    recordMatches(/\b(?:window\.)?confirm\s*\(/g, (match, row) => {
        if (file.endsWith('.js') || match[0].startsWith('window.')) {
            findings.push(finding('R3', file, row, {kind: 'native-confirm'}));
        }
    });
    recordMatches(/\bhtml_writer\s*::\s*select\s*\(/g,
        (match, row) => findings.push(finding('R3', file, row, {kind: 'native-select-needs-adapter-proof'})));
    recordMatches(/\bstyle\s*=\s*["']|["']style["']\s*=>/g,
        (match, row) => findings.push(finding('R3', file, row, {kind: 'inline-style'})));
    if(file.endsWith('.js')){
        recordMatches(/\.style\.(color|background(?:Color)?|border(?:Color|Radius|Width)?|padding(?:Top|Right|Bottom|Left)?|height|font(?:Size|Weight|Family)?)\s*=/g,
            (match,row)=>findings.push(finding('R1',file,row,{kind:'direct-dom-paint',property:match[1]})));
    }
    const classes = (value, row) => {
        const tokens = value.split(/\s+/).filter(Boolean);
        const legacy = tokens.filter(token => /^(?:btn(?:-[\w-]+)?|form-control|custom-select|generaltable|badge(?:-[\w-]+)?|card)$/.test(token));
        // A made-up easyedu-* class is not proof of a call to a reviewed definition.
        const shared = tokens.filter(token => kitClasses.has(token));
        const unadapted=legacy.filter(token=>{
            const family=token.startsWith('btn')?/button|action|control|trigger|toggle|close|nav/:
                token==='form-control'?/field|input|search|select|choice|textarea/:
                token==='custom-select'?/select|choice/:token==='generaltable'?/table/:
                token==='card'?/card|panel|tile|dialog/:/badge|tag|pill|token|status|count/;
            return !shared.some(name=>family.test(name));
        });
        if (unadapted.length) {
            findings.push(finding('R3', file, row, {kind: 'native-class-without-kit-call', classes: unadapted.sort()}));
        }
    };
    recordMatches(/\bclass\s*=\s*(["'])(.*?)\1/gs, (match, row) => classes(match[2], row));
    if (file.endsWith('.php')) {
        recordMatches(/["']class["']\s*=>\s*(["'])(.*?)\1/gs, (match, row) => classes(match[2], row));
    }
    return findings;
}

function normalizedAsset(text, transform = {}) {
    let result = normalize(text);
    if (Object.keys(transform).some(key => !['component','suffix'].includes(key)) ||
        (transform.component && !/^[a-z][a-z0-9]*_[a-z][a-z0-9_]*$/.test(transform.component)) ||
        (transform.suffix && transform.suffix !== '-lazy')) { throw new Error('Invalid module namespace adaptation'); }
    if (transform.component) {
        const prefix = transform.component + '/';
        result = result.replace(new RegExp(`(['"])${prefix}([^'"\\r\\n]+)\\1`, 'g'),
            (match, quote, name) => quote + 'easyedu_ui_kit/' + name + quote);
        result = result.replace(new RegExp(`(@(?:module|template)\\s+)${prefix}`, 'g'),'$1easyedu_ui_kit/');
    }
    if (transform.suffix) {
        result = result.replace(/(['"])(\.\/|easyedu_ui_kit\/)([a-zA-Z0-9_/-]+)-lazy\1/g,
            (match, quote, prefix, name) => quote + prefix + name + quote)
            .replace(/(@module\s+easyedu_ui_kit\/[\w/-]+)-lazy(?=\s|$)/g,'$1');
    }
    return result;
}

function verifyMirror(root, files, lock, kitRoot) {
    const findings = [], kitClasses = new Set(), covered = new Set(), verifiedPaths=new Set(), mixins=new Set();
    if (!lock) {
        findings.push(finding('R5', 'tools/kit/kit-source-lock.json', 1, {kind: 'missing-reviewed-source-lock'}));
        lock = {schemaVersion: SCHEMA, files: []};
    }
    if (lock.schemaVersion !== SCHEMA || !Array.isArray(lock.files)) { throw new Error('Invalid source lock schema'); }
    if (lock.files.length && !/^[a-f\d]{40}$/.test(lock.revision || '')) { throw new Error('Source lock requires a canonical Git revision'); }
    for (const asset of lock.files) {
        const absolute = resolveInside(root, asset.target);
        resolveInside(kitRoot || root, asset.source);
        if (!/\.(?:scss|css|js|mustache)$/.test(asset.target)) { throw new Error('Locked asset must be a component source'); }
        if (!/^[a-f\d]{64}$/.test(asset.sha256 || '')) { throw new Error('Invalid canonical asset hash'); }
        if (covered.has(asset.target)) { throw new Error('Duplicate locked asset'); }
        covered.add(asset.target);
        if (asset.target.startsWith('amd/build/')) { throw new Error('Compiled AMD cannot be a source audit input'); }
        if (!fs.existsSync(absolute)) {
            findings.push(finding('R5', asset.target, 1, {kind: 'missing-asset'})); continue;
        }
        const text = normalizedAsset(fs.readFileSync(absolute, 'utf8'), asset.transform);
        if (hash(text) !== asset.sha256) {
            findings.push(finding('R5', asset.target, 1, {kind: 'mirror-drift', expected: asset.sha256, actual: hash(text)}));
        } else {
            verifiedPaths.add(asset.target);
            const declarations=withoutComments(text);
            for (const match of declarations.matchAll(/\.((?:easyedu|foundation)-[\w-]+)/g)) { kitClasses.add(match[1]); }
            for (const match of declarations.matchAll(/@mixin\s+([\w-]+)/g)) { mixins.add(match[1]); }
        }
        if (kitRoot) {
            let canonical=null;
            try{canonical=execFileSync('git',['show',lock.revision+':'+asset.source],
                {cwd:kitRoot,encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(error){/* Report unavailable provenance below. */}
            if (canonical===null || digest(canonical) !== asset.sha256) {
                findings.push(finding('R5', asset.target, 1, {kind: 'lock-canonical-mismatch'}));
            }
        }
    }
    for (const file of new Set([...files, ...(lock.unverified || []).map(item=>item.target)])) {
        if (!covered.has(file)) {
            if (!/\.(?:scss|css|js|mustache)$/.test(file)) { throw new Error('Unverified asset must be a component source'); }
            if (file.startsWith('amd/build/')) { throw new Error('Compiled AMD cannot be a source audit input'); }
            const absolute = resolveInside(root,file);
            findings.push(finding('R5', file, 1, {kind: 'unverified-mirror-source',
                actual: fs.existsSync(absolute) ? digest(fs.readFileSync(absolute,'utf8')) : 'missing'}));
        }
    }
    return {findings, kitClasses,verifiedPaths,mixins};
}

function importedNamespaces(text,file,root,verifiedPaths){
    const namespaces=new Set();
    for(const match of withoutComments(text).matchAll(/@use\s+["']([^"']+)["'](?:\s+as\s+([\w-]+))?/g)){
        const request=match[1];
        if(request.startsWith('sass:')){continue;}
        const alias=match[2]||path.basename(request).replace(/^_/, '');
        const bases=[path.resolve(root,path.dirname(file),request),path.resolve(root,'scss',request)];
        for(const base of bases){
            for(const candidate of [base,base+'.scss',path.join(path.dirname(base),'_'+path.basename(base)+'.scss'),
                path.join(base,'_index.scss')]){
                if(verifiedPaths.has(slash(path.relative(root,candidate)))){namespaces.add(alias);}
            }
        }
    }
    return namespaces;
}

function validateExceptions(document, now) {
    if (!document || document.schemaVersion !== SCHEMA || !Array.isArray(document.exceptions)) {
        throw new Error('Invalid exception document');
    }
    const ids = new Set();
    for (const item of document.exceptions) {
        if (!/^[A-Z][A-Z\d_-]+$/.test(item.id || '') || ids.has(item.id) || !/^R[1-6]$/.test(item.rule || '') ||
            !item.file || /[*?]/.test(item.file) || !/^[a-f\d]{64}$/.test(item.fingerprint || '') ||
            !item.reason || item.approval?.by !== 'Kevin' || !item.approval.reference ||
            !/^\d{4}-\d{2}-\d{2}$/.test(item.approval.date || '') || !/^\d{4}-\d{2}-\d{2}$/.test(item.expires || '')) {
            throw new Error('Each exception requires a unique name, exact finding, reason, expiry and Kevin decision reference');
        }
        ids.add(item.id);
        if (!Number.isFinite(Date.parse(item.expires)) || !Number.isFinite(Date.parse(item.approval.date)) ||
            new Date(item.expires).toISOString().slice(0,10) !== item.expires ||
            new Date(item.approval.date).toISOString().slice(0,10) !== item.approval.date ||
            item.approval.date > item.expires || item.approval.date > now) { throw new Error('Invalid exception dates'); }
    }
    return document.exceptions;
}

function baselineCounts(document, scope) {
    if (!document) { return new Map(); }
    if (document.schemaVersion !== SCHEMA || document.engine !== ENGINE || document.scope !== scope ||
        !Array.isArray(document.findings)) { throw new Error('Baseline engine/scope mismatch'); }
    const counts = new Map();
    for (const row of document.findings) {
        if (!/^[a-f\d]{64}$/.test(row.fingerprint || '') || !Number.isSafeInteger(row.count) || row.count < 1 ||
            counts.has(row.fingerprint)) { throw new Error('Invalid baseline item'); }
        counts.set(row.fingerprint, row.count);
    }
    return counts;
}

function audit(options) {
    const root = fs.realpathSync(options.root);
    const version = resolveInside(root,'version.php');
    if (!fs.existsSync(version) || !/\$plugin->component\s*=/.test(fs.readFileSync(version,'utf8'))) {
        throw new Error('Audit root must be a Moodle plugin, not a Moodle installation or credentials directory');
    }
    const {syntax, postcss} = dependencies(options.modules);
    const files = inventory(root);
    const included = (options.include || []).slice().sort();
    included.forEach(file => resolveInside(root, file));
    const scope = included.length ? included.join('|') : 'product';
    const selected = included.length ? files.product.filter(file => included.includes(file)) : files.product;
    if (included.some(file => !selected.includes(file))) { throw new Error('Included source missing or excluded by inventory'); }
    const sourceLock = readJson(resolveInside(root, 'tools/kit/kit-source-lock.json'), null);
    const mirror = verifyMirror(root, files.mirror, sourceLock, options.kitRoot);
    // A file-scope run is explicit in every report and does not claim global integrity coverage.
    const findings = included.length ? [] : mirror.findings.slice();
    const calls = [], errors = [];
    for (const file of selected) {
        try {
            const text = fs.readFileSync(resolveInside(root, file), 'utf8');
            if (/\.(?:css|scss)$/.test(file)) {
                const scan = scanStyles(text, file, syntax, postcss,{mixins:mirror.mixins,
                    namespaces:importedNamespaces(text,file,root,mirror.verifiedPaths)});
                findings.push(...scan.findings); calls.push(...scan.calls.filter(call=>call.verified));
            } else { findings.push(...scanCode(text, file, mirror.kitClasses)); }
        } catch (error) { errors.push({file, reason: error.reason || error.message}); }
    }
    const date = options.today || new Date().toISOString().slice(0, 10);
    const exceptions = validateExceptions(readJson(resolveInside(root, 'kit-guard-exceptions.json'),
        {schemaVersion: SCHEMA, exceptions: []}), date);
    const approved = [], active = [], used = new Set();
    for (const row of findings) {
        const permit = exceptions.find(item => item.rule === row.rule && item.file === row.file &&
            item.fingerprint === row.fingerprint && item.expires >= date);
        if (permit) { approved.push({...row, exception: permit.id}); used.add(permit.id); }
        else { active.push(row); }
    }
    const baselinePath = options.baseline || path.join(root, 'kit-guard-baseline.json');
    const baseline = readJson(baselinePath, null);
    const previous = baselineCounts(baseline, scope), consumed = new Map();
    const newFindings = [], known = [];
    for (const row of active) {
        const count = (consumed.get(row.fingerprint) || 0) + 1;
        consumed.set(row.fingerprint, count);
        (count <= (previous.get(row.fingerprint) || 0) ? known : newFindings).push(row);
    }
    if (options.mode === 'new' && !baseline) { errors.push({file: 'kit-guard-baseline.json', reason: 'A reviewed baseline is required in new mode'}); }
    const mode = options.mode || 'report';
    const violation = mode === 'new' ? newFindings.length > 0 : active.length > 0;
    const exitCode = errors.length ? 2 : mode === 'report' ? 0 : violation ? 1 : 0;
    return {schemaVersion: SCHEMA, engine: ENGINE, mode, root, scope,
        coverage: {files: selected.length, mirrorChecked: included.length === 0,
            excluded: files.excluded, lexicalLimitations: ['dynamic markup and ancestor composition need browser review',
                'source lock changes and claimed human exception approvals require PR review']},
        findings: active, approved, known, newFindings, calls, errors,
        expiredExceptions: exceptions.filter(item => item.expires < date).map(item => item.id),
        unusedExceptions: exceptions.filter(item => !used.has(item.id)).map(item => item.id),
        summary: {active: active.length, approved: approved.length, known: known.length,
            new: newFindings.length, kitCalls: calls.length, errors: errors.length,
            byRule: Object.fromEntries(['R1','R2','R3','R4','R5','R6'].map(rule=>[rule,active.filter(row=>row.rule===rule).length]))},
        verdict: errors.length ? 'ERROR' : violation ? 'FAIL' : 'PASS', exitCode};
}

function makeBaseline(report) {
    const counts = new Map();
    report.findings.forEach(row => counts.set(row.fingerprint, (counts.get(row.fingerprint) || 0) + 1));
    return {schemaVersion: SCHEMA, engine: ENGINE, scope: report.scope,
        note: 'Observed debt, not a waiver or approval. Findings remain visible. Review updates separately.',
        findings: [...counts].sort(([a],[b])=>a.localeCompare(b)).map(([fingerprint,count])=>({fingerprint,count}))};
}

function cli(args) {
    const options = {root: path.resolve(__dirname, path.basename(__dirname) === 'scripts' ? '..' : '../..'), mode: 'report', include: []};
    for (let i = 0; i < args.length; i++) {
        const key = args[i];
        if (key === '--fail-on-new') { options.mode = 'new'; }
        else if (key === '--zero') { options.mode = 'zero'; }
        else if (key === '--update-baseline') { options.updateBaseline = true; }
        else if (['--root','--modules','--kit-root','--baseline','--json','--include','--mode'].includes(key) && args[i+1]) {
            const value = args[++i];
            if (key === '--include') { options.include.push(value); }
            else { options[key.slice(2).replace('-r','R')] = value; }
        } else { throw new Error('Unknown argument: ' + key); }
    }
    if (!['report','new','zero'].includes(options.mode)) { throw new Error('Mode must be report, new or zero'); }
    for (const key of ['root','modules','kitRoot','baseline','json']) {
        if (options[key] && !path.isAbsolute(options[key])) { throw new Error('--' + key + ' requires an absolute path'); }
    }
    if (options.updateBaseline && options.mode !== 'report') { throw new Error('Baseline updates require explicit report mode'); }
    const report = audit(options);
    if (options.json && path.resolve(options.json).startsWith(path.resolve(options.root) + path.sep)) {
        throw new Error('JSON evidence must stay outside the audited source root');
    }
    const outputs = [];
    if (options.updateBaseline && !report.errors.length) {
        outputs.push([options.baseline || path.join(options.root,'kit-guard-baseline.json'), makeBaseline(report)]);
    }
    if (options.json) { outputs.push([options.json, report]); }
    for (const [file, data] of outputs) {
        if (!file.endsWith('.json') || file.includes(path.sep + 'amd' + path.sep + 'build' + path.sep)) {
            throw new Error('Output must be a JSON report outside generated AMD');
        }
        // Reports cannot overwrite source locks, exception approvals or a different input.
        if (['kit-source-lock.json','kit-guard-exceptions.json','package.json','easyedu-source.json','kit-guard.json'].includes(path.basename(file)) ||
            (file === options.json && path.resolve(file) === path.resolve(options.baseline || path.join(options.root,'kit-guard-baseline.json')))) {
            throw new Error('Refusing to overwrite a protected input');
        }
        fs.mkdirSync(path.dirname(file),{recursive:true});
        fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
    }
    console.log(JSON.stringify({mode:report.mode,verdict:report.verdict,exitCode:report.exitCode,scope:report.scope,...report.summary}));
    return report.exitCode;
}

module.exports = {audit,cli,scanStyles,scanCode,withoutComments,normalizedAsset,makeBaseline,validateExceptions,
    verifyMirror,inventory,resolveInside,digest,ENGINE,SCHEMA};
if (require.main === module) {
    try { process.exitCode = cli(process.argv.slice(2)); }
    catch (error) { console.error('Kit calls: ' + error.message); process.exitCode = 2; }
}
