import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('./dist/index.html',import.meta.url),'utf8'),elements=new Map(),queue=[];
const context=new Proxy({measureText:t=>({width:String(t).length*7})},{get:(obj,key)=>key in obj?obj[key]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),'finite canvas '+key);},set:(o,k,v)=>(o[k]=v,true)});
for(const [,id] of html.matchAll(/id="([^"]+)"/g))elements.set(id,{value:'',textContent:'',checked:false,style:{},classList:{toggle(){},add(){},remove(){}},events:{},addEventListener(type,fn){this.events[type]=fn;},setAttribute(){},replaceChildren(...a){this.options=a;this.value=a[0]?.value??'';},clientWidth:1100,clientHeight:650,getContext:()=>context});
elements.get('stage').value='complete';elements.get('focusGarden').checked=false;
globalThis.document={body:{classList:{toggle(){}}},getElementById:id=>elements.get(id)||null,createElement:()=>({getContext:()=>context})};
globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=fn=>queue.push(fn);globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}};globalThis.Image=class{set src(v){}};globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0),json:async()=>JSON.parse(fs.readFileSync(new URL('./dist/assets/comparison.json',import.meta.url),'utf8'))});
await import('./dist/app.mjs');const flush=()=>{while(queue.length)queue.shift()();};flush();
assert(elements.get('compassDescription').textContent.includes('B · Bow'));assert(!elements.get('compassDescription').textContent.includes('North'));assert.equal(elements.get('preset').value,'plate');assert(elements.get('mapTitle').textContent.includes('Plate-class'));
elements.get('compareKind').value='state';elements.get('compareShip').value='plate';elements.get('compareStyle').value='overlay';
const hallOption=elements.get('spaceSelect').options.find(o=>o.text.includes('Stone hall'));
assert(hallOption);elements.get('spaceSelect').value=hallOption.value;elements.get('spaceSelect').onchange();flush();assert(!elements.get('focusSpace').disabled);elements.get('focusSpace').onclick();flush();assert(elements.get('scale').textContent.endsWith(' m'));elements.get('surface').checked=true;elements.get('surface').onchange();flush();elements.get('generate').onclick();flush();assert(elements.get('spaceSelect').options.length>20);
for(const mode of ['ship','volume','plan','terrain','water','edges','player']){elements.get(mode).onclick();flush();}
elements.get('focusGarden').checked=false;elements.get('focusGarden').onchange();flush();elements.get('focusGarden').checked=true;
for(const stage of ['terrain','water','complete']){elements.get('stage').value=stage;elements.get('stage').onchange();flush();assert(!elements.get('rulesStatus').textContent.includes('exceeds'));elements.get('useRail').onclick();flush();}
for(const preset of ['gsv','orbital','plate']){elements.get('preset').value=preset;elements.get('preset').events.change();flush();assert(elements.get('mapTitle').textContent.includes(preset==='plate'?'Plate-class':preset==='gsv'?'Systems-class':'Orbital'));}
elements.get('compare').onclick();await new Promise(resolve=>setTimeout(resolve,0));flush();assert(!elements.get('comparisonControls').hidden);assert(elements.get('comparisonStatus').textContent.includes('Colorado'));assert.equal(elements.get('comparePlace').options.length,51);elements.get('compareKind').value='country';elements.get('compareKind').onchange();flush();assert(elements.get('comparisonStatus').textContent.includes('Netherlands'));elements.get('compareShip').value='gsv';elements.get('compareShip').onchange();flush();assert(elements.get('comparisonStatus').textContent.includes('Systems-class'));elements.get('volume').onclick();flush();assert(elements.get('comparisonControls').hidden);
console.log('Comparison UI: country/state selection, shared-scale ship switching, tab return passed.');
console.log('UI smoke passed: Plate initial load, seven views, three stages, rail preview, and GSV/Orbital/Plate switching; finite canvas coordinates. Selection/focus/overlay and default ship compass passed. No visual browser QA.');

elements.get('preset').value='gsv';elements.get('preset').events.change();flush();
assert.equal(Number(elements.get('shipLength').value),128);
for(const length of [64,200,128]){
 elements.get('shipLength').value=length;elements.get('shipLength').events.change();flush();
 assert(elements.get('dimensionInfo').textContent.includes(length+' km long'));
 elements.get('ship').onclick();flush();
 elements.get('compare').onclick();flush();
 assert(elements.get('compareDimensions').textContent.startsWith(length+' ×'));
}
console.log('Systems-class length control: default 128 km, 64/200 km endpoints, ship and comparison views passed.');

// Exercise the piece workbench through the actual application handlers.
elements.get('pieces').onclick();flush();assert(!elements.get('piecesControls').hidden);assert.equal(elements.get('pieceSelect').options.length,18);
for(const piece of elements.get('pieceSelect').options){elements.get('pieceSelect').value=piece.value;elements.get('pieceSelect').onchange();for(const projection of ['plan','volume']){elements.get('pieceProjection').value=projection;elements.get('pieceProjection').onchange();flush();}}
for(const family of ['craft','natural','hybrid']){elements.get('pieceFamily').value=family;elements.get('pieceFamily').onchange();for(const deck of ['0','1']){elements.get('pieceDeck').value=deck;elements.get('pieceDeck').onchange();flush();}assert(elements.get('pieceInfo').textContent.includes('16 chambers'));}
elements.get('volume').onclick();flush();assert(elements.get('piecesControls').hidden);
console.log('Piece UI passed: all 18 silhouettes, both projections, all three generated families, both levels, and return to the ship map.');

// New growth controls survive preset switching and drive the shared generator.
elements.get('preset').value='plate';elements.get('preset').events.change();flush();
assert(elements.get('growthStatus').textContent.includes('multi-deck spaces'));
elements.get('roomDensity').value=4;elements.get('winding').value=0;elements.get('atriums').value=0;elements.get('generate').onclick();flush();
assert(elements.get('growthStatus').textContent.includes('16 added rooms'));
assert(elements.get('growthStatus').textContent.includes('0 winding halls'));
elements.get('roomDensity').value=28;elements.get('winding').value=70;elements.get('atriums').value=3;elements.get('generate').onclick();flush();
const atrium=elements.get('spaceSelect').options.find(o=>o.text.includes('atrium'));assert(atrium);
elements.get('spaceSelect').value=atrium.value;elements.get('spaceSelect').onchange();flush();assert(elements.get('roomInfo').textContent.includes('Levels'));
elements.get('deck').value=1;elements.get('deck').onchange();flush();assert(elements.get('spaceSelect').options.some(o=>o.value===atrium.value));
console.log('Growth UI passed: room count, winding and atrium controls; multi-deck inspector and level selection.');
