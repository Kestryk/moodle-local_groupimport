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

defined('MOODLE_INTERNAL') || die();

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
    try {
        return \local_groupimport\local\import_reader::csv($content);
    } catch (moodle_exception $exception) {
        $errors[] = $exception->getMessage();
        return ['header' => [], 'rows' => []];
    }
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
    try {
        return \local_groupimport\local\import_reader::excel($content, $filename);
    } catch (Throwable $exception) {
        $errors[] = $exception instanceof moodle_exception ? $exception->getMessage() :
            get_string('spreadsheetreaderror', 'local_groupimport');
        return ['header' => [], 'rows' => []];
    }
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

    if ($extension !== 'csv') {
        $errors[] = get_string('importformatinvalid', 'local_groupimport');
        return ['header' => [], 'rows' => []];
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

    $allowed = array_filter($allowed, static function (string $value): bool {
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
 * @param context_course $context Authorized course.
 * @return array User records.
 */
function local_groupimport_find_import_users_by_field(
    string $identifier,
    string $userfield,
    context_course $context
): array {
    return \local_groupimport\local\import_user_lookup::by_field($identifier, $userfield, $context);
}

/**
 * Automatically find a user by testing every configured identification field.
 *
 * @param string $identifier User identifier.
 * @param array $errors Errors array (by reference).
 * @param context_course $context Authorized course.
 * @return stdClass|null Enrolled user id, if exactly one user is matched.
 */
function local_groupimport_find_import_user(string $identifier, array &$errors, context_course $context): ?stdClass {
    $allowedfields = local_groupimport_get_allowed_import_userfields();
    $matches = [];
    $matchedlabels = [];

    foreach ($allowedfields as $fieldkey => $fieldlabel) {
        $fieldmatches = local_groupimport_find_import_users_by_field($identifier, $fieldkey, $context);
        foreach ($fieldmatches as $userid => $user) {
            $matches[$userid] = $user;
            $matchedlabels[$userid][] = $fieldlabel;
        }
    }

    if (count($matches) === 1) {
        return reset($matches);
    }

    if (count($matches) > 1) {
        $errors[] = \local_groupimport\local\import_user_lookup::unavailable_message($identifier);
        return null;
    }

    $errors[] = \local_groupimport\local\import_user_lookup::unavailable_message($identifier);
    return null;
}

/**
 * Batch import matching; unlike pasted IDs, import compares every enabled field.
 */
function local_groupimport_find_import_users(array $identifiers, context_course $context): array {
    $identifiers = array_values(array_unique($identifiers));
    $matches = array_fill_keys($identifiers, []);
    foreach (local_groupimport_get_allowed_import_userfields() as $field => $label) {
        $values = [];
        foreach ($identifiers as $identifier) {
            $values[$identifier] = $field === 'email'
                ? strtolower(preg_replace('/\s+/u', '', $identifier)) : $identifier;
        }
        $custom = strpos($field, 'profile_field_') === 0;
        $fieldmatches = \local_groupimport\local\batch_reader::users(
            array_values($values),
            $custom ? 'profile' : $field,
            $custom ? [substr($field, strlen('profile_field_'))] : [],
            $context
        );
        foreach ($values as $identifier => $value) {
            $users = $fieldmatches[$value] ?? [];
            // Retain the original two-row limit and database first-row behavior
            // for exceptional non-unique core/profile values.
            if (count($users) > 1) {
                $users = local_groupimport_find_import_users_by_field((string)$identifier, $field, $context);
            }
            foreach ($users as $user) {
                $matches[$identifier][$user->id] = $user;
            }
        }
    }
    $result = [];
    foreach ($matches as $identifier => $users) {
        $result[$identifier] = ['user' => count($users) === 1 ? reset($users) : null, 'errors' => []];
        if (count($users) !== 1) {
            $result[$identifier]['errors'][] = \local_groupimport\local\import_user_lookup::unavailable_message($identifier);
        }
    }
    return $result;
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
    $identifiers = [];
    $groupnames = [];
    $groupingnames = [];
    foreach ($rows as $row) {
        $identifier = local_groupimport_clean_cell((string)($row['identifier'] ?? ''));
        $groupname = local_groupimport_clean_cell((string)($row['groupname'] ?? ''));
        if ($identifier !== '' && $groupname !== '') {
            $identifiers[] = $identifier;
            $groupnames[] = $groupname;
            $groupingnames[] = local_groupimport_clean_cell((string)($row['groupingname'] ?? ''));
        }
    }
    $resolved = local_groupimport_find_import_users($identifiers, $context);
    $enrolled = \local_groupimport\local\batch_reader::enrolled($context);
    $groups = \local_groupimport\local\batch_reader::names('groups', (int)$context->instanceid, $groupnames);
    $groupings = \local_groupimport\local\batch_reader::names(
        'groupings',
        (int)$context->instanceid,
        array_filter($groupingnames, static fn(string $name): bool => $name !== '')
    );
    [$members, $assignments] = \local_groupimport\local\batch_reader::relationships((int)$context->instanceid);

    foreach ($rows as $index => $row) {
        $rowmessages = [];
        $identifier = local_groupimport_clean_cell((string)($row['identifier'] ?? ''));
        $groupname = local_groupimport_clean_cell((string)($row['groupname'] ?? ''));
        $groupingname = local_groupimport_clean_cell((string)($row['groupingname'] ?? ''));

        if ($identifier === '' || $groupname === '') {
            $rowmessages[] = get_string('csvinvalidrowmissing', 'local_groupimport');
        } else {
            $lookupmessages = $resolved[$identifier]['errors'];
            $user = $resolved[$identifier]['user'];
            if (!$user) {
                $rowmessages = array_merge($rowmessages, $lookupmessages);
            } else if (!isset($enrolled[$user->id])) {
                $rowmessages[] = \local_groupimport\local\import_user_lookup::unavailable_message($identifier);
            } else {
                $groupmatches = $groups[$groupname] ?? [];
                $groupid = count($groupmatches) > 1 ? groups_get_group_by_name($context->instanceid, $groupname) :
                    ($groupmatches[0]->id ?? false);
                if ($groupid && isset($members[$groupid][$user->id])) {
                    $rowmessages[] = get_string('previewuseralreadyingroup', 'local_groupimport');
                }

                if ($groupid && $groupingname !== '') {
                    $groupingmatches = $groupings[$groupingname] ?? [];
                    $groupingid = count($groupingmatches) > 1 ? $DB->get_field('groupings', 'id', [
                        'courseid' => $context->instanceid,
                        'name' => $groupingname,
                    ]) : ($groupingmatches[0]->id ?? false);
                    if ($groupingid && isset($assignments[$groupid][$groupingid])) {
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
 * @param bool $triggerevent Emit applied event now, or after background completion.
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
    array $changes,
    bool $triggerevent = true
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
        'changesjson' => json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        'timecreated' => time(),
    ];
    $historyid = (int)$DB->insert_record('local_groupimport_history', $record);
    if ($triggerevent) {
        \local_groupimport\event\import_applied::create([
        'objectid' => $historyid,
        'context' => context_course::instance($courseid),
        ])->trigger();
    }
    return $historyid;
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

    // Keep report/changes payloads on the explicit detail/export/restore paths only.
    $length = $DB->sql_length('changesjson');
    $sql = "SELECT id, filename, timecreated, rowcount, successcount, errorcount, timerolledback,
                   CASE WHEN changesjson IS NOT NULL AND $length > 0 THEN 1 ELSE 0 END AS haschanges
              FROM {local_groupimport_history}
             WHERE courseid = :courseid
          ORDER BY timecreated DESC";
    return $DB->get_records_sql($sql, ['courseid' => $courseid], 0, $limit);
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
    $resolved = local_groupimport_find_import_users(array_column($rows, 'identifier'), $context);
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
        $match = $resolved[$identifier] ?? ['user' => null, 'errors' => []];
        $user = $match['user'];
        $errors = array_merge($errors, $match['errors']);
        if (!$user) {
            $reportrow['status'] = 'error';
            $reportrow['messages'] = array_slice($errors, $errorcount);
            $changes['reportrows'][] = $reportrow;
            continue;
        }

        // Bind report rows to the subject even when no membership is applied (Privacy S2).
        $reportrow['userid'] = (int)$user->id;

        if (!is_enrolled($context, $user->id)) {
            $message = \local_groupimport\local\import_user_lookup::unavailable_message($identifier);
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

            if (
                $groupingid && !$DB->record_exists('groupings_groups', [
                'groupingid' => $groupingid,
                'groupid' => $groupid,
                ])
            ) {
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
                if (!groups_remove_member_allowed((int)$groupid, (int)$currentmember->userid)) {
                    throw new moodle_exception('invaliddata', 'error');
                }
                if (!groups_remove_member((int)$groupid, (int)$currentmember->userid)) {
                    throw new moodle_exception('invaliddata', 'error');
                }
                $changes['removedmembers'][] = [
                    'groupid' => (int)$groupid,
                    'userid' => (int)$currentmember->userid,
                ];
                $success[] = get_string('importreplaceremovedmember', 'local_groupimport');
            }

            $currentassignments = $DB->get_records(
                'groupings_groups',
                ['groupid' => $groupid],
                '',
                'id,groupingid,groupid'
            );
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
    $job = $DB->get_record('local_groupimport_jobs', ['historyid' => $history->id]);
    if ($job && !in_array($job->status, ['completed', 'cancelled'], true)) {
        throw new moodle_exception('importjobactive', 'local_groupimport');
    }

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
    try {
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
        $memberids = array_map(static fn(array $row): int => (int)($row['userid'] ?? 0), $desiredstate);
        $existingusers = \local_groupimport\local\batch_reader::records('user', $memberids, [], 'id');
        $enrolledusers = \local_groupimport\local\batch_reader::enrolled($context);
        $groupnames = array_map(static fn(array $row): string =>
            clean_param((string)($row['groupname'] ?? ''), PARAM_TEXT), $desiredstate);
        $groupingnames = array_map(static fn(array $row): string =>
            clean_param((string)($row['groupingname'] ?? ''), PARAM_TEXT), $desiredstate);
        $groups = \local_groupimport\local\batch_reader::names('groups', (int)$history->courseid, $groupnames);
        $groupings = \local_groupimport\local\batch_reader::names('groupings', (int)$history->courseid, $groupingnames);
        [$members, $assignments] = \local_groupimport\local\batch_reader::relationships((int)$history->courseid);
        $createdgroups = false;
        $createdgroupings = false;
        foreach ($desiredstate as $row) {
            $memberid = (int)($row['userid'] ?? 0);
            $groupname = clean_param((string)($row['groupname'] ?? ''), PARAM_TEXT);
            $groupingname = clean_param((string)($row['groupingname'] ?? ''), PARAM_TEXT);
            if (
                !$memberid || $groupname === '' || !isset($existingusers[$memberid]) ||
                    !isset($enrolledusers[$memberid])
            ) {
                $result->skipped++;
                continue;
            }

            $groupmatches = $groups[$groupname] ?? [];
            $groupid = count($groupmatches) > 1 ? groups_get_group_by_name((int)$history->courseid, $groupname) :
                ($groupmatches[0]->id ?? false);
            // Native group lookup uses PHP equality, including numeric-name aliases.
            // Newly created names were absent from the original snapshot.
            if (!$groupid && $createdgroups) {
                $groupid = groups_get_group_by_name((int)$history->courseid, $groupname);
            }
            if (!$groupid) {
                $groupid = groups_create_group((object)[
                    'courseid' => (int)$history->courseid,
                    'name' => $groupname,
                ]);
                $result->groups++;
                $createdgroups = true;
            }
            $groups[$groupname] = [(object)['id' => $groupid]];
            $targetmembers[$groupid][$memberid] = true;

            if (!isset($members[$groupid][$memberid])) {
                if (groups_add_member($groupid, $memberid)) {
                    $members[$groupid][$memberid] = true;
                }
                $result->members++;
            }

            if ($groupingname === '') {
                continue;
            }
            $groupingmatches = $groupings[$groupingname] ?? [];
            $groupingid = count($groupingmatches) > 1 ? $DB->get_field('groupings', 'id', [
                'courseid' => (int)$history->courseid,
                'name' => $groupingname,
            ]) : ($groupingmatches[0]->id ?? false);
            if (!$groupingid && $createdgroupings) {
                $groupingid = $DB->get_field('groupings', 'id', ['courseid' => (int)$history->courseid, 'name' => $groupingname]);
            }
            if (!$groupingid) {
                $groupingid = groups_create_grouping((object)[
                    'courseid' => (int)$history->courseid,
                    'name' => $groupingname,
                ]);
                $result->groupings++;
                $createdgroupings = true;
            }
            $groupings[$groupingname] = [(object)['id' => $groupingid]];
            $targetgroupings[$groupid][$groupingid] = true;
            if (!isset($assignments[$groupid][$groupingid])) {
                groups_assign_grouping($groupingid, $groupid);
                $assignments[$groupid][$groupingid] = true;
                $result->assignments++;
            }
        }

        if (($history->replacepolicy ?? 'keep') === 'replace') {
            foreach ($targetmembers as $groupid => $expectedmembers) {
                $members = $DB->get_records('groups_members', ['groupid' => $groupid], '', 'id,userid');
                foreach ($members as $member) {
                    if (!isset($expectedmembers[(int)$member->userid])) {
                        if (!groups_remove_member_allowed((int)$groupid, (int)$member->userid)) {
                            throw new moodle_exception('invaliddata', 'error');
                        }
                        if (!groups_remove_member((int)$groupid, (int)$member->userid)) {
                            throw new moodle_exception('invaliddata', 'error');
                        }
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
        \local_groupimport\event\import_rolled_back::create([
            'objectid' => (int)$history->id,
            'context' => context_course::instance((int)$history->courseid),
        ])->trigger();
        $transaction->allow_commit();

        return $result;
    } catch (Throwable $exception) {
        $transaction->rollback($exception);
        throw $exception;
    }
}
