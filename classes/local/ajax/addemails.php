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
 * AJAX action: addemails.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class addemails implements ajax_action {
    /**
     * @inheritDoc
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $rawemails = required_param('emails', PARAM_TEXT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        $tokens = \local_groupimport_extract_user_tokens($rawemails);
        bulk_action::validate_size(count($tokens));
        $addedusers = [];
        $existing = 0;
        $missing = [];

        $resolvedusers = \local_groupimport_find_users_by_identifiers($tokens);
        $enrolledusers = \local_groupimport\local\batch_reader::enrolled(
            $context,
            array_map(static function ($user): int {
                return (int)$user->id;
            }, array_values(array_filter($resolvedusers)))
        );
        bulk_action::run(count($tokens), static function () use (
            $course,
            $groupid,
            $tokens,
            $resolvedusers,
            $enrolledusers,
            &$addedusers,
            &$existing,
            &$missing,
        ) {
            $eligible = [];
            foreach ($tokens as $token) {
                $user = $resolvedusers[$token] ?? null;
                if (!$user || !isset($enrolledusers[$user->id])) {
                    $missing[] = $token;
                    continue;
                }
                $eligible[] = $user;
            }
            $results = \local_groupimport\service\membership_assignment::add_users_to_group(
                (int)$course->id,
                $groupid,
                array_map(static function ($user): int {
                    return (int)$user->id;
                }, $eligible)
            );
            $reported = [];
            foreach ($eligible as $user) {
                // Two tokens of one user: the first reports the result, the next one is already a member.
                if (!empty($results[(int)$user->id]) && empty($reported[(int)$user->id])) {
                    $addedusers[] = [
                        'id' => (int)$user->id,
                        'fullname' => fullname($user),
                    ];
                } else {
                    $existing++;
                }
                $reported[(int)$user->id] = true;
            }
        });

        $response['success'] = true;
        $response['added'] = count($addedusers);
        $response['users'] = $addedusers;
        $response['existing'] = $existing;
        $response['missing'] = $missing;
        $response['skipped'] = count($missing);
        $response['message'] = get_string('usersaddsummary', 'local_groupimport', (object)[
            'added' => count($addedusers),
            'existing' => $existing,
        ]);
        if ($missing) {
            $response['message'] .= ' ' . get_string('bulkitemsskipped', 'local_groupimport', count($missing));
        }

        return $response;
    }
}
