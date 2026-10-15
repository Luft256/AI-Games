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
import { gates } from './purelogic.js';
function render(){const offset=s.x-160;for(const x of [220,580,950]){const sx=x-offset;rect(sx,40,135,370,'#bd7d3e30');for(let y=70;y<400;y+=65)text('↑',sx+65,y,35,'#f2bb86');}for(let i=0;i<3;i++){const g=gates[i],x=g.x-offset;if(x<-50||x>770)continue;rect(x-14,25,28,385,i<s.gate?'#46635d':'#78949a');for(const slot of g.slots){rect(x-17,slot.lo,34,slot.hi-slot.lo,'#15353d');line(x-20,slot.lo,x+20,slot.lo,'#a4dce5',4);line(x-20,slot.hi,x+20,slot.hi,'#a4dce5',4);text(`+${slot.bonus}`,x+52,(slot.lo+slot.hi)/2+6,18,'#a4dce5');}text(`門${i+1}`,x,22,19);}ctx.fillStyle='#385457';ctx.beginPath();ctx.moveTo(0,460);for(let px=0;px<=720;px+=12)ctx.lineTo(px,415-40*Math.pow(Math.sin((px+offset)/160),2));ctx.lineTo(720,460);ctx.fill();if(1350-offset<720){line(1350-offset,40,1350-offset,400,'#a8eab8',5);text('GOAL',1350-offset,70,24);}ctx.save();ctx.translate(160,s.y);ctx.rotate(s.manual>0?s.pitch*.15:0);ctx.fillStyle='#f2bb86';ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(-25,-18);ctx.lineTo(-6,0);ctx.lineTo(-25,18);ctx.closePath();ctx.fill();ctx.restore();if(s.x>780&&s.x<910)text('↓ 下降風：次の門へ高度を調整',360,60,23,'#acd5e6');text('青い開口を選ぼう：気流は高度と体力を回復',360,440,18);}
