import {shapeRoom} from './room-shapes.mjs';
import {terrainAt,minTerrain} from './terrain.mjs';
// One-way, bounded prototype inspired by LayerProcGen's layer dependencies.
// No upstream terrain mutation: the navigation surface samples the same mesh.
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function addGardenLayer(l){
 const t=l.terrain,c=l.config,lake=t.spec.lake,step=70,n=100,cx=lake.x+lake.rx+1500,cz=lake.z;
 const origin=[cx-n*step/2,cz-n*step/2],nodes=[];
 for(let z=0;z<=n;z++)for(let x=0;x<=n;x++){const px=origin[0]+x*step,pz=origin[1]+z*step;nodes.push([px,terrainAt(t,px,pz),pz]);}
 const dry=p=>p[1]>2;
 const closest=(x,z)=>nodes.reduce((best,p,i)=>dry(p)&&Math.hypot(p[0]-x,p[2]-z)<best.d?{i,d:Math.hypot(p[0]-x,p[2]-z)}:best,{i:-1,d:Infinity}).i;
 // A* over dry terrain. Sample edges so diagonal moves cannot cross water.
 const segment=(a,b)=>{const out=[],steps=Math.ceil(distance(a,b)/25);for(let k=0;k<=steps;k++){const f=k/steps,x=a[0]+(b[0]-a[0])*f,z=a[2]+(b[2]-a[2])*f;out.push([x,terrainAt(t,x,z),z]);}return out;};
 const cache=new Map();
 function walk(start,end){const g=new Float64Array(nodes.length).fill(Infinity),parent=new Int32Array(nodes.length).fill(-1),open=[],closed=new Set();g[start]=0;
 const push=(i,f)=>{open.push({i,f});let k=open.length-1;while(k){const p=(k-1)>>1;if(open[p].f<=f)break;[open[p],open[k]]=[open[k],open[p]];k=p;}};
 const pop=()=>{const top=open[0],tail=open.pop();if(open.length){open[0]=tail;let k=0;while(true){let j=k*2+1;if(j>=open.length)break;if(j+1<open.length&&open[j+1].f<open[j].f)j++;if(open[k].f<=open[j].f)break;[open[k],open[j]]=[open[j],open[k]];k=j;}}return top.i;};push(start,distance(nodes[start],nodes[end]));
 while(open.length){const a=pop();if(closed.has(a))continue;if(a===end){const ids=[];for(let q=end;q!==-1;q=parent[q])ids.unshift(q);return ids.flatMap((id,k)=>k?segment(nodes[ids[k-1]],nodes[id]).slice(1):[nodes[id]]);}closed.add(a);const x=a%(n+1),z=Math.floor(a/(n+1));for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){if(x+dx<0||x+dx>n||z+dz<0||z+dz>n)continue;const b=(z+dz)*(n+1)+x+dx;if(!dry(nodes[b])||closed.has(b))continue;const key=Math.min(a,b)+':'+Math.max(a,b);let cost=cache.get(key);if(cost===undefined){const p=segment(nodes[a],nodes[b]);let max=0;for(let k=1;k<p.length;k++)max=Math.max(max,Math.abs(p[k][1]-p[k-1][1])/distance(p[k],p[k-1]));cost=p.every(dry)&&max<=.18?distance(nodes[a],nodes[b])*(1+30*max*max):Infinity;cache.set(key,cost);}const candidate=g[a]+cost;if(candidate<g[b]){g[b]=candidate;parent[b]=a;push(b,candidate+distance(nodes[b],nodes[end]));}}}return null;}
 const anchor=closest(cx,cz),chosen=[anchor],walks=[];
 for(const [dx,dz] of [[-1100,-1400],[-1100,1400],[1700,0]]){const target=closest(cx+dx,cz+dz),path=walk(anchor,target);if(!path)throw Error('Garden paths exceed the 18% slope limit. Lower mountains or choose another seed.');chosen.push(target);walks.push(path);}
 const add=(id,type,p,w,d,y,h,name)=>{const r={id,type,deck:0,x:p[0]-w/2,z:p[2]-d/2,w,d,y,h,name,area:w*d,capacity:0,shape:'rectangle',polygon:[[p[0]-w/2,p[2]-d/2],[p[0]+w/2,p[2]-d/2],[p[0]+w/2,p[2]+d/2],[p[0]-w/2,p[2]+d/2]],windows:[],prototype:true};l.rooms.push(r);return r;};
 const points=chosen.map(i=>nodes[i]),names=['Garden interchange',c.bow>0?'Port lakeside terrace':'Starboard lakeside terrace',c.bow>0?'Starboard lakeside terrace':'Port lakeside terrace','Hall entrance'];
 const surface=points.map((p,i)=>add('garden-'+i,'station',p,8,8,p[1],3,names[i]));
 const hallPoint=points[3],hallFloor=minTerrain(t,hallPoint[0]-80,hallPoint[2]+20,160,120)-c.cover-36;
 const hall=add('garden-hall','communal',[hallPoint[0],0,hallPoint[2]+80],160,120,hallFloor,36,'Embedded lakeside great hall');shapeRoom(hall,'stepped','terraced');hall.frameThickness=6;hall.daylight='supplemental; buried stone hall';hall.terrainClearance=minTerrain(t,hall.x,hall.z,hall.w,hall.d)-hall.y-hall.h;
 const edge=(a,b,kind,path)=>l.edges.push({a:a.id,b:b.id,kind,path,label:kind==='elevator'?'E':kind==='rail'?'R':undefined});
 const routes=walks.map((path,i)=>{edge(surface[0],surface[i+1],'walk',path);return {id:'garden-walk-'+i,a:surface[0].id,b:surface[i+1].id,path,width:5};});
 // Surface portal drops to hall floor, then a level corridor meets its north door.
 const hallLift=add('garden-hall-lift','lift',hallPoint,8,8,hallFloor,4,'Hall elevator [E]');
 edge(surface[3],hallLift,'elevator',[[hallPoint[0],hallPoint[1],hallPoint[2]],[hallPoint[0],hallFloor,hallPoint[2]]]);
 edge(hallLift,hall,'walk',[[hallPoint[0],hallFloor,hallPoint[2]],[hallPoint[0],hallFloor,hall.z],[hallPoint[0],hallFloor,hall.z+hall.d/2]]);
 l.doors.push({a:hall.id,x:hallPoint[0],y:hallFloor,z:hall.z,width:5,height:4,kind:'door',deck:0});
 const p=points[0],station=add('garden-rail','rail',p,40,30,-400,10,'Garden rail station [R]');
 edge(surface[0],station,'elevator',[[p[0],p[1],p[2]],[p[0],-400,p[2]]]);
 l.lifts.push({id:'garden-lift',deck:0,x:p[0],z:p[2],y:-400,top:p[1],width:6,from:station.id,to:surface[0].id},{id:'hall-lift',deck:0,x:hallPoint[0],z:hallPoint[2],y:hallFloor,top:hallPoint[1],width:6,from:hallLift.id,to:surface[3].id});
 const nearest=l.rooms.filter(r=>r.type==='rail'&&!r.prototype&&r.deck===0).sort((a,b)=>distance([a.x,0,a.z],p)-distance([b.x,0,b.z],p))[0];
 const railPath=[[p[0],-397,p[2]],[nearest.x+nearest.w/2,-397,p[2]],[nearest.x+nearest.w/2,-397,nearest.z+nearest.d/2]];
 l.rails.push({id:'garden-rail-link',deck:0,a:station.id,b:nearest.id,path:railPath,width:8,height:6,enclosure:'sealed',fastTravel:true,length:railPath.slice(1).reduce((s,q,i)=>s+distance(q,railPath[i]),0)});edge(station,nearest,'rail',railPath);
 const visited=new Set([surface[0].id]),queue=[surface[0].id];while(queue.length){const a=queue.shift();for(const e of l.edges){const b=e.a===a?e.b:e.b===a?e.a:null;if(b&&!visited.has(b)){visited.add(b);queue.push(b);}}}
 if(visited.size!==l.rooms.length)throw Error('Garden connection check failed.');
 l.gardenLayer={schema:'rfl.garden-layers.v1',bounds:{x:origin[0],z:origin[1],width:n*step,length:n*step},center:[cx,0,cz],routes,destinations:surface.map(r=>r.id),layers:['envelope','terrain-water','destinations','walking-rail-elevators','embedded-hall','navigation'],checks:{reachableRooms:visited.size,totalRooms:l.rooms.length,maxWalkingGrade:.18,dryPaths:true,hallBedClearance:hall.terrainClearance},navigation:{nodes:l.rooms.map(r=>({id:r.id,position:[r.x+r.w/2,r.y,r.z+r.d/2]})),edges:l.edges.map(e=>({...e}))},scope:'Bounded eager prototype; not chunk streaming or runtime NPC locomotion'};
 l.stats.openSpaces++;l.stats.railLength+=l.rails.at(-1).length;
 return l;
}
