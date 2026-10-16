// Publication check (K15-31, rule 1): static text uses the single character U+2026,
// never three ASCII dots, in the plugin language files.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
for (const lang of ['en', 'fr']) {
  const file = path.join(root, 'lang', lang, 'local_groupimport.php');
  const bad = fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l, i) => [i + 1, l]).filter(([, l]) => /^\$string\[.*=.*[^.]\.\.\.(?!\.)/.test(l) && !/\$a|\{\$/.test(l.split('=')[0]));
  assert.deepEqual(bad.map(([n]) => lang + ':' + n), [], 'ASCII "..." found in lang/' + lang);
}
const en = fs.readFileSync(path.join(root, 'lang/en/local_groupimport.php'), 'utf8');
assert.match(en, /\$string\['actioninprogress'\] = 'Action in progress…';/);
console.log('PASS lang strings use U+2026 only; EN actioninprogress translates "Action en cours".');
