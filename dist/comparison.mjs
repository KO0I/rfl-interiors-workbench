import {outline} from './plate.mjs';

export const ringArea=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
export const footprintArea=polygons=>polygons.reduce((s,p)=>s+ringArea(p[0])-p.slice(1).reduce((a,r)=>a+ringArea(r),0),0);
export function plateSilhouette(bow=1){
 const rim=outline.flatMap((p,i)=>i===3?[p,[25000,-1943.333],[25500,-1943.333],[28000,-1283.333],[28000,1283.333],[25500,1943.333],[25000,1943.333]]:[p]);
 return [[rim.map(([x,z])=>[x*bow/1000,z*bow/1000])]];
}
export function bounds(polygons){
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const p of polygons)for(const ring of p)for(const [x,y] of ring){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 return {x0,y0,x1,y1,w:x1-x0,h:y1-y0,cx:(x0+x1)/2,cy:(y0+y1)/2};
}
const number=(n,max=1)=>n.toLocaleString(undefined,{maximumFractionDigits:max});

export function createComparison($,draw){
 let data=null,loading=false,error='',offset=[0,0],lastScale=1;
 const shipSelect=$('compareShip'),kind=$('compareKind'),place=$('comparePlace'),rotation=$('compareRotation'),style=$('compareStyle'),extent=$('compareExtent');
 function populate(){
  if(!data)return;
  const options=data.places.filter(p=>p.kind===kind.value);
  place.replaceChildren(...options.map(p=>new Option(p.name,p.id)));
  place.value=kind.value==='state'?'state:US-CO':'country:NLD';reset();
 }
 function reset(){offset=[0,0];rotation.value=0;$('compareRotationOut').textContent='0°';draw();}
 for(const el of [shipSelect,place,style,extent])el.onchange=reset;
 kind.onchange=populate;
 rotation.oninput=()=>{$('compareRotationOut').textContent=rotation.value+'°';draw();};
 async function load(){
  if(data||loading)return;
  loading=true;error='';$('comparisonStatus').textContent='Loading geographic outlines…';
  try{const r=await fetch('./assets/comparison.json');if(!r.ok)throw Error('Geography unavailable');data=await r.json();populate();}
  catch{error='Could not load the geographic outlines. Retry below.';}
  finally{loading=false;$('compareRetry').hidden=!error;draw();}
 }
 $('compareRetry').onclick=load;
 function render(ctx,w,h,layout,zoom){
  if(!data){$('comparisonStatus').textContent=error||'Loading geographic outlines…';return {scale:1};}
  const entry=data.places.find(p=>p.id===place.value)||data.places[0],main=extent.value!=='all'&&entry.mainPolygons;
  const region=main?{...entry,polygons:entry.mainPolygons,area:entry.mainArea,name:entry.name+' · main region'}:entry;
  const shipFactor=(layout.config.shipLength||128)/bounds(data.gsv.polygons).w;
  const isPlate=shipSelect.value==='plate',raw=isPlate?plateSilhouette(layout.config.bow):data.gsv.polygons.map(p=>p.map(r=>r.map(([x,y])=>[x*shipFactor,y*shipFactor])));
  const box=bounds(raw),angle=Number(rotation.value)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  const ship=raw.map(p=>p.map(r=>r.map(([x,y])=>{x-=box.cx;y-=box.cy;return [x*cos-y*sin,x*sin+y*cos];})));
  const sb=bounds(ship),rb=bounds(region.polygons),side=style.value==='side';
  const gap=Math.max(sb.w,rb.w)*.10,worldW=side?sb.w+rb.w+gap:Math.max(sb.w,rb.w),worldH=Math.max(sb.h,rb.h);
  const scale=Math.min((w-70)/worldW,(h-170)/worldH)*zoom;lastScale=scale;
  const shipX=side?-(rb.w+gap)/2:offset[0],regionX=side?(sb.w+gap)/2:0;
  const origin=[w/2,h/2+6];
  // One affine scale is shared by the country and ship, in kilometres.
  const drawShape=(polygons,cx,cy,dx,dy,fill,stroke)=>{
   ctx.beginPath();
   for(const poly of polygons)for(const ring of poly){ring.forEach(([x,y],i)=>{const px=origin[0]+(x-cx+dx)*scale,py=origin[1]+(y-cy+dy)*scale;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.closePath();}
   ctx.fillStyle=fill;ctx.fill('evenodd');ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();
  };
  drawShape(region.polygons,rb.cx,rb.cy,regionX,0,'#a67ca833','#c49bce');
  drawShape(ship,0,0,shipX,side?0:offset[1],'#f2cf8977','#ffe6a4');
  const area=footprintArea(raw),share=area/region.area,shipName=isPlate?'Plate-class + bridge':'Systems-class';
  $('comparisonStatus').textContent=`${shipName} has ${number(share*100,share<.001?4:2)}% of ${region.name}’s mapped area.`;
  $('compareShipArea').textContent=number(area)+' km²';$('compareRegionArea').textContent=number(region.area)+' km²';
  $('compareRatio').textContent=share<=1?number(1/share,2)+' : 1': '1 : '+number(share,2);
  $('compareShipName').textContent=shipName;$('compareRegionName').textContent=region.name;
  $('compareDimensions').textContent=isPlate?'53 × 22 km overall · includes bow bridge':`${number(box.w,2)} × ${number(box.h,2)} km · Systems-class · adjustable 64–200 km`;
  ctx.font='14px sans-serif';ctx.textAlign='left';
  ctx.fillStyle='#d3b6db';ctx.fillText(region.name,18,h-72,w-36);
  ctx.fillStyle='#ffe6a4';ctx.fillText(shipName+' · same scale',18,h-49,w-36);
  ctx.textAlign='right';ctx.fillStyle='#d3b6db';ctx.fillText('N ↑',w-22,86);
  return {scale};
 }
 return {load,render,reset,pan(dx,dy){if(style.value==='overlay'){offset[0]+=dx/lastScale;offset[1]+=dy/lastScale;}draw();},rotate(degrees){rotation.value=(+rotation.value+degrees+360)%360;rotation.oninput();}};
}
