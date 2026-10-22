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

use local_groupimport\local\bulk_action;

/**
 * AJAX action: deletegroupings.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class deletegroupings implements ajax_action {
    /**
     * @inheritDoc
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $groupingids = required_param_array('groupingids', PARAM_INT);
        bulk_action::validate_size(count($groupingids));
        $deleted = 0;

        $groupings = \local_groupimport\local\batch_reader::records(
            'groupings',
            $groupingids,
            ['courseid' => $course->id]
        );
        bulk_action::run(count($groupingids), static function () use ($groupingids, $groupings, &$deleted) {
            foreach (array_unique($groupingids) as $groupingid) {
                $grouping = $groupings[$groupingid] ?? null;
                if (!$grouping) {
                    continue;
                }

                if (!groups_delete_grouping($grouping)) {
                    throw new \moodle_exception('ajaxunexpectederror', 'local_groupimport');
                }
                $deleted++;
            }
        });

        $response['success'] = true;
        $response['message'] = \local_groupimport_count_string('groupingsdeleted', (int)$deleted);

        return $response;
    }
}
