<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Upgrade hook.
 *
 * @param int $oldversion
 * @return bool
 */
function xmldb_local_groupimport_upgrade(int $oldversion): bool {
    global $DB;

    if ($oldversion < 2026010503) {

        if (class_exists('\tool_usertours\manager')) {

            $tours = [
                [
                    'name' => 'tour_groupimport_teacher_name,local_groupimport',
                    'pathmatch' => '/local/groupimport/index.php%',
                    'json' => __DIR__ . '/tours/local_groupimport_teacher_guide.json',
                ],
                [
                    'name' => 'tour_groupimport_coursehome_name,local_groupimport',
                    'pathmatch' => '/course/view.php%',
                    'json' => __DIR__ . '/tours/local_groupimport_course_home_hint.json',
                ],
            ];

            foreach ($tours as $tour) {
                if ($DB->record_exists('tool_usertours_tours', ['name' => $tour['name'], 'pathmatch' => $tour['pathmatch']])) {
                    continue;
                }
                if (!file_exists($tour['json'])) {
                    continue;
                }
                $json = file_get_contents($tour['json']);
                if ($json === false || trim($json) === '') {
                    continue;
                }
                \tool_usertours\manager::import_tour_from_json($json);
            }
        }

        upgrade_plugin_savepoint(true, 2026010503, 'local', 'groupimport');
    }

    return true;
}
