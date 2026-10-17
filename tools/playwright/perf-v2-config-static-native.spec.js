const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
test('Configuration C public HTTP cache native own8051',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultNavigationTimeout(120000);
 const origin=new URL(process.env.EASYEDU_MOODLE_URL).origin;if(origin!=='http://localhost:8051')throw Error('Own8051 only');
 const root='C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017';
 const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]);
 const source=walk(root+'/A').filter(f=>path.basename(f)==='perf-v2-config-raw.json').map(f=>JSON.parse(fs.readFileSync(f,'utf8'))).find(d=>d.completed);if(!source)throw Error('Completed A evidence required');
 const resources=source.measurements.flatMap(r=>r.resources),prefixes=['/lib/javascript.php/','/lib/requirejs.php/','/theme/font.php/','/theme/image.php/','/theme/styles.php/'];
 const urls=prefixes.map(prefix=>resources.find(r=>new URL(r.url).pathname.startsWith(prefix))?.url).filter(Boolean);
 const report={phase:'C',kind:'public-static-cache-only-not-an-authenticated-page-timing',source:'a5d0ffab',resources:[]};
 fs.mkdirSync(info.outputDir,{recursive:true});const save=()=>fs.writeFileSync(info.outputPath('config-static-headers.json'),JSON.stringify(report,null,2));save();
 await page.goto(origin+'/login/index.php',{waitUntil:'domcontentloaded'});
 for(const url of urls){
  if(new URL(url).origin!==origin)throw Error('Unexpected resource origin');
  const row=await page.evaluate(async url=>{
   const allowed=['cache-control','etag','last-modified','expires','vary','content-encoding'];
   const fetchOnce=async()=>{performance.clearResourceTimings();const response=await fetch(url,{cache:'default'});const bytes=(await response.arrayBuffer()).byteLength;const entry=performance.getEntriesByName(url).at(-1);return {status:response.status,headers:Object.fromEntries(allowed.map(k=>[k,response.headers.get(k)]).filter(([,v])=>v!==null)),decodedBytes:bytes,transferBytes:entry?.transferSize??null,encodedBytes:entry?.encodedBodySize??null};};
   return {url,first:await fetchOnce(),second:await fetchOnce()};
  },url);
  const headers=row.first.headers,conditional=headers.etag?{'If-None-Match':headers.etag}:headers['last-modified']?{'If-Modified-Since':headers['last-modified']}:null;
  if(conditional){const response=await page.request.get(url,{headers:conditional,timeout:90000});row.conditional={validator:headers.etag?'ETag':'Last-Modified',status:response.status()};await response.dispose();}
  report.resources.push(row);save();expect(row.first.status).toBe(200);expect(row.second.status).toBe(200);
 }
 report.completed=true;save();expect(report.resources.length).toBeGreaterThanOrEqual(4);
});
