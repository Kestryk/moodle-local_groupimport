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
 * AJAX action: userdetails.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class userdetails implements ajax_action {
    /**
     * Handle the userdetails AJAX action.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        $userid = required_param('userid', PARAM_INT);
        $response['details'] = \local_groupimport\service\course_structure::get_user_details(
            $course,
            $context,
            $userid
        );
        $response['success'] = true;

        return $response;
    }
}
