import assert from 'node:assert/strict';
import {pieces,instantiatePiece,generatePieceLayout,boundarySocket} from './dist/map-pieces.mjs';
import {generate,route} from './dist/generator.mjs';
import {polygonArea,roomWalls} from './dist/room-shapes.mjs';
assert.equal(pieces.length,18);assert.equal(new Set(pieces.map(p=>p.id)).size,18);
for(const p of pieces){const r=instantiatePiece(p.id,{rotation:.4});assert(r.area>0);assert.equal(r.volume,r.area*r.h);assert.equal(roomWalls(r).length,p.polygon.length);assert(r.polygon.flat().every(Number.isFinite));assert.equal(r.sockets.length,p.ports);for(const socket of r.sockets){assert(onBoundary(r,socket.position[0],socket.position[2]));assert(Math.abs(Math.hypot(...socket.normal)-1)<1e-9);}}
function onBoundary(r,x,z){return r.polygon.some((a,i)=>{const b=r.polygon[(i+1)%r.polygon.length],dx=b[0]-a[0],dz=b[1]-a[1],t=((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz);return t>=-1e-8&&t<=1+1e-8&&Math.hypot(x-(a[0]+t*dx),z-(a[1]+t*dz))<1e-6;});}
for(const family of ['craft','natural','hybrid'])for(const seed of ['PRIME-01','MAGMOOR','FRIGATE','Z'])for(const scale of [.5,1,8]){
 const l=generatePieceLayout({family,seed,scale}),rooms=l.rooms;
 assert.deepEqual(l,generatePieceLayout({family,seed,scale}),'deterministic');assert(rooms.every(r=>route(l,rooms[0].id,r.id).length));
 assert.equal(l.edges.length-rooms.length+1,2,'one cycle per level');
 assert.deepEqual(l.rooms.filter(r=>r.piece==='lift-cell').map(r=>r.center.filter((_,i)=>i!==1)),[[435*scale,0],[435*scale,0]],'lift footprint vertically aligned');
 for(const d of l.doors){const r=rooms.find(r=>r.id===d.a);assert(onBoundary(r,d.x,d.z),'entrance meets actual wall');}
 for(const r of rooms){assert(r.area>0&&r.volume>0);assert(r.polygon.flat().every(Number.isFinite));if(r.centerline)assert(Math.min(...r.widths)>=2.1-1e-9,'minimum tunnel width');}
 const exported=JSON.parse(JSON.stringify(l));assert(exported.rooms.every(r=>r.volumes.length));assert.equal(exported.lifts.length,1);
}
for(const preset of ['plate','gsv','orbital'])for(const pieceStyle of ['craft','natural','hybrid']){const l=generate({preset,pieceStyle,gardenPrototype:false});const halls=l.rooms.filter(r=>r.type==='communal'||r.type==='activity');assert(halls.some(r=>pieces.some(p=>p.id===r.shape)),'family integrated into '+preset);for(const r of halls){assert(r.area>0);assert(Math.abs(r.volumes.reduce((s,v)=>s+polygonArea(v.polygon),0)-r.area)<.001);}}
console.log('18 pieces; deterministic connected 2-level studies across 36 family/seed/scale combinations; return loops, shared lifts, wall sockets, finite volumes and export; families generated in Plate, Systems and Orbital.');
