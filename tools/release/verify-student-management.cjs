// Reusable Student Management logic verifier. No browser, database or business writes.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const rootPath = path.resolve(__dirname, '../..');
// Keep the historical SM2a reconstruction below pinned. SM2b deliberately
// changes selection/pagination authorities; its successor verifies the exact
// approved producer and relies on the shared native surface for behavior.
if (process.argv[2] === '--sm2b') {
    const paths = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', '90ea17b'],
        {cwd:rootPath, encoding:'utf8'}).trim().split('\n').filter(p => p !== 'CHANGELOG.md');
    const checks = {};
    for (const file of paths) {
        const approved = execFileSync('git', ['show', '90ea17b:' + file], {cwd:rootPath, maxBuffer:4e6});
        // Windows autocrlf is checkout transport, not a generated-code change.
        assert.equal(fs.readFileSync(path.join(rootPath, file), 'utf8').replace(/\r\n/g, '\n'),
            approved.toString('utf8').replace(/\r\n/g, '\n'), file);
        checks['Approved producer content (LF-normalized): ' + file] = true;
    }
    assert.deepEqual(fs.readFileSync(path.join(rootPath, 'version.php')),
        execFileSync('git', ['show', '6ac8a45:version.php'], {cwd:rootPath}));
    checks['Schema/version unchanged by SM2b'] = true;
    const output = JSON.stringify({surface:'student-management-sm2b', niveau:0,
        producer:'90ea17b', passed:Object.keys(checks).length, failed:0, checks,
        historicalSM2aVerifier:'retained unchanged; not a current-controller proof',
        nativeRequired:['legacy1280FR','reactive page1','pagination','search','select all','participant details','restore legacy']}, null, 2);
    if (process.argv[3]) fs.writeFileSync(path.resolve(process.argv[3]), output + '\n');
    console.log(output);
    process.exit(0);
}
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
        captureChecklistFocus:()=>resumeCalls.push('capture'),focusChecklist:()=>resumeCalls.push('focus'),
        renderChecklist:()=>resumeCalls.push('render'),
        highlightChecklistStep:(root,config,step)=>resumeCalls.push(step.id)});
    clickResume();
    check('Actual Resume handler restores only the current target',
        JSON.stringify(resumeCalls)===JSON.stringify(['capture','dismiss','render','focus','try-selection']));
    completedPath=true;resumeCalls.length=0;clickResume();
    check('Completed paths never resume a checklist',JSON.stringify(resumeCalls)===JSON.stringify(['capture','dismiss']));
    const addedResume="    if (!isPathComplete(activeConfig, path)) {\n"+
        "      renderChecklist(root, activeConfig, path);\n"+
        "      const activeItem = root.querySelector(`${SELECTORS.checklist} [data-easyedu-guide-step-index].is-active`);\n"+
        "      const activeIndex = Number(activeItem?.getAttribute('data-easyedu-guide-step-index') || 0);\n"+
        "      highlightChecklistStep(root, activeConfig, activeConfig.paths[path]?.[activeIndex]);\n    }";
    const oldGuide=execFileSync('git',['show','4e4eae50345d4234d4ab4ef02196f504a7621078:amd/src/easyedu_guide.js'],
        {cwd:rootPath,encoding:'utf8',maxBuffer:2e6}).replace(/\r\n/g,'\n');
    check('Resume target handler remains intact',resumeCode.replace('      focusChecklist(root);\n','').includes(addedResume));
    const portalPolicy="  // A body portal cannot inherit the root's policy. Relay this instance's\n"+
        "  // resolved policy, never a global body mutation affecting another Guide.\n"+
        "  highlight.setAttribute('data-easyedu-motion-policy', isMotionEnabled(root) ? 'enabled' : 'disabled');\n";
    // AP-B7/B8 admit only the explicit accessibility functions/call sites.
    // Whole-engine equality still guards all playback, targets, data and Motion.
    const a11yBase=execFileSync('git',['show','90408a35b91db1330b68597e4ede9fa984108b67:amd/src/easyedu_guide.js'],
        {cwd:rootPath,encoding:'utf8',maxBuffer:2e6}).replace(/\r\n/g,'\n');
    const section=(text,from,to)=>{
        const start=text.indexOf(from),end=text.indexOf(to,start);
        assert.ok(start>=0&&end>start,'Bounded accessibility section '+from);return text.slice(start,end);
    };
    let beforeAccessibility=guideSource;
    for(const [from,to] of [
        ['// Count only time outside pointer/keyboard interaction.','const saveChecklistProgress ='],
        ['const showInterfaceReturn =','const hideInterfaceReturn ='],
        ['const captureChecklistFocus =','const getScrollTopOffset ='],
        ['const renderChecklist =','const updateChecklistMessage =']]){
        const originalFrom=from==='// Count only time outside pointer/keyboard interaction.'?'const offerResume =':
            from==='const captureChecklistFocus ='?'const hideChecklist =':from;
        beforeAccessibility=beforeAccessibility.replace(section(beforeAccessibility,from,to),
            section(a11yBase,originalFrom,to));
    }
    beforeAccessibility=beforeAccessibility
        .replace("    stepCompleted: 'Completed',\n    stepLocked: 'Locked',\n",'')
        .replace('  delete root.easyeduGuideNoticeClocks;\n','')
        .replace(/^[ ]*(?:captureChecklistFocus\(root, (?:startPath|resume)\);|focusChecklist\(root\);|root\.easyeduGuideChecklistReturnFocus = null;)\n/gm,'')
        .replace("      hideChecklist(root, config, false, true);","      hideChecklist(root, config);")
        .replace("        const nextControl = root.querySelector(minimized ? '[data-easyedu-guide-checklist-restore]' :\n"+
            "          '[data-easyedu-guide-checklist-minimize]');\n"+
            "        if (isVisibleElement(nextControl)) { nextControl.focus({preventScroll: true}); }\n",'')
        .replace("      const checklist = root.querySelector(SELECTORS.checklist);\n"+
            "      if (event.key === 'Escape' && !event.defaultPrevented && checklist && !checklist.hidden &&\n"+
            "          !checklist.classList.contains('is-minimized') && checklist.contains(event.target)) {\n"+
            "        event.preventDefault();\n"+
            "        root.querySelector('[data-easyedu-guide-checklist-minimize]')?.click();\n      }\n",'');
    // D5 explicitly retires unknown path state; compare every other engine byte.
    beforeAccessibility=beforeAccessibility.replace(section(beforeAccessibility,'const pruneUnknownPaths =',
        'const saveGuideState ='),section(a11yBase,'const loadGuideState =','const saveGuideState ='));
    beforeAccessibility=beforeAccessibility.replace("      confirm.querySelector('[data-guide-simulated-submit]').textContent = scene.dataset.guideMobileAddSubmit ||\n"+
        "        confirm.querySelector('[data-guide-simulated-submit]').textContent;\n",'');
    check('Complete unrelated Guide engine and Motion unchanged',beforeAccessibility.replace(portalPolicy,'')
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
    const singleBlocks=css.match(/(?:^[^{}\n]*header--single[^\n]*\n)*^[^{}\n]*header--single[^\n]*\{\n[^}]*\}\n/gm)||[];
    check('R3 admits only nine additive no-mode rules',singleBlocks.length===9);
    const withoutR3=css.replace(/(?:^[^{}\n]*header--single[^\n]*\n)*^[^{}\n]*header--single[^\n]*\{\n[^}]*\}\n/gm,'')
        .replace('  inline-size: 1.125rem;\n  block-size: 0.25rem;\n  white-space: nowrap;\n  letter-spacing: 0;\n','');
    const unscoped=withoutR3.replace(/\.easyedu-guide-highlight\[data-easyedu-motion-policy=disabled\] \{\n  animation: none !important;\n  transition: none !important;\n  scroll-behavior: auto !important;\n\}\n\n/,'')
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
    check('Retired path definitions and dedicated emissions removed',
        !/'(?:first-structure|create-grouping)'/.test(manage+source));
    check('Shared native creation openers retained',
        source.includes("selector === 'tutorial:create-group'") &&
        source.includes("selector === 'tutorial:create-grouping'") &&
        manage.includes("'highlightopen' => 'tutorial:create-grouping'"));
    const closeStart=source.indexOf('    const closeModal = (completeInspection = true)'),
        closeEnd=source.indexOf("    modal.addEventListener('focusin'",closeStart);
    check('Editor exit section bounded',closeStart>=0&&closeEnd>closeStart);
    for(const type of ['group','grouping'])for(const review of [false,true]){
        let finish,removed=false,focused=false,completed=[];
        const modal={},returnFocus={isConnected:true,getClientRects:()=>[{}],focus:()=>{focused=true;}};
        modal.remove=()=>{removed=true;};
        vm.runInNewContext(source.slice(closeStart,closeEnd),{modal,returnFocus,root:{},type,
            hideEasyStudModal:(node,callback)=>{finish=callback;},
            emitEditorInspectionCompletion:(root,type,step)=>completed.push(step)});
        (review?modal.easystudCloseEditor:modal.easystudCompleteEditorClose)();
        check(type+' '+(review?'review':'native close')+' cannot complete before exit',
            !removed&&!focused&&completed.length===0);
        finish();
        check(type+' '+(review?'review':'native close')+' completes only correct exit',
            removed&&focused&&JSON.stringify(completed)===JSON.stringify(review?[]:['cancel-editor']));
    }
    const bindStart=source.indexOf('const bindAdvancedSettings =');
    const submitStart=source.indexOf("    root.addEventListener('submit', event => {",bindStart),
        submitEnd=source.indexOf("    root.addEventListener('change', event => {",submitStart);
    check('Native Save reuses completed exit',source.slice(submitStart,submitEnd)
        .includes('modal.easystudCompleteEditorClose();'));
    for(const successful of [true,false]){
        let handler,closed=0;const submit={disabled:false},modal={easystudCompleteEditorClose:()=>{closed++;}};
        const form={querySelector:()=>submit,closest:()=>modal};
        vm.runInNewContext(source.slice(submitStart,submitEnd),{
            root:{addEventListener:(name,callback)=>{handler=callback;},contains:()=>true},
            FormData:function(){},postFormAction:()=>successful?Promise.resolve({}):Promise.reject(Error('Expected error')),
            showNotification(){},applyAdvancedGroupUpdate(){},applyAdvancedGroupingUpdate(){},resetAdvancedDeletePictureCommand(){}});
        handler({target:{closest:()=>form},preventDefault(){}});
        for(let n=0;n<12;n++)await Promise.resolve();
        check('Save '+(successful?'success':'failure')+' closes only after accepted outcome',
            closed===(successful?1:0)&&submit.disabled===false);
    }
    const captionStart=source.indexOf("        if (title) { title.textContent = type === 'participant'"),
        captionEnd=source.indexOf('        if (removeOriginWrap)',captionStart);
    check('Bounded destination captions',captionStart>=0&&captionEnd>captionStart);
    for(const type of ['participant','member','group'])for(const selectedCount of [1,2]){
        const title={},confirmButton={},labels={addparticipanttitle:'Add to group',addparticipantconfirm:'Add',
            moveconfirmone:'Move selected item',moveconfirmmany:'Move selected items'};
        vm.runInNewContext(source.slice(captionStart,captionEnd),{title,confirmButton,labels,type,selectedCount,moveTitle:'Move selection'});
        check(type+' caption preserves its native meaning '+selectedCount,
            title.textContent===(type==='participant'?'Add to group':'Move selection')&&
            confirmButton.textContent===(type==='participant'?'Add':selectedCount===1?'Move selected item':'Move selected items'));
    }
    const oldManager=execFileSync('git',['show','1e32048:amd/src/course_manager.js'],{cwd:rootPath,encoding:'utf8',maxBuffer:2e6});
    const normalizedManager=source.replace(/\r\n/g,'\n');
    const producerManager=execFileSync('git',['show','ad62069:amd/src/course_manager.js'],{cwd:rootPath,encoding:'utf8',maxBuffer:2e6}).replace(/\r\n/g,'\n');
    check('SM2a complete controller matches approved producer',normalizedManager===producerManager);
    const smStart=normalizedManager.indexOf('// Initialise the manager.\n/**\n * SM-RENDU:'),
        smEnd=normalizedManager.indexOf('export const init =',smStart);
    check('SM2a bounded initialization helper',smStart>=0&&smEnd>smStart);
    const preSmManager=normalizedManager.slice(0,smStart)+'// Initialise the manager.\n'+normalizedManager.slice(smEnd);
    const restoredManager=preSmManager
        .replace("import Log from 'core/log';\n",'')
        .replace("import {createStore} from './local/sm/store';\n",'')
        .replace("import {buildParticipantIndex, filterParticipantIds} from './local/sm/index';\n",'')
        .replace('export const init = (rootId, courseId, options = {}) => {','export const init = (rootId, courseId) => {')
        .replace("        if (options && options.renderingmode === 'reactive') {\n            runSafely(() => startOnDemandState(root, courseId));\n        }\n",'')
        .replace("    const title = modal.querySelector('.easyedu-modal-title');\n    const moveTitle = title?.textContent || '';\n",'')
        .replace("        if (title) { title.textContent = type === 'participant' ? (labels.addparticipanttitle || moveTitle) : moveTitle; }\n",'')
        .replace("confirmButton.textContent = type === 'participant' ? (labels.addparticipantconfirm || '') : selectedCount === 1 ?",'confirmButton.textContent = selectedCount === 1 ?');
    check('Every native course command unchanged by approved copy',restoredManager.replace(/\r\n/g,'\n')===oldManager.replace(/\r\n/g,'\n'));
    const result=JSON.stringify({surface:'student-management',level:0,passed:Object.keys(checks).length,failed:0,checks},null,2);
    if(process.argv[2])fs.writeFileSync(path.resolve(process.argv[2]),result+'\n');
    console.log(result);
})().catch(error=>{console.error(error);process.exitCode=1;});
