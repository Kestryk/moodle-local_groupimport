// SM-50 geometry successor. Preserve the original 32-state guard at its exact
// committed revision; admit only the one measured narrow/full CSS addition.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const revision = '2a6b6b172bf0dfa8bb39f6747f8fdfea6f38d731';
const original = file => execFileSync('git', ['show', `${revision}:${file}`], {cwd: root})
    .toString().replace(/\r\n/g, '\n');
const rule = '  .local-groupimport-easystud--responsive-workspace:not(.local-groupimport-easystud--compact-users) ' +
    '.local-groupimport-easystud-user__headline-main {\n    padding-inline-start: 2.02rem;\n  }\n';
const css = read('styles.css');
assert.equal(css.split(rule).length, 2, 'Exactly one opt-in rule');
assert.equal(css.replace(rule, ''), original('styles.css'), 'All unrelated CSS is identical');
const narrow = css.indexOf('@media (max-width: 560px)', css.lastIndexOf('@media (max-width: 1024px)'));
assert(narrow >= 0 && css.indexOf(rule) > narrow, 'Existing phone breakpoint owns the opt-in');
const adapter = read('scss/responsive/_mobile.scss');
assert(adapter.includes('@include easyedu.person-card-selection-title-clearance;'));
const shared = read('scss/easyedu/components/_card-responsive.scss');
assert(shared.includes('@mixin person-card-selection-title-clearance('));
assert(shared.includes('$selection-target: 2.75rem'));
// Run every historical controller/template/AMD/Penpot check. Replace only its
// CSS identity oracle with the stricter complete-CSS successor proven above.
const historical = original('tools/release/test-mobile-participant-memberships.cjs');
const oldOracle = "assert.equal(read('styles.css'), old('styles.css'));";
assert.equal(historical.split(oldOracle).length, 2);
vm.runInNewContext(historical.replace(oldOracle, ''), {require, __dirname, console});
console.log('PASS narrow/full title clearance and complete unrelated CSS preservation; native/human separate.');
