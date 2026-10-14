import {mountShell,loadBest,saveBest} from '../../shared/game-shell.js';
import {createGameSession} from '../../shared/session-limit.js';
mountShell({title:"ポケット倉庫",english:"POCKET SOKOBAN",description:"押す前に、帰り道を考えよう。すべての箱を金色の置き場へ運ぶ6つの小さな倉庫。",accent:'#edbf85',controls:["矢印 / WASD / ボタンで移動。箱を◎へ押す。箱は引けません。1手戻すで修正。"]});
const $=s=>document.querySelector(s),board=$('#board'),status=$('#status');
let room=0,moves=0,efforts=0,finished=false,paused=false,history=[];
let cleared=loadBest('pocket-sokoban',0);
const session=createGameSession({onExpire(){finished=true;paused=false;board.classList.remove('paused');status.textContent='時間切れ。30分になったため終了しました。やり直して再挑戦できます。';render();}});
for(let i=0;i<6;i++){const o=document.createElement('option');o.value=i;o.textContent=`${i+1} / 6`;$('#level').append(o);}
$('#best').textContent=cleared.toString(2).replaceAll('0','').length;
function begin(){return !finished&&!paused&&session.check()&&session.start();}
function checkpoint(){history.push(structuredClone(state));moves++;efforts++;}
function message(text){if(!finished&&!paused)status.textContent=text;}
function win(){if(!session.finish())return;finished=true;const key=`pocket-sokoban-room-${room}`,old=loadBest(key,0);if(old===0||efforts<old)saveBest(key,efforts);cleared|=1<<room;saveBest('pocket-sokoban',cleared);$('#best').textContent=cleared.toString(2).replaceAll('0','').length;status.textContent=`クリア！ ${moves}手で部屋${room+1}を解きました。${(cleared&63)===63?'全室終了、お見事！':room===5?'ほかの部屋も選んで挑戦できます。':'次の部屋へ進めます。'}`;$('#next').hidden=room===5;}
function reset(){session.reset();finished=false;paused=false;history=[];moves=0;efforts=0;$('#next').hidden=true;$('#pause').textContent='一時停止';board.classList.remove('paused');state=initial(room);status.textContent=instruction;render();}
$('#restart').onclick=reset;
$('#level').onchange=()=>{room=Number($('#level').value);reset();};
$('#next').onclick=()=>{room=(room+1)%6;$('#level').value=room;reset();};
$('#undo').onclick=()=>{if(!session.check()||finished||paused||!history.length)return;state=history.pop();moves=Math.max(0,moves-1);efforts++;message('1手戻しました。');render();};
$('#pause').onclick=()=>{if(!session.check()||finished)return;paused=!paused;$('#pause').textContent=paused?'再開':'一時停止';board.classList.toggle('paused',paused);status.textContent=paused?'一時停止中。制限時間は進みます。':instruction;};
const recordNote=document.createElement('p');recordNote.className='instructions';recordNote.id='record-note';$('#extra').after(recordNote);function stats(){const previous=loadBest(`pocket-sokoban-room-${room}`,0);recordNote.textContent=`この部屋のベスト ${previous||'—'}操作 · 今回 ${efforts}操作（戻すも含む）。少ない操作で再挑戦！`;$('#moves').textContent=moves;$('#undo').disabled=finished||paused||!history.length;}
function cellGrid(w,h,draw,play){const focused=document.activeElement?.dataset.cell;board.style.gridTemplateColumns=`repeat(${w},1fr)`;board.replaceChildren();for(let y=0;y<h;y++)for(let x=0;x<w;x++){const b=document.createElement('button');b.type='button';b.className='cell';b.dataset.cell=`${x},${y}`;b.setAttribute('aria-label',`${y+1}行${x+1}列`);draw(b,x,y);b.onclick=()=>play(x,y);b.onkeydown=e=>{const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!dirs[e.key])return;e.preventDefault();const [dx,dy]=dirs[e.key];board.querySelector(`[data-cell="${Math.max(0,Math.min(w-1,x+dx))},${Math.max(0,Math.min(h-1,y+dy))}"]`)?.focus();};board.append(b);}stats();if(focused)board.querySelector(`[data-cell="${focused}"]`)?.focus();}
import {parse,move,solved,dirs} from './logic.js';
const instruction='すべての箱「▣」を金色の置き場「◎」へ。箱は押せますが、引けません。';let state;function initial(n){const l=parse(n);return{player:l.player,boxes:l.boxes,pushes:0};}
function step(d){if(!begin())return;const l=parse(room),n=move(l,state,d);if(!n){message('その方向には進めません。押す先と自分の立ち位置を確認しよう。');return;}checkpoint();state=n;if(solved(l,state))win();else message(`箱を押した回数 ${state.pushes}。角に押すと戻せないので気をつけよう。`);render();}
for(let d=0;d<4;d++){const b=document.createElement('button');b.className='button';b.textContent=['↑','→','↓','←'][d];b.dataset.dir=d;b.setAttribute('aria-label',['上へ移動','右へ移動','下へ移動','左へ移動'][d]);b.onclick=()=>step(d);$('#extra').append(b);}
board.addEventListener('keydown',e=>{const d={ArrowUp:0,w:0,ArrowRight:1,d:1,ArrowDown:2,s:2,ArrowLeft:3,a:3}[e.key];if(d===undefined)return;e.preventDefault();e.stopImmediatePropagation();step(d);},{capture:true});
function render(){const l=parse(room);cellGrid(l.w,l.h,(b,x,y)=>{const i=y*l.w+x,g=l.goals.includes(i),box=state.boxes.includes(i);b.classList.toggle('target',g);if(l.walls.includes(i)){b.classList.add('wall');b.textContent='■';b.setAttribute('aria-label','壁');}else if(i===state.player){b.textContent='●';b.classList.add('active');b.setAttribute('aria-label','あなた');}else if(box){b.textContent=g?'✓':'▣';b.setAttribute('aria-label',g?'箱、置き場に到着':'箱');}else{b.textContent=g?'◎':'·';b.setAttribute('aria-label',g?'置き場':'床');}},(x,y)=>{const px=state.player%l.w,py=Math.floor(state.player/l.w),d=dirs.findIndex(([dx,dy])=>x===px+dx&&y===py+dy);if(d>=0)step(d);else message('隣のマスを選ぶか、方向ボタンで歩こう。');});}
reset();
