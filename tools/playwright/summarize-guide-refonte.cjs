const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../..'),evidence='C:/dev/Moodle 51 Perf/moodle/local/recette-guide-20261017';
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(p,d.name)):[path.join(p,d.name)]);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const files=walk(evidence),acceptedStages=new Set(['ready','touch-levels-v4','fr-v4','en-v4','paths-resume','geometry','pointer-v2','actions-desktop-v3','compact-covered-v3','timing-isolated','drag-root-v4','compact-covered-v4']);
const allReports=files.filter(p=>/guide-(?:refonte|paths|geometry|pointer)\.json$/.test(p)).map(file=>({file,...read(file)}));
const reports=allReports.filter(r=>acceptedStages.has(path.relative(evidence,r.file).split(path.sep)[0]));
const excludedRuns=allReports.filter(r=>!reports.includes(r)).map(r=>({file:r.file,completed:r.completed,checks:(r.checks||[]).length,reason:'Invalid or interrupted predecessor; retained outside acceptance matrix'}));
const rawChecks=reports.flatMap(r=>(r.checks||[]).map(c=>{
 let measure=c.measure;
 if(measure?.samples){const samples=measure.samples;const animations=samples.flatMap(s=>s.animations||[]);const phases=[];for(const s of samples){let last=phases.at(-1);if(!last||last.phase!==s.phase){last={phase:s.phase,firstMs:s.ms,lastMs:s.ms};phases.push(last);}last.lastMs=s.ms;}
 measure={...measure,samples:undefined,sampleCount:samples.length,browserFinishedMs:samples.find(s=>s.finished==='true')?.ms,phaseTimeline:phases,heightAnimationSamples:animations.filter(a=>a.frames?.some(f=>'height'in f)).length,
  maximumAnimationDurationMs:Math.max(0,...animations.map(a=>Number(a.duration)||0)),transformAnimationSamples:animations.filter(a=>a.frames?.some(f=>'transform'in f)).length,
  cursorVisibleSamples:samples.filter(s=>s.cursorVisible).length,touchVisibleSamples:samples.filter(s=>s.touchVisible).length,mouseVisibleSamples:samples.filter(s=>s.mouseVisible).length,
  mismatchedPointerSamples:samples.filter(s=>s.cursorVisible&&(c.width<=1024?(!s.touchVisible||s.mouseVisible):(!s.mouseVisible||s.touchVisible))).length,
  rippleAnimationSamples:animations.filter(a=>a.frames?.some(f=>/scale\(1\.8\)/.test(f.transform||''))).length,
  gestureText:[...new Set(samples.map(s=>s.copy).filter(t=>/toucher|tap|click|cliquer/i.test(t||'')))].slice(0,8),
  truncatedStyleSamples:samples.filter(s=>s.copy&&s.lineClamp!=='none').length,activityDisplays:[...new Set(samples.filter(s=>s.activity).map(s=>s.activityDisplay))],rawSamplesFile:r.file};}
 return {...c,measure,run:r.file};}));
const pointerChecks=rawChecks.filter(c=>c.lot==='J-G1/C-G6/J-G2');
const sameCell=(a,b)=>a.lang===b.lang&&a.width===b.width&&a.level===b.level;
const supersededChecks=rawChecks.filter(c=>c.run.includes('paths-resume')&&c.width>1024&&c.point==='try-actions'&&/Cannot read properties of null/.test(c.error||'')&&rawChecks.some(s=>s.run.includes('actions-desktop-v3')&&sameCell(s,c)&&s.point===c.point));
supersededChecks.push(...rawChecks.filter(c=>c.run.includes('actions-desktop-v3')&&/user__avatar/.test(c.error||'')&&rawChecks.some(s=>s.run.includes('drag-root-v4')&&sameCell(s,c)&&s.point===c.point)));
// Composite checkpoints retain their raw status; one timing failure must not
// turn independently measured typography or touch checks into false failures.
const checks=rawChecks.flatMap(c=>{
 if(supersededChecks.includes(c))return [];
 const m=c.measure;if(c.status==='RUNNING'||!m)return [c];
 const derived=(lot,ok,error)=>({...c,lot,status:ok?'PASS':'FAIL',error:ok?undefined:error,rawStatus:c.status,rawError:c.error});
 if(c.lot==='J-G2/C-G5/J-G1/C-G6'&&m.sampleCount){
  const duration=m.browserFinishedMs??m.elapsedMs;
  const timing=c.level!=='full'||duration>=22000&&duration<=26250;
  const motion=c.level==='minimal'?m.maximumAnimationDurationMs===0:c.level==='reduced'?m.maximumAnimationDurationMs<=120&&m.transformAnimationSamples===0:true;
  const probe=pointerChecks.find(p=>sameCell(p,c)&&p.point.match(/^slide (\d+)/)?.[1]===c.point.match(/^slide (\d+)/)?.[1]&&p.measure?.kind===m.kind&&(p.measure?.mode||null)===(m.mode||null));
  const touch=probe?probe.status==='PASS':m.cursorVisibleSamples>0&&m.mismatchedPointerSamples===0;
  const touchWords=c.width>1024||(m.gestureText||[]).every(t=>!/^\s*(?:cliquer|click)\b/i.test(t));
  const copyOk=m.truncatedStyleSamples===0&&m.activityDisplays.length>0&&m.activityDisplays.every(d=>d==='inline-flex');
  return [derived('J-G2',timing&&motion&&m.heightAnimationSamples===0,'Browser demo duration '+duration+'ms (harness '+m.elapsedMs+'ms); target full22000..26000ms (+250ms observation), height-animation samples '+m.heightAnimationSamples+', motion contract '+motion),
   derived('C-G5',copyOk,'Narration clamp or activity display differs from inline flow'),
   {...derived('J-G1',touch,'Painted-pointer successor '+(probe?.status||'missing')+'; original parent-visible samples '+m.cursorVisibleSamples+', wrong modality '+m.mismatchedPointerSamples),pointerSuccessor:probe?.measure,pointerSuccessorRun:probe?.run},
   derived('C-G6',touch&&touchWords&&(!(c.width<=1024&&c.level==='full')||m.rippleAnimationSamples>0),'Touch/mouse, wording or ripple mismatch; touch wording '+touchWords+', ripple animation samples '+m.rippleAnimationSamples)];
 }
 if(c.lot==='C-G1/P-G6'&&m.lineHeight){const rows=[
  derived('C-G1',m.lineHeight==='1.5'&&m.measure==='38rem'&&(!m.title||m.title.font==='18px'&&m.title.line==='24px'),'Reading rhythm differs: '+JSON.stringify({lineHeight:m.lineHeight,measure:m.measure,title:m.title})),
  derived('P-G6',m.pageScrollX===0&&m.modalScroll===0&&m.bodyScroll===0&&m.pill?.visible===true,'Strip containment differs: '+JSON.stringify({page:m.pageScrollX,modal:m.modalScroll,body:m.bodyScroll,pill:m.pill}))];
  if(c.width===390)rows.push(derived('C-G3',m.headerHeight===56,'Compact header height '+m.headerHeight+'px; expected56px'));
  return rows;}
 if(c.lot==='C-G1/C-G2/C-G3/P-G6'&&Array.isArray(m)&&m.length){
  const rhythm=m.every(s=>s.bodyLine==='1.5'&&s.measure==='38rem'&&(!s.title||s.title.font==='18px'&&s.title.line==='24px')&&(s.reading||[]).every(p=>p.width<=608.5&&Math.abs(parseFloat(p.line)/parseFloat(p.font)-1.5)<=.01));
  const strip=!(c.pillTimeouts||[]).length&&m.every(s=>{const a=s.pills.find(p=>p.active),ref=m[0];return Math.abs(s.modal.x-ref.modal.x)<=.5&&Math.abs(s.dialog.x-ref.dialog.x)<=.5&&(!(s.arrow.width>0&&ref.arrow.width>0)||Math.abs(s.arrow.x-ref.arrow.x)<=.5)&&Object.values(s.scrolls).every(v=>v===0)&&(s.ancestorScrolls||[]).every(a=>a.scrollLeft===0)&&s.pageOverflow<=1&&a&&a.x>=s.strip.x-.5&&a.right<=s.strip.right+.5&&
   (c.width!==390||a.width>44&&s.pills.every((p,i)=>p.number===String(i+1))&&s.pills.filter(p=>!p.active).every(p=>p.width===44&&p.height>=44));});
  // The six first-slide specimens intentionally retain their one-column host;
  // C-G2's two-column opt-in is --lesson-reading (source _guide-discovery.scss).
  const tablet=m.every(s=>s.dialog.height>=940&&(!s.explanation||s.slide===1||s.explanation.children.length<=1||s.explanation.columns.split(' ').length===2)&&(!s.path||!s.scene||s.path.y>=s.scene.bottom-.5));
  const phone=m.every(s=>s.header.height===56&&(!s.scene||s.scene.border==='0px'&&s.scene.padding==='12px'&&Math.abs(s.scene.width-s.dialog.width+s.dialog.borderLeft+s.dialog.borderRight)<=.5));
  const rows=[derived('C-G1',rhythm,'Strict title/reading geometry differs'),derived('P-G6',strip,'Strict numbered-pill/strip containment differs')];
  rows.push(c.width===768?derived('C-G2',tablet,'Tablet columns, stacked path card or height differs'):{...c,lot:'C-G2',status:'N/A'});
  rows.push(c.width===390?derived('C-G3',phone,'Phone header or full-width scene geometry differs'):{...c,lot:'C-G3',status:'N/A'});return rows;
 }
 if(c.lot==='C-G2/C-G3'){
  if(c.width===390&&Array.isArray(m)){
   const scenes=m.filter(s=>s.scene),expected=c.lang==='fr'?'Exemple':'Example';
   return [derived('C-G3',scenes.length>0&&scenes.every(s=>s.badge&&s.badge.short!=='none'&&s.badge.full==='none'&&s.badge.text.trim()===expected),'Short Example badge mismatch: '+JSON.stringify(scenes.map(s=>({slide:s.slide,badge:s.badge}))))];
  }
  return ['C-G2','C-G3'].map(lot=>({...c,lot,status:c.width===(lot==='C-G2'?768:390)?c.status:'N/A'}));
 }
 if(c.lot==='J-G3/C-G4'&&m.cues?.length){
  const numberOk=m.cues.every(s=>s.number&&parseFloat(s.number.width)===24&&parseFloat(s.number.height)===24);
  return [derived('J-G3',c.status==='PASS'&&m.completed===true,c.error||'Path was not completed'),derived('C-G4',numberOk,'Checklist number is not24x24px')];
 }
 return [c];
});
const deployment=read(evidence+'-deploy-complete/manifest.json');
const tree=new Map(cp.execFileSync('git',['ls-tree','-r',deployment.commit],{cwd:repo,encoding:'utf8'}).trim().split('\n').map(l=>{const m=l.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);return m?[m[2],m[1]]:['',''];}));
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const mismatches=deployment.files.filter(f=>{const b=fs.readFileSync(path.join(deployment.runtime,f.file));return blob(b)!==tree.get(f.file)&&blob(Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n')))!==tree.get(f.file);}).map(f=>f.file);
const lots=['C-G1','C-G4','C-G5','C-G7','J-G4','C-G2','C-G3','P-G6','J-G2','J-G3','J-G1','C-G6'];
const matrix=lots.map(lot=>({lot,cells:['fr','en'].flatMap(lang=>[1600,1280,768,390].flatMap(width=>['full','reduced','minimal'].map(level=>{
 const rows=checks.filter(c=>c.lang===lang&&c.width===width&&c.level===level&&c.lot.split('/').includes(lot));
 return {lang,width,level,status:rows.some(r=>r.status==='FAIL')?'FAIL':!rows.length?'NON TESTÉ':rows.every(r=>r.status==='N/A')?'N/A':rows.some(r=>r.status==='RUNNING')?'INCOMPLET':'PASS',points:rows.map(r=>({point:r.point,status:r.status}))};
})))}));
const sideChanges=rawChecks.filter(c=>c.measure?.cues?.length).map(c=>{
 const timeline=c.measure.cues.map(q=>({stage:q.stage,side:c.width<=640?(q.class.includes('is-docked-top')?'top':'bottom'):(q.panel.x+q.panel.width/2<c.width/2?'left':'right'),minimized:q.class.includes('is-minimized'),avoiding:q.class.includes('is-avoiding'),overlap:q.overlap}));
 return {lang:c.lang,width:c.width,level:c.level,path:c.point,changed:timeline.some(q=>q.side!==timeline[0].side),timeline};
});
const timedDemos=checks.filter(c=>c.lot==='J-G2'&&c.level==='full'&&c.measure?.sampleCount);
const demoDurations=[...new Set(timedDemos.map(c=>c.point))].map(point=>{const rows=timedDemos.filter(c=>c.point===point),values=rows.map(c=>c.measure.browserFinishedMs??c.measure.elapsedMs);return {point,pass:rows.filter(c=>c.status==='PASS').length,fail:rows.filter(c=>c.status==='FAIL').length,minMs:Math.min(...values),maxMs:Math.max(...values)};});
const nativePaths=rawChecks.filter(c=>c.lot==='J-G3/C-G4'&&!supersededChecks.includes(c)).map(c=>({lang:c.lang,width:c.width,level:c.level,path:c.point,completed:c.measure?.completed===true,status:c.status,overlaps:(c.measure?.cues||[]).filter(q=>q.overlap>0||!q.paintHit).map(q=>({stage:q.stage,area:q.overlap,paintHit:q.paintHit,target:q.target,panel:q.panel}))}));
const summary={source:deployment.commit,productFiles:deployment.files.length,productMismatches:mismatches,matrix,checks,sideChanges,
 demoDurations,nativePaths,
 errors:reports.flatMap(r=>r.errors||[]),consoleErrors:reports.flatMap(r=>r.consoleErrors||[]),blockedWrites:reports.flatMap(r=>r.blockedWrites||[]),
 completedRuns:reports.map(r=>({file:r.file,completed:r.completed})),excludedRuns,supersededChecks,cleanup:files.filter(p=>/cleanup-proof\.json$/.test(p)).map(read),captures:fs.existsSync(evidence+'/captures.json')?read(evidence+'/captures.json'):[],humanAccepted:false};
summary.captures=summary.captures.map(c=>({...c,sha256:crypto.createHash('sha256').update(fs.readFileSync(c.path)).digest('hex')}));
if(fs.existsSync(evidence+'/retention-dry-run.json')){const r=read(evidence+'/retention-dry-run.json');summary.artifactRetention={mode:r.mode,manifests:r.manifestsFound,candidates:r.candidateCount,deleted:r.deletedCount,protected:r.protectedCount};}
const measurementIds=new Map(),measurements={};
const exportedChecks=checks.map(c=>{if(!c.measure||typeof c.measure!=='object')return c;let id=measurementIds.get(c.measure);if(!id){id='m'+(measurementIds.size+1);measurementIds.set(c.measure,id);measurements[id]=c.measure;}return {...c,measure:undefined,measureRef:id,rawStatus:c.rawStatus===c.status?undefined:c.rawStatus};});
const fullFile=evidence+'/full-receipt.json';fs.writeFileSync(fullFile,JSON.stringify({...summary,checks:exportedChecks,measurements}));
const compactMeasure=m=>{
 if(Array.isArray(m))return m.map(s=>s.pills?{slide:s.slide,modal:s.modal,dialog:s.dialog,headerHeight:s.header.height,arrow:s.arrow,scrolls:s.scrolls,parentMaxScrollLeft:Math.max(0,...s.ancestorScrolls.map(p=>Math.abs(p.scrollLeft))),pageOverflow:s.pageOverflow,title:s.title,bodyLine:s.bodyLine,measure:s.measure,reading:s.reading,strip:s.strip,stripScroll:s.stripScroll,activePill:s.pills.find(p=>p.active),numbers:s.pills.map(p=>p.number),inactiveWidths:[...new Set(s.pills.filter(p=>!p.active).map(p=>p.width))],inactiveMinHeight:Math.min(...s.pills.filter(p=>!p.active).map(p=>p.height)),scene:s.scene,explanation:s.explanation?{columns:s.explanation.columns,width:s.explanation.width,children:s.explanation.children.length}:null,path:s.path}:s);
 if(m.slides)return {slides:m.slides.length,headerHeights:[...new Set(m.slides.map(s=>s.headerHeight))],pageOverflowMax:Math.max(...m.slides.map(s=>s.pageOverflow)),touch:m.touch};
 if(m.cues){const {failureDom,cueFailures,...rest}=m;return {...rest,cueFailures:(cueFailures||[]).map(q=>({stage:q.stage,overlap:q.overlap,paintHit:q.paintHit})),failureDom:failureDom?{activeStep:failureDom.activeStep,highlight:failureDom.highlight,target:failureDom.target,panel:failureDom.panel}:undefined};}
 return m;
};
const compactChecks=exportedChecks.map(({rawError,pointerSuccessor,...c})=>({...c,error:c.error?stripError(c.error):undefined,rawError:rawError?stripError(rawError):undefined,pointerSuccessor:pointerSuccessor?{distance:pointerSuccessor.distance,paintedDisk:pointerSuccessor.paintedDisk,touchPainted:pointerSuccessor.touchPainted,mousePainted:pointerSuccessor.mousePainted}:undefined}));
function stripError(s){return String(s).replace(/\u001b\[[0-9;]*m/g,'').split('\n').filter(Boolean).slice(0,6).join(' ').slice(0,900);}
const compact={...summary,schema:'guide-native-receipt-v2',checks:compactChecks,measurements:Object.fromEntries(Object.entries(measurements).map(([k,v])=>[k,compactMeasure(v)])),supersededChecks:supersededChecks.map(c=>({lang:c.lang,width:c.width,level:c.level,point:c.point,error:stripError(c.error),run:c.run})),fullReceipt:{file:fullFile,sha256:crypto.createHash('sha256').update(fs.readFileSync(fullFile)).digest('hex')}};
// Valid JSON with one record per line: full telemetry stays external, never
// a generated hundred-thousand-line diff in the source branch.
const fields=Object.entries(compact).map(([k,v])=>JSON.stringify(k)+':'+(Array.isArray(v)?'[\n'+v.map(x=>JSON.stringify(x)).join(',\n')+'\n]':k==='measurements'?'{\n'+Object.entries(v).map(([id,m])=>JSON.stringify(id)+':'+JSON.stringify(m)).join(',\n')+'\n}':JSON.stringify(v)));
fs.writeFileSync(path.join(repo,'docs/testing/recette-guide-17-10-2026.json'),'{\n'+fields.join(',\n')+'\n}\n');
let md='# Recette native du Guide — 17 octobre 2026\n\nSource figée `'+deployment.commit+'`, branche Claude lue sans modification. Copie :8051, '+deployment.files.length+' fichiers produit synchronisés, purge faite ; '+mismatches.length+' écarts aux objets Git. Aucun build ni correctif produit.\n\n';
md+='## État par lot\n\n| Lot | PASS | FAIL | N/A | Non testé / incomplet |\n|---|---:|---:|---:|---:|\n';
for(const m of matrix)md+='| '+m.lot+' | '+m.cells.filter(c=>c.status==='PASS').length+' | '+m.cells.filter(c=>c.status==='FAIL').length+' | '+m.cells.filter(c=>c.status==='N/A').length+' | '+m.cells.filter(c=>!['PASS','FAIL','N/A'].includes(c.status)).length+' |\n';
md+='\nLes nombres du tableau comptent les cellules langue × largeur × niveau, pas des défauts distincts. Les N/A concernent les lots propres à768 ou390.\n\n- **C-G3** : la variante courte contient encore « Exemple — rien n’est modifié » / « Example — nothing is changed », au lieu du badge « Exemple » / « Example » décrit par le contrat C-G3. En FR390 :166,375 ×17,016px pour le texte ; la scène pleine largeur et l’en-tête56px passent. La valeur provient de `discovery_simulation_short`, sans correction dans ce lot.\n- **J-G2** : Ajouter en FR1600/Complètes reste à13,81s en contexte isolé. Les inspections du pilote isolé FR390 dépassent26s. Déplacer, observé jusqu’à32,30s avec trois contextes, passe à24,20s isolément ; cet écart de charge ne prouve pas seul un défaut produit. Aucune animation de hauteur observée. Cible22–26s, tolérance d’observation250ms explicitée dans le protocole.\n- **J-G3** : chevauchements aux entrées de réglages et interception de clic en compact après certains enchaînements. Dans le diagnostic frais FR390, l’ajout natif réussit puis `try-selection` reste actif avec cible nulle et surbrillance `hidden=true`, `display:none`,0×0 après l’attente bornée5s. `manage.php` déclare pourtant `participantSelectionInput` pour cette étape. Aucun clic forcé ni complétion injectée.\n- **Parcours** : les trois parcours se terminent sur bureau, dans les deux langues et trois niveaux. Les réglages se terminent aussi en compact ; le parcours actions compact reste bloqué.0erreur de page/console et0écriture refusée par les gardes.\n';
md+='\nMatrice demandée : FR/EN × 1600/1280/768/390 × Complètes/Réduites/Minimales. 390 utilise un contexte tactile. Les niveaux sont appliqués par l’API publique Motion sans enregistrer de préférence utilisateur ; ce protocole ne recertifie pas la priorité préférence/admin de M1. Chaque ligne de mesure du JSON indique la langue, largeur, niveau et point contrôlé.\n\n## Anomalies et prérequis\n\n';
const strip=s=>String(s||'').replace(/\u001b\[[0-9;]*m/g,'');
for(const c of checks.filter(c=>c.status==='FAIL')){
 const overlaps=(c.measure?.cueFailures||[]).map(q=>({stage:q.stage,area:q.overlap,paintHit:q.paintHit,target:q.target,panel:q.panel}));
 const dom=c.measure?.failureDom;
 md+='- **'+c.lot+' — '+c.lang+' '+c.width+' '+c.level+' — '+c.point+'** : '+strip(c.error).split('\n').filter(Boolean).slice(0,6).join(' ')+(overlaps.length?' Mesures : `'+JSON.stringify(overlaps)+'`.':'')+(dom?' État au défaut : `'+JSON.stringify({activeStep:dom.activeStep,highlight:dom.highlight,target:dom.target})+'`.':'')+'\n';
}
md+='\n## Reproduction et durées\n\n1. Ouvrir le Guide, choisir Complètes et démarrer chaque démonstration depuis sa diapositive. Attendre la fin native ; aucune pause ou avance n’est injectée. Première observation de fin mesurée dans le navigateur toutes les100ms.\n2. Démarrer les parcours Réglages groupe / groupement, puis Essayer les actions. Comparer la surbrillance à sa cible et tester son centre peint avant chaque clic. En compact, ouvrir le menu du participant puis Ajouter à un groupe. Les clics interceptés restent des échecs, sans force.\n3. Les résultats ci-dessous distinguent la complétion native du parcours et la conformité de son positionnement. Un parcours terminé peut échouer au contrôle de recouvrement.\n\n| Démonstration Complètes | Min. observé | Max. observé | Hors cible |\n|---|---:|---:|---:|\n';
for(const d of demoDurations)md+='| '+d.point+' | '+(d.minMs/1000).toFixed(2)+'s | '+(d.maxMs/1000).toFixed(2)+'s | '+d.fail+' / '+(d.pass+d.fail)+' |\n';
md+='\nComplétions natives constatées : '+nativePaths.filter(p=>p.completed).length+' / '+nativePaths.length+' tentatives retenues. Détail par parcours, langue, largeur et niveau dans `nativePaths` du JSON.\n';
md+='\n## Preuves et limites\n\n- Mesures JSON : `recette-guide-17-10-2026.json`. Preuves externes : `'+evidence+'`. Au plus six captures ; données continues des démonstrations toutes les 100 ms.\n- Ancien pilote conservé : la première liste de synchronisation ne contenait pas le nouveau gabarit `guide_simplecreate.mustache`. Ce lancement ne prouve aucun défaut du Guide. La copie complète de 287 fichiers l’a remplacé.\n- Les pilotes interrompus sont conservés comme diagnostics et ne sont pas des PASS. Les prérequis manquants ne sont pas requalifiés en défauts produit.\n- Trois parcours visés : réglages du groupe, réglages du groupement, essayer les actions. Interactions natives, contrôle de la surbrillance et de son chevauchement, message de fin ; seules les écritures d’ajout du cours synthétique sont autorisées.\n- Le changement de côté de la checklist est enregistré sans correctif. Aucune écriture sur :80/:8052/:8054/:8055, aucun redémarrage de service, aucune commande de terminaison par nom.\n- Le contrat produit et la documentation d’API restent inchangés : ce lot n’ajoute que des protocoles et preuves de validation. Recette automatique distincte de l’acceptation visuelle de Kevin.\n';
md+='\n## Nettoyage\n\n'+summary.cleanup.map(r=>'- `'+r.runId+'` : '+JSON.stringify(r)).join('\n')+'\n';
md+='\n## Captures\n\n';
for(const c of summary.captures)md+='- '+c.lot+' : [capture](<'+c.path.replaceAll('\\','/')+'>).'+(c.lot==='strict-geometry'?' Oracle initial trop général pour la première planche ; ce fichier ne démontre pas un défaut C-G2.':c.lot==='J-G3/C-G4'?' État de fin de parcours ; le recouvrement avant clic est documenté dans les coordonnées JSON.':'')+'\n';
md+='\n## Checklist : changements de côté à soumettre à Kevin\n\n';
for(const s of sideChanges.filter(s=>s.changed))md+='- '+s.lang.toUpperCase()+' '+s.width+' '+s.level+' — '+s.path+' : '+s.timeline.map(t=>t.stage+'='+t.side+(t.minimized?' (réduit)':'')).join(' → ')+'\n';
fs.writeFileSync(path.join(repo,'docs/testing/recette-guide-17-10-2026.md'),md);
console.log(JSON.stringify({productFiles:summary.productFiles,mismatches,checks:checks.length,failures:checks.filter(c=>c.status==='FAIL').length,pageErrors:summary.errors.length,consoleErrors:summary.consoleErrors.length,completedRuns:summary.completedRuns}));
