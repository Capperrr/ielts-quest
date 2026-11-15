import * as THREE from "https://esm.sh/three@0.160.1";
const $=id=>document.getElementById(id);
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const ui={intro:$("intro"),result:$("result"),pause:$("pause-screen"),fatal:$("fatal"),hud:$("hud"),touch:$("touch"),timer:$("timer"),dist:$("distance"),lumens:$("lumens"),shield:$("shield-fill"),shieldText:$("shield-num"),combo:$("combo"),progress:$("progress-fill"),message:$("notification"),hint:$("hint")};
const CONFIG={duration:75,lanes:[-4,0,4],speed:34,spawnEvery:.89,goal:12,pulseCooldown:7};
let renderer,scene,camera,root,player,craft,craftGlow,trail=[],city=[],roadTiles=[],objects=[],particles=[],beams=[],clock=new THREE.Clock(),vignettePulse=0;
let elapsed=0,score=0,lumens=0,shield=100,combo=0,best=0,mode="menu",targetLane=1,currentX=0,spawnIn=.4,invuln=0,pulseIn=0,shake=0,lastHUD=0,noticeTimeout=0,soundOn=true,audio=null,lastSwipe=null,quality=window.innerWidth<720?.7:1;
const materials={};
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
   const x=side*(14+(i*7%18));
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
 const hemi=new THREE.HemisphereLight(0xdaefff,0x6e68e9,2.7);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xeefcff,2.3);key.position.set(-32,60,-40);scene.add(key);
 for(const [c,x,y,z,power] of [[0x75ecff,-15,15,-20,90],[0xf47dff,17,13,-37,100],[0xffdb9d,0,25,-105,135]]){let light=new THREE.PointLight(c,power,90,2);light.position.set(x,y,z);scene.add(light)}
 glowMap=glowTexture();
 road();buildCraft();scene.updateMatrixWorld(true);
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
function spawn(){
 const lane=Math.floor(Math.random()*3);
 const obstacle=Math.random()<.54;
 if(obstacle){makeDrone(lane,-125);if(Math.random()<.55)makePickup((lane+1+(Math.random()<.5?0:1))%3,-133)}
 else{makePickup(lane,-125);if(Math.random()<.2)makePickup((lane+1)%3,-139)}
}
function playTone(freq=440,duration=.14,type="sine",gain=.07){
 if(!soundOn)return;
 try{
  if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==="suspended")audio.resume();
  const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
  o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(55,freq*.65),t+duration);
  g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.03)
 }catch{}
}
function toast(msg){ui.message.textContent=msg;ui.message.classList.remove("hidden");clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>ui.message.classList.add("hidden"),1450)}
function steer(d){
 if(mode!=="playing")return;
 const next=clamp(targetLane+d,0,2);
 if(next!==targetLane){targetLane=next;playTone(370, .075,"sine",.022)}
}
function pulse(){
 if(mode!=="playing"||pulseIn>0)return;
 pulseIn=CONFIG.pulseCooldown;
 playTone(620,.42,"sawtooth",.064);playTone(940,.43,"sine",.035);
 shake=.34;toast("✳ LIGHT PULSE · 光脉冲");
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.08,8,68),new THREE.MeshBasicMaterial({color:0xa2fff9,transparent:true,opacity:1,depthWrite:false,toneMapped:false}));
 ring.rotation.x=Math.PI/2;ring.position.set(currentX,1.85,4);root.add(ring);
 beams.push({mesh:ring,life:.55});
 let removed=0;
 objects.forEach(o=>{
  const near=Math.abs(o.group.position.z-4)<30&&Math.abs(o.group.position.x-currentX)<3.4;
  if(o.type==="drone"&&near&&!o.hit){o.hit=true;removed++;score+=80;burst(o.group.position.x,o.group.position.y,o.group.position.z,0x91fff3,14)}
 });
 if(removed){toast("✦ 清除 "+removed+" 个障碍");combo=Math.min(combo+removed,9)}
 $("pulse").classList.add("cooling")
}
function burst(x,y,z,color=0xffefa8,count=12){
 const material=new THREE.MeshBasicMaterial({color,toneMapped:false,transparent:true});
 for(let i=0;i<count;i++){
  const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.12+Math.random()*.15,0),material);
  mesh.position.set(x,y,z);root.add(mesh);
  particles.push({burst:true,node:mesh,life:.45+Math.random()*.55,vx:(Math.random()-.5)*12,vy:(Math.random()-.2)*9,vz:(Math.random()-.5)*12})
 }
}
function hit(){
 if(invuln>0)return;
 shield=Math.max(0,shield-34);combo=0;invuln=1.35;shake=.52;
 $("impact").classList.add("on");setTimeout(()=>$("impact").classList.remove("on"),210);
 playTone(125,.35,"sawtooth",.1);
 toast("⚠ 护盾受损");
 if(shield<=0)end(false);
}
function collect(o){
 o.hit=true;lumens++;combo=Math.min(combo+1,9);
 const gained=100+combo*30;score+=gained;
 shield=Math.min(100,shield+4);
 burst(o.group.position.x,o.group.position.y,o.group.position.z,0xffe2a3,15);
 playTone(730+combo*55,.18,"sine",.055);
 if(combo%4===0)toast("✦ "+combo+" COMBO · +"+gained);
 if(lumens===CONFIG.goal)toast("✦ 已集齐足够的光，继续冲向黎明")
}
function formatTime(s){let v=Math.max(0,Math.ceil(s));return String(Math.floor(v/60)).padStart(2,"0")+":"+String(v%60).padStart(2,"0")}
function updateHUD(){
 ui.timer.textContent=formatTime(CONFIG.duration-elapsed);
 ui.dist.textContent=String(Math.floor(elapsed*CONFIG.speed)).padStart(4,"0")+" M";
 ui.lumens.innerHTML=String(lumens).padStart(2,"0")+' <span>/ '+CONFIG.goal+'</span>';
 ui.shield.style.width=shield+"%";ui.shieldText.textContent=Math.round(shield)+"%";
 ui.combo.textContent="× "+Math.max(1,combo);
 ui.progress.style.width=clamp(elapsed/CONFIG.duration*100,0,100)+"%";
 document.querySelector(".progress-light").style.left=clamp(elapsed/CONFIG.duration*100,0,100)+"%";
 $("pulse-ring").style.opacity=pulseIn>0?Math.max(.17,1-pulseIn/CONFIG.pulseCooldown):1;
 if(pulseIn<=0)$("pulse").classList.remove("cooling")
}
function reset(){
 elapsed=0;score=0;lumens=0;shield=100;combo=0;invuln=0;pulseIn=0;spawnIn=.5;targetLane=1;currentX=0;shake=0;
 objects.forEach(o=>root.remove(o.group));objects=[];
 beams.forEach(o=>root.remove(o.mesh));beams=[];
 player.position.set(0,1.55,4);
 city.forEach(o=>o.g.position.z=o.z);
 camera.position.set(0,8,20);
 updateHUD()
}
function start(){
 reset();mode="playing";clock.getDelta();
 ui.intro.classList.add("hidden");ui.result.classList.add("hidden");ui.pause.classList.add("hidden");
 ui.hud.classList.remove("hidden");ui.hint.classList.remove("hidden");
 ui.touch.classList.toggle("hidden",!matchMedia("(pointer:coarse)").matches);
 playTone(535,.25);setTimeout(()=>{if(mode==="playing")ui.hint.classList.add("hidden")},4500)
}
function end(success){
 if(mode!=="playing")return;
 mode="result";ui.hud.classList.add("hidden");ui.touch.classList.add("hidden");ui.hint.classList.add("hidden");
 if(success){
  const bonus=Math.round(shield)*5+Math.max(0,lumens-CONFIG.goal)*100;score+=bonus;
  $("result-kicker").textContent="MISSION COMPLETE / DAYBREAK DELIVERED";
  $("result-title").textContent="黎明已送达";
  $("result-desc").textContent="霓光穿过了整座城市。你把最后一束光送到了黎明。";
  playTone(630,.45);setTimeout(()=>playTone(920,.5),190)
 }else{
  $("result-kicker").textContent="SIGNAL LOST / TRY AGAIN";
  $("result-title").textContent="光还没有熄灭";
  $("result-desc").textContent="这次航线暂时中断。下一次，我们再靠近黎明一点。";
 }
 if(score>best){best=score;try{localStorage.setItem("lumina-best",String(best))}catch{}}
 $("end-lumens").textContent=lumens;
 $("end-score").textContent=score.toLocaleString();
 $("end-best").textContent=best.toLocaleString();
 ui.result.classList.remove("hidden")
}
function pause(){
 if(mode!=="playing")return;
 mode="paused";ui.pause.classList.remove("hidden");ui.touch.classList.add("hidden")
}
function resume(){
 if(mode!=="paused")return;
 mode="playing";ui.pause.classList.add("hidden");ui.touch.classList.toggle("hidden",!matchMedia("(pointer:coarse)").matches);clock.getDelta()
}
function toMenu(){
 mode="menu";ui.pause.classList.add("hidden");ui.result.classList.add("hidden");ui.hud.classList.add("hidden");ui.touch.classList.add("hidden");ui.intro.classList.remove("hidden");reset()
}
function resize(){
 const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?79:67;camera.updateProjectionMatrix();
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
  elapsed+=dt;spawnIn-=dt;pulseIn=Math.max(0,pulseIn-dt);invuln=Math.max(0,invuln-dt);shake=Math.max(0,shake-dt*2);
  if(spawnIn<=0){spawn();spawnIn=CONFIG.spawnEvery*(.85+Math.random()*.45)}
  currentX=lerp(currentX,CONFIG.lanes[targetLane],1-Math.exp(-dt*11));
  player.position.x=currentX;
  craft.rotation.z=lerp(craft.rotation.z,(CONFIG.lanes[targetLane]-currentX)*-.092,1-Math.exp(-dt*9));
  craft.rotation.x=.035+Math.sin(t*7)*.018;
  craft.position.y=Math.sin(t*4.7)*.13;
  craftGlow.scale.set(4.1+Math.sin(t*15)*.55,4.1+Math.sin(t*15)*.55,1);
  const travel=CONFIG.speed*dt;
  for(const o of objects){
    o.group.position.z+=travel;
    o.age+=dt;
    if(o.type==="pickup"){o.group.rotation.y+=dt*3.7;o.group.children[0].rotation.z+=dt*.8;o.group.position.y=2.1+Math.sin(o.age*5)*.25}
    else{o.group.rotation.z=Math.sin(o.age*5)*.12;o.group.position.y=2.1+Math.sin(o.age*4)*.24}
    if(!o.hit&&Math.abs(o.group.position.z-4)<1.65&&Math.abs(o.group.position.x-currentX)<1.75){
      o.type==="pickup"?collect(o):hit();o.hit=true
    }
  }
  for(let i=objects.length-1;i>=0;i--)if(objects[i].hit||objects[i].group.position.z>17){root.remove(objects[i].group);objects.splice(i,1)}
  // City loops seamlessly along the runway
  for(const b of city){b.g.position.z+=travel*.75;if(b.g.position.z>32)b.g.position.z-=city.length/2*12.5}
  for(const laneRow of roadTiles){laneRow.position.z+=travel;if(laneRow.position.z>20)laneRow.position.z-=roadTiles.length*8}
  if(elapsed>=CONFIG.duration){end(lumens>=CONFIG.goal);if(lumens<CONFIG.goal){$("result-title").textContent="还差一点光";$("result-desc").textContent="收集 "+CONFIG.goal+" 枚光粒子即可唤醒终点。你获得了 "+lumens+" 枚。"}}
  lastHUD+=dt;if(lastHUD>.06){lastHUD=0;updateHUD()}
 }
 // Animated sky-city is alive even behind the start screen
 if(mode!=="paused"){
  player.position.y=1.55+Math.sin(t*3.7)*.08;
  if(mode==="menu")craft.rotation.z=Math.sin(t*.8)*.09;
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i];if(p.burst){p.life-=dt;p.node.position.x+=p.vx*dt;p.node.position.y+=p.vy*dt;p.node.position.z+=p.vz*dt;p.node.scale.multiplyScalar(.98);if(p.life<=0){root.remove(p.node);particles.splice(i,1)}}else{
    p.node.position.y+=Math.sin(t+p.seed)*dt*.5;p.node.position.z+=dt*p.speed;if(p.node.position.z>19)p.node.position.z=-210
   }
  }
  for(let i=beams.length-1;i>=0;i--){let b=beams[i];b.life-=dt;b.mesh.scale.setScalar(1+(1-b.life/.55)*22);b.mesh.material.opacity=Math.max(0,b.life/.55);if(b.life<=0){root.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();beams.splice(i,1)}}
 }
 const sh=active?shake*.75:0;
 const camX=mode==="menu"?Math.sin(t*.19)*2.6:currentX*.27;
 camera.position.lerp(new THREE.Vector3(camX+(Math.random()-.5)*sh,mode==="menu"?8.3:6.6+(Math.random()-.5)*sh,mode==="menu"?22:17.5),1-Math.exp(-dt*3.2));
 camera.lookAt(currentX*.31,2,-24);
}
function render(){requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.045);update(dt);renderer.render(scene,camera)}
$("start").onclick=start;$("restart").onclick=start;$("home").onclick=toMenu;$("pause").onclick=pause;$("resume").onclick=resume;$("quit").onclick=toMenu;
$("sound").onclick=()=>{soundOn=!soundOn;$("sound").textContent=soundOn?"♪":"♩";toast(soundOn?"声音已开启":"已静音")};
window.addEventListener("keydown",e=>{
 if(["ArrowLeft","ArrowRight","Space","KeyA","KeyD","Escape"].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(e.code==="ArrowLeft"||e.code==="KeyA")steer(-1);
 else if(e.code==="ArrowRight"||e.code==="KeyD")steer(1);
 else if(e.code==="Space")pulse();
 else if(e.code==="Escape"){if(mode==="playing")pause();else if(mode==="paused")resume()}
});
function bind(id,fn){const node=$(id);node.addEventListener("pointerdown",e=>{e.preventDefault();fn()})}
bind("left",()=>steer(-1));bind("right",()=>steer(1));bind("pulse",pulse);
let startTouch=null,gestureMoved=false;
$("world").addEventListener("pointerdown",e=>{startTouch={x:e.clientX,y:e.clientY,t:performance.now()};gestureMoved=false});
$("world").addEventListener("pointerup",e=>{
 if(!startTouch||mode!=="playing")return;
 const dx=e.clientX-startTouch.x,dy=e.clientY-startTouch.y;
 if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*.8){steer(dx<0?-1:1);gestureMoved=true}
 startTouch=null
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&mode==="playing")pause()});
try{init()}catch(error){console.error("LUMINA init error",error);$("fatal-message").textContent="当前浏览器无法启动3D画面："+String(error.message||error);ui.fatal.classList.remove("hidden");}
