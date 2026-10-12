import assert from 'node:assert/strict';
import {generate,route} from './dist/generator.mjs';
import {inPlate,PLATE} from './dist/plate.mjs';
import {minTerrain} from './dist/terrain.mjs';
for(const seed of ['PLATE-01','RIVERS-02','GARDEN-07'])for(const stage of ['terrain','water','complete']){
 const l=generate({preset:'plate',seed,stage,mountain:1500,lakeDepth:600,height:3000}),c=l.config;
 assert.deepEqual([c.length,c.width,PLATE.top-PLATE.bottom],[90000,60000,20000]);
 assert.equal(l.deckPolygons.length,4);assert(l.deckPolygons.every(d=>d.polygon.length===8));
 assert(l.terrain.mesh.flat().every(p=>inPlate(p[0],p[2],.90000001)),'terrain clipped to chamfered garden');
 assert(l.terrain.heights.every(y=>y>=-600&&y<=2000));
 if(stage==='terrain'){assert.equal(l.waterVolumes.length,0);assert.equal(l.rooms.length,0);continue;}
 assert(l.waterVolumes.length>0);assert(l.stats.waterVolume>0);
 for(const cell of l.waterVolumes){assert(cell.bottom.every(p=>p[1]<=0));assert(cell.top.every(p=>p[1]===0));assert(cell.volume>=0);assert.equal(cell.faces.length,cell.bottom.length+2);}
 if(stage==='water'){assert.equal(l.rooms.length,0);continue;}
 for(const r of l.rooms){assert(r.hullExtension||r.polygon.every(([x,z])=>inPlate(x,z,.9600001)));assert(r.y>=PLATE.bottom);if(r.hullExtension)assert(r.y+r.h<0);else if(!r.openToSky)assert(r.y+r.h+c.cover<=minTerrain(l.terrain,r.x,r.z,r.w,r.d));else {assert.equal(r.type,'canyon');assert(r.floorMesh.length>0);assert(r.volume>0);}assert(route(l,l.rooms[0].id,r.id).length>0,'all rooms connected');if(r.windows.length)assert(r.region==='bow'||r.region==='forward'&&r.windows.every(w=>w.vertices.every(p=>Math.abs(p[2])===28800)));}
 const inhabited=l.rooms.filter(r=>['individual','couple','communal','hangar'].includes(r.type));
 for(let i=0;i<inhabited.length;i++)for(let j=i+1;j<inhabited.length;j++){const a=inhabited[i],b=inhabited[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.z<b.z+b.d&&a.z+a.d>b.z&&a.y<b.y+b.h&&a.y+a.h>b.y),'inhabited rooms non-overlapping');}
 for(const rail of l.rails)for(const p of rail.path){assert(inPlate(p[0],p[2],.96));assert(p[1]>=PLATE.bottom);assert(p[1]+rail.height/2< -c.lakeDepth);}
 assert(l.rooms.filter(r=>r.type==='hangar').every(r=>r.x*c.bow<0));assert(l.rooms.some(r=>r.type==='individual'));assert(l.rooms.some(r=>r.type==='couple'));assert(l.stats.unbuilt>.97);
}
const config={preset:'plate',seed:'CHECK',stage:'complete',lakeDepth:1500,mountain:2000,decks:4,height:4000,bow:-1};
assert.deepEqual(generate(config),generate(config),'deterministic');
const reversed=generate(config);assert(reversed.rooms.filter(r=>r.type==='hangar').every(r=>r.x>0));
console.log('Plate-class: 9 stage/seed cases, full dimensions, chamfer clipping, closed water volumes, hull/bed clearance, connected rail/E/walk graph, non-overlap, reversed bow, maximum depth and determinism passed.');
