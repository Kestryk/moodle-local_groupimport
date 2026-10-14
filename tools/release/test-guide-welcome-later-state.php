<?php
// Isolated contract extension, no Moodle bootstrap or persistent data.
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
