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
 * Local Group Import plugin main page.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->dirroot . '/group/lib.php'); // Fonctions groups_*.

use local_groupimport\form\import_form;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Clean an import cell value (handles BOM, NBSP, zero-width chars, trims).
 *
 * @param string $value Raw cell value.
 * @return string Cleaned cell value.
 */
function local_groupimport_clean_cell(string $value): string {
    // Remove BOM if it somehow appears at cell level.
    $value = preg_replace('/^\xEF\xBB\xBF/u', '', $value);

    // Convert non-breaking spaces to normal spaces.
    $value = str_replace("\xC2\xA0", ' ', $value);

    // Remove common zero-width characters.
    $value = preg_replace('/[\x{200B}\x{200C}\x{200D}\x{FEFF}]/u', '', $value);

    // Trim standard whitespace.
    return trim($value);
}

/**
 * Detect the CSV delimiter (';' or ',') from a line.
 *
 * @param string $line The CSV header line.
 * @return string The detected delimiter.
 */
function local_groupimport_detect_delimiter_line(string $line): string {
    $line = trim($line);
    if ($line === '') {
        return ';';
    }

    $semicolons = substr_count($line, ';');
    $commas = substr_count($line, ',');

    if ($commas > $semicolons) {
        return ',';
    }

    return ';';
}

/**
 * Parse CSV content into header + rows arrays.
 *
 * Supports both ';' and ',' delimiters (auto-detected).
 *
 * @param string $content CSV raw content.
 * @param array $errors Errors array (by reference).
 * @return array{header: array, rows: array} Parsed data.
 */
function local_groupimport_parse_csv_content(string $content, array &$errors): array {
    $lines = preg_split("/\r\n|\n|\r/", $content);

    // Find the first non-empty line to detect the delimiter.
    $headerline = null;
    foreach ($lines as $line) {
        if (trim($line) !== '') {
            $headerline = $line;
            break;
        }
    }

    if ($headerline === null) {
        $errors[] = get_string('csvempty', 'local_groupimport');
        return ['header' => [], 'rows' => []];
    }

    $delimiter = local_groupimport_detect_delimiter_line($headerline);

    // Parse header.
    $header = str_getcsv($headerline, $delimiter);
    $header = array_map('trim', $header);

    // Parse rows.
    $rows = [];
    $started = false;

    foreach ($lines as $line) {
        if (!$started) {
            // Skip the first occurrence of the header line.
            if (trim($line) === trim($headerline)) {
                $started = true;
            }
            continue;
        }

        if (trim($line) === '') {
            continue;
        }

        $data = str_getcsv($line, $delimiter);
        $data = array_map('trim', $data);
        $rows[] = $data;
    }

    return ['header' => $header, 'rows' => $rows];
}

/**
 * Parse an Excel workbook into header + rows arrays.
 *
 * @param string $content Uploaded file content.
 * @param string $filename Uploaded filename.
 * @param array $errors Errors array (by reference).
 * @return array{header: array, rows: array} Parsed data.
 */
function local_groupimport_parse_excel_content(string $content, string $filename, array &$errors): array {
    $tempdir = make_temp_directory('local_groupimport');
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $extension = in_array($extension, ['xls', 'xlsx'], true) ? $extension : 'xlsx';
    $tempfile = $tempdir . DIRECTORY_SEPARATOR . uniqid('import_', true) . '.' . $extension;

    if (file_put_contents($tempfile, $content) === false) {
        $errors[] = get_string('csvloaderror', 'local_groupimport', get_string('csvemptyfiledetail', 'local_groupimport'));
        return ['header' => [], 'rows' => []];
    }

    try {
        $reader = IOFactory::createReaderForFile($tempfile);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($tempfile);
        $worksheet = $spreadsheet->getActiveSheet();
        $rawrows = $worksheet->toArray('', false, false, false);
    } catch (Throwable $exception) {
        $errors[] = get_string('spreadsheetreaderror', 'local_groupimport');
        @unlink($tempfile);
        return ['header' => [], 'rows' => []];
    }

    @unlink($tempfile);

    $header = [];
    $rows = [];
    $headerfound = false;

    foreach ($rawrows as $rawrow) {
        $row = array_map(static function($value): string {
            return local_groupimport_clean_cell((string)$value);
        }, $rawrow);

        $hascontent = array_filter($row, static function(string $value): bool {
            return $value !== '';
        });

        if (empty($hascontent)) {
            continue;
        }

        if (!$headerfound) {
            $header = $row;
            $headerfound = true;
            continue;
        }

        $rows[] = $row;
    }

    if (!$headerfound) {
        $errors[] = get_string('csvempty', 'local_groupimport');
    }

    return ['header' => $header, 'rows' => $rows];
}

/**
 * Parse an uploaded import file according to its extension.
 *
 * @param string $content Uploaded file content.
 * @param string $filename Uploaded filename.
 * @param array $errors Errors array (by reference).
 * @return array{header: array, rows: array} Parsed data.
 */
function local_groupimport_parse_import_content(string $content, string $filename, array &$errors): array {
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    if (in_array($extension, ['xls', 'xlsx'], true)) {
        return local_groupimport_parse_excel_content($content, $filename, $errors);
    }

    return local_groupimport_parse_csv_content($content, $errors);
}

/**
 * Normalise a column header for tolerant matching.
 *
 * @param string $header Column header.
 * @return string Normalised header.
 */
function local_groupimport_normalise_import_header(string $header): string {
    $header = local_groupimport_clean_cell($header);
    $header = core_text::strtolower($header);
    $header = preg_replace('/[^a-z0-9]+/u', '', $header);

    return $header ?? '';
}

/**
 * Find the best matching import column.
 *
 * @param array $normalisedheaders Normalised headers.
 * @param array $aliases Accepted aliases.
 * @return int|false Matching index or false.
 */
function local_groupimport_find_import_column(array $normalisedheaders, array $aliases) {
    foreach ($aliases as $alias) {
        $index = array_search($alias, $normalisedheaders, true);
        if ($index !== false) {
            return $index;
        }
    }

    return false;
}

/**
 * Return user identification fields allowed for imports.
 *
 * @return array Allowed user fields.
 */
function local_groupimport_get_allowed_import_userfields(): array {
    global $DB;

    $alloptions = [
        'username' => get_string('username'),
        'email' => get_string('email'),
        'idnumber' => get_string('idnumber'),
    ];

    $customfields = $DB->get_records('user_info_field', null, 'name ASC');
    foreach ($customfields as $field) {
        $alloptions['profile_field_' . $field->shortname] = format_string($field->name);
    }

    $config = get_config('local_groupimport');
    $allowed = !empty($config->alloweduserfields)
        ? array_map('trim', explode(',', $config->alloweduserfields))
        : ['username'];

    $allowed = array_filter($allowed, static function(string $value): bool {
        return $value !== '';
    });

    $options = array_intersect_key($alloptions, array_flip($allowed));

    return empty($options) ? ['username' => get_string('username')] : $options;
}

/**
 * Convert parsed data into editable preview rows.
 *
 * @param array $parsed Parsed data.
 * @param array $errors Errors array (by reference).
 * @return array Preview rows.
 */
function local_groupimport_build_preview_rows(array $parsed, array &$errors): array {
    $columns = $parsed['header'];
    $rows = $parsed['rows'];

    if (empty($columns)) {
        if (empty($errors)) {
            $errors[] = get_string('csvmissingcolumns', 'local_groupimport');
        }
        return [];
    }

    $normalised = array_map('local_groupimport_normalise_import_header', $columns);

    $identifierindex = local_groupimport_find_import_column($normalised, [
        'useridentifier', 'userid', 'user', 'username', 'email', 'idnumber', 'identifier',
        'identifiant', 'identifiantutilisateur', 'utilisateur', 'mail', 'courriel',
        'studentidentifier', 'student', 'studentid', 'studentlogin', 'studentemail',
        'learneridentifier', 'learner', 'learnerid', 'apprenant', 'identifiantapprenant',
        'identifiantdelapprenant', 'etudiant', 'identifiantetudiant', 'eleve', 'identifianteleve',
    ]);
    $groupnameindex = local_groupimport_find_import_column($normalised, [
        'groupname', 'group', 'groups', 'groupid', 'groupe', 'nomdegroupe', 'nomdugroupe',
    ]);
    $groupingindex = local_groupimport_find_import_column($normalised, [
        'groupingname', 'groupingnameoptional', 'grouping', 'groupings', 'groupingid', 'groupement',
        'nomdegroupement', 'nomdugroupement', 'nomdugroupementfacultatif',
    ]);

    if ($identifierindex === false || $groupnameindex === false) {
        $errors[] = get_string('csvmissingcolumns', 'local_groupimport');
        return [];
    }

    $previewrows = [];
    foreach ($rows as $lineindex => $line) {
        $identifier = isset($line[$identifierindex]) ? local_groupimport_clean_cell((string)$line[$identifierindex]) : '';
        $groupname = isset($line[$groupnameindex]) ? local_groupimport_clean_cell((string)$line[$groupnameindex]) : '';
        $groupingname = ($groupingindex !== false && isset($line[$groupingindex]))
            ? local_groupimport_clean_cell((string)$line[$groupingindex])
            : '';

        if ($identifier === '' && $groupname === '' && $groupingname === '') {
            continue;
        }

        $previewrows[] = [
            'line' => $lineindex + 2,
            'identifier' => $identifier,
            'groupname' => $groupname,
            'groupingname' => $groupingname,
        ];
    }

    return $previewrows;
}

/**
 * Find users matching an identifier for one import identification field.
 *
 * @param string $identifier User identifier.
 * @param string $userfield Identification field.
 * @return array User records.
 */
function local_groupimport_find_import_users_by_field(string $identifier, string $userfield): array {
    global $DB;

    if ($userfield === 'email') {
        $identifier = strtolower(preg_replace('/\s+/u', '', $identifier));
    }

    if ($userfield === 'username') {
        return $DB->get_records('user', ['username' => $identifier, 'deleted' => 0], '', '*', 0, 2);
    }

    if ($userfield === 'email') {
        return $DB->get_records('user', ['email' => $identifier, 'deleted' => 0], '', '*', 0, 2);
    }

    if ($userfield === 'idnumber') {
        return $DB->get_records('user', ['idnumber' => $identifier, 'deleted' => 0], '', '*', 0, 2);
    }

    if (strpos($userfield, 'profile_field_') === 0) {
        $shortname = substr($userfield, strlen('profile_field_'));
        $sql = "SELECT u.*
                  FROM {user} u
                  JOIN {user_info_data} d ON d.userid = u.id
                  JOIN {user_info_field} f ON f.id = d.fieldid
                 WHERE f.shortname = :shortname
                   AND d.data = :data
                   AND u.deleted = 0";
        return $DB->get_records_sql($sql, [
            'shortname' => $shortname,
            'data' => $identifier,
        ], 0, 2);
    }

    return [];
}

/**
 * Automatically find a user by testing every configured identification field.
 *
 * @param string $identifier User identifier.
 * @param array $errors Errors array (by reference).
 * @return stdClass|null User record, if exactly one user is matched.
 */
function local_groupimport_find_import_user(string $identifier, array &$errors): ?stdClass {
    $allowedfields = local_groupimport_get_allowed_import_userfields();
    $matches = [];
    $matchedlabels = [];

    foreach ($allowedfields as $fieldkey => $fieldlabel) {
        $fieldmatches = local_groupimport_find_import_users_by_field($identifier, $fieldkey);
        foreach ($fieldmatches as $userid => $user) {
            $matches[$userid] = $user;
            $matchedlabels[$userid][] = $fieldlabel;
        }
    }

    if (count($matches) === 1) {
        return reset($matches);
    }

    if (count($matches) > 1) {
        $errors[] = get_string('userautomaticmultiplematches', 'local_groupimport', $identifier);
        return null;
    }

    $errors[] = get_string('userautomaticnotfound', 'local_groupimport', $identifier);
    return null;
}

/**
 * Validate preview rows for user feedback before final confirmation.
 *
 * @param array $rows Preview rows.
 * @param context_course $context Course context.
 * @return array Validation messages keyed by row index.
 */
function local_groupimport_validate_preview_rows(array $rows, context_course $context): array {
    global $DB;

    $messages = [];

    foreach ($rows as $index => $row) {
        $rowmessages = [];
        $identifier = local_groupimport_clean_cell((string)($row['identifier'] ?? ''));
        $groupname = local_groupimport_clean_cell((string)($row['groupname'] ?? ''));
        $groupingname = local_groupimport_clean_cell((string)($row['groupingname'] ?? ''));

        if ($identifier === '' || $groupname === '') {
            $rowmessages[] = get_string('csvinvalidrowmissing', 'local_groupimport');
        } else {
            $lookupmessages = [];
            $user = local_groupimport_find_import_user($identifier, $lookupmessages);
            if (!$user) {
                $rowmessages = array_merge($rowmessages, $lookupmessages);
            } else if (!is_enrolled($context, $user->id)) {
                $rowmessages[] = get_string('usernotenrolled', 'local_groupimport', $identifier);
            } else {
                $groupid = groups_get_group_by_name($context->instanceid, $groupname);
                if ($groupid && groups_is_member($groupid, $user->id)) {
                    $rowmessages[] = get_string('previewuseralreadyingroup', 'local_groupimport');
                }

                if ($groupid && $groupingname !== '') {
                    $groupingid = $DB->get_field('groupings', 'id', [
                        'courseid' => $context->instanceid,
                        'name' => $groupingname,
                    ]);
                    if ($groupingid && $DB->record_exists('groupings_groups', [
                        'groupingid' => $groupingid,
                        'groupid' => $groupid,
                    ])) {
                        $rowmessages[] = get_string('previewgroupalreadyingrouping', 'local_groupimport');
                    }
                }
            }
        }

        $messages[$index] = $rowmessages;
    }

    return $messages;
}

/**
 * Whether the import history table is available in this plugin installation.
 *
 * @return bool
 */
function local_groupimport_history_table_exists(): bool {
    global $DB;

    static $exists = null;
    if ($exists !== null) {
        return $exists;
    }

    $exists = $DB->get_manager()->table_exists(new xmldb_table('local_groupimport_history'));
    return $exists;
}

/**
 * Record a confirmed course import in the course-level history.
 *
 * @param int $courseid Course id.
 * @param int $userid User id.
 * @param string $filename Uploaded filename.
 * @param string $filehash Uploaded content hash.
 * @param int $rowcount Number of confirmed rows.
 * @param int $successcount Number of success messages.
 * @param int $errorcount Number of error messages.
 * @param string $replacepolicy Selected replacement policy.
 * @param array $changes Operations, target state and report rows recorded for the import.
 * @return int Inserted history id, or zero when history is unavailable.
 */
function local_groupimport_record_import_history(
    int $courseid,
    int $userid,
    string $filename,
    string $filehash,
    int $rowcount,
    int $successcount,
    int $errorcount,
    string $replacepolicy,
    array $changes
): int {
    global $DB;

    if (!local_groupimport_history_table_exists()) {
        return 0;
    }

    $record = (object)[
        'courseid' => $courseid,
        'userid' => $userid,
        'filename' => clean_param($filename, PARAM_TEXT),
        'filehash' => clean_param($filehash, PARAM_ALPHANUM),
        'rowcount' => $rowcount,
        'successcount' => $successcount,
        'errorcount' => $errorcount,
        'replacepolicy' => clean_param($replacepolicy, PARAM_ALPHA),
        'changesjson' => json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
    ];
    return (int)$DB->insert_record('local_groupimport_history', $record);
}

/**
 * Get recent course import history records.
 *
 * @param int $courseid Course id.
 * @param int $limit Max records.
 * @return array
 */
function local_groupimport_get_import_history(int $courseid, int $limit = 20): array {
    global $DB;

    if (!local_groupimport_history_table_exists()) {
        return [];
    }

    return $DB->get_records('local_groupimport_history', ['courseid' => $courseid], 'timecreated DESC', '*', 0, $limit);
}

/**
 * Get the last import using the same file hash in the course.
 *
 * @param int $courseid Course id.
 * @param string $filehash File hash.
 * @return stdClass|null
 */
function local_groupimport_get_matching_import_history(int $courseid, string $filehash): ?stdClass {
    global $DB;

    if (!local_groupimport_history_table_exists() || $filehash === '') {
        return null;
    }

    $records = $DB->get_records('local_groupimport_history', [
        'courseid' => $courseid,
        'filehash' => $filehash,
    ], 'timecreated DESC', '*', 0, 1);

    return $records ? reset($records) : null;
}

/**
 * Process confirmed import rows.
 *
 * @param array $rows Confirmed rows.
 * @param stdClass $course Course record.
 * @param context_course $context Course context.
 * @param array $success Success messages.
 * @param array $errors Error messages.
 * @param string $replacepolicy Import update strategy.
 * @return array Operations, target state and report rows recorded for the import.
 */
function local_groupimport_process_import_rows(
    array $rows,
    stdClass $course,
    context_course $context,
    array &$success,
    array &$errors,
    string $replacepolicy = 'keep'
): array {
    global $DB;

    $changes = [
        'createdgroups' => [],
        'createdgroupings' => [],
        'addedmembers' => [],
        'assignedgroupings' => [],
        'removedmembers' => [],
        'unassignedgroupings' => [],
        'desiredstate' => [],
        'reportrows' => [],
    ];
    $targetmembers = [];
    $targetgroupings = [];

    foreach ($rows as $row) {
        $identifier = local_groupimport_clean_cell((string)($row['identifier'] ?? ''));
        $groupname = local_groupimport_clean_cell((string)($row['groupname'] ?? ''));
        $groupingname = local_groupimport_clean_cell((string)($row['groupingname'] ?? ''));
        $reportrow = [
            'identifier' => $identifier,
            'groupname' => $groupname,
            'groupingname' => $groupingname,
            'status' => 'success',
            'messages' => [],
        ];

        if ($identifier === '' && $groupname === '') {
            continue;
        }

        if ($identifier === '' || $groupname === '') {
            $message = get_string('csvinvalidrowmissing', 'local_groupimport');
            $errors[] = $message;
            $reportrow['status'] = 'error';
            $reportrow['messages'][] = $message;
            $changes['reportrows'][] = $reportrow;
            continue;
        }

        $errorcount = count($errors);
        $user = local_groupimport_find_import_user($identifier, $errors);
        if (!$user) {
            $reportrow['status'] = 'error';
            $reportrow['messages'] = array_slice($errors, $errorcount);
            $changes['reportrows'][] = $reportrow;
            continue;
        }

        if (!is_enrolled($context, $user->id)) {
            $message = get_string('usernotenrolled', 'local_groupimport', $identifier);
            $errors[] = $message;
            $reportrow['status'] = 'error';
            $reportrow['messages'][] = $message;
            $changes['reportrows'][] = $reportrow;
            continue;
        }

        $groupid = groups_get_group_by_name($course->id, $groupname);
        if (!$groupid) {
            $groupdata = new stdClass();
            $groupdata->courseid = $course->id;
            $groupdata->name = $groupname;

            $groupid = groups_create_group($groupdata);
            if (!$groupid) {
                $message = get_string('groupcreatefailed', 'local_groupimport', (object)[
                    'groupname' => $groupname,
                    'identifier' => $identifier,
                ]);
                $errors[] = $message;
                $reportrow['status'] = 'error';
                $reportrow['messages'][] = $message;
                $changes['reportrows'][] = $reportrow;
                continue;
            }
            $changes['createdgroups'][] = [
                'id' => (int)$groupid,
                'name' => $groupname,
            ];
        }

        $groupingid = 0;
        if ($groupingname !== '') {
            $groupingid = $DB->get_field('groupings', 'id', [
                'courseid' => $course->id,
                'name' => $groupingname,
            ]);

            if (!$groupingid) {
                $groupingdata = new stdClass();
                $groupingdata->courseid = $course->id;
                $groupingdata->name = $groupingname;

                $groupingid = groups_create_grouping($groupingdata);
                if (!$groupingid) {
                    $message = get_string('groupingcreatefailed', 'local_groupimport', (object)[
                        'groupingname' => $groupingname,
                        'groupname' => $groupname,
                    ]);
                    $errors[] = $message;
                    $reportrow['status'] = 'error';
                    $reportrow['messages'][] = $message;
                } else {
                    $changes['createdgroupings'][] = [
                        'id' => (int)$groupingid,
                        'name' => $groupingname,
                    ];
                }
            }

            if ($groupingid && !$DB->record_exists('groupings_groups', [
                'groupingid' => $groupingid,
                'groupid' => $groupid,
            ])) {
                groups_assign_grouping($groupingid, $groupid);
                $changes['assignedgroupings'][] = [
                    'groupingid' => (int)$groupingid,
                    'groupid' => (int)$groupid,
                ];
            }
        }

        $targetmembers[$groupid][(int)$user->id] = true;
        $targetgroupings[$groupid] = $targetgroupings[$groupid] ?? [];
        if (!empty($groupingid)) {
            $targetgroupings[$groupid][(int)$groupingid] = true;
        }

        $changes['desiredstate'][] = [
            'userid' => (int)$user->id,
            'identifier' => $identifier,
            'groupname' => $groupname,
            'groupingname' => $groupingname,
        ];

        if (!groups_is_member($groupid, $user->id)) {
            groups_add_member($groupid, $user->id);
            $changes['addedmembers'][] = [
                'groupid' => (int)$groupid,
                'userid' => (int)$user->id,
            ];

            $a = (object)[
                'identifier' => $identifier,
                'groupname' => $groupname,
            ];

            if ($groupingname !== '') {
                $a->groupingname = $groupingname;
                $success[] = get_string('useraddedtogroupwithgrouping', 'local_groupimport', $a);
            } else {
                $success[] = get_string('useraddedtogroup', 'local_groupimport', $a);
            }
        } else {
            $message = get_string('useralreadyingroup', 'local_groupimport', (object)[
                'identifier' => $identifier,
                'groupname' => $groupname,
            ]);
            $errors[] = $message;
            if ($reportrow['status'] !== 'error') {
                $reportrow['status'] = 'warning';
            }
            $reportrow['messages'][] = $message;
        }
        if (empty($reportrow['messages'])) {
            $reportrow['messages'][] = get_string('importexportapplied', 'local_groupimport');
        }
        $changes['reportrows'][] = $reportrow;
    }

    if ($replacepolicy === 'replace') {
        foreach ($targetmembers as $groupid => $expectedmembers) {
            $currentmembers = $DB->get_records('groups_members', ['groupid' => $groupid], '', 'id,userid');
            foreach ($currentmembers as $currentmember) {
                if (isset($expectedmembers[(int)$currentmember->userid])) {
                    continue;
                }
                groups_remove_member((int)$groupid, (int)$currentmember->userid);
                $changes['removedmembers'][] = [
                    'groupid' => (int)$groupid,
                    'userid' => (int)$currentmember->userid,
                ];
                $success[] = get_string('importreplaceremovedmember', 'local_groupimport');
            }

            $currentassignments = $DB->get_records('groupings_groups', ['groupid' => $groupid], '',
                'id,groupingid,groupid');
            foreach ($currentassignments as $currentassignment) {
                if (isset($targetgroupings[$groupid][(int)$currentassignment->groupingid])) {
                    continue;
                }
                groups_unassign_grouping((int)$currentassignment->groupingid, (int)$groupid);
                $changes['unassignedgroupings'][] = [
                    'groupingid' => (int)$currentassignment->groupingid,
                    'groupid' => (int)$groupid,
                ];
                $success[] = get_string('importreplaceunassignedgroup', 'local_groupimport');
            }
        }
    }

    return $changes;
}

/**
 * Restore the target state recorded for one import.
 *
 * @param stdClass $history Import history record.
 * @param int $userid User performing the rollback.
 * @return stdClass Rollback counters.
 */
function local_groupimport_rollback_import(stdClass $history, int $userid): stdClass {
    global $DB;

    $changes = json_decode((string)($history->changesjson ?? ''), true);
    if (!is_array($changes)) {
        throw new moodle_exception('importrollbackunavailable', 'local_groupimport');
    }

    $desiredstate = local_groupimport_history_desired_state($changes, (int)$history->courseid);
    if (empty($desiredstate)) {
        throw new moodle_exception('importrollbackunavailable', 'local_groupimport');
    }

    $context = context_course::instance((int)$history->courseid);
    $transaction = $DB->start_delegated_transaction();

    $result = (object)[
        'members' => 0,
        'assignments' => 0,
        'groups' => 0,
        'groupings' => 0,
        'removedmembers' => 0,
        'unassigned' => 0,
        'skipped' => 0,
    ];

    $targetmembers = [];
    $targetgroupings = [];
    foreach ($desiredstate as $row) {
        $memberid = (int)($row['userid'] ?? 0);
        $groupname = clean_param((string)($row['groupname'] ?? ''), PARAM_TEXT);
        $groupingname = clean_param((string)($row['groupingname'] ?? ''), PARAM_TEXT);
        if (!$memberid || $groupname === '' || !$DB->record_exists('user', ['id' => $memberid]) ||
                !is_enrolled($context, $memberid)) {
            $result->skipped++;
            continue;
        }

        $groupid = groups_get_group_by_name((int)$history->courseid, $groupname);
        if (!$groupid) {
            $groupid = groups_create_group((object)[
                'courseid' => (int)$history->courseid,
                'name' => $groupname,
            ]);
            $result->groups++;
        }
        $targetmembers[$groupid][$memberid] = true;

        if (!groups_is_member($groupid, $memberid)) {
            groups_add_member($groupid, $memberid);
            $result->members++;
        }

        if ($groupingname === '') {
            continue;
        }
        $groupingid = $DB->get_field('groupings', 'id', [
            'courseid' => (int)$history->courseid,
            'name' => $groupingname,
        ]);
        if (!$groupingid) {
            $groupingid = groups_create_grouping((object)[
                'courseid' => (int)$history->courseid,
                'name' => $groupingname,
            ]);
            $result->groupings++;
        }
        $targetgroupings[$groupid][$groupingid] = true;
        if (!$DB->record_exists('groupings_groups', ['groupingid' => $groupingid, 'groupid' => $groupid])) {
            groups_assign_grouping($groupingid, $groupid);
            $result->assignments++;
        }
    }

    if (($history->replacepolicy ?? 'keep') === 'replace') {
        foreach ($targetmembers as $groupid => $expectedmembers) {
            $members = $DB->get_records('groups_members', ['groupid' => $groupid], '', 'id,userid');
            foreach ($members as $member) {
                if (!isset($expectedmembers[(int)$member->userid])) {
                    groups_remove_member((int)$groupid, (int)$member->userid);
                    $result->removedmembers++;
                }
            }
            $assignments = $DB->get_records('groupings_groups', ['groupid' => $groupid], '', 'id,groupingid');
            foreach ($assignments as $assignment) {
                if (!isset($targetgroupings[$groupid][(int)$assignment->groupingid])) {
                    groups_unassign_grouping((int)$assignment->groupingid, (int)$groupid);
                    $result->unassigned++;
                }
            }
        }
    }

    $DB->set_field('local_groupimport_history', 'rollbackuserid', $userid, ['id' => $history->id]);
    $DB->set_field('local_groupimport_history', 'timerolledback', time(), ['id' => $history->id]);
    $transaction->allow_commit();

    return $result;
}

// Try to retrieve the course id via GET or POST.
$id = optional_param('id', 0, PARAM_INT);
if (!$id) {
    throw new moodle_exception('missingparam', 'error', '', 'id');
}

$course = get_course($id);
require_login($course);

$context = context_course::instance($course->id);

// Only users who can manage groups may use this tool.
require_capability('moodle/course:managegroups', $context);

$PAGE->set_url(new moodle_url('/local/groupimport/index.php', ['id' => $course->id]));
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title(get_string('groupimport', 'local_groupimport'));
$PAGE->set_heading(format_string($course->fullname));
$animationconfig = get_config('local_groupimport', 'enableanimations');
$animationsenabled = $animationconfig === false ? true : (bool)$animationconfig;
if (!$animationsenabled) {
    $PAGE->add_body_class('local-groupimport-motion-disabled');
    $PAGE->add_body_class('easyedu-motion-disabled');
}
$PAGE->requires->js('/local/groupimport/js/loading_state_bootstrap.js', true);
$PAGE->requires->js_call_amd('local_groupimport/easyedu_navigation', 'init', [
    '#local-groupimport-import-navigation',
]);
$PAGE->requires->js_call_amd('local_groupimport/csv_import', 'init', [
    'local-groupimport-import',
    [
        'dropready' => get_string('csvdropready', 'local_groupimport'),
        'dropsubtitle' => get_string('csvdropsubtitle', 'local_groupimport'),
    ],
]);

$mform = new import_form(null, ['courseid' => $course->id]);
$allowedimportfields = local_groupimport_get_allowed_import_userfields();

$success = [];
$errors = [];
$preview = null;
$currenthistoryid = 0;

$rollbackhistoryid = optional_param('rollbackhistoryid', 0, PARAM_INT);
if ($rollbackhistoryid) {
    global $USER, $DB;

    require_sesskey();
    $history = $DB->get_record('local_groupimport_history', [
        'id' => $rollbackhistoryid,
        'courseid' => $course->id,
    ], '*', MUST_EXIST);

    try {
        $rollback = local_groupimport_rollback_import($history, (int)$USER->id);
        $success[] = get_string('importrollbacksuccess', 'local_groupimport', $rollback);
    } catch (moodle_exception $exception) {
        $errors[] = $exception->getMessage();
    }
}

$confirmimport = optional_param('confirmimport', 0, PARAM_BOOL);

if ($confirmimport) {
    global $USER;

    require_sesskey();

    $enabledrows = optional_param_array('rowenabled', [], PARAM_INT);
    $identifiers = optional_param_array('identifier', [], PARAM_RAW_TRIMMED);
    $groupnames = optional_param_array('groupname', [], PARAM_RAW_TRIMMED);
    $groupingnames = optional_param_array('groupingname', [], PARAM_RAW_TRIMMED);
    $importfilename = optional_param('importfilename', '', PARAM_TEXT);
    $importhash = optional_param('importhash', '', PARAM_ALPHANUM);
    $replacepolicy = optional_param('replacepolicy', 'keep', PARAM_ALPHA);
    if (!in_array($replacepolicy, ['keep', 'replace'], true)) {
        $replacepolicy = 'keep';
    }

    $confirmedrows = [];
    foreach ($enabledrows as $index => $enabled) {
        if (!$enabled) {
            continue;
        }

        $confirmedrows[] = [
            'identifier' => $identifiers[$index] ?? '',
            'groupname' => $groupnames[$index] ?? '',
            'groupingname' => $groupingnames[$index] ?? '',
        ];
    }

    if (empty($confirmedrows)) {
        $errors[] = get_string('importnorowsselected', 'local_groupimport');
    } else {
        $changes = local_groupimport_process_import_rows(
            $confirmedrows,
            $course,
            $context,
            $success,
            $errors,
            $replacepolicy
        );
        $currenthistoryid = local_groupimport_record_import_history(
            (int)$course->id,
            (int)$USER->id,
            $importfilename !== '' ? $importfilename : get_string('unknownfile', 'local_groupimport'),
            $importhash,
            count($confirmedrows),
            count($success),
            count($errors),
            $replacepolicy,
            $changes
        );
    }
} else if ($mform->is_cancelled()) {
    redirect(course_get_url($course));

} else if ($data = $mform->get_data()) {
    // Retrieve uploaded file content.
    $content = $mform->get_file_content('importfile');
    $filename = $mform->get_new_filename('importfile');
    if (empty($filename)) {
        $filename = 'import.csv';
    }

    // Global BOM cleanup at the beginning of the file (if present).
    if (is_string($content) && substr($content, 0, 3) === "\xEF\xBB\xBF") {
        $content = substr($content, 3);
    }

    if ($content === false || $content === null || $content === '') {
        $errors[] = get_string('csvloaderror', 'local_groupimport', get_string('csvemptyfiledetail', 'local_groupimport'));
    } else {
        $filehash = hash('sha256', $content);
        $parsed = local_groupimport_parse_import_content($content, $filename, $errors);
        $previewrows = local_groupimport_build_preview_rows($parsed, $errors);

        if (!empty($previewrows)) {
            $preview = [
                'filename' => $filename,
                'filehash' => $filehash,
                'previousimport' => local_groupimport_get_matching_import_history((int)$course->id, $filehash),
                'rows' => $previewrows,
                'messages' => local_groupimport_validate_preview_rows($previewrows, $context),
            ];
        } else if (empty($errors)) {
            $errors[] = get_string('importnorowsdetected', 'local_groupimport');
        }
    }
}

$mform = new import_form(null, [
    'courseid' => $course->id,
    'submitlabel' => $preview !== null
        ? get_string('replacefile', 'local_groupimport')
        : get_string('previewimport', 'local_groupimport'),
]);
$historyrecords = local_groupimport_get_import_history((int)$course->id);

// Output.
echo $OUTPUT->header();

// The shared navigation replaces the legacy Mass Import action row only. The
// Skeleton lifecycle, its root attributes and real-content wrapper stay owned
// by the loading implementation.
$navigationdata = local_groupimport_build_mass_import_navigation_context($course);
$themestyle = local_groupimport_get_theme_style();
$themerailroles = local_groupimport_get_theme_rail_roles();
$navigationmarkup = html_writer::tag('div',
    $OUTPUT->render_from_template('local_groupimport/easyedu_navigation', $navigationdata),
    [
        'class' => 'local-groupimport-import-navigation local-groupimport-easystud local-groupimport-easystud__navigation',
        'data-region' => 'local-groupimport-import-navigation',
        'style' => $themestyle,
    ]
);

// Main container.
echo html_writer::start_div('local-groupimport-import easyedu-ui' . ($preview !== null ? ' has-preview is-upload-collapsed' : ''), [
    'id' => 'local-groupimport-import',
    'data-region' => 'local-groupimport-import',
    'data-easyedu-motion-policy' => $animationsenabled ? 'enabled' : 'disabled',
    'data-easystud-loading-state' => 'loading',
    'data-easyedu-loading-bootstrap' => '1',
    'data-easyedu-loading-ready-attribute' => 'data-easyedu-loading-ready',
    'data-easyedu-action-busy-label' => get_string('actioninprogress', 'local_groupimport'),
    'data-easyedu-custom-rails' => $themerailroles,
    'style' => $themestyle,
]);

echo html_writer::start_div('local-groupimport-import__loading-skeleton', [
    'data-easystud-loading-skeleton' => '1',
    'data-easyedu-navigation-skeleton' => '1',
    'aria-hidden' => 'true',
]);
echo html_writer::start_div('local-groupimport-import__loading-header');
echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-eyebrow']);
echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-title']);
echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-intro']);
echo html_writer::end_div();
echo html_writer::start_div('local-groupimport-import__loading-navigation', [
    'aria-hidden' => 'true',
]);
echo html_writer::tag('div',
    html_writer::tag('span', '', [
        'class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-navigation-guide',
    ]) .
    html_writer::tag('div',
        html_writer::tag('span', '', [
            'class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-navigation-cue',
        ]),
        ['class' => 'local-groupimport-import__loading-navigation-cues']
    ),
    ['class' => 'local-groupimport-import__loading-navigation-frame']
);
echo html_writer::end_div();
echo html_writer::start_div('local-groupimport-import__loading-grid');
for ($skeletoncard = 0; $skeletoncard < 2; $skeletoncard++) {
    echo html_writer::start_div('local-groupimport-import__loading-card');
    echo html_writer::tag('div',
        html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-icon']) .
        html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-card-title']),
        ['class' => 'local-groupimport-import__loading-card-header']
    );
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-field']);
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-field local-groupimport-import__loading-field--short']);
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-row']);
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-row']);
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-button']);
    echo html_writer::end_div();
}
echo html_writer::end_div();
echo html_writer::end_div();

// Without JavaScript the classic bootstrap cannot release the loading state.
// Reveal the already server-rendered form and navigation instead of leaving a
// decorative Skeleton as the only visible Mass Import surface.
echo html_writer::tag('noscript', html_writer::tag('style',
    '#local-groupimport-import[data-easystud-loading-state="loading"] > [data-easystud-loading-skeleton] { display: none !important; }' .
        '#local-groupimport-import[data-easystud-loading-state="loading"] > [data-easystud-real-content] { display: block !important; }'
));

echo html_writer::start_div('local-groupimport-import__content', [
    'data-easystud-real-content' => '1',
]);

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::span(get_string('easystudlabel', 'local_groupimport'), 'local-groupimport-import__eyebrow') .
        html_writer::tag('h2', get_string('groupimport', 'local_groupimport'), [
            'class' => 'local-groupimport-import__title easyedu-page-title',
        ]) .
        html_writer::tag('p', get_string('importfile_help', 'local_groupimport'), [
            'class' => 'local-groupimport-import__intro easyedu-body',
        ])
    ) .
    $navigationmarkup,
    ['class' => 'local-groupimport-import__header easyedu-page-header']
);

echo html_writer::start_div('local-groupimport-import__grid');

$uploadtoggle = '';
if ($preview !== null) {
    $uploadtoggle = html_writer::tag('button',
        html_writer::tag('span', '', ['class' => 'fa fa-chevron-right', 'aria-hidden' => 'true']),
        [
            'type' => 'button',
            'class' => 'easyedu-button easyedu-button--icon local-groupimport-import-card__toggle',
            'data-local-groupimport-upload-toggle' => '1',
            'data-expand-label' => get_string('expanduploadpanel', 'local_groupimport'),
            'data-collapse-label' => get_string('collapseuploadpanel', 'local_groupimport'),
            'aria-expanded' => 'false',
            'aria-label' => get_string('expanduploadpanel', 'local_groupimport'),
        ]
    );
}

// Form card.
echo html_writer::start_div('local-groupimport-import-card local-groupimport-import-card--upload easyedu-panel');
echo html_writer::tag('div',
    html_writer::tag('span', '', [
        'class' => 'fa fa-file-csv easyedu-icon-tile easyedu-icon-tile--compact',
        'aria-hidden' => 'true',
    ]) .
    html_writer::tag('div',
        html_writer::tag('h3', get_string('importfile', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__title easyedu-panel__title',
        ]) .
        html_writer::tag('p', get_string('csvimportintro', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__description easyedu-panel__description',
        ])
        , ['class' => 'easyedu-panel__copy']
    ) .
    $uploadtoggle,
    ['class' => 'local-groupimport-import-card__header easyedu-panel__header easyedu-panel__header--compact-icon']
);

$fieldtags = [];
foreach ($allowedimportfields as $fieldlabel) {
    $fieldtags[] = html_writer::tag('span', s($fieldlabel), [
        'class' => 'local-groupimport-import-fields__tag easyedu-tag',
    ]);
}

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::tag('span',
            html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']),
            ['class' => 'local-groupimport-import-fields__icon easyedu-icon-tile easyedu-icon-tile--compact', 'aria-hidden' => 'true']
        ) .
        html_writer::tag('div',
            html_writer::tag('strong', get_string('importautodetecttitle', 'local_groupimport'),
                ['class' => 'easyedu-information__title']) .
            html_writer::tag('p', get_string('importautodetectintro', 'local_groupimport'),
                ['class' => 'easyedu-information__description'])
        ),
        ['class' => 'local-groupimport-import-fields__header easyedu-information__header easyedu-information__header--compact-icon']
    ) .
    html_writer::tag('p', get_string('importfieldsavailable', 'local_groupimport'), [
        'class' => 'local-groupimport-import-fields__label easyedu-information__label',
    ]) .
    html_writer::tag('div', implode("\n", $fieldtags), ['class' => 'local-groupimport-import-fields__tags easyedu-tag-list']),
    ['class' => 'local-groupimport-import-fields easyedu-information']
);

// Moodle form (with filepicker).
echo html_writer::start_div('local-groupimport-import-form easyedu-form--deposit', [
    'id' => 'local_groupimport-form',
    'data-local-groupimport-import-form' => '1',
]);
$mform->display();
echo html_writer::end_div();

echo html_writer::end_div(); // Card.

// Results card.
echo html_writer::start_div(
    'local-groupimport-import-card local-groupimport-import-card--results easyedu-panel easyedu-panel--success',
    ['id' => 'local_groupimport-results']
);
echo html_writer::tag('div',
    html_writer::tag('span', '', [
        'class' => 'fa fa-clipboard-check easyedu-icon-tile easyedu-icon-tile--compact easyedu-icon-tile--success',
        'aria-hidden' => 'true',
    ]) .
    html_writer::tag('div',
        html_writer::tag('h3', get_string('importresults', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__title easyedu-panel__title',
        ]) .
        html_writer::tag('p', get_string('csvreportintro', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__description easyedu-panel__description',
        ])
        , ['class' => 'easyedu-panel__copy']
    ),
    ['class' => 'local-groupimport-import-card__header easyedu-panel__header easyedu-panel__header--compact-icon']
);

if ($preview !== null) {
    $rowcount = count($preview['rows']);
    $warningcount = count(array_filter($preview['messages'], static function(array $messages): bool {
        return !empty($messages);
    }));

    echo html_writer::tag('div',
        html_writer::tag('span',
            html_writer::tag('strong', $rowcount) . ' ' . get_string('importpreviewrows', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--success']
        ) .
        html_writer::tag('span',
            html_writer::tag('strong', $warningcount) . ' ' . get_string('importpreviewwarnings', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--error']
        ),
        ['class' => 'local-groupimport-import-summary']
    );

    echo html_writer::start_tag('form', [
        'method' => 'post',
        'action' => new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
        'class' => 'local-groupimport-import-preview',
    ]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'id', 'value' => $course->id]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'confirmimport', 'value' => 1]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'importfilename', 'value' => $preview['filename']]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'importhash', 'value' => $preview['filehash']]);

    echo html_writer::tag('div',
        html_writer::tag('span', '', ['class' => 'fa fa-magic', 'aria-hidden' => 'true']) .
        html_writer::tag('div',
            html_writer::tag('strong', get_string('importpreviewtitle', 'local_groupimport')) .
            html_writer::tag('p', get_string('importpreviewintro', 'local_groupimport', s($preview['filename'])), [
                'class' => 'mb-0',
            ])
        ),
        ['class' => 'local-groupimport-import-preview__notice easyedu-notice']
    );

    if (!empty($preview['previousimport'])) {
        echo html_writer::tag('div',
            html_writer::tag('span', '', ['class' => 'fa fa-history', 'aria-hidden' => 'true']) .
            html_writer::tag('p',
                get_string('previewpreviousimport', 'local_groupimport',
                    userdate((int)$preview['previousimport']->timecreated)),
                ['class' => 'mb-0']
            ),
            ['class' => 'local-groupimport-import-preview__reimport-alert']
        );
    }

    $strategyoptions = html_writer::tag('label',
        html_writer::empty_tag('input', [
            'type' => 'radio',
            'name' => 'replacepolicy',
            'value' => 'keep',
            'checked' => 'checked',
            'class' => 'easyedu-segmented-choice__input',
        ]) .
        html_writer::tag('span',
            html_writer::span('', 'fa fa-plus', ['aria-hidden' => 'true']) .
            html_writer::tag('span',
                html_writer::tag('strong', get_string('reimportkeeptitle', 'local_groupimport')) .
                html_writer::tag('small', get_string('reimportkeepdesc', 'local_groupimport'))
            ),
            ['class' => 'easyedu-segmented-choice__surface']
        ),
        ['class' => 'easyedu-segmented-choice__option']
    );
    $strategyoptions .= html_writer::tag('label',
        html_writer::empty_tag('input', [
            'type' => 'radio',
            'name' => 'replacepolicy',
            'value' => 'replace',
            'class' => 'easyedu-segmented-choice__input',
        ]) .
        html_writer::tag('span',
            html_writer::span('', 'fa fa-sync-alt', ['aria-hidden' => 'true']) .
            html_writer::tag('span',
                html_writer::tag('strong', get_string('reimportreplacetitle', 'local_groupimport')) .
                html_writer::tag('small', get_string('reimportreplacedesc', 'local_groupimport'))
            ),
            ['class' => 'easyedu-segmented-choice__surface']
        ),
        ['class' => 'easyedu-segmented-choice__option']
    );
    $strategylabel = get_string('reimportstrategy', 'local_groupimport');
    $strategybody = html_writer::div(
        html_writer::div($strategylabel, 'easyedu-segmented-choice__label', ['aria-hidden' => 'true']) .
        html_writer::div($strategyoptions, 'easyedu-segmented-choice__options'),
        'easyedu-segmented-choice__body'
    );
    echo html_writer::tag('fieldset',
        html_writer::tag('legend', $strategylabel, [
            'class' => 'easyedu-segmented-choice__legend',
        ]) . $strategybody,
        [
            'class' => 'local-groupimport-import-preview__strategy easyedu-segmented-choice--contained easyedu-choice',
        ]
    );

    echo html_writer::tag('div',
        html_writer::tag('div',
            html_writer::tag('button', get_string('selectallrows', 'local_groupimport'), [
                'type' => 'button',
                'class' => 'easyedu-button easyedu-button--neutral',
                'data-local-groupimport-preview-toggle-all' => '1',
                'data-select-all-label' => get_string('selectallrows', 'local_groupimport'),
                'data-deselect-all-label' => get_string('deselectallrows', 'local_groupimport'),
                'data-select-results-label' => get_string('selectmatchingrows', 'local_groupimport'),
                'data-deselect-results-label' => get_string('deselectmatchingrows', 'local_groupimport'),
            ]),
            ['class' => 'local-groupimport-import-preview__bulk-actions']
        ) .
        html_writer::tag('label',
            html_writer::span(get_string('previewsearchlabel', 'local_groupimport'), 'accesshide') .
            html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']) .
            html_writer::empty_tag('input', [
                'type' => 'search',
                'class' => 'form-control local-groupimport-import-preview__search',
                'placeholder' => get_string('previewsearchplaceholder', 'local_groupimport'),
                'data-local-groupimport-preview-search' => '1',
            ]),
            [
                'class' => 'local-groupimport-import-preview__search-field easyedu-search',
                'aria-label' => get_string('previewsearchlabel', 'local_groupimport'),
            ]
        ),
        ['class' => 'local-groupimport-import-preview__toolbar easyedu-table-toolbar']
    );

    echo html_writer::start_tag('div', ['class' => 'local-groupimport-import-preview__table-wrap']);
    echo html_writer::start_tag('table', ['class' => 'table-reboot easyedu-data-table local-groupimport-import-preview__table']);
    echo html_writer::tag('thead',
        html_writer::tag('tr',
            html_writer::tag('th', get_string('importpreviewinclude', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewline', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewidentifier', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewgroup', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewgrouping', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewstatus', 'local_groupimport'))
        )
    );
    echo html_writer::start_tag('tbody');

    foreach ($preview['rows'] as $index => $row) {
        $messages = $preview['messages'][$index] ?? [];
        $status = empty($messages)
            ? html_writer::tag('span', get_string('importpreviewready', 'local_groupimport'), [
                'class' => 'local-groupimport-import-preview__status local-groupimport-import-preview__status--ready easyedu-status',
            ])
            : html_writer::tag('span', implode(' ', array_map('s', $messages)), [
                'class' => 'local-groupimport-import-preview__status local-groupimport-import-preview__status--warning easyedu-status easyedu-status--warning',
            ]);

        echo html_writer::tag('tr',
            html_writer::tag('td',
                html_writer::empty_tag('input', [
                    'type' => 'checkbox',
                    'name' => 'rowenabled[' . $index . ']',
                    'value' => 1,
                    'checked' => 'checked',
                    'aria-label' => get_string('importpreviewinclude', 'local_groupimport'),
                ])
            ) .
            html_writer::tag('td', (string)$row['line']) .
            html_writer::tag('td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'identifier[' . $index . ']',
                    'value' => $row['identifier'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag('td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'groupname[' . $index . ']',
                    'value' => $row['groupname'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag('td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'groupingname[' . $index . ']',
                    'value' => $row['groupingname'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag('td', $status),
            [
                'class' => empty($messages) ? '' : 'local-groupimport-import-preview__row--warning is-warning',
                'data-local-groupimport-preview-row' => '1',
            ]
        );
    }

    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
    echo html_writer::end_tag('div');
    echo html_writer::tag('div',
        html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']) .
        html_writer::tag('p', get_string('nopreviewmatches', 'local_groupimport'), ['class' => 'mb-0']),
        [
            'class' => 'local-groupimport-import-empty local-groupimport-import-empty--preview-search easyedu-empty',
            'data-local-groupimport-preview-empty' => '1',
            'hidden' => 'hidden',
        ]
    );

    echo html_writer::tag('div',
        html_writer::tag('button',
            html_writer::tag('span', '', ['class' => 'fa fa-check', 'aria-hidden' => 'true']) .
            get_string('submitimport', 'local_groupimport'),
            ['type' => 'submit', 'class' => 'easyedu-button']
        ) .
        html_writer::link(new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
            get_string('cancel', 'local_groupimport'),
            ['class' => 'easyedu-button easyedu-button--neutral']
        ),
        ['class' => 'local-groupimport-import-preview__actions']
    );
    echo html_writer::end_tag('form');
} else if (empty($success) && empty($errors)) {
    echo html_writer::tag('div',
        html_writer::tag('svg', html_writer::tag('rect', '', [
            'width' => '100%', 'height' => '100%', 'rx' => '13.6',
        ]), ['class' => 'easyedu-empty__boundary', 'aria-hidden' => 'true', 'focusable' => 'false']) .
        html_writer::tag('span', '', ['class' => 'fa fa-inbox', 'aria-hidden' => 'true']) .
        html_writer::tag('p', get_string('noresults', 'local_groupimport'), ['class' => 'mb-0']),
        ['class' => 'local-groupimport-import-empty easyedu-empty']
    );
} else {
    echo html_writer::tag('div',
        html_writer::tag('span',
            html_writer::tag('strong', count($success)) . ' ' . get_string('successheader', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--success']
        ) .
        html_writer::tag('span',
            html_writer::tag('strong', count($errors)) . ' ' . get_string('errorheader', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--error']
        ),
        [
            'class' => 'local-groupimport-import-summary',
            'aria-label' => get_string('importsummary', 'local_groupimport'),
        ]
    );

    if (!empty($success)) {
        echo html_writer::tag('h4', get_string('successheader', 'local_groupimport'), [
            'class' => 'local-groupimport-import-report__title local-groupimport-import-report__title--success',
        ]);
        echo html_writer::start_tag('ul', [
            'class' => 'local-groupimport-import-report local-groupimport-import-report--success',
        ]);
        foreach ($success as $msg) {
            echo html_writer::tag('li',
                html_writer::tag('span', '', ['class' => 'fa fa-check', 'aria-hidden' => 'true']) .
                html_writer::tag('span', s($msg))
            );
        }
        echo html_writer::end_tag('ul');
    }

    if (!empty($errors)) {
        echo html_writer::tag('h4', get_string('errorheader', 'local_groupimport'), [
            'class' => 'local-groupimport-import-report__title local-groupimport-import-report__title--error',
        ]);
        echo html_writer::start_tag('ul', [
            'class' => 'local-groupimport-import-report local-groupimport-import-report--error',
        ]);
        foreach ($errors as $msg) {
            echo html_writer::tag('li',
                html_writer::tag('span', '', ['class' => 'fa fa-exclamation-triangle', 'aria-hidden' => 'true']) .
                html_writer::tag('span', s($msg))
            );
        }
        echo html_writer::end_tag('ul');
    }

    if ($currenthistoryid) {
        echo html_writer::div(
            html_writer::link(
                new moodle_url('/local/groupimport/export.php', [
                    'id' => $course->id,
                    'historyid' => $currenthistoryid,
                ]),
                html_writer::span('', 'fa fa-file-excel', ['aria-hidden' => 'true']) .
                    html_writer::span(get_string('importexportresults', 'local_groupimport')),
                ['class' => 'btn btn-outline-primary easyedu-action-with-icon local-groupimport-import__export-results']
            ),
            'local-groupimport-import-preview__result-actions'
        );
    }
}

echo html_writer::end_div(); // Card.

echo html_writer::end_div(); // Grid.

$historyitems = '';
if (!empty($historyrecords)) {
    foreach ($historyrecords as $record) {
        $historyactions = '';
        if (!empty($record->timerolledback)) {
            $historyactions .= html_writer::tag('span',
                html_writer::span('', 'fa fa-undo-alt', ['aria-hidden' => 'true']) .
                    get_string('importhistoryrolledback', 'local_groupimport', userdate((int)$record->timerolledback)),
                ['class' => 'local-groupimport-import-history__state local-groupimport-import-history__state--rolledback']
            );
        }
        if (!empty($record->changesjson)) {
            $historyactions .= html_writer::tag('button',
                html_writer::span('', 'fa fa-undo-alt', ['aria-hidden' => 'true']) .
                    html_writer::span(get_string(!empty($record->timerolledback)
                        ? 'importhistoryrestoreagain' : 'importhistoryrollback', 'local_groupimport')),
                [
                    'type' => 'button',
                    'class' => 'btn btn-outline-danger btn-sm local-groupimport-import-history__rollback',
                    'data-local-groupimport-rollback-open' => (int)$record->id,
                    'data-local-groupimport-rollback-filename' => $record->filename,
                ]
            );
            $historyactions .= html_writer::link(
                new moodle_url('/local/groupimport/export.php', [
                    'id' => $course->id,
                    'historyid' => (int)$record->id,
                ]),
                html_writer::span('', 'fa fa-file-excel', ['aria-hidden' => 'true']) .
                    html_writer::span(get_string('importexportresults', 'local_groupimport')),
                ['class' => 'btn btn-outline-secondary btn-sm easyedu-action-with-icon local-groupimport-import-history__export']
            );
        } else {
            $historyactions .= html_writer::tag('span', get_string('importhistorylegacy', 'local_groupimport'), [
                'class' => 'local-groupimport-import-history__state local-groupimport-import-history__state--legacy',
            ]);
        }
        $historyactions = html_writer::div($historyactions, 'local-groupimport-import-history__actions');

        $historyitems .= html_writer::tag('li',
            html_writer::tag('div',
                html_writer::tag('strong', s($record->filename)) .
                html_writer::tag('span', userdate((int)$record->timecreated)),
                ['class' => 'local-groupimport-import-history__item-main']
            ) .
            html_writer::tag('div',
                html_writer::tag('span', get_string('importhistoryrows', 'local_groupimport', (int)$record->rowcount)) .
                html_writer::tag('span', get_string('importhistorysuccess', 'local_groupimport', (int)$record->successcount)) .
                html_writer::tag('span', get_string('importhistoryerrors', 'local_groupimport', (int)$record->errorcount)),
                ['class' => 'local-groupimport-import-history__item-meta']
            ) . $historyactions
        );
    }
} else {
    $historyitems = html_writer::tag('li',
        html_writer::tag('span', '', ['class' => 'fa fa-inbox', 'aria-hidden' => 'true']) .
        html_writer::tag('span', get_string('importhistoryempty', 'local_groupimport')),
        ['class' => 'local-groupimport-import-history__empty']
    );
}

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::tag('div',
            html_writer::tag('h3', get_string('importhistory', 'local_groupimport'), [
                'id' => 'local-groupimport-import-history-title',
                'class' => 'easyedu-modal-title',
            ]) .
            html_writer::tag('button',
                html_writer::tag('span', '', ['class' => 'fa fa-times', 'aria-hidden' => 'true']),
                [
                    'type' => 'button',
                    'class' => 'easyedu-dialog-close',
                    'data-local-groupimport-history-close' => '1',
                    'aria-label' => get_string('closebuttontitle'),
                ]
            ),
            ['class' => 'easyedu-dialog-header']
        ) .
        html_writer::tag('div',
            html_writer::tag('p', get_string('importhistorydesc', 'local_groupimport'), [
                'class' => 'local-groupimport-import-history__desc',
            ]) .
            html_writer::tag('ul', $historyitems, ['class' => 'local-groupimport-import-history']),
            ['class' => 'local-groupimport-import-modal__body']
        ),
        [
            'class' => 'local-groupimport-import-modal__dialog',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-import-history-title',
        ]
    ),
    [
        'class' => 'local-groupimport-import-modal',
        'data-local-groupimport-history-modal' => '1',
        'hidden' => 'hidden',
    ]
);

$rollbackform = html_writer::start_tag('form', [
    'method' => 'post',
    'action' => (new moodle_url('/local/groupimport/index.php', ['id' => $course->id]))->out(false),
    'data-local-groupimport-rollback-form' => '1',
]);
$rollbackform .= html_writer::empty_tag('input', [
    'type' => 'hidden',
    'name' => 'sesskey',
    'value' => sesskey(),
]);
$rollbackform .= html_writer::empty_tag('input', [
    'type' => 'hidden',
    'name' => 'rollbackhistoryid',
    'value' => '',
    'data-local-groupimport-rollback-id' => '1',
]);
$rollbackform .= html_writer::tag('div',
    html_writer::tag('p', get_string('importrollbackconfirm', 'local_groupimport'), ['class' => 'mb-1']) .
        html_writer::tag('strong', '', ['data-local-groupimport-rollback-name' => '1']),
    ['class' => 'local-groupimport-import-rollback__message']
);
$rollbackform .= html_writer::tag('div',
    html_writer::tag('button', get_string('cancel', 'local_groupimport'), [
        'type' => 'button',
        'class' => 'btn btn-outline-secondary',
        'data-local-groupimport-rollback-close' => '1',
    ]) .
    html_writer::tag('button',
        html_writer::span('', 'fa fa-undo-alt', ['aria-hidden' => 'true']) .
            html_writer::span(get_string('importrollbackconfirmbutton', 'local_groupimport')),
        ['type' => 'submit', 'class' => 'btn btn-danger']
    ),
    ['class' => 'local-groupimport-import-modal__footer']
);
$rollbackform .= html_writer::end_tag('form');

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::tag('div',
            html_writer::tag('h3', get_string('importrollbacktitle', 'local_groupimport'), [
                'id' => 'local-groupimport-import-rollback-title',
                'class' => 'h5 mb-0',
            ]) .
            html_writer::tag('button',
                html_writer::span('', 'fa fa-times', ['aria-hidden' => 'true']),
                [
                    'type' => 'button',
                    'class' => 'local-groupimport-import-modal__close',
                    'data-local-groupimport-rollback-close' => '1',
                    'aria-label' => get_string('closebuttontitle'),
                ]
            ),
            ['class' => 'local-groupimport-import-modal__header']
        ) .
        html_writer::tag('div', $rollbackform, ['class' => 'local-groupimport-import-modal__body']),
        [
            'class' => 'local-groupimport-import-modal__dialog local-groupimport-import-modal__dialog--confirm',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-import-rollback-title',
        ]
    ),
    [
        'class' => 'local-groupimport-import-modal',
        'data-local-groupimport-rollback-modal' => '1',
        'hidden' => 'hidden',
    ]
);

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::tag('span', '', ['class' => 'fa fa-plus', 'aria-hidden' => 'true']) .
        html_writer::tag('strong', get_string('csvdropready', 'local_groupimport')) .
        html_writer::tag('p', get_string('csvdropsubtitle', 'local_groupimport'), ['class' => 'mb-0']),
        ['class' => 'local-groupimport-import-drop__panel']
    ),
    [
        'class' => 'local-groupimport-import-drop',
        'data-local-groupimport-drop-overlay' => '1',
        'hidden' => 'hidden',
        'aria-hidden' => 'true',
    ]
);

echo html_writer::end_div(); // Real content.
echo html_writer::end_div(); // Container.

echo $OUTPUT->footer();
