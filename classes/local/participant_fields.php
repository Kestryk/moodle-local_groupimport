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

namespace local_groupimport\local;

/**
 * Shared participant field definitions and the existing Moodle visibility policy.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class participant_fields {
    /**
     * Identification fields enabled in the plugin settings (AP-A5: Moodle id + these fields only).
     *
     * @return array Field key => label, in settings order.
     */
    public static function identifier_field_definitions(): array {
        global $DB;

        $definitions = [
            'username' => get_string('username'),
            'email' => get_string('email'),
            'idnumber' => get_string('idnumber'),
        ];
        foreach ($DB->get_records('user_info_field', null, 'name ASC', 'id, shortname, name') as $field) {
            $definitions['profile_field_' . $field->shortname] = format_string($field->name);
        }

        $config = get_config('local_groupimport');
        $allowed = !empty($config->alloweduserfields)
            ? array_map('trim', explode(',', $config->alloweduserfields))
            : ['username', 'email'];

        $result = [];
        foreach ($allowed as $fieldkey) {
            if (isset($definitions[$fieldkey])) {
                $result[$fieldkey] = $definitions[$fieldkey];
            }
        }

        return $result;
    }

    /**
     * Participant card badge and detail fields configured in the plugin settings.
     *
     * @param \context_course $context Course context.
     * @return array {primary: ?array, details: array}
     */
    public static function display_settings(\context_course $context): array {
        global $DB;

        $customfields = [];
        foreach ($DB->get_records('user_info_field', null, 'name ASC') as $field) {
            // Field-level check, as core_userields::get_identity_fields() does. The signup flag is
            // cleared: with no user id, is_visible() would otherwise treat it as a signup form.
            $fielddata = clone $field;
            $fielddata->signup = 0;
            if (profile_get_user_field($field->datatype, (int)$field->id, 0, $fielddata)->is_visible($context)) {
                $customfields['profile_field_' . $field->shortname] = format_string($field->name);
            }
        }

        $config = get_config('local_groupimport');
        $primarykey = !empty($config->participantprimarybadgefield) && isset($customfields[$config->participantprimarybadgefield])
            ? (string)$config->participantprimarybadgefield
            : '';

        $details = [];
        foreach (['participantdetailfield1', 'participantdetailfield2'] as $settingname) {
            $fieldkey = !empty($config->{$settingname}) ? (string)$config->{$settingname} : '';
            if (
                $fieldkey !== '' && isset($customfields[$fieldkey]) && $fieldkey !== $primarykey &&
                    !in_array($fieldkey, array_column($details, 'key'), true)
            ) {
                $details[] = ['key' => $fieldkey, 'label' => $customfields[$fieldkey]];
            }
        }

        return [
            'primary' => $primarykey === '' ? null : [
                'key' => $primarykey,
                'label' => $customfields[$primarykey],
                'bgcolor' => self::normalise_hex_colour($config->participantprimarybadgebgcolor ?? '', '#e8f4ff'),
                'textcolor' => self::normalise_hex_colour($config->participantprimarybadgetextcolor ?? '', '#0b4f8a'),
            ],
            'details' => $details,
        ];
    }

    /**
     * Normalise a stored colour before the browser injects it into inline CSS variables.
     *
     * @param string|null $colour Stored colour.
     * @param string $fallback Fallback colour.
     * @return string Safe lowercase hex colour.
     */
    public static function normalise_hex_colour(?string $colour, string $fallback): string {
        $colour = trim((string)$colour);
        return preg_match('/^#[0-9a-fA-F]{6}$/', $colour) ? \core_text::strtolower($colour) : $fallback;
    }
}
