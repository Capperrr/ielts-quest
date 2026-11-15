/* IELTS QUEST original Phaser 3 exploration game */
(function(){
"use strict";
const el=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const storage="ielts-quest-rpg-v1";
const fresh=()=>({zone:0,unlocked:0,completed:[],answered:[],wrong:[],shards:0,zoneAnswers:{},chinese:true,mute:false,lowEffects:false,visits:0,position:null});
let data=fresh();try{data={...data,...JSON.parse(localStorage.getItem(storage)||"{}")}}catch(e){}
const save=()=>{try{localStorage.setItem(storage,JSON.stringify(data))}catch(e){console.warn(e)}};
const zones=[
{cn:"遗忘的图书馆",en:"FORGOTTEN LIBRARY",intro:"“词语没有消失，只是在等待有人重新理解。”",npc:"守书人 · 艾琳",types:["gap"],shade:0x15243b},
{cn:"逻辑之桥",en:"BRIDGE OF REASONS",intro:"“好的观点，需要足够清晰的理由才能抵达彼岸。”",npc:"修桥师 · 洛文",types:["match","order"],shade:0x152a34},
{cn:"数据观测站",en:"DATA OBSERVATORY",intro:"“先看到整体趋势，才能讲清每个数字。”",npc:"观测员 · 米拉",types:["chart","overview"],shade:0x1a263d},
{cn:"观点议会",en:"CHAMBER OF VOICES",intro:"“判断来自推理，也需要聆听不同立场。”",npc:"辩论者 · 伊索",types:["keyword","edit"],shade:0x272137},
{cn:"修辞高塔",en:"TOWER OF WORDS",intro:"“带着收集的词语，把整座城市重新点亮吧。”",npc:"守塔人",types:["choice","gap","match","order","chart","overview","keyword","edit"],shade:0x233039}
];
const questions=window.QUEST_QUESTIONS||[];
const names={gap:"失落的词语",match:"逻辑连接",order:"论证建造",chart:"数据观测",overview:"Overview挑战",keyword:"审题侦探",edit:"段落修复",choice:"综合写作"};
const state={modal:false,quiz:null,locked:false,selected:[],links:[],pending:null};
let activeScene=null,game=null,lastToast=null;
let keys={left:0,right:0,up:0,down:0},touch={left:0,right:0,up:0,down:0};
const visible=()=>el("menu").classList.contains("hidden");
const chapterList=z=>questions.filter(q=>z===4?true:q.chapter===z);
const chapterCount=z=>(data.zoneAnswers&&data.zoneAnswers[z]?data.zoneAnswers[z].length:data.answered.filter(id=>chapterList(z).some(q=>q.id===id)).length);
const done=z=>data.completed.includes(z);
function note(t){el("toast").textContent=t;el("toast").classList.remove("hidden");clearTimeout(lastToast);lastToast=setTimeout(()=>el("toast").classList.add("hidden"),2600)}
function hud(){el("zone-label").textContent=("0"+(data.zone+1)).slice(-2)+" / "+zones[data.zone].cn;el("shard-count").textContent="✧ "+data.shards;el("progress-count").textContent=data.completed.length+" / 5 区域";el("quest-tip").textContent=done(data.zone)?"已点亮本区域 · 可继续挑战更多题目":"完成 "+chapterCount(data.zone)+" / 4 道新挑战，点亮下一站"}
function mainMenu(show){el("menu").classList.toggle("hidden",!show);["hud","quest-tip"].forEach(id=>el(id).classList.toggle("hidden",show));el("touch-controls").classList.toggle("hidden",show||!matchMedia("(pointer:coarse)").matches);if(show)el("nearby").classList.add("hidden")}
function panel(title,sub,body){return '<div class="panel-eyebrow">'+esc(sub)+'</div><h2 class="panel-title">'+esc(title)+'</h2>'+body}
function open(body){state.modal=true;keys={left:0,right:0,up:0,down:0};el("panel-content").innerHTML=body;el("modal-root").classList.remove("hidden");if(activeScene)activeScene.physics.pause()}
function close(){state.modal=false;state.quiz=null;el("modal-root").classList.add("hidden");if(activeScene)activeScene.physics.resume();hud()}
el("modal-close").onclick=close;el("scrim").onclick=close;
function enter(z,position){if(z>data.unlocked){note("该区域尚未解锁");return}close();data.zone=z;data.position=position||null;data.visits++;save();if(activeScene)activeScene.rebuild();hud();note("✦ "+zones[z].cn)}
function npc(){let z=zones[data.zone];open(panel(z.npc,z.en,'<p class="panel-desc">'+esc(z.intro)+'</p><p class="panel-desc">走近发光装置，完成英语写作挑战，修复区域内的语言核心。</p><div class="stat-row"><span class="stat">正确完成 '+chapterCount(data.zone)+' / 4</span><span class="stat">已收集 ✧ '+data.shards+'</span></div><button id="npc-close" class="mini-btn main">继续探索</button>'));el("npc-close").onclick=close}
function gate(){let z=data.zone;if(!done(z)){open(panel("尚未打开的城门","GATE LOCKED",'<p class="panel-desc">还需要完成 '+Math.max(0,4-chapterCount(z))+' 道新挑战。探索附近的词语装置吧。</p>'));return}if(z===4){finish();return}open(panel("下一段旅程","GATE UNLOCKED",'<p class="panel-desc">你已经点亮了「'+esc(zones[z].cn)+'」。</p><button id="travel" class="mini-btn main">前往 '+esc(zones[z+1].cn)+' →</button>'));el("travel").onclick=()=>enter(z+1)}
function unlock(){let z=data.zone;if(!done(z)&&chapterCount(z)>=4){data.completed.push(z);data.unlocked=Math.max(data.unlocked,Math.min(4,z+1));data.shards+=5;save();hud();if(activeScene)activeScene.updateGate();return true}return false}
function finish(){close();el("credits").classList.remove("hidden")}
el("credits-btn").onclick=()=>{el("credits").classList.add("hidden");enter(4)};
function selectQuestion(type){let list=chapterList(data.zone).filter(q=>(!type||q.type===type)&&!data.answered.includes(q.id));if(!list.length)return null;return list[(data.shards+list.length*3)%list.length]}
function startQuiz(type){let q=selectQuestion(type);if(!q){open(panel("已完成的装置","ALL QUESTIONS COMPLETE",'<p class="panel-desc">这个装置的新题已经全部完成。可前往其他装置，或在手账中复习错题。</p>'));return}displayQuiz(q)}
function shuffle(a,seed){let arr=a.slice();for(let i=arr.length-1;i>0;i--){let j=(seed+i*17)%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function options(items){return '<div class="options">'+items.map((x,i)=>'<button class="option" data-opt="'+i+'">'+esc(x)+'</button>').join("")+'</div>'}
function chart(q){let v=q.values,max=Math.max(...v),barGap=390/v.length,svg='<svg class="chart-svg" viewBox="0 0 460 220" role="img" aria-label="'+esc(q.translation)+'"><line x1="40" y1="190" x2="450" y2="190"></line><line x1="40" y1="18" x2="40" y2="190"></line>';for(let t=0;t<=4;t++){let y=190-40*t;svg+='<line x1="40" y1="'+y+'" x2="450" y2="'+y+'" opacity=".3"></line><text x="4" y="'+(y+4)+'">'+Math.round(max*t/4)+'</text>'}v.forEach((val,i)=>{let x=50+i*barGap,h=val/max*151;svg+='<rect class="bar" x="'+x+'" y="'+(190-h)+'" width="'+Math.min(47,barGap*.6)+'" height="'+h+'"></rect><text x="'+x+'" y="'+(182-h)+'">'+val+'</text><text x="'+x+'" y="208">'+(i+1)+'</text>'});return svg+"</svg>"}
function displayQuiz(q){state.quiz=q;state.locked=false;state.selected=[];state.links=[];state.pending=null;let body=panel(names[q.type],"THE LOST WORDS · "+data.answered.length+" / "+questions.length,'<div class="progressbar"><div style="width:'+(100*data.answered.length/Math.max(1,questions.length))+'%"></div></div><div class="stat-row"><span class="stat">'+esc(zones[data.zone].cn)+'</span><span class="stat">完成获得 ✧ 2</span></div><div class="question">'+esc(q.prompt).replaceAll("\n","<br>")+'</div>');
if(q.type==="chart")body+=chart(q);
if(data.chinese)body+='<div class="answer-small">'+esc(q.translation)+'</div>';
if(q.type==="order")body+='<p class="divider-title">依次点击句子，建立论证逻辑</p><div id="ordered" class="chip-area"></div><div id="source" class="chip-area"></div><button id="order-reset" class="mini-btn">重置</button><button id="order-submit" class="mini-btn main">确认顺序</button>';
else if(q.type==="keyword")body+='<p class="divider-title">多选所有核心审题要点</p><div id="multi" class="options"></div><button id="multi-submit" class="mini-btn main">确认选择</button>';
else if(q.type==="match")body+='<p class="divider-title">先点击左侧表达，再选择右侧含义</p><div id="matches" class="map-list"></div><button id="match-reset" class="mini-btn">重置配对</button>';
else body+=options(shuffle(q.options,q.prompt.length));
open(body);
if(q.type==="order")drawOrder();
else if(q.type==="keyword")drawMulti();
else if(q.type==="match")drawMatches();
else document.querySelectorAll("[data-opt]").forEach(b=>b.onclick=()=>{if(!state.locked)judge(b.textContent.trim()===q.answer)});
}
function drawOrder(){const q=state.quiz,rest=shuffle(q.pieces,q.prompt.length).filter(x=>!state.selected.includes(x));el("ordered").innerHTML=state.selected.map((x,i)=>'<button class="chip selected" data-remove="'+i+'">'+esc(x)+'</button>').join("")||'<span class="answer-small">选择下方句子</span>';el("source").innerHTML=rest.map((x,i)=>'<button class="chip" data-add="'+i+'">'+esc(x)+'</button>').join("");document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{state.selected.push(rest[+b.dataset.add]);drawOrder()});document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state.selected.splice(+b.dataset.remove,1);drawOrder()});el("order-reset").onclick=()=>{state.selected=[];drawOrder()};el("order-submit").onclick=()=>{if(state.selected.length!==q.answer.length){note("请排列全部句子");return}judge(state.selected.every((v,i)=>v===q.answer[i]))}}
function drawMulti(){const q=state.quiz,items=shuffle(q.options,q.prompt.length);el("multi").innerHTML=items.map((s,i)=>'<button class="option '+(state.selected.includes(s)?"selected":"")+'" data-multi="'+i+'">'+esc(s)+'</button>').join("");document.querySelectorAll("[data-multi]").forEach(b=>b.onclick=()=>{let s=items[+b.dataset.multi];state.selected=state.selected.includes(s)?state.selected.filter(x=>x!==s):[...state.selected,s];drawMulti()});el("multi-submit").onclick=()=>{if(!state.selected.length){note("请选择所有核心要点");return}judge(state.selected.length===q.required.length&&state.selected.every(x=>q.required.includes(x)))}}
function drawMatches(){let q=state.quiz,left=q.pairs.map(p=>p[0]),right=shuffle(q.pairs.map(p=>p[1]),q.prompt.length);el("matches").innerHTML='<div><p class="divider-title">表达</p>'+left.map((s,i)=>'<button class="chip '+(state.pending===i?"selected":"")+'" style="display:block;width:100%;margin-bottom:8px" data-l="'+i+'">'+esc(s)+(state.links.some(p=>p[0]===i)?" ✓":"")+'</button>').join("")+'</div><div><p class="divider-title">对应含义</p>'+right.map((s,i)=>'<button class="chip" style="display:block;width:100%;margin-bottom:8px" data-r="'+i+'">'+esc(s)+(state.links.some(p=>p[1]===i)?" ✓":"")+'</button>').join("")+'</div>';
document.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{const i=+b.dataset.l;if(state.links.some(p=>p[0]===i))return;state.pending=i;drawMatches()});document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{const j=+b.dataset.r;if(state.pending===null){note("先选择左侧表达");return}if(state.links.some(p=>p[1]===j))return;state.links.push([state.pending,j]);state.pending=null;if(state.links.length===q.pairs.length)judge(state.links.every(p=>q.pairs[p[0]][1]===right[p[1]]));else drawMatches()});el("match-reset").onclick=()=>{state.links=[];state.pending=null;drawMatches()}}
function judge(ok){if(state.locked)return;state.locked=true;let q=state.quiz;if(ok){if(!data.answered.includes(q.id)){data.answered.push(q.id);data.shards+=2}data.zoneAnswers=data.zoneAnswers||{};data.zoneAnswers[data.zone]=data.zoneAnswers[data.zone]||[];if(!data.zoneAnswers[data.zone].includes(q.id))data.zoneAnswers[data.zone].push(q.id);data.wrong=data.wrong.filter(id=>id!==q.id)}else if(!data.wrong.includes(q.id))data.wrong.push(q.id);save();
const correct=q.type==="order"?q.answer.join(" → "):q.type==="keyword"?q.required.join("、"):q.type==="match"?q.pairs.map(p=>p.join(" → ")).join("；"):q.answer;
document.querySelectorAll("[data-opt]").forEach(b=>{b.disabled=true;if(b.textContent.trim()===q.answer)b.classList.add("selected")});
el("panel-content").insertAdjacentHTML("beforeend",'<div class="feedback '+(ok?"":"bad")+'"><strong>'+(ok?"✦ 找回词语碎片":"◇ 这一题需要再检查")+'</strong><div>'+esc(q.explain)+'</div>'+(ok?"":'<div class="answer-small">正确答案：'+esc(correct)+'</div>')+'</div>');
let changed=ok?unlock():false;
el("panel-content").insertAdjacentHTML("beforeend",(changed?'<p class="feedback">✦ 这一处区域已修复！前往发光的大门解锁新章节。</p>':"")+'<button id="more" class="mini-btn main">下一道挑战</button><button id="leave" class="mini-btn">返回城市</button>');
el("more").onclick=()=>{let next=selectQuestion(null);if(next)displayQuiz(next);else{close();note("所有新题已完成！")}};el("leave").onclick=close;hud()}
function journal(){open(panel("旅人手账","JOURNAL",'<div class="stat-row"><span class="stat">已完成 '+data.answered.length+' / '+questions.length+'</span><span class="stat">✧ '+data.shards+'</span><span class="stat">错题 '+data.wrong.length+'</span></div>'+zones.map((z,i)=>'<div class="flow-note" style="margin:7px 0">'+esc(z.cn)+' · '+(done(i)?"✦ 已点亮":chapterCount(i)+" / 4")+'</div>').join("")+'<button id="review" class="mini-btn main">复习错题</button><button id="language" class="mini-btn">中文提示：'+(data.chinese?"开":"关")+'</button>'));el("review").onclick=()=>{if(!data.wrong.length){note("目前没有错题");return}let q=questions.find(x=>x.id===data.wrong[0]);if(q)displayQuiz(q)};el("language").onclick=()=>{data.chinese=!data.chinese;save();journal()}}
function map(){open(panel("迷雾地图","CITY ATLAS",'<p class="panel-desc">修复每一处区域，逐步照亮整座城市。</p><div class="map-list">'+zones.map((z,i)=>'<button class="zone-option '+(i>data.unlocked?"locked":"")+'" data-zone="'+i+'" '+(i>data.unlocked?"disabled":"")+'><strong>'+esc(("0"+(i+1)).slice(-2)+" · "+z.cn)+'</strong><span>'+z.en+'</span><span>'+(done(i)?"✦ 已点亮":i>data.unlocked?"◇ 尚未解锁":chapterCount(i)+" / 4")+'</span></button>').join("")+'</div>'));document.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>enter(+b.dataset.zone))}
function settings(){open(panel("旅途设置","SETTINGS",'<p class="panel-desc">进度保存在本机浏览器；清除网站数据会丢失记录。</p><button class="mini-btn" id="lang">中文提示：'+(data.chinese?"开":"关")+'</button><button class="mini-btn" id="fx">环境效果：'+(data.lowEffects?"低":"正常")+'</button><button class="mini-btn" id="mute">静音：'+(data.mute?"开":"关")+'</button><hr class="panel-rule"><button class="mini-btn" id="menu-back">返回主菜单</button><button class="mini-btn" id="erase">清除本机进度</button>'));el("lang").onclick=()=>{data.chinese=!data.chinese;save();settings()};el("fx").onclick=()=>{data.lowEffects=!data.lowEffects;save();settings()};el("mute").onclick=()=>{data.mute=!data.mute;save();settings()};el("menu-back").onclick=()=>{close();mainMenu(true)};el("erase").onclick=()=>{if(confirm("确定清除全部本机游戏进度吗？")){data=fresh();save();close();mainMenu(true);hud()}}}
el("map-btn").onclick=map;el("journal-btn").onclick=journal;el("settings-btn").onclick=settings;
el("start-btn").onclick=()=>{data=fresh();save();mainMenu(false);enter(0)};
el("continue-btn").onclick=()=>{mainMenu(false);enter(data.zone,data.position)};
el("continue-btn").style.display=data.visits?"block":"none";
const codes={ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down"};
addEventListener("keydown",e=>{if(codes[e.code]){keys[codes[e.code]]=1;if(visible())e.preventDefault()}if(e.repeat)return;if((e.code==="KeyE"||e.code==="Space")&&visible()&&!state.modal){activeScene?.interact();e.preventDefault()}if(e.code==="Escape"){if(state.modal)close();else if(visible())settings()}});
addEventListener("keyup",e=>{if(codes[e.code])keys[codes[e.code]]=0});
addEventListener("blur",()=>{keys={left:0,right:0,up:0,down:0};touch={left:0,right:0,up:0,down:0}});
document.querySelectorAll("[data-move]").forEach(btn=>{const k=btn.dataset.move;btn.addEventListener("pointerdown",e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);touch[k]=1;btn.classList.add("active")});["pointerup","pointercancel","lostpointercapture"].forEach(name=>btn.addEventListener(name,()=>{touch[k]=0;btn.classList.remove("active")}))});
el("touch-interact").addEventListener("pointerdown",e=>{e.preventDefault();if(!state.modal)activeScene?.interact()});
if(!window.Phaser){const d=document.createElement("div");d.style.cssText="position:fixed;z-index:100;inset:0;background:#08101c;color:#edc98c;display:grid;place-items:center;padding:32px;text-align:center";d.textContent="Phaser 游戏引擎未加载。请连接互联网并刷新页面。";document.body.append(d);return}
const P=Phaser;
class World extends P.Scene{
constructor(){super("World");this.objects=[]}
create(){activeScene=this;this.texturesBuild();this.rebuild();this.scale.on("resize",this.resizeCamera,this);this.input.on("pointerdown",pointer=>{if(state.modal||!visible())return;const w=this.cameras.main.getWorldPoint(pointer.x,pointer.y);const o=this.objects.find(x=>P.Math.Distance.Between(x.x,x.y,w.x,w.y)<55);if(o&&this.player&&P.Math.Distance.Between(this.player.x,this.player.y,o.x,o.y)<105)this.action(o)})}
texturesBuild(){const g=this.make.graphics({x:0,y:0});const build=(id,w,h,draw)=>{g.clear();draw(g);g.generateTexture(id,w,h)};
build("floor",48,48,g=>{g.fillStyle(0x233248);g.fillRect(0,0,48,48);g.lineStyle(1,0x385067,.65);g.strokeRect(0,0,48,48);g.fillStyle(0x33445a);g.fillRect(9,27,3,2)});
build("traveller",36,38,g=>{g.fillStyle(0x050a13);g.fillRect(13,5,9,11);g.fillStyle(0x1e2c43);g.fillRect(11,16,14,14);g.fillStyle(0x07101d);g.fillRect(11,28,6,8);g.fillRect(19,28,6,8);g.fillStyle(0x8094a4);g.fillRect(15,10,5,3);g.fillStyle(0xeac58d);g.fillRect(25,19,5,7)});
build("friend",36,38,g=>{g.fillStyle(0x141622);g.fillRect(12,5,12,12);g.fillStyle(0x62738d);g.fillRect(10,16,15,15);g.fillStyle(0x111926);g.fillRect(11,28,5,8);g.fillRect(20,28,5,8);g.fillStyle(0xd2ad8f);g.fillRect(15,11,5,3)});
build("house",128,120,g=>{g.fillStyle(0x27384b);g.fillRect(8,28,110,90);g.fillStyle(0x3e5365);g.fillTriangle(0,29,64,0,127,29);for(let i=0;i<2;i++){g.fillStyle(0x0c1a2e);g.fillRect(19+i*59,48,37,41);g.fillStyle(0xd1b87e);g.fillRect(23+i*59,52,28,32)}g.fillStyle(0x111b2b);g.fillRect(50,92,26,26)});
build("books",140,136,g=>{g.fillStyle(0x182841);g.fillRect(0,0,140,136);g.fillStyle(0x344963);g.fillRect(6,9,128,13);g.fillStyle(0x0c192b);g.fillRect(10,26,120,100);for(let y=0;y<3;y++){g.fillStyle(0x9a7a69);g.fillRect(12,37+y*29,116,4);for(let x=0;x<7;x++){g.fillStyle([0x5e7790,0x7b8590,0x8c7080,0xad9074][(x+y)%4]);g.fillRect(15+x*16,43+y*29,12,19)}}});
build("tower",130,180,g=>{g.fillStyle(0x27384e);g.fillRect(17,24,95,154);g.fillStyle(0x151f32);g.fillRect(10,17,110,14);g.fillRect(28,0,75,19);g.fillStyle(0xc0ad89);g.fillCircle(65,62,27);g.fillStyle(0x19273d);g.fillCircle(65,62,20);g.lineStyle(3,0xe6cfa0);g.lineBetween(65,62,65,48);g.lineBetween(65,62,79,69)});
build("gate",116,120,g=>{g.fillStyle(0x3a516d);g.fillRect(0,0,23,120);g.fillRect(93,0,23,120);g.fillRect(0,0,116,16);g.fillStyle(0x13243a);g.fillRect(24,18,69,102);g.lineStyle(3,0xa9b9bb);g.strokeRect(30,24,55,89)});
g.destroy()}
rebuild(){this.children.removeAll(true);this.physics.world.colliders.removeAll();this.objects=[];let z=data.zone,zone=zones[z];this.cameras.main.setBackgroundColor(zone.shade);this.physics.world.setBounds(0,0,1550,1060);
this.add.tileSprite(0,0,1550,1060,"floor").setOrigin(0).setTint([0x8fa2bc,0x8ba9ad,0xa39db9,0xad93ae,0xa8aca5][z]).setDepth(-10);
let edge=this.add.graphics().setDepth(-8);edge.fillStyle(0x0a1425,.7);edge.fillRect(0,0,1550,95);edge.fillRect(0,972,1550,88);edge.fillRect(0,0,96,1060);edge.fillRect(1454,0,96,1060);edge.lineStyle(3,0x496783);edge.strokeRect(95,95,1359,877);
for(let i=0;i<55;i++){let x=135+(i*239)%1280,y=132+(i*337)%790;edge.fillStyle(0xb5c8cf,.12);edge.fillRect(x,y,2,2)}
const cob=this.add.graphics().setDepth(-5);cob.fillStyle(0x1c3044,.85);cob.fillRoundedRect(385,398,782,240,14);cob.lineStyle(3,0x5b7891,.55);cob.strokeRoundedRect(385,398,782,240,14);
this.add.text(775,315,zone.en,{fontFamily:"monospace",fontSize:"25px",color:"#7c9ab0"}).setOrigin(.5).setDepth(-4);
this.add.text(775,353,zone.cn,{fontFamily:"sans-serif",fontSize:"20px",color:"#cdd6da"}).setOrigin(.5).setDepth(-4);
const houses=[[265,215,"house"],[1250,214,z===2?"tower":"house"],[250,817,"books"],[1240,807,z===3?"tower":"house"]];
houses.forEach(([x,y,id])=>{let sprite=this.add.image(x,y,id).setScale(1.65).setDepth(-3);let block=this.add.rectangle(x,y+20,sprite.displayWidth*.8,sprite.displayHeight*.64,0x000000,0);this.physics.add.existing(block,true);this.objects.push({x,y,kind:"decor",body:block})});
let objects=[{x:630,y:520,kind:"npc",label:zone.npc},{x:962,y:515,kind:"gate",label:"章节之门"},{x:490,y:431,kind:"quiz",label:"挑战装置 A",type:zone.types[0]},{x:775,y:596,kind:"quiz",label:"挑战装置 B",type:zone.types[Math.min(1,zone.types.length-1)]},{x:1060,y:431,kind:"quiz",label:"挑战装置 C",type:zone.types[Math.min(2,zone.types.length-1)]}];
objects.forEach(o=>{if(o.kind==="npc")o.sprite=this.add.image(o.x,o.y,"friend").setScale(1.6).setDepth(4);else if(o.kind==="gate")o.sprite=this.add.image(o.x,o.y,"gate").setScale(.85).setDepth(3);else{let c=this.add.container(o.x,o.y).setDepth(4);let ped=this.add.ellipse(0,21,65,20,0x070f1c,.7),b=this.add.rectangle(0,0,44,51,0x243c52).setStrokeStyle(2,0xd4b789),star=this.add.text(0,-5,"✧",{fontFamily:"sans-serif",fontSize:"32px",color:"#ffdda4"}).setOrigin(.5);c.add([ped,b,star]);this.tweens.add({targets:star,y:-11,duration:1300,yoyo:true,repeat:-1});o.sprite=c}
this.objects.push(o);this.add.text(o.x,o.y-62,o.label,{fontFamily:"sans-serif",fontSize:"12px",color:"#dce6ec",stroke:"#0c1728",strokeThickness:4}).setOrigin(.5).setDepth(6)});
for(let i=0;i<7;i++){let x=375+i*132,y=i%2?680:360;let p=this.add.container(x,y).setDepth(-1);p.add([this.add.rectangle(0,-19,5,50,0x445f71),this.add.rectangle(0,-45,19,16,0xe1c590),this.add.circle(0,-44,28,0xedc885,.075)]);if(!data.lowEffects)this.tweens.add({targets:p,alpha:.7,duration:850+i*80,yoyo:true,repeat:-1})}
this.player=this.physics.add.sprite(data.position?.x||770,data.position?.y||770,"traveller").setScale(1.65).setDepth(9).setCollideWorldBounds(true);this.player.body.setSize(19,22).setOffset(9,14);this.player.body.setMaxVelocity(190,190);this.player.body.setDrag(750,750);
this.objects.filter(o=>o.body).forEach(o=>this.physics.add.collider(this.player,o.body));
this.shadow=this.add.ellipse(this.player.x,this.player.y+30,40,12,0x000000,.5).setDepth(8);
this.glow=this.add.circle(this.player.x+25,this.player.y,65,0xf2bc75,.075).setBlendMode(P.BlendModes.ADD).setDepth(7);
this.cameras.main.setBounds(0,0,1550,1060);this.cameras.main.startFollow(this.player,true,.08,.08);this.cameras.main.setRoundPixels(true);this.resizeCamera(this.scale.gameSize);this.updateGate()}
updateGate(){let g=this.objects.find(o=>o.kind==="gate");if(g)g.sprite.setAlpha(done(data.zone)?1:.45)}
resizeCamera(s){let w=s.width||this.scale.width,h=s.height||this.scale.height;this.cameras.main.setZoom(P.Math.Clamp(Math.min(w/960,h/620),.5,1.5))}
nearest(){if(!this.player)return null;let best=null,dist=115;for(let o of this.objects){if(o.kind==="decor")continue;let d=P.Math.Distance.Between(this.player.x,this.player.y,o.x,o.y);if(d<dist){dist=d;best=o}}return best}
interact(){if(state.modal||!visible())return;let o=this.nearest();if(!o){note("靠近闪烁的装置或人物再互动");return}this.action(o)}
action(o){if(o.kind==="npc")npc();else if(o.kind==="gate")gate();else if(o.kind==="quiz")startQuiz(o.type)}
update(_,dt){if(state.modal||!visible()||!this.player)return;let x=(keys.right||touch.right?1:0)-(keys.left||touch.left?1:0),y=(keys.down||touch.down?1:0)-(keys.up||touch.up?1:0),len=Math.hypot(x,y)||1;this.player.setVelocity(x/len*187,y/len*187);if(x)this.player.setFlipX(x<0);this.player.setTint(x||y?0xffffff:0xd7e1f2);this.shadow.setPosition(this.player.x,this.player.y+30);this.glow.setPosition(this.player.x+25,this.player.y);let n=this.nearest();el("nearby").classList.toggle("hidden",!n);if(n)el("nearby").textContent="✦ "+n.label+" · 点击互动 / E";this.counter=(this.counter||0)+dt;if(this.counter>2000){this.counter=0;data.position={x:Math.round(this.player.x),y:Math.round(this.player.y)};save()}}
}
try{game=new P.Game({type:P.AUTO,parent:"game",backgroundColor:"#08101b",width:window.innerWidth,height:window.innerHeight,render:{pixelArt:true,antialias:false},scale:{mode:P.Scale.RESIZE,autoCenter:P.Scale.CENTER_BOTH,width:window.innerWidth,height:window.innerHeight},physics:{default:"arcade",arcade:{debug:false}},scene:[World]})}catch(e){console.error(e);note("游戏启动失败，请刷新页面")}
hud();
console.info("IELTS QUEST QUESTION VALIDATION:",window.QUEST_BANK_META);
})();