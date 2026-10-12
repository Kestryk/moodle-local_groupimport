<?php
// This file is part of Moodle - http://moodle.org/
// Moodle is free software under the GNU GPL v3 or later.

namespace local_groupimport\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Request-owned grouped reads. No mutation, persistent cache or user matching policy.
 *
 * Keep comparisons in SQL: PHP lowercasing cannot reproduce database collation
 * (case, accents, trailing spaces). Ordinals retain the exact input spelling.
 * Native mutation APIs remain responsible for their own final checks/events.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class batch_reader {
    /** Maximum IN values; leave room for additional SQL Server parameters. */
    public const CHUNK_SIZE = 1000;

    /** Get course-owned records by ID, preserving ordinary Moodle record objects. */
    public static function records(string $table, array $ids, array $conditions = [], string $fields = '*'): array {
        global $DB;
        if (!in_array($table, ['user', 'groups', 'groupings'], true)) {
            throw new \coding_exception('Unsupported batch table.');
        }
        $result = [];
        foreach (array_chunk(array_values(array_unique($ids)), self::CHUNK_SIZE) as $chunk) {
            [$insql, $params] = $DB->get_in_or_equal($chunk, SQL_PARAMS_NAMED, 'bid');
            $where = 'id ' . $insql;
            foreach ($conditions as $column => $value) {
                if (!in_array($column, ['courseid', 'deleted'], true)) {
                    throw new \coding_exception('Unsupported batch condition.');
                }
                $where .= ' AND ' . $column . ' = :' . $column;
                $params[$column] = $value;
            }
            $result += $DB->get_records_select($table, $where, $params, '', $fields);
        }
        return $result;
    }

    /** Match enabled core/profile fields; callers retain distinct AJAX/import policies. */
    public static function users(array $values, string $field, array $shortnames = []): array {
        global $DB;
        $joins = '';
        $conditions = 'r.deleted = 0';
        $params = [];
        if ($field === 'profile') {
            if (!$shortnames) {
                return [];
            }
            if (count($shortnames) > self::CHUNK_SIZE) {
                $result = array_fill_keys($values, []);
                foreach (array_chunk($shortnames, self::CHUNK_SIZE) as $chunk) {
                    foreach (self::users($values, $field, $chunk) as $value => $records) {
                        $result[$value] = array_merge($result[$value], $records);
                    }
                }
                return $result;
            }
            [$fieldsql, $params] = $DB->get_in_or_equal($shortnames, SQL_PARAMS_NAMED, 'profile');
            $joins = ' JOIN {user_info_data} d ON d.userid = r.id JOIN {user_info_field} f ON f.id = d.fieldid';
            $conditions .= ' AND f.shortname ' . $fieldsql;
            $column = 'd.data';
        } else {
            if (!in_array($field, ['email', 'username', 'idnumber'], true)) {
                throw new \coding_exception('Unsupported identification field.');
            }
            $column = 'r.' . $field;
        }
        return self::matches($values, 'user', $column, $joins, $conditions, $params);
    }

    /** Match group/grouping names with the same database comparison as native lookups. */
    public static function names(string $table, int $courseid, array $names): array {
        if (!in_array($table, ['groups', 'groupings'], true)) {
            throw new \coding_exception('Unsupported course-name table.');
        }
        if ($table === 'groups') {
            // groups_get_group_by_name uses PHP == over native cached course
            // data, not SQL collation. Keep its exact case/numeric-name policy.
            $result = [];
            $groups = groups_get_course_data($courseid)->groups;
            foreach (array_unique($names) as $name) {
                $result[$name] = [];
                foreach ($groups as $group) {
                    if ($group->name == $name) {
                        $result[$name][] = $group;
                    }
                }
            }
            return $result;
        }
        return self::matches($names, $table, 'r.name', '', 'r.courseid = :courseid', ['courseid' => $courseid]);
    }

    /**
     * Map exact inputs to matching rows without a per-input query.
     *
     * The indexed IN restriction and the ordinal relation share one query per
     * field/chunk. Each named parameter appears once. At most 2,000 value
     * parameters plus fixed filters (under SQL Server's 2,100 parameter limit).
     * No LIMIT/order is imposed: duplicate/ambiguous callers can fall back to
     * the historical single-value API where its unspecified first row matters.
     */
    private static function matches(array $values, string $table, string $column, string $joins,
            string $conditions, array $fixedparams): array {
        global $DB;
        $values = array_values(array_unique(array_map('strval', $values)));
        $result = array_fill_keys($values, []);
        $chunksize = min(self::CHUNK_SIZE, max(1, intdiv(2000 - count($fixedparams), 2)));
        foreach (array_chunk($values, $chunksize) as $chunk) {
            [$insql, $params] = $DB->get_in_or_equal($chunk, SQL_PARAMS_NAMED, 'needle');
            $relation = [];
            foreach ($chunk as $index => $value) {
                $relation[] = 'SELECT ' . $index . ' AS inputindex, :input' . $index . ' AS inputvalue ' .
                    $DB->sql_null_from_clause();
                $params['input' . $index] = $value;
            }
            $sql = 'SELECT r.*, inputs.inputindex AS batchinputindex FROM {' . $table . '} r ' . $joins .
                ' JOIN (' . implode(' UNION ALL ', $relation) . ') inputs ON ' . $column . ' = inputs.inputvalue ' .
                'WHERE ' . $conditions . ' AND ' . $column . ' ' . $insql;
            $records = $DB->get_recordset_sql($sql, $params + $fixedparams);
            try {
                foreach ($records as $record) {
                    $value = $chunk[(int)$record->batchinputindex];
                    unset($record->batchinputindex);
                    $result[$value][] = $record;
                }
            } finally {
                $records->close();
            }
        }
        return $result;
    }

    /** All ordinary enrolments, including suspended/disabled, as is_enrolled's default. */
    public static function enrolled(\context_course $context): array {
        global $DB, $USER;
        [$sql, $params] = get_enrolled_sql($context);
        $users = $DB->get_records_sql('SELECT u.id FROM {user} u JOIN (' . $sql . ') e ON e.id = u.id ' .
            'WHERE u.deleted = 0', $params);
        // is_enrolled checks the current actor's active cached enrolment first.
        if (!empty($USER->id) && is_enrolled($context, $USER->id)) {
            $users[$USER->id] = (object)['id' => $USER->id];
        }
        foreach ($users as $id => $user) {
            if (isguestuser($id)) {
                unset($users[$id]);
            }
        }
        return $users;
    }

    /** Group memberships and grouping assignments, keyed by their actual IDs. */
    public static function relationships(int $courseid): array {
        global $DB;
        $members = [];
        $assignments = [];
        $records = $DB->get_recordset_sql('SELECT m.id, m.groupid, m.userid FROM {groups_members} m ' .
            'JOIN {groups} g ON g.id = m.groupid WHERE g.courseid = :courseid', ['courseid' => $courseid]);
        try {
            foreach ($records as $record) {
                $members[(int)$record->groupid][(int)$record->userid] = true;
            }
        } finally {
            $records->close();
        }
        $records = $DB->get_recordset_sql('SELECT a.id, a.groupid, a.groupingid FROM {groupings_groups} a ' .
            'JOIN {groups} g ON g.id = a.groupid WHERE g.courseid = :courseid', ['courseid' => $courseid]);
        try {
            foreach ($records as $record) {
                $assignments[(int)$record->groupid][(int)$record->groupingid] = true;
            }
        } finally {
            $records->close();
        }
        return [$members, $assignments];
    }
}
