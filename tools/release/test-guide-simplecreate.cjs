// C-G7 successor: actual PHP programme and Moodle Mustache, without a live course.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 4, 'Usage: <php> <moodle-mustache-source>');
const root = path.resolve(__dirname, '../..');
const baseline = 'ee870566fa46cd708879d625c305981628dbd73a';
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'easystud-cg7-'));
const fixture = 'tools/release/guide-current-curriculum-fixture.php';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const renderer = {module: {exports: {}}};
vm.runInNewContext(fs.readFileSync(process.argv[3], 'utf8')
    .replace('export default mustache;', 'module.exports = mustache;'), renderer);
const mustache = renderer.module.exports;
const template = read('templates/easyedu_guide.mustache');
const partial = name => read('templates/' + name.split('/').pop() + '.mustache');
const engine = read('amd/src/easyedu_guide.js');
const start = engine.indexOf('const getStateKey =');
const end = engine.indexOf('const getCompletedSteps =', start);
assert.ok(start >= 0 && end > start);
const rows = [];
try {
    for (const file of [fixture, 'manage.php', 'classes/local/guide_discovery.php',
        'lang/en/local_groupimport.php', 'lang/fr/local_groupimport.php']) {
        const dest = path.join(temporary, file);
        fs.mkdirSync(path.dirname(dest), {recursive: true});
        fs.writeFileSync(dest, execFileSync('git', ['show', baseline + ':' + file],
            {cwd: root, maxBuffer: 16 * 1024 * 1024}));
    }
    for (const language of ['fr', 'en']) {
        const payload = base => JSON.parse(execFileSync(process.argv[2],
            [path.join(base, fixture), language], {encoding: 'utf8', maxBuffer: 8 * 1024 * 1024}));
        const old = payload(temporary);
        const data = payload(root);
        const slides = data.templateData.slides;
        const before = old.templateData.slides;
        assert.equal(slides.length, 13);
        assert.deepEqual(slides.map(s => s.id), data.readingContract.slideIds);
        assert.deepEqual(slides.filter(s => s.id !== 'create-one').map(s => s.id), before.map(s => s.id));
        assert.equal(slides[2].id, 'create-one');
        assert.equal(slides[3].id, 'create-structure');
        assert.equal(slides[2].guidedpath, 'practice-membership');
        assert.ok(!slides[3].hasguidedpath && !slides[3].guidedpath);
        const invitations = list => list.filter(s => s.hasguidedpath).map(s => {
            const {guidedpath, guidedpathlabel, guidedpathtitle, guidedpathcontent, guidedpathsteps} = s;
            return {guidedpath, guidedpathlabel, guidedpathtitle, guidedpathcontent, guidedpathsteps};
        }).sort((a, b) => a.guidedpath.localeCompare(b.guidedpath));
        assert.deepEqual(invitations(slides), invitations(before), 'Every current invitation is preserved');
        assert.deepEqual(data.paths, old.paths, 'No business path or completion predicate changes');
        slides.forEach((s, i) => {
            assert.equal(s.index, i);
            assert.equal(s.navnumber, i + 1);
            assert.ok(s.navtitle && !s.navtitle.includes('[['));
        });
        for (let i = 0; i < before.length; i++) {
            if (i === 2) continue; // Batch copy and its path invitation intentionally change.
            for (const field of ['content', 'title', 'discoveryscene', 'commonintroduction']) {
                assert.deepEqual(slides[i < 2 ? i : i + 1][field], before[i][field],
                    before[i].id + ': preserve ' + field);
            }
        }
        assert.ok(slides[3].content.length < before[2].content.length);
        const scene = slides[2].discoveryscene;
        assert.equal(scene.kind, 'simplecreate');
        assert.equal(scene.simplecreate, true);
        assert.ok(!scene.creation);
        for (let n = 1; n <= 4; n++) assert.ok(scene['phase' + n]);
        assert.ok(scene.note.includes('#*3'));
        assert.ok(scene.note.includes(language === 'fr' ? 'virgule' : 'comma'));
        assert.ok(!/\.\.\./.test(JSON.stringify(scene)));
        const html = mustache.render(template, data.templateData, partial);
        assert.equal((html.match(/data-guide-simplecreate data-guide-stage/g) || []).length, 1);
        for (const marker of ['input="group"', 'input="grouping"', 'submit="group"',
            'submit="grouping"', 'result="group"', 'result="grouping"', 'rename', 'edit', 'card-name']) {
            assert.ok(html.includes('data-guide-simplecreate-' + marker), marker);
        }
        for (let n = 1; n <= 4; n++) assert.ok(html.includes('data-guide-phase-' + n + '-label='));
        assert.ok(html.includes('data-guide-simplecreate-result="group" hidden'));
        assert.ok(html.includes('data-guide-simplecreate-result="grouping" hidden'));
        assert.ok(!partial('guide_simplecreate').includes('<form'));
        const escaped = mustache.render(partial('guide_simplecreate'), {...scene, groupname: '<b>unsafe</b>'});
        assert.ok(escaped.includes('&lt;b&gt;unsafe&lt;&#x2F;b&gt;'));
        assert.ok(!escaped.includes('<b>unsafe</b>'));
        const storage = new Map();
        const context = vm.createContext({getStorage: () => ({
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
        })});
        vm.runInContext(engine.slice(start, end) + '\nglobalThis.load=loadGuideState;', context);
        const config = {...data.readingContract, storageKey: 'qa-cg7'};
        const migration = config.readingIndexMigrations['curriculum-modern-20261010'];
        assert.deepEqual(migration, before.map(s => data.readingContract.slideIds.indexOf(s.id)));
        let positions = 0;
        for (const [origin, destinations] of Object.entries(config.readingIndexMigrations)) {
            destinations.forEach((destination, index) => {
                storage.clear();
                const state = {slideIndex: index, path: 'practice-membership', activeIndex: 2,
                    completed: {'practice-membership': ['create-group']}};
                if (origin !== 'legacy') state.presentationKey = origin;
                storage.set('qa-cg7.checklist', JSON.stringify(state));
                const loaded = context.load(config);
                assert.equal(loaded.slideIndex, destination);
                assert.equal(loaded.slideId, config.slideIds[destination]);
                assert.equal(loaded.path, state.path);
                assert.equal(JSON.stringify(loaded.completed), JSON.stringify(state.completed));
                positions++;
            });
        }
        rows.push({language, slides: slides.length, slide3: slides[2].navtitle,
            footer: slides[2].navnumber + ' / ' + slides.length, migrationPositions: positions,
            invitations: invitations(slides).length, renderedScene: true, escaping: true});
    }
    console.log(JSON.stringify({passed: true, native: false, rows}, null, 2));
} finally {
    fs.rmSync(temporary, {recursive: true, force: true});
}
