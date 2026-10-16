// Summarize preserved browser assertions; never turn a wrapper exit code into product acceptance.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const evidence='C:/dev/Moodle 51 Perf/moodle/local/recette-soir-20261016';
const runtime='C:/dev/Moodle 51 Perf/moodle/local/groupimport';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,entry.name);if(entry.isDirectory()){if(entry.name!=='sync')walk(file);}else files.push(file);
}}walk(evidence);
const mains=files.filter(f=>/recette-soir(?:-remainder)?\.json$/.test(f)).sort((a,b)=>fs.statSync(a).mtimeMs-fs.statSync(b).mtimeMs);
const followups=files.filter(f=>/recette-soir-(?:followup|headers(?:-desktop)?)\.json$/.test(f)).sort((a,b)=>fs.statSync(a).mtimeMs-fs.statSync(b).mtimeMs);
if(!mains.length||!followups.length)throw Error('Both preserved main and focused reports are required');
const allReports=[...mains,...followups].map(file=>({file,data:read(file)}));
const effective=new Map(),superseded=[];
const key=r=>[r.lang,r.width,r.lot,r.point].join('|');
for(const {file,data} of allReports){
 for(const value of data.checks){
  const row={...value,origin:file};
  if(row.lot==='DRAG'&&row.point==='native member drag to empty group'){
   superseded.push({...row,reason:'Unsupported member-row gesture; follow-up uses a global participant card, or its native compact Add to group alternative.'});continue;
  }
  const id=key(row);if(effective.has(id))superseded.push({...effective.get(id),reason:'Focused prerequisite/target/state correction; original evidence retained.'});
  effective.set(id,row);
 }
}
const cells=['fr','en'].flatMap(lang=>[1600,1280,768,390].map(width=>({lang,width})));
const lots=['K16-69','K16-13','K16-73','K16-70','K16-71','K16-72','K16-74','K16-65','K16-55','K16-14'];
for(const lot of [...lots,'SELECTION','DRAG','GUIDE','MASS-IMPORT','GLOBAL'])for(const cell of cells){
 const found=[...effective.values()].filter(r=>r.lot===lot&&r.lang===cell.lang&&r.width===cell.width);
 if(!found.length){const missing={...cell,lot,point:'Missing native coverage',status:'FAIL',error:'This cell was not executed.'};effective.set(key(missing),missing);}
}
const checks=[...effective.values()];
const runRoots=[...new Set(allReports.map(r=>path.resolve(path.dirname(r.file),'../..')))];
const runs=runRoots.map(dir=>({dir,result:fs.existsSync(path.join(dir,'runner-result.json'))?read(path.join(dir,'runner-result.json')):
 {runId:path.basename(dir),status:'interrupted-no-supervisor-result'},cleanup:fs.existsSync(path.join(dir,'cleanup.json'))?
 read(path.join(dir,'cleanup.json')):null}));
for(const run of runs.filter(r=>r.cleanup))for(const field of ['fixtureCleanupComplete','leaseReleased','ownedChildStopped','credentialsCleared']){
 if(!run.cleanup[field])throw Error('Incomplete cleanup '+field+' '+run.dir);
}
const pin=read(path.join(evidence,'sync/manifest.json'));
const cleanupProofs=read(path.join(evidence,'cleanup-proofs.json'));
for(const proof of cleanupProofs){
 if(['remainingCourses','remainingGroups','remainingGroupings','activeSyntheticUsers','remainingOwnCsvDrafts'].some(k=>proof[k]!==0)||
  proof.completeViewRestored===false)throw Error('SQL/config cleanup proof failed');
}
const provenance=read(path.join(evidence,'pin-source-differences.json'));
if(provenance.referenceMismatches.length||provenance.drift.length)throw Error('Unresolved runtime provenance');
const digest=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase();
for(const entry of pin.files){
 if(digest(path.join(runtime,entry.file))!==entry.sourceHash)throw Error('Product pin mismatch '+entry.file);
}
const screenshots=files.filter(f=>f.includes('playwright-output')&&f.endsWith('.png'));
if(screenshots.length>6)throw Error('More than six captures');
const status=rows=>rows.some(r=>r.status==='FAIL'||r.status==='RUNNING')?'FAIL':rows.every(r=>r.status==='N/A')?'N/A':'PASS';
const count=value=>checks.filter(r=>r.status===value).length;
const lotStatus=Object.fromEntries(lots.map(lot=>[lot,status(checks.filter(r=>r.lot===lot))]));
const failures=checks.filter(r=>r.status==='FAIL'||r.status==='RUNNING');
for(const row of failures){
 row.assessment=['K16-74','K16-55'].includes(row.lot)?'Différence de style mesurée ; comparer au périmètre exact du composant.':
 row.lot==='SEARCH'?'Hors lot : seuls les champs inline et Plus de filtres sont observés ; accès par le menu Rechercher non testé. Aucune preuve d’inaccessibilité globale.':
 row.point==='Missing native coverage'?'Non exécuté, pas un diagnostic produit.':
 'Assertion non satisfaite ; distinguer défaut produit, délai de la recette et prérequis à partir des mesures conservées.';
 if(row.lot==='K16-14'&&row.lang==='fr'&&row.width===390&&row.point==='fresh copy and unchecked on immediate reopening'){
  row.assessment='Séquence contaminée par le transfert compact précédent resté en attente : Gamma apparaît entre les snapshots, tandis que la copie vers Beta répond added=1. Ce contrôle ne prouve pas un défaut de copie ; réouverture/Annuler non atteints.';
 }
}
const errors=allReports.flatMap(r=>r.data.pageErrors||[]),consoleErrors=allReports.flatMap(r=>r.data.consoleErrors||[]);
const blocked=allReports.flatMap(r=>r.data.blockedWrites||[]);
const summary={source:provenance.referenceCommit,requestedBase:'caa43774af37d525fb96e0560f8569efba6977d1',provenance,branch:'work/codex2/recette-soir-20261016',
 lots:lotStatus,passed:count('PASS'),failed:failures.length,notApplicable:count('N/A'),pageErrors:errors,consoleErrors,blockedWrites:blocked,
 sourceHashesMatched:pin.files.length,captures:screenshots,runs,checks,superseded,cleanupProofs};
fs.writeFileSync(path.join(evidence,'measurements.json'),JSON.stringify(summary,null,2));
const portable={source:summary.source,requestedBase:summary.requestedBase,branch:summary.branch,lots:lotStatus,
 passed:summary.passed,failed:summary.failed,notApplicable:summary.notApplicable,pageErrors:errors,consoleErrors,blockedWrites:blocked,
 cleanupProofs,provenance:{referenceCommit:provenance.referenceCommit,referenceMismatches:provenance.referenceMismatches,drift:provenance.drift,
 sourceHashesMatched:pin.files.length},checks,runs:runs.map(r=>({runId:r.result.runId,status:r.result.status,cleanup:r.cleanup})),captures:screenshots};
fs.writeFileSync(path.join(root,'docs/testing/recette-soir-16-10-2026.json'),JSON.stringify(portable,null,2));
const plain=s=>String(s||'').replace(/\u001b\[[0-9;]*m/g,'');
const cellString=c=>c.lang.toUpperCase()+c.width;
const table=s=>String(s??'').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
let md='# Recette native du soir — 16 octobre 2026\n\n';
md+='Source Claude lue sans modification : `C:/dev/worktrees/easystud-claude-regressions-20261015`, branche `work/claude/easystud-regressions-20261015`, HEAD `caa43774`. Copie **localhost:8051**, '+pin.files.length+' fichiers produit vérifiés par SHA256, purge réussie. Aucun build ni changement de produit.\n\n';
md+='**Réserve de provenance corrigée** : la source a avancé pendant la préparation. Le manifeste de synchronisation indique `caa43774`, mais la comparaison aux objets Git identifie les '+pin.files.length+' fichiers servis comme `'+provenance.referenceCommit+'` (fins de ligne normalisées pour les textes), descendant de `caa43774`, passe de formatage PHP K16-17. Aucun écart depuis la synchronisation. Les résultats ci-dessous concernent donc ce runtime réellement mesuré ; le libellé `source:caa43774` des JSON préliminaires est seulement la base demandée, pas une preuve de version. Le rapport de comparaison est `pin-source-differences.json`.\n\n';
md+=`**${Object.values(lotStatus).filter(s=>s==='PASS').length} lots PASS, ${Object.values(lotStatus).filter(s=>s==='FAIL').length} lots FAIL.** Contrôles effectifs : **${count('PASS')} PASS, ${failures.length} FAIL, ${count('N/A')} N/A**. Erreurs console : **${consoleErrors.length}** ; erreurs de page : **${errors.length}** ; écritures hors actions autorisées : **${blocked.length}**.\n\n`;
md+='## Matrice par lot\n\n| Lot | '+cells.map(cellString).join(' | ')+' |\n| --- | '+cells.map(()=> '---').join(' | ')+' |\n';
for(const lot of lots)md+='| '+lot+' | '+cells.map(c=>status(checks.filter(r=>r.lot===lot&&r.lang===c.lang&&r.width===c.width))).join(' | ')+' |\n';
md+='\nN/A pour les croix téléphone/tiroir en desktop : ces fenêtres ne sont pas proposées à 1600/1280. Elles sont testées à 768/390. Le navigateur utilise une souris aux quatre largeurs ; ce n’est pas une preuve sur un téléphone physique.\n\n';
md+='## Conditions et déroulé\n\n';
md+='- Nettoyage SQL vérifié après tous les passages : **'+cleanupProofs.length+' fixtures**, zéro cours, groupe, groupement, utilisateur synthétique actif ou brouillon CSV restant ; option de vue complète restaurée.\n';
md+='- FR/EN × 1600/1280/768/390, hauteur1000 ; cours jetables dédiés avec **164 groupes,18 participants,12 groupements** chacun. Comptes `nologin` synthétiques ; aucune donnée de cours préexistante utilisée.\n';
md+='- Sélection des trois types, tris complets avec pagination et retour A → Z ; cartes vides ; dépliage/repliage ; surfaces sélectionnées ; icônes ; fermetures ; déplacement/copie ; Guide12 pages ; dépôt CSV et aperçu2 lignes sans confirmation de l’import.\n';
md+='- Vue complète initialement désactivée dans la configuration8051. Le contrôle ciblé active temporairement `showcompleteview` et restaure exactement la présence/valeur précédente au nettoyage. Il ouvre le groupement vide avant de mesurer son contenu.\n';
md+='- Survol : comparer l’état hors survol à l’état survolé, après Motion et après avoir quitté le focus de la carte. Cibler les boutons icônes `btn-link p-0`, pas le bouton-étiquette du groupement situé dans le même en-tête. Les mesures gardent également le hit-test au centre.\n';
md+='- Glisser : carte participant du catalogue vers un groupe vide en desktop, événement natif observé et preuve SQL. À768/390, le produit désactive volontairement le glisser : recette de l’équivalent natif « Ajouter à un groupe » par le menu de carte, sans présenter cette alternative comme un glisser tactile.\n';
md+='- K16-14 : décochée = retrait des deux origines sélectionnées ; cochée = conservation des origines, destination déjà membre sans doublon. Le contrôle ciblé complète par une copie fraîche (`added=1`) et une réouverture immédiate décochée, puis Annuler sans mutation. Appartenances SQL avant/après dans le JSON.\n\n';
md+='## Anomalies confirmées / contrôles non concluants\n\n';
if(!failures.length)md+='Aucune anomalie restante dans les contrôles effectifs. Les limites de preuve et passages préliminaires restent documentés ci-dessous.\n\n';
for(let i=0;i<failures.length;i++){
 const row=failures[i];md+=`### ${i+1}. ${row.lot} — ${cellString(row)} — ${row.point}\n\n`;
 md+='Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.\n\n';
 md+='Constat natif :\n\n```text\n'+plain(row.error)+'\n```\n\n';
 md+='Qualification : '+row.assessment+'\n\n';
 if(row.measure!==undefined)md+='Mesures :\n\n```json\n'+JSON.stringify(row.measure,null,2)+'\n```\n\n';
 const image=row.capture;
 if(image)md+='Capture de ce contrôle : `'+image+'`.\n\n';
 else md+='Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.\n\n';
 md+='Preuve détaillée : `'+row.origin+'`. Aucun correctif produit appliqué.\n\n';
}
md+='## PASS/FAIL par point\n\n| Cellule | Lot | Point | Résultat | Mesure courte |\n| --- | --- | --- | --- | --- |\n';
for(const row of checks){
 let measure='';const m=row.measure;
 if(m?.count!==undefined)measure=`${m.count} éléments ; ${m.first} → ${m.last}`;
 else if(m?.excess!==undefined)measure=`débordement page ${Math.max(0,m.excess)} px`;
 else if(m?.rows!==undefined&&Number.isFinite(m.rows))measure=`${m.rows} lignes ; import non appliqué`;
 else if(row.lot==='GUIDE'&&Array.isArray(m))measure=`${m.length} pages ; scrollLeft0`;
 else if(row.lot==='K16-14'&&m?.after)measure=`SQL ${m.before.rows.length} → ${m.after.rows.length} appartenances`;
 else if(m?.discDiameter)measure=`disque ${m.discDiameter} px`;
 else if(m?.width&&m?.radius!==undefined)measure=`${m.width} × ${m.height} px ; rayon ${m.radius}`;
 else if(row.status==='FAIL')measure=plain(row.error).split('\n').find(x=>x.includes('Received:'))||'Voir mesures/anomalie';
 md+=`| ${cellString(row)} | ${row.lot} | ${table(row.point)} | ${row.status} | ${table(measure)} |\n`;
}
md+='\n## Preuves et limites\n\n';
md+='JSON complet : `'+path.join(evidence,'measurements.json')+'`. Il contient toutes les assertions effectives, les passages remplacés, les mesures, les appartenances SQL et les sorties de nettoyage. Les résultats de recette viennent de ces assertions ; un code de sortie0 du superviseur signifie seulement que la collecte est terminée.\n\n';
md+='Mesures versionnées : [recette-soir-16-10-2026.json](recette-soir-16-10-2026.json), sans les diffs de provenance ni les sorties détaillées du superviseur.\n\n';
md+=`Captures : **${screenshots.length}/6** au maximum ; aucun média dans Git.\n\n`;
for(const image of screenshots)md+='- `'+image+'`\n';
md+='\nPassages préliminaires conservés : vue complète absente car désactivée ; recherche d’un contenu de groupement encore replié ; survol comparé à un focus déjà actif ; mauvais bouton d’en-tête (étiquette) ; geste sur une ligne de membre au lieu d’une carte participant. Ils ne sont pas assimilés à des défauts produit lorsque le contrôle ciblé les remplace. Aucune assertion produit n’a été supprimée pour masquer un échec ; la cible et le prérequis sont explicités.\n\n';
for(const run of runs)md+='- `'+run.result.runId+'` : superviseur '+run.result.status+(run.cleanup?', cours/comptes nettoyés='+run.cleanup.fixtureCleanupComplete+', bail libéré='+run.cleanup.leaseReleased+', navigateur propriétaire fermé='+run.cleanup.ownedChildStopped:'. Interruption externe : nettoyage manuel et preuve SQL séparée dans remainder2-post-cleanup.json ; aucun rapport de supervision reconstitué')+'.\n';
md+='\nLes styles et scripts produit servis restent identiques à la base. Pas de publication sur localhost:80,8052,8054 ou8055 ; pas de redémarrage de service. Aucun correctif appliqué. Recette automatique native distincte de l’acceptation visuelle de Kevin ; le JSON permet de conserver toute réserve de couverture.\n';
fs.writeFileSync(path.join(root,'docs/testing/recette-soir-16-10-2026.md'),md);
console.log(JSON.stringify({lots:lotStatus,passed:count('PASS'),failed:failures.length,notApplicable:count('N/A'),captures:screenshots.length},null,2));
