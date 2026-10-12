import {gsvPoints} from './gsv-geometry.mjs';
export const PLAYER_HEIGHT=1.95;
// Normalize the imported hull to the selected physical length in metres.
// Preserve hull proportions; rooms and the 1.95 m player keep their metric scale.
const meshX=Array.from(gsvPoints).filter((_,i)=>i%3===0);
const meshLength=Math.max(...meshX)-Math.min(...meshX);
export const normalizeShipLength=value=>Math.max(64,Math.min(200,Number.isFinite(+value)?+value:128));
export let SHIP_SCALE=128000/meshLength;
export const source={site:'Rasd Fastwalker League',commit:'d9b0884a5d6539b05504b0a79378b6f3610e746e',mesh:'dist/gsv-geometry.js',avatar:'dist/assets/characters/faceted.bin',github:'KO0I/rasd-fastwalker-league-js',githubAssetAvailable:false};
export const triangles=[];
for(let i=0;i<gsvPoints.length;i+=9){const v=[0,3,6].map(k=>Array.from(gsvPoints.slice(i+k,i+k+3),x=>x*SHIP_SCALE)),a=v[1].map((x,k)=>x-v[0][k]),b=v[2].map((x,k)=>x-v[0][k]),n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],area=Math.hypot(...n);if(area>1e-6)triangles.push({v,n:n.map(x=>x/area),area});}
export function heightAt(t,x,z){const [a,b,c]=t.v,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-9)return null;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;return Math.min(u,v,1-u-v)>=-1e-7?u*a[1]+v*b[1]+(1-u-v)*c[1]:null;}
let tops=triangles.filter(t=>t.n[1]>.99&&t.v[0][1]<SHIP_SCALE*.15);
export let gardens=[...new Set(tops.map(t=>t.v[0][1].toFixed(2)))].map(Number).sort((a,b)=>b-a).map((height,index)=>{const t=tops.filter(t=>Math.abs(t.v[0][1]-height)<.02).sort((a,b)=>b.area-a.area)[0];return {index,height,center:[0,1,2].map(k=>t.v.reduce((s,p)=>s+p[k],0)/3)};});
export function setShipLength(value){
 const length=normalizeShipLength(value),next=length*1000/meshLength,factor=next/SHIP_SCALE;
 if(Math.abs(factor-1)<1e-12)return length;
 for(const t of triangles){t.v=t.v.map(p=>p.map(v=>v*factor));t.area*=factor*factor;}
 gardens=gardens.map(g=>({...g,height:g.height*factor,center:g.center.map(v=>v*factor)}));
 SHIP_SCALE=next;
 return length;
}
export function placement(config){const g=gardens[config.garden??0]||gardens[0];return {origin:[g.center[0],g.height-config.height,g.center[2]],garden:g.index,scale:SHIP_SCALE,playerHeight:PLAYER_HEIGHT,source};}
export function sectionFits(c){const p=placement(c),top=p.origin[1]+c.height,bottom=p.origin[1]-(c.decks-1)*c.height;for(let ix=0;ix<=4;ix++)for(let iz=0;iz<=4;iz++){const x=p.origin[0]+c.length*(ix/4-.5),z=p.origin[2]+c.width*(iz/4-.5);const roof=tops.some(t=>{const h=heightAt(t,x,z);return h!==null&&Math.abs(h-top)<.03;});const floor=triangles.some(t=>{const h=heightAt(t,x,z);return t.n[1]<-.9&&h!==null&&h<top-.1&&h<=bottom;});if(!roof||!floor)return false;}return true;}
