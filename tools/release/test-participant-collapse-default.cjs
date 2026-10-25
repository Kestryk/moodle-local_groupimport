/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');
const source = read('amd/src/local/sm/participants.js');
const match = source.match(/export const isMetaCollapsed = ([\s\S]*?\n});/);
assert(match, 'Read the current production policy function, not a copied implementation');
const collapsed = vm.runInNewContext('(' + match[1] + ')');
let checks = 0;
for (const admin of [true, false, undefined]) {
    for (const density of [true, false]) {
        for (const override of [null, true, false]) {
            const model = {metaExpandedOverride: override, isCompactDensity: () => density};
            assert.equal(collapsed(model, {metacollapsedbydefault: admin}),
                override === null ? admin !== false : !override);
            checks++;
        }
    }
}
const setter = source.match(/export const setMetaExpandedOverride = ([\s\S]*?\n});/);
assert(setter, 'Current production override setter');
const setExpanded = vm.runInNewContext('(' + setter[1] + ')');
for (const admin of [true, false]) {
    const model = {metaExpandedOverride: null};
    for (const expanded of [true, false, null]) {
        setExpanded(model, expanded);
        assert.equal(collapsed(model, {metacollapsedbydefault: admin}), expanded === null ? admin : !expanded);
        checks++;
    }
}
console.log(JSON.stringify({passed: true, checks, manualChoice: true}));
