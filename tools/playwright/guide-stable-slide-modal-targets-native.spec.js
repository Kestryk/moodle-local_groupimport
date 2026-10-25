const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised, presentation-only native milestones. A bounded path starts
// at selection so this test never creates a group or confirms a transfer.
test('Guide stable-slide typed modal targets in active curriculum', async({page}, info) => {
    test.setTimeout(300000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil:'commit',timeout:60000});
        if (page.url() !== process.env.EASYEDU_MOODLE_URL) {
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
        }
    }
    page.setDefaultTimeout(15000);
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status:200,contentType:'application/json',
                body:JSON.stringify(methods.map(() => ({error:false,data:{}})))});
        }
        const reads = new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        for (const width of [1280,768,390]) {
            await page.setViewportSize({width,height:900});
            await page.emulateMedia({reducedMotion:'no-preference'});
            await page.evaluate(async width => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const config = root.easyeduGuideConfig;
                window.g11ChecklistTrace = [];
                document.addEventListener('easyedu:guide-open-target', event => {
                    if (event.detail?.root !== root) return;
                    const row = {target:event.detail.target,handled:event.detail.handled,at:performance.now()};
                    window.g11ChecklistTrace.push(row);
                    Promise.resolve(event.detail.ready).then(result => {row.readyResult=result;});
                });
                // Preserve actual native targets/events; do not fabricate Create
                // completion or touch the course. Ephemeral owned QA profile only.
                const steps = config.paths['practice-membership'].filter(step =>
                    ['select-participant','open-move','choose-destination','confirm-move'].includes(step.id)).map((step,index,array) => ({
                    ...step, requiresStep:index ? array[index-1].id : null
                }));
                if (steps.length !== 4) throw new Error('All four native presentation milestones required');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);
                Guide.init(root, {...config,firstVisit:false,storageKey:'g11-native-checklist-presentation-'+width,
                    paths:{...config.paths,'practice-membership':steps}});
            },width);
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            const practiceIndex = await page.evaluate(() => {
                const config = document.querySelector('[data-easyedu-guide-root]').easyeduGuideConfig;
                const index = config.slideIds.indexOf('create-structure');
                if (index < 0) throw new Error('Active creation lesson required');
                return index;
            });
            await guide.locator('[data-easyedu-guide-nav-item="' + practiceIndex + '"]').click();
            const invitation=guide.locator('[data-easyedu-guide-slide="' + practiceIndex + '"] .easyedu-guide-guided-card');
            await expect(invitation).toBeVisible();
            await invitation.scrollIntoViewIfNeeded();
            await page.waitForFunction(()=>{
                const dialog=document.querySelector('.easyedu-guide--discovery .easyedu-guide-modal__dialog');
                return dialog && !dialog.getAnimations().some(animation=>animation.playState==='running');
            });
            const layout=await invitation.evaluate(node=>{
                const rect=n=>n.getBoundingClientRect();
                const host=rect(node), icon=rect(node.querySelector('.easyedu-guide-guided-card__icon')),
                    body=rect(node.querySelector('.easyedu-guide-guided-card__body')),
                    action=rect(node.querySelector('[data-easyedu-guide-start-path]'));
                return {width:innerWidth,overflow:node.scrollWidth>node.clientWidth+1,
                    iconLeft:icon.left,bodyLeft:body.left,iconTop:icon.top,bodyTop:body.top,
                    startTop:action.top,bodyBottom:body.bottom,startCentre:action.y+action.height/2,
                    bodyCentre:body.y+body.height/2,
                    contained:[icon,body,action].every(r=>r.left>=host.left && r.right<=host.right+1)};
            });
            rows.push({width,invitation:layout});
            expect(layout.contained && !layout.overflow).toBeTruthy();
            if (width===390) {
                expect(Math.abs(layout.iconLeft-layout.bodyLeft)).toBeLessThan(1);
                expect(layout.iconTop).toBeLessThan(layout.bodyTop);
                expect(layout.startTop).toBeGreaterThanOrEqual(layout.bodyBottom);
            } else if (width===1280) {
                expect(Math.abs(layout.startCentre-layout.bodyCentre)).toBeLessThan(1);
            }
            await page.screenshot({path:info.outputPath('path-invitation-'+width+'.png')});
            await guide.locator('[data-easyedu-guide-start-path="practice-membership"]').click();
            await expect(guide).toBeHidden();
            const panel = page.locator('[data-easyedu-guide-checklist]');
            await expect(panel).toBeVisible();
            await page.locator('[data-easystud-mobile-view="participants"]:visible, ' +
                '[data-easystud-layout-mode="participants"]:visible').first().click();
            const selector = page.locator('[data-easystud-participant-list] [data-easystud-user]:visible .local-groupimport-easystud-selector').first();
            const checkbox = selector.locator('input');
            await selector.click();
            await expect(checkbox).toBeChecked();
            await expect(panel.locator('[data-easyedu-guide-step-id="select-participant"]')).toHaveClass(/is-complete/);
            const highlight = page.locator('[data-easyedu-guide-highlight]');
            await expect(highlight).toBeVisible();
            const move = page.locator('[data-easystud-move-selected-participants]:visible, ' +
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-participants]"]:visible').first();
            const activeMove = panel.locator('[data-easyedu-guide-step-id="open-move"]');
            await expect(activeMove).toHaveClass(/is-active/);
            // A guided task remains current beyond the ordinary transient cue's
            // 5.2s timeout; do not abandon its highlight while the visitor reads.
            await page.waitForTimeout(6500);
            await expect(highlight).toBeVisible();
            await move.click();
            const dialog = page.locator('[data-easystud-move-modal]');
            await expect(dialog).toBeVisible();
            await expect(dialog).toHaveAttribute('data-easystud-move-context', 'participant');
            await expect(panel.locator('[data-easyedu-guide-step-id="open-move"]')).toHaveClass(/is-complete/);
            await expect(panel.locator('[data-easyedu-guide-step-id="choose-destination"]')).toHaveClass(/is-active/);
            await expect(highlight).toBeVisible();
            const destination = dialog.locator('.easyedu-searchable-choice');
            await expect(destination).toBeVisible();
            await expect.poll(async() => {
                const h = await highlight.boundingBox(), d = await destination.boundingBox();
                return h && d ? Math.max(Math.abs(h.x-d.x),Math.abs(h.y-d.y),Math.abs(h.width-d.width),Math.abs(h.height-d.height)) : Infinity;
            },{timeout:15000}).toBeLessThan(2);
            // Choose an existing destination locally; never press Confirm.
            const nativeSelect=dialog.locator('[data-easystud-move-destination]');
            const optionIndex=await nativeSelect.locator('option').evaluateAll(options =>
                options.findIndex(option=>option.value && !option.disabled));
            expect(optionIndex).toBeGreaterThanOrEqual(0);
            // The canonical enhancement hides its authoritative native select.
            // Use the real visible choice, never force a hidden native action.
            await destination.locator('.easyedu-searchable-choice__trigger').click();
            await destination.locator('.easyedu-searchable-choice__option').nth(optionIndex).click();
            await expect(panel.locator('[data-easyedu-guide-step-id="confirm-move"]')).toHaveClass(/is-active/);
            const confirm=dialog.locator('[data-easystud-confirm-move]');
            await expect(confirm).toBeVisible();
            await expect.poll(async() => {
                const h=await highlight.boundingBox(), c=await confirm.boundingBox();
                return h && c ? Math.max(Math.abs(h.x-c.x),Math.abs(h.y-c.y),
                    Math.abs(h.width-c.width),Math.abs(h.height-c.height)) : Infinity;
            },{timeout:15000}).toBeLessThan(2);
            await dialog.locator('[data-easystud-close-move-modal]').first().click();
            await expect(dialog).toBeHidden();
            await expect(dialog).not.toHaveAttribute('data-easystud-move-context', /.+/);
            if (await checkbox.isChecked()) await selector.click();
            await panel.locator('[data-easyedu-guide-checklist-close]').click();
            await expect(panel).toBeHidden();
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const compareIndex = await page.evaluate(() => {
                const config = document.querySelector('[data-easyedu-guide-root]').easyeduGuideConfig;
                const index = config.slideIds.indexOf('add-or-move-members');
                if (index < 0) throw new Error('Active organisation lesson required');
                return index;
            });
            await guide.locator('[data-easyedu-guide-nav-item="' + compareIndex + '"]').click();
            const compare=guide.locator('[data-easyedu-guide-slide="' + compareIndex + '"] .easyedu-guide-scene__context p').last();
            await compare.scrollIntoViewIfNeeded();
            const comparePaint=await compare.evaluate(node=>{
                const bounds=node.getBoundingClientRect(),parent=node.parentElement.getBoundingClientRect(),
                    range=document.createRange();range.selectNodeContents(node);
                return {overflow:node.scrollWidth>node.clientWidth+1,whiteSpace:getComputedStyle(node).whiteSpace,
                    rect:{x:bounds.x,width:bounds.width},parent:{x:parent.x,width:parent.width},
                    paint:[...range.getClientRects()].map(r=>({x:r.x,width:r.width})),
                    fits:bounds.left>=parent.left-1 && bounds.right<=parent.right+1 &&
                        [...range.getClientRects()].every(r=>r.left>=bounds.left-1 && r.right<=bounds.right+1)};
            });
            rows.push({width,comparePaint});
            await page.screenshot({path:info.outputPath('compare-copy-'+width+'.png')});
            expect(comparePaint.fits && !comparePaint.overflow).toBeTruthy();
            await guide.locator('[data-easyedu-guide-close]').first().click();
            rows.push({width,nativeSelection:true,nativeMoveOpenedAndCancelled:true,destinationHighlightAligned:true,confirmationHighlightAligned:true});
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        const diagnostic = await page.evaluate(() => {
            const root = document.querySelector('[data-easyedu-guide-root]');
            const describe = n => {
                if (!n) return null;
                const r = n.getBoundingClientRect(), s = getComputedStyle(n);
                return {tag:n.tagName,hidden:n.hidden,disabled:n.disabled,display:s.display,
                    visibility:s.visibility,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
            };
            return {trace:window.g11ChecklistTrace || [],epoch:root?.easyeduGuidePathEpoch,
                currentTarget:describe(root?.easyeduGuideCurrentTarget),
                activeStep:root?.querySelector('[data-easyedu-guide-step-index].is-active')?.dataset.easyeduGuideStepId,
                moveTargets:root?.easyeduGuideConfig?.targets?.participantMoveAction,
                moveControls:[...document.querySelectorAll('[data-easystud-move-selected-participants]')].map(describe)};
        }).catch(() => null);
        fs.writeFileSync(info.outputPath('guide-g11-checklist-result.json'),JSON.stringify({rows,errors,blocked,
            diagnostic,
            scope:'Presentation path begins at real selection; Create and real Confirm transaction not exercised',
            fixtureRequested:false,businessTransactionConfirmed:false},null,2));
    }
});
