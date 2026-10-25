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
 * Isolated notification boundary double.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class moodle_url {
    /**
     * Accept the job's existing course destination.
     *
     * @param string $path External fixture record path.
     * @param array $params Query parameters.
     */
    public function __construct(string $path, array $params) {
    }
    /**
     * Return a fixed synthetic course link without a runtime.
     *
     * @param bool $escaped Whether URL output should be escaped.
     */
    public function out(bool $escaped): string {
        return '/local/groupimport/manage.php?id=7';
    }
}
