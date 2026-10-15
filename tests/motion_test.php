<?php
// This file is part of Moodle - https://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

namespace local_groupimport;

use local_groupimport\local\motion;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/../lib.php');

/**
 * Animation level tests (contract M1): user choice, administrator default, legacy fallback.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \local_groupimport\local\motion
 */
final class motion_test extends \advanced_testcase {
    /** The administrator default applies while the user has no choice; full when nothing is set. */
    public function test_default_level_and_legacy_fallback(): void {
        $this->resetAfterTest();
        $this->setUser($this->getDataGenerator()->create_user());
        unset_config(motion::SETTING, 'local_groupimport');
        unset_config(motion::LEGACY_SETTING, 'local_groupimport');
        $this->assertSame('full', motion::level());

        // Not migrated yet: the unticked historical checkbox means minimal.
        set_config(motion::LEGACY_SETTING, '0', 'local_groupimport');
        $this->assertSame('minimal', motion::level());
        set_config(motion::LEGACY_SETTING, '1', 'local_groupimport');
        $this->assertSame('full', motion::level());

        // Once set, the new setting wins over the old key.
        set_config(motion::SETTING, 'reduced', 'local_groupimport');
        $this->assertSame('reduced', motion::level());
        set_config(motion::SETTING, 'bogus', 'local_groupimport');
        $this->assertSame('full', motion::level());
    }

    /** The user's own choice wins over the administrator default; 'default' follows it again. */
    public function test_user_preference_overrides_default(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);
        set_config(motion::SETTING, 'full', 'local_groupimport');

        set_user_preference(motion::PREFERENCE, 'minimal');
        $this->assertSame('minimal', motion::level());
        $this->assertSame('minimal', local_groupimport_get_motion_level());
        set_user_preference(motion::PREFERENCE, motion::DEFAULT);
        $this->assertSame('full', motion::level());
        set_config(motion::SETTING, 'reduced', 'local_groupimport');
        $this->assertSame('reduced', motion::level());

        // Another user's choice does not leak.
        $other = $this->getDataGenerator()->create_user();
        set_user_preference(motion::PREFERENCE, 'minimal', $other);
        $this->assertSame('reduced', motion::level());
        $this->assertSame('minimal', motion::level((int)$other->id));
    }

    /** Root attributes and body classes rendered for each level. */
    public function test_rendering_contract(): void {
        $this->assertSame(['data-easyedu-motion-level' => 'full', 'data-easyedu-motion-policy' => 'enabled'],
            motion::root_attributes('full'));
        $this->assertSame(['data-easyedu-motion-level' => 'reduced', 'data-easyedu-motion-policy' => 'enabled'],
            motion::root_attributes('reduced'));
        $this->assertSame(['data-easyedu-motion-level' => 'minimal', 'data-easyedu-motion-policy' => 'disabled'],
            motion::root_attributes('minimal'));
        $this->assertSame([], motion::body_classes('full'));
        $this->assertSame(['easyedu-motion-reduced'], motion::body_classes('reduced'));
        $this->assertSame(['easyedu-motion-disabled', 'local-groupimport-motion-disabled'], motion::body_classes('minimal'));
    }

    /** The browser may save the preference for the current user only, with the declared values. */
    public function test_preference_definition(): void {
        $this->resetAfterTest();
        $definition = \core_user::get_preference_definition(motion::PREFERENCE);
        $this->assertSame(PARAM_ALPHA, $definition['type']);
        $this->assertSame(['default', 'full', 'reduced', 'minimal'], $definition['choices']);
        $this->assertSame('default', $definition['default']);
        $this->assertSame('reduced', \core_user::clean_preference('reduced', motion::PREFERENCE));
        $this->assertSame('default', \core_user::clean_preference('bogus', motion::PREFERENCE));

        $user = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $this->setUser($user);
        $this->assertTrue(\core_user::can_edit_preference(motion::PREFERENCE, $user));
        $this->assertFalse(\core_user::can_edit_preference(motion::PREFERENCE, $other));
    }
}
