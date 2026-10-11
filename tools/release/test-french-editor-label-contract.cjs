// CI candidate: five locale corrections and the actual reusable ARIA/help helper.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => execFileSync('git', ['show', '00277963c458995bd152232a8a15378fbc88d078:' + file],
    {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}).replace(/\r\n/g, '\n');
const replacements = [
    ['advancedsettings', 'Parametres avances', 'Paramètres avancés'],
    ['advancedsettingsintro', 'Principaux parametres Moodle qui ne sont pas modifies directement dans EasyStud.',
        'Principaux paramètres Moodle qui ne sont pas modifiés directement dans EasyStud.'],
    ['advancedsettingsnoimage', 'Aucune image de groupe configuree.', 'Aucune image de groupe configurée.'],
    ['advancedsettingsnofile', 'Aucun fichier selectionne', 'Aucun fichier sélectionné'],
    ['advancedsettingsconfigdata', 'Donnees de configuration', 'Données de configuration']
];
let restored = read('lang/fr/local_groupimport.php');
for (const [key, before, after] of replacements) {
    const line = "$string['" + key + "'] = '" + after + "';";
    assert.equal(restored.split(line).length, 2);
    restored = restored.replace(line, "$string['" + key + "'] = '" + before + "';");
    assert.ok(read('manage.php').includes("get_string('" + key + "', 'local_groupimport')"));
}
assert.equal(restored, old('lang/fr/local_groupimport.php'), 'All unrelated French strings preserved');
for (const file of ['lang/en/local_groupimport.php', 'manage.php', 'templates/manage.mustache',
    'amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/src/easyedu_guide.js', 'ajax.php']) {
    assert.equal(read(file), old(file), file + ' unchanged');
}
const manager = read('amd/src/course_manager.js');
const helper = manager.slice(manager.indexOf('const createIconActionButton ='), manager.indexOf('const ensureDuplicateButtons ='));
assert.ok(helper.includes("button.setAttribute('aria-label', label || '')"));
assert.ok(helper.includes("button.setAttribute('data-easystud-hover-help', label || '')"));
const advanced = manager.slice(manager.indexOf('const ensureAdvancedSettingsButtons ='), manager.indexOf('const clearAdvancedFileDragState ='));
assert.equal(advanced.split("labels.advancedsettings || ''").length, 3, 'Both entity buttons pass Moodle-localized label to the helper');
console.log('PASS five French accent corrections; original ARIA/help pipeline and every unrelated controller/string preserved. CSS has its independent host-priority preservation gate.');
