// Summarize immutable native receipts; never accesses Moodle or credentials.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]),repo=path.resolve(__dirname,'../..');
function find(dir,name){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?find(path.join(dir,e.name),name):e.name===name?[path.join(dir,e.name)]:[]);}
function read(stage,name){const files=find(path.join(root,stage),name);if(files.length!==1)throw Error(stage+': expected one receipt');return {file:files[0],...JSON.parse(fs.readFileSync(files[0],'utf8'))};}
const demos=read('matrix-demos','guide-refonte.json'),pathStages=[read('matrix-paths-settled-fr','guide-paths.json'),read('matrix-paths-settled-en','guide-paths.json')];
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
const blockedWrites=[...demos.blockedWrites,...paths.blockedWrites].map(({data,...r})=>({...r,action:r.action||new URLSearchParams(data||'').get('action')}));
const result={base:'64db2140',source:{demos:'ce872af0',paths:'359c4739'},cells,errors,consoleErrors,blockedWrites,timings,badges,cues,failed,receipts:paths.receipts,restores:paths.restores,raw:[demos.file,...pathStages.map(p=>p.file)].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}))};
const status=(rs,expected)=>rs.length===expected&&rs.every(r=>r.status==='PASS')?'PASS':'FAIL';
result.expected={cells:24,badges:18,timings:72,paths:72,nativeAdds:12};
result.lots={'C-G3':status(badges,18),'J-G2':status(timings,72),'J-G3':status(cues,72)};
result.nativeAddsCorrect=paths.receipts.length===12&&paths.receipts.every(r=>r.receipt.success&&r.receipt.added===1&&r.receipt.existing===0);
if(!result.nativeAddsCorrect)result.lots['J-G3']='FAIL';
if(cells.length!==24)for(const lot of Object.keys(result.lots))result.lots[lot]='FAIL';
result.counts={pass:rows.filter(r=>r.status==='PASS').length,fail:failed.length,na:rows.filter(r=>r.status==='N/A').length,cells:cells.length,pageErrors:errors.length,consoleErrors:consoleErrors.length};
fs.writeFileSync(path.join(repo,'docs/testing/recette-guide-fixes-17-10-2026.json'),JSON.stringify(result,null,2)+'\n');
const full=timings.filter(r=>r.level==='full').map(r=>r.firstFinishedMs??r.elapsedMs);
const lines=['# Recette ciblée des correctifs du Guide — 17 octobre 2026','','Suite de `662a1560`. Base `64db2140`, démos `ce872af0`, parcours `359c4739`, runtime :8051 uniquement.','Les compléments changent seulement le ciblage, le docking et le défilement des parcours ; les démos et leur horloge sont identiques. Leurs 72 lectures ne sont donc pas répétées.','',
'| Lot | Résultat | Preuve |','| --- | --- | --- |',
`| C-G3 | ${result.lots['C-G3']} | ${badges.length} badges mobiles ; variante courte FR/EN, texte long conservé. |`,
`| J-G2 | ${result.lots['J-G2']} | ${timings.length} démos ; Complètes ${Math.min(...full).toFixed(0)}–${Math.max(...full).toFixed(0)} ms ; aucune animation de hauteur. |`,
`| J-G3 | ${result.lots['J-G3']} | ${cues.length} parcours, cibles peintes, delta ≤ 2 px, centres accessibles et chevauchement nul exigés. |`,'',
`${cells.length} cellules : FR/EN × 1600/1280/768/390 × Complètes/Réduites/Minimales. ${errors.length} erreur de page ; ${consoleErrors.length} erreur console.`,
'Les durées de première fin sont échantillonnées toutes les 100 ms ; sinon la durée de commande observée est conservée. Les bornes sont strictes : 22 000–26 000 ms.',
'Les niveaux réduits gardent les temps de lecture ; gestes réduits ≤ 120 ms sans transformation, aucune animation au niveau minimal. Motion reste inchangé.','',
'## Échecs et réserves','',...failed.map(r=>`- ${r.lang}/${r.width}/${r.level} — ${r.point} : ${r.error?.replace(/\u001b\[[0-9;]*m/g,'').replace(/\n/g,' ').slice(0,500)}${r.capture?' ; capture : '+r.capture:''}`),
'','Les pilotes antérieurs sont conservés dans les preuves externes, exclus de ces résultats. Le pilote 3 atteignait la fin du parcours compact, mais montrait encore un bouton initial hors viewport ; le candidat final attend la fin réelle du défilement intérieur.',
'La première passe de parcours sur ce872af0 a été arrêtée après la cible précédente conservée à try-context en FR1600/Réduites. Capture et reçu restent dans matrix-paths. Seuls le processus Playwright possédé et le superviseur EN encore en attente ont été fermés par PID vérifié ; le superviseur FR a nettoyé sa fixture. Le correctif bc3ac105 impose la nouvelle cible avant le défilement instantané. Les deux étapes FR/EN finales rejouent tous les parcours.',
'La passe suivante sur bc3ac105 a isolé les cas 768 : repli encore mesuré avant sa fin et marge basse appliquée seulement au défilement extérieur. Le pilote 359c4739 passe les trois parcours FR768/Réduites : entrée auparavant recouverte sur 18 304 px², puis 0 ; bouton de carte remonté de y=914,36 à y=776,36. La spec successive attend la fin des animations et ne demande pas un effacement à une barre sortante dont la sélection est déjà vide. Les oracles de cible et de non-recouvrement sont conservés.',
'','## Kit et tests statiques','',
'T037 composition, T038 navigation et roundtrip : PASS sur projection externe du report. Sur le Kit réel, les gardes de parité restent FAIL attendu jusqu’au report par Codex n°1. T037 finished-preservation échoue déjà sur la base (comparaison historique à 22b0d16), sans régression nouvelle.',
'Report Kit : voir [patch](guide-fixes-kit-mirror-20261017.patch) et [explication](guide-fixes-17-10-2026.md). Deux fichiers : Guide JS et SCSS discovery ; aucun nouveau token ni composant.',
'','## Preuves','',
`Mesures : [JSON](recette-guide-fixes-17-10-2026.json). Données détaillées et captures (maximum six) : \`${root}\`.`,
'Fixtures synthétiques isolées, remises à l’état initial entre cellules, puis supprimées par le superviseur. Voir les reçus de restauration et la preuve DB après nettoyage dans le dossier externe.',
'Aucune publication sur :80, aucune modification du Kit ni des autres runtimes.'];
if(!failed.length)lines.splice(lines.indexOf('## Échecs et réserves')+2,0,'Aucun nouvel échec natif dans cette recette ciblée.');
lines.push('','## Positions de checklist relevées aux entrées','',
'Les classes ci-dessous reflètent le placement existant ; le correctif SCSS lui permet de prendre effet. Les rectangles et les transitions suivantes restent dans le JSON.','',
'| Langue | Largeur | Parcours | Niveau | Docking | Chevauchement px² |',
'| --- | ---: | --- | --- | --- | ---: |');
for(const r of cues)for(const cue of r.cues||[])if(cue.stage==='entry'||cue.stage==='open sheet')lines.push(`| ${r.lang} | ${r.width} | ${r.point} | ${r.level} | ${cue.class.split(' ').filter(c=>c.startsWith('is-docked')||c==='is-minimized').join(' ')} | ${cue.overlap} |`);
fs.writeFileSync(path.join(repo,'docs/testing/recette-guide-fixes-17-10-2026.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({lots:result.lots,counts:result.counts,fullMs:[Math.min(...full),Math.max(...full)]}));
if(Object.values(result.lots).includes('FAIL')||errors.length||consoleErrors.length)process.exitCode=1;
