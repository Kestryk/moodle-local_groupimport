'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const audit=require('./roadmap-audit-helper.cjs');
test('Mass Import visible picker spacing grid palette successor FR',async({page},info)=>{
    test.setTimeout(180000);page.setDefaultTimeout(60000);
    const report={cases:[],errors:[],writesBlocked:[],identity:audit.identity()};
    const save=()=>fs.writeFileSync(info.outputPath('mass-import-baseline.json'),JSON.stringify(report,null,2));
    page.on('pageerror',e=>report.errors.push(e.message));
    await audit.login(page);await audit.blockBusinessWrites(page,report.writesBlocked);
    try{
        for(const width of [1600,1280,390]){
            await page.setViewportSize({width,height:900});
            const url=audit.perfUrl();url.pathname='/local/groupimport/index.php';
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            const root=page.locator('#local-groupimport-import');
            await expect(root).toHaveAttribute('data-easyedu-loading-ready','1',{timeout:60000});
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await audit.settle(root);
            await root.locator('.easyedu-file-deposit--moodle').scrollIntoViewIfNeeded();
            const chooseNode=await root.getByRole('button',{name:/Choisir un fichier|Choose a file/}).first().elementHandle();
            report.cases.push(await root.evaluate((n,{width,choose})=>{
                const rect=x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
                const title=n.querySelector('.easyedu-file-deposit__title'),support=n.querySelector('.easyedu-file-deposit__support');
                const formats=n.querySelector('.easyedu-file-deposit__requirements');
                const deposit=n.querySelector('.easyedu-file-deposit--moodle');
                const grid=n.querySelector('.local-groupimport-import__grid');
                return {width,title:rect(title),support:rect(support),choose:rect(choose),formats:rect(formats),deposit:rect(deposit),
                    gaps:{titleSupport:support.getBoundingClientRect().top-title.getBoundingClientRect().bottom,
                        supportButton:choose.getBoundingClientRect().top-support.getBoundingClientRect().bottom,
                        buttonFormats:formats.getBoundingClientRect().top-choose.getBoundingClientRect().bottom},
                    margins:{support:getComputedStyle(support).margin,formats:getComputedStyle(formats).margin},
                    grid:getComputedStyle(grid).gridTemplateColumns,rootOverflow:n.scrollWidth-n.clientWidth,
                    chooserIdentity:{tag:choose.tagName,id:choose.id,class:choose.className},
                    chooserPaint:{color:getComputedStyle(choose).color,background:getComputedStyle(choose).backgroundColor,border:getComputedStyle(choose).borderColor},
                    paints:[...n.querySelectorAll('.easyedu-icon-tile,.fp-btn-choose,.easyedu-form-actions button,.easyedu-status')]
                        .map(x=>({class:x.className,color:getComputedStyle(x).color,background:getComputedStyle(x).backgroundColor,border:getComputedStyle(x).borderColor}))};
            },{width,choose:chooseNode}));save();
            await page.screenshot({path:info.outputPath(`mass-${width}.png`)});
        }
        expect(report.errors).toEqual([]);expect(report.writesBlocked).toEqual([]);
    }finally{save();}
});
