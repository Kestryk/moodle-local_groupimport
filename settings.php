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
        /** @var float Contrast threshold for the nonblocking adjustment note. */
        private float $minimumcontrast;

        /** @var float Chosen-colour share in the semantic soft surface. */
        private float $softshare;

        /**
         * Build a colour setting with an optional readable-palette note.
         *
         * @param string $name Setting name.
         * @param string $visiblename Visible label.
         * @param string $description Setting description.
         * @param string $defaultsetting Default hexadecimal colour.
         * @param string $paramtype Moodle parameter type.
         * @param int|null $size Native text size hint.
         * @param float $minimumcontrast Contrast below which the rendered shade is adjusted.
         * @param float $softshare Chosen-colour share in the semantic soft surface.
         */
        public function __construct(
            $name,
            $visiblename,
            $description,
            $defaultsetting,
            $paramtype = PARAM_RAW,
            $size = null,
            float $minimumcontrast = 0.0,
            float $softshare = 0.0
        ) {
            parent::__construct($name, $visiblename, $description, $defaultsetting, $paramtype, $size);
            $this->minimumcontrast = $minimumcontrast;
            $this->softshare = $softshare;
        }

        /**
         * Validate a hexadecimal colour.
         *
         * @param string $data Submitted value.
         * @return true|string True when valid, otherwise an admin error string.
         */
        public function validate($data) {
            if (!preg_match('/^#[0-9a-fA-F]{6}$/', (string)$data)) {
                return get_string('validateerror', 'admin');
            }

            return true;
        }

        /**
         * Calculate the WCAG contrast ratio between a Hex colour and white.
         *
         * @param string $hex Hexadecimal colour.
         * @return float Contrast ratio.
         */
        private function contrast_against_white(string $hex): float {
            $channels = [];
            foreach ([1, 3, 5] as $offset) {
                $channel = hexdec(substr($hex, $offset, 2)) / 255;
                $channels[] = $channel <= 0.04045
                    ? $channel / 12.92
                    : (($channel + 0.055) / 1.055) ** 2.4;
            }
            $luminance = (0.2126 * $channels[0]) + (0.7152 * $channels[1]) + (0.0722 * $channels[2]);

            return 1.05 / ($luminance + 0.05);
        }

        /**
         * Match the semantic adapter's conservative soft-surface threshold.
         *
         * @param string $hex Valid six-digit hexadecimal colour.
         * @return float Equivalent minimum contrast against white.
         */
        private function required_white_contrast(string $hex): float {
            $channels = [];
            foreach ([1, 3, 5] as $offset) {
                $channels[] = (int)floor(hexdec(substr($hex, $offset, 2)) * $this->softshare +
                    255 * (1 - $this->softshare));
            }

            return $this->minimumcontrast * $this->contrast_against_white(sprintf('#%02x%02x%02x', ...$channels));
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
            $submittedvalue = (string)$data;
            if ($submittedvalue === '') {
                $submittedvalue = (string)$default;
            }
            $isvalid = (bool)preg_match('/^#[0-9a-fA-F]{6}$/', $submittedvalue);
            $swatchvalue = $isvalid ? $submittedvalue : (string)$default;
            $swatchattributes = [
                'type' => 'color',
                'id' => $this->get_id() . '_picker',
                'value' => $swatchvalue,
                'class' => 'easyedu-color-picker__swatch',
                'aria-label' => get_string('colourpickerswatchlabel', 'local_groupimport'),
            ];
            $hexattributes = [
                'type' => 'text',
                'id' => $this->get_id(),
                'name' => $this->get_full_name(),
                'value' => strtoupper($submittedvalue),
                'class' => 'easyedu-color-picker__hex',
                'pattern' => '#[0-9A-Fa-f]{6}',
                'maxlength' => '7',
                'autocomplete' => 'off',
                'spellcheck' => 'false',
                'aria-label' => get_string('colourpickerhexlabel', 'local_groupimport'),
                'aria-invalid' => $isvalid ? 'false' : 'true',
            ];
            $motionlevel = \local_groupimport\local\motion::level();
            $motionattributes = \local_groupimport\local\motion::root_attributes($motionlevel);
            $controlattributes = [
                'data-easyedu-color-picker' => '1',
                'data-easyedu-color-default' => strtoupper((string)$default),
                'data-easyedu-motion-level' => $motionattributes['data-easyedu-motion-level'],
                'data-easyedu-motion-policy' => $motionattributes['data-easyedu-motion-policy'],
                'data-easyedu-color-panel-labels' => json_encode([
                    'title' => get_string('colourpickerswatchlabel', 'local_groupimport'),
                    'hue' => get_string('colourpickerhue', 'local_groupimport'),
                    'saturation' => get_string('colourpickersaturation', 'local_groupimport'),
                    'brightness' => get_string('colourpickerbrightness', 'local_groupimport'),
                    'palette' => get_string('colourpickerpalette', 'local_groupimport'),
                    'hex' => get_string('colourpickerpanelhex', 'local_groupimport'),
                    'invalid' => get_string('colourpickerinvalid', 'local_groupimport'),
                    'cancel' => get_string('cancel'),
                    'apply' => get_string('colourpickerapply', 'local_groupimport'),
                ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'aria-invalid' => $isvalid ? 'false' : 'true',
            ];
            if ($this->minimumcontrast > 0) {
                $controlattributes['data-easyedu-color-contrast'] = (string)$this->minimumcontrast;
                $controlattributes['data-easyedu-color-soft-share'] = (string)$this->softshare;
            }
            $controlclasses = 'easyedu-color-picker local-groupimport-admin-settings__color-control';

            if ($this->is_readonly()) {
                $swatchattributes['disabled'] = 'disabled';
                $hexattributes['readonly'] = 'readonly';
                $controlattributes['data-readonly'] = 'true';
                $controlclasses .= ' is-readonly';
            } else if (!$isvalid) {
                $controlclasses .= ' is-invalid';
            }

            $element = html_writer::div(
                html_writer::empty_tag('input', $swatchattributes) .
                    html_writer::empty_tag('input', $hexattributes),
                $controlclasses,
                $controlattributes
            );

            if ($this->minimumcontrast > 0) {
                $needsadjustment = $isvalid && strcasecmp($submittedvalue, (string)$default) !== 0 &&
                    $this->contrast_against_white($submittedvalue) < $this->required_white_contrast($submittedvalue);
                $noticeattributes = [
                    'data-easyedu-colour-contrast-note' => '1',
                    'role' => 'status',
                ];
                if (!$needsadjustment) {
                    $noticeattributes['hidden'] = 'hidden';
                }
                $element .= html_writer::div(
                    html_writer::tag('i', '', ['class' => 'fa fa-exclamation-triangle', 'aria-hidden' => 'true']) .
                        html_writer::div(
                            html_writer::tag('strong', get_string('colourpickeradjustedtitle', 'local_groupimport')) .
                                html_writer::tag('p', get_string('colourpickeradjustednotice', 'local_groupimport'))
                        ),
                    'easyedu-notice easyedu-notice--warning',
                    $noticeattributes
                );
            }

            // Native Moodle admin rows are outside the workspace's Kit root.
            // Keep the public component scoped even without JavaScript; do not
            // copy its paint rules into the native administration adapter.
            $element = html_writer::div($element, 'easyedu-ui', ['data-easyedu-motion-level' => $motionlevel]);

            return format_admin_setting($this, $this->visiblename, $element, $this->description, true, '', $default, $query);
        }
    }
}

if ($hassiteconfig) {
    require_once(__DIR__ . '/lib.php');
    global $ADMIN, $DB, $OUTPUT, $PAGE;

    // Moodle also loads this file while building navigation on other admin
    // pages, sometimes during header rendering. Register the settings tree
    // everywhere, but initialize its presentation only on its own early page.
    if (
        $PAGE->state === moodle_page::STATE_BEFORE_HEADER && $PAGE->has_set_url() &&
            $PAGE->url->compare(new moodle_url('/admin/settings.php'), URL_MATCH_BASE) &&
            $PAGE->url->get_param('section') === 'local_groupimport'
    ) {
        $PAGE->requires->css('/local/groupimport/styles/administration.css');
        $PAGE->add_body_class('local-groupimport-admin-settings-page--loading');
        // Animation level (user choice, else administrator default) for the Kit CSS and Motion.
        $motionlevel = \local_groupimport\local\motion::apply_to_page($PAGE);
        $PAGE->requires->js('/local/groupimport/js/easyedu_colour_picker.js', true);
        $PAGE->requires->js('/local/groupimport/js/admin_settings_loading.js', true);
        $PAGE->requires->js('/local/groupimport/js/admin_guide_reset.js');
        $PAGE->requires->js_call_amd('local_groupimport/admin_choices', 'init', [[
            'search' => get_string('searchfilteroptions', 'local_groupimport'),
            'empty' => get_string('nofilteroptions', 'local_groupimport'),
            'none' => get_string('none'),
            'count' => local_groupimport_count_template('filterselectioncount'),
            'clear' => get_string('clearfilterselection', 'local_groupimport'),
            'remove' => get_string('removechoiceselection', 'local_groupimport'),
        ], $motionlevel !== 'minimal']);
    }

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

    $renderchips = static function (array $fields, string $modifier): string {
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
    $paragraph = static function (string $text, string $class = ''): string {
        return html_writer::tag('p', $text, $class === '' ? [] : ['class' => $class]);
    };

    // The confirmation opens in place (js/admin_guide_reset.js); the link stays the
    // no-JavaScript fallback to the standalone confirmation page.
    $resetdialog = '';
    if (
        $PAGE->state === moodle_page::STATE_BEFORE_HEADER && $PAGE->has_set_url() &&
            $PAGE->url->compare(new moodle_url('/admin/settings.php'), URL_MATCH_BASE) &&
            $PAGE->url->get_param('section') === 'local_groupimport'
    ) {
        $reseturl = new moodle_url('/local/groupimport/reset_guide_welcome.php');
        $resetdialog = $OUTPUT->render_from_template('local_groupimport/guide_welcome_reset', [
            'inline' => true,
            'title' => get_string('guidewelcomereset', 'local_groupimport'),
            'description' => get_string('guidewelcomeresetconfirm', 'local_groupimport'),
            'confirm' => get_string('guidewelcomereset', 'local_groupimport'),
            'cancel' => get_string('cancel'),
            'action' => $reseturl->out(false),
            'sesskey' => sesskey(),
            'motionlevel' => \local_groupimport\local\motion::level(),
        ]);
    }

    // The real page is present from the first frame: only the pending field controls
    // wait behind component skeletons (js/admin_settings_loading.js, administration.css).
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
        [
            'data-easystud-page-identity' => 'administration',
            'data-easyedu-action-busy-label' => get_string('actioninprogress', 'local_groupimport'),
        ]
    );

    $settings->add(new admin_setting_heading(
        'local_groupimport/pageidentity',
        '',
        $adminpageidentityhtml
    ));

    // Section 1: operation and views.
    $operationhtml = html_writer::div(
        $paragraph(get_string('adminfeaturesherobody', 'local_groupimport')) .
            $paragraph(get_string('adminfeatureshowbody', 'local_groupimport'), 'easyedu-caption') .
            html_writer::div(
                html_writer::link(
                    new moodle_url('/local/groupimport/reset_guide_welcome.php'),
                    get_string('guidewelcomereset', 'local_groupimport'),
                    ['class' => 'easyedu-button--secondary', 'data-local-groupimport-welcome-reset-open' => '1']
                ) .
                    $resetdialog .
                    $paragraph(
                        get_string('guidewelcomeresethelp', 'local_groupimport'),
                        'easyedu-caption easyedu-form-note'
                    ),
                'easyedu-ui'
            ),
        'local-groupimport-admin-settings__section-copy local-groupimport-admin-settings--features',
        ['data-local-groupimport-admin-features' => '1']
    );
    $settings->add(new admin_setting_heading(
        'local_groupimport/sectionoperation',
        get_string('adminsectionoperation', 'local_groupimport'),
        $operationhtml
    ));

    $settings->add(new \local_groupimport\local\admin_setting_switch(
        'local_groupimport/enablesimplifiedview',
        get_string('enablesimplifiedview', 'local_groupimport'),
        get_string('enablesimplifiedview_desc', 'local_groupimport'),
        1
    ));

    $settings->add(new \local_groupimport\local\admin_setting_switch(
        'local_groupimport/showcompleteview',
        get_string('showcompleteview', 'local_groupimport'),
        get_string('showcompleteview_desc', 'local_groupimport'),
        1
    ));

    $settings->add(new admin_setting_configselect(
        'local_groupimport/defaultlayoutmode',
        get_string('defaultlayoutmode', 'local_groupimport'),
        get_string('defaultlayoutmode_desc', 'local_groupimport'),
        'both',
        [
            'participants' => get_string('layoutmodeparticipants', 'local_groupimport'),
            'both' => get_string('layoutmodeoverview', 'local_groupimport'),
            'structure' => get_string('layoutmodestructure', 'local_groupimport'),
        ]
    ));

    // Section 2: display and accessibility.
    $displayhtml = html_writer::div(
        $paragraph(get_string('adminsectiondisplaydesc', 'local_groupimport')) .
            html_writer::div(
                html_writer::tag('button', get_string('restoredefaultcolours', 'local_groupimport'), [
                    'type' => 'button',
                    'class' => 'easyedu-button--secondary',
                    'data-easystud-restore-colours' => '1',
                    'hidden' => 'hidden',
                    'aria-describedby' => 'easystud-restore-colours-help',
                ]) . html_writer::tag('p', get_string('restoredefaultcolours_help', 'local_groupimport'), [
                    'id' => 'easystud-restore-colours-help',
                    'class' => 'easyedu-caption easyedu-form-note',
                ]) . html_writer::tag('span', '', [
                    'role' => 'status',
                    'data-easystud-restore-colours-status' => get_string('restoredefaultcolours_pending', 'local_groupimport'),
                ]),
                'easyedu-ui'
            ),
        'local-groupimport-admin-settings__section-copy local-groupimport-admin-settings--appearance',
        ['data-local-groupimport-admin-appearance' => '1']
    );
    $settings->add(new admin_setting_heading(
        'local_groupimport/sectiondisplay',
        get_string('adminsectiondisplay', 'local_groupimport'),
        $displayhtml
    ));

    // Default animation level; each user may choose their own (preference easyedu_motion_level).
    $settings->add(new admin_setting_configselect(
        'local_groupimport/motionlevel',
        get_string('motionlevel', 'local_groupimport'),
        get_string('motionlevel_desc', 'local_groupimport'),
        'full',
        [
            'full' => get_string('motionlevelfull', 'local_groupimport'),
            'reduced' => get_string('motionlevelreduced', 'local_groupimport'),
            'minimal' => get_string('motionlevelminimal', 'local_groupimport'),
        ]
    ));

    $settings->add(new local_groupimport_admin_setting_configcolor(
        'local_groupimport/themeprimarycolor',
        get_string('themeprimarycolor', 'local_groupimport'),
        get_string('themeprimarycolor_desc', 'local_groupimport'),
        '#0f6cbf',
        PARAM_TEXT,
        null,
        4.5,
        0.10
    ));

    $settings->add(new local_groupimport_admin_setting_configcolor(
        'local_groupimport/themeaccentcolor',
        get_string('themeaccentcolor', 'local_groupimport'),
        get_string('themeaccentcolor_desc', 'local_groupimport'),
        '#1b7f5a',
        PARAM_TEXT,
        null,
        4.5,
        0.09
    ));

    $settings->add(new local_groupimport_admin_setting_configcolor(
        'local_groupimport/themeparticipantcolor',
        get_string('themeparticipantcolor', 'local_groupimport'),
        get_string('themeparticipantcolor_desc', 'local_groupimport'),
        '#4873ad',
        PARAM_TEXT,
        null,
        4.5,
        0.11
    ));

    $settings->add(new local_groupimport_admin_setting_configcolor(
        'local_groupimport/themegroupcolor',
        get_string('themegroupcolor', 'local_groupimport'),
        get_string('themegroupcolor_desc', 'local_groupimport'),
        '#29724d',
        PARAM_TEXT,
        null,
        4.5,
        0.11
    ));

    $settings->add(new local_groupimport_admin_setting_configcolor(
        'local_groupimport/themegroupingcolor',
        get_string('themegroupingcolor', 'local_groupimport'),
        get_string('themegroupingcolor_desc', 'local_groupimport'),
        '#6a7f98',
        PARAM_TEXT,
        null,
        4.5,
        0.11
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

    // Section 3: identification and import.
    $identificationhtml = html_writer::div(
        $paragraph(get_string('adminidentifiersherobody', 'local_groupimport')) .
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
            $paragraph(get_string('adminidentifiershowbody', 'local_groupimport'), 'easyedu-caption'),
        'local-groupimport-admin-settings__section-copy',
        ['data-local-groupimport-admin-settings' => '1']
    );
    $settings->add(new admin_setting_heading(
        'local_groupimport/sectionidentification',
        get_string('adminsectionidentification', 'local_groupimport'),
        $identificationhtml
    ));

    $settings->add(new admin_setting_configmultiselect(
        'local_groupimport/alloweduserfields',
        get_string('alloweduserfields', 'local_groupimport'),
        get_string('alloweduserfields_desc', 'local_groupimport'),
        ['username', 'email'],
        $fieldoptions
    ));

    $settings->add(new admin_setting_configtext(
        'local_groupimport/importmaxrows',
        get_string('importmaxrows', 'local_groupimport'),
        get_string('importmaxrows_desc', 'local_groupimport'),
        50000,
        PARAM_INT
    ));

    // Section 4: history and privacy.
    $settings->add(new admin_setting_heading(
        'local_groupimport/sectionhistory',
        get_string('adminsectionhistory', 'local_groupimport'),
        html_writer::div(
            $paragraph(get_string('adminsectionhistorydesc', 'local_groupimport')),
            'local-groupimport-admin-settings__section-copy'
        )
    ));

    $settings->add(new admin_setting_configtext(
        'local_groupimport/historyretentiondays',
        get_string('historyretentiondays', 'local_groupimport'),
        get_string('historyretentiondays_desc', 'local_groupimport'),
        365,
        PARAM_INT
    ));
}
