/* Neon City — original procedural 3D metropolis, rendered with Three.js */
(function(){
"use strict";
const T=window.THREE;
if(!T)return;
class NeonCity{
constructor(opts){
 this.opts=opts;this.physics={pause(){},resume(){}};this.city=null;this.objects=[];this.obstacles=[];this.animated=[];this.clock=new T.Clock();this.move={x:0,z:0};this.running=true;this.angle=0.7;this.zoom=1;this.pointer=null;
 const host=document.getElementById("game");
 this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
 this.renderer.setSize(host.clientWidth||innerWidth,host.clientHeight||innerHeight);
 this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
 this.renderer.outputColorSpace=T.SRGBColorSpace;
 this.renderer.toneMapping=T.ACESFilmicToneMapping;
 this.renderer.toneMappingExposure=1.65;
 this.renderer.domElement.style.touchAction="none";
 host.appendChild(this.renderer.domElement);
 this.scene=new T.Scene();this.scene.background=new T.Color(0x172c67);this.scene.fog=new T.FogExp2(0x172c67,.012);
 this.camera=new T.PerspectiveCamera(54,1,.1,270);
 this.camera.position.set(16,14,22);
 this.camera.lookAt(0,2,0);
 this.lights();
 this.installCameraControls();
 this.resize();
 addEventListener("resize",()=>this.resize());
 this.rebuild();
 this.tick();
}
lights(){
 this.ambient=new T.HemisphereLight(0xc0e9ff,0x5a4aa8,2.6);this.scene.add(this.ambient);
 this.sun=new T.DirectionalLight(0xb4dfff,2.0);this.sun.position.set(-22,42,27);this.scene.add(this.sun);
 this.pink=new T.PointLight(0xf045f5,72,42,2);this.pink.position.set(-8,11,0);this.scene.add(this.pink);
 this.cyan=new T.PointLight(0x40fff0,88,48,2);this.cyan.position.set(10,12,-8);this.scene.add(this.cyan);
 this.gold=new T.PointLight(0xffdb75,42,26,2);this.gold.position.set(2,8,14);this.scene.add(this.gold);
}
mat(color,em=0,level=0,metal=.28,rough=.38,opts={}){
 return new T.MeshStandardMaterial({color,emissive:em,emissiveIntensity:level,metalness:metal,roughness:rough,...opts})
}
box(w,h,d,x,y,z,mat,parent=this.city){
 const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);parent.add(o);return o
}
glowSprite(color,scale=4,parent=this.city){
 const canvas=document.createElement("canvas");canvas.width=64;canvas.height=64;
 const ctx=canvas.getContext("2d");let gr=ctx.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,"rgba(255,255,255,.9)");gr.addColorStop(.2,color);gr.addColorStop(1,"rgba(0,0,0,0)");
 ctx.fillStyle=gr;ctx.fillRect(0,0,64,64);
 const texture=new T.CanvasTexture(canvas);
 const s=new T.Sprite(new T.SpriteMaterial({map:texture,color:0xffffff,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
 s.scale.set(scale,scale,1);parent.add(s);return s
}
sign(text,color="#62faff",width=7,height=2){
 const can=document.createElement("canvas");can.width=512;can.height=128;
 let c=can.getContext("2d");c.fillStyle="#102246";c.fillRect(0,0,512,128);
 c.fillStyle=color;c.fillRect(0,0,512,5);c.fillRect(0,123,512,5);
 c.fillStyle="#ffffff";c.font="bold 49px monospace";c.textAlign="center";c.textBaseline="middle";c.shadowBlur=22;c.shadowColor=color;c.fillText(text,256,66);
 const tex=new T.CanvasTexture(can);tex.colorSpace=T.SRGBColorSpace;
 const plane=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true}));
 return plane
}
disposeCity(){
 if(!this.city)return;
 this.scene.remove(this.city);
 this.city.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}});
 this.city=null
}
rebuild(){
 this.disposeCity();
 this.city=new T.Group();this.scene.add(this.city);
 this.objects=[];this.obstacles=[];this.animated=[];
 const z=this.opts.getState().zone||0;
 this.zone=z;
 const hue=[
 [0x38fcf2,0xf44cfa,0xf5d16b],
 [0x55f7fc,0x7783ff,0xff5ca8],
 [0x54eafa,0xeeaaff,0xfcc88b],
 [0xff63de,0x62ffff,0xffbd60],
 [0xffc867,0x67ffef,0xff6df2]
 ][z];
 this.scheme=hue;
 this.scene.background.setHex([0x20357b,0x203a72,0x2b2c7b,0x422b79,0x344579][z]);
 this.scene.fog.color.copy(this.scene.background);this.scene.fog.density=.011;
 const ground=this.mat(0x1c2e58,0x1c3471,.3,.52,.21);
 this.box(112,.8,112,0,-.58,0,ground);
 const lane=this.mat(0x172346,0x203968,.6,.32,.17);
 this.box(18,.06,112,0,-.13,0,lane);
 this.box(112,.06,15,0,-.11,0,lane);
 const pave=this.mat(0x3c4e7b,0x162d65,.45,.3,.25);
 for(const x of [-11,11]){this.box(4,.18,112,x,-.06,0,pave);this.box(.2,.06,112,x+(x<0?2:-2),.08,0,this.mat(hue[0],hue[0],2.1))}
 for(const zz of [-9,9]){this.box(112,.18,2,0,-.07,zz,pave);this.box(112,.04,.2,0,.05,zz+(zz<0?1:-1),this.mat(hue[1],hue[1],2.2))}
 const line=this.mat(0xb5faff,0x49f4ff,1.8,0,.4);
 for(let i=-52;i<=52;i+=8){this.box(.2,.045,3,0,-.065,i,line);this.box(3,.05,.2,i,-.05,0,line)}
 const cityInfo=[
 ["LEXICON LAB","语汇实验室"],["LOGIC LINK","逻辑天桥"],["DATA PORT","数据空港"],
 ["IDEA FORUM","观点街区"],["NEXUS TOWER","语言核心"]
 ][z];
 const tall=this.mat(0x314a76,0x21345f,.35,.55,.22);
 const glass=this.mat(0x4e75a3,0x174477,.48,.75,.14,{transparent:false});
 const glowM=[this.mat(hue[0],hue[0],2.8,0,.28),this.mat(hue[1],hue[1],3,0,.28),this.mat(hue[2],hue[2],2.4,0,.28)];
 const windowM=[this.mat(0xb7fafa,0x63dfff,1.8,0,.35),this.mat(0xf5b3fa,0xee61ff,1.5,0,.4),this.mat(0xffe2ad,0xffc369,1.4,0,.4)];
 const build=(x,zz,w,h,d,seed)=>{
   const group=new T.Group();group.position.set(x,0,zz);this.city.add(group);
   this.box(w,h,d,0,h/2,0,(seed%3===0?glass:tall),group);
   this.box(w+.35,.35,d+.4,0,h+.15,0,glowM[seed%3],group);
   this.box(w*.81,.1,d+.46,0,h*.32,0,glowM[(seed+1)%3],group);
   for(let y=2;y<h-1;y+=1.75)for(let xx=-w/2+.9;xx<w/2-.5;xx+=1.35){
     if((Math.floor(y*3+xx*7+seed)%7)===0)continue;
     const win=this.box(.67,.85,.06,xx,y,d/2+.04,windowM[(Math.floor(xx+y+seed*2)+100)%3],group);
     if((Math.floor(xx*5+y+seed)%13)===0)win.visible=false
   }
   for(let y=2;y<h-1;y+=2.15)for(let zz2=-d/2+.8;zz2<d/2-.5;zz2+=1.4){
     this.box(.07,.72,.7,w/2+.05,y,zz2,windowM[(seed+Math.floor(y))%3],group)
   }
   if(seed%2===0){const s=this.sign(["NOVA","LIGHT","METRO","AETHER","VOLT"][seed%5],["#61ffff","#ff8cef","#ffd884"][seed%3],w*.86,1.35);s.position.set(0,h*.66,d/2+.18);group.add(s)}
   this.obstacles.push({x,z:zz,w:w+.5,d:d+.5});
   return group
 };
 for(let i=0;i<26;i++){
   const ring=i%4, side=i%2===0?-1:1;
   let x=side*(19+(i*7)%26),zz=-51+(i*17)%103;
   if(Math.abs(zz)<14&&Math.abs(x)<28)continue;
   const h=10+(i*13)%32,w=5+(i*3)%6,d=5+(i*5)%7;
   build(x,zz,w,h,d,i)
 }
 for(let i=0;i<12;i++){const s=i%2===0?-1:1;let zz=-47+i*8;build(s*(38+i%3*5),zz,5,12+i%5*3,6,32+i)}
 // Main skyline sculpture
 const landmark=build(-29,-29,10,47,10,65);landmark.rotation.y=.07;
 let hdr=this.sign(cityInfo[0],"#7ffaff",9,2.1);hdr.position.set(-29,37,-22.9);this.city.add(hdr);
 // Overhead rail bridges
 for(const bz of [-22,24]){
    this.box(89,.62,3,0,9,bz,this.mat(0x324875,0x334c99,.65));
    this.box(89,.15,.2,0,9.55,bz-1.4,glowM[0]);
    this.box(89,.15,.2,0,9.55,bz+1.4,glowM[1]);
    for(let x=-43;x<44;x+=14)this.box(1.05,9,1.05,x,4.35,bz,this.mat(0x33466c))
 }
 // Street kiosks and lampposts
 for(let i=0;i<22;i++){
  let x=(i%2===0?-13.2:13.2),zz=-48+i*4.65;
  this.box(.26,5.6,.26,x,2.7,zz,glowM[i%3]);
  this.box(1.2,.28,.9,x,5.7,zz,glowM[i%3]);
  const s=this.glowSprite(["#53fff2","#ff55f3","#ffe79a"][i%3],5);s.position.set(x,5.6,zz)
 }
 for(let i=0;i<7;i++){
   let zz=-44+i*14,car=this.box(2.5,.85,4.3,i%2===0?-3.7:4,.63,zz,this.mat(i%2?0x7148ae:0x4478b1,0x2259b8,.3));
   this.box(2.1,.65,2.3,car.position.x,1.35,zz,this.mat(0x1b3359,0x164777,.4));
   let sl=this.glowSprite(i%2?"#ff44c9":"#54faff",3);sl.position.set(car.position.x,1.6,zz);this.animated.push({mesh:car,light:sl,original:zz,speed:((i%2)?-1:1)*(.5+i%4*.23)})
 }
 // Street hologram fountains
 for(const pos of [[-15,-15],[15,16]]){
  const ring=new T.Mesh(new T.TorusGeometry(2.4,.13,8,46),glowM[1]);ring.rotation.x=-Math.PI/2;ring.position.set(pos[0],.25,pos[1]);this.city.add(ring);this.animated.push({ring,phase:pos[0]})
 }
 const stations=[
  {x:-7.5,z:-7.2,kind:"quiz",type:this.opts.getZone().types[0],label:"挑战站 · A"},
  {x:7.5,z:5.8,kind:"quiz",type:this.opts.getZone().types[1],label:"挑战站 · B"},
  {x:-8,z:10.2,kind:"npc",label:this.opts.getZone().npc},
  {x:0,z:-17,kind:"gate",label:"区域传送门"}
 ];
 stations.forEach((s,i)=>{
   const c=new T.Group();c.position.set(s.x,0,s.z);this.city.add(c);
   if(s.kind==="npc"){
     this.human(c,0,0,0,hue[2]);
     const lit=this.glowSprite("#ffd993",4,c);lit.position.set(0,3,0);
   }else{
     const edge=this.mat(0x233258,hue[(i+1)%3],.9);
     this.box(2.3,.55,2.3,0,.27,0,edge,c);
     this.box(1.45,2.5,1.35,0,1.8,0,glowM[i%3],c);
     const orb=new T.Mesh(new T.IcosahedronGeometry(s.kind==="gate"?1.5:.85,1),new T.MeshBasicMaterial({color:hue[i%3],transparent:true,opacity:.86,wireframe:true}));orb.position.y=3.9;c.add(orb);
     this.animated.push({orb,phase:i});
     const halo=this.glowSprite(["#60fff5","#ff7cef","#ffe29c"][i%3],7,c);halo.position.set(0,3.5,0);
     const board=this.sign(s.kind==="gate"?"NEXT DISTRICT":s.type.toUpperCase(),"#e8faff",4.6,1.15);board.position.set(0,4.9,0);c.add(board)
   }
   s.obj=c;this.objects.push(s)
 });
 // Neon rings embedded on the plaza
 for(let i=0;i<14;i++){
   let theta=i*Math.PI*2/14,x=Math.cos(theta)*13.4,zz=Math.sin(theta)*13.4;
   let p=this.box(.18,.05,2,x,.13,zz,glowM[i%3]);p.rotation.y=-theta;
 }
 let p=this.opts.getState().position;
 this.avatar=new T.Group();this.scene.add(this.avatar);this.city.add(this.avatar);
 this.human(this.avatar,0,0,0,0x3cfbf0,true);
 this.avatar.position.set((p?.x??0),0,(p?.z??16));
 this.playerHalo=this.glowSprite("#64ffff",5,this.avatar);this.playerHalo.position.set(0,2.2,0);
 this.hud=cityInfo[1];this.updateGate();this.followTarget=new T.Vector3(this.avatar.position.x,0,this.avatar.position.z);
}
human(g,x,y,z,accent,player=false){
 const suit=this.mat(player?0x254ca4:0x684787,accent,.55,.2,.44);
 const skin=this.mat(0xd2e8fb,0x6380b7,.1,.1,.6);
 const led=this.mat(accent,accent,3,.1,.2);
 this.box(.88,1.75,.55,x,y+1.7,z,suit,g);
 this.box(.67,.67,.64,x,y+2.91,z,skin,g);
 this.box(.43,.16,.18,x,y+2.9,z+.36,led,g);
 this.box(.32,1.08,.3,x-.24,y+.51,z,suit,g);
 this.box(.32,1.08,.3,x+.24,y+.51,z,suit,g);
 this.box(.3,1.45,.36,x-.66,y+1.63,z,suit,g);
 this.box(.3,1.45,.36,x+.66,y+1.63,z,suit,g);
 this.box(.75,.12,.12,x,y+1.35,z+.33,led,g);
}
updateGate(){
 const o=this.objects.find(x=>x.kind==="gate");
 if(!o)return;
 const on=this.opts.isDone(this.zone);o.obj.scale.setScalar(on?1.17:.88);
}
nearest(){
 let target=null,d=6;
 for(const o of this.objects){let n=Math.hypot(this.avatar.position.x-o.x,this.avatar.position.z-o.z);if(n<d){d=n;target=o}}
 return target
}
interact(){if(!this.opts.isActive())return;const target=this.nearest();if(target)this.opts.onInteract(target);else this.opts.onNote("靠近发光建筑，点击「互动」")}
installCameraControls(){
 const c=this.renderer.domElement;let pointers=new Map(),initialDist=0;
 c.addEventListener("pointerdown",e=>{if(!this.opts.isActive())return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const pts=[...pointers.values()];initialDist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)||1;}c.setPointerCapture(e.pointerId)});
 c.addEventListener("pointermove",e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);let dx=e.clientX-prev.x;if(pointers.size===1)this.angle+=dx*.0045;else if(pointers.size===2){pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...pointers.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)||1;this.zoom=Math.min(1.35,Math.max(.65,this.zoom+(dist-initialDist)*.002));initialDist=dist}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY})});
 for(const ev of ["pointerup","pointercancel","lostpointercapture"])c.addEventListener(ev,e=>pointers.delete(e.pointerId));
 c.addEventListener("wheel",e=>{if(!this.opts.isActive())return;e.preventDefault();this.zoom=Math.min(1.35,Math.max(.65,this.zoom-e.deltaY*.0008))},{passive:false});
 c.addEventListener("click",e=>{if(!this.opts.isActive())return;const r=c.getBoundingClientRect();const ray=new T.Raycaster(),mouse=new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));ray.setFromCamera(mouse,this.camera);for(const o of this.objects){const hits=ray.intersectObject(o.obj,true);if(hits.length&&Math.hypot(this.avatar.position.x-o.x,this.avatar.position.z-o.z)<6){this.opts.onInteract(o);break}}});
}
resize(){
 const host=document.getElementById("game"),w=Math.max(1,host.clientWidth||innerWidth),h=Math.max(1,host.clientHeight||innerHeight);
 this.renderer.setSize(w,h,false);
 this.camera.aspect=w/h;
 this.camera.fov=w<h?69:54;
 this.camera.updateProjectionMatrix()
}
tick(){
 if(!this.running)return;
 requestAnimationFrame(()=>this.tick());
 const dt=Math.min(this.clock.getDelta(),.05),tm=this.clock.elapsedTime;
 if(this.opts.isActive()){
  const mx=this.opts.getAxis("right")-this.opts.getAxis("left"),mz=this.opts.getAxis("down")-this.opts.getAxis("up");
  const k=Math.hypot(mx,mz)||1;let nx=this.avatar.position.x+mx/k*dt*8.7,nz=this.avatar.position.z+mz/k*dt*8.7;
  nx=Math.max(-51,Math.min(51,nx));nz=Math.max(-51,Math.min(51,nz));
  if(!this.obstacles.some(b=>Math.abs(nx-b.x)<b.w/2+.7&&Math.abs(nz-b.z)<b.d/2+.7)){
   this.avatar.position.set(nx,Math.sin(tm*13)*(mx||mz?.05:0),nz);
  }
  if(mx||mz)this.avatar.rotation.y=Math.atan2(mx,mz);
  if(!this.lastPersist||tm-this.lastPersist>3){this.lastPersist=tm;this.opts.onPosition(this.avatar.position.x,this.avatar.position.z)}
  const o=this.nearest(),n=document.getElementById("nearby");n.classList.toggle("hidden",!o);if(o)n.textContent="✦ "+o.label+" · E / 互动";
 }
 this.followTarget.lerp(new T.Vector3(this.avatar.position.x,1.6,this.avatar.position.z),.07);
 const dist=(innerWidth<innerHeight?23:18)/this.zoom;
 const desired=new T.Vector3(this.followTarget.x+Math.sin(this.angle)*dist,this.followTarget.y+dist*.66,this.followTarget.z+Math.cos(this.angle)*dist);
 this.camera.position.lerp(desired,.09);this.camera.lookAt(this.followTarget);
 if(!this.opts.getState().lowEffects)for(const a of this.animated){
  if(a.orb){a.orb.rotation.y+=dt*.75;a.orb.position.y=3.9+Math.sin(tm*1.4+a.phase)*.3}
  if(a.ring){a.ring.rotation.z+=dt*.45}
  if(a.mesh){a.mesh.position.z=a.original+Math.sin(tm*.28+a.original)*5;a.light.position.z=a.mesh.position.z}
 }
 this.renderer.render(this.scene,this.camera);
}
}
window.NeonCity=NeonCity;
})();