'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');const audit=require('./roadmap-audit-helper.cjs');
test('T058 reduced Search focus diagnostic FR1280',async({page},info)=>{
    test.setTimeout(150000);page.setDefaultTimeout(60000);
    const report={rows:[],errors:[],writesBlocked:[],identity:audit.identity()};
    const save=()=>fs.writeFileSync(info.outputPath('focus-diagnostic.json'),JSON.stringify(report,null,2));
    await page.addInitScript(()=>{
        window.__focusCalls=[];const original=HTMLElement.prototype.focus;
        HTMLElement.prototype.focus=function(...args){window.__focusCalls.push({html:this.outerHTML.slice(0,600)});
            return original.apply(this,args);};
    });
    await page.setViewportSize({width:1280,height:900});await page.emulateMedia({reducedMotion:'reduce'});
    page.on('pageerror',e=>report.errors.push(e.message));
    await audit.login(page);await audit.blockBusinessWrites(page,report.writesBlocked);
    try{
        const root=await audit.ready(page);
        await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click();await audit.settle(root);
        for(const [name,ownerSelector,toggleSelector,panelSelector,fieldSelector,cancelSelector] of [
            ['group','[data-easystud-structure-groups] [data-easystud-advanced-type="group"]:visible','[data-easystud-group-member-search-toggle]','[data-easystud-group-member-search-panel]','[data-easystud-group-member-search]','[data-easystud-group-member-search-cancel]'],
            ['grouping','[data-easystud-tree] [data-easystud-advanced-type="grouping"]:visible','[data-easystud-container-search-toggle]','[data-easystud-container-search-panel]','[data-easystud-container-group-search]','[data-easystud-container-search-cancel]']
        ]){
            const owner=root.locator(ownerSelector).first(),toggle=owner.locator(toggleSelector+':visible').first();
            const opener=await toggle.elementHandle();const panel=owner.locator(panelSelector).first();
            for(const exit of ['Escape','Cancel']){
                await page.evaluate(()=>window.__focusCalls=[]);
                await toggle.focus();await page.keyboard.press('Enter');await expect(panel).toBeVisible();await audit.settle(root);
                await panel.locator(fieldSelector).focus();
                if(exit==='Escape')await page.keyboard.press('Escape');else await panel.locator(cancelSelector).click();
                await expect(panel).toBeHidden();await audit.settle(root);
                report.rows.push({name,exit,
                    active:await page.evaluate(()=>document.activeElement.outerHTML.slice(0,1000)),
                    calls:await page.evaluate(()=>window.__focusCalls),
                    original:await opener.evaluate(n=>({connected:n.isConnected,focused:n===document.activeElement,html:n.outerHTML.slice(0,600)})),
                    current:await toggle.evaluate(n=>({focused:n===document.activeElement,html:n.outerHTML.slice(0,600)}))});save();
                await page.screenshot({path:info.outputPath(name+'-'+exit+'.png')});
            }
        }
        expect(report.errors).toEqual([]);expect(report.writesBlocked).toEqual([]);
        expect(report.rows.every(r=>r.current.focused)).toBe(true);
    }finally{save();}
});
