'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

test('R10 component CSS successor on 49072 FR EN widths', async({page}, info) => {
    test.setTimeout(300000);
    const report = {kind: 'transient CSS candidate, not published runtime', records: [], errors: [], blocked: []};
    const save = () => fs.writeFileSync(info.outputPath('r10-css.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', e => report.errors.push(e.message));
    const css = fs.readFileSync(process.env.EASYEDU_CANDIDATE_CSS, 'utf8');
    await audit.login(page); await audit.blockBusinessWrites(page, report.blocked);
    const read = async(root, phase, lang, width) => {
        const data = await root.evaluate(n => {
            const visible = x => x.getClientRects().length && getComputedStyle(x).visibility === 'visible';
            const rect = x => {const r = x.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height};};
            const card = [...n.querySelectorAll('[data-easystud-user]')].find(visible);
            const eye = card?.querySelector('.local-groupimport-easystud-user__detail-button');
            const name = card?.querySelector('.local-groupimport-easystud-user__headline-main');
            const bar = [...n.querySelectorAll('.local-groupimport-easystud-pagination')].find(x => visible(x) &&
                x.querySelector('.local-groupimport-easystud-pagination__count') && x.querySelector('.local-groupimport-easystud-pagination__select'));
            const count = bar?.querySelector('.local-groupimport-easystud-pagination__count');
            const select = bar?.querySelector('.local-groupimport-easystud-pagination__select');
            const arrow = [...n.querySelectorAll('[data-easystud-page-next]')].find(visible);
            const title = [...n.querySelectorAll('.local-groupimport-easystud-column-heading__title')].find(visible);
            return {eye:eye && rect(eye), identity:name && rect(name), glyph:eye?.querySelector('.fa') && rect(eye.querySelector('.fa')),
                count:count && rect(count), select:select && rect(select), countRole:count?.getAttribute('role'),
                arrow:arrow && {...rect(arrow),html:arrow.outerHTML,background:getComputedStyle(arrow).backgroundColor,border:getComputedStyle(arrow).borderColor},
                titleColor:title && getComputedStyle(title).color, overflow:n.scrollWidth-n.clientWidth};
        });
        report.records.push({phase,lang,width,...data});save(); return data;
    };
    try {
        for (const lang of ['fr','en']) {
            const url=audit.perfUrl();url.searchParams.set('lang',lang);
            await page.setViewportSize({width:1600,height:1000});
            await page.goto(url.href,{waitUntil:'domcontentloaded'});const root=await audit.ready(page);
            await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+lang));
            await read(root,'served',lang,1600);
            for (const width of [1600,1280,390]) {
                await page.setViewportSize({width,height:1000}); await audit.settle(root);
                const participants=root.locator('[data-easystud-mobile-view="participants"]:visible');
                if(await participants.count()) await participants.click();
                await audit.settle(root);
                await read(root,'baseline-width',lang,width);
                const sheet=await page.addStyleTag({content:css});
                await read(root,'candidate',lang,width);
                const card=root.locator('[data-easystud-user]:visible').first();
                const checkbox=card.locator('[data-easystud-selector-input]').first();
                await checkbox.evaluate(n=>n.click());await audit.settle(root);
                await read(root,'selected',lang,width);
                const clear=root.locator('.local-groupimport-easystud__clear-selection:visible').first();
                if(await clear.count()) {
                    const paint=async state=>{report.records.push({lang,width,state,clear:await clear.evaluate(n=>({border:getComputedStyle(n).borderColor,background:getComputedStyle(n).backgroundColor,shadow:getComputedStyle(n).boxShadow,height:n.getBoundingClientRect().height}))});save();};
                    await paint('rest');await clear.hover();await paint('hover');await clear.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await paint('keyboard');
                }
                await page.screenshot({path:info.outputPath(lang+'-'+width+'.png')});
                await checkbox.evaluate(n=>n.click());await audit.settle(root);
                const heading=card.locator('.local-groupimport-easystud-user__name');
                const original=await heading.textContent();
                try {await heading.evaluate(n=>{n.textContent='Alexandrine Catherine de La Roche Internationale Longue Identité';}); await read(root,'synthetic-long-name',lang,width);}
                finally{await heading.evaluate((n,s)=>{n.textContent=s;},original);}
                await sheet.evaluate(n=>n.remove());
            }
        }
        expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
        for(const r of report.records.filter(x=>x.phase==='candidate')) {
            const baseline=report.records.find(x=>x.phase==='baseline-width' && x.width===r.width && x.lang===r.lang);
            expect(r.overflow,'candidate must not increase pre-existing root overflow').toBeLessThanOrEqual(baseline.overflow);
            if(r.count && r.select) expect(Math.abs(r.count.height-r.select.height)).toBeLessThanOrEqual(1);
            if(r.arrow) expect(r.arrow.width).toBeLessThanOrEqual(26);
        }
    } finally {save();}
});
