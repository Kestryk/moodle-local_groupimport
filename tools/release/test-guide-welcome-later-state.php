<?php
// This file is part of Moodle - https://moodle.org/
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
// Isolated contract extension, no Moodle bootstrap or persistent data.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
require __DIR__ . '/test-guide-welcome-state.php';
use local_groupimport\local\guide_welcome;
$userid = 3;
$SESSION = new stdClass();
$generation = guide_welcome::generation();
$before = $preferences;
check(guide_welcome::should_offer(), 'Unseen current user offered');
check(!guide_welcome::postpone('stale'), 'Stale generation rejected');
check(guide_welcome::should_offer(), 'Stale Later does not suppress invitation');
check(guide_welcome::postpone($generation), 'Current generation postponed');
check(!guide_welcome::should_offer(), 'Same session hides invitation');
check($preferences === $before, 'Later does not mark the Guide seen');
$SESSION = new stdClass();
check(guide_welcome::should_offer(), 'Fresh login session offers unseen Guide again');
$guest = true;
check(!guide_welcome::postpone($generation), 'Guest cannot postpone');
$guest = false;
echo "PASS isolated Later: generation guard, same-session suppression, no seen preference, fresh-session offer, guest rejection\n";
