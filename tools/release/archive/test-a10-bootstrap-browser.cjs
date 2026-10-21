/* eslint-env node */
// Isolated CSS fixture, not a native Moodle 4.5 installation test.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const [sassPath, playwrightPath, chromePath, moodle45, moodle51, output] = process.argv.slice(2);
assert.ok([sassPath, playwrightPath, chromePath, moodle45, moodle51, output].every(p => p && path.isAbsolute(p)),
 'Pass absolute Sass, Playwright, Chrome, Moodle 4.5/5.1 source paths and external output directory');
assert.ok(!output.toLowerCase().startsWith(root.toLowerCase() + path.sep));
fs.mkdirSync(output, {recursive:true});
const sass = require(sassPath);
const {chromium} = require(playwrightPath);
(async () => {
 const results = [], errors = [];
 const browser = await chromium.launch({executablePath:chromePath,headless:true});
 try {
  const plugin = fs.readFileSync(root+'/styles/student-management.css','utf8');
  const template = fs.readFileSync(root+'/templates/manage.mustache','utf8');
  const tags = template.match(/<select\b[\s\S]*?>/g).filter(t=>/\bform-select\b/.test(t));
  for (const [version, moodle] of [['4.5',moodle45],['5.1',moodle51]]) {
   const css = sass.compile(moodle+'/theme/boost/scss/bootstrap/bootstrap.scss',{style:'compressed',logger:sass.Logger.silent}).css;
   for (const lang of ['fr','en']) for (const width of [1600,390]) {
    const page = await browser.newPage({viewport:{width,height:900}});
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
    const label = lang==='fr'?'Groupement':'Grouping';
    const selects = tags.map((t,i)=>t.replace(/\s+hidden\b/,'').replace(/\s+id="[^"]*"/,'').replace(/\s+name="[^"]*"/,'')
       .replace(/>$/,` name="test${i}" aria-label="${label} ${i}">`)+ '<option value="a">Alpha</option><option value="b">Beta</option></select>').join('');
    await page.setContent(`<html lang="${lang}"><head><style>${css}\n${plugin}</style></head><body><main class="easyedu-ui local-groupimport-easystud" style="padding:16px"><form>${selects}</form><button type="button"><span id="icon" class="fa fa-plus easyedu-inline-icon--leading" aria-hidden="true">+</span>${lang==='fr'?'Ajouter':'Add'}</button><button id="named"><span class="visually-hidden">${label}</span><span aria-hidden="true">+</span></button></main></body></html>`);
    for (const select of await page.locator('select').all()) await select.selectOption(['b']);
    await page.getByRole('button',{name:label,exact:true}).click();
    const geometry = await page.evaluate(()=>{
     const icon=document.querySelector('#icon'), hidden=document.querySelector('.visually-hidden');
     return {iconMargin:parseFloat(getComputedStyle(icon).marginInlineEnd),hiddenWidth:hidden.getBoundingClientRect().width,
      hiddenHeight:hidden.getBoundingClientRect().height, overflow:document.documentElement.scrollWidth>innerWidth,
      selects:[...document.querySelectorAll('select')].map(s=>({width:s.getBoundingClientRect().width,height:s.getBoundingClientRect().height,value:s.value,fontSize:parseFloat(getComputedStyle(s).fontSize)})),
      values:[...new FormData(document.querySelector('form')).values()]};
    });
    assert.equal(geometry.iconMargin,4); assert.equal(geometry.hiddenWidth,1); assert.equal(geometry.hiddenHeight,1);
    assert.equal(geometry.overflow,false); assert.deepEqual(geometry.values,Array(6).fill('b'));
    geometry.selects.forEach(s=>{assert.ok(s.width>30 && s.height>20 && s.fontSize>=14);assert.equal(s.value,'b');});
    results.push({version,lang,width,...geometry}); await page.close();
   }
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(output+'/browser-results.json', JSON.stringify({status:'PASS',scope:'Isolated Boost CSS fixture; no Moodle bootstrap or native certification',results,errors},null,2));
  console.log(JSON.stringify({status:'PASS',cases:results.length,selectMeasurements:results.length*6,errors:errors.length}));
 } finally {await browser.close();}
})().catch(e=>{fs.writeFileSync(output+'/browser-failure.txt',e.stack);console.error(e.stack);process.exitCode=1;});
