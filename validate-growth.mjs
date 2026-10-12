import assert from 'node:assert/strict';
import {generate,route} from './dist/generator.mjs';
import {growInteriors,cutSurface,onDeck} from './dist/interior-growth.mjs';
import {minTerrain,insideGarden,hullBottom} from './dist/terrain.mjs';
import {roomVolumes,polygonArea,shapeRoom} from './dist/room-shapes.mjs';
import {inPlate,PLATE} from './dist/plate.mjs';
import {renderPlate} from './dist/plate-view.mjs';
import {renderMap} from './dist/map-view.mjs';
const bbox=v=>({x:Math.min(...v.polygon.map(p=>p[0])),z:Math.min(...v.polygon.map(p=>p[1])),X:Math.max(...v.polygon.map(p=>p[0])),Z:Math.max(...v.polygon.map(p=>p[1])),y:v.y,Y:v.y+v.h});
const overlap=(a,b)=>a.x<b.X-.01&&a.X>b.x+.01&&a.z<b.Z-.01&&a.Z>b.z+.01&&a.y<b.Y-.01&&a.Y>b.y+.01;
const ctx=new Proxy({measureText:t=>({width:String(t).length*7})},{get:(o,k)=>k in o?o[k]:(...args)=>args.forEach(v=>{if(typeof v==='number')assert(Number.isFinite(v),'finite drawing coordinate');}),set:(o,k,v)=>(o[k]=v,true)});
for(const preset of ['plate','gsv','orbital'])for(const seed of ['GARDEN-07','BENT-12','HULL-42']){
 const config={preset,seed,...(preset==='plate'?{height:600,mountain:300,lakeDepth:120,gardenPrototype:true}:{})},l=generate(config),g=l.interiorGrowth,added=l.rooms.filter(r=>r.generated),byId=new Map(l.rooms.map(r=>[r.id,r]));
 assert(g.addedRooms>30,`${preset} added rooms`);assert(g.windingPassages>20);assert(g.multiDeckRooms>0);assert(g.surfaceOpenings>0);
 const adjacency=new Map(l.rooms.map(r=>[r.id,[]]));for(const e of l.edges){assert(byId.has(e.a)&&byId.has(e.b));adjacency.get(e.a).push(e.b);adjacency.get(e.b).push(e.a);}const seen=new Set([l.rooms[0].id]),q=[l.rooms[0].id];while(q.length)for(const b of adjacency.get(q.shift()))if(!seen.has(b)){seen.add(b);q.push(b);}assert.equal(seen.size,l.rooms.length,'every space reachable');
 for(const r of added){
  assert(r.volumes.length);for(const v of roomVolumes(r)){
   const b=bbox(v);for(const [x,z] of v.polygon){if(preset==='plate'){assert(inPlate(x,z,.9));assert(v.y>=PLATE.bottom);}else{assert(insideGarden(l.config,x,z));assert(v.y>=hullBottom(l.config,x,z)+l.config.cover);}}
   if(!r.openToSky)assert(v.y+v.h+l.config.cover<=minTerrain(l.terrain,b.x,b.z,b.X-b.x,b.Z-b.z)+1e-6,'roof clears terrain');
  }
  if(r.type!=='transit')for(const other of l.rooms){if(other===r||adjacency.get(r.id).includes(other.id))continue;assert(!roomVolumes(r).some(a=>roomVolumes(other).some(b=>overlap(bbox(a),bbox(b)))),'reserved room volume intersects '+r.id+' '+other.id);}
  if(r.type==='transit'){
   assert(r.centerline.length===4);const e=l.edges.find(e=>e.b===r.id),anchor=byId.get(e.a),target=byId.get(l.edges.find(e=>e.a===r.id).b);
   for(const other of l.rooms){if([r,anchor,target].includes(other))continue;assert(!r.volumes.some(a=>roomVolumes(other).some(b=>overlap(bbox(a),bbox(b)))),'passage crosses an unrelated room');}
   assert(r.centerline.every(p=>p[1]===r.y));
  }
 }
 const render=preset==='plate'?renderPlate:renderMap;
 for(const room of added.filter(r=>r.deckSpan>1))for(const deck of room.decks){assert(onDeck(room,deck));for(const mode of ['plan','volume']){const view=render(ctx,390,650,l,{mode,deck,yaw:.42,pitch:.62,zoom:1,focusRoom:room.id});assert(view.polys.some(p=>p.id===room.id),'multi-deck room selectable on intersected level');}}
 const mesh=l.terrain.surfaceMesh;assert(mesh?.length);for(const opening of l.surfaceOpenings)for(const poly of mesh){const x=poly.reduce((s,p)=>s+p[0],0)/poly.length,z=poly.reduce((s,p)=>s+p[2],0)/poly.length;assert(!(x>opening.x+1e-6&&x<opening.x+opening.w-1e-6&&z>opening.z+1e-6&&z<opening.z+opening.d-1e-6),'terrain caps surface opening');}
 console.log(preset,seed,JSON.stringify(g));
}
const config={preset:'orbital',seed:'DETERMINISTIC',roomDensity:8,atriums:2};assert.deepEqual(generate(config),generate(config),'seed repeatability');
assert.equal(generate({...config,roomDensity:0,atriums:0}).interiorGrowth.addedRooms,0);
assert.equal(generate({...config,winding:0}).interiorGrowth.windingPassages,0);
assert(!generate({preset:'plate',stage:'terrain'}).interiorGrowth);
// A new, concave vessel needs only a containment adapter, not generator edits.
const make=()=>{const r={id:'root',type:'station',deck:0,x:-40,z:-40,w:80,d:80,y:-100,h:8,capacity:0};shapeRoom(r,'rectangle');return {config:{seed:'CONCAVE',decks:1,height:48,length:1000,width:1000,roomDensity:12,winding:90,atriums:0,activities:'Workshop'},rooms:[r],rails:[],lifts:[],skylights:[],lightWells:[],doors:[],edges:[],stats:{}};};
const fits=r=>r.x>=-480&&r.z>=-480&&r.x+r.w<=480&&r.z+r.d<=480&&!(r.x+r.w>120&&r.z+r.d>120);
const custom=growInteriors(make(),{id:'concave-test-hull',floors:[-100],fits});assert(custom.interiorGrowth.addedRooms>=8);for(const r of custom.rooms.filter(r=>r.generated))for(const v of r.volumes){const b=bbox(v);assert(fits({x:b.x,z:b.z,w:b.X-b.x,d:b.Z-b.z}));}
const mesh=[[[0,0,0],[10,0,0],[10,0,10],[0,0,10]]],cut=cutSurface(mesh,[{x:2,z:2,w:4,d:4}]);assert(Math.abs(cut.reduce((s,p)=>s+polygonArea(p.map(v=>[v[0],v[2]])),0)-84)<1e-8,'exact surface subtraction');
console.log('Growth checks passed: 3 envelopes × 3 seeds, containment, non-overlap, connectivity, multi-deck selection, open terrain cuts, deterministic controls and a concave custom hull adapter.');
