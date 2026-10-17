// The unavailable-message label must exist independently of newer core strings.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const manage = fs.readFileSync(path.join(root, 'manage.php'), 'utf8');
assert.match(manage, /'messagesendunavailable'\s*=>\s*get_string\('messagesendunavailable', 'local_groupimport'\)/);
assert.doesNotMatch(manage, /get_string\('cannotsendmessages', 'core_message'\)/);
for (const [language, expected] of [
    ['en', 'Cannot send messages'],
    ['fr', 'Impossible d’envoyer des messages'],
]) {
    const source = fs.readFileSync(path.join(root, 'lang', language, 'local_groupimport.php'), 'utf8');
    const matches = [...source.matchAll(/\$string\['messagesendunavailable'\]\s*=\s*'([^']*)';/g)];
    assert.equal(matches.length, 1, `${language}: one local definition`);
    assert.equal(matches[0][1], expected);
    assert.doesNotMatch(matches[0][1], /\{\$a\}/);
}
console.log('PASS unavailable-message labels exist once in EN/FR without a Moodle 5.x core string dependency.');
