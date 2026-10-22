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
 * AJAX action: movestatus.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class movestatus implements ajax_action {
    /**
     * @inheritDoc
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB, $USER;

        $jobid = optional_param('jobid', 0, PARAM_INT);
        $conditions = ['courseid' => $course->id, 'userid' => $USER->id];
        $selection = 'courseid = :courseid AND userid = :userid';
        if ($jobid) {
            $conditions['id'] = $jobid;
            $selection .= ' AND id = :id';
        } else {
            // The list polls active jobs; an explicit id must still expose the final result.
            [$statussql, $statusparams] = $DB->get_in_or_equal(['queued', 'running', 'retry'], SQL_PARAMS_NAMED, 'movestatus');
            $selection .= ' AND status ' . $statussql;
            $conditions += $statusparams;
        }
        $jobs = $DB->get_records_select(
            'local_groupimport_moves',
            $selection,
            $conditions,
            'id DESC',
            'id, status, nextitem, total'
        );
        $response['jobs'] = [];
        foreach ($jobs as $job) {
            if (($jobid && (int)$job->id === $jobid) || (!$jobid && in_array($job->status, ['queued', 'running', 'retry']))) {
                $response['jobs'][] = \local_groupimport\local\move_job::progress($job);
            }
        }
        $response['success'] = true;

        return $response;
    }
}
