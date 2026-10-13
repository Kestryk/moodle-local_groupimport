const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

// local-supervised: fictional illustrations, isolated reading key; no business commands.
test('Guide French activity dots preserve equal geometry pause and completion in normal and reduced motion', async({page}, info) => {
    test.setTimeout(300000);
    const rows = [], errors = [], blocked = [];
    const language = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 390, height: 1000});
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    page.setDefaultTimeout(15000);
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(methods.map(() => ({error: false, data: {}}))),
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (areSafeAjaxReads(methods, reads)) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const workspace = page.locator('#local-groupimport-easystud');
    try {
        await expect(workspace).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout:60000});
        await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
        await page.evaluate(async() => {
            const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
            root.dotsQaConfig = config;
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root);
            Guide.init(root, {...config, firstVisit:false, welcomeOffer:false, storageKey:'guide-dots-terminal-qa'});
        });
        await page.setViewportSize({width:1280,height:1000});
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
        for (const motion of ['no-preference','reduce']) {
            await page.emulateMedia({reducedMotion:motion});
            expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion==='reduce');
            for (const width of [1280,768,390]) {
                await page.setViewportSize({width,height:1000});
                const scene = modal.locator('[data-easyedu-guide-scene="membership"]');
                const index = await scene.evaluate(node => node.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide);
                await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
                await modal.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
                const slide = modal.locator('[data-easyedu-guide-slide="' + index + '"]');
                const live = slide.locator('[data-guide-live]'), dots = live.locator('[data-guide-activity]');
                await scene.locator('[data-guide-scene-command="add"]').click();
                await scene.locator('[data-guide-scene-command="start"]').click();
                let samples = [];
                if (motion !== 'reduce') {
                    await expect(live).toHaveAttribute('data-guide-playback-state','playing');
                    await expect(dots).toBeVisible();
                    samples = await dots.evaluate(async node => {
                        const frames=[];
                        for (let i=0;i<8;i++) {
                            frames.push(Array.from(node.children).map(dot => {
                                const r=dot.getBoundingClientRect();
                                return {x:r.x,y:r.y,w:r.width,h:r.height};
                            }));
                            await new Promise(resolve=>setTimeout(resolve,90));
                        }
                        return frames;
                    });
                    for (const frame of samples) {
                        for (const dot of frame) {
                            expect(dot.w).toBeCloseTo(4,3);expect(dot.h).toBeCloseTo(4,3);
                        }
                        expect(frame[1].x-frame[0].x-frame[0].w).toBeCloseTo(3,3);
                        expect(frame[2].x-frame[1].x-frame[1].w).toBeCloseTo(3,3);
                    }
                    expect(samples.some(f=>Math.abs(f[0].y-f[1].y)>.1||Math.abs(f[1].y-f[2].y)>.1)).toBe(true);
                    const pause = live.locator('[data-guide-playback="pause"]');
                    await pause.click();
                    await expect(live).toHaveAttribute('data-guide-playback-state','paused');
                    expect(await dots.evaluate(node=>Array.from(node.children)
                        .every(dot=>getComputedStyle(dot).animationName==='none'))).toBe(true);
                    await pause.click();
                    await expect(live).toHaveAttribute('data-guide-playback-state','playing');
                    for (let phase=0;phase<14&&await live.getAttribute('data-guide-playback-state')!=='finished';phase++) {
                        await page.waitForFunction(node => node.dataset.guidePlaybackState==='finished' ||
                            !node.querySelector('[data-guide-playback="next-phase"]').disabled,await live.elementHandle());
                        if (await live.getAttribute('data-guide-playback-state')==='finished') break;
                        await live.locator('[data-guide-playback="next-phase"]').click();
                    }
                }
                await expect(live).toHaveAttribute('data-guide-playback-state','finished');
                await expect(dots).toBeHidden();
                await expect(live.locator('[data-guide-live-complete]')).toBeVisible();
                await expect(scene.locator('[data-guide-recap]')).toBeVisible();
                rows.push({width,language,motion,samples,finishedDotsHidden:true,completionCheckVisible:true,
                    normalPauseStatic:motion!=='reduce',reducedStaticOutcome:motion==='reduce'});
            }
        }
        await modal.locator('[data-easyedu-guide-close]').click();
        await expect(modal).toBeHidden();
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(async() => {
            const root=document.querySelector('[data-easyedu-guide-root]');
            if (!root?.dotsQaConfig) return;
            const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
            Guide.destroy(root);
            localStorage.removeItem('guide-dots-terminal-qa.checklist');
            localStorage.removeItem('guide-dots-terminal-qa.checklist.before-'+root.dotsQaConfig.presentationKey);
        }).catch(()=>{});
        fs.writeFileSync(info.outputPath('guide-dots-terminal-native.json'),JSON.stringify({
            rows,errors,blocked,businessWrites:false,realUserProgressWritten:false},null,2));
    }
});
