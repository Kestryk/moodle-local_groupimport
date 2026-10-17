<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.
/**
 * Locked-pool fixture for the K16-15 native checkbox and focus regression.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
// Owned pool-only fixture: creates one group, restores its one member between cases, deletes it at cleanup.
define('CLI_SCRIPT', true);
$options = getopt('', ['root:', 'manifest:', 'action:']);
$roots = ['C:/dev/Moodle 51 Claude/moodle' => 'http://localhost:8052',
    'C:/dev/Moodle 51 Claude 2/moodle' => 'http://localhost:8054',
    'C:/dev/Moodle 51 Claude 3/moodle' => 'http://localhost:8055'];
$runtime = str_replace('\\', '/', $options['root']);
if (!isset($roots[$runtime])) { throw new RuntimeException('Owned pool roots only'); }
require($runtime . '/config.php');
if ($CFG->wwwroot !== $roots[$runtime]) { throw new RuntimeException('Pool URL mismatch'); }
require_once($CFG->dirroot . '/group/lib.php');
\core\session\manager::set_user(get_admin());
$file = $options['manifest'];
$action = $options['action'];
if ($action === 'create') {
    if (file_exists($file)) { throw new RuntimeException('Do not overwrite a live fixture'); }
    $course = get_course(71);
    $users = get_enrolled_users(context_course::instance(71), '', 0, 'u.*', 'u.id', 0, 2);
    $user = reset($users);
    if (!$user) { throw new RuntimeException('Test course has no enrolled user'); }
    $baseline = array_values($DB->get_records('groups_members', ['userid' => $user->id], 'id'));
    $token = 'codex1-k16-15-' . bin2hex(random_bytes(6));
    $groupid = groups_create_group((object)['courseid' => 71, 'name' => '000 ' . $token, 'idnumber' => $token]);
    $data = ['courseId' => 71, 'userId' => $user->id, 'groupId' => $groupid, 'token' => $token, 'baseline' => $baseline];
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
} else { $data = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR); }
$group = $DB->get_record('groups', ['id' => $data['groupId'], 'courseid' => 71], '*', MUST_EXIST);
if ($group->idnumber !== $data['token'] || !str_starts_with($group->idnumber, 'codex1-k16-15-')) {
    throw new RuntimeException('Fixture ownership mismatch');
}
if ($action === 'create' || $action === 'reset') {
    groups_add_member($group, $data['userId']);
} else if ($action === 'cleanup') {
    groups_delete_group($group);
    $after = json_decode(json_encode(array_values($DB->get_records('groups_members', ['userid' => $data['userId']], 'id'))), true);
    if ($after !== $data['baseline']) { throw new RuntimeException('Original memberships not restored'); }
    echo json_encode(['restored' => true, 'groupDeleted' => true]) . PHP_EOL;
    exit;
} else if ($action !== 'snapshot') { throw new RuntimeException('Unknown fixture action'); }
echo json_encode(['groupId' => $data['groupId'], 'userId' => $data['userId'],
    'member' => groups_is_member($data['groupId'], $data['userId'])]) . PHP_EOL;
