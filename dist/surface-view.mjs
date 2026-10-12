import {structureFaces} from './architecture.mjs';
import {terrainMesh,terrainColor,waterPolygon} from './map-view.mjs';
import {terrainAt} from './terrain.mjs';
import {drawAvatar} from './scale-view.mjs';
export function renderSurface(ctx,w,h,layout,selected,yaw,pitch,zoom){const landmark=layout.terminals.find(t=>t.station===selected)||layout.skylights.find(t=>t.room===selected)||layout.lightWells.find(t=>t.galleries.some(g=>g.room===selected))||layout.terminals[0]||layout.skylights[0];if(!landmark)return;
 const ly=landmark.y??landmark.ground,target=[landmark.x,ly+4,landmark.z],sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),distance=45/zoom,focal=Math.min(w,h)*.95,faces=[],decals=[];
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#456c79');sky.addColorStop(1,'#bacac0');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 const cam=p=>{const [x,y,z]=p.map((v,k)=>v-target[k]);return [x*cy-z*sy,y*cp-(x*sy+z*cy)*sp,distance-(x*sy+z*cy)*cp-y*sp];};
 const projection=p=>({x:w/2+p[0]*focal/p[2],y:h/2-p[1]*focal/p[2],depth:p[2]});
 const proj=(x,y,z)=>{const p=cam([x,y,z]);return p[2]<.2?null:projection(p);};
 function add(v,color,stroke){let a=v.map(cam),clip=[];for(let i=0;i<a.length;i++){const p=a[i],q=a[(i+1)%a.length],ip=p[2]>=.2,iq=q[2]>=.2;if(ip)clip.push(p);if(ip!==iq){const t=(.2-p[2])/(q[2]-p[2]);clip.push(p.map((x,k)=>x+(q[k]-x)*t));}}if(clip.length<3)return;faces.push({points:clip.map(projection),depth:clip.reduce((s,p)=>s+p[2],0)/clip.length,color,stroke});}
 for(const v of terrainMesh(layout)){const cx=v.reduce((s,p)=>s+p[0],0)/v.length,cz=v.reduce((s,p)=>s+p[2],0)/v.length;if(Math.hypot(cx-target[0],cz-target[2])>500)continue;add(v,terrainColor(v));const water=waterPolygon(v);if(water.length>2)add(water,'#629baa');}
 for(const b of [...layout.terminals,...layout.skylights,...layout.lightWells]){if(Math.hypot(b.x-target[0],b.z-target[2])>450)continue;for(const f of structureFaces(b,layout.terrain)){if(f.kind==='entrance'){if(cy>0)decals.push(f.v);}else add(f.v,f.color);}}

 faces.sort((a,b)=>b.depth-a.depth);for(const f of faces){ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();if(f.stroke){ctx.strokeStyle=f.stroke;ctx.stroke();}}
 for(const v of decals){const p=v.map(q=>proj(...q));if(p.every(Boolean)){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fillStyle='#172c2a';ctx.fill();}}
 const ax=landmark.x+landmark.width/2+3,az=landmark.z+landmark.depth/2+3,ay=terrainAt(layout.terrain,ax,az);drawAvatar(ctx,proj,ax,ay,az);const p=proj(ax,ay+2.4,az);ctx.font='14px sans-serif';ctx.textAlign='center';if(p){ctx.fillStyle='#fff3cb';ctx.fillText('1.95 m',p.x,p.y);}
 ctx.fillStyle='#10252ddc';ctx.fillRect(12,h-105,w-24,65);ctx.fillStyle='#eef2df';ctx.textAlign='left';ctx.font='14px sans-serif';ctx.fillText(landmark.station?'[E] Surface elevator · [R] station below':'Daylight lantern · natural light below',22,h-80,w-44);ctx.fillText(`${(landmark.architecture?.roofHeight??landmark.height??landmark.buildingHeight).toFixed(1)} m above ground · player 1.95 m`,22,h-56,w-44);
}
