import './climate-terrain.js';
import {random,clamp} from './terrain.mjs';
import {canyonSpec,canyonHeight} from './canyon.mjs';

const smooth=(a,b,x)=>{const q=clamp((x-a)/(b-a),0,1);return q*q*(3-2*q);};

// Seeded mountain belts, domain-warped ridges and finite-grid erosion.
// Heights are metres; there is no exaggeration in the rendered surface.
export function landscape(c){
 const rng=random(c.seed+':landscape'),offset=[rng()*70,rng()*70,rng()*70];
 const nx=180,nz=120,dx=90000/nx,dz=60000/nz,stride=nx+1;
 const heights=[],valid=[],edgeMask=[],canyon=canyonSpec(c);
 const seed=Math.floor(rng()*4294967295);
 const hash=(x,z)=>{let n=Math.imul(x,374761393)^Math.imul(z,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
 const value=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),a=x-i,b=z-j,fade=t=>t*t*t*(t*(t*6-15)+10),u=fade(a),v=fade(b),mix=(a,b,t)=>a+(b-a)*t;return mix(mix(hash(i,j),hash(i+1,j),u),mix(hash(i,j+1),hash(i+1,j+1),u),v);};
 const noise=(x,z,f=1)=>{let n=0,a=.5;for(let k=0;k<4;k++){n+=a*value(x*f+offset[0],z*f+offset[2]);f*=2.03;a*=.5;}return n;};
 const phase=rng()*Math.PI*2,lake={x:-9000,z:2000,rx:7000+c.lakeShare*110,rz:4500+c.lakeShare*55};
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=-45000+i*dx,z=-30000+j*dz;
  const edge=smooth(0,3200,Math.min(40500-Math.abs(x),27000-Math.abs(z),(62100-Math.abs(x)-Math.abs(z))/Math.SQRT2));
  const u=x/13000,v=z/13000,wx=u+1.6*(noise(u,v,.7)-.47),wz=v+1.3*(noise(u+9,v-5,.7)-.47);
  const beltA=Math.exp(-(((wx+1.9+.45*Math.sin(wz*1.8+phase))/.67)**2));
  const beltB=.8*Math.exp(-(((wx-1.65+.36*Math.sin(wz*2-phase))/.62)**2));
  let ridges=0,amplitude=.58,frequency=1.2,weight=1;
  for(let k=0;k<5;k++){
   const ridge=(1-Math.abs(noise(wx*1.25,wz*.62,frequency)/.9375*2-1))**3;
   ridges+=amplitude*ridge*weight;weight=.35+.65*ridge;amplitude*=.52;frequency*=2.05;
  }
  const hills=.8*noise(u,v,1.7)+.2*globalThis.ExoTerrain.fbm(u+offset[0],offset[1],v+offset[2]),belt=Math.max(beltA,beltB);
  heights.push(edge*(30+c.mountain*clamp(.10*hills+belt*(.18+.69*ridges),0,.97)));
  edgeMask.push(edge);valid.push(true);
 }
 // Mass-conserving thermal relaxation removes isolated spikes and forms scree.
 const delta=new Float64Array(heights.length),talus=dx*.28;
 for(let pass=0;pass<12;pass++){
  delta.fill(0);
  for(let j=1;j<nz;j++)for(let i=1;i<nx;i++){
   const k=j*stride+i;let dest=k,drop=talus;
   for(const n of [k-1,k+1,k-stride,k+stride])if(heights[k]-heights[n]>drop){drop=heights[k]-heights[n];dest=n;}
   if(dest!==k){const amount=(drop-talus)*.22;delta[k]-=amount;delta[dest]+=amount;}
  }
  for(let k=0;k<heights.length;k++)heights[k]+=delta[k];
 }
 // D8 catchments: incision follows actual downhill accumulation, not stripes.
 const accumulation=new Float64Array(heights.length).fill(1),downhill=new Int32Array(heights.length).fill(-1);
 const order=Array.from({length:heights.length},(_,i)=>i).sort((a,b)=>heights[b]-heights[a]);
 for(const k of order){
  const i=k%stride,j=Math.floor(k/stride);let steepest=0;
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
   if(!a&&!b||i+a<0||i+a>nx||j+b<0||j+b>nz)continue;
   const n=k+b*stride+a,slope=(heights[k]-heights[n])/Math.hypot(a*dx,b*dz);
   if(slope>steepest){steepest=slope;downhill[k]=n;}
  }
  if(downhill[k]>=0)accumulation[downhill[k]]+=accumulation[k];
 }
 const river=z=>lake.x+6500*Math.sin((z-lake.z)/15500)+1600*Math.sin((z-lake.z)/4100);
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const k=j*stride+i,x=-45000+i*dx,z=-30000+j*dz,edge=edgeMask[k];
  let y=Math.max(12*edge,heights[k]-Math.min(heights[k]*.27,Math.log2(accumulation[k])*c.mountain*.007)*edge);
  if(c.stage!=='terrain'&&c.lakeShare>0){
   const angle=Math.atan2((z-lake.z)/lake.rz,(x-lake.x)/lake.rx);
   const shore=1+.10*Math.sin(3*angle+phase)+.06*Math.sin(7*angle-phase)+.025*Math.sin(13*angle);
   const lakeQ=Math.hypot((x-lake.x)/lake.rx,(z-lake.z)/lake.rz)/shore;
   const rw=420+c.lakeShare*8,riverQ=Math.abs(x-river(z))/rw;
   const tz=z<0?-12000:15000,tx=river(tz),f=clamp(Math.abs(x-tx)/11000,0,1);
   const branchQ=Math.abs(z-(tz+(z<0?-1:1)*f*5000+600*Math.sin(f*5)))/(rw*.65);
   const branchOn=(z<0?x<tx:x>tx)&&Math.abs(x-tx)<11000;
   const channel=Math.abs(z)<24600?Math.min(riverQ,branchOn?branchQ:Infinity):Infinity;
   if(lakeQ<1.22){const bed=-c.lakeDepth*Math.max(0,1-lakeQ*lakeQ)**1.25;const bank=smooth(.88,1.22,lakeQ);y=y*bank+bed*(1-bank);}
   if(channel<3){const blend=smooth(.8,3,channel),bed=-Math.min(c.lakeDepth*.22,140)*Math.max(0,1-channel*channel);y=Math.min(y,y*blend+bed*(1-blend));}
  }
  heights[k]=canyonHeight(canyon,x,z,y*edge);
 }
 const sx=50000/90000,sz=22000/60000;
 canyon.polygon=canyon.polygon.map(([x,z])=>[x*sx,z*sz]);canyon.strips=canyon.strips.map(p=>p.map(([x,z])=>[x*sx,z*sz]));canyon.stations=canyon.stations.map(([z,x])=>[z*sz,x*sx]);canyon.radius*=sx;lake.x*=sx;lake.z*=sz;lake.rx*=sx;lake.rz*=sz;
 return {schema:'rfl.plate-terrain.v2',seed:c.seed,origin:[0,0,0],nx,nz,dx:dx*sx,dz:dz*sz,length:50000,width:22000,heights,valid,waterLevel:0,
  spec:{canyon,lake,river:{kind:'meandering engineered catchment',level:0,width:2*(420+c.lakeShare*8)},source:{repository:'KO0I/rfl-climate-workbench',file:'dist/terrain.js',blob:'5b40d12d06995e3b7f62ff7f455167e7a6ce2cd0',procedure:'Seeded quintic fBm with ExoTerrain foothill noise; domain-warped ridged mountain belts, 12 thermal erosion passes, D8 flow accumulation and channel incision'},erosion:{thermalPasses:12,drainage:'D8',cellMetres:dx*sx},hydrology:'Sculpted level lake and meandering channels; drainage incision is approximate, not a fluid simulation'}};
}

export function landscapeColor(v,mountain=1500){
 const h=v.reduce((s,p)=>s+p[1],0)/v.length;
 if(h<0)return '#204a56';
 const a=v[1].map((n,k)=>n-v[0][k]),b=v[2].map((n,k)=>n-v[0][k]);
 let nx=a[1]*b[2]-a[2]*b[1],ny=a[2]*b[0]-a[0]*b[2],nz=a[0]*b[1]-a[1]*b[0];
 if(ny<0){nx=-nx;ny=-ny;nz=-nz;}const length=Math.hypot(nx,ny,nz)||1,slope=Math.hypot(nx,nz)/Math.max(1,ny);
 const rock=smooth(.15,.48,slope)*.65+smooth(mountain*.4,mountain*.83,h)*.7;
 const green=h<18?[119,137,92]:h<mountain*.25?[62,110,64]:[82,119,68];
 const stone=[151,151,140],mix=clamp(rock,0,1),light=.62+.38*Math.max(0,(nx*-.42+ny*.83+nz*.35)/length);
 return `rgb(${green.map((n,k)=>Math.round((n*(1-mix)+stone[k]*mix)*light)).join(',')})`;
}
