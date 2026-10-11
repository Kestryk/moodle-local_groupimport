// Offline colour conversion of captured native frames; never loads Moodle.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
assert.equal(process.argv.length,4,'Usage: <playwright modules> <native diagnostic JSON>');
const modules=process.argv[2],file=path.resolve(process.argv[3]);
const approved=path.resolve(process.env.LOCALAPPDATA,'EasyEdu/artifacts/easystud/authenticated');
assert.ok(file.startsWith(approved+path.sep));assert.equal(path.basename(file),'view-toggle-paint-diagnostic-native.json');
const input=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(input.diagnosticOnly,true);
assert.ok(input.rows.length>0&&input.rows.length<=6);assert.ok(input.rows.every(r=>r.frames.length<500));
const output=file.replace(/\.json$/,'-contrast-corrected.json');assert.ok(!fs.existsSync(output),'Immutable generated measurement');
const {chromium}=require(path.resolve(modules,'playwright'));
(async()=>{const b=await chromium.launch({headless:true});try{
 const page=await b.newPage();
 const rows=await page.evaluate(rows=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const rgba=value=>{if(!CSS.supports('color',value))throw Error('Unsupported native colour');ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);const c=[...ctx.getImageData(0,0,1,1).data];if(c[3]!==255)throw Error('Unexpected translucent tile colour');return c;};
  const luminance=c=>{const v=c.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
  return rows.map(r=>{const frames=r.frames.map(f=>{const fgRgba=rgba(f.fg),bgRgba=rgba(f.bg),a=luminance(fgRgba),b=luminance(bgRgba);return{...f,fgRgba,bgRgba,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});return{mode:r.mode,frames,minContrast:Math.min(...frames.map(f=>f.contrast))};});
 },input.rows);
 const proof={rows,colourConversion:'native canvas sRGB bytes; CSS.supports; opaque asserted',legacyRegexContrastRejected:true,moodleOpened:false,settingsWrites:false,businessWrites:false,humanAccepted:false};
 fs.writeFileSync(output,JSON.stringify(proof,null,2));
 console.log(JSON.stringify({output,cases:rows.map(r=>({mode:r.mode,frames:r.frames.length,minContrast:r.minContrast,minimum:r.frames.find(f=>f.contrast===r.minContrast)})),moodleOpened:false}));
 }finally{await b.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
