import {terrainAt} from './terrain.mjs';
import {insideHull} from './exterior.mjs';
export const pathLength=path=>path.slice(1).reduce((s,p,i)=>s+Math.hypot(...p.map((v,k)=>v-path[i][k])),0);
export function allowWaterCrossings(layout){const {terrain:t,config:c}=layout;for(const rail of layout.rails){rail.waterAllowed=true;rail.enclosure='sealed';rail.waterCrossings=[];if(rail.edgeRoute||rail.deck!==0||c.lakeDepth<18||c.lakeShare===0)continue;const a=rail.path[0],b=rail.path.at(-1),lake=t.spec.lake,x1=lake.x-lake.rx*.18,x2=lake.x+lake.rx*.18,y=-c.lakeDepth*.45;
 if(x1<=Math.min(a[0],b[0])+35||x2>=Math.max(a[0],b[0])-35)continue;const p=[x1,y,lake.z],q=[x2,y,lake.z];if([p,q].every(v=>terrainAt(t,v[0],v[2])+3<v[1]-rail.height/2&&v[1]+rail.height/2<-2)){rail.path=[a,p,q,b];rail.length=pathLength(rail.path);rail.waterCrossings.push({segment:1,medium:'water',sealed:true,clearance:2});}}
}
export function edgeRailPath(a,b,origin){const valid=path=>path.slice(1).every((p,i)=>{const q=path[i],steps=Math.max(2,Math.ceil(Math.hypot(...p.map((v,k)=>v-q[k]))/120));for(let j=0;j<=steps;j++){const v=p.map((x,k)=>q[k]+(x-q[k])*j/steps+origin[k]);if(!insideHull(v))return false;}return true;});for(const p of [[a,b],[a,[a[0],b[1],a[2]],b],[a,[b[0],a[1],b[2]],b]])if(valid(p))return p;return null;}
