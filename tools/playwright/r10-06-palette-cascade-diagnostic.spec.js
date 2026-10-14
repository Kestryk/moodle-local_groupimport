'use strict';
const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const audit=require('./roadmap-audit-helper.cjs');
test('R10-06 native picker palette cascade diagnostic FR1280',async({page},info)=>{
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
    await expect(root).toHaveAttribute('data-local-groupimport-picker-palette-bound','1');
    await page.addStyleTag({path:process.env.EASYEDU_CANDIDATE_CSS});
    const original=await root.evaluate(n=>({style:n.getAttribute('style'),flags:n.getAttribute('data-easyedu-dialog-palette')}));
    const chooser=root.getByRole('button',{name:/Choisir un fichier|Choose a file/}).first();
    try{
        for(const mode of ['official','custom','restored']){
            if(mode==='custom')await root.evaluate((n,p)=>{n.setAttribute('style',p.style);
                for(const name of ['rails','dialog-palette','report-palette'])n.setAttribute('data-easyedu-'+(name==='rails'?'custom-rails':name),p.flags);},palette);
            if(mode==='restored')await root.evaluate((n,p)=>{n.setAttribute('style',p.style||'');
                for(const name of ['custom-rails','dialog-palette','report-palette'])n.setAttribute('data-easyedu-'+name,p.flags||'');},original);
            await page.mouse.move(0,0);await chooser.evaluate(n=>n.blur());await audit.settle(root);
            const row={mode,chooser:await chooser.evaluate(paint)};report.cases.push(row);save();
            await chooser.click();
            const portal=page.locator('.moodle-dialogue:visible,[role="dialog"]:visible').filter({has:page.locator('.file-picker')}).first();
            await expect(portal).toBeVisible();await audit.settle(portal);
            const portalNode=await portal.elementHandle();
            const upload=portal.locator('.fp-repo').filter({hasText:/D.poser un fichier|Upload a file/}).first();
            if(await upload.count()) {await upload.click();await expect(portal.locator('.fp-upload-btn:visible')).toBeVisible();await audit.settle(portal);}
            row.portal=await portal.evaluate(paint);
            const header=portal.locator('.moodle-dialogue-hd,.modal-header').first();
            row.header=await header.evaluate(paint);
            row.primaryButtons=await portal.locator('.btn-primary:visible').evaluateAll(nodes=>nodes.map(n=>{
                const s=getComputedStyle(n);return {text:n.textContent,color:s.color,background:s.backgroundColor,border:s.borderColor};}));
            await page.screenshot({path:info.outputPath('picker-'+mode+'.png')});save();
            row.paletteAttrs=await portal.evaluate(n=>({flag:n.getAttribute('data-easyedu-dialog-palette'),
                primary:getComputedStyle(n).getPropertyValue('--easyedu-primary'),
                soft:getComputedStyle(n).getPropertyValue('--easyedu-primary-soft')}));
            row.headerRules=await header.evaluate(n=>{
                const matches=[];
                const walk=rules=>{for(const r of rules){if(r.selectorText){try{
                    if(n.matches(r.selectorText)&&(r.style.background||r.style.backgroundColor||r.style.color))
                        matches.push({selector:r.selectorText,css:r.style.cssText});
                }catch{}}if(r.cssRules)walk(r.cssRules);}};
                for(const sheet of document.styleSheets){try{walk(sheet.cssRules);}catch{}}
                return matches;
            });save();
            await page.keyboard.press('Escape');await expect(portal).toBeHidden();
            await expect.poll(()=>portalNode.evaluate(n=>n.classList.contains('local-groupimport-import-picker'))).toBe(false);
            row.cleaned=true;save();
        }

        expect(report.errors).toEqual([]);expect(report.writesBlocked).toEqual([]);
    }finally{save();}
});
