'use strict';
/** Generate an external index, never rewrite raw predecessor evidence. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const repo = path.resolve(__dirname, '../..');
const root = path.resolve(process.argv[2] || '');
if (process.argv.length < 3 || root === repo || root.startsWith(repo + path.sep))
    throw new Error('An explicit external artifact root is required.');
function walk(dir) {
    return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() && !/profile/i.test(e.name) ?
        walk(path.join(dir,e.name)) : e.isFile() ? [path.join(dir,e.name)] : []);
}
const files = walk(root);
const indexPath = path.join(root,'ROADMAP-RAW-INDEX.json');
const prior = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath,'utf8')) : {};
// Playwright's generated error-context may contain a native footer URL with a
// sesskey. Redact only finished, owned generated contexts, never raw measurements
// or another run's active file. Preserve all diagnosis and immutable source copy.
const contextsSanitized = [...(prior.contextsSanitized || [])];
for (const file of files.filter(f=>path.basename(f)==='error-context.md')) {
    let dir = path.dirname(file), complete = false;
    while (dir.startsWith(root + path.sep)) {
        const marker = path.join(dir,'cleanup.json');
        if (fs.existsSync(marker)) {
            const c = JSON.parse(fs.readFileSync(marker,'utf8'));
            complete = c.ownedChildStopped && c.credentialsCleared && c.leaseReleased &&
                fs.existsSync(path.join(dir,'artifact-manifest.json')); break;
        }
        dir = path.dirname(dir);
    }
    if (!complete) continue;
    const before = fs.readFileSync(file,'utf8');
    const after = before.replace(/(\b(?:sesskey|wstoken|access_token|password)=)[^&\s"'<>]+/gi,'$1[REDACTED]');
    if (after !== before) {fs.writeFileSync(file,after);if(!contextsSanitized.includes(file))contextsSanitized.push(file);}
}
const reports = files.filter(f=>/^T05[368]-(?:raw|panels|menu-entry|navigation|small-menus|coverage)\.json$/.test(path.basename(f)));
const evidence = reports.map(file=> {
    const body = fs.readFileSync(file), r = JSON.parse(body);
    return {file, bytes:body.length, sha256:crypto.createHash('sha256').update(body).digest('hex'),
        task:r.task, completed:r.completed === true, passed:r.passed === true,
        cases:r.cases?.length, states:r.states?.map(s=>typeof s==='string'?s:s.name),
        gaps:r.gaps?.length, blockedWrites:r.blockedWrites?.length,
        violations:r.axe?.map(a=>({name:a.name, ids:a.violations.map(v=>v.id)})), servedFiles:r.servedFiles};
});
const cleanup = files.filter(f=>path.basename(f)==='cleanup.json').map(file=>{
    const r = JSON.parse(fs.readFileSync(file,'utf8'));
    return {file,runId:r.runId,credentialsCleared:r.credentialsCleared,leaseReleased:r.leaseReleased,
        ownedChildStopped:r.ownedChildStopped,fixtureRequested:r.fixtureRequested,fixtureCleanupComplete:r.fixtureCleanupComplete};
});
const index = {date:'2026-10-13',sourceHead:cp.execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    runtime:'localhost:8051 only, prior SM-RENDU1 deployment43b5b4b; not current Codex1 preview',
    evidence, cleanup, contextsSanitized, humanAccepted:false,
    caveat:'Audit runner completion is NOT product accessibility/visual acceptance; incomplete and failed predecessors retained.'};
fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({reports:evidence.length,cleanup:cleanup.length,
    allCleanup:cleanup.every(c=>c.credentialsCleared&&c.leaseReleased&&c.ownedChildStopped&&c.fixtureCleanupComplete)}));
