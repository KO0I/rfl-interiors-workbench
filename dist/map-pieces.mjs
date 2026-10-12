// Original parametric abstractions of the supplied top-down references.
// Coordinates are normalized footprints, not traced or imported game meshes.
const oct=[[.22,0],[.78,0],[1,.22],[1,.78],[.78,1],[.22,1],[0,.78],[0,.22]];
export const pieces=[
 {id:'chamfer-hall',name:'Chamfered hall',family:'craft',role:'hub',polygon:oct,ports:4,source:'Pirate Frigate · Biotech Research',rule:'Aligned walls and clipped corners; 2–4 perimeter entrances.'},
 {id:'stepped-bay',name:'Stepped bay',family:'craft',role:'branch',polygon:[[.15,0],[.8,0],[.8,.2],[1,.2],[1,.8],[.8,.8],[.8,1],[.15,1],[.15,.75],[0,.75],[0,.25],[.15,.25]],ports:3,source:'Phazon Mines · Central Dynamo',rule:'Side annexes leave a clear central aisle; recesses hold equipment.'},
 {id:'cross-junction',name:'Cross junction',family:'craft',role:'junction',polygon:[[.3,0],[.7,0],[.7,.3],[1,.3],[1,.7],[.7,.7],[.7,1],[.3,1],[.3,.7],[0,.7],[0,.3],[.3,.3]],ports:4,source:'Chozo Ruins · Energy Core',rule:'Four axial sockets; use as a circulation hub, not a room filler.'},
 {id:'u-court',name:'U-shaped court',family:'craft',role:'landmark',polygon:[[0,0],[1,0],[1,1],[.7,1],[.7,.35],[.3,.35],[.3,1],[0,1]],ports:2,source:'Chozo Ruins · Watery Hall',rule:'Two arms around an open recess. The recess is excluded from the footprint.'},
 {id:'radial-core',name:'Radial core',family:'craft',role:'landmark',polygon:oct,ports:4,source:'Pirate Frigate · Reactor Core',rule:'Faceted perimeter with central machinery and a surrounding route.'},
 {id:'lift-cell',name:'Lift cell [E]',family:'craft',role:'vertical',polygon:oct,ports:2,source:'Frigate / Mines · deck elevators',rule:'Same X/Z socket on adjacent levels; vertical edge is explicit.'},
 {id:'service-pocket',name:'Service pocket',family:'craft',role:'terminal',polygon:[[0,0],[1,0],[1,1],[0,1]],ports:1,source:'Frigate · Map Facility / save rooms',rule:'Small one-entrance branch attached to a route, with no onward traffic.'},
 {id:'straight-hall',name:'Straight hall',family:'craft',role:'passage',polygon:[[0,.35],[1,.35],[1,.65],[0,.65]],ports:2,source:'Frigate · Deck Alpha Access Hall',rule:'Constant width, aligned entrances, short room-to-room links.'},
 {id:'dogleg-hall',name:'Dogleg hall',family:'craft',role:'passage',polygon:[[0,.2],[.65,.2],[.65,.7],[1,.7],[1,1],[.35,1],[.35,.5],[0,.5]],ports:2,source:'Frigate · ventilation shafts',rule:'Orthogonal bends break sightlines; socket normals follow the end segments.'},
 {id:'cavern-basin',name:'Faceted basin',family:'natural',role:'hub',polygon:[[.17,.03],[.52,0],[.83,.15],[1,.46],[.88,.79],[.6,1],[.21,.86],[0,.51]],ports:4,source:'Magmoor · Lava Lake',rule:'Unequal facets and broad floor; entrances vary in heading and width.'},
 {id:'lobed-cavern',name:'Lobed cavern',family:'natural',role:'branch',polygon:[[.13,0],[.48,.07],[.66,0],[.94,.22],[1,.55],[.84,.77],[.61,1],[.33,.91],[.17,.98],[0,.63],[.06,.34]],ports:3,source:'Magmoor · Triclops Pit',rule:'Connected lobes separated by shallow necks; vary floor elevations.'},
 {id:'ravine',name:'Bent ravine',family:'natural',role:'landmark',polygon:[[.1,0],[.43,.05],[.56,.27],[.84,.46],[1,.74],[.81,1],[.53,.8],[.35,.53],[.08,.35],[0,.13]],ports:2,source:'Phendrana · Phendrana Canyon',rule:'Long diagonal chamber with a changing width; terrain controls its floor.'},
 {id:'shore-chamber',name:'Shore chamber',family:'natural',role:'hub',polygon:[[.17,.03],[.55,0],[.93,.18],[1,.52],[.81,.92],[.49,1],[.2,.82],[0,.43]],ports:3,source:'Tallon · Landing Site / Magmoor · Fiery Shores',rule:'Large irregular clearing; water occupies part of the volume, not the whole route.'},
 {id:'pinch-tunnel',name:'Pinch tunnel',family:'natural',role:'passage',polygon:[[0,.15],[.3,.29],[.55,.43],[.8,.18],[1,.22],[1,.78],[.8,.82],[.55,.57],[.3,.71],[0,.85]],ports:2,source:'Magmoor · Lake Tunnel / Twin Fires Tunnel',rule:'Wide mouths and a narrow waist; minimum passage width stays traversable.'},
 {id:'bent-tunnel',name:'Bent tunnel',family:'natural',role:'passage',polygon:[[0,.1],[.32,.15],[.52,.37],[.73,.42],[1,.72],[.83,1],[.64,.68],[.34,.64],[.18,.4],[0,.36]],ports:2,source:'Magmoor · Burning Trail / Phendrana · access caves',rule:'Unequal segment lengths and gradual heading changes; no grid alignment.'},
 {id:'rock-alcove',name:'Rock alcove',family:'natural',role:'terminal',polygon:[[.25,0],[.7,.05],[1,.44],[.8,.87],[.4,1],[.04,.64],[0,.21]],ports:1,source:'Magmoor · Storage Cavern',rule:'Single-neck offshoot; small refuge on a longer route.'},
 {id:'terraced-atrium',name:'Terraced atrium',family:'hybrid',role:'hub',polygon:[[.2,0],[.74,0],[1,.24],[.88,.69],[.67,1],[.18,.89],[0,.55],[.07,.2]],ports:4,source:'Chozo · Arboretum / Phendrana · Ruined Courtyard',rule:'Built terraces inside an uneven outer volume; use stepped ceilings.'},
 {id:'embedded-station',name:'Embedded station',family:'hybrid',role:'landmark',polygon:[[.15,0],[.76,.05],[.96,.25],[1,.7],[.8,1],[.1,.88],[0,.55]],ports:3,source:'Magmoor · Monitor Station / Phazon · Main Quarry',rule:'Angular built chamber fitted into a rock envelope; engineered entrances.'},
];
for(const p of pieces){const directions=p.ports===1?[[-1,0]]:p.ports===2?[[-1,0],[1,0]]:p.ports===3?[[-1,0],[1,0],[0,1]]:[[0,-1],[1,0],[0,1],[-1,0]],used=new Set();p.sockets=directions.map(([dx,dz])=>{const edges=p.polygon.map((a,i)=>{const b=p.polygon[(i+1)%p.polygon.length];return {i,x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,a,b};}).filter(e=>!used.has(e.i)).sort((a,b)=>(b.x*dx+b.z*dz)-(a.x*dx+a.z*dz));const e=edges[0];used.add(e.i);const nx=e.b[1]-e.a[1],nz=e.a[0]-e.b[0],len=Math.hypot(nx,nz);return {edge:e.i,position:[e.x,e.z],normal:[nx/len,nz/len],kind:p.role==='vertical'?'lift-landing':'walk'};});}
export const pieceById=Object.fromEntries(pieces.map(p=>[p.id,p]));
export const familyRules={craft:'Align chambers to the ship axes. Use constant-width halls, doglegs, service branches and explicit lift shafts.',natural:'Use uneven chamber silhouettes, changing tunnel widths and oblique approaches. Leave rock between branches.',hybrid:'Alternate natural chambers and constructed hubs. Transition through a short neck; built passages retain clear axial entrances.'};
export const referenceNotes=[
 ['Pirate Frigate','Constructed','Deck spine, utility bypass loop, airlocks, side pockets, reactor landmark and vertical shafts.'],
 ['Tallon Overworld','Mixed','Large clearings with short branches; natural canyon routes connect to embedded craft remnants.'],
 ['Chozo Ruins','Constructed / eroded','Multi-entrance plazas, courts and radial landmarks connected by bent access halls.'],
 ['Magmoor Caverns','Natural','Long chamber–neck chain, occasional side alcoves, uneven shore basins and a built station hub.'],
 ['Phendrana Drifts','Mixed','Open basins and cave branches transition to an aligned research complex; loops return at different heights.'],
 ['Phazon Mines','Industrial / natural','Processing hubs, constrained connectors and explicit elevator-separated strata.'],
];
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
export function instantiatePiece(id,{x=0,z=0,w=50,d=50,y=0,h=12,rotation=0,roomId=id,deck=0}={}){
 const p=pieceById[id];if(!p)throw Error('Unknown map piece: '+id);
 if(![x,z,w,d,y,h,rotation].every(Number.isFinite)||w<=0||d<=0||h<=0)throw Error('Piece dimensions must be positive and finite.');
 const c=Math.cos(rotation),s=Math.sin(rotation),polygon=p.polygon.map(([a,b])=>{a=(a-.5)*w;b=(b-.5)*d;return [x+a*c-b*s,z+a*s+b*c];}),xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]);
 const r={id:roomId,piece:id,name:p.name,type:p.role==='passage'?'transit':p.role==='vertical'?'station':'communal',deck,x:Math.min(...xs),z:Math.min(...zs),w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),y,h,shape:id,profile:'level',polygon,area:area(polygon),capacity:0,family:p.family,role:p.role,windows:[],center:[x,y,z]};
 r.sockets=p.sockets.map(socket=>{const i=socket.edge,a=polygon[i],b=polygon[(i+1)%polygon.length],nx=b[1]-a[1],nz=a[0]-b[0],len=Math.hypot(nx,nz);return {position:[(a[0]+b[0])/2,y,(a[1]+b[1])/2],normal:[nx/len,0,nz/len],kind:socket.kind};});r.volumes=[{polygon,y,h}];r.volume=r.area*h;return r;
}
// Find an actual boundary socket on a ray, even on a concave silhouette.
export function boundarySocket(room,towards){
 const [cx,,cz]=room.center,dx=towards[0]-cx,dz=towards[2]-cz;let best=Infinity,hit=null;
 for(let i=0;i<room.polygon.length;i++){const a=room.polygon[i],b=room.polygon[(i+1)%room.polygon.length],ex=b[0]-a[0],ez=b[1]-a[1],det=dx*ez-dz*ex;if(Math.abs(det)<1e-9)continue;const ax=a[0]-cx,az=a[1]-cz,t=(ax*ez-az*ex)/det,u=(ax*dz-az*dx)/det;if(t>0&&u>=0&&u<=1&&t<best){best=t;hit=[cx+t*dx,room.y,cz+t*dz];}}
 if(!hit)throw Error('No boundary socket for '+room.id);return hit;
}
function passagePolygon(path,widths){const left=[],right=[];for(let i=0;i<path.length;i++){const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),w=widths[i]/2;left.push([path[i][0]-dz/len*w,path[i][2]+dx/len*w]);right.push([path[i][0]+dz/len*w,path[i][2]-dx/len*w]);}return [...left,...right.reverse()];}
export function generatePieceLayout({family='craft',seed='PRIME-01',scale=1}={}){
 if(!familyRules[family])throw Error('Unknown family');scale=Math.max(.5,Math.min(8,Number(scale)||1));let n=2166136261;for(const c of seed)n=Math.imul(n^c.charCodeAt(0),16777619);const rng=()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};
 const rooms=[],edges=[],doors=[],lifts=[];const shapeIds=family==='natural'?['cavern-basin','lobed-cavern','shore-chamber']:family==='hybrid'?['terraced-atrium','cavern-basin','embedded-station','chamfer-hall']:['chamfer-hall','stepped-bay','cross-junction','radial-core'];
 for(let deck=0;deck<2;deck++)for(let row=0;row<2;row++)for(let col=0;col<4;col++){
 const i=row*4+col,vertical=i===3,id=vertical?'lift-cell':i===4?(family==='natural'?'rock-alcove':'service-pocket'):shapeIds[(i+Math.floor(rng()*shapeIds.length))%shapeIds.length],natural=family==='natural',j=natural?12:0;
 const r=instantiatePiece(id,{roomId:`piece-${deck}-${i}`,deck,x:(col*145+(vertical?0:(rng()-.5)*j))*scale,z:(row*155+(vertical?0:(rng()-.5)*j))*scale,w:(45+rng()*20)*scale,d:(40+rng()*22)*scale,y:-deck*36*scale,h:14*scale,rotation:natural&&!vertical?(rng()-.5)*.9:0});rooms.push(r);
 }
 const chambers=[...rooms];
 function connect(a,b){const p=boundarySocket(a,b.center),q=boundarySocket(b,a.center),natural=family==='natural'||family==='hybrid'&&a.family==='natural',bend=natural?(.5+rng())*14*scale:0;
 const path=natural?[p,[(p[0]+q[0])/2+bend,a.y,(p[2]+q[2])/2-bend],q]:[p,q],width=6*scale,widths=path.map((_,i)=>natural?width*(i===1?.7:1.25):width),polygon=passagePolygon(path,widths),xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]),r={id:'passage-'+rooms.length,name:natural?'Variable-width rock passage':'Aligned walking hall',type:'transit',family:natural?'natural':'craft',piece:natural?'bent-tunnel':'straight-hall',role:'passage',deck:a.deck,x:Math.min(...xs),z:Math.min(...zs),w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),y:a.y,h:5*scale,shape:'passage',profile:'level',polygon,area:area(polygon),centerline:path,widths,capacity:0,windows:[]};r.volumes=[{polygon,y:r.y,h:r.h}];r.volume=r.area*r.h;rooms.push(r);edges.push({a:a.id,b:r.id,kind:'walk'},{a:r.id,b:b.id,kind:'walk'});for(const [target,point] of [[a,p],[b,q]])doors.push({id:'socket-'+doors.length,a:target.id,b:r.id,deck:a.deck,x:point[0],y:point[1],z:point[2],width,height:r.h,kind:'door'});}
 for(let deck=0;deck<2;deck++){const rs=chambers.filter(r=>r.deck===deck);for(const [a,b] of [[0,1],[1,2],[2,3],[3,7],[7,6],[6,5],[5,1],[0,4]])connect(rs[a],rs[b]);}
 const [a,b]=chambers.filter(r=>r.piece==='lift-cell');edges.push({a:a.id,b:b.id,kind:'elevator',label:'E'});lifts.push({id:'piece-lift',deck:1,x:a.center[0],z:a.center[2],y:b.y,top:a.y,width:6*scale,from:b.id,to:a.id});
 return {schema:'rfl.interiors.pieces.v1',units:'metres',config:{preset:'orbital',seed,decks:2,family,length:600*scale,width:300*scale},rooms,edges,doors,lifts,rails:[],frames:[],skylights:[],terminals:[],lightWells:[],envelope:[],warnings:[],generation:{family,topology:'spine with return loop, side branch and shared vertical hub',reference:'Original abstractions of user supplied Metroid Prime maps'},stats:{rooms:chambers.length,openSpaces:chambers.length,railLength:0,residents:0,unbuilt:0}};
}
