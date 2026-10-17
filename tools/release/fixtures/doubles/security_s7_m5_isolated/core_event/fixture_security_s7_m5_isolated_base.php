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

namespace core\event;

/**
 * Isolated fixture double for base.
 */
class fixture_security_s7_m5_isolated_base {
    /** Fixture teaching-context marker. */
    const LEVEL_TEACHING = 1;
    /**
     * @var mixed Standalone fixture state.
     */
    protected array $data = [];
    /**
     * Perform isolated fixture operation __get.
     * @param mixed $key Fixture argument.
     * @return mixed Fixture result.
     */
    public function __get($key) {
        return $this->data[$key] ?? null;
    }
    /**
     * Perform isolated fixture operation create.
     * @param array $data Fixture argument.
     * @return static Fixture result.
     */
    public static function create(array $data): static {
        $e = new static();
        $e->data = $data + ['userid' => 77, 'courseid' => $data['context']->instanceid];
        $e->init();
        return $e;
    }
    /**
     * Perform isolated fixture operation trigger.
     * @return void Fixture result.
     */
    public function trigger(): void {
        $GLOBALS['events'][] = ['data' => $this->data, 'description' => $this->get_description(), 'name' => $this->get_name()];
    }
}
