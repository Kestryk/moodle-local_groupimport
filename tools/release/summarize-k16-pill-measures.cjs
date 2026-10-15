// Summarize actual native measurements, including the independent +N count oracle.
const fs=require('node:fs'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
assert.equal(data.rows.length,32,'Complete bilingual four-width/two-density/two-disclosure matrix required');
assert.equal(data.errors.length,0);assert.equal(data.writes.length,0);
const summary={passed:true,states:32,cardSamples:0,paintedPills:0,realPills:0,countersChecked:0,
 minRealPillsInNonemptyCategory:Infinity,clipped:0,empty:0,minus:0,maxGlyphDx:0,maxGlyphDy:0,
 maxRawRectHeightError:0,layoutHeights:[],cssHeights:[],humanAccepted:false};
for(const lang of ['fr','en'])for(const width of [1600,1280,768,390])for(const density of ['initial','toggled'])for(const expanded of [false,true]){
 const rows=data.rows.filter(r=>r.lang===lang&&r.width===width&&r.density===density&&r.expanded===expanded);
 assert.equal(rows.length,1,'Missing or duplicate matrix state');
 for(const card of rows[0].cards){summary.cardSamples++;assert(card.metaRight<=card.cardRight);
  for(const group of card.groups){
   const real=group.tokens.filter(t=>!t.toggle);if(group.realCount){assert(real.length>0);summary.minRealPillsInNonemptyCategory=Math.min(summary.minRealPillsInNonemptyCategory,real.length);}
   for(const token of group.tokens){summary.paintedPills++;if(!token.toggle)summary.realPills++;
    if(!token.text)summary.empty++;if(token.text==='-')summary.minus++;
    if(token.clipped)summary.clipped++;else{summary.maxGlyphDx=Math.max(summary.maxGlyphDx,Math.abs(token.dx));summary.maxGlyphDy=Math.max(summary.maxGlyphDy,Math.abs(token.dy));}
    summary.maxRawRectHeightError=Math.max(summary.maxRawRectHeightError,Math.abs(token.h-22));
    summary.layoutHeights.push(token.layoutHeight);summary.cssHeights.push(token.cssHeight);
    if(token.toggle&&/^\+\d+$/.test(token.text)){assert.equal(Number(token.text.slice(1)),group.realCount-real.length,'+N must equal actual hidden data tokens');summary.countersChecked++;}
   }
  }
 }
}
summary.layoutHeights=[...new Set(summary.layoutHeights)];summary.cssHeights=[...new Set(summary.cssHeights)];
assert.equal(summary.empty,0);assert.equal(summary.minus,0);assert.equal(summary.clipped,0);
assert(summary.maxGlyphDx<=.5&&summary.maxGlyphDy<=.5);assert.deepEqual(summary.layoutHeights,[22]);assert.deepEqual(summary.cssHeights,['22px']);
console.log(JSON.stringify(summary));
