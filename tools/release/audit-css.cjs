'use strict';
/** T053: structural CSS accounting. No Sass/compiled product writes.
 * Duplicate-rule removal is only an upper bound until cascade order is proved.
 * Native coverage is conditional, never evidence that an unvisited rule is dead.
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function rules(css) {
    const result = [];
    // Balanced-block tokenizer, respecting strings/comments/parentheses.
    function walk(start, end, context) {
        let begin = start, quote = '', comment = false, parens = 0;
        for (let i = start; i < end; i++) {
            const c = css[i], next = css[i + 1];
            if (comment) { if (c === '*' && next === '/') { comment = false; i++; } continue; }
            if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
            if (c === '/' && next === '*') { comment = true; i++; continue; }
            if (c === '"' || c === "'") { quote = c; continue; }
            if (c === '(' || c === '[') parens++;
            if (c === ')' || c === ']') parens--;
            if (c === ';' && !parens) begin = i + 1;
            if (c !== '{' || parens) continue;
            let depth = 1, j = i + 1, q = '', cm = false;
            for (; j < end && depth; j++) {
                if (cm) { if (css[j] === '*' && css[j + 1] === '/') { cm = false; j++; } continue; }
                if (q) { if (css[j] === '\\') j++; else if (css[j] === q) q = ''; continue; }
                if (css[j] === '/' && css[j + 1] === '*') { cm = true; j++; continue; }
                if (css[j] === '"' || css[j] === "'") { q = css[j]; continue; }
                if (css[j] === '{') depth++;
                if (css[j] === '}') depth--;
            }
            if (depth) throw new Error('Unbalanced CSS block at ' + i);
            const prelude = css.slice(begin, i).replace(/\/\*[\s\S]*?\*\//g, '').trim();
            const body = css.slice(i + 1, j - 1);
            if (/^@(media|supports|layer|container|keyframes|-webkit-keyframes)\b/.test(prelude))
                walk(i + 1, j - 1, [...context, prelude]);
            else result.push({selector: prelude, body, context, start: begin, end: j,
                bytes: Buffer.byteLength(css.slice(begin, j))});
            begin = j; i = j - 1;
        }
    }
    walk(0, css.length, []);
    return result;
}
function analyse(css) {
    const list = rules(css), groups = new Map(), declarationGroups = new Map();
    // Do not collapse whitespace in quoted content/custom properties. Generated
    // blocks at the same context have stable formatting; only outer trim is safe.
    const normalize = text => text.trim();
    for (const rule of list) {
        const signature = JSON.stringify([rule.context, rule.selector, normalize(rule.body)]);
        if (!groups.has(signature)) groups.set(signature, []);
        groups.get(signature).push(rule);
        const declarations = JSON.stringify([rule.context, normalize(rule.body)]);
        if (!declarationGroups.has(declarations)) declarationGroups.set(declarations, []);
        declarationGroups.get(declarations).push(rule);
    }
    const duplicates = [...groups.values()].filter(g => g.length > 1).map(g => ({
        selector: g[0].selector, context: g[0].context, occurrences: g.length,
        removableBytesUpperBound: g.slice(0, -1).reduce((n, r) => n + r.bytes, 0),
        offsets: g.map(r => r.start), safety: 'cascade ordering must be checked; not approved deletion'}));
    const blocks = [...declarationGroups.values()].filter(g => g.length > 2 && g[0].body.length > 60)
        .map(g => ({selectors: g.map(r => r.selector), occurrences: g.length,
            declarationBytes: Buffer.byteLength(normalize(g[0].body)),
            factorisationBytesUpperBound: (g.length - 1) * Buffer.byteLength(normalize(g[0].body)),
            context: g[0].context})).sort((a, b) => b.factorisationBytesUpperBound - a.factorisationBytesUpperBound);
    const heavy = list.map(r => ({selector: r.selector, context: r.context, ruleBytes: r.bytes,
        selectorBytes: Buffer.byteLength(r.selector), declarationBytes: Buffer.byteLength(r.body),
        combinatorsApprox: (r.selector.match(/[>+~]|\s+(?=[.#\[])/g) || []).length}))
        .sort((a, b) => b.ruleBytes - a.ruleBytes).slice(0, 20);
    const families = {};
    for (const r of list) {
        const family = /guide/.test(r.selector) ? 'Guide' : /navigation/.test(r.selector) ? 'Navigation' :
            /easystud/.test(r.selector) ? 'Student Management' : /import/.test(r.selector) ? 'Mass Import' :
                /admin/.test(r.selector) ? 'Administration' : 'Common Kit / other';
        families[family] = (families[family] || 0) + r.bytes;
    }
    const selectorLists = list.map(r => ({selector: r.selector, selectorBytes: Buffer.byteLength(r.selector),
        context: r.context, commaCountApprox: (r.selector.match(/,/g) || []).length}))
        .sort((a, b) => b.selectorBytes - a.selectorBytes).slice(0, 20);
    return {bytes: Buffer.byteLength(css), gzipBytes: zlib.gzipSync(css).length,
        sha256: crypto.createHash('sha256').update(css).digest('hex'), rules: list.length,
        duplicateGroups: duplicates.length,
        duplicateBytesUpperBound: duplicates.reduce((n, d) => n + d.removableBytesUpperBound, 0),
        repeatedDeclarationGroups: blocks.length, largestFactorisationCandidates: blocks.slice(0, 20),
        heavySelectors: heavy, largestSelectorLists: selectorLists,
        familiesBySelectorHeuristic: families,
        familyAttributionCaveat: 'Selector-based byte buckets, not exact SCSS ownership or browser selector CPU cost.',
        duplicates, deadRulesConfirmed: 0,
        deadRuleReason: 'Unvisited UI, pseudo states, custom palette and responsive branches cannot be declared dead.'};
}
function unreferencedClassCandidates(css) {
    const files = cp.execFileSync('git', ['-C', root, 'ls-files', '*.php', 'amd/src/*.js',
        'amd/src/**/*.js', 'templates/*.mustache'], {encoding: 'utf8'}).trim().split(/\r?\n/)
        .filter(f => f && !/^tools\/|^lang\//.test(f));
    const haystack = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
    const candidates = rules(css).filter(r => !r.context.some(c => /keyframes/.test(c)) && !r.selector.startsWith('@'))
        .map(r => ({selector: r.selector, ruleBytes: r.bytes, classes: [...new Set(r.selector.match(/\.[a-zA-Z_][\w-]*/g) || [])]
            .map(c => c.slice(1)).filter(c => c.startsWith('easyedu-') || c.startsWith('local-groupimport-'))}))
        .filter(r => r.classes.length && r.classes.every(c => !haystack.includes(c)));
    return {filesScanned: files.length, candidates: candidates.length,
        candidateRuleBytesUpperBound: candidates.reduce((n, r) => n + r.ruleBytes, 0),
        caveat: 'Missing literal references do NOT imply dead CSS: dynamic names, core/vendored markup and other consumers excluded.',
        entries: candidates};
}
if (require.main === module) {
    if (process.argv.includes('--self-test')) {
        const r = analyse('@media (x) { .a { color: red; } .a { color: red; } } .b { content: "}"; }');
        assert.equal(r.rules, 3); assert.equal(r.duplicateGroups, 1);
        assert.equal(r.deadRulesConfirmed, 0); assert(r.duplicateBytesUpperBound > 0);
        assert.equal(analyse('.a {content:"x  y"} .a {content:"x y"}').duplicateGroups, 0);
        console.log(JSON.stringify({task: 'T053', selfTest: 'PASS', checks: 5}));
    } else {
        const fileArg = process.argv.indexOf('--file'), outArg = process.argv.indexOf('--output');
        const file = fileArg < 0 ? path.join(root, 'styles.css') : process.argv[fileArg + 1];
        const css = fs.readFileSync(file, 'utf8');
        const result = {task: 'T053', level: 'N0', file, ...analyse(css),
            unreferencedLiteralClassCandidates: unreferencedClassCandidates(css)};
        if (outArg >= 0) fs.writeFileSync(process.argv[outArg + 1], JSON.stringify(result, null, 2));
        console.log(JSON.stringify({...result, duplicates: undefined, heavySelectors: undefined,
            largestSelectorLists: undefined, largestFactorisationCandidates: undefined,
            unreferencedLiteralClassCandidates: {...result.unreferencedLiteralClassCandidates, entries: undefined}}));
    }
}
module.exports = {rules, analyse};
