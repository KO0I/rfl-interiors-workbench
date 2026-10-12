import {growInteriors,surfaceRange} from './interior-growth.mjs';
import {landscape} from './plate-landscape.mjs';
import {footprint,shapeRoom,roomShapes,hallShape,polygonArea,wallAtZ} from './room-shapes.mjs';
import {addGardenLayer} from './garden-layer.mjs';
import './climate-terrain.js';
import {random,clamp,terrainAt,terrainTriangles,minTerrain} from './terrain.mjs';
export const PLATE={length:53000,width:22000,height:4000,bottom:-3600,top:400};
const sx=50000/90000,sz=22000/60000;
export const outline=[[-45000,-24000],[-39000,-30000],[39000,-30000],[45000,-24000],[45000,24000],[39000,30000],[-39000,30000],[-45000,24000]].map(([x,z])=>[x*sx,z*sz]);
export const scaledOutline=s=>outline.map(([x,z])=>[x*s,z*s]);
export function inPlate(x,z,s=1){return Math.abs(x/sx)<=45000*s+1e-6&&Math.abs(z/sz)<=30000*s+1e-6&&Math.abs(x/sx)+Math.abs(z/sz)<=69000*s+1e-6;}
// Clip height-field triangles exactly to the chamfered garden boundary.
export function clipDeck(v,poly){let out=v;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],side=p=>(b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0]),input=out;out=[];for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],dp=side(p),dq=side(q);if(dp>=0)out.push(p);if((dp>=0)!==(dq>=0)){const f=dp/(dp-dq);out.push(p.map((n,k)=>n+(q[k]-n)*f));}}}return out;}
function wetPolygon(v){const out=[];for(let i=0;i<v.length;i++){const a=v[i],b=v[(i+1)%v.length];if(a[1]<0)out.push(a);if((a[1]<0)!==(b[1]<0)){const f=-a[1]/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*f,0,a[2]+(b[2]-a[2])*f]);}}return out;}
export function plateTerrain(c){const t=landscape(c);t.mesh=terrainTriangles(t).map(v=>clipDeck(v,scaledOutline(.9))).filter(v=>v.length>=3);return t;}
export function bridgeHull(bow=1){
 const polygon=[[39600,-5300],[45500,-5300],[48000,-3500],[48000,3500],[45500,5300],[39600,5300]].map(([x,z])=>[(x<=45000?x*sx:25000+(x-45000))*bow,z*sz*bow]);
 return {name:'Bow bridge projection',polygon,bottom:-840,roof:polygon.map(([x,z])=>[x,Math.abs(x)>25500?-70:52,z]),projection:3000};
}
export function generatePlate(input){const c={...input,preset:'plate',length:53000,width:22000,stage:['terrain','water','complete'].includes(input.stage)?input.stage:'complete'};
 for(const [key,lo,hi,fallback] of [['mountain',0,400,300],['lakeDepth',0,300,120],['lakeShare',0,70,35],['decks',1,4,4],['height',200,800,600],['privateSize',6,18,9],['communalSize',55,170,100],['privateShare',0,100,35],['coupleShare',0,100,40],['cover',4,20,8]])c[key]=clamp(Number.isFinite(+c[key])?+c[key]:fallback,lo,hi);
 c.decks=Math.round(c.decks);c.bow=+c.bow===-1?-1:1;c.seed=String(c.seed).slice(0,80);const t=plateTerrain(c),rooms=[],edges=[],rails=[],lifts=[],waterVolumes=[],deckPolygons=[],rng=random(c.seed+':plate-rooms');
 if(c.stage!=='terrain')for(const v of t.mesh){const bottom=wetPolygon(v);if(bottom.length<3)continue;const top=bottom.map(p=>[p[0],0,p[2]]),faces=[bottom.slice().reverse(),top];for(let k=0;k<bottom.length;k++)faces.push([bottom[k],bottom[(k+1)%bottom.length],top[(k+1)%top.length],top[k]]);let volume=0;for(let k=1;k<bottom.length-1;k++){const [a,b,d]=[bottom[0],bottom[k],bottom[k+1]],area=Math.abs((b[0]-a[0])*(d[2]-a[2])-(d[0]-a[0])*(b[2]-a[2]))/2;volume+=area*(-a[1]-b[1]-d[1])/3;}waterVolumes.push({id:'water-'+waterVolumes.length,kind:'lake-or-river-cell',bottom,top,faces,volume});}
 const add=(type,deck,x,z,w,d,y,h,name,shape='rectangle',profile='level')=>{const r={id:'p'+rooms.length,type,deck,x,z,w,d,y,h,name,area:w*d,shape:'rectangle',polygon:[[x,z],[x+w,z],[x+w,z+d],[x,z+d]],capacity:type==='couple'?2:type==='individual'?1:0,windows:[]};shapeRoom(r,shape,profile);rooms.push(r);return r;};
 const edge=(a,b,kind)=>edges.push({a:a.id,b:b.id,kind,label:kind==='rail'?'R':kind==='elevator'?'E':undefined});
 const train=(a,b,path)=>{rails.push({id:'rail-'+rails.length,deck:a.deck,a:a.id,b:b.id,path,width:8,height:6,fastTravel:true,waterCrossings:[],enclosure:'sealed',length:path.slice(1).reduce((s,p,i)=>s+Math.hypot(...p.map((v,k)=>v-path[i][k])),0)});edge(a,b,'rail');};
 let last=[];
 for(let deck=0;deck<c.decks;deck++){const y=-400-deck*c.height,poly=scaledOutline(.96),serviceDeck=c.decks>1&&deck===c.decks-1;deckPolygons.push({deck,y,name:serviceDeck?'Hangars & bays':deck===0?'Garden undercroft & bridge':'Habitation '+(deck+1),role:serviceDeck?'hangars-bays':'habitation',polygon:poly,bottom:PLATE.bottom,roof:'terrain and water-bed constrained'});if(c.stage!=='complete')continue;
  const stops=[];
  // Four sites on each long side. Actual hull-face quarters, aft hangars.
  for(const side of [-1,1])for(const x of [-17000,-5600,5600,17000]){const z=side*(serviceDeck?8067:9900),s=add('rail',deck,x-20,z-15,40,30,y,10,`Rail ${deck+1} / ${side*c.bow<0?'P':'S'} ${x/1000}`);stops.push(s);
   const hangar=x*c.bow<0,bay=serviceDeck&&!hangar,depth=serviceDeck?1650:hangar?440:c.privateSize,width=serviceDeck?3300:hangar?1000:c.privateSize,count=hangar||bay?1:Math.round(c.privateShare/10);
   const hubZ=side*(serviceDeck?8617:hangar?10083:10525),hub=add('station',deck,x-25,hubZ-25,50,50,y,8,`Edge concourse ${deck+1}.${stops.length}`);train(s,hub,[[x,y+3,z],[x,y+3,hubZ]]);
   for(let k=0;k<count;k++){const couple=!hangar&&!bay&&rng()<c.coupleShare/100,w=width*(couple?1.4:1),px=x+(k-(count-1)/2)*30-w/2,pz=side<0?-10560:10560-depth,r=add(hangar?'hangar':bay?'bay':couple?'couple':'individual',deck,px,pz,w,depth,y,serviceDeck?160:hangar?100:3.4,`${hangar?(serviceDeck?'Grand aft hangar':'Aft hangar'):bay?'Docking & service bay':couple?'Couple quarters':'Individual quarters'} ${deck+1}.${stops.length}.${k+1}`);r.edgeSection=true;r.plateSection=true;r.region=hangar?'aft':'forward';r.outward=[0,0,side];r.daylight=hangar||bay?'hull aperture':'exterior window';const outer=side*10560;const aperture=[[px+w*.2,y+1,outer],[px+w*.8,y+1,outer],[px+w*.8,y+r.h-1,outer],[px+w*.2,y+r.h-1,outer]];r.aperture={vertices:aperture};r.hullCenter=[px+w/2,y+r.h/2,outer];r.vertices=[...r.polygon.map(([a,b])=>[a,y,b]),...r.polygon.map(([a,b])=>[a,y+r.h,b])];if(!hangar&&!bay)r.windows=[{face:side<0?'north':'south',vertices:aperture}];
    // Door on the inward wall, short walking spur from the concourse.
    const iz=side<0?pz+depth:pz,corridor=add('transit',deck,Math.min(x,px+w/2)-2,Math.min(hubZ,iz),Math.max(4,Math.abs(px+w/2-x)+4),Math.max(4,Math.abs(hubZ-iz)),y,4,'Edge walking corridor');edge(hub,corridor,'walk');edge(corridor,r,'walk');
   }
   const hz=side*5133,index=stops.length-1+deck*3,hw=c.communalSize*.5*(index%3===0?34:index%3===1?18:7),hd=hw*(.56+rng()*.25),hh=Math.min(130,c.height*.64,100+hw*.14),shape=hallShape(c.pieceStyle,index),hall=add(serviceDeck?'bay':'communal',deck,x-hw/2,hz-hd/2,hw,hd,y,hh,`${serviceDeck?'Freight assembly bay':hw>2000?'Monumental great hall':'Stone hall'} ${deck+1}.${stops.length}`,shape,index%2?'terraced':'level');hall.frameThickness=Math.max(5,hw*.018);hall.daylight='supplemental; no direct exterior window';hall.monumental=hw>2000;const doorZ=wallAtZ(hall,x,side);train(s,hall,[[x,y+3,z],[x,y+3,doorZ],[x,y+3,hz]]);
  }
  // Closed perimeter follows the same bevels as the deck, including end caps.
  const order=[0,1,2,3,7,6,5,4];for(let k=0;k<order.length;k++){const a=stops[order[k]],b=stops[order[(k+1)%order.length]],p=[a.x+20,y+3,a.z+15],q=[b.x+20,y+3,b.z+15],path=[p];if(p[2]!==q[2]){const sign=Math.sign(p[0]);path.push([sign*20000,y+3,p[2]],[sign*22778,y+3,Math.sign(p[2])*7700],[sign*22778,y+3,Math.sign(q[2])*7700],[sign*20000,y+3,q[2]]);}path.push(q);train(a,b,path);}
  if(deck)for(let k=0;k<stops.length;k++){edge(stops[k],last[k],'elevator');lifts.push({id:'lift-'+deck+'-'+k,deck,x:stops[k].x+20,z:stops[k].z+15,y,top:last[k].y,width:6,from:stops[k].id,to:last[k].id});}last=stops;
 }
 // Central bow extension: independent hull, connected to deck 1 by rail and a walking throat.
 const bridge=bridgeHull(c.bow);
 if(c.stage==='complete'){
  const b=c.bow,poly=[[43500,-4000],[46500,-4000],[48000,-3000],[48000,3000],[46500,4000],[43500,4000]].map(([x,z])=>[(x<=45000?x*sx:25000+(x-45000))*b,z*sz*b]);
  const r=add('bridge',0,b>0?24166.666666666668:-28000,-1466.6666666666667,3833.333333333332,2933.3333333333335,-400,180,'bridge');
  r.shape='bow projection';r.polygon=poly;r.area=polygonArea(poly);r.volume=r.area*r.h;r.volumes=[{polygon:poly,y:r.y,h:r.h}];
  r.hullExtension=true;r.edgeSection=true;r.plateSection=true;r.region='bow';r.outward=[b,0,0];r.daylight='panoramic bow window';
  const aperture=[[28000*b,-360,-916],[28000*b,-360,916],[28000*b,-250,916],[28000*b,-250,-916]];
  r.aperture={vertices:aperture};r.windows=[{face:'bow',vertices:aperture}];r.hullCenter=[28000*b,-310,0];
  const station=add('rail',0,23333.333333333332*b-20,-15,40,30,-400,10,'Bridge interchange [R]');
  const throat=add('transit',0,b>0?23333.333333333332:-24166.666666666668,-16,833.333333333336,32,-400,12,'Bridge access gallery');throat.hullExtension=true;
  edge(station,throat,'walk');edge(throat,r,'walk');
  const near=rooms.filter(q=>q.type==='rail'&&q.deck===0&&q!==station).sort((a,d)=>Math.hypot(a.x-station.x,a.z)-Math.hypot(d.x-station.x,d.z))[0];
  train(near,station,[[near.x+20,-397,near.z+15],[20000*b,-397,near.z+15],[22778*b,-397,7700*Math.sign(near.z)],[23333.333333333332*b,-397,0]]);
 }
 // The canyon is a real surface void carved by the terrain stage. Its map
 // volume follows that same floor mesh; it is explicitly open to the sky.
 if(c.stage==='complete'){
  const feature=t.spec.canyon,p=feature.polygon,x=Math.min(...p.map(v=>v[0])),z=-8000*sz,w=Math.max(...p.map(v=>v[0]))-x,d=16000*sz;
  const canyon=add('canyon',0,x,z,w,d,feature.floor,feature.rim+80-feature.floor,feature.name);canyon.shape='canyon';canyon.polygon=p;canyon.area=polygonArea(p);canyon.openToSky=true;canyon.terrainFeature='canyon';canyon.daylight='open sky';canyon.profile='terrain floor';canyon.volumes=feature.strips.map(polygon=>({polygon,y:canyon.y,h:canyon.h}));
  canyon.floorMesh=[];
  for(const strip of feature.strips){const minX=Math.min(...strip.map(p=>p[0])),maxX=Math.max(...strip.map(p=>p[0])),minZ=strip[0][1],maxZ=strip[2][1];for(const v of t.mesh){if(Math.max(...v.map(p=>p[0]))<minX||Math.min(...v.map(p=>p[0]))>maxX||Math.max(...v.map(p=>p[2]))<minZ||Math.min(...v.map(p=>p[2]))>maxZ)continue;const clipped=clipDeck(v,strip);if(clipped.length>=3)canyon.floorMesh.push(clipped);}}
  canyon.volume=canyon.floorMesh.reduce((sum,v)=>{for(let i=1;i<v.length-1;i++){const a=v[0],b=v[i],d=v[i+1],area=Math.abs((b[0]-a[0])*(d[2]-a[2])-(d[0]-a[0])*(b[2]-a[2]))/2;sum+=area*(canyon.y+canyon.h-(a[1]+b[1]+d[1])/3);}return sum;},0);
  const cx=24000*sx,cz=0,floor=terrainAt(t,cx,cz),station=rooms.filter(r=>r.deck===0&&r.type==='rail').sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz))[0];
  const foot=add('rail',0,cx-20,cz-15,40,30,station.y,10,'Canyon rail station [R]');train(station,foot,[[station.x+20,station.y+3,station.z+15],[cx,station.y+3,station.z+15],[cx,station.y+3,cz]]);
  edge(foot,canyon,'elevator');lifts.push({id:'canyon-lift',deck:0,x:cx,z:cz,y:station.y,top:floor,width:8,from:foot.id,to:canyon.id});
 }
 // All generated enclosed volumes clear both the deepest water bed and hull.
 for(const r of rooms.filter(r=>!r.openToSky&&!r.hullExtension)){if(r.polygon.some(([x,z])=>!inPlate(x,z,.96))||r.y<PLATE.bottom||r.y+r.h+c.cover>minTerrain(t,r.x,r.z,r.w,r.d))throw Error('Plate volume exceeds deck or terrain bounds: '+JSON.stringify(r));}
 const area=Math.abs(outline.reduce((s,p,i)=>{const q=outline[(i+1)%outline.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2,windows=rooms.flatMap(r=>r.windows),used=rooms.reduce((s,r)=>s+r.area,0);
 const result={schema:'rfl.interiors.plate.v1',units:'metres',axes:{up:'y',surfaceNormal:[0,1,0],bow:[c.bow,0,0],port:[0,0,-c.bow]},shipOrientation:{bow:c.bow,axis:'x'},config:c,ship:{class:'Plate-class',dimensions:PLATE,overallDimensions:{length:53000,width:22000,height:4000},origin:[0,0,0],playerHeight:1.95,source:{reference:'User supplied stepped Plate-class silhouette'}},envelope:outline,extensions:[bridge],deckPolygons,terrain:t,waterVolumes,rooms,edges,rails,lifts,windows,edgeSections:rooms.filter(r=>r.edgeSection),doors:[],terminals:[],skylights:[],lightWells:[],frames:[],warnings:[],stats:{openSpaces:rooms.filter(r=>['communal','canyon','bridge'].includes(r.type)).length,residents:rooms.reduce((s,r)=>s+r.capacity,0),unbuilt:1-used/(area*c.decks),railLength:rails.reduce((s,r)=>s+r.length,0),terrainAdaptations:0,waterVolume:waterVolumes.reduce((s,v)=>s+v.volume,0)},generation:{stage:c.stage,selectedDeckBands:c.decks,filledHull:false,terrain:t.spec.source.procedure,hydrology:t.spec.hydrology}};
 if(c.gardenPrototype&&c.stage==='complete')addGardenLayer(result);
 return growInteriors(result,{id:'plate-envelope',floors:deckPolygons.map(d=>d.y),fits:(r,sky)=>r.y>=PLATE.bottom&&r.polygon.every(([x,z])=>inPlate(x,z,.90))&&(sky||r.y+r.h+c.cover<=minTerrain(t,r.x,r.z,r.w,r.d)),surface:r=>surfaceRange(t,r)});
}
