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
 * Present a native Moodle checkbox setting with the Kit captionless switch.
 *
 * Storage, validation, dependencies, readonly and default values remain native.
 * A checkbox with role=switch exposes its live native checked state to assistive
 * technology, without a duplicated aria-checked attribute becoming stale.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class admin_setting_switch extends \admin_setting_configcheckbox {
    /**
     * Render the same setting context/default information with a Kit control.
     *
     * @param string $data Current stored or submitted value.
     * @param string $query Admin search text.
     * @return string Formatted Moodle setting row.
     */
    public function output_html($data, $query = '') {
        global $OUTPUT;

        $context = [
            'id' => $this->get_id(),
            'name' => $this->get_full_name(),
            'no' => $this->no,
            'value' => $this->yes,
            'checked' => (string)$data === $this->yes,
            'readonly' => $this->is_readonly(),
            'label' => strip_tags($this->visiblename),
        ];
        $default = $this->get_defaultsetting();
        $defaultinfo = is_null($default) ? null : get_string(
            (string)$default === $this->yes ? 'checkboxyes' : 'checkboxno',
            'admin'
        );
        $element = $OUTPUT->render_from_template('local_groupimport/admin_setting_switch', $context);

        return format_admin_setting($this, $this->visiblename, $element, $this->description, true, '', $defaultinfo, $query);
    }
}
