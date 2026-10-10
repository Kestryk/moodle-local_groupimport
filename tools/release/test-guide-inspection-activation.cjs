// Bounded production presentation adapter, without Moodle/session/database access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 3, 'Usage: <php>');
const root = path.resolve(__dirname, '../..');
const normalize = value => value.replace(/\r\n/g, '\n');
const manage = normalize(fs.readFileSync(path.join(root, 'manage.php'), 'utf8'));
const baseline = normalize(execFileSync('git', ['show',
    '165716555199a772c1f30de9a46cbc978f40138f:manage.php'], {cwd:root, encoding:'utf8'}));
const start = manage.indexOf('            // Illustration-only successor:');
const end = manage.indexOf("        } else if (!empty($step['visualfirststructure']))", start);
assert.ok(start > 0 && end > start);
assert.equal(manage.slice(0, start) + manage.slice(end), baseline,
    'Every other lesson, target, opener, index, course and progression adapter is unchanged');
for (const language of ['en', 'fr']) {
    const data = JSON.parse(execFileSync(process.argv[2],
        [path.join(__dirname, 'guide-discovery-fixture.php'), language], {encoding:'utf8'}));
    assert.equal(data.historicalSlides.length, 24);
    assert.equal(data.readingSlides[0].id, 'use-this-guide');
    assert.equal(data.practicePath.length, 6);
    const lessons = Object.fromEntries(data.cardLessons.map(item => [item.type, item]));
    assert.ok(lessons.participant.visualcarddetail);
    assert.equal(Object.hasOwn(lessons.participant, 'discoveryscene'), false);
    for (const type of ['group', 'grouping']) {
        assert.equal(Object.hasOwn(lessons[type], 'visualcarddetail'), false, 'No duplicate illustration');
        assert.deepEqual(lessons[type].discoveryscene, data.inspectionScenes[type]);
        assert.equal(lessons[type].discoveryscene.kind, 'inspection');
        assert.equal(lessons[type].commonintroduction.topics.length, 3, 'Reading explanation retained');
    }
}
console.log('PASS production Group/Grouping illustration activation; Participant/static, all other manage.php code, 24 slides and six-step path preserved. Native preview not tested.');
