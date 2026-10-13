import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { LEVELS, DIRECTIONS, initialState, tile, guardState, forecast, step, medal, lootCount } from './logic.js';
mountShell({title:'エコーヴォールト',english:'ECHO VAULT',accent:'#65d7cd',description:'静かな一歩、響くノイズ。次の視線を読んで、6つの金庫を抜け出そう。',controls:['矢印キー / WASD、隣接マスのタップ、画面の方向ボタンで移動。Spaceで待機。','鍵を取り、宝石を開けて出口へ。赤い斜線は次の行動後の危険。','N / ノイズで3手だけ視界を止める。各金庫1回、接触には注意。']});
const $=selector=>document.querySelector(selector);
let index=0,state=initialState(LEVELS[0]),scores=[],expired=false,complete=false,best=loadBest('echo-vault',0),hintMove=null;
const medalNames=['','銅','銀','金'];
function same(a,b){return a[0]===b[0]&&a[1]===b[1];}
function render(){
 const level=LEVELS[index];
 const locked=expired||complete||state.outcome!=='playing';
 $('#level-count').textContent=`${String(index+1).padStart(2,'0')} / 06`;$('#level-name').textContent=level.name;$('#hint').textContent=level.hint;
 $('#moves').textContent=state.moves;$('#cargo').textContent=`${state.key?'⚿':'—'} / ${state.vault?'◈':'—'}`;$('#loot').textContent=`${state.loot.length} / ${lootCount(level)}`;$('#par').textContent=`${level.par}手`;
 $('#best').textContent=best||'—';$('#progress').replaceChildren();
 for(let i=0;i<6;i++){const el=document.createElement('span');el.textContent=scores[i]?['','●','●','●'][scores[i]]:String(i+1).padStart(2,'0');el.className=`progress-step ${scores[i]?'earned medal-'+scores[i]:i===index?'active':''}`;el.setAttribute('aria-label',`金庫${i+1}${scores[i]?`、${medalNames[scores[i]]}メダル`:i===index?'、挑戦中':'、未クリア'}`);$('#progress').append(el);}
 const dangers=forecast(level,state),guards=level.guards.map(g=>guardState(g,state.turn)),nextGuards=level.guards.map(g=>guardState(g,state.turn+1));
 const grid=$('#board');grid.style.setProperty('--cols',level.map[0].length);grid.replaceChildren();
 level.map.forEach((row,y)=>[...row].forEach((cell,x)=>{
  const p=[x,y],el=document.createElement('button');el.type='button';el.tabIndex=-1;el.className='vault-cell';const isPlayer=same(p,state.player),guard=guards.find(g=>same(p,g.position)),future=nextGuards.some(g=>same(p,g.position)),danger=dangers.some(q=>same(q,p));
  if(cell==='#'){el.classList.add('wall');el.disabled=true;}else if(locked)el.disabled=true;
  if(danger)el.classList.add('danger');if(future)el.classList.add('future');
  let symbol='',name=cell==='#'?'壁':'床';
  if(cell==='K'&&!state.key){symbol='⚿';name='鍵';el.classList.add('key');}
  if(cell==='V'&&!state.vault){symbol='◈';name='宝石';el.classList.add('gem');}
  if(cell==='o'&&!state.loot.includes(p.join(','))){symbol='●';name='金貨';el.classList.add('coin');}
  if(cell==='E'){symbol='⇥';name='出口';el.classList.add('exit');}
  if(guard){symbol={up:'▲',right:'▶',down:'▼',left:'◀'}[guard.facing];name+='、見張り';el.classList.add('guard');}
  else if(future&&!isPlayer){const ghost=document.createElement('span');ghost.className='ghost';ghost.textContent={up:'△',right:'▷',down:'▽',left:'◁'}[nextGuards.find(g=>same(p,g.position)).facing];el.append(ghost);}
  if(isPlayer){symbol='◆';name+='、あなた';el.classList.add('player');}
  if(hintMove&&same(p,hintMove))el.classList.add('hint-cell');
  const mark=document.createElement('span');mark.textContent=symbol;mark.className='cell-symbol';el.append(mark);
  el.setAttribute('aria-label',`${y+1}行${x+1}列、${name}${danger?'、次の手で危険':''}`);
  el.addEventListener('click',()=>{if(!session.check()||expired||complete||state.outcome!=='playing')return;const dx=x-state.player[0],dy=y-state.player[1];const action=Object.keys(DIRECTIONS).find(key=>DIRECTIONS[key][0]===dx&&DIRECTIONS[key][1]===dy);if(action)play(action);else $('#status').textContent='隣のマスをタップして移動。方向ボタンでも操作できます。';});grid.append(el);
 }));
 document.querySelectorAll('[data-action]').forEach(b=>b.disabled=locked||(b.dataset.action==='noise'&&state.usedNoise));
 $('#noise').innerHTML=state.noise?`ノイズ中 / あと${state.noise}手`:state.usedNoise?'ノイズ使用済み':'ノイズ <kbd>N</kbd>';
 $('#restart').disabled=expired||complete;$('#guide').disabled=locked;$('#result').hidden=state.outcome==='playing'&&!expired&&!complete;
}
function showResult(title,detail,label,button){$('#result-title').textContent=title;$('#result-detail').textContent=detail;$('#result-label').textContent=label;$('#continue').textContent=button;}
function play(action){
 if(!session.check()||expired||complete||state.outcome!=='playing')return;
 const next=step(LEVELS[index],state,action);if(next===state){$('#status').textContent='壁の向こうへは進めません。手数は変わりません。';return;}
 if(!session.start())return;state=next;hintMove=null;
 if(state.outcome==='caught'){showResult('見つかった！',`${state.caughtBy==='contact'?'移動後に見張りと同じマスになりました。ノイズでも接触は防げません。':'移動後に見張りの視線（赤い斜線）に入りました。'} やり直しても前の金庫は残ります。`,'CAUGHT','この金庫をやり直す ↺');$('#status').textContent='見張りに見つかりました。この金庫からもう一度。';}
 else if(state.outcome==='clear'){
  if(!session.check())return;scores[index]=medal(LEVELS[index],state);
  if(index===LEVELS.length-1){if(!session.finish())return;complete=true;const points=scores.reduce((a,b)=>a+b,0);if(points>best){best=points;saveBest('echo-vault',best);}showResult('6つの金庫、すべて脱出。',`今夜の仕事は完了。${points} / 18点。金メダル ${scores.filter(n=>n===3).length}個。全金庫クリアの点数だけを保存します。`,'NIGHT SHIFT COMPLETE','新しい夜をはじめる ↺');}
  else showResult(`${medalNames[scores[index]]}メダルで脱出！`,`${state.moves}手・金貨${state.loot.length}枚。全回収＋${LEVELS[index].par}手以内で金メダル。`,'VAULT SECURED','次の金庫へ →');
  $('#status').textContent=complete?'全6金庫をクリアしました！':`金庫${index+1}から脱出。${medalNames[scores[index]]}メダル獲得。`;
 }else{const cell=tile(LEVELS[index],...state.player);$('#status').textContent=action==='noise'?'ノイズ起動。見張りの視界は、この先2手も止まります。':cell==='V'&&!state.key?'宝石には鍵が必要です。先に鍵を探そう。':cell==='E'&&(!state.key||!state.vault)?'鍵と宝石を集めてから出口へ。':`第${state.turn}手。${state.noise?`あと${state.noise}手は視界停止。接触に注意。`:'赤い斜線を避けて、次の一歩を。'}`;}
 render();$('#board').focus({preventScroll:true});
}
function restart(){if(!session.check()||expired||complete)return;state=initialState(LEVELS[index]);hintMove=null;$('#status').textContent='同じ金庫から再挑戦。巡回も最初の位置に戻ります。';render();$('#board').focus({preventScroll:true});}
function newCampaign(){session.reset();index=0;state=initialState(LEVELS[0]);scores=[];expired=false;complete=false;hintMove=null;$('#status').textContent='鍵を取り、宝石へ。まずは金貨も探してみよう。';render();}
const session=createGameSession({onExpire(){expired=true;hintMove=null;showResult('時間切れ。今夜はここまで。','30分になったため終了。未完了のキャンペーンは自己ベストに保存しません。','TIME UP','新しい夜をはじめる ↺');$('#status').textContent='30分の制限時間になりました。新しい夜から再挑戦できます。';render();}});
$('#restart').addEventListener('click',restart);$('#continue').addEventListener('click',()=>{if(expired||complete)newCampaign();else if(!session.check())return;else if(state.outcome==='caught')restart();else if(state.outcome==='clear'){index++;state=initialState(LEVELS[index]);hintMove=null;$('#status').textContent='新しい金庫。まず巡回と出口を確認しよう。';render();$('#board').focus({preventScroll:true});}});
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>play(button.dataset.action)));
document.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;const target=event.target;if(target.matches('input,textarea,select')||target.isContentEditable)return;const keys={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left',w:'up',d:'right',s:'down',a:'left',' ':'wait',n:'noise'};const action=keys[event.key]||keys[event.key.toLowerCase()];if(!action)return;if(event.key===' '&&target.tagName==='BUTTON')return;event.preventDefault();play(action);});
// Breadth-first search supplies a safe next step from the actual position, even
// after a detour. It is optional and never changes the puzzle or scores.
$('#guide').addEventListener('click',()=>{
 if(!session.check()||state.outcome!=='playing'||expired||complete)return;
 const level=LEVELS[index],queue=[[state,null]],seen=new Set();let cursor=0,answer=null;
 while(cursor<queue.length&&cursor<60000){const [s,first]=queue[cursor++];if(s.outcome==='clear'){answer=first;break;}for(const action of ['up','right','down','left','wait','noise']){const t=step(level,s,action);if(t===s||t.outcome==='caught')continue;const key=[t.player,t.turn%24,t.key,t.vault,t.noise,t.usedNoise].join('|');if(seen.has(key))continue;seen.add(key);queue.push([t,first||action]);}}
 const words={up:'上へ',right:'右へ',down:'下へ',left:'左へ',wait:'待つ',noise:'ノイズ'};
 if(answer){hintMove=DIRECTIONS[answer]?[state.player[0]+DIRECTIONS[answer][0],state.player[1]+DIRECTIONS[answer][1]]:null;$('#status').textContent=`お手本の次の1手：${words[answer]}。脱出までの道を優先します。`;render();}else $('#status').textContent='この位置から安全な脱出ルートがありません。この金庫をやり直してみよう。';
});
newCampaign();
