import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generate,route} from './dist/generator.mjs';
import {plateSilhouette,footprintArea,bounds,createComparison} from './dist/comparison.mjs';

for(const bow of [1,-1]){
 const l=generate({preset:'plate',bow,mountain:1500,lakeDepth:600,height:3000});
 assert.equal(l.config.decks,4);
 assert.equal(l.deckPolygons[3].role,'hangars-bays');
 assert(l.rooms.some(r=>r.deck===3&&r.type==='hangar'&&r.h===800));
 assert(l.rooms.some(r=>r.deck===3&&r.type==='bay'));
 const bridge=l.rooms.find(r=>r.type==='bridge');assert(bridge&&bridge.hullExtension);
 assert(bridge.polygon.some(([x])=>x===bow*48000));
 assert(bridge.windows.every(w=>w.vertices.every(p=>p[0]===bow*48000)));
 for(const r of l.rooms)assert(route(l,bridge.id,r.id).length,'bridge reaches every space and deck');
 const s=plateSilhouette(bow),b=bounds(s);assert.equal(b.w,93);assert.equal(b.h,60);
 assert(Math.abs(footprintArea(s)-5355.3)<1e-8,'chamfered hull plus projected bridge union, no double-counted root');
 assert(l.terrain.heights.every(Number.isFinite));assert.equal(l.terrain.spec.erosion.thermalPasses,12);
 assert.equal(l.terrain.dx,500);assert.equal(l.terrain.dz,500);
}
const data=JSON.parse(fs.readFileSync(new URL('./dist/assets/comparison.json',import.meta.url)));
assert.equal(data.places.filter(p=>p.kind==='state').length,51);
assert.equal(data.places.filter(p=>p.kind==='country').length,242);
for(const p of data.places){assert(p.area>0);assert(Math.abs(footprintArea(p.polygons)-p.area)/p.area<.006,'stored area agrees with displayed outline: '+p.name);}
const co=data.places.find(p=>p.id==='state:US-CO');assert(co.area>260000&&co.area<280000);
assert(Math.abs(footprintArea(data.gsv.polygons)-data.gsv.area)<.02);

const els=new Map(),$=id=>{if(!els.has(id))els.set(id,{value:'',textContent:'',replaceChildren(...v){this.options=v;this.value=v[0]?.value;}});return els.get(id);};
globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
globalThis.fetch=async()=>({ok:true,json:async()=>data});
$('compareKind').value='state';$('compareShip').value='plate';$('compareStyle').value='overlay';
const comparison=createComparison($,()=>{});await comparison.load();
const paths=[];let path=[];
const ctx={beginPath(){path=[];},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},closePath(){},fill(){paths.push(path);},stroke(){},fillText(){}};
const result=comparison.render(ctx,1000,650,{config:{bow:1}},1);
assert(Math.abs(bounds([[paths[1]]]).w/93-result.scale)<1e-8,'ship uses the returned kilometre scale');
assert(Math.abs(bounds([[paths[0]]]).w/bounds(co.polygons).w-result.scale)<1e-8,'region shares the identical kilometre scale');
comparison.pan(20,-10);comparison.rotate(35);$('compareStyle').value='side';comparison.render(ctx,390,530,{config:{bow:-1}},1);
console.log('Update checks passed: both bow orientations, bridge/deck connectivity, 3 km extension, true hull-union area, terrain grid, 293 geographic outlines, imported GSV union, and identical ship/region scale.');
