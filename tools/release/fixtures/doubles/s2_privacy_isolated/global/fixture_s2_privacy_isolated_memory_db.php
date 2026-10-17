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
 * Isolated fixture double for memory_db.
 */
class fixture_s2_privacy_isolated_memory_db {
    /** @var array Pending progress attached to histories. */
    public array $jobs = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public array $users = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public array $history = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public array $writes = [];
    /**
     * Perform isolated fixture operation get_record.
     * @param string $table Fixture argument.
     * @param array $conditions Fixture argument.
     * @param string $fields Fixture argument.
     * @param int $strict Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_record(string $table, array $conditions, string $fields, int $strict): mixed {
        if ($table !== 'user') {
            throw new \RuntimeException('Unexpected read');
        }
        return $this->users[$conditions['id']] ?? false;
    }
    /**
     * Perform isolated fixture operation get_recordset.
     * @param string $table Fixture argument.
     * @param array $conditions Fixture argument.
     * @param string $sort Fixture argument.
     * @return records Fixture result.
     */
    public function get_recordset(string $table, array $conditions = [], string $sort = ''): records {
        if ($table !== 'local_groupimport_history') {
            throw new \RuntimeException('Unexpected read');
        }
        return new records(array_map(fn($r) => clone $r, array_filter(
            $this->history,
            fn($r) => !isset($conditions['courseid']) || $r->courseid === $conditions['courseid']
        )));
    }
    /**
     * Perform isolated fixture operation get_in_or_equal.
     * @param array $values Fixture argument.
     * @param int $mode Fixture argument.
     * @param string $prefix Fixture argument.
     * @return array Fixture result.
     */
    public function get_in_or_equal(array $values, int $mode, string $prefix = 'param'): array {
        $params = [];
        foreach ($values as $i => $v) {
            $params[$prefix . $i] = $v;
        }
        return ['IN (' . implode(',', array_map(fn($k) => ':' . $k, array_keys($params))) . ')', $params];
    }
    /**
     * Perform isolated fixture operation get_records_select.
     * @param string $table Fixture argument.
     * @param string $select Fixture argument.
     * @param array $params Fixture argument.
     * @param string $sort Fixture argument.
     * @param string $fields Fixture argument.
     * @return array Fixture result.
     */
    public function get_records_select(string $table, string $select, array $params, string $sort, string $fields): array {
        if ($table !== 'user' || !preg_match('/LOWER\((email|username|idnumber)\)/', $select, $m)) {
            throw new \RuntimeException('Unexpected SQL');
        }
        return array_filter($this->users, fn($u) => in_array(core_text::strtolower($u->{$m[1]}), $params, true));
    }
    /**
     * Perform isolated fixture operation delete_records.
     * @param string $table Fixture argument.
     * @param array $conditions Fixture argument.
     * @return void Fixture result.
     */
    public function delete_records(string $table, array $conditions): void {
            $this->writes[] = $table;
        if ($table === 'local_groupimport_jobs') {
            foreach ($this->jobs as $id => $row) {
                if (array_all_local($conditions, fn($key, $value) => $row->$key == $value)) {
                    unset($this->jobs[$id]);
                }
            }
            return;
        }

        if ($table === 'local_groupimport_jobs') {
            foreach ($this->jobs as $id => $row) {
                if (array_all_local($conditions, fn($key, $value) => $row->$key == $value)) {
                    unset($this->jobs[$id]);
                }
            }
            return;
        }
        foreach ($this->history as $id => $row) {
            if (array_all_local($conditions, fn($key, $value) => $row->$key == $value)) {
                unset($this->history[$id]);
            }
        }
    }
    /**
     * Perform isolated fixture operation update_record.
     * @param string $table Fixture argument.
     * @param object $row Fixture argument.
     * @return void Fixture result.
     */
    public function update_record(string $table, object $row): void {
        $this->writes[] = $table;
        foreach ((array)$row as $key => $value) {
            $this->history[$row->id]->$key = $value;
        }
    }
    /**
     * Perform isolated fixture operation delete_records_select.
     * @param string $table Fixture argument.
     * @param string $sql Fixture argument.
     * @param array $params Fixture argument.
     * @return void Fixture result.
     */
    public function delete_records_select(string $table, string $sql, array $params = []): void {
        if ($table === 'local_groupimport_jobs') {
            if ($sql !== 'NOT EXISTS (SELECT 1 FROM {local_groupimport_history} h WHERE h.id = historyid)' || $params) {
                throw new \RuntimeException('Unexpected orphan-job SQL');
            }
            $this->writes[] = $table;
            $this->jobs = array_filter($this->jobs, fn($job) => isset($this->history[$job->historyid]));
            return;
        }
        if ($sql !== 'timecreated < :cutoff') {
            throw new \RuntimeException('Unexpected cutoff');
        }
            $this->writes[] = $table;
            $this->history = array_filter($this->history, fn($r) => $r->timecreated >= $params['cutoff']);
    }

    /**
     * Read only histories strictly older than the cutoff.
     * @param string $table Table.
     * @param string $sql Native predicate.
     * @param array $params Cutoff.
     * @return records
     */
    public function get_recordset_select(string $table, string $sql, array $params): records {
        if ($table !== 'local_groupimport_history' || $sql !== 'timecreated < :cutoff') {
            throw new RuntimeException('Unexpected retention query');
        }
        return new records(array_map(
            fn($r) => clone $r,
            array_filter($this->history, fn($row) => $row->timecreated < $params['cutoff'])
        ));
    }
}
