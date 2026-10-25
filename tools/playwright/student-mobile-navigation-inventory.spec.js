// SM-47 local-supervised, course-5 compact drawer inventory. No destinations followed.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Student compact navigation inventories native section order',async({page},testInfo)=>{
    test.setTimeout(180000);const records=[],errors=[],blocked=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=new URL('/local/groupimport/manage.php?id=5',process.env.EASYEDU_MOODLE_URL).toString();
    try{
        for(const width of [768,390]){
            await page.setViewportSize({width,height:1100});await page.goto(url);
            if(page.url().includes('/login/')){
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));await page.goto(url);
            }
            await page.route('**/local/groupimport/**',async r=>{
                if(r.request().method()==='GET')await r.continue();
                else{blocked.push(r.request().method());await r.abort('blockedbyclient');}
            });
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            const opener=page.locator('[data-easyedu-navigation-open]:visible').first();await opener.click();
            const panel=page.locator('[data-easyedu-navigation-panel]');await expect(panel).toHaveAttribute('aria-hidden','false');
            await expect.poll(()=>panel.evaluate(n=>getComputedStyle(n).opacity)).toBe('1');
            await expect.poll(()=>panel.locator('[data-easyedu-navigation-participant-item]').count()).toBeGreaterThan(0);
            const inventory=await panel.evaluate(n=>{
                const box=n.getBoundingClientRect(),style=getComputedStyle(n);
                const measure=s=>{const r=s.getBoundingClientRect(),c=getComputedStyle(s);return {x:r.x-box.x,y:r.y-box.y,w:r.width,h:r.height,
                    font:c.fontSize,weight:c.fontWeight,padding:c.padding,bg:c.backgroundColor};};
                const entry=s=>({kind:s.tagName==='P'?'group':'link',label:s.textContent.trim(),geometry:measure(s),
                    pathname:s.tagName==='A'?new URL(s.href).pathname:null});
                const menu=document.querySelector('[data-easystud-participant-navigation] .dropdown-menu');
                const native=[...menu.querySelectorAll('.dropdown-header,.dropdown-item[data-value]')];
                const copy=[...n.querySelector('[data-easyedu-navigation-participant-links]').children];
                const equal=native.length===copy.length&&native.every((s,i)=>s.textContent.trim()===copy[i].textContent.trim()&&
                    (s.classList.contains('dropdown-header')||new URL(s.dataset.value,location.href).href===copy[i].href));
                const scroll=n.querySelector('[data-easyedu-navigation-panel-scroll]');
                return {equal,w:box.width,h:box.height,bg:style.backgroundColor,
                    title:n.querySelector('.easyedu-navigation__panel-title').textContent.trim(),
                    guide:[...n.querySelectorAll('.easyedu-guide__launcher-label')].map(s=>({label:s.textContent.trim(),geometry:measure(s)})),
                    sections:[...n.querySelectorAll('[data-easyedu-navigation-section]')].map(s=>({id:s.dataset.easyeduNavigationSection,
                        title:s.querySelector('.easyedu-navigation__section-title').textContent.trim(),geometry:measure(s),
                        entries:s.dataset.easyeduNavigationSection==='course-participants'?copy.map(entry):
                            [...s.querySelectorAll('.easyedu-navigation__item')].map(entry)})),
                    scroll:{client:scroll.clientHeight,total:scroll.scrollHeight},overflow:n.scrollWidth-n.clientWidth};
            });
            records.push({width,inventory});expect(inventory.equal).toBe(true);expect(inventory.overflow).toBe(0);
            expect(inventory.sections.map(s=>s.id)).toEqual(['easystud-tools','course-participants']);
            expect(inventory.guide).toHaveLength(1);expect(inventory.sections[0].entries).toHaveLength(3);
            await page.screenshot({path:testInfo.outputPath(`navigation-inventory-${width}.png`)});
            await panel.locator('[data-easyedu-navigation-panel-scroll]').evaluate(n=>n.scrollTop=n.scrollHeight);
            await page.screenshot({path:testInfo.outputPath(`navigation-inventory-bottom-${width}.png`)});
            await panel.locator('[data-easyedu-navigation-close]').click();await expect(opener).toBeFocused();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{fs.writeFileSync(testInfo.outputPath('student-mobile-navigation-inventory.json'),JSON.stringify({records,errors,blocked},null,2));}
});
