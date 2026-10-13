const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised N2 proof. It only reads the real Guide navigation and
// blocks product writes; chapter/order/path state remains untouched.
test('T038 Guide navigation keeps numbered labels readable and paths pictorial', async({page}, info) => {
    test.setTimeout(240000);
    const rows = [], errors = [], blocked = [];
    const expectedLabels = ['Le guide', 'Repères', 'Structure', 'Participant', 'Groupe', 'Groupement',
        'Organiser', 'Filtrer', 'Identifiants', 'Actions', 'Devoir de groupe', 'Prêt'];
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
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state',
            'core_message_get_unsent_message']);
        if (methods.every(method => reads.has(method))) {
            return route.continue();
        }
        blocked.push(methods);
        return route.abort('blockedbyclient');
    });

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
            const row = await modal.locator('[data-easyedu-guide-nav]').evaluate(nav => {
                const items = [...nav.querySelectorAll('[data-easyedu-guide-nav-item]')];
                return items.map(item => {
                    const copy = item.querySelector('.easyedu-guide-nav-copy > span');
                    const path = item.querySelector('.easyedu-guide-nav-item__path');
                    const copyStyle = getComputedStyle(copy);
                    const pathStyle = path ? getComputedStyle(path) : null;
                    const itemRect = item.getBoundingClientRect();
                    const pathRect = path?.getBoundingClientRect();
                    return {
                        index: item.getAttribute('data-easyedu-guide-nav-item'),
                        label: copy.textContent.trim().replace(/^\d+\s*[·.]\s*/, ''),
                        copyOverflow: copy.scrollWidth > copy.clientWidth + 1,
                        copyTextOverflow: copyStyle.textOverflow,
                        copyWhiteSpace: copyStyle.whiteSpace,
                        category: item.querySelector('.easyedu-guide-nav-copy > small')?.textContent.trim() || '',
                        guided: item.classList.contains('has-guided-path'),
                        path: path ? {
                            role: path.getAttribute('role'), label: path.getAttribute('aria-label'),
                            display: pathStyle.display, text: path.textContent.trim(),
                            width: pathRect.width, height: pathRect.height,
                            contained: pathRect.left >= itemRect.left - 1 && pathRect.right <= itemRect.right + 1,
                        } : null,
                    };
                });
            });
            expect(row).toHaveLength(expectedLabels.length);
            expect(row.map(item => item.index)).toEqual(expectedLabels.map((_, index) => String(index)));
            expect(row.map(item => item.label)).toEqual(expectedLabels);
            row.forEach(item => {
                expect(item.copyOverflow).toBe(false);
                expect(item.copyTextOverflow).not.toBe('ellipsis');
                expect(item.copyWhiteSpace).toBe('normal');
                if (item.guided) {
                    expect(item.path).not.toBeNull();
                    expect(item.path.role).toBe('img');
                    expect(item.path.label).toBe('Guide');
                    expect(item.path.display).toContain('flex');
                    expect(item.path.width).toBeLessThanOrEqual(24);
                    expect(item.path.height).toBeLessThanOrEqual(24);
                    expect(item.path.text).toBe('');
                    expect(item.path.contained).toBe(true);
                } else {
                    expect(item.path).toBeNull();
                }
            });
            rows.push({width, items: row, chapterLabels: row.map(item => item.category).filter(Boolean)});
            if (width === 1600 || width === 390) {
                await modal.screenshot({path: info.outputPath(`guide-t038-navigation-fr-${width}.png`)});
            }
        }
        await modal.locator('[data-easyedu-guide-close]').first().click();
        await expect(modal).toHaveCount(0);
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-t038-navigation.json'), JSON.stringify({
            rows, errors, blocked, language: 'fr', widths: [1600, 1280, 390],
            businessWrites: false, humanAccepted: false,
        }, null, 2));
    }
});
