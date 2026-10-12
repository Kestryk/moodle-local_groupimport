// Reusable Student Management logic verifier. No browser, database or business writes.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const rootPath = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(rootPath, 'amd/src/course_manager.js'), 'utf8');
const checks = {};
const check = (name, condition) => { assert.ok(condition, name); checks[name] = true; };
const notices = [], attributes = {}, busy = [];
const root = {
    getAttribute: () => JSON.stringify({ajaxerror:'Localized request failure',actioninprogress:'Working'}),
    setAttribute: (name, value) => { attributes[name] = value; },
    classList: {toggle: (name, value) => busy.push(value)},
    querySelector: () => null
};
let response = {success:false,error:'Explicit server failure'};
const context = {
    console, URLSearchParams, FormData, Promise, Error, TypeError,
    Motion:{}, Guide:{}, enhanceSelect(){}, enhanceMultipleSelect(){}, closeChoicesWithin(){}, snapshotMemberPairs(){},
    window:{}, document:{getElementById:()=>root, querySelectorAll:()=>[root]},
    M:{cfg:{sesskey:'synthetic-session',wwwroot:'http://synthetic.invalid'}},
    require: (names, done) => done({add: (message, options) => notices.push({message,type:options.type})}),
    fetch: () => response instanceof Error ? Promise.reject(response) : Promise.resolve({json:()=>Promise.resolve(response)})
};
const executable = source.replace(/^import .+;\r?\n/gm, '').replace('export const init =', 'const init =');
vm.runInNewContext(executable + '\nglobalThis.api={postAction,postFormAction,handleActionError};', context);
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
    console.log(JSON.stringify({surface:'student-management',level:0,passed:Object.keys(checks).length,checks},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
