import {random,clamp,terrainTriangles,terrainAt,minTerrain} from './terrain.mjs';
import {footprint,shapeRoom,roomVolumes,polygonArea} from './room-shapes.mjs';

// Geometry-neutral growth: the adapter supplies floor elevations, bounds and
// conservative volume containment. No ship class or coordinate convention here.
export const onDeck=(r,deck)=>r.deck===deck||r.decks?.includes(deck);
export function surfaceRange(t,r){const samples=[];for(let i=0;i<=8;i++)for(let j=0;j<=8;j++)samples.push(terrainAt(t,r.x+r.w*i/8,r.z+r.d*j/8));for(let j=Math.max(0,Math.floor((r.z+t.width/2)/t.dz));j<=Math.min(t.nz,Math.ceil((r.z+r.d+t.width/2)/t.dz));j++)for(let i=Math.max(0,Math.floor((r.x+t.length/2)/t.dx));i<=Math.min(t.nx,Math.ceil((r.x+r.w+t.length/2)/t.dx));i++)samples.push(t.heights[j*(t.nx+1)+i]);return {dry:minTerrain(t,r.x,r.z,r.w,r.d)>1,top:Math.max(...samples)+1};}
const bounds=v=>{const xs=v.polygon.map(p=>p[0]),zs=v.polygon.map(p=>p[1]);return {x:Math.min(...xs),z:Math.min(...zs),w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),y:v.y,h:v.h};};
const overlaps=(a,b,pad=0)=>a.x<b.x+b.w+pad&&a.x+a.w>b.x-pad&&a.z<b.z+b.d+pad&&a.z+a.d>b.z-pad&&a.y<b.y+b.h-.01&&a.y+a.h>b.y+.01;
const block=r=>roomVolumes(r).map(bounds);
const rect=(x,z,w,d,y,h)=>({x,z,w,d,y,h,polygon:footprint(x,z,w,d)});
function wall(r,axis,sign){const c=[r.x+r.w/2,r.z+r.d/2],j=1-axis,hits=[];for(let i=0;i<r.polygon.length;i++){const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length];if(a[j]===b[j])continue;const t=(c[j]-a[j])/(b[j]-a[j]);if(t>=0&&t<=1)hits.push(a[axis]+t*(b[axis]-a[axis]));}c[axis]=sign<0?Math.min(...hits):Math.max(...hits);return c;}
function segment(a,b,y,width){return rect(Math.min(a[0],b[0])-width/2,Math.min(a[1],b[1])-width/2,Math.abs(b[0]-a[0])+width,Math.abs(b[1]-a[1])+width,y,4.2);}
function clip(poly,axis,cut,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-cut)*sign,db=(b[axis]-cut)*sign;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const f=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*f));}}return out;}
// Exact rectangular subtraction, preserving interpolated terrain elevations.
export function cutSurface(mesh,openings=[]){for(const r of openings){const out=[];for(const original of mesh){let inside=original;for(const [axis,cut,sign] of [[0,r.x,1],[0,r.x+r.w,-1],[2,r.z,1],[2,r.z+r.d,-1]]){if(inside.length<3)break;const outside=clip(inside,axis,cut,-sign);if(outside.length>=3)out.push(outside);inside=clip(inside,axis,cut,sign);}}mesh=out;}return mesh;}
export function growInteriors(layout,env){
 const c=layout.config;if(c.stage&&c.stage!=='complete')return layout;
 c.roomDensity=clamp(Number(c.roomDensity??28),0,60);c.winding=clamp(Number(c.winding??70),0,100);c.atriums=clamp(Number(c.atriums??3),0,8);
 const rng=random(c.seed+':interior-growth-v1'),unit=clamp(Math.min(c.length,c.width)/900,1,8),width=clamp(Number(c.corridor)||5,3,10),created=[],passages=[],openings=[];
 const obstacles=layout.rooms.map(r=>({id:r.id,boxes:block(r)}));
 for(const rail of layout.rails)for(let i=1;i<rail.path.length;i++){const a=rail.path[i-1],b=rail.path[i];obstacles.push({id:rail.id,boxes:[rect(Math.min(a[0],b[0])-rail.width,Math.min(a[2],b[2])-rail.width,Math.abs(a[0]-b[0])+rail.width*2,Math.abs(a[2]-b[2])+rail.width*2,Math.min(a[1],b[1])-3,Math.abs(a[1]-b[1])+6)]});}
 for(const s of [...layout.lifts,...layout.skylights,...layout.lightWells]){const w=s.width||6,d=s.depth||w,y=s.bottom??s.y;obstacles.push({id:s.id,boxes:[rect(s.x-w/2,s.z-d/2,w,d,y,s.top-y)]});}
 const clear=(box,ignore=null)=>!obstacles.some(o=>o.id!==ignore&&o.boxes.some(b=>overlaps(box,b,1)));
 let serial=0,attempts=0;
 const add=r=>{layout.rooms.push(r);obstacles.push({id:r.id,boxes:block(r)});};
 // Grow tall reservations first, from lower floors upward, before infill rooms.
 const phases=[...Array(Math.round(c.atriums)).fill('atrium'),'rooms'];
 for(const phase of phases){const decks=phase==='atrium'?[Math.max(0,c.decks-1-Math.floor(rng()*Math.max(1,c.decks-1)))]:Array.from({length:c.decks},(_,i)=>i);
 for(const deck of decks){const goal=phase==='atrium'?1:Math.round(c.roomDensity),y=env.floors[deck];let count=0;
 for(let attempt=0;attempt<(phase==='atrium'?220:goal*22)&&count<goal;attempt++){attempts++;
  const anchors=layout.rooms.filter(r=>r.deck===deck&&!r.edgeSection&&!r.openToSky&&!['transit','individual','couple','canyon'].includes(r.type));if(!anchors.length)break;
  const anchor=anchors[Math.floor(rng()*anchors.length)],axis=rng()<.5?0:1,j=1-axis,sign=rng()<.5?-1:1,start=wall(anchor,axis,sign);if(!start.every(Number.isFinite))continue;
  const tall=phase==='atrium',rw=(tall?65+rng()*45:18+rng()*45)*unit,rd=rw*(.65+rng()*.55),size=[rw,rd];
  const run=(18+rng()*65)*unit,lateral=(rng()<.5?-1:1)*(20+rng()*95)*unit*c.winding/100,endRun=(20+rng()*70)*unit;
  const p1=[...start];p1[axis]+=sign*run;const p2=[...p1];p2[j]+=lateral;const end=[...p2];end[axis]+=sign*endRun;
  const center=[...end];center[axis]+=sign*size[axis]/2;let room=rect(center[0]-rw/2,center[1]-rd/2,rw,rd,y,tall?env.floors[0]-y+Math.min(22,c.height*.6):Math.min(12,c.height*.6));
  const wantsSky=tall&&openings.length<Math.ceil(c.atriums/2),surface=env.surface?.(room),sky=wantsSky&&surface&&surface.dry;
  if(sky)room.h=surface.top-y;
  if(room.h<4.2||!env.fits(room,!!sky)||!clear(room))continue;
  const points=Math.abs(lateral)<width?[start,end]:[start,p1,p2,end],segments=points.slice(1).map((p,i)=>segment(points[i],p,y,width));
  if(!segments.every(s=>env.fits(s,false)&&clear(s,anchor.id)))continue;
  const id='growth-'+(++serial),type=tall?'communal':rng()<.45?'activity':'communal',names=c.activities.split(',').map(s=>s.trim()).filter(Boolean);
  Object.assign(room,{id,type,deck,name:tall?(sky?'Open-sky atrium':'Multi-deck great hall')+' '+serial:(type==='activity'?names[Math.floor(rng()*names.length)]||'Workshop':'Chamber')+' '+serial,capacity:0,generated:true,frameThickness:Math.max(1.5,rw*.025),daylight:sky?'open sky':'interior lighting',openToSky:!!sky});
  // Rectangular portal walls keep every branch join physically continuous.
  shapeRoom(room,'rectangle');room.decks=env.floors.map((fy,k)=>fy>=y-.01&&fy<y+room.h?k:null).filter(k=>k!==null);room.deckSpan=room.decks.length;
  add(room);created.push(room);if(sky)openings.push(room);
  const all=segments.flatMap(s=>s.polygon),xs=all.map(p=>p[0]),zs=all.map(p=>p[1]),hall={...rect(Math.min(...xs),Math.min(...zs),Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs),y,4.2),id:id+'-hall',type:'transit',deck,name:'Winding passage '+serial,shape:'winding passage',profile:'level',generated:true,capacity:0,centerline:points.map(([x,z])=>[x,y,z]),volumes:segments.map(s=>({polygon:s.polygon,y,h:4.2})),area:segments.reduce((sum,s)=>sum+s.w*s.d,0)-(segments.length-1)*width*width};hall.volume=hall.area*hall.h;add(hall);passages.push(hall);
  layout.edges.push({a:anchor.id,b:hall.id,kind:'walk',path:hall.centerline},{a:hall.id,b:room.id,kind:'walk'});
  layout.doors.push(...[start,end].map(([x,z],i)=>({id:id+'-door-'+i,a:i?room.id:anchor.id,b:hall.id,x,y,z,deck,width,height:4.2,kind:'door'})));
  count++;
 }
 }}
 layout.surfaceOpenings=openings.map(r=>({room:r.id,x:r.x,z:r.z,w:r.w,d:r.d,polygon:r.polygon,bottom:r.y,top:r.y+r.h}));
 layout.interiorGrowth={version:1,adapter:env.id,addedRooms:created.length,windingPassages:passages.filter(r=>r.centerline.length>2).length,multiDeckRooms:created.filter(r=>r.deckSpan>1).length,surfaceOpenings:openings.length,attempts,requestedPerDeck:c.roomDensity};
 if(openings.length){layout.terrain.surfaceMesh=cutSurface(layout.terrain.mesh||terrainTriangles(layout.terrain),openings);}
 const inhabited=layout.rooms.filter(r=>!['transit','station','rail'].includes(r.type));layout.stats.rooms=inhabited.length;layout.stats.openSpaces=inhabited.filter(r=>['communal','activity','canyon','bridge'].includes(r.type)).length;
 const used=layout.rooms.reduce((sum,r)=>sum+r.area*(r.deckSpan||1),0);layout.stats.floorArea=used;layout.stats.unbuilt=Math.max(0,1-used/(c.length*c.width*c.decks));
 if(layout.gardenLayer){const g=layout.gardenLayer;g.checks.reachableRooms=layout.rooms.length;g.checks.totalRooms=layout.rooms.length;g.navigation.nodes=layout.rooms.map(r=>({id:r.id,position:[r.x+r.w/2,r.y,r.z+r.d/2]}));g.navigation.edges=layout.edges.map(e=>({...e}));}
 return layout;
}
