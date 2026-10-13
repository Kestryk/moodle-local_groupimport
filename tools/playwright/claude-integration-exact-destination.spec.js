const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const settle = locator => locator.evaluate(async n => {
    await document.fonts.ready;
    await Promise.all(n.getAnimations({subtree:true}).filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
        .map(a => a.finished.catch(() => {})));
});
const config = (value) => execFileSync(process.env.EASYEDU_PHP_EXECUTABLE, ['-r',
    "define('CLI_SCRIPT',true); require $argv[1].'/config.php'; " +
    (value === undefined ? "echo get_config('local_groupimport','renderingmode');" :
        "set_config('renderingmode',$argv[2],'local_groupimport'); echo get_config('local_groupimport','renderingmode');"),
    process.env.EASYEDU_MOODLE_ROOT, ...(value === undefined ? [] : [value])], {encoding:'utf8',timeout:30000}).trim();

test('Claude integration exact destination FR EN modes and path11', async ({page}, info) => {
    test.setTimeout(420000);
    const url = new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL);
    if (url.hostname !== 'localhost' || url.port || url.searchParams.get('id') === '5') throw Error('Disposable fixture required');
    const rows = [], errors = [], original = config();
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    await page.setViewportSize({width:1280,height:1000});
    const save = () => fs.writeFileSync(info.outputPath('claude-integration.json'),JSON.stringify({rows,errors},null,2));
    try {
        for (const lang of ['fr','en']) for (const mode of ['legacy','reactive']) {
            expect(config(mode)).toBe(mode);
            url.searchParams.set('lang',lang);
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click({noWaitAfter:true});
                await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
                await page.goto(url.href,{waitUntil:'domcontentloaded'});
            }
            const root=page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await expect(page.locator('html')).toHaveAttribute('lang',lang);
            const row={lang,mode,stage:'ready'}; rows.push(row); save();
            const setup=await page.evaluate(async ({lang,mode})=>{
                const root=document.querySelector('[data-easyedu-guide-root]'), cfg=root.easyeduGuideConfig;
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);
                Guide.init(root,{...cfg,firstVisit:false,welcomeOffer:false,storageKey:'claude-integration-'+lang+'-'+mode});
                return {index:cfg.slideIds.indexOf('use-groupings-in-activities'),
                    step5:cfg.paths['prepare-activity-grouping'][4].description,
                    drag:cfg.paths['try-actions'][0].description};
            },{lang,mode});
            expect(setup.step5).not.toMatch(/refermez|close and reopen/);
            expect(setup.drag).toMatch(lang==='fr'?/Commencez à glisser/:/Start dragging/);
            row.copy=setup;
            await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click();
            await settle(root);
            const grouping=root.locator('[data-easystud-tree] [data-easystud-grouping-id]').filter({has:page.locator('.local-groupimport-easystud-grouping__name').filter({hasText:new RegExp('^QA '+lang+'-'+mode+'$')})}).first();
            await expect(grouping).toBeVisible();
            const destId=await grouping.getAttribute('data-easystud-grouping-id');
            await expect(grouping.locator('.badge').first()).toHaveText(lang==='fr'?'1 groupe':'1 group');
            const toggle=grouping.locator('[data-easystud-collapse-toggle]').first();
            if (await toggle.getAttribute('aria-expanded')==='false') await toggle.click();
            await settle(grouping);
            await expect(grouping.locator('[data-easystud-group-id] .badge').first()).toHaveText(lang==='fr'?'0 membre':'0 members');
            row.counts=true; save();

            const alpha=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]').filter({hasText:'Alpha group'}).first();
            const alphaId=await alpha.getAttribute('data-easystud-group-id');
            await alpha.locator('[data-easystud-selector-input]').first().evaluate(n=>n.click());
            const opener=root.locator('[data-easystud-move-selected-groups]:visible').first();
            await opener.click();
            const modal=root.locator('[data-easystud-move-modal]');
            await expect(modal).toBeVisible(); await settle(modal);
            expect(await modal.evaluate(n=>n.contains(document.activeElement))).toBe(true);
            await modal.evaluate(n=>{
                const stops=[...n.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')]
                    .filter(e=>!e.disabled&&e.tabIndex>=0&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
                stops.at(-1).focus();
            });
            await page.keyboard.press('Tab');
            expect(await modal.evaluate(n=>n.contains(document.activeElement))).toBe(true);
            await page.keyboard.press('Shift+Tab');
            expect(await modal.evaluate(n=>n.contains(document.activeElement))).toBe(true);
            await page.keyboard.press('Escape'); await expect(modal).toBeHidden(); await settle(root);
            await expect(opener).toBeFocused();
            await root.locator('[data-easystud-clear-all-selection]:visible').first().click();
            row.focus=true; save();

            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await guide.locator('[data-easyedu-guide-nav-item="'+setup.index+'"]').click();
            await guide.locator('[data-easyedu-guide-start-path="prepare-activity-grouping"]').click();
            const checklist=page.locator('[data-easyedu-guide-checklist]');
            await expect(checklist).toBeVisible();
            if(await toggle.getAttribute('aria-expanded')==='true') await toggle.click();
            await toggle.click(); await settle(grouping);
            await expect(checklist.locator('[data-easyedu-guide-step-id="open-grouping"]')).toHaveClass(/is-complete/);
            await alpha.locator('[data-easystud-selector-input]').first().evaluate(n=>n.click());
            await expect(modal).toBeVisible();
            const choice=modal.locator('.easyedu-searchable-choice');
            await choice.locator('.easyedu-searchable-choice__trigger').click();
            await choice.locator('input[type="search"]').fill('QA '+lang+'-'+mode);
            await choice.locator('.easyedu-searchable-choice__option:visible').filter({hasText:'QA '+lang+'-'+mode}).first().click();
            await expect(modal.locator('[data-easystud-move-destination]')).toHaveValue(destId);
            await expect(checklist.locator('[data-easyedu-guide-step-id="choose-grouping"]')).toHaveClass(/is-complete/);
            await expect(modal.locator('[data-easystud-move-remove-origin]')).not.toBeChecked();
            row.stage='confirm'; save();
            await modal.locator('[data-easystud-confirm-move]').click();
            await expect(modal).toBeHidden();
            await expect(checklist.locator('[data-easyedu-guide-step-id="confirm-groups"]')).toHaveClass(/is-complete/);
            // No collapse/reopen or artificial completion: native confirmed assignment only.
            await expect(checklist.locator('[data-easyedu-guide-step-id="verify-grouping"]')).toHaveClass(/is-complete/,{timeout:20000});
            await expect(grouping.locator('[data-easystud-group-id="'+alphaId+'"]')).toBeVisible();
            row.stage='path11-complete'; save();
            await page.screenshot({path:info.outputPath(lang+'-'+mode+'.png')});
        }
        expect(errors).toEqual([]);
    } finally {
        config(original); save();
    }
});
