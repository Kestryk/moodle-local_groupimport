<?php
// This file is part of Moodle - https://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

namespace local_groupimport;

use local_groupimport\local\guide_welcome;

defined('MOODLE_INTERNAL') || die();

/** Server welcome generation tests; only isolated PHPUnit data may be written. */
final class guide_welcome_test extends \advanced_testcase {
    /** Invitation reads do not acknowledge opening; stale tabs cannot consume a reset. */
    public function test_actual_open_and_reset_generation(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);
        $initial = guide_welcome::generation();
        $this->assertTrue(guide_welcome::should_offer());
        $this->assertTrue(guide_welcome::should_offer());
        $this->assertTrue(guide_welcome::mark_opened($initial));
        $this->assertFalse(guide_welcome::should_offer());

        $this->setAdminUser();
        $next = guide_welcome::reset();
        $this->assertNotSame($initial, $next);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{32}$/', $next);
        $this->setUser($user);
        $this->assertSame($initial, get_user_preferences(guide_welcome::PREFERENCE));
        $this->assertTrue(guide_welcome::should_offer());
        $this->assertFalse(guide_welcome::mark_opened($initial));
        $this->assertTrue(guide_welcome::should_offer());
        $this->assertTrue(guide_welcome::mark_opened($next));
        $this->assertFalse(guide_welcome::should_offer());
    }

    /** Ordinary teachers cannot reset everyone else's invitation. */
    public function test_reset_requires_site_configuration_capability(): void {
        $this->resetAfterTest();
        $this->setUser($this->getDataGenerator()->create_user());
        $this->expectException(\required_capability_exception::class);
        guide_welcome::reset();
    }

    /** Welcome memory is per user, not one browser/localStorage flag for everyone. */
    public function test_open_does_not_acknowledge_another_user(): void {
        $this->resetAfterTest();
        $first = $this->getDataGenerator()->create_user();
        $second = $this->getDataGenerator()->create_user();
        $this->setUser($first);
        guide_welcome::mark_opened(guide_welcome::generation());
        $this->setUser($second);
        $this->assertTrue(guide_welcome::should_offer());
    }
}
