import {clamp} from './terrain.mjs';
export function canyonSpec(c){
 const stations=[[-8000,23200],[-5500,24700],[-2200,23100],[1800,25200],[4900,23900],[8000,24800]],radius=1400;
 const strips=stations.slice(1).map(([z,x],i)=>{const [az,ax]=stations[i];return [[ax-radius,az],[ax+radius,az],[x+radius,z],[x-radius,z]];});
 return {name:'Great garden canyon',floor:40,rim:Math.min(1300,Math.max(180,c.mountain*.65)),stations,radius,strips,
  polygon:[...stations.map(([z,x])=>[x-radius,z]),...stations.slice().reverse().map(([z,x])=>[x+radius,z])].reverse()};
}
export function canyonHeight(s,x,z,base){
 const limit=8000,blend=clamp((limit+1400-Math.abs(z))/1400,0,1);if(!blend)return base;
 const az=clamp(z,-limit,limit),i=Math.max(0,s.stations.findIndex((p,k)=>k<s.stations.length-1&&az>=p[0]&&az<=s.stations[k+1][0])),a=s.stations[i],b=s.stations[i+1],f=(az-a[0])/(b[0]-a[0]),cx=a[1]+(b[1]-a[1])*f,q=Math.abs(x-cx)/s.radius;
 if(q>=2.2)return base;const shaped=q<1?s.floor+(s.rim-s.floor)*clamp((q-.64)/.36,0,1):s.rim+(base-s.rim)*clamp((q-1)/1.2,0,1);
 return base+(shaped-base)*blend;
}
