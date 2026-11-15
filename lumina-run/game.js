import * as THREE from "https://esm.sh/three@0.160.1";
import {LEVELS,getProgress,saveProgress,createDistrict,AudioDirector} from "./lumina2.js";
import {TRACKS,makeBeatmap,judgeDelta,BeatshiftAudio} from "./beatshift.js";
const $=id=>document.getElementById(id);
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const ui={intro:$("intro"),result:$("result"),pause:$("pause-screen"),fatal:$("fatal"),hud:$("hud"),touch:$("touch"),timer:$("timer"),dist:$("distance"),lumens:$("lumens"),shield:$("shield-fill"),shieldText:$("shield-num"),combo:$("combo"),progress:$("progress-fill"),message:$("notification"),hint:$("hint")};
const CONFIG={duration:75,lanes:[-4,0,4],speed:34,spawnEvery:.89,goal:12,pulseCooldown:7};
let renderer,scene,camera,root,player,craft,craftGlow,trail=[],city=[],roadTiles=[],objects=[],particles=[],beams=[],clock=new THREE.Clock(),vignettePulse=0;
let elapsed=0,score=0,lumens=0,shield=100,combo=0,best=0,mode="menu",targetLane=1,currentX=0,spawnIn=.4,invuln=0,pulseIn=0,shake=0,lastHUD=0,noticeTimeout=0,soundOn=true,audio=null,lastSwipe=null,quality=window.innerWidth<720?.7:1;
const materials={};
let stageIndex=0,selectedStage=0,stageArt=null,progress=getProgress(),soundDirector=new AudioDirector(),nearMisses=0;
let activeTrail=progress.skin||"aqua",bossSpawned=false,flashUntil=0;
const beatAudio=new BeatshiftAudio();
let chartNotes=[],beatSpawnIndex=0,beatVisuals=new Map(),heldNote=null,notesPressed=false;
let perfect=0,great=0,good=0,misses=0,feverEnergy=0,feverEnds=0,judgementTimeout=0;
let beatSkyLight=null,beatKeyLight=null,hitLine3D=null,lastBeat=-1;
let lastCoachUpdate=-1,lastEarlyHint=-3,queuedHit=null,qaArmedLane=-1;
try{best=Number(localStorage.getItem("lumina-best")||0)||0}catch{}
function colorMat(name,color,emissive=color,intensity=.25,metalness=.43,roughness=.28){
 if(!materials[name])materials[name]=new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:intensity,metalness,roughness});
 return materials[name]
}
function emissive(name,c,intensity=2){if(!materials[name])materials[name]=new THREE.MeshBasicMaterial({color:c,toneMapped:false});return materials[name]}
const mat={
 dark:colorMat("dark",0x16234a,0x0b225b,.22),
 dark2:colorMat("dark2",0x223563,0x244b93,.32),
 glass:colorMat("glass",0x31558a,0x21549b,.48,.75,.16),
 road:colorMat("road",0x172654,0x17429b,.38,.68,.19),
 gold:emissive("gold",0xffdd95),
 cyan:emissive("cyan",0x67fff3),
 pink:emissive("pink",0xff64c9),
 lilac:emissive("lilac",0xb69dff),
 white:emissive("white",0xf5fdff),
 body:colorMat("craft",0xbfdcff,0x5b9aff,.68,.77,.13),
 bodyDark:colorMat("craftDark",0x3554a6,0x315de6,.62,.82,.17)
};
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,12,8);
const burstGeo=new THREE.OctahedronGeometry(1,0),burstMaterials={};
function box(w,h,d,x,y,z,m,parent=root){const o=new THREE.Mesh(boxGeo,m);o.scale.set(w,h,d);o.position.set(x,y,z);parent.add(o);return o}
function sphere(r,x,y,z,m,parent=root){const o=new THREE.Mesh(sphereGeo,m);o.scale.setScalar(r);o.position.set(x,y,z);parent.add(o);return o}
function glowTexture(){
 const c=document.createElement("canvas");c.width=c.height=128;let g=c.getContext("2d"),grad=g.createRadialGradient(64,64,0,64,64,64);
 grad.addColorStop(0,"rgba(255,255,255,1)");grad.addColorStop(.13,"rgba(255,255,255,.8)");grad.addColorStop(.43,"rgba(255,255,255,.16)");grad.addColorStop(1,"rgba(255,255,255,0)");
 g.fillStyle=grad;g.fillRect(0,0,128,128);
 return new THREE.CanvasTexture(c)
}
let glowMap;
function glow(color,size,x,y,z,parent=root,opacity=.8){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s}
function makeSign(text,accent="#69fff2"){
 const c=document.createElement("canvas");c.width=512;c.height=128;let ctx=c.getContext("2d");
 ctx.fillStyle="#14214d";ctx.fillRect(0,0,512,128);
 ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.strokeRect(5,6,502,115);
 ctx.shadowBlur=21;ctx.shadowColor=accent;ctx.fillStyle="#f7feff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 53px sans-serif";ctx.fillText(text,256,67);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false});
 return new THREE.Mesh(new THREE.PlaneGeometry(7.3,1.8),m)
}
function makeRhythmHitline(){
 if(hitLine3D){root.remove(hitLine3D);hitLine3D.traverse(m=>{if(m.geometry)m.geometry.dispose()})}
 hitLine3D=new THREE.Group();
 for(let lane=0;lane<3;lane++){
  const band=new THREE.Mesh(new THREE.TorusGeometry(1.55,.11,8,52),mat.cyan);
  band.rotation.x=Math.PI/2;band.position.set(CONFIG.lanes[lane],.13,4);
  hitLine3D.add(band);
  const cross=box(3.2,.06,.20,CONFIG.lanes[lane],.11,4,mat.white,hitLine3D);
 }
 root.add(hitLine3D)
}
function noteVisual(note){
 const group=new THREE.Group();
 group.position.set(CONFIG.lanes[note.lane],1.98,4-(note.time-beatAudio.time())*CONFIG.speed);
 const color=note.type==="hold"?mat.lilac:mat.gold;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.93,.16,8,40),color);
 ring.rotation.x=Math.PI/2.8;group.add(ring);
 const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.73,0),color);
 gem.rotation.y=.5;group.add(gem);
 glow(note.type==="hold"?0xd4acff:0xfff0bc,4.5,0,0,0,group,.68);
 if(note.type==="hold"){
  const trail=new THREE.Mesh(new THREE.BoxGeometry(1.15,.14,Math.max(2,note.duration*CONFIG.speed)),mat.lilac);
  trail.position.z=-note.duration*CONFIG.speed/2;group.add(trail)
 }
 root.add(group);beatVisuals.set(note.id,{group,ring,gem})
}
function releaseNoteVisual(note,burstColor=null){
 const v=beatVisuals.get(note.id);if(!v)return;
 if(burstColor)burst(v.group.position.x,v.group.position.y,v.group.position.z,burstColor,11);
 root.remove(v.group);
 v.group.traverse(o=>{
   if(o.isMesh&&o.geometry)o.geometry.dispose();
   if(o.isSprite&&o.material)o.material.dispose()
 });
 beatVisuals.delete(note.id)
}
function judgement(label,delta=0){
 const n=$("beat-judge");
 clearTimeout(judgementTimeout);
 n.className="burst"+(label==="MISS"?" miss":label==="GREAT"?" great":label==="GOOD"?" good":"");
 $("judge-word").textContent=label;
 $("judge-ms").textContent=label==="MISS"?"KEEP THE RHYTHM":label==="HOLD"?"HOLD THE BEAT":label==="FEVER"?"CITY LIGHTS ON":(Math.round(Math.abs(delta)*1000)+" ms");
 n.classList.remove("hidden");
 judgementTimeout=setTimeout(()=>n.classList.add("hidden"),label==="FEVER"?1500:650)
}
function markMiss(n){
 if(n.state==="hit"||n.state==="missed")return;
 n.state="missed";releaseNoteVisual(n);
 misses++;combo=0;feverEnergy=Math.max(0,feverEnergy-9);
 shield=Math.max(0,shield-(stageIndex===0?1.6:stageIndex===1?1.8:1.9));
 beatAudio.effect("miss");judgement("MISS");
 if(shield<=0)end(false)
}
function markHit(n,rating,delta){
 if(n.state==="hit")return;
 n.state="hit";
 releaseNoteVisual(n,rating==="PERFECT"?0xb8fff8:0xffe6bb);
 lumens++;combo++;
 if(rating==="PERFECT")perfect++;else if(rating==="GREAT")great++;else good++;
 const multiplier=feverEnds>beatAudio.time()?2:1;
 score+=Math.round(({PERFECT:320,GREAT:210,GOOD:120}[rating]+combo*14)*multiplier);
 feverEnergy=Math.min(100,feverEnergy+(rating==="PERFECT"?12:rating==="GREAT"?9:6));
 shield=Math.min(100,shield+1.6);
 beatAudio.effect("hit",rating);haptic(rating==="PERFECT"?[18,15,18]:12);
 judgement(rating,delta);metricPop();
 if(feverEnergy>=100&&feverEnds<=beatAudio.time()){
  feverEnds=beatAudio.time()+8;feverEnergy=100;beatAudio.setFever(true);beatAudio.effect("fever");
  judgement("FEVER");toast("✦ FEVER MODE · 八秒双倍分数！")
 }
 if(combo>0&&combo%12===0){toast("⚡ "+combo+" COMBO");shake=.15}
}
function holdRelease(force=false){
 if(!heldNote)return;
 const n=heldNote,now=beatAudio.time();
 heldNote=null;
 if(n.state!=="holding")return;
 if(force||now>=n.time+n.duration-.08)markHit(n,n.holdRating||"GREAT",n.holdDelta||0);
 else markMiss(n)
}
function stageTimingWindow(){return stageIndex===0?.40:stageIndex===1?.34:.30}
function stageJudge(delta){
 const d=Math.abs(delta);
 if(stageIndex===0)return d<=.13?"PERFECT":d<=.24?"GREAT":d<=.40?"GOOD":null;
 if(stageIndex===1)return d<=.11?"PERFECT":d<=.21?"GREAT":d<=.34?"GOOD":null;
 return judgeDelta(delta)
}
function hitBeat(){
 if(mode!=="playing")return;
 notesPressed=true;$("beat-hit").classList.add("pressed");
 if(heldNote)return;
 const now=beatAudio.time();
 const candidates=chartNotes.filter(n=>(n.state==="pending"||n.state==="holding")&&n.type!=="hazard"&&n.lane===targetLane&&Math.abs(n.time-now)<=stageTimingWindow());
 candidates.sort((a,b)=>Math.abs(a.time-now)-Math.abs(b.time-now));
 const n=candidates[0];
 if(!n){
  const upcoming=chartNotes.find(q=>q.state==="pending"&&q.lane===targetLane&&q.type!=="hazard"&&q.time>now);
  const lead=upcoming?upcoming.time-now:Infinity;
  const bufferLimit=[1.4,1.25,1.1][stageIndex];
  if(upcoming&&lead>stageTimingWindow()&&lead<=bufferLimit){
   if(upcoming.type==="tap"){
    // Beginner assist: a lane tap while its pad is glowing catches the note as GOOD.
    // A precisely timed tap still scores GREAT or PERFECT.
    markHit(upcoming,"GOOD",lead);
    return
   }
   // Sustained notes still require holding through the visual trail.
   queuedHit={id:upcoming.id,at:now};
   judgement("READY");
   $("judge-ms").textContent="继续按住，等长音符经过";
   haptic(8);
   return
  }
  if(upcoming&&lead<1.7&&now-lastEarlyHint>.65){lastEarlyHint=now;toast("再等一下，看到对应按键发光就点 "+["左","中","右"][targetLane])}
  return
 }
 const delta=now-n.time,quality=stageJudge(delta);
 if(!quality)return;
 if(n.type==="hold"){
  n.state="holding";n.holdRating=quality;n.holdDelta=delta;heldNote=n;
  judgement("HOLD");haptic(20)
 }else markHit(n,quality,delta)
}
function releaseBeat(){
 notesPressed=false;
 document.querySelectorAll(".lane-pad").forEach(n=>n.classList.remove("pressed"));
 if(heldNote)holdRelease()
}
function directLane(lane){
 if(mode!=="playing")return;
 if(qaArmedLane===lane&&new URLSearchParams(location.search).get("qa")==="1"){
  // CI only: stage a precisely timed note when a real pointer event reaches this handler.
  const now=beatAudio.time();
  for(const q of chartNotes)if(q.state==="pending"&&q.time-now<1.8){q.state="missed";releaseNoteVisual(q)}
  const n=chartNotes.find(q=>q.type!=="hazard"&&q.state==="pending");
  if(n){n.lane=lane;n.time=now+.035;n.type="tap"}
  qaArmedLane=-1
 }
 // Single action: select the lane and hit its note, not two separate taps.
 if(heldNote&&heldNote.lane!==lane)holdRelease();
 targetLane=lane;
 queuedHit=null;
 $("left").classList.toggle("is-selected",lane===0);
 $("beat-hit").classList.toggle("is-selected",lane===1);
 $("right").classList.toggle("is-selected",lane===2);
 haptic(12);
 hitBeat()
}
function updateLaneCoach(now){
 if(now-lastCoachUpdate<.07)return;lastCoachUpdate=now;
 const coach=$("lane-coach"),word=$("lane-coach-text"),count=$("lane-coach-count");
 const n=chartNotes.find(q=>q.type!=="hazard"&&q.state==="pending"&&q.time>=now-stageTimingWindow());
 if(!n){coach.classList.add("hidden");document.querySelectorAll(".lane-pad").forEach(el=>el.classList.remove("incoming","hit-now"));return}
 coach.classList.remove("hidden");
 const d=n.time-now,labels=["左","中","右"],padIds=["left","beat-hit","right"];
 const imminent=d<=.23&&d>=-stageTimingWindow();
 const soon=d<=[1.4,1.25,1.1][stageIndex];
 word.textContent=imminent?"现在点「"+labels[n.lane]+"」":soon?"可以先点「"+labels[n.lane]+"」":"观察音符 · 跟住节拍";
 count.textContent=imminent?"NOW!":soon?(Math.max(0,d).toFixed(1)+"s"):"♪";
 coach.classList.toggle("now",imminent);
 padIds.forEach((id,i)=>{
  $(id).classList.toggle("incoming",soon&&i===n.lane&&!imminent);
  $(id).classList.toggle("hit-now",imminent&&i===n.lane)
 })
}
function syncBeatfield(now,dt){
 if(queuedHit){
  const n=chartNotes.find(x=>x.id===queuedHit.id);
  if(!n||n.state!=="pending")queuedHit=null;
  else if(now>=n.time-.065){
   if(n.type==="hold"){
    if(notesPressed){
     n.state="holding";n.holdRating="GOOD";n.holdDelta=now-queuedHit.at;heldNote=n;judgement("HOLD");
    }else markMiss(n)
   }else markHit(n,"GOOD",n.time-queuedHit.at);
   queuedHit=null
  }
 }
 while(beatSpawnIndex<chartNotes.length&&chartNotes[beatSpawnIndex].time-now<=3.15){
  const n=chartNotes[beatSpawnIndex++];
  if(n.type==="hazard"){
   // Hazards align to the same audio clock as the musical notes.
   makeDrone(n.lane,4-(n.time-now)*CONFIG.speed);
   objects[objects.length-1].hitTime=n.time;
  }else noteVisual(n)
 }
 for(const n of chartNotes){
  if(n.type==="hazard"||n.state==="hit"||n.state==="missed")continue;
  if(n.state==="pending"&&now>n.time+stageTimingWindow()){markMiss(n);continue}
  if(n.state==="holding"){
   if(!notesPressed){markMiss(n);heldNote=null;continue}
   if(now>=n.time+n.duration){holdRelease(true);continue}
  }
  const v=beatVisuals.get(n.id);if(v){
   v.group.position.z=4-(n.time-now)*CONFIG.speed;
   v.group.position.y=1.97+Math.sin(now*5+n.beat)*.19;
   v.ring.rotation.z+=dt*1.4;v.gem.rotation.y+=dt*2.8;
  }
 }
 if(feverEnds>0&&now>=feverEnds){feverEnds=0;feverEnergy=0;beatAudio.setFever(false);toast("FEVER COMPLETE")}
 updateLaneCoach(now);
 const ph=beatAudio.phase(now),pulse=Math.pow(1-ph,5);
 if(beatSkyLight)beatSkyLight.intensity=2.7+pulse*.43+(feverEnds>now?.75:0);
 if(beatKeyLight)beatKeyLight.intensity=2.3+pulse*.8;
 if(stageArt)stageArt.group.scale.y=1+pulse*.012;
 $("beat-screen-flash").classList.toggle("on",ph<.11||feverEnds>now&&ph<.18);
 const beatNumber=Math.floor(now/(60/TRACKS[stageIndex].bpm));
 if(beatNumber!==lastBeat){lastBeat=beatNumber;const hitLine=hitLine3D;if(hitLine)hitLine.scale.setScalar(1.03);}
 if(hitLine3D)hitLine3D.scale.setScalar(1+pulse*.11);
}

function buildCraft(){
 craft=new THREE.Group();player=new THREE.Group();root.add(player);player.add(craft);
 box(1.45,.35,3,0,.5,0,mat.body,craft);
 const hull=new THREE.Mesh(new THREE.ConeGeometry(1.1,3.65,3),mat.bodyDark);
 hull.rotation.x=Math.PI/2;hull.position.set(0,.62,-.95);craft.add(hull);
 box(4.45,.19,1.05,0,.46,.58,mat.bodyDark,craft);
 box(3.75,.06,.16,0,.54,.08,mat.cyan,craft);
 box(.82,.27,1.35,0,.94,.32,mat.glass,craft);
 box(.58,.13,.7,0,1.12,.1,mat.cyan,craft);
 for(const side of [-1,1]){
   const engine=sphere(.36,side*1.72,.44,1.1,mat.lilac,craft);engine.scale.z=1.2;
   glow(0x80ffff,3,side*1.77,.39,1.4,craft,.85);
   box(.15,.13,1.5,side*2,.52,.4,mat.pink,craft);
   box(.3,.14,.55,side*1.15,.57,1.66,mat.gold,craft);
 }
 const jet=glow(0x8cffff,4.3,0,.41,2.0,craft,1);
 craftGlow=jet;
 glow(0xffc6e9,6,0,.23,.5,craft,.32);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(2.5,.075,7,60),mat.cyan);
 ring.rotation.x=Math.PI/2;ring.position.y=-.16;player.add(ring);
 player.position.set(0,1.55,4);
}
function makeBuilding(x,z,index){
 const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
 const w=5+(index*7)%6,d=5+(index*11)%8,h=12+(index*17)%40;
 box(w,h,d,0,h/2,0,index%3===0?mat.glass:index%2?mat.dark2:mat.dark,g);
 box(w+.35,.2,d+.38,0,h+.07,0,index%2?mat.pink:mat.cyan,g);
 box(w+.35,.12,d+.38,0,h*.47,0,index%3?mat.lilac:mat.cyan,g);
 const lit=[mat.cyan,mat.lilac,mat.pink,mat.gold];
 const span=quality<1?5.3:4.3;
 for(let y=2.2;y<h-1;y+=span){
  for(let xx=-w/2+.8;xx<w/2-.4;xx+=2.9){
   if((Math.floor(y*3+xx*7+index)%9)===0)continue;
   box(.91,1.2,.09,xx,y,d/2+.07,lit[(index+Math.round(y))%lit.length],g);
   box(.91,1.2,.09,xx,y,-d/2-.07,lit[(index+Math.round(y)+1)%lit.length],g);
  }
  for(let zz=-d/2+.9;zz<d/2-.5;zz+=3.1){
   box(.1,1.2,.91,w/2+.07,y,zz,lit[(index+Math.round(y)+2)%4],g);
  }
 }
 if(index%3===0){
  const sign=makeSign(["AURA","NOVA","LUX","VOLT","NEXUS","FLUX"][index%6],index%2?"#ff8edb":"#84fffa");
  sign.position.set(0,h*.73,d/2+.13);g.add(sign)
 }
 if(index%4===0){
  const antenna=box(.19,4.1,.19,0,h+2.1,0,mat.pink,g);glow(0xff99c8,4,0,h+4.3,0,g);
 }
 city.push({g,z,h});
}
function road(){
 const sky=new THREE.Mesh(new THREE.SphereGeometry(560,24,16),new THREE.MeshBasicMaterial({color:0x7799e9,side:THREE.BackSide,fog:false}));root.add(sky);
 // Radiant city floor and causeway
 box(150,.5,500,0,-.8,-165,mat.dark2);
 box(14,.25,500,0,-.25,-165,mat.road);
 for(const x of [-7.5,7.5]){
  box(.2,.2,500,x,-.02,-165,mat.cyan);
  glow(0x70fff0,5,x,.05,-50,root,.7)
 }
 for(const x of [-2.65,2.65])box(.13,.12,500,x,-.07,-165,mat.cyan);
 for(let i=0;i<58;i++){
  const z=15-i*8;
  const row=new THREE.Group();row.position.z=z;root.add(row);
  for(const x of [-6.8,6.8])box(.23,.07,2.65,x,.01,0,mat.lilac,row);
  for(const x of [-1.3,1.3])box(.12,.06,1.55,x,-.04,0,mat.gold,row);
  roadTiles.push(row)
 }
 const max=quality<1?19:27;
 for(let i=0;i<max;i++){
  const z=7-i*12.5;
  for(const side of [-1,1]){
   const x=side*(22+(i*7%16));
   makeBuilding(x,z,i*2+(side>0?1:0))
  }
 }
 // Elevated monorail tracks, holographic billboards
 for(let i=0;i<16;i++){
  const z=7-i*29;
  for(const side of [-1,1]){
   const x=side*10;
   box(.24,8,.24,x,4,z,mat.dark2);
   box(1.6,.25,2,x,7.9,z,mat.cyan);
   glow(side<0?0x80f6ff:0xff9de2,4.4,x,8.05,z)
  }
 }
 for(const z of [-44,-126,-215,-307]){
  box(49,.45,2,0,17,z,mat.dark2);
  box(49,.12,.15,0,17.38,z,mat.cyan);
  for(const x of [-23,23])box(.5,16,.45,x,8.8,z,mat.dark2)
 }
 // Giant orbital architecture at the destination
 const portal=new THREE.Group();portal.position.set(0,17,-410);root.add(portal);
 for(let j=0;j<3;j++){
  const t=new THREE.Mesh(new THREE.TorusGeometry(19+j*3,.23+j*.06,8,92),j%2?mat.pink:mat.cyan);
  t.rotation.y=j*.33;t.position.z=j*.1;portal.add(t)
 }
 glow(0xfff3c1,50,0,5,-424,root,.62);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(20,28,20),new THREE.MeshBasicMaterial({color:0xe8f9ff,fog:false}));
 moon.position.set(48,57,-120);root.add(moon);glow(0xa5d8ff,100,48,57,-126,root,.3)
}
function buildScene(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#91b8f0");scene.fog=new THREE.FogExp2(0x88a4eb,.0085);
 root=new THREE.Group();scene.add(root);
 camera=new THREE.PerspectiveCamera(67,innerWidth/Math.max(innerHeight,1),.1,600);
 const hemi=new THREE.HemisphereLight(0xdaefff,0x6e68e9,2.7);scene.add(hemi);beatSkyLight=hemi;
 const key=new THREE.DirectionalLight(0xeefcff,2.3);key.position.set(-32,60,-40);scene.add(key);beatKeyLight=key;
 for(const [c,x,y,z,power] of [[0x75ecff,-15,15,-20,90],[0xf47dff,17,13,-37,100],[0xffdb9d,0,25,-105,135]]){let light=new THREE.PointLight(c,power,90,2);light.position.set(x,y,z);scene.add(light)}
 glowMap=glowTexture();
 road();buildCraft();applyStageLook();makeRhythmHitline();scene.updateMatrixWorld(true);
 for(let i=0;i<45;i++){
  const x=(Math.random()-.5)*60,y=Math.random()*40+1,z=-Math.random()*220;
  const p=glow(i%2?0xc4ffff:0xfab7ff,.7+Math.random()*.8,x,y,z,root,.4);
  particles.push({node:p,speed:2+Math.random()*7,seed:Math.random()*6.3})
 }
 camera.position.set(0,8,20);camera.lookAt(0,2,-28)
}
function makePickup(lane,z){
 const group=new THREE.Group();group.position.set(CONFIG.lanes[lane],2.1,z);root.add(group);
 const outer=new THREE.Mesh(new THREE.TorusGeometry(.86,.13,7,48),mat.gold);
 outer.rotation.x=Math.PI/3;group.add(outer);
 const core=new THREE.Mesh(new THREE.OctahedronGeometry(.63,0),mat.gold);group.add(core);
 glow(0xffe5ae,5.2,0,0,0,group,.75);
 objects.push({type:"pickup",group,z,lane,age:0,hit:false});
}
function makeDrone(lane,z){
 const group=new THREE.Group();group.position.set(CONFIG.lanes[lane],2.2,z);root.add(group);
 box(2.15,1.35,1.15,0,0,0,mat.dark2,group);
 box(2.4,.12,1.4,0,.45,0,mat.pink,group);
 box(2.45,.15,1.4,0,-.45,0,mat.pink,group);
 sphere(.47,0,0,.68,mat.pink,group);
 for(const x of [-1.35,1.35]){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.075,6,24),mat.pink);
  ring.rotation.y=Math.PI/2;ring.position.set(x,0,0);group.add(ring)
 }
 glow(0xff79c9,5,0,.2,0,group,.8);
 objects.push({type:"drone",group,z,lane,age:0,hit:false})
}
function makeSentinel(){
 const lane=Math.floor(Math.random()*3),group=new THREE.Group();
 group.position.set(CONFIG.lanes[lane],2.7,-142);root.add(group);
 const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(1.35,1),mat.bodyDark);group.add(shell);
 const eye=sphere(.72,0,0,.6,mat.pink,group);
 for(let i=0;i<3;i++){
  const torus=new THREE.Mesh(new THREE.TorusGeometry(1.55+i*.32,.11,7,40),i%2?mat.cyan:mat.pink);
  torus.rotation.set(.4*i,.7*i,.2*i);group.add(torus)
 }
 glow(0xffb2f5,8,0,0,0,group,.85);
 objects.push({type:"sentinel",group,z:-142,lane,age:0,hit:false});
 toast("⚠ NEXUS SENTINEL · 核心哨兵接近！");
 soundDirector.tone(190,.65,"sawtooth",.12);
}
function spawn(){
 const lane=Math.floor(Math.random()*3),cfg=LEVELS[stageIndex];
 if(Math.random()<cfg.hazard){
  makeDrone(lane,-125);
  const other=(lane+1+(Math.random()<.5?0:1))%3;
  if(Math.random()<.7)makePickup(other,-133);
 }else{
  makePickup(lane,-125);
  if(Math.random()<.28)makePickup((lane+1)%3,-141)
 }
 if(stageIndex===2&&Math.random()<.11)makeDrone((lane+1)%3,-155);
}
function playTone(freq=440,duration=.14,type="sine",gain=.07){soundDirector.tone(freq,duration,type,gain)}
function toast(msg){ui.message.textContent=msg;ui.message.classList.remove("hidden");clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>ui.message.classList.add("hidden"),1700)}
function haptic(pattern){
 try{if(typeof navigator.vibrate==="function")navigator.vibrate(pattern)}catch{}
}
function retrigger(id,className,ms=400){
 const n=$(id);n.classList.remove(className);void n.offsetWidth;n.classList.add(className);
 setTimeout(()=>n.classList.remove(className),ms)
}
function pulseVisual(){
 retrigger("pulse-fx","on",760);
 retrigger("world","feedback-pulse",420)
}
function hitVisual(){retrigger("world","feedback-impact",350)}
function metricPop(){retrigger("lumens","feedback-pop",360)}
function steer(d){
 if(mode!=="playing")return;
 const next=clamp(targetLane+d,0,2);
 if(next!==targetLane){targetLane=next;haptic(16);playTone(370,.075,"sine",.035)}
}
function pulse(){
 if(mode!=="playing"||pulseIn>0)return;
 pulseIn=CONFIG.pulseCooldown;
 const previous=shield;
 shield=Math.min(100,shield+20);
 invuln=Math.max(invuln,.6);
 beatAudio.effect("drop");haptic([35,35,95]);
 const onBeat=beatAudio.offset()<=.12;
 if(onBeat){
  score+=500;feverEnergy=Math.min(100,feverEnergy+30);
  judgement("BEAT DROP",beatAudio.offset());
  if(feverEnergy>=100&&feverEnds<=beatAudio.time()){
   feverEnds=beatAudio.time()+8;beatAudio.setFever(true);beatAudio.effect("fever")
  }
 }
 shake=.95;pulseVisual();
 // All three lanes, the whole forward danger field — visible and useful in every run.
 let removed=0;
 objects.forEach(o=>{
  const front=o.group.position.z>=-104&&o.group.position.z<=14;
  if((o.type==="drone"||o.type==="sentinel")&&front&&!o.hit){
   o.hit=true;removed++;score+=o.type==="sentinel"?500:120;
   burst(o.group.position.x,o.group.position.y,o.group.position.z,0x91fff3,o.type==="sentinel"?32:18)
  }
 });
 combo=Math.min(combo+removed,9);
 // Three giant shockwave discs race forward across all lanes.
 for(let i=0;i<3;i++){
  const matWave=new THREE.MeshBasicMaterial({color:[0xa8fff8,0x82ddff,0xf1c6ff][i],transparent:true,opacity:.95,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.095,8,80),matWave);
  ring.rotation.x=Math.PI/2;ring.position.set(0,1.7,4-i*5);root.add(ring);
  beams.push({mesh:ring,life:.85+i*.12,duration:.85+i*.12,startZ:4-i*5})
 }
 if(removed)toast("✳ "+(onBeat?"ON BEAT +500 · ":"")+"清除 "+removed+" 架无人机 · 同步 +"+Math.round(shield-previous));
 else toast("✳ "+(onBeat?"ON BEAT +500 · ":"")+"前方净空 · 同步 +"+Math.round(shield-previous));
 $("pulse").classList.add("cooling");
 updateHUD()
}
function burst(x,y,z,color=0xffefa8,count=12){
 const material=burstMaterials[color]||(burstMaterials[color]=new THREE.MeshBasicMaterial({color,toneMapped:false,transparent:true}));
 for(let i=0;i<count;i++){
  const mesh=new THREE.Mesh(burstGeo,material);mesh.scale.setScalar(.12+Math.random()*.15);
  mesh.position.set(x,y,z);root.add(mesh);
  particles.push({burst:true,node:mesh,life:.45+Math.random()*.55,vx:(Math.random()-.5)*12,vy:(Math.random()-.2)*9,vz:(Math.random()-.5)*12})
 }
}
function hit(big=false){
 if(invuln>0)return;
 shield=Math.max(0,shield-(big?50:LEVELS[stageIndex].damage));combo=0;invuln=1.35;shake=.52;
 $("impact").classList.add("on");setTimeout(()=>$("impact").classList.remove("on"),210);
 beatAudio.effect("miss");haptic([85,45,135]);hitVisual();
 toast("⚠ 护盾受损");
 if(shield<=0)end(false);
}
function collect(o){
 o.hit=true;lumens++;combo=Math.min(combo+1,9);
 const gained=100+combo*30;score+=gained;
 shield=Math.min(100,shield+4);
 burst(o.group.position.x,o.group.position.y,o.group.position.z,0xffe2a3,15);
 beatAudio.effect("hit","GREAT");haptic(18);metricPop();
 if(combo%4===0)toast("✦ "+combo+" COMBO · +"+gained);
 if(lumens===CONFIG.goal){toast("✦ 节奏目标达成！坚持到歌曲结束");beatAudio.effect("fever")}
}
function formatTime(s){let v=Math.max(0,Math.ceil(s));return String(Math.floor(v/60)).padStart(2,"0")+":"+String(v%60).padStart(2,"0")}
function updateHUD(){
 ui.timer.textContent=formatTime(CONFIG.duration-elapsed);
 $("district-name").textContent=LEVELS[stageIndex].sub+" / "+LEVELS[stageIndex].label;
 ui.dist.textContent=TRACKS[stageIndex].genre+" · "+TRACKS[stageIndex].bpm+" BPM";
 ui.lumens.innerHTML=String(lumens).padStart(2,"0")+' <span>/ '+CONFIG.goal+'</span>';
 ui.shield.style.width=shield+"%";ui.shieldText.textContent=Math.round(shield)+"%";
 ui.combo.textContent="× "+combo;
 $("fever-fill").style.width=feverEnergy+"%";
 $("fever-label").textContent=feverEnds>beatAudio.time()?"⚡ FEVER / 2× SCORE":"FEVER ENERGY";
 document.body.classList.toggle("fever-active",feverEnds>beatAudio.time());
 ui.progress.style.width=clamp(elapsed/CONFIG.duration*100,0,100)+"%";
 document.querySelector(".progress-light").style.left=clamp(elapsed/CONFIG.duration*100,0,100)+"%";
 const ready=Math.max(0,1-pulseIn/CONFIG.pulseCooldown);
 $("pulse").style.setProperty("--charge",(ready*360).toFixed(1)+"deg");
 $("pulse-charge").textContent=pulseIn>0?pulseIn.toFixed(1)+"s":"READY";
 $("pulse").disabled=pulseIn>.03;
 if(pulseIn<=0)$("pulse").classList.remove("cooling")
}

const SHIP_STYLES={
 aqua:{body:0xbfdcff,light:0x74fff5},
 rose:{body:0xffbde9,light:0xff90dd},
 solar:{body:0xffe1b1,light:0xffd27f}
};
function updateTrail(){
 const v=SHIP_STYLES[activeTrail]||SHIP_STYLES.aqua;
 mat.body.color.setHex(v.body);mat.body.emissive.setHex(v.light);
 mat.bodyDark.emissive.setHex(v.light);
 if(craftGlow)craftGlow.material.color.setHex(v.light);
}
function applyStageLook(){
 if(!scene||!root)return;
 if(stageArt){stageArt.dispose();stageArt=null}
 stageArt=createDistrict(THREE,scene,root,selectedStage,quality);
 if(craft)updateTrail();
}
function refreshMenu(){
 document.querySelectorAll("[data-stage]").forEach(btn=>{
  const i=Number(btn.dataset.stage),locked=i>=progress.unlocked;
  btn.disabled=locked;btn.classList.toggle("is-selected",i===selectedStage);
  const desc=btn.querySelector("small"),record=progress.levels[i];
  if(desc)desc.textContent=locked?"🔒 尚未解锁":record?"✦ "+record.stars+" 星 · "+record.rank+" 级":"可以挑战";
 });
 $("stage-story").textContent=LEVELS[selectedStage].mission;
 $("launch-label").textContent="PLAY TRACK 0"+(selectedStage+1);
 $("track-name").textContent=TRACKS[selectedStage].title;
 $("track-detail").textContent=TRACKS[selectedStage].genre+" · "+TRACKS[selectedStage].bpm+" BPM · ORIGINAL MUSIC";
 document.querySelectorAll("[data-trail]").forEach(btn=>{
  const t=btn.dataset.trail;
  btn.disabled=t==="rose"?progress.unlocked<2:t==="solar"?progress.unlocked<3:false;
  btn.classList.toggle("active",activeTrail===t);
 })
}
function selectStage(index){
 if(!Number.isInteger(index)||index<0||index>=progress.unlocked)return;
 selectedStage=index;applyStageLook();refreshMenu()
}
function startStage(index=selectedStage){
 stageIndex=Math.max(0,Math.min(LEVELS.length-1,index));selectedStage=stageIndex;
 const L=LEVELS[stageIndex];
 CONFIG.duration=L.duration;CONFIG.speed=L.speed;CONFIG.spawnEvery=L.spawnEvery;
 chartNotes=makeBeatmap(stageIndex,CONFIG.duration);
 CONFIG.goal=Math.max(5,Math.ceil(chartNotes.filter(n=>n.type!=="hazard").length*.36));
 CONFIG.pulseCooldown=stageIndex===0?6.3:stageIndex===1?5.8:5.4;
 best=progress.levels[stageIndex]?.score||0;
 applyStageLook();reset();mode="playing";clock.getDelta();
 beatAudio.mute(!soundOn);beatAudio.start(stageIndex);
 ui.intro.classList.add("hidden");ui.result.classList.add("hidden");ui.pause.classList.add("hidden");
 ui.hud.classList.remove("hidden");ui.hint.classList.remove("hidden");
 ui.touch.classList.toggle("hidden",!matchMedia("(pointer:coarse)").matches);
 $("lane-coach").classList.remove("hidden");lastCoachUpdate=-1;lastEarlyHint=-3;
 ui.hint.textContent=stageIndex===0?"点亮的左／中／右按钮可以提前按，GOOD 会自动帮你接住；踩准节拍则是 PERFECT！":
 stageIndex===1?"点击对应的左／中／右键，紫色长音符持续按住不松开。":
 "音乐加速！左／中／右三个键就能打音符，技能可清障和回能量。";
 $("track-name").textContent=TRACKS[stageIndex].title;
 $("track-detail").textContent=TRACKS[stageIndex].genre+" · "+TRACKS[stageIndex].bpm+" BPM · ORIGINAL MUSIC";
 setTimeout(()=>{if(mode==="playing")ui.hint.classList.add("hidden")},8500)
}
function starsFor(success){
 if(!success)return 0;
 return 1+Number((perfect+great)/Math.max(1,chartNotes.filter(n=>n.type!=="hazard").length)>=.55)+Number(perfect/Math.max(1,chartNotes.filter(n=>n.type!=="hazard").length)>=.4&&misses<12)
}
function rankFor(success,stars){
 if(!success)return "—";
 if(stars===3&&perfect/Math.max(1,perfect+great+good+misses)>.8)return "S";
 return stars===3?"A":stars===2?"B":"C"
}
function reset(){
 elapsed=0;score=0;lumens=0;shield=100;combo=0;invuln=0;pulseIn=0;spawnIn=.5;targetLane=1;currentX=0;shake=0;bossSpawned=false;
 beatSpawnIndex=0;beatVisuals.forEach(({group})=>root.remove(group));beatVisuals.clear();
 chartNotes.forEach(n=>n.state="pending");heldNote=null;notesPressed=false;queuedHit=null;
 perfect=0;great=0;good=0;misses=0;feverEnergy=0;feverEnds=0;lastBeat=-1;
 document.body.classList.remove("fever-active");$("beat-screen-flash").classList.remove("on");
 $("lane-coach").classList.add("hidden");document.querySelectorAll(".lane-pad").forEach(n=>n.classList.remove("incoming","hit-now","pressed","is-selected"));
 $("beat-judge").classList.add("hidden");$("beat-hit").classList.remove("pressed");
 $("pulse-fx").classList.remove("on");$("world").classList.remove("feedback-impact","feedback-pulse");
 objects.forEach(o=>root.remove(o.group));objects=[];
 beams.forEach(o=>root.remove(o.mesh));beams=[];
 player.position.set(0,1.55,4);
 city.forEach(o=>o.g.position.z=o.z);
 camera.position.set(0,8,20);
 updateHUD()
}
function end(success){
 if(mode!=="playing")return;
 mode="result";beatAudio.stop();releaseBeat();$("lane-coach").classList.add("hidden");
 ui.hud.classList.add("hidden");ui.touch.classList.add("hidden");ui.hint.classList.add("hidden");
 if(success){
  score+=Math.round(shield)*6+Math.max(0,lumens-CONFIG.goal)*160;
  $("result-title").textContent=stageIndex===2?"核心已点亮":"航线已完成";
  $("result-desc").textContent=stageIndex===2?"三座城区重新苏醒。你已经成为真正的霓光信使。":"你已照亮「"+LEVELS[stageIndex].name+"」。下一片城区正在等待。";
  burst(0,7,-9,0x9ffff5,32);
  soundDirector.milestone()
 }else{
  $("result-title").textContent="航线暂时中断";
  $("result-desc").textContent="这个城区的挑战尚未完成。调整航线，再试一次。"
 }
 const stars=starsFor(success),rank=rankFor(success,stars);
 if(success){
  const old=progress.levels[stageIndex];
  progress.levels[stageIndex]=(!old||score>old.score)?{score,stars:Math.max(stars,old?.stars||0),rank}:old;
  progress.unlocked=Math.max(progress.unlocked,Math.min(3,stageIndex+2));
  progress.totalCollected=(progress.totalCollected||0)+lumens;
  saveProgress(progress)
 }
 if(score>best){best=score;try{localStorage.setItem("lumina-best",String(best))}catch{}}
 $("result-kicker").textContent=success?"MISSION ACCOMPLISHED / "+LEVELS[stageIndex].label:"SIGNAL LOST / "+LEVELS[stageIndex].label;
 $("end-stars").textContent=[0,1,2].map(i=>i<stars?"★":"☆").join(" ");
 $("end-rank").textContent=rank;
 $("end-lumens").textContent=lumens+" / "+CONFIG.goal;
 $("result-accuracy").textContent="PERFECT "+perfect+" · GREAT "+great+" · GOOD "+good+" · MISS "+misses;
 $("end-score").textContent=score.toLocaleString();
 $("end-best").textContent=best.toLocaleString();
 $("end-reward").textContent=success?(stageIndex===2?"三关全部点亮":"+"+(stars*100)+" EXP"):"—";
 $("next-stage").classList.toggle("hidden",!success||stageIndex===LEVELS.length-1);
 ui.result.classList.remove("hidden");
 refreshMenu()
}
function pause(){
 if(mode!=="playing")return;
 mode="paused";beatAudio.pause();releaseBeat();ui.pause.classList.remove("hidden");ui.touch.classList.add("hidden")
}
function resume(){
 if(mode!=="paused")return;
 mode="playing";beatAudio.resume();ui.pause.classList.add("hidden");ui.touch.classList.toggle("hidden",!matchMedia("(pointer:coarse)").matches);clock.getDelta()
}
function toMenu(){
 mode="menu";beatAudio.stop();$("lane-coach").classList.add("hidden");ui.pause.classList.add("hidden");ui.result.classList.add("hidden");ui.hud.classList.add("hidden");ui.touch.classList.add("hidden");ui.intro.classList.remove("hidden");reset();refreshMenu()
}
function resize(){
 const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?70:67;camera.updateProjectionMatrix();
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<700?1.35:1.7))
}
function init(){
 renderer=new THREE.WebGLRenderer({antialias:quality===1,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
 renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.65;
 $("world").appendChild(renderer.domElement);
 buildScene();resize();render()
}
function update(dt){
 const active=mode==="playing",t=clock.elapsedTime;
 if(active){
  elapsed=beatAudio.time();spawnIn-=dt;pulseIn=Math.max(0,pulseIn-dt);invuln=Math.max(0,invuln-dt);shake=Math.max(0,shake-dt*2);
  beatAudio.tick();
  syncBeatfield(elapsed,dt);
  if(stageIndex===2&&!bossSpawned&&elapsed>51){bossSpawned=true;makeSentinel()}
  currentX=lerp(currentX,CONFIG.lanes[targetLane],1-Math.exp(-dt*11));
  player.position.x=currentX;
  craft.rotation.z=lerp(craft.rotation.z,(CONFIG.lanes[targetLane]-currentX)*-.092,1-Math.exp(-dt*9));
  craft.rotation.x=.035+Math.sin(t*7)*.018;
  craft.position.y=Math.sin(t*4.7)*.13;
  craftGlow.scale.set(4.1+Math.sin(t*15)*.55,4.1+Math.sin(t*15)*.55,1);
  const travel=CONFIG.speed*dt;
  for(const o of objects){
    o.group.position.z=o.hitTime===undefined?o.group.position.z+travel:4-(o.hitTime-elapsed)*CONFIG.speed;
    o.age+=dt;
    if(stageIndex>=1&&o.type==="drone"&&o.hitTime===undefined)o.group.position.x=CONFIG.lanes[o.lane]+Math.sin(o.age*3.2+o.lane*2)*(.7+(stageIndex-1)*.35);
    if(o.type==="pickup"){o.group.rotation.y+=dt*3.7;o.group.children[0].rotation.z+=dt*.8;o.group.position.y=2.1+Math.sin(o.age*5)*.25}
    else if(o.type==="sentinel"){o.group.rotation.y+=dt*2.2;o.group.position.y=2.8+Math.sin(o.age*3)*.4}
    else{o.group.rotation.z=Math.sin(o.age*5)*.12;o.group.position.y=2.1+Math.sin(o.age*4)*.24}
    if(!o.hit&&Math.abs(o.group.position.z-4)<1.65&&Math.abs(o.group.position.x-currentX)<1.75){
      o.type==="pickup"?collect(o):hit(o.type==="sentinel");o.hit=true
    }
  }
  for(let i=objects.length-1;i>=0;i--){
  const o=objects[i];
  if(o.type==="drone"&&!o.hit&&!o.nearMissed&&o.group.position.z>6){
   o.nearMissed=true;
   const d=Math.abs(o.group.position.x-currentX);
   if(d>1.8&&d<5.3){score+=85;combo=Math.min(combo+1,9);soundDirector.tone(520,.1,"triangle",.035);toast("✦ 擦肩而过 · +85")}
  }
  if(o.hit||o.group.position.z>17){root.remove(o.group);objects.splice(i,1)}
 }
  // City loops seamlessly along the runway
  for(const b of city){b.g.position.z+=travel*.75;if(b.g.position.z>32)b.g.position.z-=city.length/2*12.5}
  for(const laneRow of roadTiles){laneRow.position.z+=travel;if(laneRow.position.z>20)laneRow.position.z-=roadTiles.length*8}
  if(elapsed>=CONFIG.duration){
   const cleared=lumens>=CONFIG.goal&&shield>0;
   end(cleared);
   if(!cleared){$("result-title").textContent="节奏尚未同步";$("result-desc").textContent="命中至少 "+CONFIG.goal+" 个音符即可解锁下一首。你命中了 "+lumens+" 个，再挑战一次！"}
  }
  lastHUD+=dt;if(lastHUD>.06){lastHUD=0;updateHUD()}
 }
 // Animated sky-city is alive even behind the start screen
 if(mode!=="paused"){
  if(stageArt)stageArt.update(dt,t);
  player.position.y=1.55+Math.sin(t*3.7)*.08;
  if(mode==="menu")craft.rotation.z=Math.sin(t*.8)*.09;
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i];if(p.burst){p.life-=dt;p.node.position.x+=p.vx*dt;p.node.position.y+=p.vy*dt;p.node.position.z+=p.vz*dt;p.node.scale.multiplyScalar(.98);if(p.life<=0){root.remove(p.node);particles.splice(i,1)}}else{
    p.node.position.y+=Math.sin(t+p.seed)*dt*.5;p.node.position.z+=dt*p.speed;if(p.node.position.z>19)p.node.position.z=-210
   }
  }
  for(let i=beams.length-1;i>=0;i--){
  const b=beams[i];b.life-=dt;
  const ratio=1-Math.max(0,b.life)/b.duration;
  b.mesh.scale.setScalar(1+ratio*8.6);
  b.mesh.position.z=b.startZ-ratio*93;
  b.mesh.material.opacity=Math.max(0,(1-ratio)*.95);
  if(b.life<=0){root.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();beams.splice(i,1)}
 }
 }
 const sh=active?shake*.75:0;
 const portrait=innerWidth<innerHeight;
 const camX=mode==="menu"?Math.sin(t*.19)*1.3:currentX*(portrait?.62:.22);
 camera.position.lerp(new THREE.Vector3(camX+(Math.random()-.5)*sh,portrait?12.8:mode==="menu"?8.3:7.6+(Math.random()-.5)*sh,portrait?29:mode==="menu"?22:19),1-Math.exp(-dt*3.2));
 camera.lookAt(currentX*(portrait?.62:.28),portrait?0:2.0,portrait?-13:-19);
}
function render(){requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.045);update(dt);renderer.render(scene,camera)}
$("start").onclick=()=>startStage(selectedStage);$("restart").onclick=()=>startStage(stageIndex);$("next-stage").onclick=()=>startStage(Math.min(stageIndex+1,LEVELS.length-1));$("home").onclick=toMenu;$("pause").onclick=pause;$("resume").onclick=resume;$("quit").onclick=toMenu;
$("sound").onclick=()=>{soundOn=!soundOn;beatAudio.mute(!soundOn);$("sound").textContent=soundOn?"♪":"♩";toast(soundOn?"音乐已开启":"已静音")};
window.addEventListener("keydown",e=>{
 if(["ArrowLeft","ArrowRight","Space","KeyA","KeyS","KeyD","KeyJ","KeyK","ShiftLeft","ShiftRight","Escape"].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(e.code==="KeyA")directLane(0);
 else if(e.code==="KeyS")directLane(1);
 else if(e.code==="KeyD")directLane(2);
 else if(e.code==="ArrowLeft")steer(-1);
 else if(e.code==="ArrowRight")steer(1);
 else if(e.code==="Space"||e.code==="KeyJ")hitBeat();
 else if(e.code==="KeyK"||e.code==="ShiftLeft"||e.code==="ShiftRight")pulse();
 else if(e.code==="Escape"){if(mode==="playing")pause();else if(mode==="paused")resume()}
});
window.addEventListener("keyup",e=>{
 if(["KeyA","KeyS","KeyD","Space","KeyJ"].includes(e.code))releaseBeat()
});
function bind(id,fn){const node=$(id);node.addEventListener("pointerdown",e=>{e.preventDefault();fn()})}
bind("pulse",pulse);
[["left",0],["beat-hit",1],["right",2]].forEach(([id,lane])=>{
 const button=$(id);
 button.addEventListener("pointerdown",e=>{
  e.preventDefault();button.setPointerCapture(e.pointerId);button.classList.add("pressed");directLane(lane)
 });
 for(const type of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(type,releaseBeat)
});
let startTouch=null,gestureMoved=false;
$("world").addEventListener("pointerdown",e=>{startTouch={x:e.clientX,y:e.clientY,t:performance.now()};gestureMoved=false});
$("world").addEventListener("pointerup",e=>{
 if(!startTouch||mode!=="playing")return;
 const dx=e.clientX-startTouch.x,dy=e.clientY-startTouch.y;
 if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*.8){steer(dx<0?-1:1);gestureMoved=true}
 startTouch=null
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&mode==="playing")pause()});
document.querySelectorAll("[data-stage]").forEach(button=>button.onclick=()=>selectStage(Number(button.dataset.stage)));
document.querySelectorAll("[data-trail]").forEach(button=>button.onclick=()=>{if(button.disabled)return;activeTrail=button.dataset.trail;progress.skin=activeTrail;saveProgress(progress);updateTrail();refreshMenu()});
if(new URLSearchParams(location.search).get("qa")==="1"){
 window.__luminaQA={
  win:()=>{lumens=CONFIG.goal;end(true)},
  lose:()=>{shield=0;end(false)},
  get:()=>{let v=new THREE.Vector3();if(player)player.getWorldPosition(v);if(camera)v.project(camera);return {mode,stageIndex,selectedStage,unlocked:progress.unlocked,lumens,shield,score,targetLane,pulseIn,enemyCount:objects.filter(o=>(o.type==="drone"||o.type==="sentinel")&&!o.hit).length,playerScreen:{x:v.x,y:v.y},bpm:TRACKS[stageIndex].bpm,noteCount:chartNotes.length,perfect,great,good,misses,songTime:beatAudio.time(),coachText:$("lane-coach-text").textContent,selectedPad:["left","beat-hit","right"][targetLane]}},
  testBeatHit:()=>{const n=chartNotes.find(n=>n.state==="pending"&&n.type!=="hazard");if(!n)return false;markHit(n,"PERFECT",0);return true},
  prepareLaneNote:(lane)=>{qaArmedLane=lane;return true},
  pulseTest:()=>{shield=55;makeDrone(0,-26);makeDrone(2,-36);updateHUD();return objects.filter(o=>o.type==="drone"&&!o.hit).length}
 };
}
try{init();refreshMenu()}catch(error){console.error("LUMINA init error",error);$("fatal-message").textContent="当前浏览器无法启动3D画面："+String(error.message||error);ui.fatal.classList.remove("hidden");}
