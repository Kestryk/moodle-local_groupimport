const fs = require('node:fs'),
      vm = require('node:vm'),
      assert = require('node:assert/strict'),
      path = require('node:path');

const root = path.resolve(__dirname, '../..'),
      read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');

const policy = read('amd/src/local/sm/participants.js').match(/export const isMetaCollapsed = ([\s\S]*?\n});/);
assert(policy);
const collapsed = vm.runInNewContext('(' + policy[1] + ')');
const source = read('amd/src/local/cm/optional_tools.js');
const call = source.match(/setMetaExpandedOverride\(getOnDemandModel\(root\), ([^;\n]+)\);/);
assert(call, 'Production manual density override');
const manual = vm.runInNewContext('(mobile, compact) => (' + call[1] + ')');
const initial = source.match(/mobileCompact: ([^,\n]+),/);
assert(initial, 'Production initial mobile mode');
const start = source.indexOf('const applyDensity = () => {') + 'const applyDensity = () => {'.length;
const end = source.indexOf('root.classList.remove(', start);
assert(start > 20 && end > start);
const updateSource = source.slice(start, end);
let checks = 0;

for (const admin of [true, false]) for (const mobile of [true, false]) for (const compact of [true, false]) {
  const state = {
    desktopCompact: !compact,
    mobileCompact: !compact
  };
  vm.runInNewContext('(()=>{' + updateSource + '})()', {
    state,
    mobile,
    compact,
    compactClass: 'compact',
    root: {
      classList: {
        toggle() {}

      }
    }
  });
  assert.equal(state.desktopCompact, compact);
  assert.equal(state.mobileCompact, compact);
  const override = manual(mobile, compact);
  assert.equal(override, !compact, 'An explicit choice cannot reset to the admin default');
  assert.equal(collapsed({
    metaExpandedOverride: override
  }, {
    metacollapsedbydefault: admin
  }), compact);
  checks++;
}

for (const compact of [true, false]) {
  assert.equal(vm.runInNewContext(initial[1], {
    root: {
      classList: {
        contains: () => compact
      }
    },
    compactClass: 'compact'
  }), compact);
  checks++;
}

console.log(JSON.stringify({
  passed: true,
  checks,
  explicitDensity: true
}));
