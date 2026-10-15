<?php
// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_groupimport\form;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->libdir . '/formslib.php');

/**
 * Import form for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class import_form extends \moodleform {

    /**
     * Defines the form elements.
     *
     * @return void
     */
    public function definition(): void {
        $mform = $this->_form;

        // Retrieve the course id passed via customdata.
        $courseid = (int)($this->_customdata['courseid'] ?? 0);

        // Hidden field to return the course id on submit.
        $mform->addElement('hidden', 'id', $courseid);
        $mform->setType('id', PARAM_INT);

        // Kit surface around the real Moodle picker: draft IDs, progress,
        // replacement, keyboard access and validation remain Moodle-owned.
        $mform->addElement('html', \html_writer::start_div('easyedu-file-deposit easyedu-file-deposit--moodle easyedu-file-deposit--small-icon easyedu-file-deposit--aligned', [
            'data-easyedu-drop-label' => get_string('csvdropready', 'local_groupimport'),
            'data-easyedu-remove-label' => get_string('removeimportfile', 'local_groupimport'),
            'data-easyedu-file-mode' => 'single',
        ]));
        $mform->addElement('html', \html_writer::div(
            \html_writer::span(
                \html_writer::span('', 'fa fa-cloud-upload', ['aria-hidden' => 'true']),
                'easyedu-file-deposit__icon easyedu-icon-tile', ['aria-hidden' => 'true']
            ) . \html_writer::tag('h3', get_string('filedeposittitle', 'local_groupimport'),
                ['class' => 'easyedu-file-deposit__title']),
            'easyedu-file-deposit__heading'
        ));
        $mform->addElement('html', \html_writer::tag('p', get_string('filedepositsupport', 'local_groupimport'),
            ['class' => 'easyedu-file-deposit__support']));
        $mform->addElement('html', \html_writer::start_div('easyedu-file-deposit__control'));

        // Import file.
        $mform->addElement(
            'filepicker',
            'importfile',
            get_string('importfile', 'local_groupimport'),
            null,
            ['accepted_types' => ['.csv', '.xls', '.xlsx'], 'maxfiles' => 1,
                'maxbytes' => \local_groupimport\local\import_preview::MAX_BYTES]
        );
        $mform->addRule('importfile', null, 'required', null, 'client');
        $mform->addElement('html', \html_writer::end_div());
        $mform->addElement('html', \html_writer::div(
            \html_writer::tag('strong', get_string('filedepositformats', 'local_groupimport')) .
            \html_writer::span(get_string('filedepositformatsdetail', 'local_groupimport')) .
            \html_writer::span(get_string('importlimits', 'local_groupimport', (object)[
                'rows' => \local_groupimport\local\import_execution::MAX_ROWS,
                'mb' => 5,
            ])),
            'easyedu-file-deposit__requirements'
        ));
        $mform->addElement('html', \html_writer::end_div());

        $submitlabel = $this->_customdata['submitlabel'] ?? get_string('previewimport', 'local_groupimport');

        // Reuse the canonical warning notice; the adapter blocks an empty or
        // still-uploading picker before navigation, without bypassing Moodle validation.
        $mform->addElement('html', \html_writer::div(
            \html_writer::span('', 'fa fa-exclamation-triangle', ['aria-hidden' => 'true']) .
            \html_writer::tag('p', get_string('importfilerequired', 'local_groupimport')),
            'easyedu-notice easyedu-notice--warning',
            ['role' => 'alert', 'hidden' => 'hidden', 'data-local-groupimport-file-required' => '1']
        ));

        // Submit button. The import is only executed after the preview confirmation.
        $mform->addElement('html', \html_writer::start_div('easyedu-form-actions'));
        $this->add_action_buttons(false, $submitlabel);
        $mform->addElement('html', \html_writer::end_div());
        $mform->addElement('html', \html_writer::tag('p', get_string('previewnochanges', 'local_groupimport'),
            ['class' => 'easyedu-caption easyedu-form-note']));
    }
}
