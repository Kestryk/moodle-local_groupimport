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
 * Named fixture double preserving the previous anonymous implementation.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Isolated test double.
 */
class fixture_r8_history_list_isolated_anonymous_1 {
    /**
     * @var mixed Standalone fixture state.
     */
    public PDO $pdo;
    /**
     * @var mixed Standalone fixture state.
     */
    public int $calls = 0;
    /**
     * @var mixed Standalone fixture state.
     */
    public string $lastsql = '';
    /**
     * Perform isolated fixture operation __construct.
     * @return mixed Fixture result.
     */
    public function __construct() {
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->exec('CREATE TABLE local_groupimport_history(id INTEGER PRIMARY KEY,courseid INTEGER,' .
            'filename TEXT,timecreated INTEGER,rowcount INTEGER,successcount INTEGER,errorcount INTEGER,' .
            'timerolledback INTEGER,changesjson TEXT,reportjson TEXT,filehash TEXT)');
    }
    /**
     * Perform isolated fixture operation sql_length.
     * @param mixed $field Fixture argument.
     * @return mixed Fixture result.
     */
    public function sql_length($field) {
        return 'LENGTH(' . $field . ')';
    }
    /**
     * Perform isolated fixture operation get_records_sql.
     * @param mixed $sql Fixture argument.
     * @param mixed $params Fixture argument.
     * @param mixed $start Fixture argument.
     * @param mixed $limit Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_records_sql($sql, $params, $start, $limit) {
        $this->calls++;
        $this->lastsql = $sql;
        $sql = str_replace(
            '{local_groupimport_history}',
            'local_groupimport_history',
            $sql
        ) . ' LIMIT ' . (int)$limit . ' OFFSET ' . (int)$start;
        $q = $this->pdo->prepare($sql);
        $q->execute($params);
        $rows = $q->fetchAll(PDO::FETCH_OBJ);
        $result = [];
        foreach ($rows as $row) {
            $result[$row->id] = $row;
        }
        return $result;
    }
}
