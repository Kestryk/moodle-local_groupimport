#!/usr/bin/env node
'use strict';
/** T057: deterministic source audit, no Moodle bootstrap or product writes.
 * Findings are review candidates, not a complete linguistic/JS-parser proof.
 * Exit 1 in --strict mode on language errors; JS/case candidates stay warnings.
 */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const accents = {
    etudiant: 'étudiant', etudiants: 'étudiants', selection: 'sélection', selectionner: 'sélectionner',
    selectionne: 'sélectionné', selectionnes: 'sélectionnés', creer: 'créer', cree: 'créé',
    parametre: 'paramètre', parametres: 'paramètres', previsualisation: 'prévisualisation',
    donnees: 'données', echec: 'échec', reinitialiser: 'réinitialiser', telecharger: 'télécharger',
    deplacer: 'déplacer', deplace: 'déplacé', element: 'élément', elements: 'éléments',
    resume: 'résumé', reussite: 'réussite', role: 'rôle', roles: 'rôles',
};
function languages(source) {
    const records = [];
    // Covers the repository's literal assignments, including escaped quotes/newlines.
    const pattern = /\$string\s*\[\s*'((?:\\.|[^'\\])*)'\s*\]\s*=\s*'((?:\\.|[^'\\])*)'\s*;/g;
    for (const m of source.matchAll(pattern)) records.push({key: m[1],
        value: m[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
        line: source.slice(0, m.index).split('\n').length});
    return records;
}
function placeholders(text) {
    return [...text.matchAll(/\{\$a(?:->[\w]+)?\}|__[a-zA-Z_]+__/g)].map(m => m[0]).sort();
}
function inspectLanguages(en, fr) {
    const findings = [];
    const maps = {};
    for (const [locale, records] of Object.entries({en, fr})) {
        const map = maps[locale] = new Map();
        for (const record of records) {
            const base = {locale, key: record.key, line: record.line};
            if (map.has(record.key)) findings.push({...base, kind: 'duplicate-key', severity: 'error'});
            map.set(record.key, record);
            if (/\(s\)/i.test(record.value)) findings.push({...base, kind: 'parenthesised-plural', severity: 'error'});
            if (/\uFFFD|Ã[©¨ª´]|â€/.test(record.value)) findings.push({...base, kind: 'encoding', severity: 'error'});
            if (locale === 'fr' && !/example\.|username|unknown-entry/.test(record.value)) {
                for (const word of record.value.match(/[\p{L}]+/gu) || []) {
                    const expected = accents[word.toLowerCase()];
                    if (expected) findings.push({...base, kind: 'missing-accent', severity: 'error', word, expected});
                }
            }
            // Sentence case is the normal label policy; acronyms/products excluded.
            const capitals = (record.value.match(/\b[A-Z][a-z]{2,}\b/g) || [])
                .filter(w => !['Moodle', 'EasyStud', 'EasyEdu', 'Excel', 'Inter', 'Alex', 'Alice', 'Martin', 'Dupont',
                    'Projet', 'Horizon', 'Orion', 'Promotion'].includes(w));
            if (record.value.length < 80 && capitals.length > 1) findings.push({...base,
                kind: 'capitalisation-candidate', severity: 'warning', text: record.value});
        }
    }
    for (const key of new Set([...maps.en.keys(), ...maps.fr.keys()])) {
        if (!maps.en.has(key) || !maps.fr.has(key)) findings.push({key,
            kind: 'unpaired-key', severity: 'error', missingIn: maps.en.has(key) ? 'fr' : 'en'});
        else if (JSON.stringify(placeholders(maps.en.get(key).value)) !==
            JSON.stringify(placeholders(maps.fr.get(key).value))) findings.push({key,
            kind: 'placeholder-mismatch', severity: 'error'});
    }
    return findings;
}
function jsLiterals(source) {
    // A lightweight lexical pass: comments ignored, strings/templates retained.
    // Template interpolation/regex ambiguity makes this a candidate inventory,
    // not AST-based proof. Every result carries line/context for human review.
    const result = [];
    const tokens = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g;
    for (const m of source.matchAll(tokens)) {
        if (m[0].startsWith('//') || m[0].startsWith('/*')) continue;
        const text = m[0].slice(1, -1);
        const context = source.slice(Math.max(0, m.index - 120), m.index + m[0].length + 60);
        const visible = /textContent|innerText|\.text\(|\.html\(|innerHTML|aria-label|placeholder|title|alert\(|notification|label:/i.test(context);
        const prose = /[A-Za-zÀ-ÿ]{2,}\s+[A-Za-zÀ-ÿ]{2,}/.test(text) &&
            !/^[.#\[]|local-groupimport|easyedu-|data-|^https?:|^function|^const |^return /.test(text);
        const aria = /aria-label\s*[=:]\s*["'][^"']+["']/i.test(text) ||
            /setAttribute\(\s*['"]aria-label['"]\s*,\s*$/.test(source.slice(Math.max(0, m.index - 80), m.index));
        if (prose || aria || (visible && /^[A-Z][a-z]+(?:[.!?])?$/.test(text))) result.push({
            kind: aria ? 'hardcoded-aria-candidate' : 'hardcoded-ui-candidate', severity: 'warning',
            line: source.slice(0, m.index).split('\n').length, text,
            context: context.replace(/\s+/g, ' ').trim()});
    }
    return result;
}
function audit(repo) {
    const files = cp.execFileSync('git', ['-C', repo, 'ls-files', 'amd/src/**/*.js', 'amd/src/*.js'],
        {encoding: 'utf8'}).trim().split(/\r?\n/).filter(Boolean);
    const records = Object.fromEntries(['en', 'fr'].map(locale => [locale,
        languages(fs.readFileSync(path.join(repo, 'lang', locale, 'local_groupimport.php'), 'utf8'))]));
    const findings = inspectLanguages(records.en, records.fr);
    for (const file of files) for (const finding of jsLiterals(fs.readFileSync(path.join(repo, file), 'utf8')))
        findings.push({...finding, file});
    return {task: 'T057', level: 'N0', sourceHead: cp.execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'],
        {encoding: 'utf8'}).trim(), scope: {languages: ['lang/en/local_groupimport.php', 'lang/fr/local_groupimport.php'],
            jsFiles: files.length, vendorGuide: 'embedded upstream Guide excluded; owner must audit separately'},
        keys: {en: records.en.length, fr: records.fr.length},
        languageErrors: findings.filter(f => f.severity === 'error').length,
        warnings: findings.filter(f => f.severity === 'warning').length, findings};
}
function selfTest() {
    const en = languages("$string['x'] = '{$a} students'; $string['only'] = 'Only';");
    const fr = languages("$string['x'] = '{$a} etudiant(s)'; $string['x'] = 'Selection User Name';");
    const kinds = inspectLanguages(en, fr).map(f => f.kind);
    for (const kind of ['missing-accent', 'parenthesised-plural', 'duplicate-key', 'unpaired-key',
        'placeholder-mismatch', 'capitalisation-candidate']) assert(kinds.includes(kind), kind);
    assert.equal(languages("$string['x'] = 'L\\'étudiant';")[0].value, "L'étudiant");
    assert.equal(jsLiterals("// node.textContent = 'Fake text';\nnode.textContent = 'Real text';").length, 1);
    assert(jsLiterals("node.setAttribute('aria-label', 'Close');").some(f => f.kind === 'hardcoded-aria-candidate'));
    console.log(JSON.stringify({task: 'T057', selfTest: 'PASS', checks: 9}));
}
if (require.main === module) {
    if (process.argv.includes('--self-test')) selfTest();
    else {
        const repoArg = process.argv.indexOf('--root');
        const result = audit(repoArg < 0 ? root : path.resolve(process.argv[repoArg + 1]));
        const outArg = process.argv.indexOf('--output');
        if (outArg >= 0) fs.writeFileSync(path.resolve(process.argv[outArg + 1]), JSON.stringify(result, null, 2) + '\n');
        console.log(JSON.stringify({...result, findings: undefined}));
        if (process.argv.includes('--strict') && result.languageErrors) process.exitCode = 1;
    }
}
module.exports = {languages, inspectLanguages, jsLiterals, audit};
