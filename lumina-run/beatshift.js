/* LUMINA 3.0 BEATSHIFT · original, deterministic beatmaps & Web Audio compositions.
 * Every audio event is scheduled against AudioContext.currentTime.
 * No copyrighted music samples or external audio files are used. */
export const TRACKS=[
  {title:"AURORA DRIVE",genre:"SYNTHWAVE",bpm:100,key:"C minor",desc:"一束光，穿过清晨的合成器海洋。",accent:"#7cfff6"},
  {title:"SKYLINE ZERO",genre:"FUTURE BASS",bpm:128,key:"F minor",desc:"悬浮列车的灯光，跟随重拍一同奔跑。",accent:"#ff9de8"},
  {title:"NEXUS OVERDRIVE",genre:"DRUM & BASS",bpm:160,key:"G minor",desc:"高速鼓点穿过核心塔，启动最后的能量潮汐。",accent:"#ffdc8c"}
];
const midi=n=>440*Math.pow(2,(n-69)/12);
const CHORDS=[
 [[48,51,55,60],[44,48,51,56],[51,55,58,63],[46,50,53,58]],
 [[53,56,60,65],[49,53,56,61],[44,48,51,56],[51,55,58,63]],
 [[55,58,62,67],[51,55,58,63],[46,50,53,58],[53,57,60,65]]
];
const BASS=[
 [36,32,39,34],
 [41,37,32,39],
 [43,39,34,41]
];
const MELODY=[
 [0,7,12,7,10,7,5,3,0,3,7,10,12,10,7,5],
 [0,7,10,12,7,5,3,0,3,7,12,15,12,10,7,3],
 [0,3,7,12,10,7,15,12,7,10,3,0,12,15,17,10]
];
function rng(seed){let v=seed|0;return()=>{v=(Math.imul(1664525,v)+1013904223)|0;return(v>>>0)/4294967296}}
export function makeBeatmap(stage,duration){
 const info=TRACKS[stage],beat=60/info.bpm,n=Math.floor((duration-1.5)/beat),rand=rng(1247+stage*703);
 const notes=[];
 for(let i=5;i<n;i++){
  const bar=Math.floor(i/4),inBar=i%4;
  let play=stage===0?inBar===0||inBar===2||((bar%3===1)&&inBar===1):
            stage===1?inBar!==3||((bar%2===1)&&inBar===3):
                      inBar!==3||bar%2===0;
  if(!play)continue;
  // Each bar uses one main lane with variation: the player has time to move.
  let lane=(bar*2+Math.floor(inBar/2)+Math.floor(rand()*2))%3;
  if(stage===0&&inBar===2)lane=(bar*2)%3;
  if(stage>0&&i%8===7)lane=(lane+1)%3;
  let type=stage>=1&&i%16===8?"hold":"tap";
  let length=type==="hold"?beat*(stage===1?1.65:1.55):0;
  // No simultaneous impossible note on same beat; obstacles are separately telegraphed.
  notes.push({id:"b"+i,type,lane,time:Number((i*beat).toFixed(6)),duration:length,beat:i,state:"pending"});
  if(stage>=1&&i%16===4){
    let safe=(lane+1)%3;
    notes.push({id:"h"+i,type:"hazard",lane:safe,time:Number(((i+.5)*beat).toFixed(6)),duration:0,beat:i,state:"pending"})
  }
 }
 return notes.sort((a,b)=>a.time-b.time)
}
export function judgeDelta(delta){
 const d=Math.abs(delta);
 return d<=.09?"PERFECT":d<=.19?"GREAT":d<=.30?"GOOD":null
}
export class BeatshiftAudio{
 constructor(){this.ctx=null;this.bus=null;this.music=null;this.fx=null;this.stage=0;this.enabled=true;this.live=false;this.paused=false;this.fever=false;this.tempo=100;this.seconds=60/100;this.startAt=0;this.nextStep=0;this.pauseAt=0;this.startedPerf=0;this.fallback=0;this.noiseBuffer=null;this.volume=.78}
 ensure(){
  if(this.ctx)return true;
  try{
   const A=window.AudioContext||window.webkitAudioContext;
   if(!A)return false;
   const c=this.ctx=new A({latencyHint:"interactive"});
   this.bus=c.createGain();this.bus.gain.value=this.volume;
   const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=16;comp.ratio.value=4;
   comp.attack.value=.006;comp.release.value=.18;
   this.bus.connect(comp);comp.connect(c.destination);
   this.music=c.createGain();this.music.gain.value=.72;this.music.connect(this.bus);
   this.fx=c.createGain();this.fx.gain.value=.9;this.fx.connect(this.bus);
   const len=Math.floor(c.sampleRate*.36),noise=c.createBuffer(1,len,c.sampleRate),p=noise.getChannelData(0);
   let r=rng(1861);for(let i=0;i<len;i++)p[i]=r()*2-1;
   this.noiseBuffer=noise;
   return true
  }catch(e){console.warn("Web Audio unavailable",e);return false}
 }
 start(stage=0){
  this.stop();
  this.stage=stage;this.tempo=TRACKS[stage].bpm;this.seconds=60/this.tempo;
  this.nextStep=0;this.live=true;this.paused=false;this.fever=false;
  this.startedPerf=performance.now()/1000;
  if(this.ensure()){
   this.ctx.resume().catch(()=>{});
   this.startAt=this.ctx.currentTime+.12;
   this.bus.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.03)
  }else this.startAt=0
 }
 time(){
  if(!this.live)return 0;
  if(this.paused)return this.pauseAt;
  if(this.ctx)return Math.max(0,this.ctx.currentTime-this.startAt);
  return Math.max(0,performance.now()/1000-this.startedPerf)
 }
 pause(){
  if(!this.live||this.paused)return;
  this.pauseAt=this.time();this.paused=true;
  if(this.ctx)this.ctx.suspend().catch(()=>{})
 }
 resume(){
  if(!this.live||!this.paused)return;
  this.paused=false;
  if(this.ctx)this.ctx.resume().catch(()=>{});
  else this.startedPerf=performance.now()/1000-this.pauseAt
 }
 stop(){
  this.live=false;this.paused=false;this.fever=false;
  if(this.ctx){const t=this.ctx.currentTime;this.music?.gain.setTargetAtTime(0,t,.045)}
 }
 mute(muted){this.enabled=!muted;if(this.ctx)this.bus.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.04)}
 setFever(on){this.fever=!!on}
 phase(at=this.time()){return (Math.max(0,at)/this.seconds)%1}
 offset(at=this.time()){const x=at/this.seconds;return(Math.abs(x-Math.round(x)))*this.seconds}
 tick(){
  if(!this.ctx||!this.live||this.paused)return;
  const horizon=this.ctx.currentTime+.19;
  while(this.startAt+this.nextStep*this.seconds/2<horizon){
   const step=this.nextStep++,t=this.startAt+step*this.seconds/2;
   if(t<this.ctx.currentTime-.035)continue;
   this.sequence(step,t)
  }
 }
 synth(freq,when,duration=.24,shape="sawtooth",vol=.07,filter=1500,attack=.009,bus=this.music){
  if(!this.ctx)return;
  const c=this.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),env=c.createGain();
  o.type=shape;o.frequency.setValueAtTime(freq,when);
  f.type="lowpass";f.frequency.value=filter;f.Q.value=.3;
  env.gain.setValueAtTime(.0001,when);
  env.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),when+Math.max(.003,attack));
  env.gain.exponentialRampToValueAtTime(.0001,when+Math.max(attack+.03,duration));
  o.connect(f);f.connect(env);env.connect(bus);
  o.start(when);o.stop(when+duration+.02)
 }
 drum(type,when,scale=1){
  if(!this.ctx)return;
  const c=this.ctx,t=when;
  if(type==="kick"){
   const osc=c.createOscillator(),v=c.createGain();
   osc.type="sine";osc.frequency.setValueAtTime(164,t);
   osc.frequency.exponentialRampToValueAtTime(this.stage===2?48:54,t+.12);
   v.gain.setValueAtTime(.0001,t);v.gain.linearRampToValueAtTime(.22*scale,t+.006);
   v.gain.exponentialRampToValueAtTime(.0001,t+.24);
   osc.connect(v);v.connect(this.music);osc.start(t);osc.stop(t+.27);
  }else{
   const src=c.createBufferSource(),f=c.createBiquadFilter(),env=c.createGain();
   src.buffer=this.noiseBuffer;
   f.type=type==="snare"?"bandpass":"highpass";
   f.frequency.value=type==="snare"?1900:6000;
   f.Q.value=type==="snare"?.8:.2;
   const duration=type==="snare"?.14:.055;
   env.gain.setValueAtTime(Math.max(.0001,scale*(type==="snare"?.1:.043)),t);
   env.gain.exponentialRampToValueAtTime(.0001,t+duration);
   src.connect(f);f.connect(env);env.connect(this.music);
   src.start(t);src.stop(t+duration+.02)
  }
 }
 sequence(step,t){
  const beat=Math.floor(step/2),half=step%2,bar=Math.floor(beat/4)%4,beatInBar=beat%4;
  const bass=BASS[this.stage],root=bass[bar];
  const stage=this.stage;
  if(half===0){
   if(stage===2||beatInBar===0||beatInBar===2)this.drum("kick",t,stage===2?.76:1);
   if(beatInBar===1||beatInBar===3)this.drum("snare",t,stage===2?.7:1);
   if(beatInBar===0){
    const chord=CHORDS[stage][bar];
    // Wide, gentle synthesizer pads in the background.
    chord.forEach((n,i)=>this.synth(midi(n),t,this.seconds*3.7,i%2?"triangle":"sine",.017,900,.07))
   }
   this.synth(midi(root+(beatInBar===3?7:0)),t,this.seconds*(stage===2?.45:.7),"sawtooth",stage===2?.07:.065,450,.008);
   let note=MELODY[stage][beat%16];
   if((beatInBar%2===0)||stage===2){
    this.synth(midi(root+24+note),t,this.seconds*.68,"triangle",this.fever?.083:.049,1750,.012)
   }
  }
  if(stage>=1||half===1)this.drum("hat",t,half===1?.72:.44);
  if(stage===2&&half===1&&beatInBar===3){
   this.synth(midi(root+36+MELODY[stage][(beat+1)%16]),t,this.seconds*.32,"square",.028,2500,.004)
  }
  if(this.fever&&half===1){
   this.synth(midi(root+36+[0,7,12,7][beatInBar]),t,this.seconds*.36,"triangle",.052,3000,.005)
  }
 }
 effect(kind="hit",rating="PERFECT"){
  if(!this.ctx||!this.enabled)return;
  const t=this.ctx.currentTime+.004;
  if(kind==="hit"){
   const f=rating==="PERFECT"?1100:rating==="GREAT"?910:720;
   this.synth(f,t,.13,"sine",.085,3400,.003,this.fx);
   this.synth(f*1.5,t+.045,.13,"triangle",.04,2600,.005,this.fx)
  }else if(kind==="miss"){this.synth(205,t,.2,"sawtooth",.072,420,.004,this.fx)}
  else if(kind==="fever"){
   [660,880,1320].forEach((f,i)=>this.synth(f,t+i*.065,.22,"triangle",.11,4000,.005,this.fx))
  }else if(kind==="drop"){
   this.synth(170,t,.4,"sawtooth",.12,1000,.005,this.fx);
   this.drum("kick",t,1.2);
   this.synth(660,t+.08,.38,"triangle",.12,3900,.012,this.fx)
  }
 }
}
