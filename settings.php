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
        public function __construct($name, $visiblename, $description, $defaultsetting, $paramtype = PARAM_RAW,
                $size = null, float $minimumcontrast = 0.0, float $softshare = 0.0) {
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
            $controlattributes = [
                'data-easyedu-color-picker' => '1',
                'data-easyedu-color-default' => strtoupper((string)$default),
                'data-easyedu-motion-policy' => get_config('local_groupimport', 'enableanimations') === '0'
                    ? 'disabled' : 'enabled',
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
            } elseif (!$isvalid) {
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
            $element = html_writer::div($element, 'easyedu-ui');

            return format_admin_setting($this, $this->visiblename, $element, $this->description, true, '', $default, $query);
        }
    }
}

if ($hassiteconfig) {
    global $ADMIN, $DB, $PAGE;

    // Moodle also loads this file while building navigation on other admin
    // pages, sometimes during header rendering. Register the settings tree
    // everywhere, but initialize its presentation only on its own early page.
    if ($PAGE->state === moodle_page::STATE_BEFORE_HEADER &&
            $PAGE->url->compare(new moodle_url('/admin/settings.php'), URL_MATCH_BASE) &&
            $PAGE->url->get_param('section') === 'local_groupimport') {
        $PAGE->add_body_class('local-groupimport-admin-settings-page--loading');
        $PAGE->requires->js('/local/groupimport/js/easyedu_colour_picker.js', true);
        $PAGE->requires->js('/local/groupimport/js/admin_settings_loading.js', true);
        $PAGE->requires->js_call_amd('local_groupimport/admin_choices', 'init', [[
            'search' => get_string('searchfilteroptions', 'local_groupimport'),
            'empty' => get_string('nofilteroptions', 'local_groupimport'),
            'none' => get_string('none'),
            'count' => get_string('filterselectioncount', 'local_groupimport', '__count__'),
            'clear' => get_string('clearfilterselection', 'local_groupimport'),
        ], get_config('local_groupimport', 'enableanimations') !== '0']);
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
    $featureshtml .= html_writer::div(
        html_writer::link(new moodle_url('/local/groupimport/reset_guide_welcome.php'),
            get_string('guidewelcomereset', 'local_groupimport'), ['class' => 'easyedu-button--secondary']) .
        html_writer::tag('p', get_string('guidewelcomeresethelp', 'local_groupimport'),
            ['class' => 'easyedu-caption easyedu-form-note']),
        'easyedu-ui'
    );

    $appearancehtml = html_writer::div(
        html_writer::div(
            html_writer::span('', 'fa fa-palette', ['aria-hidden' => 'true']) .
                html_writer::div(
                    html_writer::tag('h3', get_string('adminappearanceheroheading', 'local_groupimport')) .
                        html_writer::tag('p', get_string('adminappearanceherobody', 'local_groupimport')),
                    'local-groupimport-admin-settings__hero-copy'
                ),
            'local-groupimport-admin-settings__hero'
        ) .
            html_writer::div(
                html_writer::tag('strong', get_string('adminappearancehowtitle', 'local_groupimport')) .
                    html_writer::tag('span', get_string('adminappearancehowbody', 'local_groupimport')),
                'local-groupimport-admin-settings__hint'
            ),
        'local-groupimport-admin-settings local-groupimport-admin-settings--appearance',
        ['data-local-groupimport-admin-appearance' => '1']
    );
    $appearancehtml .= html_writer::div(
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
    );

    // Mirror the live settings page rather than drawing an unrelated card
    // dashboard. Each item represents one real overview panel or native
    // setting row in the same five-section order used below.
    $adminloadingskeletonspec = [
        ['overview', 'control'],
        ['overview', 'control', 'control', 'control', 'control', 'control'],
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

    $settings->add(new admin_setting_configcheckbox(
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
        'local_groupimport/appearanceoverview',
        get_string('adminappearancetitle', 'local_groupimport'),
        $appearancehtml
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
