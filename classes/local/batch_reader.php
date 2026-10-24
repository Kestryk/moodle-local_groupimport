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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace local_groupimport\local;

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

    /**
     * Get course-owned records by ID, preserving ordinary Moodle record objects.
     */
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

    /**
     * Match enabled core/profile fields; callers retain distinct AJAX/import policies.
     */
    public static function users(array $values, string $field, array $shortnames = [], ?\context_course $context = null): array {
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
                    foreach (self::users($values, $field, $chunk, $context) as $value => $records) {
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
        if ($context !== null) {
            [$enrolledsql, $enrolledparams] = get_enrolled_sql($context);
            $joins .= " JOIN ($enrolledsql) enrolled ON enrolled.id = r.id";
            $params += $enrolledparams;
        }
        return self::matches($values, 'user', $column, $joins, $conditions, $params, $context ? 'r.id' : 'r.*');
    }

    /**
     * Match group/grouping names with the same database comparison as native lookups.
     */
    public static function names(string $table, int $courseid, array $names): array {
        if (!in_array($table, ['groups', 'groupings'], true)) {
            throw new \coding_exception('Unsupported course-name table.');
        }
        if ($table === 'groups') {
            // The groups_get_group_by_name function uses PHP == over native cached course
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
    private static function matches(
        array $values,
        string $table,
        string $column,
        string $joins,
        string $conditions,
        array $fixedparams,
        string $fields = 'r.*'
    ): array {
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
            $sql = 'SELECT ' . $fields . ', inputs.inputindex AS batchinputindex FROM {' . $table . '} r ' . $joins .
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

    /**
     * All ordinary enrolments, including suspended/disabled, as is_enrolled's default.
     *
     * With $userids, only those users are read (same rules, bounded to the selection):
     * a mutation of five members no longer loads every participant of the course.
     *
     * @param \context_course $context Course context.
     * @param int[]|null $userids Optional selection; null reads the whole course.
     * @return array User id => record with id.
     */
    public static function enrolled(\context_course $context, ?array $userids = null): array {
        global $DB, $USER;
        [$sql, $params] = get_enrolled_sql($context);
        $users = [];
        if ($userids === null) {
            $users = $DB->get_records_sql('SELECT u.id FROM {user} u JOIN (' . $sql . ') e ON e.id = u.id ' .
                'WHERE u.deleted = 0', $params);
        } else {
            $userids = array_values(array_unique(array_filter(array_map('intval', $userids), static function (int $id): bool {
                return $id > 0;
            })));
            foreach (array_chunk($userids, self::CHUNK_SIZE) as $chunk) {
                [$insql, $inparams] = $DB->get_in_or_equal($chunk, SQL_PARAMS_NAMED, 'enrolleduser');
                $users += $DB->get_records_sql('SELECT u.id FROM {user} u JOIN (' . $sql . ') e ON e.id = u.id ' .
                    'WHERE u.deleted = 0 AND u.id ' . $insql, $params + $inparams);
            }
        }
        // The is_enrolled function checks the current actor's active cached enrolment first.
        if (
            !empty($USER->id) && ($userids === null || in_array((int)$USER->id, $userids, true)) &&
                is_enrolled($context, $USER->id)
        ) {
            $users[$USER->id] = (object)['id' => $USER->id];
        }
        foreach ($users as $id => $user) {
            if (isguestuser($id)) {
                unset($users[$id]);
            }
        }
        return $users;
    }

    /**
     * Group memberships and grouping assignments, keyed by their actual IDs.
     *
     * With $groupids (and optionally $userids), only those groups (and users) are read:
     * a membership mutation checks its own pairs without loading the whole course.
     *
     * @param int $courseid Course id.
     * @param int[]|null $groupids Optional group selection; null reads the whole course.
     * @param int[]|null $userids Optional user selection for memberships; null reads every member.
     * @return array [members groupid => userid => true, assignments groupid => groupingid => true]
     */
    public static function relationships(int $courseid, ?array $groupids = null, ?array $userids = null): array {
        global $DB;
        $members = [];
        $assignments = [];
        $groupchunks = [null];
        if ($groupids !== null) {
            $groupchunks = array_chunk(self::positive_ids($groupids), intdiv(self::CHUNK_SIZE, 2));
        }
        $userchunks = [null];
        if ($userids !== null) {
            $userchunks = array_chunk(self::positive_ids($userids), intdiv(self::CHUNK_SIZE, 2));
        }
        foreach ($groupchunks as $groupchunk) {
            [$groupwhere, $groupparams] = self::bounded_where('g.id', $groupchunk, 'relgroup');
            foreach ($userchunks as $userchunk) {
                [$userwhere, $userparams] = self::bounded_where('m.userid', $userchunk, 'reluser');
                $records = $DB->get_recordset_sql(
                    'SELECT m.id, m.groupid, m.userid FROM {groups_members} m ' .
                    'JOIN {groups} g ON g.id = m.groupid WHERE g.courseid = :courseid' . $groupwhere . $userwhere,
                    ['courseid' => $courseid] + $groupparams + $userparams
                );
                try {
                    foreach ($records as $record) {
                        $members[(int)$record->groupid][(int)$record->userid] = true;
                    }
                } finally {
                    $records->close();
                }
            }
            $records = $DB->get_recordset_sql(
                'SELECT a.id, a.groupid, a.groupingid FROM {groupings_groups} a ' .
                'JOIN {groups} g ON g.id = a.groupid WHERE g.courseid = :courseid' . $groupwhere,
                ['courseid' => $courseid] + $groupparams
            );
            try {
                foreach ($records as $record) {
                    $assignments[(int)$record->groupid][(int)$record->groupingid] = true;
                }
            } finally {
                $records->close();
            }
        }
        return [$members, $assignments];
    }

    /**
     * Distinct positive integer ids, in input order.
     *
     * @param array $ids Raw ids.
     * @return int[]
     */
    private static function positive_ids(array $ids): array {
        return array_values(array_unique(array_filter(array_map('intval', $ids), static function (int $id): bool {
            return $id > 0;
        })));
    }

    /**
     * Optional IN restriction: empty SQL for an unbounded read, a never-true clause for an empty selection.
     *
     * @param string $column Column.
     * @param int[]|null $ids Selection, or null.
     * @param string $prefix Parameter prefix.
     * @return array [sql, params]
     */
    private static function bounded_where(string $column, ?array $ids, string $prefix): array {
        global $DB;
        if ($ids === null) {
            return ['', []];
        }
        if (!$ids) {
            return [' AND 1 = 0', []];
        }
        [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, $prefix);
        return [' AND ' . $column . ' ' . $insql, $params];
    }
}
