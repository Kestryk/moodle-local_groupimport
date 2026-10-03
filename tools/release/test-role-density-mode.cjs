/* eslint-env node */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../../amd/src/course_manager.js'), 'utf8');
const begin = source.indexOf('const updateRoleFilterMode = root => {');
const end = source.indexOf('// Product hooks/values remain native;', begin);
assert(begin >= 0 && end > begin);
for (const width of [390, 767, 768, 1024, 1600]) {
    for (const count of [0, 1, 6, 7, 12]) {
        for (const enhanced of [false, true]) {
            const select = {options: Array.from({length: count}, (_, i) => ({value: 'role-' + i})),
                hidden: false, selectedOptions: [{value: 'retained-selection'}]};
            const toggle = {hidden: true}, host = {hidden: true};
            let closed = 0;
            const root = {querySelector: hook => hook.includes('toggle-wrap') ? {} : hook.includes('role-toggle') ? toggle : select};
            const controller = {host, close: () => closed++};
            const controllers = new Map(enhanced ? [[select, controller]] : []);
            const run = vm.runInNewContext(source.slice(begin, end) + '\nupdateRoleFilterMode;',
                {window: {innerWidth: width}, filterChoiceControllers: controllers});
            run(root);
            const fallback = width < 768 || count > 6;
            assert.equal(toggle.hidden, fallback);
            assert.equal(select.hidden, enhanced || !fallback);
            if (enhanced) { assert.equal(host.hidden, !fallback); assert.equal(closed, fallback ? 0 : 1); }
            assert.deepEqual(select.selectedOptions, [{value: 'retained-selection'}]);
        }
    }
}
console.log('PASS: 50 native mode cases; <=6 quick roles, >6/shared mobile search; selection retained.');
