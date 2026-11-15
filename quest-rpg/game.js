/* IELTS QUEST original Phaser 3 exploration game */
(function(){
"use strict";
const el=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const storage="ielts-quest-rpg-v1";
const fresh=()=>({zone:0,unlocked:0,completed:[],answered:[],wrong:[],shards:0,zoneAnswers:{},stations:{},chinese:true,mute:false,lowEffects:false,visits:0,position:null});
let data=fresh();try{data={...data,...JSON.parse(localStorage.getItem(storage)||"{}")}}catch(e){}
const save=()=>{try{localStorage.setItem(storage,JSON.stringify(data))}catch(e){console.warn(e)}};
const zones=[
{cn:"霓虹语汇广场",en:"NEON LEXICON PLAZA",intro:"“城市的文字灯牌断电了。去两座不同的实验站重新激活它们。”",npc:"信号工程师 · 艾琳",types:["gap","choice"],shade:0x283b86},
{cn:"高速逻辑天桥",en:"LOGIC SKYWAY",intro:"“连接意义与因果，才能重新启动这座空中交通枢纽。”",npc:"导航工程师 · 洛文",types:["match","order"],shade:0x163b70},
{cn:"数据光谱空港",en:"DATA SKYPORT",intro:"“航线、趋势、比率，都隐藏在这片空港的数据流里。”",npc:"数据分析师 · 米拉",types:["chart","overview"],shade:0x303481},
{cn:"全息观点街区",en:"IDEA DISTRICT",intro:"“不同观点在街头碰撞。用可靠的论证把信号校准。”",npc:"街区主持人 · 伊索",types:["keyword","edit"],shade:0x56348a},
{cn:"城市语言核心",en:"NEXUS TOWER",intro:"“两项最终挑战，即可启动整座霓虹都市的语言核心。”",npc:"核心管理员 · NOVA",types:["choice","overview"],shade:0x295573}
];
const questions=window.QUEST_QUESTIONS||[];
const names={gap:"失落的词语",match:"逻辑连接",order:"论证建造",chart:"数据观测",overview:"Overview挑战",keyword:"审题侦探",edit:"段落修复",choice:"综合写作"};
const state={modal:false,quiz:null,locked:false,selected:[],links:[],pending:null};
let activeScene=null,game=null,lastToast=null;
let keys={left:0,right:0,up:0,down:0},touch={left:0,right:0,up:0,down:0};
const visible=()=>el("menu").classList.contains("hidden");
const chapterList=z=>questions.filter(q=>z===4?true:q.chapter===z||(z===0&&q.type==="choice"));
const chapterCount=z=>(data.stations?.[z]||[]).length;
const done=z=>data.completed.includes(z);
function note(t){el("toast").textContent=t;el("toast").classList.remove("hidden");clearTimeout(lastToast);lastToast=setTimeout(()=>el("toast").classList.add("hidden"),2600)}
function hud(){el("zone-label").textContent=("0"+(data.zone+1)).slice(-2)+" / "+zones[data.zone].cn;el("shard-count").textContent="✧ "+data.shards;el("progress-count").textContent=data.completed.length+" / 5 区域";el("quest-tip").textContent=done(data.zone)?"已点亮本区域 · 可继续挑战更多题目":"完成两处不同挑战站 · "+chapterCount(data.zone)+" / 2，即可探索下一街区"}
function mainMenu(show){el("menu").classList.toggle("hidden",!show);["hud","quest-tip"].forEach(id=>el(id).classList.toggle("hidden",show));el("touch-controls").classList.toggle("hidden",show||!matchMedia("(pointer:coarse)").matches);if(show)el("nearby").classList.add("hidden")}
function panel(title,sub,body){return '<div class="panel-eyebrow">'+esc(sub)+'</div><h2 class="panel-title">'+esc(title)+'</h2>'+body}
function open(body){state.modal=true;keys={left:0,right:0,up:0,down:0};el("panel-content").innerHTML=body;el("modal-root").classList.remove("hidden");if(activeScene)activeScene.physics.pause()}
function close(){state.modal=false;state.quiz=null;el("modal-root").classList.add("hidden");if(activeScene)activeScene.physics.resume();hud()}
el("modal-close").onclick=close;el("scrim").onclick=close;
function enter(z,position){if(z>data.unlocked){note("该区域尚未解锁");return}close();data.zone=z;data.position=position||null;data.visits++;save();if(activeScene)activeScene.rebuild();hud();note("✦ "+zones[z].cn)}
function npc(){let z=zones[data.zone];open(panel(z.npc,z.en,'<p class="panel-desc">'+esc(z.intro)+'</p><p class="panel-desc">体验不同互动：语汇、逻辑、数据或观点。每一处挑战站只需完成一道题，两个不同站点完成后即可自由前往下一街区。</p><div class="stat-row"><span class="stat">已修复站点 '+chapterCount(data.zone)+' / 2</span><span class="stat">已收集 ✧ '+data.shards+'</span></div><button id="npc-close" class="mini-btn main">继续探索</button>'));el("npc-close").onclick=close}
function gate(){let z=data.zone;if(!done(z)){open(panel("尚未打开的城门","GATE LOCKED",'<p class="panel-desc">还需要完成 '+Math.max(0,2-chapterCount(z))+' 道新挑战。探索附近的词语装置吧。</p>'));return}if(z===4){finish();return}open(panel("下一段旅程","GATE UNLOCKED",'<p class="panel-desc">你已经点亮了「'+esc(zones[z].cn)+'」。</p><button id="travel" class="mini-btn main">前往 '+esc(zones[z+1].cn)+' →</button>'));el("travel").onclick=()=>enter(z+1)}
function unlock(){let z=data.zone;if(!done(z)&&chapterCount(z)>=2){data.completed.push(z);data.unlocked=Math.max(data.unlocked,Math.min(4,z+1));data.shards+=5;save();hud();if(activeScene)activeScene.updateGate();return true}return false}
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
function judge(ok){if(state.locked)return;state.locked=true;let q=state.quiz;if(ok){if(!data.answered.includes(q.id)){data.answered.push(q.id);data.shards+=2}data.zoneAnswers=data.zoneAnswers||{};data.zoneAnswers[data.zone]=data.zoneAnswers[data.zone]||[];if(!data.zoneAnswers[data.zone].includes(q.id))data.zoneAnswers[data.zone].push(q.id);data.stations=data.stations||{};data.stations[data.zone]=data.stations[data.zone]||[];if(!data.stations[data.zone].includes(q.type))data.stations[data.zone].push(q.type);data.wrong=data.wrong.filter(id=>id!==q.id)}else if(!data.wrong.includes(q.id))data.wrong.push(q.id);save();
const correct=q.type==="order"?q.answer.join(" → "):q.type==="keyword"?q.required.join("、"):q.type==="match"?q.pairs.map(p=>p.join(" → ")).join("；"):q.answer;
document.querySelectorAll("[data-opt]").forEach(b=>{b.disabled=true;if(b.textContent.trim()===q.answer)b.classList.add("selected")});
el("panel-content").insertAdjacentHTML("beforeend",'<div class="feedback '+(ok?"":"bad")+'"><strong>'+(ok?"✦ 找回词语碎片":"◇ 这一题需要再检查")+'</strong><div>'+esc(q.explain)+'</div>'+(ok?"":'<div class="answer-small">正确答案：'+esc(correct)+'</div>')+'</div>');
let changed=ok?unlock():false;
el("panel-content").insertAdjacentHTML("beforeend",(changed?'<p class="feedback">✦ 这一处区域已修复！前往发光的大门解锁新章节。</p>':"")+'<button id="leave" class="mini-btn main">返回城市，继续探索</button><button id="more" class="mini-btn">额外训练（自选）</button>');
el("more").onclick=()=>{let next=selectQuestion(null);if(next)displayQuiz(next);else{close();note("所有新题已完成！")}};el("leave").onclick=close;hud()}
function journal(){open(panel("旅人手账","JOURNAL",'<div class="stat-row"><span class="stat">已完成 '+data.answered.length+' / '+questions.length+'</span><span class="stat">✧ '+data.shards+'</span><span class="stat">错题 '+data.wrong.length+'</span></div>'+zones.map((z,i)=>'<div class="flow-note" style="margin:7px 0">'+esc(z.cn)+' · '+(done(i)?"✦ 已点亮":chapterCount(i)+" / 2")+'</div>').join("")+'<button id="review" class="mini-btn main">复习错题</button><button id="language" class="mini-btn">中文提示：'+(data.chinese?"开":"关")+'</button>'));el("review").onclick=()=>{if(!data.wrong.length){note("目前没有错题");return}let q=questions.find(x=>x.id===data.wrong[0]);if(q)displayQuiz(q)};el("language").onclick=()=>{data.chinese=!data.chinese;save();journal()}}
function map(){open(panel("迷雾地图","CITY ATLAS",'<p class="panel-desc">每个区域有两个不同的挑战站。各完成一道短练习，就能进入下一街区。</p><div class="map-list">'+zones.map((z,i)=>'<button class="zone-option '+(i>data.unlocked?"locked":"")+'" data-zone="'+i+'" '+(i>data.unlocked?"disabled":"")+'><strong>'+esc(("0"+(i+1)).slice(-2)+" · "+z.cn)+'</strong><span>'+z.en+'</span><span>'+(done(i)?"✦ 已点亮":i>data.unlocked?"◇ 尚未解锁":chapterCount(i)+" / 2")+'</span></button>').join("")+'</div>'));document.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>enter(+b.dataset.zone))}
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
if(!window.THREE||!window.NeonCity){const d=document.createElement("div");d.style.cssText="position:fixed;z-index:100;inset:0;background:#101c4a;color:#f6e6ff;display:grid;place-items:center;padding:32px;text-align:center";d.textContent="3D城市引擎暂时无法加载。请保持网络连接，刷新页面后重试。";document.body.append(d);return}
try{
activeScene=new window.NeonCity({
 getState:()=>data,
 getZone:()=>zones[data.zone],
 isDone:done,
 isActive:()=>visible()&&!state.modal,
 getAxis:(axis)=>Number(Boolean(keys[axis]||touch[axis])),
 onInteract:o=>{if(o.kind==="npc")npc();else if(o.kind==="gate")gate();else if(o.kind==="quiz")startQuiz(o.type)},
 onNote:note,
 onPosition:(x,z)=>{data.position={x:Math.round(x*10)/10,z:Math.round(z*10)/10};save()}
});
}catch(e){console.error(e);note("3D场景启动遇到问题，请刷新页面")}
hud();
console.info("IELTS QUEST QUESTION VALIDATION:",window.QUEST_BANK_META);
})();