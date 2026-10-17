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
 * Isolated fixture double for moodle_exception.
 */
class fixture_lib_moodle_exception extends Exception {
    /**
     * @var string In-memory fixture state.
     */
    public string $errorcode;
    /**
     * Perform the isolated __construct fixture operation.
     *
     * @param string $code Fixture argument.
     * @param string $component Fixture argument.
     */
    public function __construct(string $code, string $component = 'error') {
        $this->errorcode = $code;
        parent::__construct($code);
    }
}
