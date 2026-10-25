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

namespace local_groupimport\local\ajax;

/**
 * Contract for one `ajax.php` action, routed from a static table (I6 preparation for S8).
 *
 * Each implementation keeps the exact behaviour, security checks and JSON response shape
 * that previously lived in its `ajax.php` `if`/`else if` branch. This is an intermediate
 * routing step only: the branches were extracted verbatim, not redesigned.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
interface ajax_action {
    /**
     * Execute the action and return the updated response payload.
     *
     * $course, $context and $USER/$sesskey have already been validated by `ajax.php`
     * (require_request, require_sesskey, require_login, the managegroups capability).
     *
     * @param \stdClass $course Current course record.
     * @param \context_course $context Course context.
     * @param array $response Response payload so far (`['success' => false]` at minimum).
     * @return array Updated response payload.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array;
}
