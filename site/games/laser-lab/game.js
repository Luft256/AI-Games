import {mountShell,loadBest,saveBest} from '../../shared/game-shell.js';
import {createGameSession} from '../../shared/session-limit.js';
mountShell({title:"レーザーラボ",english:"LASER LAB",description:"鏡を回して、光を金色の受光器へ。光の線をたどり、6つの反射パズルを解こう。",accent:'#83ddd6',controls:["鏡をタップ / Enterで回転。矢印キーで選択。金色の受光器に光を導く。"]});
const $=s=>document.querySelector(s),board=$('#board'),status=$('#status');
let room=0,moves=0,finished=false,paused=false,history=[];
let cleared=loadBest('laser-lab',0);
const session=createGameSession({onExpire(){finished=true;paused=false;board.classList.remove('paused');status.textContent='時間切れ。30分になったため終了しました。やり直して再挑戦できます。';render();}});
for(let i=0;i<6;i++){const o=document.createElement('option');o.value=i;o.textContent=`${i+1} / 6`;$('#level').append(o);}
$('#best').textContent=cleared.toString(2).replaceAll('0','').length;
function begin(){return !finished&&!paused&&session.check()&&session.start();}
function checkpoint(){history.push(structuredClone(state));moves++;}
function message(text){if(!finished&&!paused)status.textContent=text;}
function win(){if(!session.finish())return;finished=true;cleared|=1<<room;saveBest('laser-lab',cleared);$('#best').textContent=cleared.toString(2).replaceAll('0','').length;status.textContent=`クリア！ ${moves}手で部屋${room+1}を解きました。${room===5?'全室終了、お見事！':'次の部屋へ進めます。'}`;$('#next').hidden=room===5;}
function reset(){session.reset();finished=false;paused=false;history=[];moves=0;$('#next').hidden=true;$('#pause').textContent='一時停止';board.classList.remove('paused');state=initial(room);status.textContent=instruction;render();}
$('#restart').onclick=reset;
$('#level').onchange=()=>{room=Number($('#level').value);reset();};
$('#next').onclick=()=>{room=(room+1)%6;$('#level').value=room;reset();};
$('#undo').onclick=()=>{if(!session.check()||finished||paused||!history.length)return;state=history.pop();moves=Math.max(0,moves-1);message('1手戻しました。');render();};
$('#pause').onclick=()=>{if(!session.check()||finished)return;paused=!paused;$('#pause').textContent=paused?'再開':'一時停止';board.classList.toggle('paused',paused);status.textContent=paused?'一時停止中。制限時間は進みます。':instruction;};
function stats(){$('#moves').textContent=moves;$('#undo').disabled=finished||paused||!history.length;}
function cellGrid(w,h,draw,play){board.style.gridTemplateColumns=`repeat(${w},1fr)`;board.replaceChildren();for(let y=0;y<h;y++)for(let x=0;x<w;x++){const b=document.createElement('button');b.type='button';b.className='cell';b.dataset.cell=`${x},${y}`;b.setAttribute('aria-label',`${y+1}行${x+1}列`);draw(b,x,y);b.onclick=()=>play(x,y);b.onkeydown=e=>{const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!dirs[e.key])return;e.preventDefault();const [dx,dy]=dirs[e.key];board.querySelector(`[data-cell="${Math.max(0,Math.min(w-1,x+dx))},${Math.max(0,Math.min(h-1,y+dy))}"]`)?.focus();};board.append(b);}stats();}
import {makeRoom,trace} from './logic.js';
const instruction='銀色の鏡を回して、光を金色の受光器「◎」へ導こう。';
let state;function initial(n){return{orientations:makeRoom(n).mirrors.map((m,i)=>m.solution^(i%2===0?1:0))};}
function render(){const r=makeRoom(room),beam=trace(r,state.orientations);cellGrid(6,6,(b,x,y)=>{const m=r.mirrors.findIndex(a=>a.x===x&&a.y===y);if(m>=0){b.textContent=state.orientations[m]?'\\':'／';b.classList.add('active');b.setAttribute('aria-label',`${y+1}行${x+1}列の鏡、${state.orientations[m]?'右下がり':'右上がり'}。回転`);}else if(x===r.source[0]&&y===r.source[1]){b.textContent='→';b.setAttribute('aria-label','光源');}else if(x===r.target[0]&&y===r.target[1]){b.textContent='◎';b.classList.add('target');b.setAttribute('aria-label','受光器');}else{b.textContent='·';b.setAttribute('aria-label',`${y+1}行${x+1}列、空きマス`);}},(x,y)=>{const m=r.mirrors.findIndex(a=>a.x===x&&a.y===y);if(m<0){message('銀色の鏡を選ぶと、反射方向を変えられます。');return;}if(!begin())return;checkpoint();state.orientations[m]^=1;const result=trace(r,state.orientations);message(result.loop?'光が輪になっています。別の鏡を回してみよう。':'光の進む方向が変わりました。線の先をたどろう。');if(result.hit)win();render();board.querySelector(`[data-cell="${x},${y}"]`)?.focus();});const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 600 600');svg.classList.add('overlay');const line=document.createElementNS(svg.namespaceURI,'polyline');line.setAttribute('points',beam.points.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke',beam.hit?'#b5f36e':'#fce780');line.setAttribute('stroke-width','6');line.setAttribute('opacity','.8');svg.append(line);board.append(svg);}
reset();
