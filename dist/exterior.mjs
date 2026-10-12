import {triangles,gardens} from './gsv.mjs';
import {gardenFrame,terrainAt,hullBottom} from './terrain.mjs';
const sub=(a,b)=>a.map((v,k)=>v-b[k]),dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function onTriangle(p,t,tolerance=.03){const [a,b,c]=t.v,u=sub(b,a),v=sub(c,a),q=sub(p,a);if(Math.abs(dot(q,t.n))>tolerance)return false;const uu=dot(u,u),uv=dot(u,v),vv=dot(v,v),qu=dot(q,u),qv=dot(q,v),den=uu*vv-uv*uv;if(Math.abs(den)<1e-8)return false;const s=(vv*qu-uv*qv)/den,r=(uu*qv-uv*qu)/den;return s>=-1e-7&&r>=-1e-7&&s+r<=1+1e-7;}
export function insideHull(p){const direction=[.812381,.331729,.480017],hits=[];for(const t of triangles){const a=t.v[0],e1=sub(t.v[1],a),e2=sub(t.v[2],a),h=cross(direction,e2),det=dot(e1,h);if(Math.abs(det)<1e-9)continue;const inv=1/det,s=sub(p,a),u=dot(s,h)*inv;if(u<0||u>1)continue;const q=cross(s,e1),v=dot(direction,q)*inv;if(v<0||u+v>1)continue;const distance=dot(e2,q)*inv;if(distance>.001)hits.push(distance);}hits.sort((a,b)=>a-b);return hits.filter((v,i)=>!i||v-hits[i-1]>.005).length%2===1;}
export function edgeSections(c){if(c.preset!=='gsv')return[];const origin=gardenFrame(c).origin,top=gardens[c.garden].height,sections=[];
 for(const longitudinal of [-1,1])for(const side of [-1,1]){
 const candidates=triangles.map((t,index)=>({t,index,center:[0,1,2].map(k=>t.v.reduce((s,p)=>s+p[k],0)/3)})).filter(({t,center:p})=>Math.abs(t.n[1])<.56&&side*t.n[2]>.48&&longitudinal*p[0]>400&&p[1]<top-10&&p[1]>top-700).sort((a,b)=>b.t.area-a.t.area);
 let placed=0;for(const {t,index,center} of candidates){if(placed>=2)break;if(sections.some(r=>Math.hypot(r.hullCenter[0]-center[0],r.hullCenter[2]-center[2])<450))continue;
  const horizontal=Math.hypot(t.n[0],t.n[2]),out=[t.n[0]/horizontal,0,t.n[2]/horizontal],tangent=[-out[2],0,out[0]],up=[-t.n[1]*t.n[0]/horizontal**2,1,-t.n[1]*t.n[2]/horizontal**2],aft=longitudinal*c.bow<0;let width=aft?240:180,height=aft?55:30,outer;
  for(let i=0;i<9;i++){outer=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>center.map((v,k)=>v+tangent[k]*width/2*x+up[k]*height/2*y));if(outer.every(p=>onTriangle(p,t)))break;width*=.8;height*=.8;}
  if(width<40||!outer.every(p=>onTriangle(p,t)))continue;let depth=aft?110:65,back;
  for(let i=0;i<6;i++){back=outer.map(p=>p.map((v,k)=>v-out[k]*depth));if(back.every(insideHull)&&outer.every(p=>insideHull(p.map((v,k)=>v-out[k]*.5))))break;depth*=.65;}
  if(depth<12||!back.every(insideHull))continue;
  const vertices=[...outer,...back].map(p=>p.map((v,k)=>v-origin[k])),base=[vertices[0],vertices[1],vertices[5],vertices[4]],xs=base.map(p=>p[0]),zs=base.map(p=>p[2]),x=Math.min(...xs),z=Math.min(...zs),w=Math.max(...xs)-x,d=Math.max(...zs)-z,aperture=outer.map(p=>p.map((v,k)=>center[k]+(v-center[k])*(aft?.82:.62)-origin[k]));
  sections.push({id:'edge-'+sections.length,type:aft?'hangar':'gallery',deck:0,x,z,w,d,y:base[0][1],h:height,polygon:base.map(p=>[p[0],p[2]]),shape:'hull-fitted',area:width*depth,capacity:0,name:`${aft?'Aft hangar':'Forward gallery'} · ${side*c.bow>0?'starboard':'port'} ${placed+1}`,edgeSection:true,region:aft?'aft':'forward',hullFace:index,hullCenter:center,normal:t.n,outward:out,vertices,faceVertices:vertices.slice(0,4),width,depth,aperture:{kind:aft?'hangar-mouth':'window',face:'side',vertices:aperture,hullFace:index},windows:[],daylight:aft?'open hangar mouth':'exterior side glazing'});placed++;
 }
 }return sections;}
// A window must be on an actual exterior surface AND on its room boundary.
// A distant light shaft is a light connection, never an exterior room window.
export function allowsWindow(room,opening,layout){if(!opening?.vertices?.length)return false;const c=layout.config,o=layout.ship?.origin||[0,0,0],eps=.04;const footprint=(x,z)=>{let inside=false;const v=room.polygon;for(let i=0,j=v.length-1;i<v.length;j=i++){const a=v[i],b=v[j],cross=(x-a[0])*(b[1]-a[1])-(z-a[1])*(b[0]-a[0]);if(Math.abs(cross)<eps&&x>=Math.min(a[0],b[0])-eps&&x<=Math.max(a[0],b[0])+eps&&z>=Math.min(a[1],b[1])-eps&&z<=Math.max(a[1],b[1])+eps)return true;if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 if(opening.face==='side'){const t=triangles[opening.hullFace];return !!t&&room.edgeSection&&room.hullFace===opening.hullFace&&opening.vertices.every(p=>onTriangle(p.map((v,k)=>v+o[k]),t)&&pointInFace(p,room.faceVertices));}
 if(opening.face==='top')return opening.vertices.every(([x,y,z])=>footprint(x,z)&&Math.abs(x)<=c.length/2&&Math.abs(z)<=c.width/2&&Math.abs(y-(room.y+room.h))<=eps&&Math.abs(y-terrainAt(layout.terrain,x,z))<=eps);
 if(opening.face==='bottom')return opening.vertices.every(([x,y,z])=>footprint(x,z)&&Math.abs(y-room.y)<=eps&&Math.abs(y-hullBottom(c,x,z))<=eps);
 return false;}
function pointInFace(p,v){const n=cross(sub(v[1],v[0]),sub(v[2],v[0])),len=Math.hypot(...n),t={n:n.map(x=>x/len),v:[v[0],v[1],v[2]]},u={n:t.n,v:[v[0],v[2],v[3]]};return onTriangle(p,t)||onTriangle(p,u);}
export function applyWindows(layout){for(const r of layout.rooms){r.windows=[];if(r.aperture?.kind==='window'&&allowsWindow(r,r.aperture,layout))r.windows.push(r.aperture);}layout.windows=layout.rooms.flatMap(r=>r.windows.map(w=>({...w,room:r.id})));layout.windowPolicy={requireExteriorContact:true,faces:['side','top','bottom'],buriedRooms:'no exterior windows',lightShafts:'separate from exterior windows'};}
