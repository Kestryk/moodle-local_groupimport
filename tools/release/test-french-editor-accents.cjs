// CI candidate: correction of five French strings, no copy redesign/controller change.
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
    assert.ok(read('manage.php').includes("get_string('" + key + "', 'local_groupimport')"), key + ' uses Moodle localization');
}
assert.equal(restored, old('lang/fr/local_groupimport.php'), 'Complete unrelated French strings preserved');
for (const file of ['lang/en/local_groupimport.php', 'manage.php', 'templates/manage.mustache', 'styles.css',
    'amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/src/easyedu_guide.js', 'ajax.php']) {
    assert.equal(read(file), old(file), file + ' unchanged');
}
assert.ok(read('amd/src/course_manager.js').includes("button.setAttribute('aria-label', labels.advancedsettings || '')"));
console.log('PASS exactly five localized French accent corrections; unrelated strings/controllers/styles and native labels preserved.');
