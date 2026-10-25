const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../playwright'),read=f=>fs.readFileSync(path.join(dir,f),'utf8').replace(/\r\n/g,'\n');
const original=read('guide-introduction-t014-native.spec.js');
const successor=read('guide-introduction-t014-budget-successor.spec.js')
 .replace('with bounded matrix budget','in native Moodle').replace('900000','360000')
 .replace('   const caseStarted=Date.now();\n','').replace('elapsedMs:Date.now()-caseStarted,','')
 .replace(/^   fs\.writeFileSync\(info\.outputPath\('guide-introduction-t014-partial\.json'\),.*\);\n/m,'');
assert.equal(successor,original);
console.log('PASS: exact native predecessor reconstructed outside global budget/progress instrumentation');
