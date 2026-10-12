import {triangles,gardens} from './gsv.mjs';
import {terrainTriangles} from './terrain.mjs';
const cache=new WeakMap();
function clip(poly,axis,limit,greater){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=greater?a[axis]>=limit:a[axis]<=limit,ib=greater?b[axis]>=limit:b[axis]<=limit;if(ia)out.push(a);if(ia!==ib){const t=(limit-a[axis])/(b[axis]-a[axis]);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}return out;}
// Replace the garden's real top faces inside the terrain sector; the remainder
// of the imported mesh is retained unchanged. Heights fade to zero at its rim.
export function deformedHull(layout){if(cache.has(layout))return cache.get(layout);if(!layout.ship)return triangles;const o=layout.ship.origin,c=layout.config,g=gardens[c.garden],out=[],xmin=o[0]-c.length/2,xmax=o[0]+c.length/2,zmin=o[2]-c.width/2,zmax=o[2]+c.width/2;
 const fan=(p,n)=>{for(let i=1;i<p.length-1;i++)out.push({v:[p[0],p[i],p[i+1]],n,terrain:false});};
 for(const t of triangles){if(t.n[1]<.99||Math.abs(t.v[0][1]-g.height)>.03){out.push(t);continue;}let inside=t.v;for(const [axis,limit,greater] of [[0,xmin,true],[0,xmax,false],[2,zmin,true],[2,zmax,false]]){const outside=clip(inside,axis,limit,!greater);fan(outside,t.n);inside=clip(inside,axis,limit,greater);if(inside.length<3)break;}}
 for(const v of layout.terrain.surfaceMesh||terrainTriangles(layout.terrain))out.push({v:v.map(p=>p.map((x,k)=>x+o[k])),n:[0,1,0],terrain:true,local:v});cache.set(layout,out);return out;}
