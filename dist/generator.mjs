import {growInteriors,surfaceRange} from './interior-growth.mjs';
import {footprint,polygonArea,shapeRoom,roomShapes,hallShape,wallAtZ} from './room-shapes.mjs';
import {generatePlate} from './plate.mjs';
import {edgeSections,applyWindows} from './exterior.mjs';
import {embedStructures} from './architecture.mjs';
import {allowWaterCrossings,edgeRailPath,pathLength} from './transport.mjs';
import {gardens,source,PLAYER_HEIGHT,setShipLength,normalizeShipLength} from './gsv.mjs';
import {random,clamp,createTerrain,terrainAt,minTerrain,insideGarden,hullBottom,gardenFrame} from './terrain.mjs';
export const defaults={roomDensity:28,winding:70,atriums:3,pieceStyle:'existing',preset:'gsv',shipLength:128,garden:0,bow:1,seed:'GARDEN-07',length:1600,width:900,decks:3,height:48,corridor:5,privateSize:9,privateShare:35,coupleShare:40,communalSize:100,mountain:120,lakeDepth:30,lakeShare:35,cover:8,spacing:85,activities:'Lounge, Workshop, Music, Swimming, Dining'};
export const colors={individual:'#57cdc5',couple:'#6aa9e2',communal:'#e3b76b',activity:'#bf99e5',transit:'#8eaaad',station:'#78bced',rail:'#80b8ff',lift:'#f5d79a',bridge:'#f2cf89',bay:'#d690b6',hangar:'#d5a27d',gallery:'#91d9dc',canyon:'#dfae79'};
export {footprint} from './room-shapes.mjs';
export function generate(input={},existingTerrain=null){const c={...defaults,...input};c.shipLength=normalizeShipLength(c.shipLength);if(c.preset==='gsv')setShipLength(c.shipLength);if(c.preset==='plate')return generatePlate({...c,decks:input.decks??4});
 for(const [k,a,b] of [['length',600,2400],['width',400,1400],['decks',1,4],['height',32,64],['corridor',3,10],['privateSize',6,18],['privateShare',0,100],['coupleShare',0,100],['communalSize',55,170],['mountain',0,200],['lakeDepth',0,65],['lakeShare',0,70],['cover',4,20],['spacing',40,150]])c[k]=clamp(Number.isFinite(+c[k])?+c[k]:defaults[k],a,b);
 c.bow=Number(c.bow)===-1?-1:1;c.decks=Math.round(c.decks);c.garden=clamp(Math.round(+c.garden||0),0,gardens.length-1);if(!['gsv','orbital'].includes(c.preset))throw Error('Unknown envelope');c.seed=String(c.seed).slice(0,80);c.activities=String(c.activities).slice(0,300);
 const t=existingTerrain||createTerrain(c),rng=random(c.seed+':rooms'),rooms=[],edges=[],doors=[],lifts=[],rails=[],terminals=[],skylights=[],frames=[],lightWells=[],warnings=[];let id=0;
 const add=(type,deck,x,z,w,d,y,h,name,shape='rectangle',capacity=0)=>{const polygon=footprint(x,z,w,d,shape),r={id:'r'+(++id),type,deck,x,z,w,d,y,h,name,shape,polygon,area:polygonArea(polygon),capacity};if(['communal','activity'].includes(type))shapeRoom(r,shape,(id+deck)%2?'terraced':'level');rooms.push(r);return r;};
 const edge=(a,b,kind='walk',extras={})=>edges.push({a:a.id,b:b.id,kind,...extras});
 const link=(a,b,deck,x1,z1,x2,z2,y,width=c.corridor)=>{const x=Math.min(x1,x2)-width/2,z=Math.min(z1,z2)-width/2,w=Math.max(width,Math.abs(x2-x1)+width),d=Math.max(width,Math.abs(z2-z1)+width),r=add('transit',deck,x,z,w,d,y,4.2,'Walking corridor');r.centerline=[[x1,y,z1],[x2,y,z2]];edge(a,r);edge(r,b);return r;};
 const fit=(x,z,w,d,y,h)=>{for(let a=0;a<=4;a++)for(let b=0;b<=4;b++){const px=x+w*a/4,pz=z+d*b/4;if(!insideGarden(c,px,pz)||y<hullBottom(c,px,pz)+c.cover)return false;}return minTerrain(t,x,z,w,d)>=y+h+c.cover;};
 const floor0=-c.lakeDepth-c.cover-28,columns=clamp(Math.floor(c.length*.84/(c.communalSize+c.spacing*2)),3,6),cell=c.length*.84/columns,xs=Array.from({length:columns},(_,i)=>(i-(columns-1)/2)*cell),tierHubs=[];let shifted=0;
 for(let deck=0;deck<c.decks;deck++){
  const y=floor0-deck*c.height,hubs=[];
  for(let k=0;k<xs.length;k++){
   const x=xs[k],h=add('station',deck,x-9,-7,18,14,y,6,`Concourse ${deck+1}.${k+1}`,'octagonal');hubs.push(h);
   if(k)link(hubs[k-1],h,deck,xs[k-1],0,x,0,y);
  }
  tierHubs.push(hubs);
  for(let col=0;col<columns;col++)for(const side of [-1,1]){
   let cx=xs[col]+(rng()-.5)*cell*.12,cz=side*c.width*(.23+rng()*.08)+(deck%2?side*18:0),rw=Math.min(c.communalSize*(.78+rng()*.4),cell*.58),rd=Math.min(c.communalSize*(.72+rng()*.35),c.width*.21),x=cx-rw/2,z=cz-rd/2;
   let terrainMin=minTerrain(t,x,z,rw,rd);
   // Preserve deep basins: the upper level moves halls onto dry shoulders.
   if(deck===0&&terrainMin<-c.lakeDepth*.30){let found=false;for(const offset of [c.spacing,-c.spacing,c.spacing*1.5,-c.spacing*1.5]){const candidate=cz+offset;if(Math.abs(candidate)+rd/2>c.width*.47)continue;const v=minTerrain(t,x,candidate-rd/2,rw,rd);if(v>=-c.lakeDepth*.15&&fit(x,candidate-rd/2,rw,rd,y,14)){cz=candidate;z=cz-rd/2;terrainMin=v;found=true;shifted++;break;}}if(!found){shifted++;continue;}}
   const available=terrainMin-y-c.cover,desired=22+rw*.15+Math.max(0,terrainMin)*.32,h=Math.min(desired,available,deck?c.height-7:95);if(h<14||!fit(x,z,rw,rd,y,h))continue;
   // Nearby candidate bounds must remain separate, including shifted lake sites.
   if(rooms.some(r=>r.deck===deck&&!['transit','station','rail'].includes(r.type)&&x<r.x+r.w+10&&x+rw>r.x-10&&z<r.z+r.d+10&&z+rd>r.z-10))continue;
   const activities=c.activities.split(',').map(s=>s.trim()).filter(Boolean),type=(col+Number(side>0))%3===0&&activities.length?'activity':'communal',name=type==='activity'?activities[(col+deck)%activities.length]:'Great hall';const shape=hallShape(c.pieceStyle,col*2+deck+Number(side>0));
   const hall=add(type,deck,x,z,rw,rd,y,h,`${name} ${deck+1}.${col+1}${side<0?'N':'S'}`,shape,Math.round(rw*rd/8));hall.terrainClearance=terrainMin-y-h;hall.terrainMin=terrainMin;hall.frameThickness=Math.max(2.2,rw*.045);
   const nearZ=wallAtZ(hall,cx,-side),hub=hubs[col];link(hub,hall,deck,cx,0,cx,nearZ,y);if(Math.abs(cx-xs[col])>.1)link(hub,hub,deck,xs[col],0,cx,0,y);
   doors.push({id:'door-'+hall.id,a:hall.id,x:cx,y,z:nearZ,deck,width:Math.min(5,c.corridor),height:4.2,kind:'door'});
   const thick=hall.frameThickness;frames.push({room:hall.id,deck,material:'pale-stone',thickness:thick,height:h,span:rw,pillars:4});
   // Daylight shafts are vertical, dry, and terminate in low surface lanterns.
   // Only upper-level halls get direct shafts; lower floors borrow light via lifts.
   const surface=terrainAt(t,cx,cz),shaftWidth=Math.min(18,rw*.23);
   if(deck===0&&minTerrain(t,cx-shaftWidth/2,cz-shaftWidth/2,shaftWidth,shaftWidth)>1){skylights.push({id:'sky-'+hall.id,room:hall.id,x:cx,z:cz,bottom:y+h,top:surface+4.5,ground:surface,width:shaftWidth,depth:shaftWidth*.8,buildingHeight:4.5,deck,naturalLight:true});hall.daylight='direct skylight';}else hall.daylight=deck?'borrowed / supplemental':'supplemental';
   const count=Math.round(c.privateShare/100*6),pod=c.privateSize;for(let q=0;q<count;q++){
    const direction=q%2?1:-1,rank=Math.floor(q/2),pw=pod*(rng()<c.coupleShare/100?1.25:1),pd=pod,px=cx+direction*(rw/2+14+rank*(pod+6))-pw/2,pz=nearZ-side*(16+pd/2)-pd/2;
    if(Math.abs(px)+pw>c.length*.49||!fit(px,pz,pw,pd,y,3.4))continue;
    if(rooms.some(r=>r.deck===deck&&r.type!=='transit'&&px<r.x+r.w+2&&px+pw>r.x-2&&pz<r.z+r.d+2&&pz+pd>r.z-2))continue;
    const couple=pw>pod,pr=add(couple?'couple':'individual',deck,px,pz,pw,pd,y,3.4,`${couple?'Couple':'Individual'} quarters ${deck+1}.${col+1}.${side}.${q}`,'rectangle',couple?2:1),portalZ=side<0?pz+pd:pz,joinZ=nearZ-side*(16+pd+5);
    const walk=link(hub,pr,deck,cx,joinZ,px+pw/2,joinZ,y,3);link(walk,pr,deck,px+pw/2,joinZ,px+pw/2,portalZ,y,3);doors.push({a:pr.id,x:px+pw/2,y,z:portalZ,deck,width:1.8,height:2.4,kind:'door'});
   }
  }
  // Long straight rail alignment beneath the pedestrian concourses.
  const stops=[];
  for(const k of [0,columns-1]){const x=xs[k],z=0,station=add('rail',deck,x-11,z-6,22,12,y-12,6,`Rail station ${deck+1}.${k===0?'W':'E'}`,'octagonal');station.fastTravel=true;stops.push(station);
   const hub=hubs[k],surface=terrainAt(t,x,z),shaft={id:`E-${deck}-${k}`,deck,x,z,y:y-12,top:deck===0?Math.max(0,surface)+7:floor0,from:station.id,to:hub.id,width:6};lifts.push(shaft);edge(station,hub,'elevator',{label:'E'});if(deck>0)edge(hub,tierHubs[deck-1][k],'elevator',{label:'E'});
   if(deck===0){let tz=z;for(const dz of [0,15,-15,30,-30,45,-45])if(minTerrain(t,x-7,dz-7,14,14)>0){tz=dz;break;}const ground=terrainAt(t,x,tz);if(minTerrain(t,x-7,tz-7,14,14)>0){terminals.push({id:`terminal-${k}`,x,z:tz,y:ground,width:14,depth:12,height:9,deck:0,elevator:shaft.id,station:station.id,railDistance:Math.abs(tz),shape:'tapered-stone'});shaft.surfaceZ=tz;shaft.top=ground+7;}else warnings.push('A rail stop has no dry surface terminal in its immediate vicinity.');}
  }
  const a=stops[0],b=stops[1];rails.push({id:'rail-'+deck,deck,a:a.id,b:b.id,width:4,height:5,fastTravel:true,path:[[a.x+a.w/2,y-10,0],[b.x+b.w/2,y-10,0]],length:xs.at(-1)-xs[0]});edge(a,b,'rail',{label:'R',fastTravel:true});
 }
 // Shared daylight wells stand in the open space between rooms. Lower halls
 // receive lateral clerestory galleries from these wells, not fictitious sky.
 const halls=rooms.filter(r=>['communal','activity'].includes(r.type));
 for(const cx of xs)for(const side of [-1,1]){
  let site=null;for(const dx of [cell*.30,-cell*.30,cell*.39,-cell*.39])for(const factor of [.12,.07,.17]){const x=cx+dx,z=side*c.width*factor,size=12;
   if(Math.abs(x)+size>c.length*.48||minTerrain(t,x-6,z-6,12,12)<1)continue;
   if(rooms.some(r=>r.type!=='transit'&&x+8>r.x&&x-8<r.x+r.w&&z+8>r.z&&z-8<r.z+r.d))continue;
   site={x,z};break;}if(!site)continue;
  const ground=terrainAt(t,site.x,site.z),well={id:'lightwell-'+lightWells.length,...site,width:12,depth:12,ground,top:ground+4,bottom:floor0-(c.decks-1)*c.height+5,buildingHeight:4,galleries:[]};lightWells.push(well);
 }
 for(const hall of halls){if(hall.daylight==='direct skylight')continue;const cx=hall.x+hall.w/2,cz=hall.z+hall.d/2,well=[...lightWells].sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz))[0];if(!well)continue;
  const portal=[cx,hall.y+hall.h*.75,cz-Math.sign(cz)*hall.d/2];well.galleries.push({room:hall.id,deck:hall.deck,width:8,height:4,path:[[well.x,portal[1],well.z],[cx,portal[1],well.z],portal]});hall.daylight='natural light via shared well';hall.lightWell=well.id;
 }
 // Reject unbuildable settings rather than exporting out-of-hull geometry.
 if(!rooms.some(r=>r.type==='communal'||r.type==='activity'))throw Error('No large spaces fit these settings. Reduce the span or lake depth, or choose another garden.');
 const invalid=rooms.find(r=>!fit(r.x,r.z,r.w,r.d,r.y,r.h));if(invalid)throw Error('These levels reach beyond the garden slab. Reduce levels, level spacing, or lake depth.');
 const floorArea=rooms.reduce((s,r)=>s+r.area,0),inhabited=rooms.filter(r=>!['transit','station','rail'].includes(r.type)),open=inhabited.filter(r=>r.type==='communal'||r.type==='activity');
 const layout={schema:'rfl.interiors.v3',units:'metres',axes:{up:'y',deckDirection:'negative-y'},config:c,ship:c.preset==='gsv'?{...gardenFrame(c),playerHeight:PLAYER_HEIGHT,source}:null,terrain:t,rooms,edges,doors,lifts,rails,terminals,skylights,lightWells,frames,envelope:[],warnings,stats:{rooms:inhabited.length,residents:inhabited.reduce((s,r)=>s+r.capacity*(r.type==='individual'||r.type==='couple'?1:0),0),floorArea,circulation:rooms.filter(r=>['transit','station'].includes(r.type)).reduce((s,r)=>s+r.area,0)/floorArea,openSpaces:open.length,unbuilt:1-floorArea/(c.length*c.width*c.decks),terrainAdaptations:shifted,railLength:rails.reduce((s,r)=>s+r.length,0)}};
 const sections=edgeSections(c);for(const r of sections){const nearest=rooms.filter(s=>s.type==='rail'&&s.deck===0).sort((a,b)=>Math.hypot(a.x-r.x,a.z-r.z)-Math.hypot(b.x-r.x,b.z-r.z))[0],a=[nearest.x+nearest.w/2,nearest.y+3,nearest.z+nearest.d/2],b=[r.x+r.w/2,r.y+3,r.z+r.d/2],path=edgeRailPath(a,b,layout.ship.origin);if(!path){warnings.push(r.name+' reserved; no internal rail alignment found.');continue;}rooms.push(r);rails.push({id:'rail-'+r.id,deck:0,a:nearest.id,b:r.id,width:4,height:5,path,length:pathLength(path),fastTravel:true,edgeRoute:true,enclosure:'sealed',waterAllowed:true});edge(nearest,r,'rail',{label:'R',fastTravel:true});}
 layout.edgeSections=rooms.filter(r=>r.edgeSection);layout.reservedEdgeZones=sections.map(r=>({id:r.id,region:r.region,usage:r.type,hullFace:r.hullFace,connected:rooms.includes(r)}));layout.shipOrientation={bow:c.bow,axis:'x',aftHangars:true,forwardGalleries:true};embedStructures(layout);allowWaterCrossings(layout);applyWindows(layout);layout.stats.railLength=rails.reduce((s,r)=>s+r.length,0);layout.stats.hangars=layout.edgeSections.filter(r=>r.type==='hangar').length;layout.stats.galleries=layout.edgeSections.filter(r=>r.type==='gallery').length;layout.stats.exteriorWindows=layout.windows.length;return growInteriors(layout,{id:'garden-envelope',floors:Array.from({length:c.decks},(_,i)=>floor0-i*c.height),fits:(r,sky)=>r.x>=-c.length*.49&&r.x+r.w<=c.length*.49&&r.z>=-c.width*.49&&r.z+r.d<=c.width*.49&&(sky?fit(r.x,r.z,r.w,r.d,r.y,4.2):fit(r.x,r.z,r.w,r.d,r.y,r.h)),surface:r=>surfaceRange(t,r)});
}
export function route(layout,start,end){const q=[start],seen=new Map([[start,null]]),adj=new Map();for(const e of layout.edges)for(const [a,b] of [[e.a,e.b],[e.b,e.a]]){if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);}while(q.length){const a=q.shift();if(a===end){const p=[];let k=end;while(k){p.unshift(k);k=seen.get(k);}return p;}for(const b of adj.get(a)||[])if(!seen.has(b)){seen.set(b,a);q.push(b);}}return [];}
