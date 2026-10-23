/* eslint-env node */
'use strict';
/*
 * Marketplace packaging step: neutralise internal-process references left in
 * source comments (lot ids such as K16-70, "Penpot", "Kevin <date>", internal
 * dates) WITHOUT touching a single byte of functional code. This NEVER runs
 * against the working tree: it reads an existing directory tree (normally a
 * throwaway copy of the files `package-plugin.cjs` is about to zip) and
 * writes a sanitised mirror to a separate OUTPUT directory. The dev repo and
 * the canonical Kit (C:\dev\easyedu-ui-kit) are never touched.
 *
 * Context: CODEREVIEW-11BIS-20261023.md, section 5, Option A. Kevin's ruling
 * (23/10/2026): comments that stay in the embedded Kit copy must explain the
 * LOCAL component only (usage, classes, properties) - no system/project name,
 * no design-tool name, no internal lot id, no internal method, no date of an
 * internal review. The code itself (selectors, classes, logic) is untouched;
 * only non-functional comment text is rewritten.
 *
 * Integration point in the existing pipeline (NOT wired by this file - see
 * RAPPORT-KIT-PACKAGING-SANITIZE-20261023.md for why):
 *   1. `package-plugin.cjs` computes `files` (the exact relative paths that
 *      will go in the ZIP) from `git ls-files` + its own `included()` filter,
 *      and asserts the working tree is clean for those paths.
 *   2. Right after that assert (before the `for (const file of files)` zip
 *      loop), run:
 *        node tools/release/sanitize-public-package.cjs <root> <tmpDir>
 *      which copies exactly those `files` into <tmpDir> with comments
 *      rewritten.
 *   3. Change the single line `const source = path.join(root, file);`
 *      (package-plugin.cjs line ~50) to read from <tmpDir> instead of
 *      `root` for the byte content that gets zipped - the git/dirty checks
 *      and `files` list stay computed against the real working tree exactly
 *      as today.
 *
 * Usage: node sanitize-public-package.cjs SOURCE_DIR OUTPUT_DIR [--list-file=path]
 *   SOURCE_DIR  Absolute path to copy files FROM (plugin root or an export of it).
 *   OUTPUT_DIR  Absolute path to copy the sanitised mirror TO. Must not be
 *               inside SOURCE_DIR. Created if missing; must be empty or absent.
 *   --list-file Optional: a newline-separated list of repo-relative paths to
 *               process (e.g. the exact `git ls-files` output). Without it,
 *               the script walks SOURCE_DIR and applies the same tree/test
 *               exclusions as package-plugin.cjs's included() (kept in sync
 *               manually - see the comment next to EXCLUDED_PARTS below).
 */
const fs = require('node:fs');
const path = require('node:path');

const [, , sourceArg, outputArg, ...rest] = process.argv;
if (!sourceArg || !outputArg || !path.isAbsolute(sourceArg) || !path.isAbsolute(outputArg)) {
    console.error('Usage: node sanitize-public-package.cjs ABSOLUTE_SOURCE_DIR ABSOLUTE_OUTPUT_DIR [--list-file=path]');
    process.exit(1);
}
const SOURCE = path.resolve(sourceArg);
const OUTPUT = path.resolve(outputArg);
if (OUTPUT === SOURCE || OUTPUT.startsWith(SOURCE + path.sep)) {
    console.error('OUTPUT must not be inside SOURCE.');
    process.exit(1);
}
const listFileArg = rest.find(a => a.startsWith('--list-file='));

// Same tree allowlist as package-plugin.cjs (kept in sync manually; a drift
// here only means a file is copied through unsanitised or skipped, never
// that functional code is altered).
const TREES = new Set(['amd', 'classes', 'db', 'fonts', 'js', 'lang', 'pix', 'scss', 'styles', 'templates']);
const TOP_FILES = new Set(['LICENSE', 'README.md', 'CHANGELOG.md', 'styles.css']);
function isExcludedPath(relPath) {
    return /(?:^|[-_/])(tests?|fixtures?|sandbox|screenshots?|captures?)(?:[-_.\/]|$)/i.test(relPath) ||
        relPath.split('/').some(part => ['node_modules', 'vendor', '.git', 'tests', 'testing', 'fixtures', 'sandbox'].includes(part));
}
function isPackaged(relPath) {
    if (isExcludedPath(relPath)) return false;
    return relPath.includes('/') ? TREES.has(relPath.split('/')[0]) : TOP_FILES.has(relPath) || /^[a-z][a-z0-9_]*\.php$/.test(relPath);
}

function walk(dir, baseLen, out) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === '.git' || entry.name === 'node_modules') continue;
            walk(full, baseLen, out);
        } else if (entry.isFile()) {
            out.push(full.slice(baseLen).split(path.sep).join('/'));
        }
    }
    return out;
}

let relPaths;
if (listFileArg) {
    relPaths = fs.readFileSync(listFileArg.slice('--list-file='.length), 'utf8').split(/\r?\n/).filter(Boolean);
} else {
    relPaths = walk(SOURCE, SOURCE.length + 1, []).filter(isPackaged);
}

// File types whose comments may contain internal references worth
// neutralising. Everything else (images, fonts, json, LICENSE...) is
// copied through byte-for-byte.
// NOTE: this build's minifier preserves full JSDoc banners verbatim inside
// amd/build/*.min.js (confirmed 23/10/2026: e.g. easyedu_bubble.min.js still
// carries its "EasyEdu Kit" docblock). amd/build IS processed for that
// reason - it is not safe to assume "minified" means "no comments" here.
const COMMENT_EXTS = new Set(['.scss', '.js', '.php', '.mustache']);
function isCommentable(relPath) {
    return COMMENT_EXTS.has(path.extname(relPath));
}

// --- Redaction rules -------------------------------------------------
// Applied only to text that the line-classifier below has already decided
// is comment content (never to code). Order matters: more specific patterns
// first, generic word-level cleanup last.
const CLAUSE_RULES = [
    // Internal lot / audit identifiers: K16-70, C-G1, P-G1, Q17-T44...
    [/\(K\d{1,2}-\d{1,3}(?:\s*\/\s*K\d{1,2}-\d{1,3})*[^)]*\)/g, ''],
    [/\bK\d{1,2}-\d{1,3}\s*\/\s*K\d{1,2}-\d{1,3}\b/g, ''],
    [/\bK\d{1,2}-\d{1,3}\b/g, ''],
    [/\b[CP]-G\d{1,2}\b/g, ''],
    [/\bQ\d{1,2}-T\d{1,3}\b/g, ''],
    // Design-tool references, with or without a codename suffix.
    [/\(Penpot[^)]*\)/gi, ''],
    [/\bPENPOT-[A-Za-z0-9-]+\b/g, ''],
    [/\bPenpot\b/gi, ''],
    // Internal library name, in every spelling. Order: most specific first
    // so "easyedu-ui-kit" is removed whole before the generic \bkit\b pass.
    [/\beasyedu-ui-kit\b/gi, ''],
    [/\beasyedu\s+kit\b/gi, ''],
    // Internal attribution / review workflow mentions (never the GPL
    // @copyright header - that is filtered out by line classification below).
    [/\(Kevin[^)]*\)/g, ''],
    [/\bKevin'?s?\b,?/g, ''],
    [/\breported by\s*,?/gi, ''],
    // Bare internal dates (dd/mm or dd/mm/yyyy, or ISO yyyy-mm-dd) left
    // dangling after the above removals.
    [/,?\s*\b\d{2}\/\d{2}(?:\/\d{4})?\b/g, ''],
    [/,?\s*\b20\d{2}-\d{2}-\d{2}\b/g, ''],
    // Bare internal library word, last (after the compound forms above).
    [/\bKit\b/g, ''],
];

function cleanupPunctuation(text) {
    return text
        .replace(/\(\s*\)/g, '')
        .replace(/\[\s*\]/g, '')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/([,:;])\s*([,:;])/g, '$1')
        .replace(/^[\s,;:.-]+/, '')
        .replace(/[\s,;:-]+$/, (m) => (m.includes('*/') ? m : ''))
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function redact(commentText) {
    let out = commentText;
    for (const [pattern, replacement] of CLAUSE_RULES) out = out.replace(pattern, replacement);
    return cleanupPunctuation(out);
}

// Scans a line of code character by character, tracking single/double/
// template-literal string state (with backslash-escape handling), and
// returns the position of a `//` (or, if usesHash, a bare `#`) that lies
// outside any string - or -1 if none is found or the line's quoting is
// unbalanced (e.g. a string continues onto the next line), in which case
// splitting would be unsafe. Only used as a narrow, deliberately strict
// safety net for the common "statement; // trailing comment" shape; any
// line a tokenizer would disagree with is better left untouched than
// corrupted.
function findSafeTrailingCommentStart(line, usesHash) {
    let quote = null;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quote) {
            if (c === '\\') { i++; continue; }
            if (c === quote) quote = null;
            continue;
        }
        if (c === '\'' || c === '"' || c === '`') { quote = c; continue; }
        if (c === '/' && line[i + 1] === '/') return {index: i, marker: '//'};
        if (usesHash && c === '#' && line[i + 1] !== '!') return {index: i, marker: '#'};
    }
    return -1;
}

// --- Line classification ----------------------------------------------
// Conservative on purpose: a line is only ever rewritten when the WHOLE
// line (after trimming) is comment content. Any line where a comment marker
// shares a line with functional code is left completely untouched (and
// counted in `mixedLines` for the report) rather than risk corrupting code.
function sanitizeFile(relPath, text) {
    const ext = path.extname(relPath);
    const usesHash = ext === '.php';
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const lines = text.split(/\r\n|\n/);
    let inBlock = false;
    let blockHadCode = false;
    let inMustache = false;
    let changed = 0;
    let mixed = 0;
    const result = [];

    for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (inMustache) {
            const closeIdx = trimmed.indexOf('}}');
            const indentMatch = rawLine.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';
            if (closeIdx === -1) {
                const redacted = redact(trimmed);
                if (redacted !== trimmed) changed++;
                result.push(redacted ? indent + redacted : '');
                continue;
            }
            const before = trimmed.slice(0, closeIdx).replace(/--$/, '').trim();
            const after = trimmed.slice(closeIdx + 2);
            if (after.trim() !== '') {
                if (redact(before) !== before) mixed++;
                inMustache = false;
                result.push(rawLine);
                continue;
            }
            const redacted = redact(before);
            if (redacted !== before) changed++;
            inMustache = false;
            result.push((redacted ? indent + redacted + ' ' : indent) + '}}');
            continue;
        }
        if (inBlock) {
            const closeIdx = trimmed.indexOf('*/');
            if (closeIdx === -1) {
                // Pure continuation line of a block comment.
                if (/@copyright|@license/i.test(trimmed)) {
                    result.push(rawLine);
                    continue;
                }
                const indentMatch = rawLine.match(/^(\s*)/);
                const indent = indentMatch ? indentMatch[1] : '';
                const marker = trimmed.startsWith('*') ? '* ' : '';
                const body = trimmed.startsWith('*') ? trimmed.slice(1).trim() : trimmed;
                const redacted = redact(body);
                if (redacted !== body) changed++;
                result.push(redacted ? indent + marker + redacted : (marker ? indent + '*' : ''));
                continue;
            }
            // Block closes on this line.
            const before = trimmed.slice(0, closeIdx);
            const after = trimmed.slice(closeIdx + 2);
            if (after.trim() !== '') {
                // Code follows the closing marker on the same line: leave untouched.
                if (redact(before) !== before) mixed++;
                inBlock = false;
                result.push(rawLine);
                continue;
            }
            const indentMatch = rawLine.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';
            const marker = before.startsWith('*') ? '* ' : '';
            const body = before.startsWith('*') ? before.slice(1).trim() : before;
            const redacted = redact(body);
            if (redacted !== body) changed++;
            inBlock = false;
            result.push((redacted ? indent + marker + redacted + ' ' : indent) + '*/');
            continue;
        }

        if (trimmed === '') {
            result.push(rawLine);
            continue;
        }
        const indentMatch = rawLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';

        if (/^\/\/[#@]\s*source(?:Mapping|)URL=/.test(trimmed)) {
            // Magic directive comment (sourceMappingURL/sourceURL): exact
            // spelling matters to tooling, never a documentation reference.
            result.push(rawLine);
            continue;
        }
        if (trimmed.startsWith('//')) {
            const body = trimmed.slice(2).trim();
            const redacted = redact(body);
            if (redacted !== body) changed++;
            if (redacted === '') continue; // drop now-empty line comments
            result.push(indent + '// ' + redacted);
            continue;
        }
        if (usesHash && trimmed.startsWith('#') && !trimmed.startsWith('#!')) {
            const body = trimmed.slice(1).trim();
            const redacted = redact(body);
            if (redacted !== body) changed++;
            if (redacted === '') continue;
            result.push(indent + '# ' + redacted);
            continue;
        }
        if (trimmed.startsWith('{{!')) {
            const openLen = trimmed.startsWith('{{!--') ? 5 : 3;
            const closeIdx = trimmed.indexOf('}}', openLen);
            if (closeIdx === -1) {
                // Multi-line Mustache comment block: {{! ... spans lines ... }}
                inMustache = true;
                const body = trimmed.slice(openLen).trim();
                const redacted = redact(body);
                if (redacted !== body) changed++;
                result.push(redacted ? indent + '{{! ' + redacted : indent + '{{!');
                continue;
            }
            const after = trimmed.slice(closeIdx + 2);
            if (after.trim() !== '') {
                const inlineBefore = trimmed.slice(openLen, closeIdx).trim();
                if (redact(inlineBefore) !== inlineBefore) mixed++;
                result.push(rawLine);
                continue;
            }
            const inner = trimmed.slice(openLen, trimmed.slice(0, closeIdx).endsWith('--') ? closeIdx - 2 : closeIdx).trim();
            const redacted = redact(inner);
            if (redacted !== inner) changed++;
            if (redacted === '') continue;
            result.push(indent + '{{! ' + redacted + ' }}');
            continue;
        }
        if (trimmed.startsWith('/*')) {
            const closeIdx = trimmed.indexOf('*/', 2);
            if (closeIdx !== -1) {
                // Single-line block comment.
                const after = trimmed.slice(closeIdx + 2);
                if (after.trim() !== '') {
                    const inlineBody = trimmed.slice(2, closeIdx).trim();
                    if (redact(inlineBody) !== inlineBody) mixed++;
                    result.push(rawLine);
                    continue;
                }
                const body = trimmed.slice(2, closeIdx).trim();
                if (/@copyright|@license/i.test(body)) {
                    result.push(rawLine);
                    continue;
                }
                const redacted = redact(body);
                if (redacted !== body) changed++;
                result.push(redacted ? indent + '/* ' + redacted + ' */' : indent + '/**/');
                continue;
            }
            // Block opens here and continues past this line.
            inBlock = true;
            blockHadCode = false;
            const body = trimmed.slice(2).trim();
            const redacted = redact(body);
            if (redacted !== body) changed++;
            result.push(redacted ? indent + '/* ' + redacted : indent + '/*');
            continue;
        }
        // Code with a trailing `//` (or, in PHP, `#`) comment on the same
        // line: split off the comment only when a character-level scan
        // confirms the marker is not inside a string literal, then redact
        // only the comment half. Falls through to leaving the line
        // untouched whenever that cannot be confirmed safe.
        const splitIdx = findSafeTrailingCommentStart(rawLine, usesHash);
        if (splitIdx !== -1) {
            const code = rawLine.slice(0, splitIdx.index);
            const markerLen = splitIdx.marker.length;
            const body = rawLine.slice(splitIdx.index + markerLen).trim();
            const redacted = redact(body);
            if (redacted === body) {
                // Nothing to neutralise in this trailing comment: leave the
                // line exactly as written, whitespace included.
                result.push(rawLine);
                continue;
            }
            changed++;
            result.push(redacted ? code + splitIdx.marker + ' ' + redacted : code.replace(/\s+$/, ''));
            continue;
        }
        // Anything else: functional code (or a comment sharing the line
        // with code in a way we could not safely isolate).
        if (/\bK\d{1,2}-\d{1,3}\b|\bPenpot\b|\bKevin\b/i.test(trimmed)) mixed++;
        result.push(rawLine);
    }
    return {text: result.join(eol) + (text.endsWith(eol) ? '' : ''), changed, mixed};
}

// Source maps (amd/build/*.js.map) ship inside the ZIP (tree 'amd', no
// test/fixture exclusion applies) and embed the FULL, un-minified original
// source - comments included - verbatim in their `sourcesContent` array.
// Confirmed 23/10/2026: this is a bigger leak than the comments left in the
// .min.js files themselves, since it defeats sanitising those files unless
// the map is treated the same way. Mappings/sources/names are left exactly
// as generated (debugging support is unaffected); only the embedded source
// text is passed through the same comment sanitiser, as if it were the
// corresponding .js file.
function sanitizeMap(relPath, raw) {
    let map;
    try {
        map = JSON.parse(raw);
    } catch {
        return {ok: false, reason: 'invalid-json'}; // Flagged upstream, copied through untouched.
    }
    if (!Array.isArray(map.sourcesContent)) {
        return {ok: true, text: raw, changed: 0, mixed: 0, noop: true}; // Nothing embedded to sanitise.
    }
    let changed = 0, mixed = 0;
    map.sourcesContent = map.sourcesContent.map(src => {
        if (typeof src !== 'string') return src;
        const r = sanitizeFile(relPath.replace(/\.map$/, ''), src);
        changed += r.changed;
        mixed += r.mixed;
        return r.text;
    });
    return {ok: true, text: JSON.stringify(map), changed, mixed};
}

let filesWritten = 0, filesCopied = 0, totalChanges = 0, totalMixed = 0;
const mixedFiles = [];
for (const rel of relPaths) {
    const src = path.join(SOURCE, rel);
    if (!fs.existsSync(src) || !fs.lstatSync(src).isFile()) continue;
    const dest = path.join(OUTPUT, rel);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    if (rel.endsWith('.js.map')) {
        const result = sanitizeMap(rel, fs.readFileSync(src, 'utf8'));
        if (!result.ok) {
            // Could not parse as JSON: copy through unchanged and flag loudly
            // - do not guess at a hand-rolled JSON rewrite.
            fs.copyFileSync(src, dest);
            filesCopied++;
            mixedFiles.push({path: rel, mixed: 'map-not-json'});
            continue;
        }
        fs.writeFileSync(dest, result.text);
        result.noop ? filesCopied++ : filesWritten++;
        totalChanges += result.changed;
        if (result.mixed > 0) {
            totalMixed += result.mixed;
            mixedFiles.push({path: rel, mixed: result.mixed});
        }
        continue;
    }
    if (!isCommentable(rel)) {
        fs.copyFileSync(src, dest);
        filesCopied++;
        continue;
    }
    const original = fs.readFileSync(src, 'utf8');
    const {text, changed, mixed} = sanitizeFile(rel, original);
    fs.writeFileSync(dest, text);
    filesWritten++;
    totalChanges += changed;
    if (mixed > 0) {
        totalMixed += mixed;
        mixedFiles.push({path: rel, mixed});
    }
}

const report = {
    source: SOURCE, output: OUTPUT,
    filesConsidered: relPaths.length, filesSanitised: filesWritten, filesCopiedAsIs: filesCopied,
    commentLinesChanged: totalChanges,
    linesLeftUntouchedWithToken: totalMixed,
    filesWithUntouchedToken: mixedFiles,
};
fs.writeFileSync(path.join(OUTPUT, 'sanitize-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({passed: true, ...report, filesWithUntouchedToken: mixedFiles.length}));
