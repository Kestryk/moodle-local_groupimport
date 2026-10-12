// Reusable Student Management logic verifier. No browser, database or business writes.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
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
    check('Actions dependencies preserve original IDs',
        /'id' => 'try-selection',\s*'requiresStep' => 'try-drag'/.test(manage) &&
        /'id' => 'try-context',\s*'requiresStep' => 'try-selection'/.test(manage));
    console.log(JSON.stringify({surface:'student-management',level:0,passed:Object.keys(checks).length,checks},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
