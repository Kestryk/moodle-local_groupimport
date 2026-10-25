'use strict';
// Execute the actual endpoint branches with transactional native-API doubles, without Moodle/SQL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const php = process.argv[2];
assert.ok(php && path.isAbsolute(php), 'Pass an absolute PHP CLI path');
const inventory = require('./lib/php-function-inventory.cjs');
const actions = ['renamegroup', 'duplicategroup', 'duplicategrouping', 'deletegroupings'];
const branches = {};
for (const action of actions) {
    const method = inventory(php, path.join(root, 'classes/local/ajax', action + '.php')).handle;
    assert.ok(method && method.body, `${action} current action handler exists`);
    branches[action] = method.body;
}
const manage = fs.readFileSync(path.join(root, 'manage.php'), 'utf8').replace(/\r\n/g, '\n');
for (const action of ['renamegroup', 'renamegrouping']) {
    const marker = `} else if ($action === '${action}') {`;
    const start = manage.indexOf(marker) + marker.length;
    let end = manage.indexOf('\n    } else if', start);
    if (end < 0) end = manage.indexOf('\n    }\n}', start);
    assert.ok(start >= marker.length && end > start, 'POST fallback branch exists');
    branches['manage_' + action] = manage.slice(start, end);
}
const prelude = String.raw`
namespace local_groupimport\local {
    class batch_reader {
        public static function records($table, $ids, $conditions) {
            return array_filter($GLOBALS['DB']->get_records($table, $conditions),
                static fn($record) => in_array($record->id, $ids));
        }
    }
}
namespace {
    define('MOODLE_INTERNAL', true);
    define('PARAM_INT', 1); define('PARAM_TEXT', 2); define('MUST_EXIST', 1);
    class moodle_exception extends \Exception {
        public function __construct($key, ...$arguments) { parent::__construct($key); }
    }
    class core_php_time_limit { public static function raise($seconds) {} }
    class core_text {
        public static function strlen($value) { return mb_strlen($value); }
        public static function substr($value, $start, $length) { return mb_substr($value, $start, $length); }
        public static function strtolower($value) { return mb_strtolower($value); }
    }
    class moodle_url {
        public function __construct(...$args) {}
        public function out($escape) { return '/group/native.php'; }
    }
    function required_param($key, $type) { return $GLOBALS['params'][$key]; }
    function required_param_array($key, $type) { return required_param($key, $type); }
    function get_string($key, $component = '', $value = '') { return $key . (is_scalar($value) ? $value : ''); }
    function local_groupimport_count_string($key, $count) { return $key . $count; }
    function format_string($value) { return $value; }
    function fullname($user) { return $user->firstname . ' ' . $user->lastname; }
    function groups_get_group($id) { return $GLOBALS['DB']->get_record('groups', ['id' => $id]); }
    function groups_get_group_by_name($course, $name) { return false; }
    function groups_update_group($group) { $GLOBALS['DB']->tables['groups'][$group->id] = clone $group; }
    function groups_get_members($id, $fields) {
        $result = [];
        foreach ($GLOBALS['DB']->get_records('groups_members', ['groupid' => $id]) as $link) {
            $result[] = (object)['id' => $link->userid, 'firstname' => 'Test', 'lastname' => (string)$link->userid];
        }
        return $result;
    }
    function groups_create_group($group) { return $GLOBALS['DB']->insert('groups', $group); }
    function groups_create_grouping($grouping) { return $GLOBALS['DB']->insert('groupings', $grouping); }
    function groups_add_member($groupid, $userid) {
        if ($GLOBALS['fail'] === 'member' && $userid === 3) return false;
        $GLOBALS['DB']->insert('groups_members', (object)compact('groupid', 'userid')); return true;
    }
    function groups_assign_grouping($groupingid, $groupid) {
        if ($GLOBALS['fail'] === 'assign') return false;
        $GLOBALS['DB']->insert('groupings_groups', (object)compact('groupingid', 'groupid')); return true;
    }
    function groups_delete_grouping($grouping) {
        if ($GLOBALS['fail'] === 'delete' && $grouping->id === 12) return false;
        unset($GLOBALS['DB']->tables['groupings'][$grouping->id]); return true;
    }
    $DB = new class {
        public $tables = []; public $commits = 0; public $rollbacks = 0;
        public function get_records($table, $conditions) {
            return array_filter($this->tables[$table] ?? [], static function($row) use ($conditions) {
                foreach ($conditions as $key => $value) if (($row->$key ?? null) != $value) return false;
                return true;
            });
        }
        public function get_record($table, $conditions, ...$unused) {
            $rows = $this->get_records($table, $conditions); return reset($rows) ?: false;
        }
        public function record_exists($table, $conditions) { return (bool)$this->get_record($table, $conditions); }
        public function count_records($table, $conditions) { return count($this->get_records($table, $conditions)); }
        public function insert($table, $row) {
            $row = clone $row; $row->id = count($this->tables[$table] ?? []) + 100;
            $this->tables[$table][$row->id] = $row; return $row->id;
        }
        public function start_delegated_transaction() {
            return new class($this) {
                private $db; private $before;
                public function __construct($db) { $this->db = $db; $this->before = serialize($db->tables); }
                public function allow_commit() { $this->db->commits++; }
                public function rollback($error) {
                    $this->db->tables = unserialize($this->before); $this->db->rollbacks++; throw $error;
                }
            };
        }
    };
    function check($condition, $message) { if (!$condition) throw new \Exception($message); }
    function seed() {
        global $DB, $course, $params, $fail;
        $course = (object)['id' => 5]; $fail = ''; $DB->commits = 0; $DB->rollbacks = 0;
        $params = ['groupid' => 1, 'groupingid' => 10, 'groupingids' => [10, 11], 'name' => 'Renamed'];
        $DB->tables = [
            'groups' => [1 => (object)['id' => 1, 'courseid' => 5, 'name' => 'G'],
                2 => (object)['id' => 2, 'courseid' => 99, 'name' => 'Foreign']],
            'groupings' => [10 => (object)['id' => 10, 'courseid' => 5, 'name' => 'A'],
                11 => (object)['id' => 11, 'courseid' => 99, 'name' => 'Foreign'],
                12 => (object)['id' => 12, 'courseid' => 5, 'name' => 'B']],
            'groups_members' => [1 => (object)['id' => 1, 'groupid' => 1, 'userid' => 2],
                2 => (object)['id' => 2, 'groupid' => 1, 'userid' => 3]],
            'groupings_groups' => [1 => (object)['id' => 1, 'groupid' => 1, 'groupingid' => 10],
                2 => (object)['id' => 2, 'groupid' => 2, 'groupingid' => 10]],
        ];
    }
`;
// JSON is transported as base64 so PHP never interprets source quotes or dollar signs.
const encoded = Buffer.from(JSON.stringify(branches)).toString('base64');
const tests = String.raw`
    $checks = 0;
    $run = static function($action) use ($branches) {
        global $DB, $course;
        $response = [];
        eval('use local_groupimport\local\ajax_security; use local_groupimport\local\bulk_action;' . $branches[$action]);
        return $response;
    };
    seed(); $response = $run('renamegroup');
    check($DB->tables['groups'][1]->name === 'Renamed', 'Rename success'); $checks++;
    foreach (['', str_repeat('é', 255)] as $name) {
        seed(); $params['name'] = $name; $before = serialize($DB->tables);
        try { $run('renamegroup'); throw new \Exception('Expected invalid name'); }
        catch (moodle_exception $expected) { check(serialize($DB->tables) === $before, 'Name rejected before write'); $checks++; }
    }
    foreach (['manage_renamegroup', 'manage_renamegrouping'] as $action) foreach (['', str_repeat('é', 255)] as $name) {
        seed(); $params['name'] = $name; $before = serialize($DB->tables);
        try { $run($action); throw new \Exception('Expected invalid POST name'); }
        catch (moodle_exception $expected) {
            check(serialize($DB->tables) === $before, 'POST name rejected before write'); $checks++;
        }
    }
    seed(); $response = $run('duplicategroup');
    check($response['group']['membercount'] === 2 && $response['group']['groupingids'] === [10], 'Copy members and links');
    check($DB->commits === 1, 'Copy commits once'); $checks++;
    seed(); $fail = 'member'; $before = serialize($DB->tables);
    try { $run('duplicategroup'); throw new \Exception('Expected failed member'); }
    catch (moodle_exception $expected) {
        check(serialize($DB->tables) === $before && $DB->rollbacks === 1, 'No partial group/members after failure'); $checks++;
    }
    seed(); $response = $run('duplicategrouping');
    check($response['grouping']['groupids'] === [1] && $DB->commits === 1, 'Copy ignores foreign course'); $checks++;
    seed(); $fail = 'assign'; $before = serialize($DB->tables);
    try { $run('duplicategrouping'); throw new \Exception('Expected failed assignment'); }
    catch (moodle_exception $expected) {
        check(serialize($DB->tables) === $before && $DB->rollbacks === 1, 'No partial grouping after failure'); $checks++;
    }
    seed(); $run('deletegroupings');
    check(!isset($DB->tables['groupings'][10]) && isset($DB->tables['groupings'][11]), 'Delete keeps foreign course'); $checks++;
    seed(); $params['groupingids'] = [10, 12]; $fail = 'delete'; $before = serialize($DB->tables);
    try { $run('deletegroupings'); throw new \Exception('Expected failed deletion'); }
    catch (moodle_exception $expected) {
        check(serialize($DB->tables) === $before && $DB->rollbacks === 1, 'Deletion rollback restores first item'); $checks++;
    }
    foreach (['duplicategroup', 'duplicategrouping', 'deletegroupings'] as $action) {
        seed();
        if ($action === 'deletegroupings') $params['groupingids'] = array_fill(0, 501, 10);
        else for ($i = 0; $i < 501; $i++) {
            $table = $action === 'duplicategroup' ? 'groups_members' : 'groupings_groups';
            $DB->insert($table, (object)['groupid' => 1, 'userid' => $i + 20, 'groupingid' => 10]);
        }
        $before = serialize($DB->tables);
        try { $run($action); throw new \Exception('Expected size limit'); }
        catch (moodle_exception $expected) {
            check(serialize($DB->tables) === $before && $DB->commits === 0, 'Oversized action rejected before writes'); $checks++;
        }
    }
    foreach (['duplicategroup', 'duplicategrouping', 'deletegroupings'] as $action) {
        seed();
        if ($action === 'deletegroupings') $params['groupingids'] = array_fill(0, 500, 10);
        else {
            $DB->tables['groups_members'] = []; $DB->tables['groupings_groups'] = [];
            for ($i = 0; $i < 500; $i++) {
                if ($action === 'duplicategroup') {
                    $DB->insert('groups_members', (object)['groupid' => 1, 'userid' => $i + 20]);
                } else {
                    $id = $DB->insert('groups', (object)['courseid' => 5, 'name' => 'Boundary ' . $i]);
                    $DB->insert('groupings_groups', (object)['groupid' => $id, 'groupingid' => 10]);
                }
            }
        }
        $result = $run($action);
        check($result['success'] && $DB->commits === 1, 'Boundary 500 is allowed'); $checks++;
    }
    echo json_encode(['checks' => $checks, 'runtimeAccess' => false, 'nativeBranches' => array_keys($branches)]);
}
`;
const program = '<?php\n' + prelude + '\n$branches = json_decode(base64_decode(\'' + encoded + '\'), true);\n' +
    `require ${JSON.stringify(path.join(root, 'classes/local/ajax_security.php').replace(/\\/g, '/'))};\n` +
    `require ${JSON.stringify(path.join(root, 'classes/local/bulk_action.php').replace(/\\/g, '/'))};\n` + tests;
const result = spawnSync(php, [], {input: program, encoding: 'utf8'});
assert.equal(result.status, 0, result.stderr + result.stdout);
const evidence = JSON.parse(result.stdout);
assert.equal(evidence.checks, 19);
console.log(JSON.stringify({suite: 'K21-34 actual endpoint branches', passed: true, ...evidence}));
