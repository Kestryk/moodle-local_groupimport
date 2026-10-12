// Reusable Student Management logic verifier. No browser, database or business writes.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const rootPath = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(rootPath, 'amd/src/course_manager.js'), 'utf8');
const checks = {};
const check = (name, condition) => { assert.ok(condition, name); checks[name] = true; };
const notices = [], attributes = {}, busy = [];
const signals = [];
let nextStep = 'try-selection', checklistVisible = true, stepDisabled = false;
let guideToken = {root:{},config:{},epoch:1};
const root = {
    isConnected:true,
    easystudGuideOwner:{},
    dispatchEvent:event=>signals.push(event.detail),
    getAttribute: () => JSON.stringify({ajaxerror:'Localized request failure',actioninprogress:'Working'}),
    setAttribute: (name, value) => { attributes[name] = value; },
    classList: {toggle: (name, value) => busy.push(value)},
    querySelector: () => null
};
let response = {success:false,error:'Explicit server failure'};
const context = {
    console, URLSearchParams, FormData, Promise, Error, TypeError,
    Motion:{}, Guide:{getPathContextToken:()=>guideToken}, enhanceSelect(){}, enhanceMultipleSelect(){}, closeChoicesWithin(){}, snapshotMemberPairs(){},
    CustomEvent:class {constructor(type,options){this.detail=options.detail;}},
    window:{}, document:{getElementById:()=>root, querySelectorAll:()=>[root],querySelector:selector=>
        selector.includes('try-actions')?{hidden:!checklistVisible,querySelector:()=>
            ({disabled:stepDisabled,getAttribute:()=>nextStep})}:null},
    M:{cfg:{sesskey:'synthetic-session',wwwroot:'http://synthetic.invalid'}},
    require: (names, done) => done({add: (message, options) => notices.push({message,type:options.type})}),
    fetch: () => response instanceof Error ? Promise.reject(response) : Promise.resolve({json:()=>Promise.resolve(response)})
};
const executable = source.replace(/^import .+;\r?\n/gm, '').replace('export const init =', 'const init =');
vm.runInNewContext(executable + '\nglobalThis.api={postAction,postFormAction,handleActionError,emitTryActionsCompletion};', context);
(async () => {
    check('No request-failure reload remains', !source.includes('window.location.reload'));
    check('All fifteen former reload branches use common handler',
        (source.match(/\.catch\(error => handleActionError\(root, error\)\)/g) || []).length === 15);
    for (const form of [false, true]) {
        for (const failure of [{success:false,error:'Explicit server failure'}, new TypeError('Synthetic network failure')]) {
            response = failure;
            const before = notices.length;
            const request = form ? context.api.postFormAction(new FormData()) : context.api.postAction({action:'synthetic'});
            await request.catch(error=>context.api.handleActionError(root,error));
            const expected = failure instanceof Error ? failure.message : failure.error;
            check((form?'Form':'Action') + ' ' + expected, notices.length === before+1 &&
                notices.at(-1).message === expected && notices.at(-1).type === 'danger');
            check((form?'Form':'Action') + ' busy restored ' + expected, attributes['aria-busy'] === 'false');
        }
    }
    context.api.handleActionError(root, null);
    check('Missing error uses translated fallback', notices.at(-1).message === 'Localized request failure');
    response = {success:true,message:'Success'};
    check('Success untouched', (await context.api.postAction({action:'synthetic'})).success === true);
    const generated = fs.readFileSync(path.join(rootPath,'amd/build/course_manager.min.js'),'utf8');
    check('Named generated module', generated.includes('define("local_groupimport/course_manager"'));
    check('Generated code has no reload', !generated.includes('window.location.reload'));
    context.api.emitTryActionsCompletion(root,'try-context');
    check('Menu cannot bypass selection',signals.length===0);
    context.api.emitTryActionsCompletion(root,'try-selection');
    check('Selection completes its current milestone',signals.length===1 && signals[0].step==='try-selection');
    nextStep='try-context';
    checklistVisible=false;
    context.api.emitTryActionsCompletion(root,'try-context');
    check('Hidden checklist does not complete',signals.length===1);
    checklistVisible=true;
    stepDisabled=true;
    context.api.emitTryActionsCompletion(root,'try-context');
    check('Locked milestone does not complete',signals.length===1);
    stepDisabled=false;
    context.api.emitTryActionsCompletion(root,'try-context');
    check('Current context milestone completes',signals.length===2 && signals[1].step==='try-context');
    nextStep='try-drag';
    const submittedToken=guideToken;
    guideToken={...guideToken,epoch:2};
    context.api.emitTryActionsCompletion(root,'try-drag',submittedToken);
    check('Late drag after Reset rejected',signals.length===2);
    context.api.emitTryActionsCompletion(root,'try-drag',guideToken);
    check('Same-session drag success completes',signals.length===3 && signals[2].step==='try-drag');
    check('Broad numeric Actions signals removed',!source.includes("emitGuidedCompletion(root, 0, 'actions')") &&
        !source.includes("emitGuidedCompletion(root, 1, 'actions')") && !source.includes("emitGuidedCompletion(root, 2, 'actions')"));
    check('Menu reveal certifies only owned Participant cards',source.includes(
        "type === 'participant' && target && target.isConnected && root.contains(target)"));
    check('Long-press compatibility click intercepted before backdrop target',
        /document\.addEventListener\('click', event => \{\s*if \(suppressNextDocumentClick\)[\s\S]*?event\.stopPropagation\(\);\s*\}\s*\}, true\);/.test(source));
    const manage=fs.readFileSync(path.join(rootPath,'manage.php'),'utf8');
    check('Actions path opts into the canonical session-token API',
        /'pathContextFields' => \[[\s\S]*?'try-actions' => \[\]/.test(manage));
    let actualGuide;
    vm.runInNewContext(fs.readFileSync(path.join(rootPath,'amd/build/easyedu_guide.min.js'),'utf8'), {
        define:(name,deps,factory)=>{actualGuide=factory({});},
        window:{localStorage:{getItem:()=>JSON.stringify({path:'try-actions'})}}
    });
    const owner={easyeduGuideConfig:{storageKey:'synthetic',pathContextFields:{'try-actions':[]}},
        easyeduGuidePathEpoch:3,querySelector:()=>({hidden:false,getAttribute:()=> 'try-actions'})};
    const actualToken=actualGuide.getPathContextToken(owner,'try-actions');
    check('Actual built Guide exposes token for opted-in Actions session',
        actualToken && actualToken.root===owner && actualToken.epoch===3);
    check('Token-only path rejects course evidence storage',
        actualGuide.setPathContext(owner,'try-actions',{},actualToken)===false);
    const guideSource=fs.readFileSync(path.join(rootPath,'amd/src/easyedu_guide.js'),'utf8').replace(/\r\n/g,'\n');
    const resumeStart=guideSource.indexOf("  const resume = root.querySelector('[data-easyedu-guide-resume-path]');");
    const resumeEnd=guideSource.indexOf('  const cancelPath =',resumeStart);
    const resumeCode=guideSource.slice(resumeStart,resumeEnd);
    const resumeCalls=[];
    let clickResume, completedPath=false;
    const resumeRoot={easyeduGuideConfig:{paths:{'try-actions':[{id:'try-drag'},{id:'try-selection'}]}},
        querySelector:selector=>selector.includes('.is-active')?{getAttribute:()=> '1'}:
            {dataset:{easyeduGuideResumePathName:'try-actions'}}};
    vm.runInNewContext(resumeCode, {root:resumeRoot,config:resumeRoot.easyeduGuideConfig,
        SELECTORS:{checklist:'[data-easyedu-guide-checklist]'},
        addTrackedListener:(root,control,event,handler)=>{clickResume=handler;},
        dismissResume:()=>resumeCalls.push('dismiss'),isPathComplete:()=>completedPath,
        renderChecklist:()=>resumeCalls.push('render'),
        highlightChecklistStep:(root,config,step)=>resumeCalls.push(step.id)});
    clickResume();
    check('Actual Resume handler restores only the current target',
        JSON.stringify(resumeCalls)===JSON.stringify(['dismiss','render','try-selection']));
    completedPath=true;resumeCalls.length=0;clickResume();
    check('Completed paths never resume a checklist',JSON.stringify(resumeCalls)===JSON.stringify(['dismiss']));
    const addedResume="    if (!isPathComplete(activeConfig, path)) {\n"+
        "      renderChecklist(root, activeConfig, path);\n"+
        "      const activeItem = root.querySelector(`${SELECTORS.checklist} [data-easyedu-guide-step-index].is-active`);\n"+
        "      const activeIndex = Number(activeItem?.getAttribute('data-easyedu-guide-step-index') || 0);\n"+
        "      highlightChecklistStep(root, activeConfig, activeConfig.paths[path]?.[activeIndex]);\n    }";
    const oldGuide=execFileSync('git',['show','4e4eae50345d4234d4ab4ef02196f504a7621078:amd/src/easyedu_guide.js'],
        {cwd:rootPath,encoding:'utf8',maxBuffer:2e6}).replace(/\r\n/g,'\n');
    check('Resume target handler remains intact',guideSource.includes(addedResume));
    const portalPolicy="  // A body portal cannot inherit the root's policy. Relay this instance's\n"+
        "  // resolved policy, never a global body mutation affecting another Guide.\n"+
        "  highlight.setAttribute('data-easyedu-motion-policy', isMotionEnabled(root) ? 'enabled' : 'disabled');\n";
    check('Complete unrelated Guide engine and Motion unchanged',guideSource.replace(portalPolicy,'')
        .replace("  highlight.removeAttribute('data-easyedu-motion-policy');\n",'')===oldGuide);
    const css=fs.readFileSync(path.join(rootPath,'styles.css'),'utf8').replace(/\r\n/g,'\n');
    check('No unscoped universal policy selector',!/(?:^|\n)(?:\.easyedu-motion-disabled )?\[data-easyedu-motion-policy[^\]]*\](?:\s*\{|\s+\*(?:::before|::after)?\s*[,\{])/.test(css));
    check('Mass Import policy keeps explicit scope',css.includes('.local-groupimport-import, .local-groupimport-easystud-easyedu-guide)[data-easyedu-motion-policy=disabled]'));
    let priorCSS=execFileSync('git',['show','4e4eae50345d4234d4ab4ef02196f504a7621078:styles.css'],
        {cwd:rootPath,encoding:'utf8',maxBuffer:2e6}).replace(/\r\n/g,'\n');
    // Subsequent PG-S1 lot reuses this exact dialog budget at every width.
    // Admit only the media-boundary move, preserving its full selector/body.
    const budget=/@media \(max-width: 64rem\) \{\n(  \.local-groupimport-easystud-easyedu-guide[^\n]*\[data-easyedu-guide-target-in-dialog\][^\n]*\n[\s\S]*?    max-height: 6rem;\n  \}\n)\}\n/;
    const scopedBudget=priorCSS.match(budget);
    check('One pinned dialog checklist budget',scopedBudget && priorCSS.split(scopedBudget[0]).length===2);
    priorCSS=priorCSS.replace(scopedBudget[0],scopedBudget[1].replace(/^  /gm,''));
    const scope=':is(.local-groupimport-easystud, .local-groupimport-import, .local-groupimport-easystud-easyedu-guide)';
    const unscoped=css.replace(/\.easyedu-guide-highlight\[data-easyedu-motion-policy=disabled\] \{\n  animation: none !important;\n  transition: none !important;\n  scroll-behavior: auto !important;\n\}\n\n/,'')
        .replaceAll(scope+'[data-easyedu-motion-policy=disabled]', '[data-easyedu-motion-policy=disabled]')
        .replaceAll('.easyedu-motion-disabled '+scope+'[data-easyedu-motion-policy]', '.easyedu-motion-disabled [data-easyedu-motion-policy]')
        .replaceAll(scope+'[data-easyedu-motion-policy]', '[data-easyedu-motion-policy]')
        .replace(/^[ \t]*#page-admin-setting-local_groupimport \[data-easyedu-motion-policy(?:=disabled)?\](?: \*(?:::before|::after)?)?,\n/gm,'')
        .replace(/,\n[ \t]*#page-admin-setting-local_groupimport \[data-easyedu-motion-policy(?:=disabled)?\](?: \*(?:::before|::after)?)?(?= \{)/g,'');
    if(unscoped!==priorCSS){
        let at=0;while(at<unscoped.length && unscoped[at]===priorCSS[at])at++;
        console.error(JSON.stringify({cssMismatchAt:at,current:unscoped.slice(at-100,at+200),prior:priorCSS.slice(at-100,at+200)}));
    }
    check('Complete unrelated emitted CSS unchanged',unscoped===priorCSS);
    check('Actions dependencies preserve original IDs',
        /'id' => 'try-selection',\s*'requiresStep' => 'try-drag'/.test(manage) &&
        /'id' => 'try-context',\s*'requiresStep' => 'try-selection'/.test(manage));
    console.log(JSON.stringify({surface:'student-management',level:0,passed:Object.keys(checks).length,checks},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
