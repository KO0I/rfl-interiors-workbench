import {pieceById} from './map-pieces.mjs';
// Shared metric footprints and stepped ceilings for generation, map and export.
export const roomShapes=['octagonal','stepped','cruciform','elbow','hexagonal','tapered','tee'];
export function footprint(x,z,w,d,shape='rectangle'){
 const shapes={
  rectangle:[[0,0],[1,0],[1,1],[0,1]],
  octagonal:[[.22,0],[.78,0],[1,.22],[1,.78],[.78,1],[.22,1],[0,.78],[0,.22]],
  stepped:[[0,0],[.64,0],[.64,.27],[1,.27],[1,1],[.24,1],[.24,.78],[0,.78]],
  cruciform:[[.3,0],[.7,0],[.7,.3],[1,.3],[1,.7],[.7,.7],[.7,1],[.3,1],[.3,.7],[0,.7],[0,.3],[.3,.3]],
  elbow:[[0,0],[.66,0],[.66,.36],[1,.36],[1,1],[0,1]],
  hexagonal:[[.22,0],[.78,0],[1,.5],[.78,1],[.22,1],[0,.5]],
  tapered:[[.25,0],[.75,0],[1,1],[0,1]],
  tee:[[0,0],[1,0],[1,.62],[.66,.62],[.66,1],[.34,1],[.34,.62],[0,.62]],
 };
 return (pieceById[shape]?.polygon||shapes[shape]||shapes.rectangle).map(([a,b])=>[x+a*w,z+b*d]);
}
export const polygonArea=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
export function clipX(poly,min,max){
 for(const [cut,sign] of [[min,1],[max,-1]]){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[0]-cut)*sign,db=(b[0]-cut)*sign;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([cut,a[1]+(b[1]-a[1])*t]);}}poly=out;}
 return poly;
}
export function shapeRoom(r,shape,profile='level'){
 r.shape=shape;r.polygon=footprint(r.x,r.z,r.w,r.d,shape);r.area=polygonArea(r.polygon);r.profile=profile;
 r.volumes=profile==='terraced'?[[0,.28,.56],[.28,.68,1],[.68,1,.72]].map(([a,b,f])=>({polygon:clipX(r.polygon,r.x+r.w*a,r.x+r.w*b),y:r.y,h:r.h*f})).filter(v=>v.polygon.length>=3):[{polygon:r.polygon,y:r.y,h:r.h}];
 r.volume=r.volumes.reduce((sum,v)=>sum+polygonArea(v.polygon)*v.h,0);return r;
}
export const roomVolumes=r=>r.volumes||[{polygon:r.polygon,y:r.y,h:r.h}];
export function roomWalls(r){
 const volumes=roomVolumes(r),faces=[],equal=(a,b)=>Math.abs(a[0]-b[0])<1e-6&&Math.abs(a[1]-b[1])<1e-6;
 for(const v of volumes)for(let i=0;i<v.polygon.length;i++){
  const a=v.polygon[i],b=v.polygon[(i+1)%v.polygon.length];let bottom=v.y;
  for(const q of volumes)if(q!==v)for(let j=0;j<q.polygon.length;j++)if(equal(a,q.polygon[(j+1)%q.polygon.length])&&equal(b,q.polygon[j]))bottom=Math.max(bottom,q.y+q.h);
  if(bottom>=v.y+v.h-1e-6)continue;
  faces.push([[a[0],bottom,a[1]],[b[0],bottom,b[1]],[b[0],v.y+v.h,b[1]],[a[0],v.y+v.h,a[1]]]);
 }
 return faces;
}
export function roomHeightAt(r,x,z){
 for(const v of roomVolumes(r)){let inside=false;for(let i=0,j=v.polygon.length-1;i<v.polygon.length;j=i++)if((v.polygon[i][1]>z)!==(v.polygon[j][1]>z)&&x<(v.polygon[j][0]-v.polygon[i][0])*(z-v.polygon[i][1])/(v.polygon[j][1]-v.polygon[i][1])+v.polygon[i][0])inside=!inside;if(inside)return v.y+v.h-r.y;}
 return Math.min(...roomVolumes(r).map(v=>v.h));
}
// Intersect an actual wall with the centreline of its connecting passage.
export function wallAtZ(r,x,side){const hits=[];for(let i=0;i<r.polygon.length;i++){const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length];if(a[0]===b[0])continue;const t=(x-a[0])/(b[0]-a[0]);if(t>=0&&t<=1)hits.push(a[1]+t*(b[1]-a[1]));}return side<0?Math.min(...hits):Math.max(...hits);}

export function hallShape(style,index){const families={craft:['chamfer-hall','stepped-bay','cross-junction','radial-core'],natural:['cavern-basin','lobed-cavern','shore-chamber'],hybrid:['terraced-atrium','embedded-station','cavern-basin','chamfer-hall']};const list=families[style]||roomShapes;return list[index%list.length];}
