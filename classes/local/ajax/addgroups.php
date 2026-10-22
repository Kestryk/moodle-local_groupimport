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
 * AJAX action: addgroups.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class addgroups implements ajax_action {
    /**
     * @inheritDoc
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $rawgroups = required_param('groups', PARAM_TEXT);
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);
        $coursegroups = groups_get_all_groups($course->id) ?: [];
        $tokens = \local_groupimport_extract_group_tokens($rawgroups, $coursegroups);

        $groupsbyid = [];
        $groupsbyname = [];
        foreach ($coursegroups as $group) {
            $groupsbyid[(int)$group->id] = $group;
            $normalizedname = \core_text::strtolower(trim($group->name));
            if (!isset($groupsbyname[$normalizedname])) {
                $groupsbyname[$normalizedname] = [];
            }
            $groupsbyname[$normalizedname][] = $group;
        }

        $matchedgroups = [];
        $missing = [];
        $ambiguous = [];

        foreach ($tokens as $token) {
            if ($token === '') {
                continue;
            }

            if (ctype_digit($token) && isset($groupsbyid[(int)$token])) {
                $matchedgroups[(int)$token] = $groupsbyid[(int)$token];
                continue;
            }

            $normalizedtoken = \core_text::strtolower($token);
            $namecandidates = $groupsbyname[$normalizedtoken] ?? [];
            if (count($namecandidates) === 1) {
                $group = reset($namecandidates);
                $matchedgroups[(int)$group->id] = $group;
            } else if (count($namecandidates) > 1) {
                $ambiguous[] = $token;
            } else {
                $missing[] = $token;
            }
        }

        $addedgroups = [];
        $existing = 0;
        foreach ($matchedgroups as $group) {
            if (
                \local_groupimport\service\membership_assignment::add_group_to_grouping(
                    (int)$course->id,
                    (int)$group->id,
                    $groupingid
                )
            ) {
                $addedgroups[] = [
                    'id' => (int)$group->id,
                    'name' => format_string($group->name),
                ];
            } else {
                $existing++;
            }
        }

        $response['success'] = true;
        $response['groups'] = $addedgroups;
        $response['existing'] = $existing;
        $response['missing'] = array_values(array_unique($missing));
        $response['ambiguous'] = array_values(array_unique($ambiguous));
        $response['message'] = get_string('groupsaddsummary', 'local_groupimport', (object)[
            'added' => count($addedgroups),
            'existing' => $existing,
        ]);

        return $response;
    }
}
