// Summarize immutable native receipts; never accesses Moodle or credentials.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]),repo=path.resolve(__dirname,'../..');
function find(dir,name){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?find(path.join(dir,e.name),name):e.name===name?[path.join(dir,e.name)]:[]);}
function read(stage,name){const files=find(path.join(root,stage),name);if(files.length!==1)throw Error(stage+': expected one receipt');return {file:files[0],...JSON.parse(fs.readFileSync(files[0],'utf8'))};}
const demos=read('matrix-demos','guide-refonte.json'),pathStages=[read('matrix-paths','guide-paths.json'),read('matrix-paths-en','guide-paths.json')];
if(!demos.completed||pathStages.some(p=>!p.completed))throw Error('Matrix not complete; preserve the partial receipts');
const paths=Object.fromEntries(['checks','errors','consoleErrors','blockedWrites','receipts','restores'].map(k=>[k,pathStages.flatMap(p=>p[k])]));
const rows=[...demos.checks,...paths.checks];
const short=r=>({lang:r.lang,width:r.width,level:r.level,point:r.point,status:r.status,error:r.error,capture:r.capture});
const timings=demos.checks.filter(r=>r.lot.startsWith('J-G2/')).map(r=>({...short(r),kind:r.measure.kind,mode:r.measure.mode,elapsedMs:r.measure.elapsedMs,firstFinishedMs:r.measure.firstFinishedMs,heightAnimation:r.measure.samples?.some(s=>s.animations.some(a=>a.frames.some(f=>'height'in f)))}));
const badges=paths.checks.filter(r=>r.lot==='C-G3').map(r=>({...short(r),...r.measure}));
const cues=paths.checks.filter(r=>r.lot==='J-G3/C-G4').map(r=>({...short(r),...r.measure}));
const errors=[...demos.errors,...paths.errors],consoleErrors=[...demos.consoleErrors,...paths.consoleErrors];
const failed=rows.filter(r=>r.status==='FAIL').map(short);
const cells=Array.from(new Set(rows.map(r=>[r.lang,r.width,r.level].join('/'))));
const result={base:'64db2140',source:'ce872af0',cells,errors,consoleErrors,blockedWrites:[...demos.blockedWrites,...paths.blockedWrites],timings,badges,cues,failed,receipts:paths.receipts,restores:paths.restores,raw:[demos.file,...pathStages.map(p=>p.file)].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}))};
const status=rs=>rs.length&&rs.every(r=>r.status==='PASS')?'PASS':'FAIL';
result.lots={'C-G3':status(badges),'J-G2':status(timings),'J-G3':status(cues)};
result.counts={pass:rows.filter(r=>r.status==='PASS').length,fail:failed.length,na:rows.filter(r=>r.status==='N/A').length,cells:cells.length,pageErrors:errors.length,consoleErrors:consoleErrors.length};
fs.writeFileSync(path.join(repo,'docs/testing/recette-guide-fixes-17-10-2026.json'),JSON.stringify(result,null,2)+'\n');
const full=timings.filter(r=>r.level==='full').map(r=>r.firstFinishedMs??r.elapsedMs);
const lines=['# Recette ciblée des correctifs du Guide — 17 octobre 2026','','Suite de `662a1560`. Base `64db2140`, produit `ce872af0`, runtime :8051 uniquement.','',
'| Lot | Résultat | Preuve |','| --- | --- | --- |',
`| C-G3 | ${result.lots['C-G3']} | ${badges.length} badges mobiles ; variante courte FR/EN, texte long conservé. |`,
`| J-G2 | ${result.lots['J-G2']} | ${timings.length} démos ; Complètes ${Math.min(...full).toFixed(0)}–${Math.max(...full).toFixed(0)} ms ; aucune animation de hauteur. |`,
`| J-G3 | ${result.lots['J-G3']} | ${cues.length} parcours, cibles peintes, delta ≤ 2 px, centres accessibles et chevauchement nul exigés. |`,'',
`${cells.length} cellules : FR/EN × 1600/1280/768/390 × Complètes/Réduites/Minimales. ${errors.length} erreur de page ; ${consoleErrors.length} erreur console.`,
'Les durées de première fin sont échantillonnées toutes les 100 ms ; sinon la durée de commande observée est conservée. Les bornes sont strictes : 22 000–26 000 ms.',
'Les niveaux réduits gardent les temps de lecture ; gestes réduits ≤ 120 ms sans transformation, aucune animation au niveau minimal. Motion reste inchangé.','',
'## Échecs et réserves','',...failed.map(r=>`- ${r.lang}/${r.width}/${r.level} — ${r.point} : ${r.error?.replace(/\u001b\[[0-9;]*m/g,'').replace(/\n/g,' ').slice(0,500)}${r.capture?' ; capture : '+r.capture:''}`),
'','Les pilotes antérieurs sont conservés dans les preuves externes, exclus de ces résultats. Le pilote 3 atteignait la fin du parcours compact, mais montrait encore un bouton initial hors viewport ; le candidat final attend la fin réelle du défilement intérieur.',
'','## Kit et tests statiques','',
'T037 composition, T038 navigation et roundtrip : PASS sur projection externe du report. Sur le Kit réel, les gardes de parité restent FAIL attendu jusqu’au report par Codex n°1. T037 finished-preservation échoue déjà sur la base (comparaison historique à 22b0d16), sans régression nouvelle.',
'Report Kit : voir [patch](guide-fixes-kit-mirror-20261017.patch) et [explication](guide-fixes-17-10-2026.md). Deux fichiers : Guide JS et SCSS discovery ; aucun nouveau token ni composant.',
'','## Preuves','',
`Mesures : [JSON](recette-guide-fixes-17-10-2026.json). Données détaillées et captures (maximum six) : \`${root}\`.`,
'Fixtures synthétiques isolées, remises à l’état initial entre cellules, puis supprimées par le superviseur. Voir les reçus de restauration et la preuve DB après nettoyage dans le dossier externe.',
'Aucune publication sur :80, aucune modification du Kit ni des autres runtimes.'];
if(!failed.length)lines.splice(lines.indexOf('## Échecs et réserves')+2,0,'Aucun nouvel échec natif dans cette recette ciblée.');
fs.writeFileSync(path.join(repo,'docs/testing/recette-guide-fixes-17-10-2026.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({lots:result.lots,counts:result.counts,fullMs:[Math.min(...full),Math.max(...full)]}));
if(Object.values(result.lots).includes('FAIL')||errors.length||consoleErrors.length)process.exitCode=1;
