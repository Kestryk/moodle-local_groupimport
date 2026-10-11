const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: fictional illustrations, isolated reading key; no business commands.
test('Guide identifier illustrations contain phase text fields and recognition at every width', async({page}, info) => {
    test.setTimeout(360000);
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
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const workspace=page.locator('#local-groupimport-easystud');
    try {
        await expect(workspace).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language+'(?:-|$)'));
        await page.emulateMedia({reducedMotion:'no-preference'});
        expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
        await page.evaluate(async()=>{
            const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
            root.inspectionPaintQaConfig=config;
            const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
            Guide.destroy(root);
            Guide.init(root,{...config,firstVisit:false,welcomeOffer:false,storageKey:'guide-inspection-paint-qa'});
        });
        if (!await page.locator('[data-easyedu-guide-open]:visible').count())
            await page.locator('[data-easyedu-navigation-open]:visible').first().click();
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        const modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
        const indices=await modal.locator('[data-easyedu-guide-scene="inspection"]').evaluateAll(nodes=>
            nodes.map(node=>node.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide));
        expect(indices).toHaveLength(2);
        const measure=async(slide,phase)=>slide.evaluate(async(node,phase)=>{
            await document.fonts.ready;
            const scene=node.querySelector('[data-easyedu-guide-scene="inspection"]'),
                card=scene.querySelector('[data-guide-inspection-card]'),
                panel=scene.querySelector('[data-guide-inspection-panel]');
            const visible=n=>n.getClientRects().length&&!n.closest('[hidden]')&&
                getComputedStyle(n).visibility!=='hidden';
            const faults=[],measured=[];
            for(const el of node.querySelectorAll(
                '[data-guide-live-copy], .easyedu-guide-scene__caption, .easyedu-guide-scene__result,'+
                '[data-guide-inspection-card] strong, [data-guide-inspection-card] small,'+
                '[data-guide-inspection-panel] label > span, [data-guide-inspection-chips] > span,'+
                '[data-guide-inspection-menu] > span, [data-guide-recap] li')) {
                if(!visible(el)||!el.textContent.trim())continue;
                const box=el.getBoundingClientRect(),range=document.createRange();
                range.selectNodeContents(el);
                const ink=range.getBoundingClientRect(),style=getComputedStyle(el);
                const overflow=Math.max(box.left-ink.left,ink.right-box.right,box.top-ink.top,ink.bottom-box.bottom);
                const row={role:el.getAttribute('data-guide-live-copy')!==null?'live-copy':el.tagName.toLowerCase(),
                    text:el.textContent.trim(),font:style.fontFamily,size:style.fontSize,overflow};
                measured.push(row);
                if(overflow>2)faults.push(row);
            }
            const cardBox=card.getBoundingClientRect(),panelBox=panel.getBoundingClientRect();
            const panelVisible=visible(panel);
            const input=scene.querySelector('[data-guide-inspection-input]');
            return {phase,measured,faults,panelVisible,
                panelInsideCard:!panelVisible||(panelBox.left>=cardBox.left-1&&panelBox.right<=cardBox.right+1&&
                    panelBox.top>=cardBox.top-1&&panelBox.bottom<=cardBox.bottom+1),
                fieldReadonly:input.readOnly,fieldValue:input.value,
                recognitionVisible:visible(scene.querySelector('[data-guide-inspection-chips]')),
                sceneHorizontalOverflow:scene.scrollWidth>scene.clientWidth+1};
        },phase);
        for(const width of [390,768,1280]) {
            await page.setViewportSize({width,height:1000});
            for(const index of indices) {
                await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
                await modal.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
                const slide=modal.locator('[data-easyedu-guide-slide="'+index+'"]'),
                    scene=slide.locator('[data-easyedu-guide-scene="inspection"]');
                await scene.locator('[data-guide-scene-command="start"]').click();
                const next=slide.locator('[data-guide-playback="next-phase"]');
                const row={width,index,language,phases:[]};
                rows.push(row);
                for(const phase of ['orient','open','enter','review','return']) {
                    await expect(scene).toHaveAttribute('data-guide-phase',phase);
                    await expect(next).toBeEnabled();
                    const proof=await measure(slide,phase);
                    row.phases.push(proof);
                    expect(proof.measured.length).toBeGreaterThan(2);
                    expect(proof.faults).toEqual([]);
                    expect(proof.panelInsideCard).toBe(true);
                    expect(proof.sceneHorizontalOverflow).toBe(false);
                    if(['enter','review','return'].includes(phase)) {
                        expect(proof.panelVisible).toBe(true);
                        expect(proof.fieldReadonly).toBe(true);
                        expect(proof.fieldValue.length).toBeGreaterThan(0);
                    }
                    if(phase==='review')expect(proof.recognitionVisible).toBe(true);
                    await next.click();
                }
                await expect(scene).toHaveAttribute('data-guide-scene-finished','true');
                await expect(scene.locator('[data-guide-inspection-panel]')).toBeHidden();
                await expect(scene.locator('[data-guide-inspection-input]')).toHaveValue('');
                await expect(scene.locator('[data-guide-recap]')).toBeVisible();
                const final=await measure(slide,'finished');row.phases.push(final);
                expect(final.faults).toEqual([]);
                expect(final.sceneHorizontalOverflow).toBe(false);
                await scene.locator('[data-guide-scene-command="reset"]').click();
                await expect(scene.locator('[data-guide-inspection-panel]')).toBeHidden();
            }
        }
        await modal.locator('[data-easyedu-guide-close]').click();
        await expect(modal).toBeHidden();
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(async()=>{
            const root=document.querySelector('[data-easyedu-guide-root]');
            if(!root?.inspectionPaintQaConfig)return;
            const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
            Guide.destroy(root);
            localStorage.removeItem('guide-inspection-paint-qa.checklist');
            localStorage.removeItem('guide-inspection-paint-qa.checklist.before-'+root.inspectionPaintQaConfig.presentationKey);
        }).catch(()=>{});
        fs.writeFileSync(info.outputPath('guide-identifier-phase-paint-native.json'),
            JSON.stringify({rows,errors,blocked,businessWrites:false,realUserProgressWritten:false},null,2));
    }
});
