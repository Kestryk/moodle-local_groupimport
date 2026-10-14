const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const setMode=mode=>execFileSync(process.env.EASYEDU_PHP_EXECUTABLE,['-r',
    "define('CLI_SCRIPT',true); require $argv[1].'/config.php'; set_config('renderingmode',$argv[2],'local_groupimport'); echo get_config('local_groupimport','renderingmode');",
    process.env.EASYEDU_MOODLE_ROOT,mode],{encoding:'utf8',timeout:30000}).trim();
const settle=locator=>locator.evaluate(async node=>{
    await document.fonts.ready;
    await Promise.all(node.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations))
        .map(a=>a.finished.catch(()=>{})));
});
const paint=locator=>locator.evaluate(node=>{
    const s=getComputedStyle(node),b=node.getBoundingClientRect();
    return {height:b.height,width:b.width,background:s.backgroundColor,border:s.borderColor,borderWidth:s.borderWidth,
        shadow:s.boxShadow,outline:s.outlineStyle,outlineWidth:s.outlineWidth,radius:s.borderRadius,text:node.textContent.trim()};
});
const alpha=color=>color==='transparent'?0:Number(color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)?.[1]??1);

test('F7 R10 count visibility successor FR remaining cells',async({page},info)=>{
    test.setTimeout(360000);page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);
    await page.emulateMedia({reducedMotion:'no-preference'});
    const url=new URL(process.env.EASYEDU_MOODLE_URL);
    if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal localhost course5 required');
    url.searchParams.set('lang','fr');
    const rows=[],errors=[],writes=[];
    const save=()=>fs.writeFileSync(info.outputPath('f7-r10-integration.json'),JSON.stringify({rows,errors,writes},null,2));
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/local/groupimport/ajax.php*',route=>{writes.push(route.request().postData());return route.abort('blockedbyclient');});
    await page.route('**/lib/ajax/service.php*',route=>{
        const calls=route.request().postDataJSON()||[];
        const mutations=calls.filter(c=>/^local_groupimport_sm_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname));
        if(mutations.length){writes.push(mutations.map(c=>c.methodname));return route.abort('blockedbyclient');}
        return route.continue();
    });
    const assertMenu=async(trigger,mobile,row,label)=>{
        await trigger.scrollIntoViewIfNeeded();await trigger.click();
        const menu=mobile?page.locator('[data-easystud-context-menu].is-mobile-sheet'):
            trigger.locator('..').locator('[data-easystud-group-actions-menu]');
        await expect(menu).toBeVisible();await settle(menu);
        const geometry=await menu.evaluate(n=>{
            const b=n.getBoundingClientRect();return {left:b.left,right:b.right,bottom:b.bottom,width:innerWidth,
                commands:[...n.querySelectorAll('button:not([hidden])')].filter(e=>e.getClientRects().length).length};
        });row.menus.push({label,...geometry});save();
        expect(geometry.commands).toBeGreaterThan(0);expect(geometry.left).toBeGreaterThanOrEqual(-1);
        expect(geometry.right).toBeLessThanOrEqual(geometry.width+1);
        if(mobile){await menu.locator('[data-easystud-context-close]').click();await expect(menu).toBeHidden();}
        else{await trigger.click();await expect(menu).toBeHidden();}
    };
    try{
        expect(setMode('legacy')).toBe('legacy');
        await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
        if(await page.locator('#username').count()){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter:true});
            await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        }
        for(const mode of ['legacy','reactive']){
            expect(setMode(mode)).toBe(mode);
            for(const width of (mode==='legacy'?[390]:[1280,390])){
                const row={mode,width,stage:'loading',menus:[],views:[]};rows.push(row);save();
                await page.setViewportSize({width,height:1000});await page.goto(url.href,{waitUntil:'domcontentloaded'});
                const root=page.locator('#local-groupimport-easystud');
                await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);
                await expect(page.locator('html')).toHaveAttribute('lang',/^fr(?:-|$)/);
                const switchView=async value=>{
                    const key=width===390?'mobile-view':'layout-mode';
                    const control=root.locator('[data-easystud-'+key+'="'+value+'"]:visible').first();
                    await control.click();await expect(control).toHaveAttribute('aria-pressed','true');await settle(root);
                    await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);
                    row.views.push(value);save();
                };
                if(width===1280){
                    await switchView('participants');await switchView('structure');
                    const overflow=root.locator('[data-easystud-group-actions-toggle]:visible');
                    row.desktopOverflowCount=await overflow.count();save();
                    if(row.desktopOverflowCount)await assertMenu(overflow.first(),false,row,'desktop-overflow');
                    await switchView('participants');
                }else{
                    for(const view of ['groups','groupings','participants']){
                        await switchView(view);
                        const cardSelector=view==='groups'?'[data-easystud-mobile-entity-region="groups"] [data-easystud-group-id]:visible':
                            view==='groupings'?'[data-easystud-grouping-id]:visible':'[data-easystud-user]:visible';
                        const card=root.locator(cardSelector).first();await expect(card).toBeVisible();
                        await assertMenu(card.locator('[data-easystud-card-menu]:visible').first(),true,row,view);
                    }
                }
                row.memberHeights=await root.evaluate(n=>[...n.querySelectorAll('[data-easystud-group-id]')]
                    .filter(g=>g.getClientRects().length).flatMap(g=>[...g.querySelectorAll('[data-easystud-group-members]')]
                        .map(list=>({group:g.dataset.easystudGroupId,
                            collapsed:list.style.getPropertyValue('--local-groupimport-members-collapsed-height'),
                            expanded:list.style.getPropertyValue('--local-groupimport-members-expanded-height')}))));save();
                for(const heights of row.memberHeights){
                    if(heights.collapsed){expect(parseFloat(heights.collapsed)).toBeGreaterThan(0);
                        expect(parseFloat(heights.expanded)).toBeGreaterThanOrEqual(parseFloat(heights.collapsed));}
                }
                const participantList=root.locator('[data-easystud-participant-list]');
                const pagination=participantList.locator(':scope > [data-easystud-pagination="top"]');
                await expect(pagination).toBeVisible();await pagination.scrollIntoViewIfNeeded();
                const select=pagination.locator('[data-easystud-select-results]'),count=pagination.locator('[data-easystud-list-count]');
                row.count={select:await paint(select),count:await paint(count)};save();
                if(width===390){await expect(count).toBeHidden();row.count.hiddenAt390=true;save();}
                else{await expect(count).toBeVisible();expect(Math.abs(row.count.select.height-row.count.count.height)).toBeLessThanOrEqual(1);}
                expect(await count.getAttribute('role')).not.toBe('button');
                const label=pagination.locator('[data-easystud-page-label]'),next=pagination.locator('[data-easystud-page-next]');
                // Course5 has two participant pages; the First shortcut is correctly hidden there.
                const previous=pagination.locator('[data-easystud-page-prev]');
                await expect(next).toBeEnabled();const initial=await label.textContent();
                await page.mouse.move(0,0);await settle(next);row.arrowRest=await paint(next);save();
                expect(alpha(row.arrowRest.background)).toBe(0);expect(alpha(row.arrowRest.border)).toBe(0);
                const expectedSize=await next.evaluate(n=>parseFloat(getComputedStyle(document.documentElement).fontSize)*1.62);
                expect(Math.abs(row.arrowRest.width-expectedSize)).toBeLessThanOrEqual(1);
                expect(Math.abs(row.arrowRest.height-expectedSize)).toBeLessThanOrEqual(1);
                await next.hover();await settle(next);row.arrowHover=await paint(next);save();expect(alpha(row.arrowHover.background)).toBeGreaterThan(0);
                await next.click();await expect(label).not.toHaveText(initial);await settle(root);
                row.pagination={initial,second:await label.textContent()};save();
                await previous.click();await expect(label).toHaveText(initial);await expect(previous).toBeDisabled();
                const participant=participantList.locator('[data-easystud-user]:visible').first();
                await participant.locator('[data-easystud-selector-input]').evaluate(n=>n.click());
                const clear=root.locator('[data-easystud-clear-all-selection]');await expect(clear).toBeVisible();await expect(clear).toBeEnabled();
                const frame=root.locator('[data-easystud-clear-selection-frame]');await expect(frame).toBeVisible();
                await clear.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await settle(clear);row.selectionRest=await paint(clear);save();
                expect(alpha(row.selectionRest.background)).toBe(0);expect(alpha(row.selectionRest.border)).toBe(0);expect(row.selectionRest.shadow).toBe('none');
                await clear.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
                await expect(clear).toBeFocused();await settle(clear);row.selectionFocus=await paint(clear);save();
                expect(parseFloat(row.selectionFocus.outlineWidth)).toBeGreaterThan(0);
                const move=root.locator('[data-easystud-move-selected-participants]:visible').first();
                if(await move.count()){row.selectionMoveEnabled=await move.isEnabled();expect(row.selectionMoveEnabled).toBe(true);}
                await page.screenshot({path:info.outputPath(mode+'-'+width+'-selection.png')});
                await clear.click();await expect(clear).toBeHidden();
                const columnHeading=root.locator('.local-groupimport-easystud-column-heading__title:visible');
                if(await columnHeading.count()){
                row.contrast=await columnHeading.first().evaluate(n=>{
                    const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
                    const rgba=color=>{context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data];};
                    const color=getComputedStyle(n).color;let background='white';
                    for(let p=n;p;p=p.parentElement){const c=getComputedStyle(p).backgroundColor;if(rgba(c)[3]===255){background=c;break;}}
                    const lum=c=>rgba(c).slice(0,3).map(x=>x/255).map(x=>x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4))
                        .reduce((sum,x,i)=>sum+x*[0.2126,0.7152,0.0722][i],0);
                    const a=lum(color),b=lum(background);return {color,background,ratio:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)};
                });save();expect(row.contrast.ratio).toBeGreaterThanOrEqual(4.5);
                }else{expect(width).toBe(390);row.contrast={columnHeadingNotPaintedAt390:true};save();}
                row.overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));save();
                expect(row.overflow.scroll).toBeLessThanOrEqual(row.overflow.viewport+1);
                row.stage='complete';save();
            }
        }
        expect(errors).toEqual([]);expect(writes).toEqual([]);
    }finally{setMode('legacy');save();}
});
