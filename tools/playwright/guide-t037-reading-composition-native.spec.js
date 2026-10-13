const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised N2 composition proof. It reads the real Guide only: no
// course commands, settings writes, path completion or synthetic content.
test('T037 Guide reading composition keeps prose, scenes and lesson lanes distinct', async({page}, info) => {
    test.setTimeout(240000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') {
            return route.continue();
        }
        blocked.push('plugin write');
        return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') {
            return route.continue();
        }
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) {
            return route.continue();
        }
        blocked.push(methods);
        return route.abort('blockedbyclient');
    });

    const settle = async modal => {
        await expect.poll(() => modal.evaluate(node => node.getAnimations({subtree: true}).filter(animation =>
            animation.effect.getComputedTiming().iterations !== Infinity && ['running', 'paused'].includes(animation.playState)
        ).length), {timeout: 10000}).toBe(0);
    };

    try {
        const url = new URL(process.env.EASYEDU_MOODLE_URL);
        url.searchParams.set('lang', 'fr');
        await page.goto(url.href, {waitUntil: 'domcontentloaded'});
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter: true});
            await page.waitForURL(current => !current.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
        }
        await expect(page.locator('html')).toHaveAttribute('lang', /^fr/);
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await page.setViewportSize({width: 1600, height: 1000});
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        const modal = page.locator('[data-easyedu-guide-modal]:visible');
        await expect(modal).toHaveCount(1);

        for (const width of [1600, 1280, 390]) {
            await page.setViewportSize({width, height: width === 390 ? 844 : 1000});
            await modal.locator('[data-easyedu-guide-nav-item="2"]').click();
            await settle(modal);
            const sceneSlide = modal.locator('[data-easyedu-guide-slide="2"]');
            const scene = sceneSlide.locator('[data-easyedu-guide-scene]');
            const reading = await sceneSlide.evaluate(slide => {
                const paragraph = slide.querySelector('.easyedu-guide-slide__content > p');
                const content = paragraph.parentElement;
                const scene = slide.querySelector('[data-easyedu-guide-scene]');
                const title = slide.querySelector('.easyedu-guide-slide__header > h3');
                const caption = scene.querySelector('.easyedu-guide-scene__caption--safe-example');
                const source = scene.querySelector('[data-guide-source] .easyedu-guide-scene__lane-label');
                const destination = scene.querySelector('[data-guide-destination] .easyedu-guide-scene__lane-label');
                const paragraphRect = paragraph.getBoundingClientRect();
                const contentRect = content.getBoundingClientRect();
                const sceneRect = scene.getBoundingClientRect();
                const probe = document.createElement('span');
                probe.style.color = 'var(--easyedu-text)';
                title.append(probe);
                const textInk = getComputedStyle(probe).color;
                probe.remove();
                const titleStyle = getComputedStyle(title);
                const captionStyle = getComputedStyle(caption);
                return {
                    paragraphWidth: paragraphRect.width,
                    contentWidth: contentRect.width,
                    sceneWidth: sceneRect.width,
                    paragraphOverflow: paragraph.scrollWidth > paragraph.clientWidth + 1,
                    title: {color: titleStyle.color, ink: textInk, size: titleStyle.fontSize, weight: titleStyle.fontWeight},
                    caption: {display: captionStyle.display, border: captionStyle.borderTopStyle, background: captionStyle.backgroundColor},
                    source: source.textContent.trim(),
                    destination: destination.textContent.trim(),
                };
            });
            expect(reading.paragraphOverflow).toBe(false);
            expect(reading.paragraphWidth).toBeLessThanOrEqual(Math.min(reading.contentWidth, 672) + 1);
            expect(reading.sceneWidth).toBeGreaterThanOrEqual(reading.paragraphWidth - 1);
            expect(reading.title).toEqual({color: reading.title.ink, ink: reading.title.ink, size: '16px', weight: '600'});
            expect(reading.caption.display).toBe('inline-flex');
            expect(reading.caption.border).toBe('solid');
            expect(reading.caption.background).not.toBe('rgba(0, 0, 0, 0)');
            expect(reading.source).toBe('Groupe source');
            expect(reading.destination).toBe('Groupe de destination');

            const lessons = [];
            for (const index of [8, 13]) {
                await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                await settle(modal);
                const intro = modal.locator(`[data-easyedu-guide-slide="${index}"] .easyedu-guide-introduction--lesson-reading`);
                await expect(intro).toBeVisible();
                const lesson = await intro.evaluate(element => {
                    const topics = element.querySelector('.easyedu-guide-introduction__topics');
                    const topic = element.querySelector('.easyedu-guide-introduction__topic');
                    const style = getComputedStyle(topics);
                    const topicStyle = getComputedStyle(topic);
                    const columns = style.gridTemplateColumns.split(' ').filter(Boolean).length;
                    return {width: element.getBoundingClientRect().width, columns,
                        topicColumns: topicStyle.gridTemplateColumns.split(' ').filter(Boolean).length,
                        divider: topicStyle.borderBlockEndWidth};
                });
                expect(lesson.columns).toBe(lesson.width >= 672 ? 3 : 1);
                expect(lesson.topicColumns).toBe(1);
                expect(lesson.divider).toBe('0px');
                lessons.push({index, ...lesson});
            }
            await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
            await settle(modal);
            const introduction = modal.locator('[data-easyedu-guide-slide="0"] .easyedu-guide-introduction');
            await expect(introduction).toBeVisible();
            await expect(introduction).not.toHaveClass(/easyedu-guide-introduction--lesson-reading/);
            rows.push({language: 'fr', width, reading, lessons, specimenIntroductionPreserved: true});
            if (width === 1600 || width === 390) {
                await modal.screenshot({path: info.outputPath(`guide-t037-reading-fr-${width}.png`)});
            }
        }
        await modal.locator('[data-easyedu-guide-close]').first().click();
        await expect(modal).toHaveCount(0);
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-t037-reading-composition.json'), JSON.stringify({
            rows, errors, blocked, language: 'fr', widths: [1600, 1280, 390],
            businessWrites: false, humanAccepted: false,
        }, null, 2));
    }
});
