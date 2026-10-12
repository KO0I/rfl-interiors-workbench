import {onDeck} from './interior-growth.mjs';
import {landscapeColor} from './plate-landscape.mjs';
const surfaceColors=new WeakMap();
import {outline,scaledOutline} from './plate.mjs';
import {colors} from './generator.mjs';
import {roomVolumes} from './room-shapes.mjs';
export function renderPlate(ctx,w,h,layout,state){
 const {mode,deck,yaw,pitch,zoom,selected,path=[]}=state,plan=mode==='plan',surfaceView=['terrain','ship','ground'].includes(mode),showRooms=['volume','plan','edges'].includes(mode),overlay=showRooms&&state.surface;
 const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),faces=[],polys=[],markers=[],labels=[],byId=new Map(layout.rooms.map(r=>[r.id,r]));
 const focus=byId.get(state.focusRoom),garden=!focus&&state.focus&&layout.gardenLayer;
 const target=focus?[focus.x+focus.w/2,focus.y+focus.h/2,focus.z+focus.d/2]:garden?[garden.center[0],-500,garden.center[2]]:[0,showRooms?layout.deckPolygons[deck].y+500:-1000,0];
 const dims=focus?[Math.max(focus.w*1.5,60),Math.max(focus.h*1.7,40),Math.max(focus.d*1.5,60)]:garden?[20000,6500,18000]:[55000,4000,22000];
 const sx=plan?dims[0]:dims[0]*Math.abs(cy)+dims[2]*Math.abs(sy),sz=plan?dims[2]:(dims[0]*Math.abs(sy)+dims[2]*Math.abs(cy))*sp+dims[1]*cp;
 const scale=Math.max(.00001,Math.min((w-70)/sx,(h-150)/sz))*zoom;
 const proj=p=>{const [x,y,z]=p.map((v,k)=>v-target[k]),a=plan?x:x*cy-z*sy,b=plan?z:x*sy+z*cy;return {x:w/2+a*scale,y:h/2+(b*(plan?1:sp)-(plan?0:y)*cp)*scale,depth:b*cp+y*sp};};
 const add=(v,fill,stroke,id=null,alpha=1)=>{const p=v.map(proj);if(p.every(q=>q.x<0)||p.every(q=>q.x>w)||p.every(q=>q.y<0)||p.every(q=>q.y>h))return;faces.push({p,fill,stroke,id,alpha,depth:p.reduce((s,q)=>s+q.depth,0)/p.length});};
 const ring=(a,ya,b,yb,fill)=>{for(let k=0;k<a.length;k++){const j=(k+1)%a.length,steps=Math.ceil(Math.hypot(a[j][0]-a[k][0],a[j][1]-a[k][1])/2000),at=(v,f)=>[v[k][0]+(v[j][0]-v[k][0])*f,v[k][1]+(v[j][1]-v[k][1])*f];for(let n=0;n<steps;n++){const p=at(a,n/steps),q=at(a,(n+1)/steps),r=at(b,(n+1)/steps),s=at(b,n/steps);add([[p[0],ya,p[1]],[q[0],ya,q[1]],[r[0],yb,r[1]],[s[0],yb,s[1]]],fill,fill);}}};
 if(!focus&&!plan){for(let k=0;k<6;k++){
  const outer=scaledOutline(1-k*(.04/6)),inner=scaledOutline(1-(k+1)*(.04/6)),solid=surfaceView&&mode!=='terrain';
  ring(outer,-k*50,outer,-(k+1)*50,solid?'#424451':'#a67ca808');
  ring(outer,-(k+1)*50,inner,-(k+1)*50,solid?'#8b8c94':'#a67ca808');
 }ring(scaledOutline(.96),-300,scaledOutline(.96),-3600,surfaceView&&mode!=='terrain'?'#262431':'#a67ca808');}
 if(surfaceView||overlay){if(surfaceView)ring(outline,0,scaledOutline(.9),0,'#777b83');if(!surfaceColors.has(layout))surfaceColors.set(layout,(layout.terrain.surfaceMesh||layout.terrain.mesh).map(v=>landscapeColor(v,layout.config.mountain)));(layout.terrain.surfaceMesh||layout.terrain.mesh).forEach((v,i)=>add(v,surfaceColors.get(layout)[i],overlay?null:surfaceColors.get(layout)[i],null,overlay?.12:1));}
 if(surfaceView||overlay||mode==='water'||mode==='volume')for(const water of layout.waterVolumes){if(!surfaceView)for(const f of water.faces.slice(2))add(f,'#418dbb25','#63bde318');add(water.top,surfaceView?'#367e9e':'#63bde32a',surfaceView?'#367e9e':null);}
 if(!focus&&(surfaceView||showRooms))for(const ext of layout.extensions||[]){
  const base=ext.polygon.map(([x,z])=>[x,ext.bottom,z]);
  if(!plan)for(let k=0;k<base.length;k++){const j=(k+1)%base.length;add([base[k],base[j],ext.roof[j],ext.roof[k]],surfaceView?'#343744':'#f2cf8908','#a67ca855');}
  add(plan?ext.polygon.map(([x,z])=>[x,-400,z]):ext.roof,surfaceView?'#85888c':null,'#c5b5cb66');
 }
 if(showRooms||surfaceView){
  if(showRooms&&!focus)for(const d of layout.deckPolygons.filter(d=>d.deck===deck||state.stack))add(d.polygon.map(([x,z])=>[x,d.y,z]),null,d.deck===deck?'#be97cf66':'#a67ca822');
  for(const r of layout.rooms.filter(r=>(showRooms?(onDeck(r,deck)||state.stack):r.openToSky)&&(mode!=='edges'||r.edgeSection||r.type==='rail'||r.type==='transit'))){
   const active=onDeck(r,deck),color=r.id===selected?'#fff0b6':colors[r.type]||'#e3b76b',alpha=active?1:.18;
   for(const v of roomVolumes(r)){
    if(!plan){add(v.polygon.map(([x,z])=>[x,v.y,z]),color+'12',color,r.id,alpha*.65);for(let k=0;k<v.polygon.length;k++){const a=v.polygon[k],b=v.polygon[(k+1)%v.polygon.length];add([[a[0],v.y,a[1]],[b[0],v.y,b[1]],[b[0],v.y+v.h,b[1]],[a[0],v.y+v.h,a[1]]],color+(r.openToSky?'0d':'28'),color,r.id,alpha*.75);}}
    add(v.polygon.map(([x,z])=>[x,plan?v.y:v.y+v.h,z]),color+(r.openToSky?'12':'42'),color,r.id,alpha);
   }
   if(r.openToSky&&!plan)for(const v of r.floorMesh||[])add(v,color+'15',null,r.id,.6);
   const p=proj([r.x+r.w/2,r.y+r.h,r.z+r.d/2]),span=Math.max(r.w,r.d)*scale;
   if(active&&p.x>0&&p.x<w&&p.y>0&&p.y<h){if(span<12&&r.type!=='transit')markers.push({r,p});if(r.type==='bridge'||r.id===selected||span>38&&['communal','canyon','bridge','hangar','bay'].includes(r.type))labels.push({p,text:r.name,color});}
  }
 }
 if(surfaceView&&mode!=='terrain')for(const r of layout.edgeSections)add(r.aperture.vertices,['hangar','bay'].includes(r.type)?'#0a0911':'#a6ced8','#c3c0ad');
 faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){ctx.globalAlpha=f.alpha;ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(f.fill){ctx.fillStyle=f.fill;ctx.fill();}if(f.stroke){ctx.strokeStyle=f.stroke;ctx.lineWidth=f.id===selected?1.8:.85;ctx.stroke();}if(f.id)polys.push({id:f.id,points:f.p});}ctx.globalAlpha=1;
 const line=(v,color,width=1.4)=>{ctx.beginPath();v.map(proj).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 if(showRooms){for(const r of layout.rails.filter(r=>onDeck(r,deck)||state.stack))line(r.path,onDeck(r,deck)?'#80b8ffbb':'#80b8ff22');for(const l of layout.lifts.filter(l=>l.deck===deck||state.stack)){line([[l.x,l.y,l.z],[l.x,l.top,l.z]],'#f5d79aaa');const p=proj([l.x,l.top,l.z]);if(p.x>0&&p.x<w&&p.y>0&&p.y<h)labels.push({p,text:'[E]',color:'#f5d79a'});}}
 ctx.font='12px sans-serif';ctx.textAlign='center';for(const {r,p} of markers){const size=r.type==='rail'?4:3;ctx.fillStyle=selected===r.id?'#fff0b6':colors[r.type]||'#eee';ctx.fillRect(p.x-size,p.y-size,size*2,size*2);polys.push({id:r.id,points:[{x:p.x-6,y:p.y-6},{x:p.x+6,y:p.y-6},{x:p.x+6,y:p.y+6},{x:p.x-6,y:p.y+6}]});if(r.type==='rail'&&(!focus||Math.max(r.w,r.d)*scale>15))labels.push({p,text:'[R]',color:'#c2dcff'});}
 if(layout.gardenLayer){
  if(surfaceView||showRooms)for(const r of layout.gardenLayer.routes)line(r.path.map(p=>[p[0],p[1]+2,p[2]]),'#e8ddb588',2);
  if(surfaceView)for(const id of layout.gardenLayer.destinations){const r=byId.get(id),p=proj([r.x+r.w/2,r.y+5,r.z+r.d/2]);ctx.fillStyle='#fff0b6';ctx.fillRect(p.x-4,p.y-4,8,8);if(garden)labels.push({p,text:r.name,color:'#fff4dc'});polys.push({id,points:[{x:p.x-8,y:p.y-8},{x:p.x+8,y:p.y-8},{x:p.x+8,y:p.y+8},{x:p.x-8,y:p.y+8}]});}
  if(showRooms)for(const e of layout.edges.filter(e=>e.path&&e.kind!=='rail'))line(e.path,e.kind==='elevator'?'#f5d79aaa':'#e8ddb588',2);
 }
 if(path.length)line(path.map(id=>{const r=byId.get(id);return [r.x+r.w/2,r.y+r.h,r.z+r.d/2];}),'#fff0b6',2.5);
 ctx.font='12px sans-serif';ctx.textAlign='center';for(const {p,text,color} of labels){if(p.x<0||p.x>w||p.y<95||p.y>h-80)continue;const tw=ctx.measureText(text).width;ctx.fillStyle='#09080fe8';ctx.fillRect(p.x-tw/2-4,p.y-24,tw+8,18);ctx.fillStyle=color;ctx.fillText(text,p.x,p.y-11);}
 ctx.textAlign='left';ctx.fillStyle='#eee1bc';ctx.font='14px sans-serif';ctx.fillText(focus?focus.name:'Plate-class · 53 × 22 × 4 km · bridge at bow',18,h-70,w-80);ctx.fillStyle='#c6b9cf';ctx.font='12px sans-serif';ctx.fillText(focus?`${focus.shape} · ${focus.profile||'level'} · ${Math.round(focus.w).toLocaleString()} × ${Math.round(focus.d).toLocaleString()} × ${Math.round(focus.h).toLocaleString()} m`:surfaceView?'Garden and water at true scale':`${layout.deckPolygons[deck].name} · select a marker or choose a space, then Focus space`,18,h-49,w-80);
 return {polys,scale};
}
