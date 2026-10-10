// Explicit R10-31 paint-only successor. Preserve older guards and their pins.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base='2469155';
const norm=s=>s.replace(/\r\n/g,'\n');
const read=f=>norm(fs.readFileSync(path.join(root,f),'utf8'));
const old=f=>norm(execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}));
for(const file of ['manage.php','classes/local/guide_discovery.php','templates/easyedu_guide.mustache','amd/src/easyedu_guide.js',
    'amd/build/easyedu_guide.min.js','amd/build/easyedu_guide.min.js.map','easyedu-guide-kit/amd/src/easyedu_guide.js',
    'lang/en/local_groupimport.php','lang/fr/local_groupimport.php']) assert.ok(read(file)===old(file),'Complete source preserved: '+file);
const scss=read('scss/easyedu/components/_guide-discovery.scss');
const start=scss.indexOf('    // Main slide title uses'),end=scss.indexOf('    .easyedu-guide-slide__kicker',start);
assert.ok(start>=0&&end>start);
assert.ok(scss.slice(0,start)+scss.slice(end)===old('scss/easyedu/components/_guide-discovery.scss'),'Only main slide-title recipe changed');
const omit=css=>css.replace(/[^{}]*\.easyedu-guide-slide__header > h3[^{}]*\{[^{}]*\}\s*/g,'\n').replace(/\n{2,}/g,'\n');
assert.ok(omit(read('styles.css'))===omit(old('styles.css')),'Complete unrelated CSS preserved');
console.log('PASS only main slide title paint; all commands, content, Motion, modal/card/body typography unchanged.');
