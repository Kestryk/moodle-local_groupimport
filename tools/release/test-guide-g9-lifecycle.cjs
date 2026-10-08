// G9 successor: actual reset/re-entry, cancelled reload and late native events.
// Isolated browser only; no authentication, course writes or persisted captures.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.argv[2]);
const mustache = require(process.argv[3]);
const root = path.resolve(__dirname, '../..');
(async() => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'});
    try {
        const page = await browser.newPage({reducedMotion: 'reduce'});
        await page.route('**/*', route => route.fulfill({status: 200, contentType: 'text/html', body: '<html></html>'}));
        await page.goto('http://guide-g9.test');
        const data = JSON.parse(execFileSync(process.argv[4], [path.join(__dirname, 'guide-discovery-fixture.php'), 'en'], {encoding: 'utf8'}));
        Object.assign(data, {discoverypresentation: true,
            rootclass: 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
            guideopenlabel: 'Open', guidecloselabel: 'Close', guiderestorelabel: 'Restore',
            guideresumetitle: 'A path is in progress', guideresumelabel: 'Resume', guidecancelpathlabel: 'Cancel path',
            guideresetpathlabel: 'Reset this path', slidecount: 4});
        const ids = data.practicePath.map(step => step.id);
        const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('g9.checklist')));
        const boot = async seed => {
            if (seed) await page.evaluate(seed => localStorage.setItem('g9.checklist', JSON.stringify(seed)), seed);
            await page.setContent('<style>*{box-sizing:border-box}[hidden]{display:none!important}' +
                fs.readFileSync(path.join(root, 'styles.css'), 'utf8') + '</style><div class="local-groupimport-easystud">' +
                mustache.render(fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8'), data) + '</div>');
            await page.addScriptTag({content: 'window.define=(deps,factory)=>{window.Guide=factory();};\n' +
                fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8')});
            await page.evaluate(steps => window.Guide.init('[data-easyedu-guide-root]', {
                storageKey: 'g9', firstVisit: false, paths: {'practice-membership': steps}
            }), data.practicePath);
        };
        const stop = () => page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]'));
        const late = () => page.evaluate(ids => {
            ids.forEach(step => document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
                detail: {path: 'practice-membership', step}
            })));
        }, ids);
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 900});
            await boot({path: 'practice-membership', slideIndex: 1, activeIndex: 0,
                completed: {'practice-membership': ids.slice(0, 2), other: ['retained']}});
            await page.locator('[data-easyedu-guide-resume-path]').click();
            await page.locator('[data-easyedu-guide-open]').click();
            const reset = page.locator('[data-easyedu-guide-reset-path]');
            await reset.click();
            assert.equal((await state()).path, null, 'Reset stops the active path');
            assert.deepEqual((await state()).completed, {'practice-membership': [], other: ['retained']});
            assert.equal(await reset.isVisible(), false, 'No Reset on an untouched/inactive path');
            assert.match(await page.locator('[data-easyedu-guide-path-status]').textContent(), /Path reset/);
            await late();
            assert.equal((await state()).path, null, 'Late native milestones cannot reactivate Reset');
            await stop();
            await boot(); // Reinitialization reads the same stored state; no reseeding.
            assert.equal(await page.locator('[data-easyedu-guide-resume]').isVisible(), false);
            await page.locator('[data-easyedu-guide-open]').click();
            await page.locator('[data-easyedu-guide-start-path="practice-membership"]').click();
            assert.equal(await page.locator('[data-easyedu-guide-step-id].is-complete').count(), 0);
            await stop();
            await boot({path: 'practice-membership', slideIndex: 1, activeIndex: 1,
                completed: {'practice-membership': [ids[0]], other: ['retained']}});
            await page.locator('[data-easyedu-guide-cancel-path]').click();
            await late();
            assert.equal((await state()).path, null, 'Cancel persists through late native milestones');
            await stop();
            await boot();
            assert.equal(await page.locator('[data-easyedu-guide-resume]').isVisible(), false, 'Cancelled reload never prompts Resume');
            await page.locator('[data-easyedu-guide-open]').click();
            const input = page.locator('[data-guide-pattern]');
            await input.fill('Equipe #*3');
            await input.press('Enter');
            assert.equal(await page.locator('[data-guide-name]').count(), 3, 'Enter previews three teams');
            assert.equal(await page.locator('.easyedu-guide-scene__utilities [data-guide-scene-command="preview"]').count(), 0);
            const invitation = await page.locator('[data-easyedu-guide-slide="1"] .easyedu-guide-guided-card').evaluate(card => {
                const rect = node => { const r = node.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; };
                return {icon: rect(card.querySelector('.easyedu-guide-guided-card__icon')),
                    body: rect(card.querySelector('.easyedu-guide-guided-card__body')),
                    start: rect(card.querySelector('[data-easyedu-guide-start-path]'))};
            });
            if (width === 390) {
                assert.ok(invitation.icon.y < invitation.body.y, 'Phone compass precedes copy');
                assert.ok(invitation.start.y >= invitation.body.y + invitation.body.h - 1, 'Phone Start follows all copy');
                assert.ok(Math.abs(invitation.start.w - invitation.body.w) < 1, 'Phone Start has the content row width');
            } else {
                assert.ok(Math.abs(invitation.start.y + invitation.start.h / 2 -
                    (invitation.body.y + invitation.body.h / 2)) < 2, 'Desktop/tablet Start is vertically centred');
            }
            await page.locator('[data-easyedu-guide-nav-item="2"]').click();
            await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-scene="membership"]').dataset.guideSceneFinished === 'true');
            const scene = page.locator('[data-easyedu-guide-scene="membership"]');
            assert.equal(await scene.locator('.easyedu-guide-scene__intro').evaluate(node => node.scrollWidth <= node.clientWidth + 1), true,
                'Long Organisation intro stays within its reading lane');
            if (width <= 768) {
                assert.equal(await scene.locator('[data-guide-source-title]').textContent(), 'Participants');
                assert.equal(await scene.locator('[data-guide-member-remove]').isVisible(), false);
                assert.match(await scene.locator('[data-guide-menu] strong').textContent(), /Move participants/);
                assert.equal(await scene.locator('[data-guide-ghost]').count(), 0, 'Mobile Add never teaches mouse dragging');
                assert.equal(await scene.locator('[data-guide-recap] li:visible').count(), 4);
                assert.equal(await scene.locator('[data-guide-membership-origin]').evaluate(node => node.classList.contains('is-removed')), false,
                    'Participants Add preserves the source membership');
            }
            await stop();
            console.log(`PASS ${width}: Reset/re-entry, Cancel/reload, late signals, other-path preservation, Enter, no Practice Replay`);
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
