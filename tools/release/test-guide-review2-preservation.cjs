const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..'), kit = path.resolve(process.argv[2]);
const norm = text => text.replace(/\r\n/g, '\n');
const read = (repo, file) => norm(fs.readFileSync(path.join(repo, file), 'utf8'));
const before = (repo, pin, file) => norm(execFileSync('git', ['show', pin + ':' + file], {cwd: repo, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024}));
const engineFile = 'guide/amd/src/easyedu_guide.js';
const boundedEngine = text => {
    const ranges = [
        ['const scrollActiveNavItemIntoView =', 'const getActiveSlideIndex ='],
        ['const playDiscoveryScene =', 'const stopSlideTransition ='],
        ['const bindNavWheel =', 'const bindHighlightAutoRefresh =']
    ];
    for (const [start, end] of ranges) {
        assert.equal(text.split(start).length, 2); assert.equal(text.split(end).length, 2);
        const begin = text.indexOf(start), finish = text.indexOf(end, begin);
        assert(finish > begin); text = text.slice(0, begin) + 'BOUNDED REVIEW2 RECIPE\n\n' + text.slice(finish);
    }
    return text.replace('  delete root.easyeduGuideNavResizeTimer;\n', '');
};
assert.equal(boundedEngine(read(kit, engineFile)), boundedEngine(before(kit, 'fead185', engineFile)),
    'Complete engine outside scene presentation/nav visibility unchanged');
for (const file of ['amd/src/course_manager.js', 'amd/src/motion.js', 'classes/local/guide_discovery.php']) {
    assert.equal(read(root, file), before(root, '6c69b42', file), 'Complete business/curriculum/Motion unchanged: ' + file);
}
assert.equal(read(kit, 'scss/easyedu/components/_guide.scss'), before(kit, 'fead185', 'scss/easyedu/components/_guide.scss'));
const template = 'guide/templates/easyedu_guide.mustache';
const oldLive = '<span data-guide-live-copy aria-live="polite">{{initiallabel}}</span>';
const newLive = '<span class="sr-only" data-guide-live-announcement aria-live="polite">{{initiallabel}}</span>\n                                    <span data-guide-live-copy aria-hidden="true">{{initiallabel}}</span>';
assert.equal(read(kit, template).replace(newLive, oldLive), before(kit, 'fead185', template), 'Only narration slot changes');
assert.equal(read(root, 'easyedu-guide-kit/amd/src/easyedu_guide.js'), read(kit, engineFile));
assert.equal(read(root, 'scss/easyedu/components/_guide-discovery.scss'), read(kit, 'scss/easyedu/components/_guide-discovery.scss'));
const stripDialog = css => css.replace(/\.local-groupimport-easystud-easyedu-guide\.easyedu-guide--discovery \.easyedu-guide-scene__dialog > div,\s*\.path-local-groupimport \.easyedu-guide\.easyedu-guide--discovery \.easyedu-guide-scene__dialog > div\s*\{[^{}]*\}/g, 'DIALOG COPY').replace(/\s+/g, ' ').trim();
assert.equal(stripDialog(read(root, 'styles.css')), stripDialog(before(root, '6c69b42', 'styles.css')), 'Complete unrelated compiled CSS unchanged');
assert.match(read(kit, engineFile), /duration: 420, easing: 'cubic-bezier\(\.4,0,\.2,1\)'/);
assert.match(read(kit, engineFile), /await animate\(element, \[\{opacity: 0\}, \{opacity: 1\}\], 280\)/);
assert.match(read(kit, engineFile), /addTrackedListener\(root, window, 'orientationchange', refreshActiveNav\)/);
assert.match(read(root, 'styles.css'), /white-space: normal;\s*overflow-wrap: anywhere;/);
assert.equal(fs.readFileSync(path.join(kit, 'VERSION'), 'utf8').trim(), JSON.parse(read(kit, 'easyedu-kit.json')).version);
console.log('PASS bounded presentation/nav delta, complete other engine/CSS/business/Motion/curriculum preservation, canonical parity, single narration and version.');
