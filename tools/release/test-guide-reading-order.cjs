// Actual localized payload and canonical rendered order, without native writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),renderer={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[2],'utf8').replace('export default mustache;','module.exports=mustache;'),renderer);
let cases=0;
for(const language of ['en','fr']){
 const data=JSON.parse(execFileSync(process.argv[3],[path.join(__dirname,'guide-demonstration-entry-fixture.php'),language],{encoding:'utf8'}));
 assert.equal(data.templateData.slides.length,12);
 for(const slide of data.templateData.slides){
  const html=renderer.module.exports.render(fs.readFileSync(path.join(root,'templates/easyedu_guide.mustache'),'utf8'),{...data.templateData,slides:[slide]});
  if(slide.commonintroduction){
   const explanation=html.indexOf('data-easyedu-guide-introduction');assert.ok(explanation>html.indexOf('easyedu-guide-slide__content'));
   const visual=html.indexOf(slide.discoveryscene?'data-easyedu-guide-scene=':'class="easyedu-guide-visual');
   if(visual>=0)assert.ok(visual<explanation,slide.id+' visual precedes topics');
   if(slide.guidedpath)assert.ok(explanation<html.indexOf('class="easyedu-guide-guided-card"'),slide.id+' topics precede optional path');
  }
  if(slide.discoveryscene?.kind==='membership'){
   assert.equal(slide.discoveryscene.introalreadyexplained,true);
   assert.ok(!html.includes('class="easyedu-guide-scene__intro"'));
   assert.equal(html.includes(slide.discoveryscene.note),false,'Redundant membership prose not repeated');
  }
  cases++;
 }
}
console.log(`PASS ${cases} current EN/FR slide payloads, visual-before-explanation order and explicit redundant-copy opt-in.`);
