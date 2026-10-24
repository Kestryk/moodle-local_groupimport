const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const acorn = require(process.env.EASYEDU_ACORN_MODULE || 'acorn');
test.use({launchOptions: {executablePath: process.env.EASYSTUD_CHROME_PATH}, ignoreHTTPSErrors: true});
test('K23 paired search and Motion final', async({page, context}) => {
    test.setTimeout(600000); page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(120000);
    const dir = process.env.K2378_DIR, root = process.env.K2378_ROOT, url = new URL(process.env.EASYEDU_MOODLE_URL);
    const result = {cases: [], errors: [], requests: []}; let mode = 'after';
    const save = () => fs.writeFileSync(dir + '/native.json', JSON.stringify(result, null, 2));
    const settle = async() => { await page.waitForTimeout(350); await page.evaluate(() => Promise.all(document.getAnimations()
        .filter(a => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})))); };
    page.on('pageerror', e => { result.errors.push({mode, message: e.message, stack: e.stack}); save(); });
    await context.route('**/*', async r => {
        const u = new URL(r.request().url());
        if (u.pathname.includes('/lib/requirejs.php/')) {
            const response = await r.fetch(); let body = await response.text();
            const names = ['workspace', 'group_card_controls'];
            if (names.some(name => body.includes('define("local_groupimport/local/cm/' + name + '",'))) {
                const ast = acorn.parse(body, {ecmaVersion: 'latest'});
                const replacements = ast.body.filter(n => n.expression?.callee?.name === 'define' &&
                    names.some(name => n.expression.arguments[0]?.value === 'local_groupimport/local/cm/' + name));
                for (const node of replacements.sort((a,b) => b.start-a.start)) {
                    const name = node.expression.arguments[0].value.split('/').pop();
                    const candidate = fs.readFileSync(mode === 'before' ? dir + '/before-' + name + '.min.js' :
                        root + '/amd/build/local/cm/' + name + '.min.js', 'utf8').split('//# sourceMappingURL=')[0];
                    body = body.slice(0,node.start) + candidate + '\n' + body.slice(node.end);
                    result.requests.push({mode,module:name}); save();
                }
            }
            return r.fulfill({response,body});
        }
        for (const name of ['student-management.css', 'guide.css']) if (u.pathname.endsWith('/styles/' + name)) {
            return r.fulfill({contentType: 'text/css', body: fs.readFileSync(mode === 'before' ? dir + '/before-' + name : root + '/styles/' + name)});
        }
        for (const name of ['workspace', 'group_card_controls']) if (u.pathname.includes('/local_groupimport/local/cm/' + name + '.js')) {
            result.requests.push({mode, module: name}); save();
            return r.fulfill({contentType: 'application/javascript', body: fs.readFileSync(mode === 'before' ?
                dir + '/before-' + name + '.min.js' : root + '/amd/build/local/cm/' + name + '.min.js')});
        }
        if (u.pathname.includes('/api/rest/v2/user/current/preferences/') && r.request().method() === 'POST') {
            return r.fulfill({contentType: 'application/json', body: '{}'});
        }
        if (u.pathname.includes('/lib/ajax/service.php')) {
            let calls; try { calls = r.request().postDataJSON(); } catch { /* GET reads. */ }
            if (Array.isArray(calls) && calls.every(c => /^core_user_(set|update)_user_preferences?$/.test(c.methodname))) {
                return r.fulfill({contentType: 'application/json', body: JSON.stringify(calls.map(() => ({error: false, data: {}})))});
            }
        }
        return r.continue();
    });
    const login = await context.request.get(url.origin + '/login/index.php');
    const token = (await login.text()).match(/name="logintoken" value="([^"]+)"/)?.[1];
    await context.request.post(url.origin + '/login/index.php', {maxRedirects: 0, form: {
        username: process.env.EASYEDU_MOODLE_USERNAME, password: process.env.EASYEDU_MOODLE_PASSWORD, logintoken: token
    }});
    try {
        for (const lang of ['fr','en']) {
            url.searchParams.set('lang',lang); await page.setViewportSize({width:1600,height:1100});
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            await page.waitForSelector('#local-groupimport-easystud[data-easystud-loading-state="ready"]',{timeout:120000});
            await page.evaluate(()=>document.fonts.ready);
            for(let i=0;i<2;i++){const c=page.locator('.drawer.show [data-action="closedrawer"]:visible').first(); if(await c.count())await c.click();}
            const both=page.locator('[data-easystud-layout-mode="both"]:visible').first(); if(await both.count())await both.click(); await settle();
            for(const width of [1600,768,390]) {
                await page.setViewportSize({width,height:1100}); await settle();
                const all=await page.evaluate(()=>[...document.querySelectorAll('#local-groupimport-easystud input[type="search"]')].map(input=>({
                    attributes:[...input.attributes].filter(a=>a.name.startsWith('data-easystud')).map(a=>a.name+'='+a.value),
                    placeholder:input.placeholder,captioned:!!input.closest('.easyedu-search-field--captioned'),visible:input.checkVisibility()
                })));
                const section=page.locator('.local-groupimport-easystud-tree__section--ungrouped');
                const visible=await section.isVisible();
                if(visible){
                    const toggle=section.locator('[data-easystud-collapse-toggle]').first();
                    if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click(); await settle();
                    await section.evaluate(e=>{const p=e.querySelector('[data-easystud-container-search-panel]');p.hidden=false;p.classList.add('is-open');});
                    await settle();
                }
                const geometry=await section.evaluate(e=>{
                    const input=e.querySelector('input[type="search"]'),field=input.closest('label'),button=e.querySelector('.easyedu-inline-search-cancel');
                    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom};};
                    return {field:rect(field),input:rect(input),button:rect(button),placeholder:input.placeholder,
                        captioned:field.classList.contains('easyedu-search-field--captioned'),visible:input.checkVisibility(),
                        iconMode:getComputedStyle(button.querySelector('.easyedu-inline-search-cancel__label')).display==='none'};
                });
                const baselineCss=fs.readFileSync(process.env.K2378_BASELINE_CSS,'utf8');
                const fixture=await section.evaluate((section,{width,baselineCss})=>{
                    const panel=section.querySelector('[data-easystud-container-search-panel]').cloneNode(true);
                    panel.hidden=false;panel.classList.add('is-open');
                    const host=document.createElement('div');host.style.cssText='position:fixed;top:200px;left:16px;width:'+Math.min(320,width-32)+'px;z-index:2000';
                    host.appendChild(panel);document.querySelector('#local-groupimport-easystud').appendChild(host);
                    const input=panel.querySelector('input'),button=panel.querySelector('button'),field=input.closest('label');
                    const r=field.getBoundingClientRect(),b=button.getBoundingClientRect();
                    const row={field:r.height,button:b.height,dy:r.bottom-b.bottom,captioned:field.classList.contains('easyedu-search-field--captioned'),
                        placeholder:input.placeholder,iconMode:getComputedStyle(button.querySelector('.easyedu-inline-search-cancel__label')).display==='none'};
                    const sheets=[...document.styleSheets].filter(s=>s.href&&s.href.includes('/styles/student-management.css'));
                    sheets.forEach(s=>s.disabled=true);const old=document.createElement('style');old.textContent=baselineCss;document.head.appendChild(old);
                    const beforeField=field.getBoundingClientRect(),beforeButton=button.getBoundingClientRect();
                    row.before={field:beforeField.height,button:beforeButton.height,dy:beforeField.bottom-beforeButton.bottom};
                    old.remove();sheets.forEach(s=>s.disabled=false);host.remove();return row;
                },{width,baselineCss});
                expect(fixture.iconMode).toBeTruthy();expect(Math.abs(fixture.field-fixture.button)).toBeLessThanOrEqual(.5);
                expect(Math.abs(fixture.dy)).toBeLessThanOrEqual(.5);
                await page.evaluate(()=>{document.querySelector('#page').scrollTop=0;window.scrollTo(0,0);});await settle();
                await page.evaluate(()=>new Promise(resolve=>require(['local_groupimport/easyedu_notification'],n=>{n.show({text:'K23 notification',title:'EasyStud',closeLabel:'Close',delay:60000});resolve();})));
                await settle();
                const toast=await page.locator('.easyedu-v3-banner-stack').evaluate(e=>{
                    const b=e.getBoundingClientRect();const overlap=r=>Math.max(0,Math.min(b.right,r.right)-Math.max(b.left,r.left))*Math.max(0,Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top));
                    return {x:b.x,y:b.y,obstacles:[...document.querySelectorAll('.navbar.fixed-top,.easyedu-navigation__identity,[data-easyedu-navigation-drawer-toggle]')]
                        .filter(n=>n.checkVisibility()).map(n=>({class:n.className,overlap:overlap(n.getBoundingClientRect())}))};
                });
                await page.screenshot({path:dir+'/toast-'+lang+'-'+width+'.png'});
                await page.locator('.easyedu-v3-banner__close:visible').last().click();await settle();
                expect(toast.x).toBe(16);expect(toast.obstacles.every(o=>o.overlap===0)).toBeTruthy();
                result.cases.push({lang,width,all,ungrouped:geometry,narrowComponentFixture:fixture,toast});save();
                expect(all.filter(f=>f.attributes.length).every(f=>!f.captioned&&f.placeholder)).toBeTruthy();
                if(visible){expect(geometry.visible).toBeTruthy();expect(Math.abs(geometry.field.h-geometry.button.h)).toBeLessThanOrEqual(.5);
                    await section.screenshot({path:dir+'/ungrouped-'+lang+'-'+width+'.png'});}
            }
            await page.setViewportSize({width:1600,height:1100});
            await page.locator('[data-easystud-layout-mode="structure"]:visible').first().click();await settle();
            await page.evaluate(()=>{
                const root=document.querySelector('#local-groupimport-easystud');root.setAttribute('data-easyedu-motion-level','full');
                document.body.classList.remove('easyedu-motion-disabled','easyedu-motion-reduced');
                root.addEventListener('click',e=>{const toggle=e.target.closest('[data-easystud-container-search-toggle]');
                    if(!toggle)return; const key=toggle.getAttribute('data-easystud-container-search-toggle');
                    const panel=root.querySelector('[data-easystud-container-search-panel="'+key+'"]');
                    window.k23Transition={active:panel.classList.contains('is-easyedu-disclosing'),classes:panel.className};
                });
            });
            const header=page.locator('.local-groupimport-easystud-grouping__header:visible').first();
            const search=header.locator('[data-easystud-container-search-toggle]:visible').first();
            if(await search.count())await search.click();else{
                await header.locator('[data-easystud-card-menu]:visible').first().click();await settle();
                await page.locator('[data-easystud-context-action="grouping-search-groups"]:visible').first().click();
            }
            await settle();const panel=page.locator('.local-groupimport-easystud-container-search.is-open:visible').first();
            expect(await panel.count()).toBe(1);
            const transition=await page.evaluate(()=>window.k23Transition);
            expect(transition.active).toBeTruthy();
            const opened=await page.locator('[data-easystud-container-search-toggle][aria-expanded="true"]').count();
            expect(opened).toBeGreaterThan(0);
            await panel.locator('[data-easystud-container-search-cancel]').click();await settle();
            result.manual||=[];result.manual.push({lang,opened,transition,closed:await panel.count()===0});save();
            expect(await panel.count()).toBe(0);
        }
        expect(result.errors).toEqual([]);
    } catch(e){result.failure={message:e.message,stack:e.stack};save();throw e;}
});
