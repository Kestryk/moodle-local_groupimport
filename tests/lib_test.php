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

namespace local_groupimport;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/../lib.php');

/**
 * Tests for legacy-safe EasyStud feature configuration.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class lib_test extends \advanced_testcase {

    /**
     * A missing feature flag must preserve the historical import-only flow.
     *
     * @return void
     */
    public function test_missing_feature_flag_keeps_simplified_view_disabled(): void {
        $this->resetAfterTest();

        unset_config('enablesimplifiedview', 'local_groupimport');
        set_config('defaultuserfield', 'username', 'local_groupimport');

        $this->assertFalse(local_groupimport_is_simplified_view_enabled());
    }

    /**
     * The simplified manager follows the explicit administrator setting.
     *
     * @return void
     */
    public function test_explicit_feature_flag_controls_simplified_view(): void {
        $this->resetAfterTest();

        set_config('enablesimplifiedview', 1, 'local_groupimport');
        $this->assertTrue(local_groupimport_is_simplified_view_enabled());

        set_config('enablesimplifiedview', 0, 'local_groupimport');
        $this->assertFalse(local_groupimport_is_simplified_view_enabled());
    }

    /**
     * Missing workspace settings preserve the historical Complete view.
     *
     * @return void
     */
    public function test_missing_workspace_preferences_preserve_complete_view(): void {
        $this->resetAfterTest();

        unset_config('showcompleteview', 'local_groupimport');
        unset_config('defaultlayoutmode', 'local_groupimport');

        $this->assertSame([
            'showcompleteview' => true,
            'defaultlayoutmode' => 'both',
            'defaultmobileview' => 'participants',
        ], local_groupimport_get_workspace_layout_preferences());
    }

    /**
     * Hidden Complete view cannot remain the active default.
     *
     * @return void
     */
    public function test_hidden_complete_view_uses_available_workspace(): void {
        $this->resetAfterTest();

        set_config('showcompleteview', 0, 'local_groupimport');
        set_config('defaultlayoutmode', 'both', 'local_groupimport');

        $this->assertSame([
            'showcompleteview' => false,
            'defaultlayoutmode' => 'participants',
            'defaultmobileview' => 'participants',
        ], local_groupimport_get_workspace_layout_preferences());
    }

    /**
     * The structure-first preference maps to the compact Groups workspace.
     *
     * @return void
     */
    public function test_structure_preference_maps_to_mobile_groups(): void {
        $this->resetAfterTest();

        set_config('showcompleteview', 1, 'local_groupimport');
        set_config('defaultlayoutmode', 'structure', 'local_groupimport');

        $this->assertSame([
            'showcompleteview' => true,
            'defaultlayoutmode' => 'structure',
            'defaultmobileview' => 'groups',
        ], local_groupimport_get_workspace_layout_preferences());
    }

    /**
     * Missing palette settings preserve the canonical EasyStud colours.
     *
     * @return void
     */
    public function test_missing_theme_colours_use_canonical_defaults(): void {
        $this->resetAfterTest();

        foreach (['themeprimarycolor', 'themeaccentcolor', 'themeparticipantcolor',
                'themegroupcolor', 'themegroupingcolor'] as $setting) {
            unset_config($setting, 'local_groupimport');
        }

        $this->assertSame([
            'primary' => '#0f6cbf',
            'accent' => '#1b7f5a',
            'participant' => '#4873ad',
            'group' => '#29724d',
            'grouping' => '#6a7f98',
        ], local_groupimport_get_theme_colours());
    }

    /**
     * Invalid and insufficient-contrast database values fail closed.
     *
     * @return void
     */
    public function test_theme_colours_fail_closed_to_safe_defaults(): void {
        $this->resetAfterTest();

        set_config('themeprimarycolor', 'red; display:none', 'local_groupimport');
        set_config('themeaccentcolor', '#ffffff', 'local_groupimport');
        set_config('themeparticipantcolor', '#123456', 'local_groupimport');

        $colours = local_groupimport_get_theme_colours();
        $this->assertSame('#0f6cbf', $colours['primary']);
        $this->assertSame('#1b7f5a', $colours['accent']);
        $this->assertSame('#123456', $colours['participant']);
    }

    /**
     * The root style exposes base colours and derived semantic roles only.
     *
     * @return void
     */
    public function test_theme_style_builds_safe_custom_properties(): void {
        $this->resetAfterTest();
        set_config('themeprimarycolor', '#123456', 'local_groupimport');

        $style = local_groupimport_get_theme_style();
        $this->assertStringContainsString('--easyedu-primary: #123456;', $style);
        $this->assertStringContainsString('--easyedu-primary-soft: color-mix(', $style);
        $this->assertStringNotContainsString('display', $style);
    }

    /**
     * Contrast calculation matches the WCAG endpoints.
     *
     * @return void
     */
    public function test_colour_contrast_against_white(): void {
        $this->assertEqualsWithDelta(21.0, local_groupimport_colour_contrast_against_white('#000000'), 0.01);
        $this->assertEqualsWithDelta(1.0, local_groupimport_colour_contrast_against_white('#ffffff'), 0.01);
    }

    /**
     * Participant-card custom field values are reduced to compact plain text.
     *
     * @param string|null $value Stored custom profile field value.
     * @param string $expected Expected participant label.
     * @return void
     * @dataProvider participant_label_value_provider
     */
    public function test_normalise_participant_label_value(?string $value, string $expected): void {
        $this->assertSame($expected, local_groupimport_normalise_participant_label_value($value));
    }

    /**
     * Values for participant label normalisation.
     *
     * @return array[]
     */
    public static function participant_label_value_provider(): array {
        return [
            'paragraph' => [
                '<p>Marketing</p>',
                'Marketing',
            ],
            'multiple blocks and line breaks' => [
                '<p>Marketing</p><div>International<br>Sales</div>',
                'Marketing International Sales',
            ],
            'plain text and unicode whitespace' => [
                "  Équipe\u{00A0}Marketing \n Europe  ",
                'Équipe Marketing Europe',
            ],
            'inline formatting' => [
                '<strong>Dévelop</strong><em>pement</em> &amp; stratégie',
                'Développement & stratégie',
            ],
            'malicious html' => [
                '</body></div><img src=x onerror="alert(1)"><script>alert(1)</script><p>Safe &amp; sound</p>',
                'Safe & sound',
            ],
            'single entity decoding' => [
                'R&amp;amp;D',
                'R&amp;D',
            ],
            'empty string' => [
                '   ',
                '',
            ],
            'null' => [
                null,
                '',
            ],
        ];
    }
}
