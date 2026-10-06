const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised cascade proof. The native GET root and real Moodle styles
// are used, but report specimens are transient DOM, NOT an actual import run.
// Never POST, Save, upload, export or roll back to manufacture evidence.
test('Mass report palette follows independent roles in the served Moodle cascade', async({page}, info) => {
    test.setTimeout(180000);
    const records = [], blocked = [], errors = [];
    const write = () => fs.writeFileSync(info.outputPath('mass-report-palette.json'), JSON.stringify({records,blocked,errors},null,2));
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL || 'http://localhost/local/groupimport/index.php?id=5',
        {waitUntil:'domcontentloaded',timeout:60000});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u=>!u.pathname.includes('/login/'),{timeout:60000});
        await page.goto('http://localhost/local/groupimport/index.php?id=5',{waitUntil:'domcontentloaded'});
    }
    // Login is the sole allowed POST. Remaining native templates are GETs or
    // read-only core AJAX; deny every product command and unknown core method.
    await page.route('**/local/groupimport/**', route=>{
        if(route.request().method()==='GET')return route.continue();
        blocked.push({scope:'plugin',method:route.request().method()});return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route=>{
        if(route.request().method()!=='POST')return route.continue();
        let methods=[];try{methods=route.request().postDataJSON().map(c=>c.methodname);}catch(_){}
        // Moodle's global message drawer polls the current unsent draft even
        // on Mass Import. As in the existing dialog palette protocol, return
        // an empty read result without reading/persisting a real private draft.
        if(methods.length&&methods.every(m=>m==='core_message_get_unsent_message')){
            return route.fulfill({status:200,contentType:'application/json',
                body:JSON.stringify(methods.map(()=>({error:false,data:{}})))});
        }
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(methods.length&&methods.every(m=>reads.has(m)))return route.continue();
        blocked.push({scope:'core',methods});return route.abort('blockedbyclient');
    });
    const root=page.locator('#local-groupimport-import');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    await expect(root).toHaveAttribute('data-easyedu-report-palette',await root.getAttribute('data-easyedu-custom-rails'));
    const original=await root.getAttribute('style'),flag=await root.getAttribute('data-easyedu-report-palette');
    const markup=`<section id="sm64-cascade-probe" aria-label="Temporary report audit">
      <div class="local-groupimport-import-summary">
        <span id="sm64-summary" class="local-groupimport-import-summary__item local-groupimport-import-summary__item--success easyedu-report-summary--success"><strong>12</strong> rows ready to review</span>
        <span id="sm64-danger" class="local-groupimport-import-summary__item local-groupimport-import-summary__item--error"><strong>2</strong> rows need attention</span>
      </div>
      <h4 id="sm64-heading" class="local-groupimport-import-report__title local-groupimport-import-report__title--success easyedu-report-title--success">Successful additions</h4>
      <ul class="local-groupimport-import-report local-groupimport-import-report--success easyedu-report-list--success"><li id="sm64-row"><span id="sm64-glyph" class="fa fa-check" aria-hidden="true"></span><span>Existing membership, kept unchanged.</span></li></ul>
      <ul class="local-groupimport-import-report local-groupimport-import-report--error"><li><span id="sm64-danger-glyph" class="fa fa-exclamation-triangle" aria-hidden="true"></span><span>Unknown identifier.</span></li></ul>
      <button id="sm64-entry" type="button">Keyboard entry</button>
      <a id="sm64-export" href="#" class="btn btn-outline-primary easyedu-action-with-icon local-groupimport-import__export-results easyedu-button--outline-primary"><span class="fa fa-file-excel" aria-hidden="true"></span><span>Export annotated Excel report</span></a>
    </section>`;
    const palettes=[
        {name:'official',flags:'',primary:'#0f6cbf',chosen:'#0f6cbf',accent:'#1b7f5a',accentChosen:'#1b7f5a'},
        {name:'primary-only',flags:'primary',primary:'#7b3f98',chosen:'#7b3f98',accent:'#1b7f5a',accentChosen:'#1b7f5a'},
        {name:'accent-only',flags:'success',primary:'#0f6cbf',chosen:'#0f6cbf',accent:'#984b27',accentChosen:'#984b27'},
        {name:'both-light-chosen',flags:'primary success',primary:'#765300',chosen:'#ffae00',accent:'#735716',accentChosen:'#e0ac34'},
        {name:'restored',flags:'',primary:'#0f6cbf',chosen:'#0f6cbf',accent:'#1b7f5a',accentChosen:'#1b7f5a'},
    ];
    const settle=async()=>page.evaluate(async()=>{
        await document.fonts.ready;
        await Promise.all(document.querySelector('#sm64-cascade-probe').getAnimations({subtree:true})
            .filter(a=>Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    });
    const read=()=>page.evaluate(()=>{
        const host=document.getElementById('sm64-cascade-probe');
        const resolve=(property,value)=>{const n=document.createElement('i');host.append(n);n.style[property]=value;
            const out=getComputedStyle(n)[property];n.remove();return out;};
        const ids=['summary','danger','heading','row','glyph','danger-glyph','export'];
        return {tokens:{accent:resolve('color','var(--easyedu-accent)'),soft:resolve('backgroundColor','var(--easyedu-accent-soft)'),
            border:resolve('color','color-mix(in srgb,var(--easyedu-accent-chosen) 24%,#fff 76%)'),
            primary:resolve('color','var(--easyedu-primary)'),strong:resolve('color','var(--easyedu-primary-strong)'),
            primarySoft:resolve('backgroundColor','var(--easyedu-primary-soft)'),muted:resolve('color','var(--easyedu-text-muted)')},
        items:Object.fromEntries(ids.map(id=>{const n=document.getElementById(`sm64-${id}`),s=getComputedStyle(n),b=n.getBoundingClientRect();
            return [id,{paint:[s.backgroundColor,s.borderColor,s.color,s.boxShadow,s.opacity],
                metrics:[b.width,b.height,s.padding,s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight,s.borderWidth,s.borderRadius,s.columnGap,s.transition,s.animation]}];})),
        gap:(()=>{const n=document.getElementById('sm64-export');return n.children[1].getBoundingClientRect().left-n.children[0].getBoundingClientRect().right;})()};
    });
    try {
        await root.evaluate((n,markup)=>n.insertAdjacentHTML('beforeend',markup),markup);
        for(const width of [1600,768,390]) {
            await page.setViewportSize({width,height:1000}); let base;
            for(const p of palettes) {
                await root.evaluate((n,{original,p})=>{
                    n.style.cssText=original||'';n.style.setProperty('--easyedu-primary',p.primary);
                    n.style.setProperty('--easyedu-primary-chosen',p.chosen);
                    n.style.setProperty('--easyedu-primary-soft',`color-mix(in srgb,${p.chosen} 10%,#fff 90%)`);
                    n.style.setProperty('--easyedu-primary-strong',`color-mix(in srgb,${p.primary} 82%,#000 18%)`);
                    n.style.setProperty('--easyedu-accent',p.accent);n.style.setProperty('--easyedu-accent-chosen',p.accentChosen);
                    n.style.setProperty('--easyedu-accent-soft',`color-mix(in srgb,${p.accentChosen} 9%,#fff 91%)`);
                    n.setAttribute('data-easyedu-report-palette',p.flags);
                },{original,p});
                await page.locator('#sm64-export').evaluate(n=>{n.removeAttribute('aria-disabled');n.blur();});
                await page.mouse.move(width-1,999);await settle();const state=await read();base??=state;
                records.push({width,palette:p.name,state});write();
                for(const id of Object.keys(state.items))expect(state.items[id].metrics,`${id}: fixed geometry/type/Motion`).toEqual(base.items[id].metrics);
                for(const id of ['danger','row','danger-glyph'])expect(state.items[id].paint).toEqual(base.items[id].paint);
                if(p.flags.includes('success')){
                    expect(state.items.summary.paint.slice(0,3)).toEqual([state.tokens.soft,state.tokens.border,state.tokens.accent]);
                    expect(state.items.heading.paint[2]).toBe(state.tokens.accent);
                    expect([state.items.glyph.paint[0],state.items.glyph.paint[2]]).toEqual([state.tokens.soft,state.tokens.accent]);
                }else for(const id of ['summary','heading','glyph'])expect(state.items[id].paint).toEqual(base.items[id].paint);
                if(p.flags.includes('primary'))expect(state.items.export.paint[2]).toBe(state.tokens.primary);
                else expect(state.items.export.paint).toEqual(base.items.export.paint);
                expect(state.gap).toBeCloseTo(10.4,1);
                await page.locator('#sm64-export').hover();await settle();const hover=await read();
                expect(hover.items.export.paint[0]).toBe(hover.tokens.primarySoft);expect(hover.items.export.paint[2]).toBe(hover.tokens.strong);
                await page.locator('#sm64-entry').click();await page.keyboard.press('Tab');await settle();
                expect(await page.locator('#sm64-export').evaluate(n=>n.matches(':focus-visible'))).toBe(true);
                expect((await read()).items.export.paint[3]).not.toBe('none');
                await page.locator('#sm64-export').evaluate(n=>n.setAttribute('aria-disabled','true'));await settle();const disabled=await read();
                expect(disabled.items.export.paint[2]).toBe(disabled.tokens.muted);expect(disabled.items.export.paint[4]).toBe('0.62');
            }
        }
        expect(blocked).toEqual([]);expect(errors).toEqual([]);
    } finally {
        await root.evaluate((n,{original,flag})=>{document.getElementById('sm64-cascade-probe')?.remove();
            if(original===null)n.removeAttribute('style');else n.setAttribute('style',original);
            if(flag===null)n.removeAttribute('data-easyedu-report-palette');else n.setAttribute('data-easyedu-report-palette',flag);
        },{original,flag}).catch(()=>{});write();
    }
});
