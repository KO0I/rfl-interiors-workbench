import {terrainAt} from './terrain.mjs';
export function embedStructures(layout){for(const b of [...layout.terminals,...layout.skylights,...layout.lightWells]){const ground=b.y??b.ground,h=b.height??b.buildingHeight;b.architecture={style:'embedded-angular-stone',buriedDepth:Math.max(3,h*.8),baseY:ground-Math.max(3,h*.8),roofHeight:Math.min(h,b.station?5.5:3.2),shoulderWidth:b.width*.6,exteriorGlazing:!b.station};b.top=ground+b.architecture.roofHeight;}}
export function structureFaces(b,terrain){const arch=b.architecture,y=b.y??b.ground,h=arch?.roofHeight??b.buildingHeight??b.height,w=b.width/2,d=b.depth/2,point=(x,dy,z)=>[b.x+x,y+dy,b.z+z],ground=(x,z)=>[b.x+x,terrainAt(terrain,b.x+x,b.z+z)+.05,b.z+z],faces=[];
 const add=(v,color,kind='stone')=>faces.push({v,color,kind});
 // A narrow upper ridge grows from sloped stone shoulders buried in the terrain.
 const base=[ground(-w,-d),ground(w,-d),ground(w,d),ground(-w,d)],roof=[point(-w*.6,h,-d*.8),point(w*.6,h,-d*.8),point(w*.6,h,d*.8),point(-w*.6,h,d*.8)];
 for(let i=0;i<4;i++)add([base[i],base[(i+1)%4],roof[(i+1)%4],roof[i]],['#adb9aa','#d7d6bc','#e5dfc5','#9aaa9c'][i]);add(roof,'#e5e4cc');
 for(const sign of [-1,1]){const ridge=[point(sign*w*.55,h*.8,-d*.6),point(sign*w*.55,h*.8,d*.6)],outer=[ground(sign*w*2.0,-d*1.8),ground(sign*w*2.0,d*1.8)];add([ridge[0],ridge[1],outer[1],outer[0]],sign<0?'#a9b7a1':'#c8d2b6');add([base[sign<0?0:1],ridge[0],outer[0]],'#9fad9b');add([base[sign<0?3:2],outer[1],ridge[1]],'#b9c4a9');}
 if(b.station){const z=d+.07,zTop=d*.8+.08;add([point(-1.4,.05,z),point(1.4,.05,z),point(1.4,Math.min(3.3,h*.9),zTop),point(-1.4,Math.min(3.3,h*.9),zTop)],'#15292b','entrance');
 // A short terrain-following approach is an access terrace, not an extra building.
 const a=ground(-2.8,d),bb=ground(2.8,d),cc=ground(4.2,d+10),dd=ground(-4.2,d+10);add([a,bb,cc,dd],'#b4bba5','terrace');
 }else{const sw=w*.44,sd=d*.48,v=[point(-sw,h+.04,-sd),point(sw,h+.04,-sd),point(sw,h+.04,sd),point(-sw,h+.04,sd)];if(v.every(p=>p[1]>terrainAt(terrain,p[0],p[2])))add(v,'#b3d9d1','exterior-skylight');}
 return faces;}
