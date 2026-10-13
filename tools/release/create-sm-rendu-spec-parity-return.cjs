'use strict';

/** Generate a bounded review return from measured records, never inferred PASS. */
const fs = require('node:fs');
const path = require('node:path');
const options = Object.fromEntries(process.argv.slice(2).map(arg => {
    const separator = arg.indexOf('=');
    return [arg.slice(2, separator), arg.slice(separator + 1)];
}));
if (!options.summary || !options.output) throw new Error('--summary and --output required.');
const summary = JSON.parse(fs.readFileSync(options.summary, 'utf8'));
const root = path.resolve(__dirname, '..', '..');
const output = path.resolve(options.output);
if (output.startsWith(root + path.sep)) throw new Error('Review return must remain external.');
const clean = value => String(value || '').replace(/[|\r\n]/g, ' ').trim();
const shortStatus = record => !record ? 'en attente' : record.status === 'passed' ? 'PASS' :
    `${record.status}${record.line ? ':' + record.line : ''}`;
const modes = pair => `L ${shortStatus(pair?.legacy)} / R ${shortStatus(pair?.reactive)}`;
const rows = summary.cases.map(item => `| ${clean(item.spec)}${item.spec === 'accessibility-smoke.spec.js' ?
    ' / ' + clean(item.title).slice(0, 45) : ''} | ${modes(item.beforeRuns)} | ${modes(item.afterRuns)} | ${item.after} |`);
const differences = summary.cases.filter(item => item.after === 'different-outcome');
const lines = [
    '# Codex2 — résultats de la comparaison SM-RENDU', '',
    `- Source : \`${summary.sourceHead}\`, base produit \`${summary.productBase}\`.`,
    '- Aucun renderer, gabarit, style ou numéro de version modifié dans ce lot.',
    '- Modification : 188 gardes AJAX mutualisés, 17 parcours d’arbre paresseux, sélection sur la page visible et compteurs affichés.',
    `- Matrices : après **${summary.afterMatrixStatus}**, avant **${summary.beforeMatrixStatus}**.`,
    `- Résultats après : ${summary.counts['both-pass']} doubles PASS ; ${summary.counts['same-failure']} échecs identiques ; ` +
        `${summary.counts['different-outcome']} écarts ; ${summary.counts.pending} paires en attente ; ` +
        `${summary.counts['unresolved-infrastructure']} résultats d’infrastructure non résolus.`,
    '- Un échec identique indique seulement la parité de cet échec, jamais une validation produit.',
    `- Périmètre dynamique : ${summary.cases.length} tests ciblés ; ${summary.unpairedSpecs.length} autres fichiers modifiés ` +
        'ont une couverture statique du garde partagé, sans preuve native générale dans ce lot.',
    '- Copie : http://localhost:8051, cours existant 5, aucune fixture. Profil neuf, préférence Guide QA et réglage de rendu restaurés par le superviseur.',
    '- Contrats statiques et syntaxe JS/PowerShell/PHP : PASS. Checklist humaine OUVERTE.', '',
    '| Spec / cas | Avant (L/R) | Après (L/R) | Comparaison après |',
    '| --- | --- | --- | --- |', ...rows, '',
    '## Écarts à relire', '',
];
if (!differences.length) lines.push(summary.allSelectedModesCompared ?
    'Aucun écart de première erreur, ligne et valeur attendue/reçue entre modes dans la matrice ciblée.' :
    'Comparaison non terminée : aucune absence de régression globale ne peut être conclue.');
for (const item of differences.slice(0, 4)) {
    for (const mode of ['legacy', 'reactive']) {
        const record = item.afterRuns[mode];
        if (!record) continue;
        const details = record.errorDetails || {};
        lines.push(`- ${item.spec}:${details.specLine || record.line || '?'} / ${mode} : ` +
            `${clean(record.firstError).slice(0, 105)} ; attendu=${clean(details.expected).slice(0, 45) || '-'} ; ` +
            `reçu=${clean(details.received).slice(0, 45) || '-'}.`);
        const capture = record.captures?.find(file => file.includes('test-failed')) || record.captures?.[0];
        if (capture) lines.push(`  Capture : \`${capture.replaceAll('\\', '/')}\`.`);
    }
}
if (differences.length > 4) lines.push(`Les ${differences.length - 4} autres écarts et toutes leurs captures sont dans le JSON brut.`);
lines.push('', '- Attribution au code : à déterminer à partir des lignes/captures ; les écarts ne sont pas automatiquement imputés au produit.',
    `- JSON brut : \`${path.resolve(options.summary).replaceAll('\\', '/')}\`.`,
    '- Liste complète des specs modifiées : propriété `modifiedSpecs` du JSON brut.',
    '- T031 précédent : commit poussé `a4e2be4a`, 61 tâches et 57 références vérifiées, acceptation humaine ouverte.', '');
const text = lines.join('\n');
if (lines.length > 150 || text.length > 10000) throw new Error('Review return exceeds the bounded reporting contract.');
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, text);
console.log(JSON.stringify({output, lines: lines.length, characters: text.length,
    matricesCompleted: summary.afterMatrixStatus === 'completed' && summary.beforeMatrixStatus === 'completed'}));
