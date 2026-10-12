import assert from 'node:assert/strict';
import {generate,route} from './dist/generator.mjs';
import {terrainAt,minTerrain} from './dist/terrain.mjs';
for(const seed of ['GARDEN-07','PLATE-01','RIVERS-02']){
 const c={preset:'plate',seed,mountain:1500,lakeDepth:600,height:3000,gardenPrototype:true},l=generate(c),g=l.gardenLayer;
 assert(g);assert.equal(g.checks.reachableRooms,l.rooms.length);
 for(const r of l.rooms)assert(route(l,'garden-0',r.id).length,'all rooms reachable from garden');
 for(const r of g.routes)for(let i=0;i<r.path.length;i++){
  const p=r.path[i];assert(p[1]>2,'no underwater walking');assert.equal(p[1],terrainAt(l.terrain,p[0],p[2]));
  if(i){const q=r.path[i-1];assert(Math.abs(p[1]-q[1])/Math.hypot(p[0]-q[0],p[2]-q[2])<=.180001,'walking grade');}
 }
 const hall=l.rooms.find(r=>r.id==='garden-hall');assert(hall.y+hall.h+l.config.cover<=minTerrain(l.terrain,hall.x,hall.z,hall.w,hall.d));
 assert(route(l,'garden-hall',l.rooms.find(r=>r.type==='individual').id).length);
 const rail=l.rails.find(r=>r.id==='garden-rail-link');assert(rail.path.every(p=>p[1]+3< -l.config.lakeDepth));
 assert.deepEqual(generate(c),l,'deterministic');
 const plain=generate({...c,gardenPrototype:false});assert.deepEqual(plain.terrain,l.terrain,'downstream layers preserve terrain and water');assert.deepEqual(plain.waterVolumes,l.waterVolumes);
 console.log(seed+': dry slope-limited paths, hall cover, rail clearance, all-room reachability, determinism passed');
}
