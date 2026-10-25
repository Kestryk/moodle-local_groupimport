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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace local_groupimport\local;

/**
 * Native Moodle admin section heading carrying a decorative Kit icon tile.
 *
 * The heading keeps Moodle's own core_admin/setting_heading markup (h3.main
 * followed by the description box), so the section card adapter and admin
 * search keep working; only a decorative, hidden-from-assistive-technology
 * icon tile is placed before the escaped section title (K21-15).
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class admin_setting_section_heading extends \admin_setting_heading {
    /** @var string Font Awesome icon name, for example "fa-sliders". */
    protected $icon;

    /**
     * Create the section heading.
     *
     * @param string $name Unique setting name.
     * @param string $heading Section title (plain text).
     * @param string $information Section description HTML.
     * @param string $icon Font Awesome icon name (letters, digits and dashes only).
     */
    public function __construct($name, $heading, $information, string $icon) {
        $this->icon = preg_replace('/[^a-z0-9-]/', '', $icon);
        parent::__construct($name, $heading, $information);
    }

    /**
     * Render the native heading template with the icon tile before the title.
     *
     * @param mixed $data Unused (headings store nothing).
     * @param string $query Admin search text.
     * @return string HTML.
     */
    public function output_html($data, $query = '') {
        global $OUTPUT;

        $icon = \html_writer::span(
            \html_writer::span('', 'fa ' . $this->icon),
            'local-groupimport-admin-settings__section-icon',
            ['aria-hidden' => 'true']
        );
        $context = (object)[
            'title' => $icon . \html_writer::span(
                highlight($query, s($this->visiblename)),
                'local-groupimport-admin-settings__section-title'
            ),
            'description' => $this->description,
            'descriptionformatted' => highlight($query, markdown_to_html($this->description)),
        ];

        return $OUTPUT->render_from_template('core_admin/setting_heading', $context);
    }
}
