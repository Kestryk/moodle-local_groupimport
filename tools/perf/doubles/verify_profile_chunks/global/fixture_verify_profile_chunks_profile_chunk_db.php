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
 * Isolated CLI fixture definitions for the existing test contracts.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Isolated fixture double for profile_chunk_db.
 */
class fixture_verify_profile_chunks_profile_chunk_db {
    /**
     * @var mixed Standalone fixture state.
     */
    public array $sizes = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public int $closed = 0;
    /**
     * Perform isolated fixture operation get_in_or_equal.
     * @param mixed $values Fixture argument.
     * @param mixed $type Fixture argument.
     * @param mixed $prefix Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_in_or_equal($values, $type, $prefix = 'param') {
        $params = [];
        foreach (array_values($values) as $i => $value) {
            $params[$prefix . $i] = $value;
        }
        if ($prefix !== 'field') {
            $this->sizes[] = count($values);
        }
        return ['IN (' . implode(',', array_map(static fn($key) => ':' . $key, array_keys($params))) . ')', $params];
    }
    /**
     * Perform isolated fixture operation rows.
     * @param array $params Fixture argument.
     * @return array Fixture result.
     */
    public function rows(array $params): array {
        $rows = [];
        foreach ($params as $key => $id) {
            if (str_starts_with($key, 'field')) {
                continue;
            }
            foreach (['alpha', 'beta'] as $field) {
                $rows[] = (object)['id' => $id * 2 + ($field === 'beta' ? 1 : 0),
                    'userid' => $id, 'shortname' => $field, 'data' => '<b>' . $field . '-' . $id . '</b>'];
            }
        }
        return $rows;
    }
    /**
     * Perform isolated fixture operation get_recordset_sql.
     * @param mixed $sql Fixture argument.
     * @param mixed $params Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_recordset_sql($sql, $params) {
        return new class ($this->rows($params), $this) extends ArrayIterator {
            /**
             * Perform isolated fixture operation __construct.
             * @param array $rows Fixture argument.
             * @param profile_chunk_db $db Fixture argument.
             * @return mixed Fixture result.
             */
            public function __construct(
                array $rows,
                /** @var mixed Isolated fixture state. */
                public profile_chunk_db $db
            ) {
                parent::__construct($rows);
            }
            /**
             * Perform isolated fixture operation close.
             * @return void Fixture result.
             */
            public function close(): void {
                $this->db->closed++;
            }
        };
    }
    /**
     * Perform isolated fixture operation get_records_sql.
     * @param mixed $sql Fixture argument.
     * @param mixed $params Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_records_sql($sql, $params) {
        $rows = [];
        // Preserve the historical userid-first-column collision, not a redesign.
        foreach ($this->rows($params) as $row) {
            $rows[$row->userid] = $row;
        }
        return $rows;
    }
}
