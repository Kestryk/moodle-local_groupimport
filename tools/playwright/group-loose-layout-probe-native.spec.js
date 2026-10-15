const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const strict = true;
test('K16 loose group responsive diagnostic', async({page}, info) => {
    test.setTimeout(1750000); page.setDefaultTimeout(45000);
    const base = new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL || '');
    if (base.origin !== 'http://localhost' || base.searchParams.get('id') === '5') throw Error('Disposable fixture required');
    const report = {strict, rows:[], errors:[], writes:[]};
    const save = () => fs.writeFileSync(info.outputPath('group-grid-measures.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', e => {report.errors.push(e.message); save();});
    await page.route('**/local/groupimport/ajax.php*', r => {report.writes.push(r.request().url()); return r.abort();});
    await page.route('**/lib/ajax/service.php*', r => {
        const writes = (r.request().postDataJSON() || []).filter(c => c.methodname.startsWith('local_groupimport_') && !/_(get|list)_/.test(c.methodname));
        if (writes.length) {report.writes.push(writes); return r.abort();} return r.continue();
    });
    await page.goto(new URL('/login/index.php', base).href, {waitUntil:'domcontentloaded'});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil:'domcontentloaded'});
    }
    const root = page.locator('#local-groupimport-easystud');
    const settle = async() => {
        await root.evaluate(async n => {await document.fonts.ready; await Promise.all(n.getAnimations({subtree:true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})));});
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    };
    const measure = card => card.evaluate(c => {
        const vis = n => n && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden';
        const q = s => [...c.querySelectorAll(s)].filter(vis), b = n => n.getBoundingClientRect();
        const cx = n => b(n).x + b(n).width / 2, cy = n => b(n).y + b(n).height / 2;
        const text = n => {const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect();};
        const spread = ns => ns.length ? Math.max(...ns) - Math.min(...ns) : 0;
        const name = q('.local-groupimport-easystud-group__name')[0];
        const checks = q('.local-groupimport-easystud-selector--group .local-groupimport-easystud-selector__ui, .local-groupimport-easystud-selector--member .local-groupimport-easystud-selector__ui, .easyedu-entity-card-empty__icon');
        const names = [name, ...q('.local-groupimport-easystud-member__name, .easyedu-entity-card-empty__copy')];
        const header = q('.local-groupimport-easystud-group__header .btn-link');
        const menu = q('.local-groupimport-easystud-group__header .local-groupimport-easystud-card-menu, :scope > .local-groupimport-easystud-card-menu');
        const last = menu.length ? menu[menu.length - 1] : header[header.length - 1];
        const removes = q('.local-groupimport-easystud-member__remove');
        const labelItems = q('.local-groupimport-easystud-group__header .badge, .local-groupimport-easystud-group__header .local-groupimport-easystud-token').concat(header);
        const reveal = q('[data-easystud-group-members-toggle]')[0], select = q('[data-easystud-group-select-all]')[0];
        const hit = n => {if (!n) return null; const p = document.elementFromPoint(cx(n), cy(n)); return p === n || n.contains(p);};
        const stacked = !!(reveal && select && b(reveal).left < b(select).right && b(select).left < b(reveal).right && b(reveal).top < b(select).bottom && b(select).top < b(reveal).bottom);
        const targets = q('.local-groupimport-easystud-group__header .btn-link, .local-groupimport-easystud-group__header .badge, .local-groupimport-easystud-group__header .local-groupimport-easystud-token, .local-groupimport-easystud-member__remove, [data-easystud-group-select-all], [data-easystud-group-members-toggle], .local-groupimport-easystud-selector, .easyedu-entity-card-empty__icon');
        const contents = targets.map(n => {
            const icon = n.querySelector('.local-groupimport-easystud-selector__ui, .fa');
            const content = icon ? b(icon) : text(n);
            return {kind:n.className, height:b(n).height, dx:content.x+content.width/2-cx(n), dy:content.y+content.height/2-cy(n)};
        });
        return {contents, name:name.textContent.trim(), empty:!!q('.easyedu-entity-card-empty__icon').length,
            checkCentres:checks.map(cx), textLefts:names.map(n => text(n).left),
            checkSpread:spread(checks.map(cx)), textSpread:spread(names.map(n => text(n).left)),
            rightSpread:last && removes.length ? Math.max(...removes.map(n => Math.abs(cx(n) - cx(last)))) : 0,
            headerDy:labelItems.length ? Math.max(...labelItems.map(n => Math.abs(cy(n) - text(name).y - text(name).height / 2))) : 0,
            stacked, reveal:reveal ? {height:b(reveal).height, width:b(reveal).width, hit:hit(reveal), centre:cx(reveal)} : null,
            select:select ? {height:b(select).height, width:b(select).width, hit:hit(select), centre:cx(select)} : null,
            cardCentre:cx(c), footerCentre:(b(c).left + parseFloat(getComputedStyle(c).borderLeftWidth) + parseFloat(getComputedStyle(c).paddingLeft) + b(c).right - parseFloat(getComputedStyle(c).borderRightWidth) - parseFloat(getComputedStyle(c).paddingRight)) / 2, cardsWidth:b(c).width};
    });
    try {for (const lang of ['fr']) for (const width of [390]) {
        await page.setViewportSize({width,height:1100}); base.searchParams.set('lang',lang);
        await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:180000});
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:180000});
        if (width <= 1024) await root.locator('[data-easystud-mobile-view="groups"]').click();
        else await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
        await settle();
        const panel = root.locator('[data-easystud-structure-groups]'); await expect(panel).toBeVisible();
        const samples = [];
        for (const label of ['QA Empty','QA Group 00']) {
            const card = panel.locator('[data-easystud-group-id]').filter({has:page.locator('.local-groupimport-easystud-group__name',{hasText:new RegExp('^'+label+'$')})}).first();
            await expect(card).toBeVisible(); await card.scrollIntoViewIfNeeded(); await settle();
            const m = await measure(card); samples.push(m); report.rows.push({lang,width,panel:'groups',...m}); save();
            if (strict) {
                expect(m.checkSpread).toBeLessThanOrEqual(.5); expect(m.textSpread).toBeLessThanOrEqual(.5);
                expect(m.rightSpread).toBeLessThanOrEqual(.5); expect(m.headerDy).toBeLessThanOrEqual(.5);
                expect(m.stacked).toBe(false);
                m.contents.forEach(t => {expect(Math.abs(t.dx)).toBeLessThanOrEqual(.5); expect(Math.abs(t.dy)).toBeLessThanOrEqual(.5);});
                if (m.select) expect(m.select.hit).toBe(true);
                if (m.reveal) expect(m.reveal.hit).toBe(true);
            }
        }
        expect(samples.map(s => s.empty)).toEqual([true,false]);
        // Real native footer, including disclosure and non-persistent model selection.
        if (width > 1024) await root.locator('[data-easystud-layout-mode="both"]:visible').click();
        else {
            const more = root.locator('[data-easystud-advanced-filters-toggle="structure-groups"]');
            if (await more.getAttribute('aria-expanded') !== 'true') await more.click();
            await settle();
            const onlyUngrouped = root.locator('[data-easystud-catalog-show-ungrouped="structure"]');
            if (!await onlyUngrouped.isChecked()) {
                const toggleLabel = onlyUngrouped.locator('..');
                await toggleLabel.evaluate(n => n.scrollIntoView({block:'center'}));
                await toggleLabel.click();
            }
            await expect(onlyUngrouped).toBeChecked();
        }
        const section = root.locator('.local-groupimport-easystud-tree__section--ungrouped');
        await expect(section).toBeVisible();
        const openSection = section.locator(':scope > [data-easystud-collapse-toggle]');
        if (await openSection.getAttribute('aria-expanded') !== 'true') await openSection.click();
        const search = section.locator('[data-easystud-container-group-search]');
        await expect(search).toBeVisible(); await search.fill('QA Loose'); await settle();
        const loose = section.locator('[data-easystud-group-id]').filter({has:page.locator('.local-groupimport-easystud-group__name',{hasText:/^QA Loose$/})});
        await expect(loose).toBeVisible();
        const reveal = loose.locator('[data-easystud-group-members-toggle]');
        if (await reveal.getAttribute('aria-expanded') !== 'true') await reveal.click();
        await settle(); await loose.scrollIntoViewIfNeeded(); await settle();
        const footer = await measure(loose); report.rows.push({lang,width,panel:'ungrouped-footer',...footer}); save();
        report.diagnostic = await loose.evaluate(c => {
            const slots = [...c.querySelectorAll(':scope > *, .easyedu-entity-card-grid__header > *, .local-groupimport-easystud-member')];
            const props = ['display','position','flex','flex-wrap','grid-column','grid-row','grid-template-columns','grid-auto-flow','width','min-width','height','margin','padding','top','right','transform'];
            const rules = []; const visit = rs => {for (const r of rs) {
                if(r.cssRules) visit(r.cssRules);
                else if(r.selectorText) {try {if([c,...slots].some(n => n.matches(r.selectorText))) {
                    const v = props.filter(p => r.style.getPropertyValue(p)).map(p => p+':'+r.style.getPropertyValue(p));
                    if(v.length) rules.push({selector:r.selectorText,css:v.join(';')});
                }} catch {}}
            }};
            for(const sheet of document.styleSheets) {try{visit(sheet.cssRules);}catch{}}
            return {html:c.outerHTML,slots:slots.filter(n=>n.getClientRects().length).map(n => {
                const cs=getComputedStyle(n),b=n.getBoundingClientRect();
                return {kind:n.className,rect:{x:b.x,y:b.y,w:b.width,h:b.height},css:Object.fromEntries(props.map(p=>[p,cs.getPropertyValue(p)]))};
            }),rules};
        }); save();
        await loose.screenshot({path:info.outputPath('loose-390.png')});
    } expect(report.errors).toEqual([]); expect(report.writes).toEqual([]);
    } finally {save();}
});
