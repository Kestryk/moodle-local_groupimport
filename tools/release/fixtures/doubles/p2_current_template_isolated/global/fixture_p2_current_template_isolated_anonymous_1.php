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
class fixture_p2_current_template_isolated_anonymous_1 {
    /**
     * Perform isolated fixture operation __construct.
     * @param private $root Fixture argument.
     * @return mixed Fixture result.
     */
    public function __construct(
        /**
         * @var mixed Standalone fixture state.
         */
        private $root
    ) {
    }
    /**
     * Perform isolated fixture operation load.
     * @param mixed $name Fixture argument.
     * @return mixed Fixture result.
     */
    public function load($name) {
        $name = preg_replace('~^local_groupimport/~', '', $name);
        if (!preg_match('~^[a-zA-Z0-9_/-]+$~', $name) || str_contains($name, '..')) {
            throw new RuntimeException('Invalid partial');
        }
        $p = $this->root . '/templates/' . $name . '.mustache';
        if (!is_file($p)) {
            throw new RuntimeException('Missing partial ' . $name);
        }
        return file_get_contents($p);
    }
}
