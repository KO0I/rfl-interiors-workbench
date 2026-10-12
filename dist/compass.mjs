// Directions lie in the structural XZ plane, not the screen or terrain slope.
export function compassAxes(config){const bow=config.bow===-1?-1:1;
 return ['plate','gsv'].includes(config.preset)?[
  {label:'B',name:'Bow',v:[bow,0,0]}, {label:'A',name:'Aft',v:[-bow,0,0]},
  {label:'P',name:'Port',v:[0,0,-bow]}, {label:'S',name:'Starboard',v:[0,0,bow]},
 ]:[{label:'N',name:'North',v:[0,0,-1]},{label:'S',name:'South',v:[0,0,1]},{label:'W',name:'West',v:[-1,0,0]},{label:'E',name:'East',v:[1,0,0]}];
}
export function projectDirection([x,y,z],yaw,pitch,plan=false){if(plan)return {x,y:z,depth:0};const b=x*Math.sin(yaw)+z*Math.cos(yaw);return {x:x*Math.cos(yaw)-z*Math.sin(yaw),y:b*Math.sin(pitch)-y*Math.cos(pitch),depth:b*Math.cos(pitch)+y*Math.sin(pitch)};}
export function drawCompass(ctx,w,h,config,{yaw,pitch,mode}){
 const cx=w-74,cy=80,project=v=>projectDirection(v,yaw,pitch,mode==='plan');ctx.save();ctx.fillStyle='#09080fdc';ctx.fillRect(cx-67,cy-65,134,132);
 const p=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1]].map(v=>project(v.map(n=>n*.65)));ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(cx+v.x*34,cy+v.y*34):ctx.moveTo(cx+v.x*34,cy+v.y*34));ctx.closePath();ctx.fillStyle='#a67ca81a';ctx.fill();ctx.strokeStyle='#a67ca84d';ctx.lineWidth=1;ctx.stroke();
 for(const axis of compassAxes(config).map(a=>({...a,p:project(a.v)})).sort((a,b)=>a.p.depth-b.p.depth)){
  const {x,y}=axis.p,len=Math.hypot(x,y)||1,px=cx+x*35,py=cy+y*35;ctx.strokeStyle=axis.label==='B'?'#ffe5a6':'#b7a4c6';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=axis.label==='B'?2:1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);ctx.stroke();
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-x/len*7-y/len*3,py-y/len*7+x/len*3);ctx.lineTo(px-x/len*7+y/len*3,py-y/len*7-x/len*3);ctx.closePath();ctx.fill();ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(axis.label,cx+x*51,cy+y*51);
 }
 ctx.fillStyle='#b7a4c6';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('DECK PLANE',cx,cy+59);ctx.restore();
}
