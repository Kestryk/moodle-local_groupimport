'use strict';
const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const audit=require('./roadmap-audit-helper.cjs');
test('R10-06 Mass Import native palette and picker portal diagnostic FR1280',async({page},info)=>{
    test.setTimeout(180000);page.setDefaultTimeout(60000);
    const report={cases:[],errors:[],writesBlocked:[],identity:audit.identity(),configSaved:false};
    const save=()=>fs.writeFileSync(info.outputPath('palette.json'),JSON.stringify(report,null,2));
    const palette=JSON.parse(fs.readFileSync(process.env.EASYEDU_PALETTE_VALUES,'utf8'));
    const paint=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {color:s.color,background:s.backgroundColor,
        border:s.borderColor,width:r.width,height:r.height};};
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.setViewportSize({width:1280,height:900});await audit.login(page);
    await audit.blockBusinessWrites(page,report.writesBlocked);
    const root=page.locator('#local-groupimport-import');
    await expect(root).toHaveAttribute('data-easyedu-loading-ready','1',{timeout:60000});await audit.settle(root);
    const chooser=root.getByRole('button',{name:/Choisir un fichier|Choose a file/}).first();
    try{
        for(const mode of ['official','custom']){
            if(mode==='custom')await root.evaluate((n,p)=>{n.setAttribute('style',p.style);
                for(const name of ['rails','dialog-palette','report-palette'])n.setAttribute('data-easyedu-'+(name==='rails'?'custom-rails':name),p.flags);},palette);
            const row={mode,chooser:await chooser.evaluate(paint)};report.cases.push(row);save();
            await chooser.click();
            const portal=page.locator('.moodle-dialogue:visible,[role="dialog"]:visible').filter({has:page.locator('.file-picker')}).first();
            await expect(portal).toBeVisible();await audit.settle(portal);
            row.portal=await portal.evaluate(paint);
            const header=portal.locator('.moodle-dialogue-hd,.modal-header').first();
            row.header=await header.evaluate(paint);
            row.primaryButtons=await portal.locator('.btn-primary:visible').evaluateAll(nodes=>nodes.map(n=>{
                const s=getComputedStyle(n);return {text:n.textContent,color:s.color,background:s.backgroundColor,border:s.borderColor};}));
            await page.screenshot({path:info.outputPath('picker-'+mode+'.png')});save();
            await page.keyboard.press('Escape');await expect(portal).toBeHidden();
        }
        expect(report.errors).toEqual([]);expect(report.writesBlocked).toEqual([]);
    }finally{save();}
});
