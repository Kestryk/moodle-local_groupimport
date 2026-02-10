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
require_once($CFG->dirroot . '/group/lib.php'); // Fonctions groups_*.

use local_groupimport\form\import_form;

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
$PAGE->set_title(get_string('groupimport', 'local_groupimport'));
$PAGE->set_heading(format_string($course->fullname));

$mform = new import_form(null, ['courseid' => $course->id]);

$success = [];
$errors = [];

// Template CSV download button URL.
$templateurl = new moodle_url('/local/groupimport/template.php', ['id' => $course->id]);

if ($mform->is_cancelled()) {
    redirect(course_get_url($course));

} else if ($data = $mform->get_data()) {
    global $DB;

    // Retrieve uploaded file content.
    $content = $mform->get_file_content('importfile');

    // Global BOM cleanup at the beginning of the file (if present).
    if (is_string($content) && substr($content, 0, 3) === "\xEF\xBB\xBF") {
        $content = substr($content, 3);
    }

    // Field used to identify the user (username, email, idnumber, custom profile field).
    $config = get_config('local_groupimport');
    $userfield = !empty($data->userfield)
        ? $data->userfield
        : (!empty($config->defaultuserfield) ? $config->defaultuserfield : 'username');

    if ($content === false || $content === null || $content === '') {
        $errors[] = get_string('csvloaderror', 'local_groupimport', 'Empty file');
    } else {
        // Parse CSV (supports ';' and ',').
        $parsed = local_groupimport_parse_csv_content($content, $errors);
        $columns = $parsed['header'];
        $rows = $parsed['rows'];

        if (empty($columns)) {
            if (empty($errors)) {
                $errors[] = get_string('csvmissingcolumns', 'local_groupimport');
            }
        } else {
            // Normalize column names: trim, remove BOM, lowercase.
            $normalized = [];
            foreach ($columns as $idx => $name) {
                $clean = preg_replace('/^\xEF\xBB\xBF/u', '', $name);
                $clean = trim($clean);
                $normalized[$idx] = strtolower($clean);
            }

            // Expected columns: useridentifier, groupname, (optional) groupingname.
            $identifierindex = array_search('useridentifier', $normalized, true);
            $groupnameindex = array_search('groupname', $normalized, true);
            $groupingindex = array_search('groupingname', $normalized, true); // Can be false.

            if ($identifierindex === false || $groupnameindex === false) {
                $errors[] = get_string('csvmissingcolumns', 'local_groupimport');
            } else {
                foreach ($rows as $line) {
                    $identifier = isset($line[$identifierindex]) ? trim($line[$identifierindex]) : '';
                    $groupname = isset($line[$groupnameindex]) ? trim($line[$groupnameindex]) : '';
                    $groupingname = ($groupingindex !== false && isset($line[$groupingindex]))
                        ? trim($line[$groupingindex])
                        : '';

                    if ($identifier === '' && $groupname === '') {
                        continue;
                    }

                    if ($identifier === '' || $groupname === '') {
                        $errors[] = get_string('csvinvalidrowmissing', 'local_groupimport');
                        continue;
                    }

                    // 1. Find the user according to the chosen field.
                    $user = null;

                    if ($userfield === 'username') {
                        $user = $DB->get_record('user', ['username' => $identifier, 'deleted' => 0]);
                    } else if ($userfield === 'email') {
                        $user = $DB->get_record('user', ['email' => $identifier, 'deleted' => 0]);
                    } else if ($userfield === 'idnumber') {
                        $user = $DB->get_record('user', ['idnumber' => $identifier, 'deleted' => 0]);
                    } else if (strpos($userfield, 'profile_field_') === 0) {
                        // Custom profile field.
                        $shortname = substr($userfield, strlen('profile_field_'));

                        $sql = "SELECT u.*
                                  FROM {user} u
                                  JOIN {user_info_data} d ON d.userid = u.id
                                  JOIN {user_info_field} f ON f.id = d.fieldid
                                 WHERE f.shortname = :shortname
                                   AND d.data = :data
                                   AND u.deleted = 0";

                        $params = [
                            'shortname' => $shortname,
                            'data' => $identifier,
                        ];

                        $users = $DB->get_records_sql($sql, $params);
                        if (count($users) === 1) {
                            $user = reset($users);
                        } else if (count($users) > 1) {
                            $a = (object)['identifier' => $identifier, 'field' => $shortname];
                            $errors[] = get_string('usermultiplematches', 'local_groupimport', $a);
                        }
                    }

                    if (!$user) {
                        $errors[] = get_string('usernotfound', 'local_groupimport', $identifier);
                        continue;
                    }

                    // 2. Check the user is enrolled in the course.
                    if (!is_enrolled($context, $user->id)) {
                        $errors[] = get_string('usernotenrolled', 'local_groupimport', $identifier);
                        continue;
                    }

                    // 3. Get or create the group.
                    $groupid = groups_get_group_by_name($course->id, $groupname);
                    if (!$groupid) {
                        $groupdata = new stdClass();
                        $groupdata->courseid = $course->id;
                        $groupdata->name = $groupname;

                        $groupid = groups_create_group($groupdata);
                        if (!$groupid) {
                            $a = (object)['groupname' => $groupname, 'identifier' => $identifier];
                            $errors[] = get_string('groupcreatefailed', 'local_groupimport', $a);
                            continue;
                        }
                    }

                    // 4. Get or create the grouping (optional).
                    if (!empty($groupingname)) {
                        $groupingid = $DB->get_field(
                            'groupings',
                            'id',
                            [
                                'courseid' => $course->id,
                                'name' => $groupingname,
                            ]
                        );

                        if (!$groupingid) {
                            $groupingdata = new stdClass();
                            $groupingdata->courseid = $course->id;
                            $groupingdata->name = $groupingname;

                            $groupingid = groups_create_grouping($groupingdata);
                            if (!$groupingid) {
                                $a = (object)['groupingname' => $groupingname, 'groupname' => $groupname];
                                $errors[] = get_string('groupingcreatefailed', 'local_groupimport', $a);
                            }
                        }

                        if ($groupingid) {
                            // Assign the group to the grouping if not already linked.
                            if (!$DB->record_exists('groupings_groups', [
                                'groupingid' => $groupingid,
                                'groupid' => $groupid,
                            ])) {
                                groups_assign_grouping($groupingid, $groupid);
                            }
                        }
                    }

                    // 5. Add the user to the group (no duplicates).
                    if (!groups_is_member($groupid, $user->id)) {
                        groups_add_member($groupid, $user->id);

                        $msg = "Utilisateur '$identifier' ajouté au groupe '$groupname'";
                        if (!empty($groupingname)) {
                            $msg .= " (groupement '$groupingname')";
                        }

                        $success[] = $msg . '.';
                    } else {
                        $a = (object)['identifier' => $identifier, 'groupname' => $groupname];
                        $errors[] = get_string('useralreadyingroup', 'local_groupimport', $a);
                    }
                }
            }
        }
    }
}

// Output.
echo $OUTPUT->header();

// Main container.
echo html_writer::start_div('container mt-4', ['id' => 'local_groupimport-page']);

// Form card.
echo html_writer::start_div('card shadow-sm mb-4');
echo html_writer::div(get_string('groupimport', 'local_groupimport'), 'card-header h5 mb-0');

echo html_writer::start_div('card-body');

// Template button + description.
echo html_writer::div(
    $OUTPUT->single_button($templateurl, get_string('downloadtemplate', 'local_groupimport')),
    'mb-3',
    ['id' => 'local_groupimport-templatebtn']
);

echo html_writer::tag(
    'p',
    get_string('importfile_help', 'local_groupimport'),
    ['class' => 'text-muted']
);

// Moodle form (with filepicker).
echo html_writer::start_div('', ['id' => 'local_groupimport-form']);
$mform->display();
echo html_writer::end_div();

echo html_writer::end_div(); // Card body.
echo html_writer::end_div(); // Card.

// Results card.
echo html_writer::start_div('card shadow-sm', ['id' => 'local_groupimport-results']);
echo html_writer::div(get_string('importresults', 'local_groupimport'), 'card-header h5 mb-0');
echo html_writer::start_div('card-body');

if (empty($success) && empty($errors)) {
    echo html_writer::div(get_string('noresults', 'local_groupimport'), 'text-muted');
} else {
    echo html_writer::tag('h6', get_string('importsummary', 'local_groupimport'), ['class' => 'mb-3']);

    if (!empty($success)) {
        echo html_writer::tag('h6', get_string('successheader', 'local_groupimport'), ['class' => 'text-success']);
        echo html_writer::start_tag('ul', ['class' => 'mb-3']);
        foreach ($success as $msg) {
            echo html_writer::tag('li', s($msg));
        }
        echo html_writer::end_tag('ul');
    }

    if (!empty($errors)) {
        echo html_writer::tag('h6', get_string('errorheader', 'local_groupimport'), ['class' => 'text-danger']);
        echo html_writer::start_tag('ul', ['class' => 'mb-0']);
        foreach ($errors as $msg) {
            echo html_writer::tag('li', s($msg));
        }
        echo html_writer::end_tag('ul');
    }
}

echo html_writer::end_div(); // Card body.
echo html_writer::end_div(); // Card.

// Back to course button.
$courseurl = course_get_url($course);
echo html_writer::div(
    $OUTPUT->single_button($courseurl, get_string('backtocourse', 'local_groupimport')),
    'mt-3'
);

echo html_writer::end_div(); // Container.

echo $OUTPUT->footer();
