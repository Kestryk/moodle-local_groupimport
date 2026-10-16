const {test,expect}=require('@playwright/test');
const {login,ready,settle,view,reportFile}=require('./k16-sort-copy-helper.cjs');
const {execFileSync}=require('node:child_process');
const path=require('node:path');

test('K16-14 keep source members FR EN 1600 390',async({page},info)=>{
    test.setTimeout(900000);
    const report={cases:[],pageErrors:[],consoleErrors:[],blockedWrites:[],captures:[]};
    const save=()=>reportFile(info,'k16-14-keep-members',report);
    const proof=(action,edge=false)=>JSON.parse(execFileSync(
        'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',
        [path.join(__dirname,'k16-14-membership-proof.php'),'--moodle-root','C:/dev/Moodle 51 Perf/moodle',
            '--manifest',path.resolve(info.outputDir,'..','..','fixture-manifest.json'),
            '--action',action,'--existing',edge?'1':'0','--multi',edge?'1':'0'],{encoding:'utf8'}));
    page.on('pageerror',e=>{report.pageErrors.push(e.message);save();});
    page.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push(m.text());save();}});
    const url=await login(page),course=url.searchParams.get('id');
    await page.route('**/local/groupimport/ajax.php*',r=>{
        const p=new URLSearchParams(r.request().postData()||'');
        if(['movemembers','addusers'].includes(p.get('action'))&&p.get('courseid')===course)return r.continue();
        report.blockedWrites.push(p.get('action'));return r.abort();
    });
    try{
        for(const lang of ['fr','en'])for(const width of [1600,390]){
            for(const edge of [false,true])for(const keep of [false,true]){
                const row={lang,width,keep,edge,before:proof('reset',edge),stage:'ready'};
                report.cases.push(row);save();
                const root=await ready(page,url,lang,width);await view(root,'groups');
                const structure=root.locator('[data-easystud-layout-mode="structure"]:visible');
                if(await structure.count())await structure.click();await settle(root);
                const [sourceId,destinationId,secondSourceId,unrelatedId]=row.before.groupIds;
                const userId=row.before.userId;
                row.stage='select';save();
                for(const gid of (edge?[sourceId,secondSourceId]:[sourceId])){
                    const group=root.locator('[data-easystud-group-id="'+gid+'"]:visible').first();
                    const expand=group.locator('[data-easystud-group-members-toggle]');
                    if(await expand.isVisible()&&await expand.getAttribute('aria-expanded')!=='true')await expand.click();
                    const member=group.locator('[data-easystud-member-id="'+userId+'"]');
                    await member.locator(':scope > .local-groupimport-easystud-selector').click();
                    await expect(member.locator('input[type="checkbox"]').first()).toBeChecked();
                }
                const move=root.locator('[data-easystud-move-selected-members]:visible, '+
                    '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-members]"]:visible').first();
                await move.click();const modal=root.locator('[data-easystud-move-modal]');
                await expect(modal).toBeVisible();await expect(modal).toHaveAttribute('data-easystud-move-context','member');
                const check=modal.locator('[data-easystud-move-remove-origin]');
                const wrapper=modal.locator('[data-easystud-move-origin-wrap]');
                await expect(wrapper).toBeVisible();await expect(check).not.toBeChecked();
                await expect(wrapper).toHaveText(lang==='fr'?"Conserver les participants dans le groupe d'origine":
                    'Keep participants in their original group');
                await settle(modal);
                const chooser=modal.locator('.easyedu-searchable-choice');
                await chooser.locator('.easyedu-searchable-choice__trigger').click();
                await settle(chooser);
                await chooser.locator('input[type="search"]').fill('QA Destination Beta');
                const target=chooser.locator('.easyedu-searchable-choice__option:visible')
                    .filter({hasText:'QA Destination Beta'});
                await expect(target).toHaveCount(1);await settle(chooser);
                row.stage='choose-destination';save();
                await target.focus();await target.press('Enter');
                await expect(modal.locator('[data-easystud-move-destination]')).toHaveValue(String(destinationId));
                if(keep){await wrapper.click();await expect(check).toBeChecked();}
                await settle(modal);
                row.bounds=await wrapper.evaluate(n=>{
                    const b=n.getBoundingClientRect(),f=n.closest('[data-easystud-move-modal]')
                        .querySelector('.local-groupimport-easystud-modal__body').getBoundingClientRect();
                    return {leftOverflow:Math.max(0,f.left-b.left),rightOverflow:Math.max(0,b.right-f.right),
                        internalOverflow:n.scrollWidth-n.clientWidth};
                });save();
                expect(Math.max(...Object.values(row.bounds))).toBeLessThanOrEqual(.5);
                if(lang==='fr'&&keep&&!edge&&process.env.EASYSTUD_K16_14_SKIP_CAPTURES!=='1'){
                    const file='conserver-fr-'+width+'.png';await page.screenshot({path:info.outputPath(file)});
                    report.captures.push(file);save();
                }
                row.stage='confirm';save();
                const response=page.waitForResponse(r=>r.url().includes('/local/groupimport/ajax.php')&&
                    ['movemembers','addusers'].includes(new URLSearchParams(r.request().postData()).get('action')));
                await modal.locator('[data-easystud-confirm-move]').click();
                const native=await response;row.request=Object.fromEntries(new URLSearchParams(native.request().postData()));
                delete row.request.sesskey; // Never retain secrets in evidence.
                row.response=await native.json();expect(row.response.success).toBe(true);
                expect(row.request.action).toBe(keep?'addusers':'movemembers');
                await expect(modal).toBeHidden();
                const message=keep?(lang==='fr'?'Participants copiés':'Participants copied'):
                    (lang==='fr'?'Appartenances d’origine déplacées':'Source memberships moved');
                await expect(page.locator('[role="status"]:visible, [role="alert"]:visible, .toast:visible')
                    .filter({hasText:message}).last()).toBeVisible();
                await settle(root);
                row.after=proof('snapshot');save();
                const expected=[destinationId,unrelatedId,...(keep?[sourceId,...(edge?[secondSourceId]:[])]:[])].sort((a,b)=>a-b);
                const actual=row.after.rows.map(r=>Number(r.groupid)).sort((a,b)=>a-b);
                expect(actual).toEqual(expected);expect(new Set(actual).size).toBe(actual.length);
                if(keep){expect(row.response.added).toBe(edge?0:1);expect(row.response.existing).toBe(edge?1:0);}
                else expect(row.response.removed).toBe(edge?2:1);
                row.messagePrefix=message;row.pass=true;save();
            }
            // Close/reopen proves the shared checkbox is never remembered. Cancel cannot mutate.
            await ready(page,url,lang,width);await view(page.locator('#local-groupimport-easystud'),'groups');
            const root=page.locator('#local-groupimport-easystud');
            const structure=root.locator('[data-easystud-layout-mode="structure"]:visible');
            if(await structure.count())await structure.click();await settle(root);
            const before=proof('snapshot'),gid=before.groupIds[0];
            const group=root.locator('[data-easystud-group-id="'+gid+'"]:visible').first();
            const expand=group.locator('[data-easystud-group-members-toggle]');
            if(await expand.isVisible()&&await expand.getAttribute('aria-expanded')!=='true')await expand.click();
            await group.locator('[data-easystud-member-id="'+before.userId+'"] > .local-groupimport-easystud-selector').click();
            await root.locator('[data-easystud-move-selected-members]:visible, '+
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-members]"]:visible').first().click();
            const modal=root.locator('[data-easystud-move-modal]');
            await expect(modal.locator('[data-easystud-move-remove-origin]')).not.toBeChecked();
            await modal.locator('[data-easystud-close-move-modal]:visible').last().click();
            await expect(modal).toBeHidden();expect(proof('snapshot').rows).toEqual(before.rows);
        }
        expect(report.cases).toHaveLength(16);expect(report.captures).toHaveLength(process.env.EASYSTUD_K16_14_SKIP_CAPTURES==='1'?0:2);
        expect(report.pageErrors).toEqual([]);expect(report.consoleErrors).toEqual([]);
        expect(report.blockedWrites).toEqual([]);report.pass=true;save();
    }catch(e){report.error=e.message;save();throw e;}
});
