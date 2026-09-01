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

/**
 * Settings for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if (!class_exists('local_groupimport_admin_setting_configcolor')) {
    /**
     * Hex colour setting rendered as a native colour picker.
     *
     * Moodle core does not provide a dedicated colour admin control for plugin
     * settings, so this small wrapper keeps storage native while giving admins
     * a safer visual picker than a free text field.
     */
    class local_groupimport_admin_setting_configcolor extends admin_setting_configtext {
        /**
         * Validate a hexadecimal colour.
         *
         * @param string $data Submitted value.
         * @return true|string True when valid, otherwise an admin error string.
         */
        public function validate($data) {
            if (preg_match('/^#[0-9a-fA-F]{6}$/', (string)$data)) {
                return true;
            }

            return get_string('validateerror', 'admin');
        }

        /**
         * Render the colour picker.
         *
         * @param string $data Current value.
         * @param string $query Search query.
         * @return string Setting HTML.
         */
        public function output_html($data, $query = '') {
            $default = $this->get_defaultsetting();
            $value = preg_match('/^#[0-9a-fA-F]{6}$/', (string)$data) ? (string)$data : (string)$default;
            $attributes = [
                'type' => 'color',
                'id' => $this->get_id(),
                'name' => $this->get_full_name(),
                'value' => $value,
                'class' => 'local-groupimport-admin-settings__color-input',
            ];

            if ($this->is_readonly()) {
                $attributes['disabled'] = 'disabled';
            }

            $element = html_writer::div(
                html_writer::empty_tag('input', $attributes) .
                    html_writer::span(s(strtoupper($value)), 'local-groupimport-admin-settings__color-value'),
                'local-groupimport-admin-settings__color-control'
            );

            return format_admin_setting($this, $this->visiblename, $element, $this->description, true, '', $default, $query);
        }
    }
}

if ($hassiteconfig) {
    global $ADMIN, $DB, $PAGE;

    $PAGE->add_body_class('local-groupimport-admin-settings-page--loading');
    $PAGE->requires->js('/local/groupimport/js/admin_settings_loading.js', true);

    $settings = new admin_settingpage(
        'local_groupimport',
        get_string('pluginname', 'local_groupimport')
    );

    $ADMIN->add('localplugins', $settings);

    $corefieldoptions = [
        'username' => get_string('username'),
        'email' => get_string('email'),
        'idnumber' => get_string('idnumber'),
    ];
    $fieldoptions = $corefieldoptions;
    $customfieldoptions = [];

    $customfields = $DB->get_records('user_info_field', null, 'name ASC');
    foreach ($customfields as $field) {
        $key = 'profile_field_' . $field->shortname;
        $customfieldoptions[$key] = format_string($field->name);
        $fieldoptions[$key] = $customfieldoptions[$key];
    }
    $participantdisplayfieldoptions = ['' => get_string('none')] + $customfieldoptions;

    $renderchips = static function(array $fields, string $modifier): string {
        if (empty($fields)) {
            return html_writer::div(
                get_string('adminidentifiersnocustomfields', 'local_groupimport'),
                'local-groupimport-admin-settings__empty'
            );
        }

        $chips = [];
        foreach ($fields as $key => $label) {
            $chips[] = html_writer::span(
                html_writer::span('', 'fa fa-key', ['aria-hidden' => 'true']) .
                    html_writer::span(s($label), 'local-groupimport-admin-settings__chip-label') .
                    html_writer::span(s($key), 'local-groupimport-admin-settings__chip-key'),
                'local-groupimport-admin-settings__chip local-groupimport-admin-settings__chip--' . $modifier
            );
        }

        return html_writer::div(implode('', $chips), 'local-groupimport-admin-settings__chips');
    };

    $introhtml = html_writer::div(
        html_writer::div(
            html_writer::span('', 'fa fa-search', ['aria-hidden' => 'true']) .
                html_writer::div(
                    html_writer::tag('h3', get_string('adminidentifiersheroheading', 'local_groupimport')) .
                        html_writer::tag('p', get_string('adminidentifiersherobody', 'local_groupimport')),
                    'local-groupimport-admin-settings__hero-copy'
                ),
            'local-groupimport-admin-settings__hero'
        ) .
            html_writer::div(
                html_writer::div(
                    html_writer::tag('h4', get_string('adminidentifierscorefields', 'local_groupimport')) .
                        $renderchips($corefieldoptions, 'core'),
                    'local-groupimport-admin-settings__field-card'
                ) .
                    html_writer::div(
                        html_writer::tag('h4', get_string('adminidentifierscustomfields', 'local_groupimport')) .
                            $renderchips($customfieldoptions, 'custom'),
                        'local-groupimport-admin-settings__field-card'
                    ),
                'local-groupimport-admin-settings__field-grid'
            ) .
            html_writer::div(
                html_writer::tag('strong', get_string('adminidentifiershowtitle', 'local_groupimport')) .
                    html_writer::tag('span', get_string('adminidentifiershowbody', 'local_groupimport')),
                'local-groupimport-admin-settings__hint'
            ),
        'local-groupimport-admin-settings',
        ['data-local-groupimport-admin-settings' => '1']
    );

    $featureshtml = html_writer::div(
        html_writer::div(
            html_writer::span('', 'fa fa-sliders', ['aria-hidden' => 'true']) .
                html_writer::div(
                    html_writer::tag('h3', get_string('adminfeaturesheroheading', 'local_groupimport')) .
                        html_writer::tag('p', get_string('adminfeaturesherobody', 'local_groupimport')),
                    'local-groupimport-admin-settings__hero-copy'
                ),
            'local-groupimport-admin-settings__hero'
        ) .
            html_writer::div(
                html_writer::tag('strong', get_string('adminfeatureshowtitle', 'local_groupimport')) .
                    html_writer::tag('span', get_string('adminfeatureshowbody', 'local_groupimport')),
                'local-groupimport-admin-settings__hint'
            ),
        'local-groupimport-admin-settings local-groupimport-admin-settings--features',
        ['data-local-groupimport-admin-features' => '1']
    );

    // Mirror the live settings page rather than drawing an unrelated card
    // dashboard. Each item represents one real overview panel or native
    // setting row in the same four-section order used below.
    $adminloadingskeletonspec = [
        ['overview', 'control'],
        ['control'],
        ['overview-wide', 'control-tall'],
        ['overview', 'control', 'control', 'control', 'control', 'control'],
    ];
    $adminloadingskeletonsections = [];
    foreach ($adminloadingskeletonspec as $sectionrows) {
        $rows = [];
        foreach ($sectionrows as $rowtype) {
            if (str_starts_with($rowtype, 'overview')) {
                $overviewclass = 'local-groupimport-admin-settings__loading-overview';
                if ($rowtype === 'overview-wide') {
                    $overviewclass .= ' local-groupimport-admin-settings__loading-overview--wide';
                }

                $rows[] = html_writer::div(
                    html_writer::tag('span', '', [
                        'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-overview-icon',
                    ]) .
                        html_writer::div(
                            html_writer::tag('span', '', [
                                'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-card-title',
                            ]) .
                                html_writer::tag('span', '', [
                                    'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-row',
                                ]) .
                                html_writer::tag('span', '', [
                                    'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-row local-groupimport-admin-settings__loading-row--short',
                                ]),
                            'local-groupimport-admin-settings__loading-overview-copy'
                        ),
                    $overviewclass
                );
                continue;
            }

            $controlclass = 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-form-control';
            if ($rowtype === 'control-tall') {
                $controlclass .= ' local-groupimport-admin-settings__loading-form-control--tall';
            }
            $rows[] = html_writer::div(
                html_writer::tag('span', '', [
                    'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-form-label',
                ]) .
                    html_writer::tag('span', '', ['class' => $controlclass]),
                'local-groupimport-admin-settings__loading-form-row'
            );
        }

        $adminloadingskeletonsections[] = html_writer::div(
            html_writer::tag('span', '', [
                'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-section-title',
            ]) .
                html_writer::div(implode('', $rows), 'local-groupimport-admin-settings__loading-form-rows'),
            'local-groupimport-admin-settings__loading-section'
        );
    }

    $adminpageidentityhtml = html_writer::div(
        html_writer::span(
            get_string('easystudlabel', 'local_groupimport'),
            'local-groupimport-import__eyebrow local-groupimport-admin-settings__page-eyebrow'
        ) .
            html_writer::tag(
                'h2',
                get_string('adminpageidentitytitle', 'local_groupimport'),
                ['class' => 'local-groupimport-import__title local-groupimport-admin-settings__page-title']
            ) .
            html_writer::tag(
                'p',
                get_string('adminpageidentitydescription', 'local_groupimport'),
                ['class' => 'local-groupimport-import__intro local-groupimport-admin-settings__page-description']
            ),
        'local-groupimport-admin-settings__page-identity',
        ['data-easystud-page-identity' => 'administration']
    );

    // The classic bootstrap owns the normal loading lifecycle. Without scripts,
    // restore native settings instead of retaining the decorative placeholder.
    // admin_setting_heading renders its description through Markdown Extra.
    // `noscript` is a context block there only when its tags occupy their own
    // lines; otherwise the fallback style is wrapped in a paragraph and does
    // not reliably participate in the no-script cascade.
    $adminnoscriptfallback = html_writer::tag(
        'noscript',
        "\n" . html_writer::tag('style',
            'body.local-groupimport-admin-settings-page--loading #page-admin-setting-local_groupimport #adminsettings > .settingsform > * { display: block !important; }' .
                'body.local-groupimport-admin-settings-page--loading #page-admin-setting-local_groupimport #adminsettings > .settingsform > fieldset:first-of-type > * { display: block !important; }' .
                'body.local-groupimport-admin-settings-page--loading #page-admin-setting-local_groupimport [data-easystud-loading-skeleton] { display: none !important; }' .
                'body.local-groupimport-admin-settings-page--loading #page-admin-setting-local_groupimport #adminsettings .settingsform .local-groupimport-admin-settings__loading-skeleton[data-easystud-loading-skeleton] { display: none !important; }'
        ) . "\n"
    );

    $adminloadingskeletonhtml = $adminnoscriptfallback . html_writer::div(
        html_writer::div(
            html_writer::tag('span', '', [
                'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-eyebrow',
            ]) .
                html_writer::tag('span', '', [
                    'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-title',
                ]) .
                html_writer::tag('span', '', [
                    'class' => 'local-groupimport-admin-settings__loading-surface local-groupimport-admin-settings__loading-intro',
                ]),
            'local-groupimport-admin-settings__loading-header'
        ) .
        html_writer::div(implode('', $adminloadingskeletonsections), 'local-groupimport-admin-settings__loading-sections'),
        'local-groupimport-admin-settings__loading-skeleton',
        [
            'data-easystud-loading-skeleton' => '1',
            'data-easyedu-action-busy-label' => get_string('actioninprogress', 'local_groupimport'),
            'aria-hidden' => 'true',
        ]
    );

    $settings->add(new admin_setting_heading(
        'local_groupimport/loadingoverview',
        '',
        $adminloadingskeletonhtml
    ));

    $settings->add(new admin_setting_heading(
        'local_groupimport/pageidentity',
        '',
        $adminpageidentityhtml
    ));

    $settings->add(new admin_setting_heading(
        'local_groupimport/featuresoverview',
        get_string('adminfeaturestitle', 'local_groupimport'),
        $featureshtml
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_groupimport/enablesimplifiedview',
        get_string('enablesimplifiedview', 'local_groupimport'),
        get_string('enablesimplifiedview_desc', 'local_groupimport'),
        1
    ));

    $settings->add(new admin_setting_heading(
        'local_groupimport/interfaceaccessibility',
        get_string('interfaceaccessibility', 'local_groupimport'),
        get_string('interfaceaccessibility_desc', 'local_groupimport')
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_groupimport/enableanimations',
        get_string('enableanimations', 'local_groupimport'),
        get_string('enableanimations_desc', 'local_groupimport'),
        1
    ));

    $settings->add(new admin_setting_heading(
        'local_groupimport/identifieroverview',
        get_string('adminidentifierstitle', 'local_groupimport'),
        $introhtml
    ));

    $settings->add(new admin_setting_configmultiselect(
        'local_groupimport/alloweduserfields',
        get_string('alloweduserfields', 'local_groupimport'),
        get_string('alloweduserfields_desc', 'local_groupimport'),
        ['username', 'email'],
        $fieldoptions
    ));

    $participantdisplayhtml = html_writer::div(
        html_writer::div(
            html_writer::span('', 'fa fa-id-badge', ['aria-hidden' => 'true']) .
                html_writer::div(
                    html_writer::tag('h3', get_string('adminparticipantdisplayheroheading', 'local_groupimport')) .
                        html_writer::tag('p', get_string('adminparticipantdisplayherobody', 'local_groupimport')),
                    'local-groupimport-admin-settings__hero-copy'
                ),
            'local-groupimport-admin-settings__hero'
        ) .
            html_writer::div(
                html_writer::tag('strong', get_string('adminparticipantdisplayhowtitle', 'local_groupimport')) .
                    html_writer::tag('span', get_string('adminparticipantdisplayhowbody', 'local_groupimport')),
                'local-groupimport-admin-settings__hint'
            ),
        'local-groupimport-admin-settings local-groupimport-admin-settings--participant-display',
        ['data-local-groupimport-admin-participant-display' => '1']
    );

    $settings->add(new admin_setting_heading(
        'local_groupimport/participantdisplayoverview',
        get_string('adminparticipantdisplaytitle', 'local_groupimport'),
        $participantdisplayhtml
    ));

    $settings->add(new admin_setting_configselect(
        'local_groupimport/participantprimarybadgefield',
        get_string('participantprimarybadgefield', 'local_groupimport'),
        get_string('participantprimarybadgefield_desc', 'local_groupimport'),
        '',
        $participantdisplayfieldoptions
    ));

    $settings->add(new local_groupimport_admin_setting_configcolor(
        'local_groupimport/participantprimarybadgebgcolor',
        get_string('participantprimarybadgebgcolor', 'local_groupimport'),
        get_string('participantprimarybadgebgcolor_desc', 'local_groupimport'),
        '#e8f4ff',
        PARAM_TEXT
    ));

    $settings->add(new local_groupimport_admin_setting_configcolor(
        'local_groupimport/participantprimarybadgetextcolor',
        get_string('participantprimarybadgetextcolor', 'local_groupimport'),
        get_string('participantprimarybadgetextcolor_desc', 'local_groupimport'),
        '#0b4f8a',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configselect(
        'local_groupimport/participantdetailfield1',
        get_string('participantdetailfield1', 'local_groupimport'),
        get_string('participantdetailfield1_desc', 'local_groupimport'),
        '',
        $participantdisplayfieldoptions
    ));

    $settings->add(new admin_setting_configselect(
        'local_groupimport/participantdetailfield2',
        get_string('participantdetailfield2', 'local_groupimport'),
        get_string('participantdetailfield2_desc', 'local_groupimport'),
        '',
        $participantdisplayfieldoptions
    ));
}
