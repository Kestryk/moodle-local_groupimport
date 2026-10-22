<?php
// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * AJAX endpoint for EasyStud course group actions.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use local_groupimport\local\ajax_security;

define('AJAX_SCRIPT', true);

/**
 * Routing table from action name to its handler class (I6, preparation for the S8 refactor).
 *
 * Each class implements {@see \local_groupimport\local\ajax\ajax_action} and reproduces,
 * unchanged, the behaviour of the former `if`/`else if` branch for that action: same
 * parameters, same security checks, same JSON response shape.
 *
 * @var array<string, class-string<\local_groupimport\local\ajax\ajax_action>>
 */
const LOCAL_GROUPIMPORT_AJAX_ACTIONS = [
    'userdetails' => \local_groupimport\local\ajax\userdetails::class,
    'creategroup' => \local_groupimport\local\ajax\creategroup::class,
    'creategrouping' => \local_groupimport\local\ajax\creategrouping::class,
    'renamegroup' => \local_groupimport\local\ajax\renamegroup::class,
    'renamegrouping' => \local_groupimport\local\ajax\renamegrouping::class,
    'updategroupadvanced' => \local_groupimport\local\ajax\updategroupadvanced::class,
    'updategroupingadvanced' => \local_groupimport\local\ajax\updategroupingadvanced::class,
    'movegroup' => \local_groupimport\local\ajax\movegroup::class,
    'duplicategroup' => \local_groupimport\local\ajax\duplicategroup::class,
    'duplicategrouping' => \local_groupimport\local\ajax\duplicategrouping::class,
    'addusers' => \local_groupimport\local\ajax\addusers::class,
    'movemembers' => \local_groupimport\local\ajax\movemembers::class,
    'movestatus' => \local_groupimport\local\ajax\movestatus::class,
    'addemails' => \local_groupimport\local\ajax\addemails::class,
    'addgroups' => \local_groupimport\local\ajax\addgroups::class,
    'removeuser' => \local_groupimport\local\ajax\removeuser::class,
    'removemembers' => \local_groupimport\local\ajax\removemembers::class,
    'deletegroups' => \local_groupimport\local\ajax\deletegroups::class,
    'deletegroupings' => \local_groupimport\local\ajax\deletegroupings::class,
];

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->dirroot . '/group/lib.php');
require_once($CFG->libdir . '/gdlib.php');

$courseid = required_param('courseid', PARAM_INT);
$action = required_param('action', PARAM_ALPHA);

ajax_security::require_request((string)($_SERVER['REQUEST_METHOD'] ?? ''), $courseid);
require_sesskey();

$course = get_course($courseid);
require_login($course);

$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

$response = ['success' => false];

try {
    // An unmatched action silently falls through, exactly like the former if/else if chain
    // with no final else: $response stays ['success' => false] and no 'error' key is set.
    if (array_key_exists($action, LOCAL_GROUPIMPORT_AJAX_ACTIONS)) {
        $actionclass = LOCAL_GROUPIMPORT_AJAX_ACTIONS[$action];
        $response = $actionclass::handle($course, $context, $response);
    }
} catch (dml_exception $exception) {
    // Database errors may carry SQL in their debug details: log them, never return them.
    debugging(
        'local_groupimport ajax ' . $action . ': ' . $exception->getMessage() . ' ' . ($exception->debuginfo ?? ''),
        DEBUG_DEVELOPER
    );
    $response['error'] = get_string('ajaxunexpectederror', 'local_groupimport');
} catch (moodle_exception $exception) {
    $response['error'] = $exception->getMessage();
} catch (Throwable $exception) {
    // Unexpected PHP errors are logged server side and reported with a generic message.
    debugging(
        'local_groupimport ajax ' . $action . ': ' . get_class($exception) . ': ' . $exception->getMessage(),
        DEBUG_DEVELOPER
    );
    $response['error'] = get_string('ajaxunexpectederror', 'local_groupimport');
}

if (!empty($response['success'])) {
    try {
        // PERF-SRV: lets the browser skip the full state reload when only this action changed the course.
        $response['stateversion'] = \local_groupimport\local\state_version::stamp((int)$course->id);
    } catch (Throwable $exception) {
        // Without a stamp the browser reloads the full state, as before.
        debugging('local_groupimport ajax stamp: ' . $exception->getMessage(), DEBUG_DEVELOPER);
    }
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response);

/**
 * Remove a group from every grouping in its course, optionally preserving one target grouping.
 *
 * @param int $groupid Group id.
 * @param int $courseid Course id.
 * @param int|null $keepgroupingid Grouping id to keep.
 * @return void
 */
function local_groupimport_remove_group_from_other_groupings(
    int $groupid,
    int $courseid,
    ?int $keepgroupingid = null
): void {
    global $DB;

    $sql = "SELECT gg.id, gg.groupingid
              FROM {groupings_groups} gg
              JOIN {groupings} g ON g.id = gg.groupingid
             WHERE gg.groupid = :groupid
               AND g.courseid = :courseid";
    $records = $DB->get_records_sql($sql, [
        'groupid' => $groupid,
        'courseid' => $courseid,
    ]);

    foreach ($records as $record) {
        if ($keepgroupingid !== null && (int)$record->groupingid === $keepgroupingid) {
            continue;
        }
        // Moodle API: also triggers grouping_group_unassigned and clears the course group cache.
        groups_unassign_grouping((int)$record->groupingid, $groupid);
    }
}



/**
 * Extract user identifier tokens from pasted text.
 *
 * @param string $text Pasted text.
 * @return array
 */
function local_groupimport_extract_user_tokens(string $text): array {
    $parts = preg_split('/[\s,;|]+/u', $text);
    $tokens = array_map(static function (string $part): string {
        return trim($part);
    }, $parts ?: []);

    return array_values(array_unique(array_filter($tokens, static function (string $token): bool {
        return $token !== '';
    })));
}

/**
 * Find a non-deleted user by Moodle id or by one of the identifier fields enabled in the plugin settings.
 *
 * @param string $token Identifier token.
 * @return \stdClass|null
 */
function local_groupimport_find_user_by_identifier(string $token): ?\stdClass {
    global $DB;

    $token = trim($token);
    if ($token === '') {
        return null;
    }

    if (ctype_digit($token)) {
        $user = $DB->get_record('user', ['id' => (int)$token, 'deleted' => 0], 'id, firstname, lastname, email');
        if ($user) {
            return $user;
        }
    }

    $config = get_config('local_groupimport');
    $allowed = !empty($config->alloweduserfields)
        ? array_map('trim', explode(',', $config->alloweduserfields))
        : ['username', 'email'];

    foreach (['email', 'username', 'idnumber'] as $field) {
        if (in_array($field, $allowed, true)) {
            $user = $DB->get_record('user', [$field => $token, 'deleted' => 0], 'id, firstname, lastname, email');
            if ($user) {
                return $user;
            }
        }
    }

    // Only the Moodle id (copied with "Copy Moodle ID") and the fields enabled in the plugin settings are
    // used: a bare first name or last name is not an identifier and is no longer matched.
    $customshortnames = [];
    foreach ($allowed as $fieldkey) {
        if (strpos($fieldkey, 'profile_field_') === 0) {
            $customshortnames[] = substr($fieldkey, strlen('profile_field_'));
        }
    }

    if (empty($customshortnames)) {
        return null;
    }

    [$fieldsql, $fieldparams] = $DB->get_in_or_equal($customshortnames, SQL_PARAMS_NAMED, 'field');
    $params = $fieldparams + ['data' => $token];
    $sql = "SELECT u.id, u.firstname, u.lastname, u.email
              FROM {user} u
              JOIN {user_info_data} d ON d.userid = u.id
              JOIN {user_info_field} f ON f.id = d.fieldid
             WHERE u.deleted = 0
               AND d.data = :data
               AND f.shortname $fieldsql";
    $matches = $DB->get_records_sql($sql, $params, 0, 2);

    return count($matches) === 1 ? reset($matches) : null;
}

/**
 * Resolve a paste in bulk, retaining numeric ID, core priority and custom ambiguity.
 */
function local_groupimport_find_users_by_identifiers(array $tokens): array {
    $pending = array_fill_keys(array_values(array_unique(array_map('trim', $tokens))), null);
    $result = [];
    $numericids = [];
    foreach ($pending as $token => $unused) {
        if (ctype_digit((string)$token)) {
            $numericids[] = (int)$token;
        }
    }
    $users = \local_groupimport\local\batch_reader::records(
        'user',
        $numericids,
        ['deleted' => 0],
        'id, firstname, lastname, email'
    );
    foreach ($pending as $token => $unused) {
        if (isset($users[(int)$token]) && ctype_digit((string)$token)) {
            $result[$token] = $users[(int)$token];
            unset($pending[$token]);
        } else if ((string)$token === '') {
            unset($pending[$token]);
        }
    }
    $config = get_config('local_groupimport');
    $allowed = !empty($config->alloweduserfields)
        ? array_map('trim', explode(',', $config->alloweduserfields)) : ['username', 'email'];
    foreach (['email', 'username', 'idnumber'] as $field) {
        if (!$pending || !in_array($field, $allowed, true)) {
            continue;
        }
        $matches = \local_groupimport\local\batch_reader::users(array_keys($pending), $field);
        foreach ($matches as $token => $records) {
            if (!$records) {
                continue;
            }
            // Historical core get_record returns its first row and emits a debug
            // notice for duplicates. Keep that API for this exceptional case.
            $result[$token] = count($records) > 1 ? local_groupimport_find_user_by_identifier((string)$token) :
                (object)array_intersect_key((array)$records[0], array_flip(['id', 'firstname', 'lastname', 'email']));
            unset($pending[$token]);
        }
    }
    $shortnames = [];
    foreach ($allowed as $field) {
        if (strpos($field, 'profile_field_') === 0) {
            $shortnames[] = substr($field, strlen('profile_field_'));
        }
    }
    if ($pending && $shortnames) {
        $matches = \local_groupimport\local\batch_reader::users(array_keys($pending), 'profile', $shortnames);
        foreach ($matches as $token => $records) {
            if (count($records) === 1) {
                $result[$token] = (object)array_intersect_key(
                    (array)$records[0],
                    array_flip(['id', 'firstname', 'lastname', 'email'])
                );
            } else if (count($records) > 1) {
                // Preserve the legacy two-row limit even across duplicate profile rows.
                $result[$token] = local_groupimport_find_user_by_identifier((string)$token);
            }
        }
    }
    return $result;
}

/**
 * Extract normalised group tokens from pasted text.
 *
 * @param string $text Pasted text.
 * @return array
 */
function local_groupimport_extract_group_tokens(string $text, array $coursegroups = []): array {
    $known = [];
    foreach ($coursegroups as $group) {
        $id = isset($group->id) ? (string)$group->id : '';
        $name = isset($group->name) ? trim((string)$group->name) : '';
        if ($id !== '') {
            $known[core_text::strtolower($id)] = true;
        }
        if ($name !== '') {
            $known[core_text::strtolower($name)] = true;
        }
    }
    $knownkeys = array_keys($known);
    usort($knownkeys, static function (string $left, string $right): int {
        $leftwords = preg_split('/\s+/u', $left) ?: [];
        $rightwords = preg_split('/\s+/u', $right) ?: [];
        $wordcomparison = count($rightwords) <=> count($leftwords);
        return $wordcomparison !== 0 ? $wordcomparison : core_text::strlen($right) <=> core_text::strlen($left);
    });

    $tokens = [];
    $parts = preg_split('/[\r\n,;|]+/u', $text) ?: [];
    foreach ($parts as $part) {
        $part = trim($part);
        if ($part === '') {
            continue;
        }

        $normalised = core_text::strtolower($part);
        if (isset($known[$normalised])) {
            $tokens[] = $normalised;
            continue;
        }

        $words = array_values(array_filter(array_map(static function (string $word): string {
            return core_text::strtolower(trim($word));
        }, preg_split('/\s+/u', $part) ?: []), static function (string $word): bool {
            return $word !== '';
        }));

        for ($index = 0; $index < count($words);) {
            $matched = '';
            foreach ($knownkeys as $knownkey) {
                $knownwords = preg_split('/\s+/u', $knownkey) ?: [];
                $knownwordcount = count($knownwords);
                if ($knownwordcount > count($words) - $index) {
                    continue;
                }
                $candidate = implode(' ', array_slice($words, $index, $knownwordcount));
                if ($candidate === $knownkey) {
                    $matched = $knownkey;
                    break;
                }
            }

            if ($matched !== '') {
                $tokens[] = $matched;
                $index += count(preg_split('/\s+/u', $matched) ?: []);
            } else {
                $tokens[] = $words[$index];
                $index++;
            }
        }
    }

    return array_values(array_unique(array_filter($tokens, static function (string $token): bool {
        return $token !== '';
    })));
}

/**
 * Extract group or grouping names from a separated quick-create field.
 *
 * @param string $text Raw field value.
 * @return array
 */
function local_groupimport_extract_create_names(string $text): array {
    return \local_groupimport\local\create_names::extract($text);
}

/**
 * Convert a 1-based number into A, B, ..., Z, AA, AB...
 *
 * @param int $number Number.
 * @return string
 */
function local_groupimport_number_to_letters(int $number): string {
    return \local_groupimport\local\create_names::number_to_letters($number);
}
