'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

test('SM browser measures both modes and native list interactions', async({page}, info) => {
    test.setTimeout(1500000);
    const fixture = JSON.parse(fs.readFileSync(process.env.EASYEDU_PERF_MANIFEST,'utf8'));
    const output = process.env.EASYEDU_SM_BROWSER_RESULT;
    const setting = process.env.EASYEDU_SM_MODE_STATE;
    const moodle = process.env.EASYEDU_PERF_MOODLE_ROOT;
    const source = path.resolve(__dirname,'../..');
    const result = {lot:'SM-RENDU-3b-browser', participants:fixture.userIds.length,groups:fixture.groupIds.length,
        groupings:fixture.groupingIds.length,courseId:fixture.courseId,viewport:1280,locale:'fr',
        modeOrder:['legacy','reactive'],modes:[],errors:[],completed:false,
        clockPolicy:'Native readiness timestamps plus10 consecutive rAF intervals <60ms; DOM dispatch synchronous cost reported separately.',
        deployment:JSON.parse(fs.readFileSync(process.env.EASYEDU_PERF_DEPLOYMENT_MANIFEST,'utf8')).sourceHead};
    const save = () => fs.writeFileSync(output,JSON.stringify(result,null,2));
    const config = (action,mode) => {
        const args=[path.join(source,'tools/perf/rendering-mode.php'),'--moodle-root',moodle,'--state',setting,'--action',action];
        if(mode)args.push('--mode',mode);
        const r=spawnSync(process.env.EASYEDU_PERF_PHP,args,{encoding:'utf8',windowsHide:true,timeout:60000});
        if(r.status!==0)throw new Error('Mode helper failed: '+r.stderr);
        return JSON.parse(r.stdout);
    };
    const requests=[];
    page.on('request',req=>{
        const u=new URL(req.url());let methods=[];
        if(u.pathname.endsWith('/lib/ajax/service.php')){
            try{methods=JSON.parse(req.postData()||'[]').map(c=>c.methodname);}catch{}
        }
        requests.push({path:u.pathname,method:req.method(),methods});
    });
    page.on('pageerror',e=>{result.errors.push(e.message);save();});
    const calm = () => page.evaluate(()=>new Promise(resolve=>{
        const start=performance.now();let previous=null,count=0,intervals=[];
        const frame=now=>{if(previous===null){previous=now;requestAnimationFrame(frame);return;}
            const gap=now-previous;previous=now;intervals.push(gap);
            count=gap<60?count+1:0;if(count>=10)resolve({totalMs:now-start,frames:intervals.length,
                maxIntervalMs:Math.max(...intervals),terminalIntervals:intervals.slice(-10)});else requestAnimationFrame(frame);};
        requestAnimationFrame(frame);
    }));
    const describe = () => page.evaluate(()=>{
        const root=document.getElementById('local-groupimport-easystud');
        const nav=performance.getEntriesByType('navigation')[0];
        const tasks=window.smPerf?.tasks||[];
        return {navigation:nav?{responseEndMs:nav.responseEnd,domContentLoadedMs:nav.domContentLoadedEventEnd,
            htmlDecodedBytes:nav.decodedBodySize,htmlEncodedBytes:nav.encodedBodySize}:null,
            domElements:document.getElementsByTagName('*').length,
            markers:window.smPerf?.markers,attributes:root?{manager:root.getAttribute('data-easystud-manager-initialised'),
                sm:root.getAttribute('data-easystud-sm-ready'),mode:root.getAttribute('data-easystud-rendering-mode')}:null,
            longTasks:tasks,longTaskTotalMs:tasks.reduce((n,t)=>n+t.duration,0),
            longTaskMaxMs:Math.max(0,...tasks.map(t=>t.duration))};
    });
    save();
    try {
        await page.setViewportSize({width:1280,height:900});
        await page.emulateMedia({reducedMotion:'no-preference'});
        await page.goto('http://localhost:8051/login/index.php',{waitUntil:'domcontentloaded'});
        if(page.url().includes('/login/')){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'domcontentloaded'}),page.locator('#loginbtn').click()]);
        }
        await page.addInitScript(()=>{
            window.smPerf={tasks:[],markers:{}};
            new PerformanceObserver(list=>list.getEntries().forEach(e=>window.smPerf.tasks.push({start:e.startTime,duration:e.duration})))
                .observe({type:'longtask',buffered:true});
            const attach=()=>{const root=document.getElementById('local-groupimport-easystud');if(!root){requestAnimationFrame(attach);return;}
                const read=()=>{for(const [key,attr]of [['manager','data-easystud-manager-initialised'],['sm','data-easystud-sm-ready']])
                    if(root.getAttribute(attr)==='1'&&!window.smPerf.markers[key])window.smPerf.markers[key]=performance.now();};
                new MutationObserver(read).observe(root,{attributes:true,attributeFilter:['data-easystud-sm-ready','data-easystud-manager-initialised']});read();};
            document.addEventListener('DOMContentLoaded',attach,{once:true});requestAnimationFrame(attach);
        });
        for(const mode of result.modeOrder){
            config('set',mode);
            const record={mode,actions:[],completed:false};result.modes.push(record);save();
            const url='http://localhost:8051/local/groupimport/manage.php?id='+fixture.courseId+'&lang=fr';
            try{
                const started=Date.now();
                await page.goto(url,{waitUntil:'commit',timeout:120000});
                const marker=mode==='reactive'?'data-easystud-sm-ready':'data-easystud-manager-initialised';
                try {
                    await page.waitForFunction(attr=>document.getElementById('local-groupimport-easystud')?.getAttribute(attr)==='1',marker,{timeout:240000});
                } catch(e) {
                    record.readinessTimeout=e.message.split('\n')[0];record.exceededObservationDeadline=true;
                    const late=await describe();record.lateSnapshot=late;save();
                    // Preserve the failed240s observation. If the original page
                    // became ready while the blocked thread returned, measure
                    // its real late interaction cost; do not change product SLA.
                    if(late.attributes?.[mode==='reactive'?'sm':'manager']!=='1')throw e;
                }
                record.waitWallMs=Date.now()-started;record.initial=await describe();
                record.usableMs=record.initial.markers?.[mode==='reactive'?'sm':'manager'];
                record.initialCalm=await calm();save();
                const run=async(name,command)=>{
                    const requestStart=requests.length;
                    const action=await page.evaluate(({name,command})=>{
                        const root=document.getElementById('local-groupimport-easystud');
                        let list=root.querySelector('[data-easystud-participant-list]');
                        let target;
                        if(command==='groups-next')list=root.querySelector('[data-easystud-structure-groups] .local-groupimport-easystud-structure-groups__list');
                        if(command.endsWith('next')){
                            const pagination=list?.previousElementSibling?.matches('[data-easystud-pagination]')?list.previousElementSibling:
                                list?.querySelector(':scope > [data-easystud-pagination="top"]');
                            target=pagination?.querySelector('[data-easystud-page-next]');
                        }else if(command==='structure')target=root.querySelector('[data-easystud-layout-mode="structure"]');
                        else target=root.querySelector('[data-easystud-search]');
                        if(!target||target.disabled)throw new Error('Native enabled target unavailable: '+command);
                        const start=performance.now();
                        if(command==='search'||command==='clear'){target.value=command==='search'?'perf user 001':'';target.dispatchEvent(new Event('input',{bubbles:true}));}
                        else target.click();
                        return {name,command,start,synchronousMs:performance.now()-start};
                    },{name,command});
                    record.actions.push(action);save();
                    if(command.endsWith('next'))await page.waitForFunction(kind=>{
                        const root=document.getElementById('local-groupimport-easystud');
                        const list=kind==='groups-next'?root.querySelector('[data-easystud-structure-groups] .local-groupimport-easystud-structure-groups__list'):
                            root.querySelector('[data-easystud-participant-list]');return list?.getAttribute('data-easystud-page')==='1';
                    },command,{timeout:60000});
                    if(command==='search'||command==='clear')await page.waitForFunction(kind=>{
                        const list=document.querySelector('[data-easystud-participant-list]');
                        return list&&[...list.querySelectorAll(':scope > [data-easystud-user]')].filter(n=>!n.hidden).length===(kind==='search'?10:20);
                    },command,{timeout:60000});
                    action.calm=await calm();
                    action.untilCalmMs=await page.evaluate(start=>performance.now()-start,action.start);
                    action.requests=requests.slice(requestStart);action.snapshot=await describe();save();
                };
                await run('participant-next','participants-next');
                await run('search-perf-user-001','search');
                await run('clear-search','clear');
                await run('structure-view','structure');
                await run('group-catalogue-next','groups-next');
                record.completed=true;
            }catch(e){record.failure=e.message.split('\n')[0];record.snapshot=await describe().catch(()=>null);}
            save();
        }
        result.completed=true;result.passed=result.modes.every(m=>m.completed &&
            !m.exceededObservationDeadline && m.usableMs<=(result.participants===800?3000:5000));save();
    }finally{result.settingRestore=config('restore');save();}
    expect(result.modes).toHaveLength(2);
});
