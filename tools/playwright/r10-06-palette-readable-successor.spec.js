'use strict';
const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const audit=require('./roadmap-audit-helper.cjs');
test('R10-06 native readable picker palette and restoration FR1280',async({page},info)=>{
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
            row.repositoryLinks=await portal.locator('.fp-repo-area a:visible,.fp-repo-area .fp-repo-name:visible').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).color));
            const contrast=nodes=>{
                const canvas=document.createElement('canvas'),c=canvas.getContext('2d');
                const rgb=value=>{c.clearRect(0,0,1,1);c.fillStyle=value;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data];};
                const lum=rgba=>rgba.slice(0,3).map(v=>v/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)).reduce((a,v,i)=>a+v*[0.2126,0.7152,0.0722][i],0);
                return nodes.map(n=>{
                    const foreground=getComputedStyle(n).color;let background='rgb(255,255,255)';
                    for(let p=n;p;p=p.parentElement){const value=getComputedStyle(p).backgroundColor;if(rgb(value)[3]===255){background=value;break;}}
                    const a=lum(rgb(foreground)),b=lum(rgb(background));return {text:n.textContent,foreground,background,ratio:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)};
                });
            };
            row.repositoryContrast=await portal.locator('.fp-repo-name:visible').evaluateAll(contrast);
            row.primaryButtons=await portal.locator('.btn-primary:visible').evaluateAll(nodes=>nodes.map(n=>{
                const s=getComputedStyle(n);return {text:n.textContent,color:s.color,background:s.backgroundColor,border:s.borderColor};}));
            await page.screenshot({path:info.outputPath('picker-'+mode+'.png')});save();
            if(mode==='custom') {
                expect(row.chooser.color).toBe('rgb(123, 63, 152)');
                await expect(portal).toHaveClass(/local-groupimport-import-picker/);
                expect(row.header.background).not.toBe(report.cases[0].header.background);
                expect(row.primaryButtons.length).toBeGreaterThan(0);
                expect(row.repositoryLinks.length).toBeGreaterThan(0);
                expect(row.repositoryLinks.every(color=>color==='rgb(123, 63, 152)')).toBe(true);
                expect(row.repositoryContrast.every(v=>v.ratio>=4.5)).toBe(true);
                const peer=portal.locator('.fp-repo:not(.active):visible').first();await peer.hover();
                row.hoverContrast=await portal.locator('.fp-repo-name:visible').evaluateAll(contrast);
                expect(row.hoverContrast.every(v=>v.ratio>=4.5)).toBe(true);await page.mouse.move(0,0);
                expect(row.primaryButtons.every(b=>b.background==='rgb(123, 63, 152)')).toBe(true);
            }
            await page.keyboard.press('Escape');await expect(portal).toBeHidden();
            await expect.poll(()=>portalNode.evaluate(n=>n.classList.contains('local-groupimport-import-picker'))).toBe(false);
            row.cleaned=true;save();
        }
        expect(report.cases[2].chooser.color).toBe(report.cases[0].chooser.color);
        expect(report.cases[2].header).toEqual(report.cases[0].header);
        expect(report.errors).toEqual([]);expect(report.writesBlocked).toEqual([]);
    }finally{save();}
});
