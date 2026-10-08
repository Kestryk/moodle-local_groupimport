<?php
// Isolated contract harness: no Moodle bootstrap, database, credentials or runtime.
// Complements (does not replace) the real advanced_testcase candidate.
define('MOODLE_INTERNAL', true);

$config = [];
$preferences = [];
$userid = 1;
$admin = false;
$guest = false;

function get_config($component, $name) {
    global $config;
    return $config[$component][$name] ?? false;
}
function set_config($name, $value, $component) {
    global $config;
    $config[$component][$name] = $value;
}
function get_user_preferences($name, $default = null) {
    global $preferences, $userid;
    return $preferences[$userid][$name] ?? $default;
}
function set_user_preference($name, $value) {
    global $preferences, $userid;
    $preferences[$userid][$name] = $value;
}
function isloggedin() { global $userid; return $userid > 0; }
function isguestuser() { global $guest; return $guest; }
function require_login($course = null, $autologin = true) {
    if (!isloggedin()) { throw new RuntimeException('Login required'); }
}
function require_capability($capability, $context) {
    global $admin;
    if ($capability !== 'moodle/site:config' || !$admin) {
        throw new RuntimeException('Capability required');
    }
}
class context_system { public static function instance() { return new self(); } }
function check($condition, $message) {
    if (!$condition) { throw new RuntimeException($message); }
}

require __DIR__ . '/../../classes/local/guide_welcome.php';
use local_groupimport\local\guide_welcome;

$initial = guide_welcome::generation();
check(guide_welcome::should_offer(), 'First visit is offered');
check(guide_welcome::should_offer() && !$preferences, 'Reading does not acknowledge');
check(guide_welcome::mark_opened($initial), 'Actual opening acknowledged');
check(!guide_welcome::should_offer(), 'Same generation not repeated');
$userid = 2;
check(guide_welcome::should_offer(), 'Another user remains unacknowledged');
$guest = true;
check(!guide_welcome::should_offer(), 'Guest not offered');
check(!guide_welcome::mark_opened($initial), 'Guest not acknowledged');
$guest = false;
try { guide_welcome::reset(); throw new LogicException('Unauthorized reset accepted'); }
catch (RuntimeException $error) { check($error->getMessage() === 'Capability required', 'Capability guard'); }
$before = $preferences;
$admin = true;
$next = guide_welcome::reset();
check($preferences === $before, 'Global reset never rewrites user preferences');
check($next !== $initial && preg_match('/^[a-f0-9]{32}$/', $next), 'New opaque generation');
$userid = 1;
check(guide_welcome::should_offer(), 'Previously opened user offered after reset');
check(!guide_welcome::mark_opened($initial), 'Stale browser cannot acknowledge new reset');
check(guide_welcome::should_offer(), 'Stale acknowledgement preserves invitation');
check(guide_welcome::mark_opened($next) && !guide_welcome::should_offer(), 'New opening acknowledged');
$userid = 0;
check(!guide_welcome::should_offer(), 'Logged-out user not offered');
echo "PASS isolated welcome generation, actual opening, per-user scope, stale tab and guarded O(1) reset; no database/runtime writes\n";
