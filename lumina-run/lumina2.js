/* LUMINA 2.0 — original futuristic landmarks + native procedural sound design.
   No external textures, models or copyrighted audio are used. */
export const LEVELS=[
 {name:"霓光高架",label:"AURORA CAUSEWAY",sub:"NEON-01",mission:"沿着城市主光轨，完成第一趟黎明运输。",duration:47,goal:8,speed:32,spawnEvery:1.14,hazard:.37,damage:25,bg:0x98c2f1,fog:0x93b0f0,accent:0x7cfef4,secondary:0xc2a5ff,bonus:3000},
 {name:"天轨城区",label:"SKY RAIL DISTRICT",sub:"NEON-02",mission:"高速列车正在交错，找到光带中的安全路线。",duration:55,goal:12,speed:40,spawnEvery:.97,hazard:.51,damage:27,bg:0xb99ade,fog:0x9e8cd8,accent:0xff9ee0,secondary:0x65efff,bonus:4650},
 {name:"核心塔区",label:"NEXUS CORE",sub:"NEON-03",mission:"穿越最后一道能量防线，点亮城市核心。",duration:66,goal:16,speed:45,spawnEvery:.89,hazard:.57,damage:29,bg:0x887fd8,fog:0x6a7ab8,accent:0xffd78b,secondary:0x8cffff,bonus:6250},
];
const DEFAULT_SAVE={unlocked:1,levels:[null,null,null],totalCollected:0,skin:"aqua",endless:false};
export function getProgress(){
 try{const p=JSON.parse(localStorage.getItem("lumina-progress-v2")||"null");if(!p)return structuredClone(DEFAULT_SAVE);return {...structuredClone(DEFAULT_SAVE),...p,levels:Array.isArray(p.levels)?p.levels.slice(0,3):[null,null,null]}}catch{return structuredClone(DEFAULT_SAVE)}
}
export function saveProgress(p){try{localStorage.setItem("lumina-progress-v2",JSON.stringify(p))}catch{}}
export function createDistrict(T,scene,world,level,quality){
 const L=LEVELS[level],g=new T.Group();world.add(g);
 const accents=[L.accent,L.secondary,0xffe4a8];
 const materials=[
  new T.MeshBasicMaterial({color:L.accent,toneMapped:false,side:T.DoubleSide}),
  new T.MeshBasicMaterial({color:L.secondary,toneMapped:false,side:T.DoubleSide}),
  new T.MeshBasicMaterial({color:0xffefbc,toneMapped:false,side:T.DoubleSide}),
  new T.MeshStandardMaterial({color:0x283e80,metalness:.83,roughness:.16,emissive:0x274988,emissiveIntensity:.55}),
  new T.MeshPhysicalMaterial({color:0x648abb,metalness:.75,roughness:.13,clearcoat:.85,clearcoatRoughness:.08,emissive:0x2053a1,emissiveIntensity:.35})
 ];
 const dynamic=[];
 const cube=new T.BoxGeometry(1,1,1);
 function box(w,h,d,x,y,z,m,parent=g){const o=new T.Mesh(cube,m);o.scale.set(w,h,d);o.position.set(x,y,z);parent.add(o);return o}
 function orb(r,x,y,z,m,parent=g){const o=new T.Mesh(new T.IcosahedronGeometry(r,1),m);o.position.set(x,y,z);parent.add(o);return o}
 function halo(r,t,x,y,z,i=0,rx=0,ry=0){const mesh=new T.Mesh(new T.TorusGeometry(r,t,8,76),materials[i]);mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,0);g.add(mesh);return mesh}
 function arc(x,y,z,scale,i=0){
   const r=halo(7.8*scale,.12*scale,x,y,z,i,0,.0);
   const inner=halo(5.4*scale,.08*scale,x,y,z,(i+1)%3,Math.PI/2.5,0);
   dynamic.push({kind:"arc",r,inner,seed:x+z});return r
 }
 function sign(text,x,y,z,w=10,accent=L.accent){
  const cv=document.createElement("canvas");cv.width=768;cv.height=192;
  const c=cv.getContext("2d");
  c.fillStyle="rgba(12,22,65,.83)";c.fillRect(0,0,768,192);
  c.strokeStyle="#b6eafa";c.lineWidth=3;c.strokeRect(6,8,756,176);
  c.strokeStyle="#ffffff";c.lineWidth=2;c.beginPath();c.moveTo(25,30);c.lineTo(90,30);c.moveTo(25,163);c.lineTo(90,163);c.stroke();
  const hex=new T.Color(accent).getStyle();c.shadowColor=hex;c.shadowBlur=23;c.textAlign="center";c.textBaseline="middle";
  c.fillStyle="#fff";c.font="700 76px sans-serif";c.fillText(text,380,94,725);
  c.shadowBlur=0;c.font="600 23px sans-serif";c.fillStyle="#a9dbe7";c.fillText("LUMINA / FUTURE TRANSIT AUTHORITY",380,150);
  const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;
  const panel=new T.Mesh(new T.PlaneGeometry(w,w*.25),new T.MeshBasicMaterial({map,transparent:true,side:T.DoubleSide,depthWrite:false}));
  panel.position.set(x,y,z);g.add(panel);return panel
 }
 function spire(x,y,z,r=4,h=38,accent=0){
  const tower=new T.Mesh(new T.CylinderGeometry(r*.32,r,h,7,1),materials[4]);tower.position.set(x,y+h/2,z);g.add(tower);
  const peak=new T.Mesh(new T.ConeGeometry(r*.7,h*.32,7),materials[3]);peak.position.set(x,y+h*1.12,z);g.add(peak);
  for(let i=0;i<7;i++){
   const a=halo(r*(.8-i*.07),.08,x,y+3+i*h/8,z,(i+accent)%3,Math.PI/2,0);
   a.rotation.y=Math.PI/6
  }
  orb(.55,x,y+h*1.32,z,materials[2])
 }
 // Functional visual centre-line, hazard warning stripes, and horizon markers
 for(const x of [-7.05,7.05]){
  box(.22,.03,430,x,.06,-205,materials[0]);
  box(.33,.05,430,x-.28,.04,-205,materials[1]);
 }
 for(let k=0;k<12;k++){
  const z=-40-k*31;
  box(19,.06,.15,0,.04,z,materials[k%3]);
  const bracket=box(20,.23,.2,0,13,z,materials[3]);
  const crown=box(20,.14,.11,0,13.3,z,materials[k%2]);
  for(const x of [-10,10])box(.25,13,.25,x,6.5,z,materials[3]);
 }
 // Unique architecture per district: background set dressing is detailed and original.
 if(level===0){
  for(const [i,x,z] of [[0,-30,-92],[1,35,-143],[2,-35,-245],[3,30,-338]]){
   spire(x,0,z,4+(i%2),34+i*5,i);
   arc(x,36+i*4,z,1.35,i%3);
  }
  sign("AURORA",0,35,-115,15,L.accent);
  for(let k=0;k<5;k++)arc(0,18,-95-k*72,.75,k%2);
 }else if(level===1){
  // Transit terminal: sky-rail layers, flyovers and an animated maglev.
  for(let k=0;k<4;k++){
   const z=-70-k*89,y=17+(k%2)*5;
   box(82,.75,2.6,0,y,z,materials[3]);
   box(82,.1,.16,0,y+.45,z+1.23,materials[1]);
   for(const x of [-34,0,34])box(.75,y,.75,x,y/2,z,materials[3]);
  }
  for(const [x,z] of [[-26,-107],[31,-198],[-29,-298]])spire(x,0,z,5,53,1);
  const train=new T.Group();g.add(train);
  for(let i=0;i<4;i++){
   box(8,2.2,2.4,7.5+i*8,21,-133,materials[4],train);
   box(7,.13,2.5,7.5+i*8,22.25,-133,materials[1],train);
   box(5.7,.82,.08,7.5+i*8,21.2,-131.74,materials[0],train)
  }
  dynamic.push({kind:"train",train});
  sign("SKY RAIL",1,33,-108,17,L.accent);
 }else{
  // Colossal nucleus structure, nested mechanical rings, sentinels.
  for(let i=0;i<3;i++){
   spire((i-1)*31,0,-145-i*76,7,46+i*13,i);
   for(let j=0;j<4;j++){
    const ring=halo(11-j*1.7,.18,0,23+j*9,-135-i*95,(i+j)%3,Math.PI/2+j*.2,j*.15);
    dynamic.push({kind:"reactor",ring,seed:i+j})
   }
  }
  const core=new T.Group();core.position.set(0,28,-260);g.add(core);
  orb(8,0,0,0,materials[2],core);
  for(let i=0;i<3;i++){
   const ring=new T.Mesh(new T.TorusGeometry(13+i*4,.3,9,80),materials[i]);ring.rotation.set(i*.5,i*.75,0);core.add(ring)
  }
  dynamic.push({kind:"core",core});
  sign("NEXUS CORE",0,48,-109,19,L.accent)
 }
 // Framed giant hologram panels and elevated traffic lanes.
 for(let i=0;i<(quality<1?4:7);i++){
  let z=-40-i*52,side=i%2?1:-1,x=side*16;
  const plate=box(.12,10,5,x,16,z,materials[i%2]);
  const glow=box(.08,7,2.9,x-side*.1,16,z,materials[4]);
  const icon=orb(1.6,x-side*.24,16,z,materials[(i+1)%3]);icon.scale.set(.3,1,1);
  dynamic.push({kind:"holo",icon,seed:i})
 }
 scene.background.setHex(L.bg);scene.fog.color.setHex(L.fog);
 return {group:g,update(dt,t){
   for(const d of dynamic){
    if(d.kind==="arc"){d.r.rotation.y+=dt*.11;d.inner.rotation.x+=dt*.23}
    if(d.kind==="train")d.train.position.x=Math.sin(t*.22)*19;
    if(d.kind==="core")d.core.rotation.y+=dt*.17;
    if(d.kind==="reactor")d.ring.rotation.z+=dt*(.2+d.seed*.03);
    if(d.kind==="holo")d.icon.rotation.x=Math.sin(t*.8+d.seed)*.15
   }
 },dispose(){
   world.remove(g);
   // Shared cube and some shared materials are local to this district.
   g.traverse(o=>{if(o.isMesh){if(o.geometry!==cube)o.geometry.dispose();
     if(o.material&&!materials.includes(o.material)){if(o.material.map)o.material.map.dispose();o.material.dispose()}
   }});
   cube.dispose();materials.forEach(m=>m.dispose())
 }};
}
export class AudioDirector{
 constructor(){this.ctx=null;this.master=null;this.pad=null;this.engineGain=null;this.oscs=[];this.timer=0;this.enabled=true;this.active=false;this.level=0}
 ensure(){
  if(this.ctx)return true;
  try{
   const A=window.AudioContext||window.webkitAudioContext;
   if(!A)return false;
   this.ctx=new A();
   this.master=this.ctx.createGain();this.master.gain.value=.48;
   this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-17;this.compressor.ratio.value=3;
   this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);
   this.pad=this.ctx.createGain();this.pad.gain.value=0;this.pad.connect(this.master);
   this.engineGain=this.ctx.createGain();this.engineGain.gain.value=0;this.engineGain.connect(this.master);
   const padNotes=[82.41,123.47,164.81,246.94];
   padNotes.forEach((frequency,i)=>{
     const o=this.ctx.createOscillator(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();
     o.type=i%2?"sawtooth":"sine";o.frequency.value=frequency;
     f.type="lowpass";f.frequency.value=i%2?300:490;
     g.gain.value=i%2?.055:.06;
     o.connect(f);f.connect(g);g.connect(this.pad);o.start();this.oscs.push(o)
   });
   const engine=this.ctx.createOscillator(),low=this.ctx.createBiquadFilter();
   engine.type="sawtooth";engine.frequency.value=62;low.type="lowpass";low.frequency.value=240;
   engine.connect(low);low.connect(this.engineGain);engine.start();this.oscs.push(engine);
   return true
  }catch(e){console.warn("Audio unavailable",e);return false}
 }
 start(level=0){
  this.level=level;this.active=true;if(!this.ensure())return;
  this.ctx.resume().catch(()=>{});
  let t=this.ctx.currentTime;
  this.pad.gain.cancelScheduledValues(t);this.pad.gain.setTargetAtTime(this.enabled?.65:0,t,.65);
  this.engineGain.gain.setTargetAtTime(this.enabled?.1:0,t,.4);
  this.timer=0;this.beat=0
 }
 stop(){
  this.active=false;if(!this.ctx)return;const t=this.ctx.currentTime;
  this.pad.gain.setTargetAtTime(0,t,.22);this.engineGain.gain.setTargetAtTime(0,t,.15)
 }
 toggle(on){this.enabled=on;if(!this.ctx)return;this.master.gain.setTargetAtTime(on?.48:0,this.ctx.currentTime,.06)}
 tick(dt,thrust=0){
  if(!this.active||!this.enabled||!this.ctx)return;
  this.timer-=dt;
  if(this.timer<=0){
    const interval=[.51,.44,.38][this.level],n=this.beat++;
    this.timer+=interval;
    this.tone(n%4===0?118:82,.095,"triangle",n%4===0?.075:.029);
    if(n%2===1)this.noise(.055,.06,800)
  }
  if(this.engineGain)this.engineGain.gain.setTargetAtTime(.06+Math.abs(thrust)*.05,this.ctx.currentTime,.1)
 }
 tone(freq=420,seconds=.16,type="sine",vol=.09){
  if(!this.enabled||!this.ensure())return;
  const t=this.ctx.currentTime,o=this.ctx.createOscillator(),v=this.ctx.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(freq,20),t);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.64),t+seconds);
  v.gain.setValueAtTime(Math.max(.001,vol),t);v.gain.exponentialRampToValueAtTime(.0001,t+seconds);
  o.connect(v);v.connect(this.master);o.start(t);o.stop(t+seconds+.04)
 }
 noise(seconds=.18,vol=.08,cut=1300){
  if(!this.enabled||!this.ensure())return;
  const rate=this.ctx.sampleRate,len=Math.round(seconds*rate),buf=this.ctx.createBuffer(1,len,rate),p=buf.getChannelData(0);
  for(let i=0;i<len;i++)p[i]=(Math.random()*2-1)*Math.pow(1-i/len,.75);
  const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
  src.buffer=buf;filter.type="bandpass";filter.frequency.value=cut;filter.Q.value=.7;gain.gain.value=vol;
  src.connect(filter);filter.connect(gain);gain.connect(this.master);src.start()
 }
 collect(combo=0){this.tone(650+Math.min(combo,8)*53,.22,"sine",.09);setTimeout(()=>this.tone(970+Math.min(combo,8)*37,.15,"triangle",.05),65)}
 collision(){this.noise(.34,.17,430);this.tone(150,.38,"sawtooth",.14)}
 pulse(){this.noise(.42,.15,1580);this.tone(190,.55,"sawtooth",.1);this.tone(940,.3,"sine",.08)}
 milestone(){this.tone(660,.25,"sine",.1);setTimeout(()=>this.tone(880,.3,"sine",.09),110);setTimeout(()=>this.tone(1320,.45,"triangle",.08),220)}
}
