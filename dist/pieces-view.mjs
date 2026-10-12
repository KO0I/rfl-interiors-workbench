import {pieces,pieceById,familyRules,referenceNotes,instantiatePiece,generatePieceLayout} from './map-pieces.mjs';
export function createPiecesStudy($,redraw){
 let sample=generatePieceLayout(),selected='cavern-basin',view='piece';
 const update=()=>{const p=pieceById[selected];$('pieceName').textContent=p.name;$('pieceInfo').textContent=`${p.family} · ${p.role} · ${p.ports} suggested entrances. ${p.rule}`;$('pieceSource').textContent=p.source;$('pieceRules').textContent=familyRules[$('pieceFamily').value];redraw();};
 $('pieceSelect').replaceChildren(...pieces.map(p=>new Option(p.name+' · '+p.family,p.id)));$('pieceSelect').value=selected;
 $('pieceFamily').value='craft';$('pieceSeed').value='PRIME-01';$('pieceScale').value='1';$('pieceDeck').value='0';$('pieceProjection').value='plan';
 $('pieceSelect').onchange=()=>{selected=$('pieceSelect').value;view='piece';update();};
 $('pieceCatalogue').addEventListener('click',e=>{const id=e.target.closest('[data-piece]')?.dataset.piece;if(!pieceById[id])return;selected=id;$('pieceSelect').value=id;view='piece';update();});
 $('pieceGenerate').onclick=()=>{if(!$('pieceSeed').value.trim())$('pieceSeed').value='PRIME-01';sample=generatePieceLayout({family:$('pieceFamily').value,seed:$('pieceSeed').value,scale:$('pieceScale').value});view='assembly';$('pieceName').textContent='Connected '+$('pieceFamily').value+' study';$('pieceInfo').textContent='16 chambers on two levels; a return loop, a side branch and a shared elevator. Entrances meet the room boundary. Heights and footprints export in metres.';$('pieceSource').textContent='Original generated composition';$('pieceRules').textContent=familyRules[$('pieceFamily').value];redraw();};
 $('pieceFamily').onchange=()=>$('pieceGenerate').onclick();for(const k of ['pieceDeck','pieceProjection'])$(k).onchange=redraw;update();
 function render(ctx,w,h,zoom){
  const plan=$('pieceProjection').value==='plan',deck=Number($('pieceDeck').value)||0,p=pieceById[selected],rooms=view==='piece'?[instantiatePiece(selected,{w:90,d:75,h:24})]:sample.rooms.filter(r=>r.deck===deck);
  const pts=rooms.flatMap(r=>r.polygon),minX=Math.min(...pts.map(p=>p[0])),maxX=Math.max(...pts.map(p=>p[0])),minZ=Math.min(...pts.map(p=>p[1])),maxZ=Math.max(...pts.map(p=>p[1])),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,spanX=maxX-minX,spanZ=maxZ-minZ;
  const scale=Math.max(.01,Math.min((w-80)/(plan?spanX:(spanX+spanZ)*.78),(h-130)/(plan?spanZ:(spanX+spanZ)*.4+rooms[0].h)))*zoom,floor=rooms[0].y;
  const project=(x,y,z)=>{x-=cx;z-=cz;return [w/2+(plan?x:(x-z)*.75)*scale,h/2+(plan?z:(x+z)*.36-(y-floor)*.9)*scale];};
  const trace=pts=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();};
  for(const r of [...rooms].sort((a,b)=>(a.x+a.z)-(b.x+b.z))){const color=r.family==='natural'?'#bc806b':r.family==='hybrid'?'#bfa368':'#71c8d2';if(!plan){for(let i=0;i<r.polygon.length;i++){const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length];trace([project(a[0],r.y,a[1]),project(b[0],r.y,b[1]),project(b[0],r.y+r.h,b[1]),project(a[0],r.y+r.h,a[1])]);ctx.fillStyle=color+'55';ctx.fill();ctx.strokeStyle=color+'99';ctx.stroke();}}
   trace(r.polygon.map(([x,z])=>project(x,plan?r.y:r.y+r.h,z)));ctx.fillStyle=color+(r.type==='transit'?'66':'a0');ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=color;ctx.stroke();
   if(view==='assembly'&&r.role==='vertical'){const q=project(r.center[0],r.y+r.h+2,r.center[2]);ctx.fillStyle='#fff2be';ctx.font='bold 14px monospace';ctx.fillText('[E]',q[0]-12,q[1]);}
  }
  if(view==='assembly')for(const d of sample.doors.filter(d=>d.deck===deck)){const q=project(d.x,d.y+6,d.z);ctx.fillStyle='#e7faff';ctx.fillRect(q[0]-3,q[1]-3,6,6);}
  if(view==='piece'){for(const socket of rooms[0].sockets){const a=project(...socket.position),b=project(socket.position[0]+socket.normal[0]*8,socket.position[1],socket.position[2]+socket.normal[2]*8);ctx.fillStyle='#e7faff';ctx.fillRect(a[0]-4,a[1]-4,8,8);ctx.strokeStyle='#e7faff';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}ctx.fillStyle='#dbe7eb';ctx.font='14px monospace';ctx.fillText('90 × 75 m · footprint frame',24,32);ctx.fillText('Squares: entrance sockets',24,h-25);}
  $('scale').textContent=(40/scale).toFixed(1)+' m';return {polys:[]};
 }
 return {render,open:()=>{if(view==='piece')update();else redraw();},export:()=>view==='assembly'?sample:{schema:'rfl.interiors.piece-library.v1',units:'normalized footprints; instances in metres',pieces,referenceNotes,familyRules,selectedPiece:instantiatePiece(selected,{w:90,d:75,h:24})}};
}
