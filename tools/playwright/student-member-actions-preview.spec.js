const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing group rows; open/search/Cancel only. Block every business POST.
test('Selected group members expose themed move actions without modifying memberships', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], blocked = [];
    const root = page.locator('#local-groupimport-easystud');
    const save = () => fs.writeFileSync(testInfo.outputPath('member-actions-native.json'), JSON.stringify({records,blocked},null,2));
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() !== 'GET') {
            blocked.push({method:route.request().method()}); await route.abort('blockedbyclient');
        } else {await route.continue();}
    });
    for (const width of [1600,768,390]) {
        for (const entry of ['toolbar','context']) {
            await page.setViewportSize({width,height:1100});
            await page.goto(process.env.EASYEDU_MOODLE_URL);
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();
                await page.waitForURL(url=>!url.pathname.includes('/login/'));
                await page.goto(process.env.EASYEDU_MOODLE_URL);
            }
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            const mode=width<=1024?'[data-easystud-mobile-view="groups"]:visible':'[data-easystud-layout-mode="structure"]:visible';
            await root.locator(mode).first().click();
            const member=root.locator('[data-easystud-member-id]:visible').first();
            await expect(member, 'Existing course member row required; do not create test data').toBeVisible();
            const identity=await member.evaluate(n=>({user:n.getAttribute('data-easystud-member-id'),
                group:n.closest('[data-easystud-group-id]').getAttribute('data-easystud-group-id')}));
            await member.locator('[data-easystud-selector-input]').evaluate(input=>input.click());
            const action='[data-easystud-move-selected-members]';
            let trigger;
            if (entry==='toolbar') {
                trigger=width<=1024?root.locator('[data-easystud-mobile-action-trigger="'+action+'"]:visible').first():
                    root.locator(action+':visible').first();
                await expect(trigger).toBeEnabled();
                const actionLane=trigger.locator('..');
                records.push({width,entry,toolbar:await actionLane.evaluate(node=>[...node.querySelectorAll('button')].map(n=>{
                    const r=n.getBoundingClientRect(),s=getComputedStyle(n);
                    return {text:n.textContent.trim(),x:r.x,y:r.y,w:r.width,h:r.height,font:s.fontSize,gap:s.gap,disabled:n.disabled};
                }))});save();
                await actionLane.screenshot({path:testInfo.outputPath(`member-action-bar-${width}.png`)});
                await trigger.click();
            } else {
                // Native desktop menus intentionally close on scroll. Finish real scrolling
                // before right-clicking the name; don't let click auto-scroll dismiss it.
                await member.scrollIntoViewIfNeeded();
                const name=member.locator('.local-groupimport-easystud-member__name');
                await name.scrollIntoViewIfNeeded();
                await page.evaluate(()=>new Promise(resolve=>{
                    let timer; const finish=()=>{window.removeEventListener('scroll',onScroll,true);resolve();};
                    const onScroll=()=>{clearTimeout(timer);timer=setTimeout(finish,180);};
                    window.addEventListener('scroll',onScroll,true);onScroll();
                }));
                await name.click({button:'right'});
                const menu=root.locator('[data-easystud-context-menu]');
                await expect(menu).toBeVisible();
                const item=menu.locator('[data-easystud-context-action="member-move-selected"]');
                await expect(item).toBeVisible();
                await expect(menu.locator('[data-easystud-context-action="remove-member"]')).toBeVisible();
                await menu.screenshot({path:testInfo.outputPath(`member-menu-${width}.png`)});
                await item.click();
            }
            const dialog=root.locator('[data-easystud-move-modal]');
            await expect(dialog).toBeVisible();
            await expect(dialog.locator('[data-easystud-move-modal-help]')).toContainText('Only the selected source memberships');
            await expect(dialog.locator('[data-easystud-move-origin-wrap]')).toBeHidden();
            const select=dialog.locator('[data-easystud-move-destination]');
            const before=await select.inputValue();
            const options=await select.locator('option').evaluateAll(nodes=>nodes.map(n=>({value:n.value,label:n.textContent})));
            expect(options.length).toBeGreaterThan(0);expect(new Set(options.map(n=>n.value)).size).toBe(options.length);
            const choice=dialog.locator('.easyedu-searchable-choice');
            await choice.locator('.easyedu-searchable-choice__trigger').click();
            await choice.getByRole('searchbox').fill('__not_an_existing_destination__');
            await expect(choice.getByRole('status')).toBeVisible();await expect(select).toHaveValue(before);
            await choice.getByRole('searchbox').press('Escape');await expect(dialog).toBeVisible();
            await choice.locator('.easyedu-searchable-choice__trigger').click();
            await choice.getByRole('searchbox').fill(options[options.length-1].label);
            await choice.getByRole('button',{name:options[options.length-1].label,exact:true}).click();
            const pair=await dialog.locator('.easyedu-dialog-actions').evaluate(node=>{
                const r=node.getBoundingClientRect(),s=getComputedStyle(node);
                const buttons=[...node.children].map(n=>{const b=n.getBoundingClientRect(),c=getComputedStyle(n);
                    return {height:b.height,right:b.right,font:c.fontSize,padding:[c.paddingTop,c.paddingRight,c.paddingBottom,c.paddingLeft]};});
                return {buttons,rightDelta:Math.abs(Math.max(...buttons.map(b=>b.right))-r.right+parseFloat(s.paddingRight))};
            });
            expect(pair.buttons).toHaveLength(2);expect(Math.abs(pair.buttons[0].height-pair.buttons[1].height)).toBeLessThanOrEqual(1);
            expect(pair.buttons[0].padding).toEqual(pair.buttons[1].padding);expect(pair.buttons[0].font).toBe(pair.buttons[1].font);
            expect(pair.rightDelta).toBeLessThanOrEqual(1);
            await dialog.locator('.local-groupimport-easystud-modal__dialog').screenshot({path:testInfo.outputPath(`member-${entry}-${width}.png`)});
            await dialog.locator('.easyedu-dialog-actions [data-easystud-close-move-modal]').click();
            await expect(dialog).toBeHidden();
            if(trigger) await expect(trigger).toBeFocused();
            const kept=root.locator('[data-easystud-group-id="'+identity.group+'"] [data-easystud-member-id="'+identity.user+'"]:visible');
            expect(await kept.count()).toBeGreaterThan(0);
            records.push({width,entry,identity,options:options.length,pair,groupRowKept:true});save();
        }
    }
    expect(blocked,'Open/search/Cancel must not invoke a business command').toEqual([]);save();
});
