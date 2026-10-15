import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { create, input, step, config } from './purelogic.js';
mountShell({ ...config, controls: [config.help, 'Pキー／一時停止で停止。別タブでは自動停止。再開しても30分上限は進みます。', '終了後は「もう一度」。未完了のプレイは記録しません。'] });
const $ = id => document.getElementById(id), canvas = $('game'), ctx = canvas.getContext('2d');
let s = create(), mode = 'ready', frame = null, last = null, best = loadBest(config.id);
const held = new Set();
const session = createGameSession({onExpire(){stop(); mode='timeout'; s.message='30分になったため終了。途中の記録は保存しません。'; ui(); draw();}});
function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;held.clear();}
function ui(){ $('score').textContent=Math.floor(s.score);$('best').textContent=Math.floor(best);$('meter').textContent=s.meter||'';$('status').textContent=mode==='ready'?config.help:mode==='paused'?'一時停止中。「再開」で続けます。':s.message||config.help;$('start').disabled=mode==='running';$('start').textContent=mode==='paused'?'再開':['over','timeout'].includes(mode)?'もう一度':'開始';$('pause').disabled=mode!=='running';document.querySelectorAll('[data-action]').forEach(b=>b.disabled=mode!=='running');}
function begin(){if(mode==='running')return;if(mode!=='paused'){s=create();session.reset();}if(!session.start())return;mode='running';stop();canvas.focus({preventScroll:true});step(s,0,held);ui();canvas.scrollIntoView({block:'center',behavior:'instant'});frame=requestAnimationFrame(tick);}
function pause(){if(!session.check()||mode!=='running')return;stop();mode='paused';ui();draw();}
function finish(){stop();if(!session.finish())return;mode='over';if(s.complete&&s.score>best){best=s.score;saveBest(config.id,best);}ui();draw();}
function act(action,x,y,release=false){if(!session.check()||mode!=='running')return;input(s,action,x,y,release);ui();draw();if(s.done)finish();}
function tick(t){frame=null;if(!session.check()||mode!=='running')return;const dt=last===null?0:Math.min(.04,(t-last)/1000);last=t;step(s,dt,held);ui();draw();if(s.done){finish();return;}frame=requestAnimationFrame(tick);}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function line(x,y,x2,y2,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function text(t,x,y,size=20,color='#edf6f4'){ctx.fillStyle=color;ctx.font=`700 ${size}px sans-serif`;ctx.textAlign='center';ctx.fillText(t,x,y);}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function draw(){ctx.clearRect(0,0,720,460);rect(0,0,720,460,'#182b32');render();if(mode!=='running'){rect(140,160,440,120,'#112129e8');text(mode==='ready'?'開始でプレイ':mode==='paused'?'一時停止':mode==='timeout'?'時間切れ':'プレイ終了',360,204,32);text(mode==='over'?`${Math.floor(s.score)} 点 ・もう一度で再挑戦`:'上のボタンで操作します',360,246,20);}}
$('start').onclick=begin;$('pause').onclick=pause;$('reset').onclick=()=>{stop();session.reset();s=create();mode='ready';ui();draw();};
const position=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*720/r.width,(e.clientY-r.top)*460/r.height];};
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);const [x,y]=position(e);act('pointer',x,y);});
canvas.addEventListener('pointermove',e=>{if(e.buttons){const [x,y]=position(e);act('drag',x,y);}});
canvas.addEventListener('pointerup',e=>{const [x,y]=position(e);act('release',x,y,true);});canvas.addEventListener('pointercancel',()=>{held.clear();act('cancel');});
document.querySelectorAll('[data-action]').forEach(b=>{const a=Number(b.dataset.action);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(a);act(a);});b.addEventListener('pointerup',()=>{held.delete(a);act(a,undefined,undefined,true);});b.addEventListener('pointercancel',()=>{held.delete(a);act('cancel');});b.addEventListener('click',e=>{if(e.detail===0)act(a);});});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest('button,a,input,select'))return;if(e.code==='KeyP'&&!e.repeat){e.preventDefault();mode==='running'?pause():mode==='paused'?begin():null;return;}const a=config.keys[e.code];if(a!==undefined){e.preventDefault();held.add(a);if(!e.repeat)act(a);}});
document.addEventListener('keyup',e=>{const a=config.keys[e.code];if(a!==undefined){held.delete(a);act(a,undefined,undefined,true);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>{if(mode==='running')pause();});
ui();draw();
function render(){const ns=Array.from({length:8},(_,i)=>({x:100+Math.floor(i/2)*170,y:i%2?135:340}));for(let a=0;a<8;a++)for(let b=a+1;b<8;b++){const yes=(a^1)===b||b-a===2&&a%2===(Math.floor(a/2)+s.room)%2;if(!yes)continue;const p=(s.t+(a+b)*.19+s.room*.37)%3,col=p>=2.15&&p<2.73?'#9ce3b1':p>=1.6?'#f1d48d':'#dc9292';line(ns[a].x,ns[a].y,ns[b].x,ns[b].y,'#4e6874',8);circle((ns[a].x+ns[b].x)/2,(ns[a].y+ns[b].y)/2,12,col);}for(let i=0;i<8;i++){circle(ns[i].x,ns[i].y,32,i===s.selected?'#b9b7f1':i===7?'#73ad88':'#416371');text(i===7?'EXIT':`${i+1}`,ns[i].x,ns[i].y+7,20);}const a=ns[s.dash?s.dash.from:s.node],b=ns[s.dash?s.dash.to:s.node],q=s.dash?1-s.dash.left/.23:0;circle(a.x+(b.x-a.x)*q,a.y+(b.y-a.y)*q,13,'#fff2ba');text('赤：危険 → 黄：待つ → 緑：DASH',360,430,22);}
