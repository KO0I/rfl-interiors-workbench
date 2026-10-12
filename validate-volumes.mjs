import assert from 'node:assert/strict';
import {generate,route} from './dist/generator.mjs';
import {terrainAt,contains} from './dist/terrain.mjs';
import {renderPlate} from './dist/plate-view.mjs';
import {compassAxes,projectDirection} from './dist/compass.mjs';
import {roomShapes,polygonArea,roomWalls} from './dist/room-shapes.mjs';
const l=generate({preset:'plate',mountain:1500,lakeDepth:600,height:3000,gardenPrototype:true});
const halls=l.rooms.filter(r=>r.type==='communal'),canyon=l.rooms.find(r=>r.type==='canyon');
assert(roomShapes.every(shape=>halls.some(r=>r.shape===shape)),'every room family is generated');
assert(halls.some(r=>r.w>=3000&&r.h>500),'monumental hall dimensions');
for(const r of halls){
 assert(Math.abs(r.volumes.reduce((sum,v)=>sum+polygonArea(v.polygon),0)-r.area)<1e-6,'ceiling regions exactly cover the room');
 assert(r.volumes.every(v=>v.h>0&&v.h<=r.h));
 assert(contains(r.polygon,r.x+r.w/2,r.z+r.d/2),'route and player centre lies inside footprint');
 assert(r.volume>0);
 if(r.profile==='terraced')assert(roomWalls(r).some(face=>face[0][1]>r.y),'height changes have upper step walls');
}
assert(canyon.openToSky&&canyon.area>4e7&&canyon.volume>1e9);
let floorArea=0;for(const v of canyon.floorMesh){floorArea+=polygonArea(v.map(p=>[p[0],p[2]]));for(const p of v)assert(Math.abs(p[1]-terrainAt(l.terrain,p[0],p[2]))<1e-7,'map canyon floor matches rendered terrain');}
assert(Math.abs(floorArea-canyon.area)<.01,'canyon floor has complete clipped coverage');
assert(route(l,canyon.id,halls[0].id).length>0,'canyon is connected to interior transport');
const ctx=new Proxy({measureText:t=>({width:t.length*7})},{get:(o,k)=>k in o?o[k]:(...args)=>args.forEach(a=>{if(typeof a==='number')assert(Number.isFinite(a),'finite '+k);}),set:(o,k,v)=>(o[k]=v,true)});
const hall=halls.find(r=>r.profile==='terraced'&&r.w>1000),state={mode:'volume',deck:0,yaw:-.42,pitch:.62,zoom:1};
for(const surface of [false,true])for(const width of [390,1100]){
 const full=renderPlate(ctx,width,650,l,{...state,surface});
 assert(full.polys.filter(p=>p.id===hall.id).length>5,'real side faces remain selectable with overlay on or off');
 const focused=renderPlate(ctx,width,650,l,{...state,surface,focusRoom:hall.id});
 assert(focused.scale>full.scale*10,'room focus resolves metre/kilometre scale mismatch');
 assert(focused.polys.filter(p=>p.id===hall.id).length>5);
}
for(const preset of ['gsv','plate'])for(const bow of [1,-1]){
 const axes=compassAxes({preset,bow});assert.deepEqual(axes.map(a=>a.label),['B','A','P','S']);
 assert(axes.every(a=>a.v[1]===0),'all directions lie on structural top plane');
 assert.deepEqual(axes[0].v,[bow,0,0]);assert.deepEqual(axes[2].v,[0,0,-bow]);assert.deepEqual(axes[3].v,[0,0,bow]);
 for(const yaw of [-.42,0,Math.PI/2,Math.PI])for(const pitch of [.15,.62,1.45])for(let i=0;i<4;i+=2){const a=projectDirection(axes[i].v,yaw,pitch),b=projectDirection(axes[i+1].v,yaw,pitch);assert(Math.abs(a.x+b.x)<1e-9&&Math.abs(a.y+b.y)<1e-9,'opposing arrows stay opposed while orbiting');}
}
assert.deepEqual(projectDirection([1,0,0],2,.3,true),{x:1,y:0,depth:0},'plan compass uses same unrotated projection as plan map');
const exported=JSON.parse(JSON.stringify(l));assert(exported.rooms.find(r=>r.id===canyon.id).floorMesh.length);assert(exported.rooms.find(r=>r.id===hall.id).volumes.length===3);
console.log('Volume regressions passed: seven shapes, terraced ceilings, monumental dimensions, exact canyon terrain/area, transport, visible/selectable Plate walls with overlay, phone/desktop focus, export, and B/A/P/S orientation through orbit and bow reversal.');
