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
 * Pinned legacy AP-E7 functions for historical chunk-verifier parity only.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Load selected custom profile values for all displayed users.
 *
 * @param array $users User records.
 * @param array $fieldkeys Selected custom field keys.
 * @return array User id => field key => value.
 */
function local_groupimport_load_custom_user_field_values(array $users, array $fieldkeys): array {
    global $DB;

    if (empty($users) || empty($fieldkeys)) {
        return [];
    }

    $shortnames = [];
    foreach ($fieldkeys as $fieldkey) {
        if (strpos($fieldkey, 'profile_field_') === 0) {
            $shortnames[] = substr($fieldkey, strlen('profile_field_'));
        }
    }

    if (empty($shortnames)) {
        return [];
    }

    [$fieldsql, $fieldparams] = $DB->get_in_or_equal($shortnames, SQL_PARAMS_NAMED, 'field');
    $values = [];
    foreach (array_chunk(array_keys($users), 1000) as $userids) {
        [$usersql, $userparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'user');
        $recordset = $DB->get_recordset_sql(
            "SELECT d.id, d.userid, f.shortname, d.data
           FROM {user_info_data} d
           JOIN {user_info_field} f ON f.id = d.fieldid
          WHERE d.userid $usersql
            AND f.shortname $fieldsql",
            $userparams + $fieldparams
        );
        try {
            foreach ($recordset as $record) {
                $fieldkey = 'profile_field_' . $record->shortname;
                $values[(int)$record->userid][$fieldkey] =
                    local_groupimport_normalise_participant_label_value($record->data);
            }
        } finally {
            $recordset->close();
        }
    }

    return $values;
}

/**
 * Enrich users with the copyable field values allowed by plugin settings.
 *
 * @param array $users User records.
 * @param array $alloweduserfields Allowed fields.
 * @return array
 */
function local_groupimport_enrich_users_with_copy_fields(array $users, array $alloweduserfields): array {
    global $DB;

    if (empty($users) || empty($alloweduserfields)) {
        return $users;
    }

    $customshortnames = [];
    foreach (array_keys($alloweduserfields) as $fieldkey) {
        if (strpos($fieldkey, 'profile_field_') === 0) {
            $customshortnames[] = substr($fieldkey, strlen('profile_field_'));
        }
    }

    $customvalues = [];
    if (!empty($customshortnames)) {
        [$fieldsql, $fieldparams] = $DB->get_in_or_equal($customshortnames, SQL_PARAMS_NAMED, 'field');
        foreach (array_chunk(array_keys($users), 1000) as $userids) {
            [$usersql, $userparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED);
            $records = $DB->get_records_sql(
                "SELECT d.userid, f.shortname, d.data
               FROM {user_info_data} d
               JOIN {user_info_field} f ON f.id = d.fieldid
              WHERE d.userid $usersql
                AND f.shortname $fieldsql",
                $userparams + $fieldparams
            );

            foreach ($records as $record) {
                $customvalues[(int)$record->userid]['profile_field_' . $record->shortname] = (string)$record->data;
            }
        }
    }

    foreach ($users as $userid => $user) {
        $copyfields = [];
        foreach ($alloweduserfields as $fieldkey => $label) {
            if (strpos($fieldkey, 'profile_field_') === 0) {
                $value = $customvalues[(int)$userid][$fieldkey] ?? '';
            } else {
                $value = isset($user[$fieldkey]) ? (string)$user[$fieldkey] : '';
            }

            $copyfields[] = [
                'key' => $fieldkey,
                'label' => $label,
                'value' => $value,
            ];
        }
        $users[$userid]['copyfields'] = $copyfields;
    }

    return $users;
}
