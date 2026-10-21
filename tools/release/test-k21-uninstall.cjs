'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const php = process.argv[2];
assert.ok(php && path.isAbsolute(php), 'Pass an absolute PHP CLI path');
const provider = fs.readFileSync(path.join(root, 'classes/privacy/provider.php'), 'utf8');
const declaration = provider.match(/add_database_table\('local_groupimport_jobs', \[([\s\S]*?)\],/)[1];
const fields = [...declaration.matchAll(/'([^']+)'\s*=>/g)].map(m => m[1]);
const xml = fs.readFileSync(path.join(root, 'db/install.xml'), 'utf8');
const schema = xml.match(/<TABLE NAME="local_groupimport_jobs"[\s\S]*?<\/TABLE>/)[0];
assert.ok(fields.includes('nextrow') && !fields.includes('cursor'));
for (const field of fields) assert.ok(schema.includes(`FIELD NAME="${field}"`), `${field} exists in the job schema`);
const program = `<?php
namespace local_groupimport\\local { class guide_welcome {
    public const PREFERENCE = 'local_groupimport_guide_welcome_seen';
} }
namespace {
    define('MOODLE_INTERNAL', true); define('MATURITY_BETA', 50);
    $plugin = new \\stdClass();
    require ${JSON.stringify((root + '/version.php').replace(/\\/g, '/'))};
    if ($plugin->supported !== [405, 503] || $plugin->requires !== 2024100700) throw new \\Exception('Version contract');
    $preferences = [1 => ['local_groupimport_guide_welcome_seen' => 'seen', 'easyedu_motion_level' => 'reduced', 'foreign' => 'keep'],
        2 => ['local_groupimport_guide_welcome_seen' => 'seen', 'easyedu_motion_level' => 'minimal', 'foreign' => 'keep']];
    $closed = 0; $removed = 0;
    $DB = new class {
        public function get_recordset($table, $conditions, $sort, $fields) {
            if ($table !== 'user_preferences' || $conditions !== ['name' => 'local_groupimport_guide_welcome_seen']) {
                throw new \\Exception('Unrelated data queried');
            }
            $rows = [];
            foreach ($GLOBALS['preferences'] as $userid => $values) if (isset($values[$conditions['name']])) {
                $rows[] = (object)['id' => $userid, 'userid' => $userid];
            }
            return new class($rows) extends \\ArrayIterator { public function close() { $GLOBALS['closed']++; } };
        }
    };
    function unset_user_preference($name, $userid) { unset($GLOBALS['preferences'][$userid][$name]); $GLOBALS['removed']++; }
    require ${JSON.stringify((root + '/db/uninstall.php').replace(/\\/g, '/'))};
    if (!xmldb_local_groupimport_uninstall() || !xmldb_local_groupimport_uninstall()) throw new \\Exception('Return contract');
    if ($closed !== 2 || $removed !== 2) throw new \\Exception('Idempotence/recordset cleanup');
    if ($preferences !== [1 => ['easyedu_motion_level' => 'reduced', 'foreign' => 'keep'],
            2 => ['easyedu_motion_level' => 'minimal', 'foreign' => 'keep']]) throw new \\Exception('Unrelated preference removed');
    echo json_encode(['uninstall' => 'PASS', 'idempotent' => true, 'sharedMotionPreserved' => true, 'runtimeAccess' => false]);
}
`;
const result = spawnSync(php, [], {input: program, encoding: 'utf8'});
assert.equal(result.status, 0, result.stderr + result.stdout);
console.log(JSON.stringify({suite: 'K21-36', metadataFields: fields.length, ...JSON.parse(result.stdout)}));
