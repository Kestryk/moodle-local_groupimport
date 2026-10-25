// K18-08 contract: the plugin installs no Moodle user tour and only retires unmodified shipped ones.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const check = (ok, msg) => { if (!ok) { console.error('FAIL ' + msg); process.exit(1); } };
const install = read('db/install.php');
check(!/usertours|import_tour_from_json/.test(install), 'db/install.php must not import tours');
const upgrade = read('db/upgrade.php');
check(!/import_tour_from_json|tour_preservation/.test(upgrade), 'db/upgrade.php must not import or update tours');
check(/oldversion < 2026101800[\s\S]*tour_retirement::retire_all\(\)[\s\S]*2026101800/.test(upgrade), 'upgrade step 2026101800 retires tours');
check(/\$plugin->version = 2026101800;/.test(read('version.php')), 'version 2026101800');
const cls = read('classes/local/tour_retirement.php');
check(/set_enabled\(false\)/.test(cls) && !/->remove\(\)|delete_records/.test(cls), 'retirement disables, never deletes');
for (const f of ['db/tours/local_groupimport_teacher_guide.json', 'db/tours/local_groupimport_course_home_hint.json',
    'db/tours/legacy/teacher-v1.json', 'db/tours/legacy/coursehome-v1.json']) {
    check(fs.existsSync(path.join(root, f)), f + ' kept for identification');
}
const lib = fs.readdirSync(path.join(root, 'classes/local'));
check(!lib.includes('tour_preservation.php'), 'old tour_preservation class removed');
console.log('PASS K18-08 tours off: no install/update import, retire-only upgrade step 2026101800, identification files kept.');
