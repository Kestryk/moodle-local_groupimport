const {test,expect}=require('@playwright/test');
const {spawnSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
test('S9 served Moodle templates escape names once',async({},info)=>{
 test.setTimeout(120000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);
 if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const result=spawnSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[
  path.join(__dirname,'../release/test-server-name-escaping-served.php'),
  'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle',
 ],{encoding:'utf8',timeout:90000});
 fs.writeFileSync(info.outputPath('renderer.stdout.log'),result.stdout||'');
 fs.writeFileSync(info.outputPath('renderer.stderr.log'),result.stderr||'');
 expect(result.error?.message||'').toBe('');expect(result.status).toBe(0);
 const report=JSON.parse(result.stdout);expect(report.passed).toBe(true);
 expect(report.cases).toHaveLength(3);expect(report.businessWrites).toBe(0);
 fs.writeFileSync(info.outputPath('renderer.json'),JSON.stringify(report,null,2));
});
