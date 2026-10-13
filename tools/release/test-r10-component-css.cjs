'use strict';
// Isolated presentation fixtures only; complements, never replaces native proof.
const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
    const css=fs.readFileSync(process.argv[2],'utf8');
    const browser=await chromium.launch({headless:true});const results=[];
    try {
        for(const touch of [false,true]) {
            const context=await browser.newContext({hasTouch:touch,viewport:{width:1280,height:900}});
            const page=await context.newPage();
            await page.setContent(`<html><body><div class="local-groupimport-easystud easyedu-ui" id="local-groupimport-easystud">
            <div class="local-groupimport-easystud-pagination"><div class="local-groupimport-easystud-pagination__controls">
            <button class="btn btn-sm" data-easystud-page-prev disabled>‹</button>
            <button class="btn btn-sm" data-easystud-page-next>›</button></div>
            <button class="btn local-groupimport-easystud-pagination__select">Tout sélectionner</button>
            <span class="local-groupimport-easystud-pagination__count">0 résultat</span></div>
            <div class="local-groupimport-easystud__clear-selection-frame"><span>1 sélection</span>
            <button class="btn local-groupimport-easystud__clear-selection">Effacer la sélection</button></div>
            </div></body></html>`);
            await page.addStyleTag({content:css});await page.emulateMedia({reducedMotion:'reduce'});
            const count=page.locator('.local-groupimport-easystud-pagination__count');
            const select=page.locator('.local-groupimport-easystud-pagination__select');
            for(const label of ['0 résultat','1 résultat','999 résultats','999 résultats correspondant à la recherche','0 results','1 result','999 matching results']) {
                await count.evaluate((n,s)=>n.textContent=s,label);
                const h=await count.evaluate(n=>n.getBoundingClientRect().height);
                const sh=await select.evaluate(n=>n.getBoundingClientRect().height);
                results.push({touch,label,countHeight:h,selectHeight:sh});assert.ok(Math.abs(h-sh)<=1);
                assert.equal(await count.getAttribute('tabindex'),null);
            }
            const arrow=page.locator('[data-easystud-page-next]');
            const paint=async target=>target.evaluate(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,
                bg:getComputedStyle(n).backgroundColor,border:getComputedStyle(n).borderColor,shadow:getComputedStyle(n).boxShadow,
                radius:getComputedStyle(n).borderRadius,outline:getComputedStyle(n).outlineStyle}));
            const rest=await paint(arrow);results.push({touch,arrowRest:rest});
            assert.ok(touch?rest.width>=44:rest.width>=24 && rest.width<27);
            assert.equal(rest.bg,'rgba(0, 0, 0, 0)');
            await arrow.hover();const hover=await paint(arrow);results.push({touch,arrowHover:hover});
            assert.equal(hover.radius,'50%');assert.notEqual(hover.bg,rest.bg);
            await select.focus();await page.keyboard.press('Shift+Tab');
            const focus=await paint(arrow);results.push({touch,arrowFocus:focus});assert.notEqual(focus.shadow,'none');
            const clear=page.locator('.local-groupimport-easystud__clear-selection');
            await clear.evaluate(n=>n.disabled=true);const disabled=await paint(clear);results.push({touch,clearDisabled:disabled});
            assert.equal(disabled.border,'rgba(0, 0, 0, 0)');
            await context.close();
        }
    } finally {fs.writeFileSync(process.argv[3],JSON.stringify(results,null,2));await browser.close();}
    console.log(JSON.stringify({passed:true,records:results.length,kind:'isolated component CSS'}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
