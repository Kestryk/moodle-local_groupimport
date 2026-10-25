const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const setMode = mode => execFileSync(process.env.EASYEDU_PHP_EXECUTABLE, ['-r',
    "define('CLI_SCRIPT',true); require $argv[1].'/config.php'; " +
    "set_config('renderingmode',$argv[2],'local_groupimport'); echo get_config('local_groupimport','renderingmode');",
    process.env.EASYEDU_MOODLE_ROOT,mode], {encoding:'utf8',timeout:30000}).trim();
const settle = locator => locator.evaluate(async node => {
    await document.fonts.ready;
    await Promise.all(node.getAnimations({subtree:true})
        .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})));
});

test('K14 K15 and A-ICONE FR1280 native inline focus both modes', async ({page},info) => {
    test.setTimeout(240000);
    page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(60000);
    await page.setViewportSize({width:1280,height:1000});
    await page.emulateMedia({reducedMotion:'no-preference'});
    const url=new URL(process.env.EASYEDU_MOODLE_URL);
    if (url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5') throw Error('Principal local course5 required');
    url.searchParams.set('lang','fr');
    const rows=[],errors=[],writes=[];
    const save=()=>fs.writeFileSync(info.outputPath('k14-k15-a-icone.json'),JSON.stringify({rows,errors,writes},null,2));
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/local/groupimport/ajax.php*',route=>{writes.push(route.request().postData());return route.abort('blockedbyclient');});
    await page.route('**/lib/ajax/service.php*',route=>{
        const calls=route.request().postDataJSON()||[];
        const mutations=calls.filter(c=>/^local_groupimport_sm_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname));
        if(mutations.length){writes.push(mutations.map(c=>c.methodname));return route.abort('blockedbyclient');}
        return route.continue();
    });
    await page.addInitScript(()=>{
        window.inlineFocusQA=[];
        const original=HTMLElement.prototype.focus;
        HTMLElement.prototype.focus=function(options){
            if(!this.matches('[data-easystud-group-member-search],[data-easystud-group-email-box]')) return original.call(this,options);
            const ancestors=[];
            for(let n=this.parentElement;n;n=n.parentElement) ancestors.push(n);
            const before=ancestors.map(n=>({id:n.id,top:n.scrollTop,left:n.scrollLeft}));
            const result=original.call(this,options);
            const after=ancestors.map(n=>({id:n.id,top:n.scrollTop,left:n.scrollLeft}));
            window.inlineFocusQA.push({field:this.hasAttribute('data-easystud-group-member-search')?'loupe':'identifiers',
                preventScroll:options?.preventScroll===true,before,after,focused:document.activeElement===this});
            return result;
        };
    });
    try{
        expect(setMode('legacy')).toBe('legacy');
        await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
        if(await page.locator('#username').count()){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter:true});
            await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        }
        for(const mode of ['legacy','reactive']){
            expect(setMode(mode)).toBe(mode);
            const row={mode,stage:'loading',panels:[]};rows.push(row);save();
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            await expect(page.locator('html')).toHaveAttribute('lang',/^fr(?:-|$)/);
            expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
            const root=page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);
            await root.locator('[data-easystud-layout-mode="participants"]:visible').first().click();await settle(root);
            const cards=root.locator('[data-easystud-group-id]:visible').filter({has:page.locator('[data-easystud-group-member-search-toggle]')});
            const cardCount=await cards.count();expect(cardCount).toBeGreaterThan(0);
            const card=cards.nth(Math.min(4,cardCount-1));
            for(const def of [
                {name:'loupe',toggle:'[data-easystud-group-member-search-toggle]',panel:'[data-easystud-group-member-search-panel]',field:'[data-easystud-group-member-search]'},
                {name:'identifiers',toggle:'[data-easystud-toggle-group-email]',panel:'[data-easystud-group-email-panel]',field:'[data-easystud-group-email-box]'}]){
                const toggle=card.locator(def.toggle).first(),panel=card.locator(def.panel).first();
                await toggle.scrollIntoViewIfNeeded();
                if(await panel.isVisible()){await toggle.click();await expect(panel).toBeHidden();}
                const before=await page.evaluate(()=>window.inlineFocusQA.length);
                // Identifier panels are created by their first native click.
                await card.evaluate((n,selector)=>{
                    window.panelDisclosureQA={entered:false};
                    window.panelDisclosureObserver=new MutationObserver(()=>{
                        if(n.querySelector(selector)?.classList.contains('is-easyedu-disclosing')) window.panelDisclosureQA.entered=true;
                    });
                    window.panelDisclosureObserver.observe(n,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
                },def.panel);
                await toggle.click();await expect(panel).toBeVisible();
                await expect(panel.locator(def.field)).toBeFocused({timeout:20000});await settle(panel);
                const evidence=await page.evaluate(before=>{
                    window.panelDisclosureObserver.disconnect();
                    return {disclosure:window.panelDisclosureQA.entered,calls:window.inlineFocusQA.slice(before)};
                },before);
                row.panels.push({name:def.name,...evidence});save();
                expect(evidence.disclosure).toBe(true);expect(evidence.calls).toHaveLength(1);
                expect(evidence.calls[0].field).toBe(def.name);expect(evidence.calls[0].preventScroll).toBe(true);
                expect(evidence.calls[0].focused).toBe(true);expect(evidence.calls[0].after).toEqual(evidence.calls[0].before);
                await card.screenshot({path:info.outputPath(mode+'-'+def.name+'.png')});
                await toggle.click();await expect(panel).toBeHidden();
            }
            const config=await page.evaluate(async mode=>{
                const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
                window.iconQAOriginalConfig=config;
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);Guide.init(root,{...config,firstVisit:false,welcomeOffer:false,storageKey:'a-icone-native-qa-'+mode});
                return config.slideIds;
            },mode);
            if(!await page.locator('[data-easyedu-guide-open]:visible').count()) await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(guide).toBeVisible();
            const conceptIndex=config.indexOf('understand-workspace');
            await guide.locator('[data-easyedu-guide-nav-item="'+conceptIndex+'"]').click();
            const concepts=guide.locator('[data-easyedu-guide-slide="'+conceptIndex+'"]');await expect(concepts).toBeVisible();await settle(guide);
            await expect(concepts.locator('.easyedu-guide-scene__grouping .easyedu-guide-scene__identity')).toHaveClass(/fa-layer-group/);
            const inspectionIndex=config.indexOf('read-grouping-card');
            await guide.locator('[data-easyedu-guide-nav-item="'+inspectionIndex+'"]').click();
            const inspection=guide.locator('[data-easyedu-guide-slide="'+inspectionIndex+'"]');await expect(inspection).toBeVisible();await settle(guide);
            row.icons=await inspection.locator('[data-easyedu-guide-scene="inspection"]').evaluate(n=>({
                identity:n.querySelector('[data-guide-inspection-card] .easyedu-guide-scene__identity')?.className,
                action:n.querySelector('[data-guide-inspection-trigger] .fa')?.className,
                compactMenu:n.querySelector('[data-guide-inspection-menu] strong .fa')?.className}));save();
            expect(row.icons.identity).toContain('fa-layer-group');expect(row.icons.action).toContain('fa-layer-group');
            expect(row.icons.compactMenu).toContain('fa-layer-group');
            await inspection.screenshot({path:info.outputPath(mode+'-grouping-guide.png')});
            await page.evaluate(async()=>{
                const root=document.querySelector('[data-easyedu-guide-root]');
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);Guide.init(root,{...window.iconQAOriginalConfig,firstVisit:false,welcomeOffer:false});
            });
            row.stage='complete';save();
        }
        expect(errors).toEqual([]);expect(writes).toEqual([]);
    }finally{setMode('legacy');save();}
});
