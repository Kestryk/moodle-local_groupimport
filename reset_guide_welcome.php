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
 * Explicit administrator confirmation; never reset while rendering a page.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_login(null, false);
$context = context_system::instance();
require_capability('moodle/site:config', $context);
$url = new moodle_url('/local/groupimport/reset_guide_welcome.php');
$returnurl = new moodle_url('/admin/settings.php', ['section' => 'local_groupimport']);
$PAGE->set_url($url);
$PAGE->set_context($context);
$PAGE->set_pagelayout('admin');
$PAGE->set_title(get_string('guidewelcomereset', 'local_groupimport'));
$PAGE->set_heading(get_string('guidewelcomereset', 'local_groupimport'));
$PAGE->requires->css('/local/groupimport/styles/administration.css');
// Animation level (user choice, else administrator default) for the Kit CSS and Motion.
$motionlevel = \local_groupimport\local\motion::apply_to_page($PAGE);
$PAGE->requires->js_call_amd('local_groupimport/easyedu_confirmation', 'init', ['#easyedu-welcome-reset']);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    require_sesskey();
    if (required_param('confirm', PARAM_BOOL)) {
        \local_groupimport\local\guide_welcome::reset();
        redirect(
            $returnurl,
            get_string('guidewelcomeresetdone', 'local_groupimport'),
            null,
            \core\output\notification::NOTIFY_SUCCESS
        );
    }
    redirect($returnurl);
}

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_groupimport/guide_welcome_reset', [
    'title' => get_string('guidewelcomereset', 'local_groupimport'),
    'description' => get_string('guidewelcomeresetconfirm', 'local_groupimport'),
    'confirm' => get_string('guidewelcomereset', 'local_groupimport'),
    'cancel' => get_string('cancel'),
    'action' => $url->out(false),
    'cancelurl' => $returnurl->out(false),
    'sesskey' => sesskey(),
    'motionlevel' => $motionlevel,
]);
echo $OUTPUT->footer();
