// Static security/Privacy wiring gate; never bootstraps the serving database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root=path.resolve(__dirname,'../..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const ack=read('guide_welcome.php'),reset=read('reset_guide_welcome.php'),privacy=read('classes/privacy/provider.php');
assert.ok(ack.includes("!== 'POST'") && ack.includes('require_sesskey()') && ack.includes('require_login($course, false)'));
assert.ok(ack.includes("require_capability('moodle/course:managegroups'"));
assert.ok(!/required_param\(['"]userid/.test(ack));
assert.ok(reset.includes("=== 'POST'") && reset.includes('require_sesskey()'));
assert.ok(reset.includes("required_param('confirm', PARAM_BOOL)") && reset.includes("require_capability('moodle/site:config'"));
assert.ok(privacy.includes('user_preference_provider') && privacy.includes('add_user_preference(') && privacy.includes('export_user_preferences(int $userid)'));
assert.ok(read('templates/guide_welcome_reset.mustache').includes('method="post"'));
assert.ok(!/\bstyle=|<style|<script/.test(read('templates/guide_welcome_reset.mustache')));
console.log('PASS static welcome POST/login/capability/sesskey/current-user/Privacy wiring; not a native endpoint authorization test');
