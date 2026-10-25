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

namespace local_groupimport\local;

/**
 * Course-scoped import lookup, independent of the site's user directory.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class import_user_lookup {
    /**
     * Resolve at most two enrolled ids with native database comparison semantics.
     * @param string $identifier Imported input.
     * @param string $field Enabled identification field.
     * @param \context_course $context Authorized course context.
     * @return array Minimal id records.
     */
    public static function by_field(string $identifier, string $field, \context_course $context): array {
        global $DB;
        [$enrolledsql, $params] = get_enrolled_sql($context);
        $joins = " JOIN ($enrolledsql) enrolled ON enrolled.id = u.id";
        if (strpos($field, 'profile_field_') === 0) {
            $params['lookupshortname'] = substr($field, strlen('profile_field_'));
            $joins .= ' JOIN {user_info_data} d ON d.userid = u.id JOIN {user_info_field} f ON f.id = d.fieldid';
            $where = 'f.shortname = :lookupshortname AND d.data = :lookupvalue';
        } else if (in_array($field, ['email', 'username', 'idnumber'], true)) {
            if ($field === 'email') {
                $identifier = strtolower(preg_replace('/\s+/u', '', $identifier));
            }
            $where = "u.$field = :lookupvalue";
        } else {
            return [];
        }
        $params['lookupvalue'] = $identifier;
        return $DB->get_records_sql(
            'SELECT DISTINCT u.id FROM {user} u' . $joins . ' WHERE u.deleted = 0 AND ' . $where,
            $params,
            0,
            2
        );
    }

    /**
     * Identical result for unknown, unenrolled or ambiguous identifiers.
     * @param string $identifier Imported input, never a resolved site account.
     * @return string
     */
    public static function unavailable_message(string $identifier): string {
        return get_string('importuserunavailable', 'local_groupimport', $identifier);
    }
}
