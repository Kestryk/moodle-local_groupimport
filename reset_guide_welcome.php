<?php
// This file is part of Moodle - https://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

/** Explicit administrator confirmation; never reset while rendering a page. */
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
$PAGE->requires->css('/local/groupimport/styles.css');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    require_sesskey();
    if (required_param('confirm', PARAM_BOOL)) {
        \local_groupimport\local\guide_welcome::reset();
        redirect($returnurl, get_string('guidewelcomeresetdone', 'local_groupimport'), null,
            \core\output\notification::NOTIFY_SUCCESS);
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
]);
echo $OUTPUT->footer();
