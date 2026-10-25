// R6 recette: the member selection is read from identifiers; detached rows (not rendered) must be accepted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../../amd/src/member_selection.js'), 'utf8').replace(/\r\n/g, '\n');
const {snapshotMemberPairs} = vm.runInNewContext(source.replace(/^export /gm, '') +
    '\n({snapshotMemberPairs})', {Object, Map, Error});
const row = (groupid, userid, connected) => ({
    isConnected: connected,
    getAttribute: name => (name === 'data-easystud-member-id' ? String(userid) : null),
    closest: () => ({getAttribute: name => (name === 'data-easystud-group-id' ? String(groupid) : null)}),
    querySelector: () => ({textContent: ' User ' + userid + ' '}),
});
const workspace = new Set();
const root = {contains: node => workspace.has(node)};
const rendered = Array.from({length: 8}, (item, index) => row(7, index + 1, true));
rendered.forEach(node => workspace.add(node));
// 800 selected, 8 rendered: 792 rows are detached proxies built from the model.
const detached = Array.from({length: 792}, (item, index) => row(7, index + 9, false));
const pairs = snapshotMemberPairs(root, rendered.concat(detached));
assert.equal(pairs.length, 800, '800 pairs from 8 rendered + 792 detached rows');
assert.equal(new Set(pairs.map(pair => pair.userid)).size, 800);
assert.equal(pairs[799].fullname, 'User 800');
// A rendered row outside the workspace is still refused, as are invalid identifiers.
assert.throws(() => snapshotMemberPairs(root, [row(7, 1, true)]), /Invalid selected membership/);
assert.throws(() => snapshotMemberPairs(root, [row(0, 1, false)]), /Invalid selected membership/);
assert.throws(() => snapshotMemberPairs(root, [row(7, 'x', false)]), /Invalid selected membership/);
assert.equal(snapshotMemberPairs(root, [detached[0], detached[0]]).length, 1, 'duplicate pair submitted once');
console.log('member snapshot detached PASS');
