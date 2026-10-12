import {triangles,gardens,heightAt,SHIP_SCALE} from './gsv.mjs';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function random(seed){let s=2166136261;for(const ch of String(seed))s=Math.imul(s^ch.charCodeAt(0),16777619);return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function gardenFrame(c){const g=gardens[c.garden]||gardens[0];return {origin:[g.center[0],g.height,g.center[2]],garden:g.index,scale:SHIP_SCALE};}
export function gardenFaces(c){const g=gardens[c.garden]||gardens[0];return triangles.filter(t=>t.n[1]>.99&&Math.abs(t.v[0][1]-g.height)<.03);}
export function insideGarden(c,x,z){if(c.preset==='orbital')return true;const o=gardenFrame(c).origin;return gardenFaces(c).some(t=>heightAt(t,x+o[0],z+o[2])!==null);}
export function hullBottom(c,x,z){if(c.preset==='orbital')return -2000;const o=gardenFrame(c).origin;let y=-Infinity;for(const t of triangles){if(t.n[1]>=-.01)continue;const h=heightAt(t,x+o[0],z+o[2]);if(h!==null&&h<o[1]-.1)y=Math.max(y,h-o[1]);}return y;}
export function terrainSpec(c){const rng=random(c.seed+':terrain');return {lake:{x:(rng()-.5)*c.length*.3,z:-c.width*(.12+rng()*.12),rx:c.length*(.10+c.lakeShare/500),rz:c.width*(.10+c.lakeShare/400)},peaks:Array.from({length:4},(_,i)=>({x:(i/3-.5)*c.length*.82,z:(i%2?-.34:.32)*c.width,rx:c.length*(.13+rng()*.08),rz:c.width*(.15+rng()*.10),gain:.55+rng()*.45})),phase:rng()*10};}
function rawHeight(c,s,x,z){const u=x/c.length,v=z/c.width,edge=clamp((.5-Math.max(Math.abs(u),Math.abs(v)))/.12,0,1);let mountain=0;for(const p of s.peaks){const q=Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz);mountain=Math.max(mountain,Math.max(0,1-q)*p.gain*c.mountain);}
 const lake=c.lakeShare>0?Math.hypot((x-s.lake.x)/s.lake.rx,(z-s.lake.z)/s.lake.rz):10;
 const basin=lake<1?-c.lakeDepth*Math.pow(1-lake*lake,1.1):0;
 const relief=3+Math.sin(u*17+s.phase)*Math.cos(v*14-s.phase)*2+mountain;
 return edge*(basin<0?basin:relief);}
export function createTerrain(c){const spec=terrainSpec(c),nx=64,nz=48,dx=c.length/nx,dz=c.width/nz,heights=[],valid=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-c.length/2+i*dx,z=-c.width/2+j*dz;heights.push(rawHeight(c,spec,x,z));valid.push(insideGarden(c,x,z));}
 return {schema:'rfl.garden-terrain.v1',seed:c.seed,origin:c.preset==='gsv'?gardenFrame(c).origin:[0,0,0],nx,nz,dx,dz,length:c.length,width:c.width,heights,valid,waterLevel:0,spec};}
// Exactly the same triangular height field drives drawing and roof clearance.
export function terrainAt(t,x,z){const u=clamp((x+t.length/2)/t.dx,0,t.nx-1e-8),v=clamp((z+t.width/2)/t.dz,0,t.nz-1e-8),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*(t.nx+1)+i,h=t.heights;
 if(a+b<=1)return h[k]+a*(h[k+1]-h[k])+b*(h[k+t.nx+1]-h[k]);return h[k+t.nx+2]+(1-a)*(h[k+t.nx+1]-h[k+t.nx+2])+(1-b)*(h[k+1]-h[k+t.nx+2]);}
export function terrainTriangles(t){const out=[];for(let j=0;j<t.nz;j++)for(let i=0;i<t.nx;i++){const k=j*(t.nx+1)+i,ids=[k,k+1,k+t.nx+1,k+t.nx+2],pts=ids.map(n=>[-t.length/2+(n%(t.nx+1))*t.dx,t.heights[n],-t.width/2+Math.floor(n/(t.nx+1))*t.dz]);for(const indices of [[0,2,1],[1,2,3]])if(indices.every(q=>t.valid[ids[q]]))out.push(indices.map(q=>pts[q]));}return out;}
export function minTerrain(t,x,z,w,d){let h=Infinity;for(let i=0;i<=8;i++)for(let j=0;j<=8;j++)h=Math.min(h,terrainAt(t,x+w*i/8,z+d*j/8));
 // Include all height-field vertices in bounds. Linear triangle extrema occur
 // at these vertices or on a rectangle boundary (sampled additionally below).
 for(let j=Math.max(0,Math.ceil((z+t.width/2)/t.dz));j<=Math.min(t.nz,Math.floor((z+d+t.width/2)/t.dz));j++)for(let i=Math.max(0,Math.ceil((x+t.length/2)/t.dx));i<=Math.min(t.nx,Math.floor((x+w+t.length/2)/t.dx));i++)h=Math.min(h,t.heights[j*(t.nx+1)+i]);
 // Conservative cell minima also cover intersections with diagonal grid edges.
 for(let j=Math.max(0,Math.floor((z+t.width/2)/t.dz));j<=Math.min(t.nz-1,Math.floor((z+d+t.width/2)/t.dz));j++)for(let i=Math.max(0,Math.floor((x+t.length/2)/t.dx));i<=Math.min(t.nx-1,Math.floor((x+w+t.length/2)/t.dx));i++){const k=j*(t.nx+1)+i;h=Math.min(h,t.heights[k],t.heights[k+1],t.heights[k+t.nx+1],t.heights[k+t.nx+2]);}return h;}
export function contains(poly,x,z){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>z)!==(poly[j][1]>z)&&x<(poly[j][0]-poly[i][0])*(z-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])inside=!inside;return inside;}
