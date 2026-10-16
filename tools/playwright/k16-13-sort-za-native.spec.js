const {test,expect}=require('@playwright/test');
const {login,ready,settle,view,reportFile}=require('./k16-sort-copy-helper.cjs');

test('K16-13 Z to A three lists FR EN 1600 390',async({page},info)=>{
    test.setTimeout(900000);
    const report={cases:[],pageErrors:[],consoleErrors:[],blockedWrites:[],captures:[]};
    const save=()=>reportFile(info,'k16-13-sort-za',report);
    page.on('pageerror',e=>{report.pageErrors.push(e.message);save();});
    page.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push(m.text());save();}});
    await page.route('**/local/groupimport/ajax.php*',r=>{
        report.blockedWrites.push('ajax.php');return r.abort();
    });
    await page.route('**/lib/ajax/service.php*',r=>{
        const calls=r.request().postDataJSON()||[];
        const writes=Array.isArray(calls)?calls.filter(c=>/^local_groupimport_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname)):[];
        if(writes.length){report.blockedWrites.push(writes.map(c=>c.methodname));return r.abort();}
        return r.continue();
    });
    const url=await login(page);
    try{
        for(const lang of ['fr','en'])for(const width of [1600,390]){
            const root=await ready(page,url,lang,width);
            for(const kind of ['participants','groups','groupings']){
                const row={lang,width,kind,stage:'view'};report.cases.push(row);save();
                await view(root,kind);
                const selector=kind==='participants'?'[data-easystud-participant-list]':kind==='groups'?
                    '.local-groupimport-easystud-structure-groups__list:visible, .local-groupimport-easystud-participant-groups__list:visible':
                    '[data-easystud-tree] .local-groupimport-easystud-tree__groupings';
                const list=root.locator(selector).filter({visible:true}).first();
                const nav=list.locator(':scope > [data-easystud-pagination="top"]');
                const toggle=nav.locator('[data-easystud-list-sort-toggle]');
                const name=kind==='participants'?'.local-groupimport-easystud-user__name':
                    '.local-groupimport-easystud-'+(kind==='groups'?'group':'grouping')+'__name';
                const cards=kind==='participants'?':scope > [data-easystud-user]:visible':kind==='groups'?
                    ':scope > [data-easystud-group-id]:visible':':scope > [data-easystud-grouping-id]:visible';
                const choose=async mode=>{
                    await toggle.click();const option=nav.locator('[data-easystud-list-sort-option="'+mode+'"]');
                    await expect(option).toHaveText(mode==='alpha'?'A → Z':'Z → A');
                    await option.click();await expect(list).toHaveAttribute('data-easystud-sort',mode);await settle(root);
                    await toggle.click();await expect(option).toHaveAttribute('aria-pressed','true');
                    await expect(option).toHaveClass(/is-active/);
                    const inactive=nav.locator('[data-easystud-list-sort-option="'+(mode==='alpha'?'alpha-desc':'alpha')+'"]');
                    await expect(inactive).toHaveAttribute('aria-pressed','false');
                    if(mode==='alpha-desc'&&lang==='fr'&&kind==='groupings'){
                        const file='tri-za-fr-'+width+'.png';await page.screenshot({path:info.outputPath(file)});
                        report.captures.push(file);save();
                    }
                    await toggle.click();await settle(root);
                };
                const collect=async()=>{
                    const names=[];
                    for(let i=0;i<20;i++){
                        names.push(...await list.locator(cards).evaluateAll((nodes,sel)=>
                            nodes.map(n=>n.querySelector(sel).textContent.trim()),name));
                        const next=nav.locator('[data-easystud-page-next]');
                        if(!await next.isVisible()||await next.isDisabled())break;
                        await next.click();await settle(root);
                    }
                    return names;
                };
                row.stage='alpha';save();await choose('alpha');row.alpha=await collect();
                expect(row.alpha.length).toBeGreaterThan(1);
                row.stage='alpha-desc';save();await choose('alpha-desc');row.desc=await collect();
                expect(row.desc[0]).toBe(row.alpha.at(-1));expect(row.desc).toEqual([...row.alpha].reverse());
                row.stage='return-alpha';save();await choose('alpha');row.returned=await collect();
                expect(row.returned).toEqual(row.alpha);
                row.pass=true;save();
            }
        }
        expect(report.cases).toHaveLength(12);expect(report.captures).toHaveLength(2);
        expect(report.pageErrors).toEqual([]);expect(report.consoleErrors).toEqual([]);
        expect(report.blockedWrites).toEqual([]);report.pass=true;save();
    }catch(e){report.error=e.message;save();throw e;}
});
