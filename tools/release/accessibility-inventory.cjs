'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
function inventory() {
    const files = ['templates/manage.mustache', 'templates/easyedu_guide.mustache', 'templates/easyedu_navigation.mustache',
        'amd/src/course_manager.js', 'amd/src/csv_import.js', 'amd/src/easyedu_guide.js', 'amd/src/easyedu_navigation.js', 'index.php'];
    const entries = new Map();
    for (const file of files) {
        if (!fs.existsSync(path.join(root, file))) continue;
        const source = fs.readFileSync(path.join(root, file), 'utf8');
        for (const m of source.matchAll(/data-(?:easystud|easyedu|local-groupimport)-[\w-]*(?:modal|panel|menu)(?![\w-])/g)) {
            const attribute = m[0];
            if (!entries.has(attribute)) entries.set(attribute, {selector: '[' + attribute + ']', references: []});
            entries.get(attribute).references.push({file, line: source.slice(0, m.index).split('\n').length});
        }
    }
    return {task: 'T058', sourceHead: cp.execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
        caveat: 'Source mentions are candidates, not all distinct active overlay roots; native status must qualify visibility.',
        entries: [...entries.values()].sort((a, b) => a.selector.localeCompare(b.selector))};
}
if (require.main === module) {
    if (process.argv.includes('--self-test')) {
        const result = inventory();
        assert(result.entries.some(e => e.selector === '[data-easystud-move-modal]'));
        assert(result.entries.some(e => e.selector === '[data-local-groupimport-rollback-modal]'));
        assert(result.entries.some(e => e.selector === '[data-easyedu-navigation-panel]'));
        assert(result.entries.every(e => e.references.every(r => r.line > 0 && !path.isAbsolute(r.file))));
        console.log(JSON.stringify({task: 'T058', selfTest: 'PASS', checks: 4}));
        process.exit(0);
    }
    const result = inventory(), out = process.argv.indexOf('--output');
    if (out >= 0) fs.writeFileSync(process.argv[out + 1], JSON.stringify(result, null, 2));
    console.log(JSON.stringify({task: 'T058', inventoryCount: result.entries.length}));
}
module.exports = {inventory};
