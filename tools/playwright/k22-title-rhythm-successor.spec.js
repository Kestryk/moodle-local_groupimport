'use strict';
const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const audit=require('./roadmap-audit-helper.cjs');
test('K22 centred title first lines and T025 T026 final rhythm FR',async({page},info)=>{
    test.setTimeout(180000);page.setDefaultTimeout(60000);
    const report={cases:[],errors:[],writesBlocked:[],identity:audit.identity(),candidateCss:process.env.EASYEDU_CANDIDATE_CSS};
    const save=()=>fs.writeFileSync(info.outputPath('density-grid.json'),JSON.stringify(report,null,2));
    page.on('pageerror',e=>report.errors.push(e.message));await audit.login(page);
    await audit.blockBusinessWrites(page,report.writesBlocked);
    try{
        for(const width of [1600,1280,390]){
            await page.setViewportSize({width,height:900});const url=audit.perfUrl();url.pathname='/local/groupimport/index.php';
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            const root=page.locator('#local-groupimport-import');
            await expect(root).toHaveAttribute('data-easyedu-loading-ready','1');
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready');
            await audit.settle(root);
            const titleGeometry=()=>root.evaluate(n=>{
                const pairs=[['identification','.easyedu-information--deposit-aligned .easyedu-information__title','.easyedu-information--deposit-aligned .easyedu-icon-tile'],
                    ['deposit','.easyedu-file-deposit__title','.easyedu-file-deposit__icon']];
                return pairs.map(([kind,titleSelector,iconSelector])=>{
                    const title=n.querySelector(titleSelector),icon=n.querySelector(iconSelector),t=title.getBoundingClientRect(),i=icon.getBoundingClientRect(),s=getComputedStyle(title);
                    const firstLineCentre=t.top+parseFloat(s.lineHeight)/2;
                    return {kind,text:title.textContent,delta:firstLineCentre-(i.top+i.height/2),iconSize:i.height,
                        lineHeight:parseFloat(s.lineHeight),height:t.height,inset:t.left-i.left,font:s.font,fontSize:s.fontSize,marginTop:s.marginTop};
                });
            });
            const before=await titleGeometry();
            await page.addStyleTag({path:process.env.EASYEDU_CANDIDATE_CSS});
            await audit.settle(root);const after=await titleGeometry();
            after.forEach((v,i)=>{expect(Math.abs(v.delta)).toBeLessThanOrEqual(1);expect(v.iconSize).toBe(28);
                expect(v.inset).toBe(40);expect(v.font).toBe(before[i].font);});
            await root.locator('.easyedu-file-deposit--moodle').scrollIntoViewIfNeeded();
            const chooser=root.getByRole('button',{name:/Choisir un fichier|Choose a file/}).first();
            await expect(chooser).toBeVisible({timeout:60000});await audit.settle(root);const choose=await chooser.elementHandle();
            const row=await root.evaluate((n,{width,choose})=>{
                const r=x=>x.getBoundingClientRect();const title=n.querySelector('.easyedu-file-deposit__title');
                const support=n.querySelector('.easyedu-file-deposit__support'),formats=n.querySelector('.easyedu-file-deposit__requirements');
                const columns=[...getComputedStyle(n.querySelector('.local-groupimport-import__grid')).gridTemplateColumns.matchAll(/[\d.]+(?=px)/g)].map(m=>Number(m[0]));
                return {width,gaps:[r(support).top-r(title).bottom,r(choose).top-r(support).bottom,r(formats).top-r(choose).bottom],
                    depositHeight:r(n.querySelector('.easyedu-file-deposit--moodle')).height,columns,
                    ratio:columns.length===2?columns[0]/columns[1]:null,overflow:n.scrollWidth-n.clientWidth,
                    textAligned:Math.abs(r(title).left-r(support).left)<1};
            },{width,choose});row.titles={before,after};report.cases.push(row);save();
            await page.screenshot({path:info.outputPath('density-'+width+'.png')});
            row.gaps.forEach((v,i)=>expect(Math.abs(v-[4,12,8][i])).toBeLessThanOrEqual(1));
            expect(row.overflow).toBeLessThanOrEqual(1);expect(row.textAligned).toBe(true);
            if(width===390){
                expect(row.columns).toHaveLength(1);
                const titles=root.locator('.easyedu-information--deposit-aligned .easyedu-information__title,.easyedu-file-deposit__title');
                const originals=await titles.allTextContents();
                try{
                    await titles.evaluateAll(nodes=>nodes.forEach(n=>n.textContent+=' ? intitul? long pour v?rifier le retour ? la ligne'));await audit.settle(root);
                    row.longTitles=await titleGeometry();save();
                    row.longTitles.forEach(v=>{expect(Math.abs(v.delta)).toBeLessThanOrEqual(1);expect(v.height).toBeGreaterThan(v.lineHeight*1.9);expect(v.inset).toBe(40);});
                    await page.screenshot({path:info.outputPath('k22-long-390.png')});
                }finally{await titles.evaluateAll((nodes,labels)=>nodes.forEach((n,i)=>n.textContent=labels[i]),originals);}
            }
            else {expect(Math.abs(row.ratio-1.12/0.88)).toBeLessThanOrEqual(0.003);expect(row.depositHeight).toBeLessThanOrEqual(170);}
        }
        expect(report.errors).toEqual([]);expect(report.writesBlocked).toEqual([]);
    }finally{save();}
});
