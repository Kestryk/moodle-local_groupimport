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
 * Database double; the progress row and native effects roll back together.
 *
 * @package local_groupimport
 */
final class move_job_test_db {
    /** @var object Durable progress. */
    public object $job;
    /** @var array Native effects. */
    public array $moved = [];
    /** @var bool Dispatch a controlled message-processor error after the commit. */
    public bool $throwcommit = false;
    /**
     * Read an isolated job snapshot.
     *
     * @param string $table Table name accepted by the database double.
     * @param array $conditions Lookup conditions accepted by the database double.
     */
    public function get_record(string $table, array $conditions): object {
        return clone $this->job;
    }
    /**
     * Begin an isolated delegated transaction.
     */
    public function start_delegated_transaction(): object {
        return new class ($this) {
            /** @var object Owned database double. */
            private object $db;
            /** @var string Original state. */
            private string $snapshot;
            /** @var bool Commit has already disposed of this transaction. */
            private bool $disposed = false;
            /**
             * Capture the atomic state.
             *
             * @param object $db Owned database double.
             */
            public function __construct(object $db) {
                $this->db = $db;
                $this->snapshot = serialize([$db->job, $db->moved]);
            }
            /**
             * Commit the bounded batch.
             */
            public function allow_commit(): void {
                $this->disposed = true;
                if ($this->db->throwcommit) {
                    $this->db->throwcommit = false;
                    throw new \RuntimeException('Injected message processor failure.');
                }
            }
            /**
             * Revert both the provisional effect and the cursor.
             *
             * @param \Throwable $exception Failure to rethrow after rollback.
             */
            public function rollback(\Throwable $exception): void {
                if ($this->disposed) {
                    throw new \RuntimeException('Disposed transaction rollback.');
                }
                [$this->db->job, $this->db->moved] = unserialize($this->snapshot);
                throw $exception;
            }
        };
    }
    /**
     * Persist the progress row.
     *
     * @param string $table Table name accepted by the database double.
     * @param object $job Job state to store.
     */
    public function update_record(string $table, object $job): void {
        $this->job = clone $job;
    }
    /**
     * Persist a scalar state.
     *
     * @param string $table Table name accepted by the database double.
     * @param string $key Requested field or string key.
     * @param mixed $value Value to store.
     * @param array $conditions Lookup conditions accepted by the database double.
     */
    public function set_field(string $table, string $key, $value, array $conditions): void {
        $this->job->{$key} = $value;
    }
    /**
     * Return a scalar state.
     *
     * @param string $table Table name accepted by the database double.
     * @param string $key Requested field or string key.
     * @param array $conditions Lookup conditions accepted by the database double.
     */
    public function get_field(string $table, string $key, array $conditions) {
        return $this->job->{$key};
    }
    /**
     * Count a retry without storing an exception's personal data.
     *
     * @param string $sql Query accepted by the database double.
     * @param array $params Query parameters.
     */
    public function execute(string $sql, array $params): void {
        $this->job->failcount++;
    }
}
