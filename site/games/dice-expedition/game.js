import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { EXPEDITIONS, MAX_DEPTH, createRun, zoneFor, evaluate, startExpedition, toggleGuard, setRoute, reroll, rollDie, resolveRoom, bankLoot, continueExpedition, rankFor } from './logic.js';

mountShell({ title: 'ダイス探検', english: 'DICE EXPEDITION', accent: '#edbd72',
  description: '大きな出目を護衛に回すか、財宝に回すか。成功率を読み、8つの遺跡で引き際を選ぼう。',
  controls: ['ダイスをクリック / タップして護衛2個を選ぶ。残り2個が財宝。慎重 / 大胆な道を選んで探る。', '危険ダイス2個＋危険値が護衛以下なら成功。成功後は帰還で確保、続行でさらに奥へ。', 'Tab / Enterで全操作。1〜4で配分、C / Vで道、Eで探る、Bで帰還、Nで次へ。'] });

const $ = id => document.getElementById(id);
let run = createRun(), best = loadBest('dice-expedition'), busy = false, pending = null, expired = false;
const pips = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
const cards = [];
for (let i = 0; i < 4; i++) {
  const card = document.createElement('div'); card.className = 'dice-card';
  card.innerHTML = `<button type="button" class="die-button" id="die-${i}" aria-pressed="false"><span class="die-key" aria-hidden="true">${i + 1}</span><span class="die-face" aria-hidden="true">${Array.from({ length: 9 }, (_, n) => `<i data-pip="${n}"></i>`).join('')}</span><span class="die-role"></span></button><button type="button" class="reroll" id="reroll-${i}">↻ 再投</button>`;
  card.querySelector('.die-button').addEventListener('click', () => act(() => { run = toggleGuard(run, i); announcePlan(); }));
  card.querySelector('.reroll').addEventListener('click', () => act(() => { run = reroll(run, i); announcePlan(`ダイス${i + 1}を振り直しました。補給は残り${run.supplies}回。`); }));
  cards.push(card); $('dice-tray').append(card);
}
function announcePlan(prefix = '') {
  const plan = evaluate(run);
  $('status').textContent = prefix + (plan ? `護衛${plan.guard}。成功率${Math.round(plan.probability * 100)}%、成功で財宝+${plan.reward}。` : `護衛をあと${2 - run.guards.length}個選んでください。`);
}
function finishJourney() {
  if (run.phase !== 'finished' || !session.finish()) return;
  const improved = run.score > best;
  if (improved) { best = run.score; saveBest('dice-expedition', best); }
  $('status').textContent = `8遠征が終了。財宝${run.score}、${rankFor(run.score)}！${improved ? '自己ベスト更新。' : ''}`;
}
function act(action) {
  if (busy || expired || !session.check()) return;
  action();
  if (run.phase === 'finished') finishJourney();
  render();
}
function begin() {
  if (!['idle', 'between'].includes(run.phase)) return;
  act(() => { if (!session.start()) return; run = startExpedition(run); announcePlan('ダイスを振りました。'); });
}
function explore() {
  if (run.phase !== 'allocate' || !evaluate(run) || busy || expired || !session.check()) return;
  busy = true;
  const hazard = [rollDie(), rollDie()];
  $('status').textContent = '危険ダイスを振っています…'; render();
  pending = setTimeout(() => {
    pending = null;
    if (!session.check() || expired) return;
    busy = false; run = resolveRoom(run, hazard);
    if (run.last.passed) $('status').textContent = `突破！ 財宝+${run.last.reward}。未確保の財宝は${run.haul}。持ち帰るか、さらに奥へ。`;
    else $('status').textContent = `撤退。未確保の財宝${run.last.lost}を失いました。持ち帰り済みの${run.score}は安全です。`;
    if (run.phase === 'finished') finishJourney();
    render();
  }, 550);
}
function bank() { if (run.phase !== 'decision') return; act(() => { const haul = run.haul; run = bankLoot(run); $('status').textContent = `財宝${haul}を持ち帰りました。次の遠征では危険も変わります。`; }); }
function onward() { if (run.phase !== 'decision' || run.depth + 1 >= MAX_DEPTH) return; act(() => { run = continueExpedition(run); announcePlan('奥の部屋へ。危険値が1増えました。'); }); }
function reset() {
  clearTimeout(pending); pending = null; busy = false; expired = false;
  session.reset(); run = createRun(); $('status').textContent = '新しい8遠征。ダイスの出目を見て、配分と引き際を決めよう。'; render();
}
function render() {
  const allocating = run.phase === 'allocate' && !busy && !expired;
  const done = run.phase === 'finished' || expired;
  $('expedition').textContent = `${run.expedition} / ${EXPEDITIONS}`; $('score').textContent = run.score;
  $('supplies').textContent = run.supplies; $('haul').textContent = run.haul; $('best').textContent = best || '—';
  $('map').replaceChildren(...Array.from({ length: EXPEDITIONS }, (_, i) => {
    const mark = document.createElement('span'), entry = run.history[i];
    mark.textContent = entry ? entry.reason === 'bust' ? '×' : '✓' : i + 1;
    mark.className = entry ? entry.reason : i + 1 === run.expedition && !done ? 'current' : '';
    mark.setAttribute('aria-label', `遠征${i + 1}${entry ? `、${entry.reason === 'bust' ? '撤退' : '帰還'}、財宝${entry.amount}` : ''}`); return mark;
  }));
  const zone = zoneFor(run);
  $('zone-name').textContent = run.phase === 'idle' ? '8つの遺跡をめぐる旅' : zone.name;
  $('zone-icon').textContent = zone.icon;
  $('room').textContent = done ? '旅の終わり' : run.phase === 'between' ? '次の遠征の目的地' : run.phase === 'idle' ? '最初の遠征を始めよう' : `${run.depth + 1} / ${MAX_DEPTH} 部屋 · 奥ほど危険に`;
  $('intro').hidden = run.phase !== 'idle'; $('play-area').hidden = run.phase === 'idle' || done;
  $('assignment').textContent = busy ? '危険ダイスを判定中…' : `① 護衛にするダイスを2個選ぶ（${run.guards.length} / 2）`;
  cards.forEach((card, i) => {
    const selected = run.guards.includes(i), value = run.dice[i] || 1;
    const button = card.querySelector('.die-button'); button.disabled = !allocating;
    button.setAttribute('aria-pressed', String(selected)); button.setAttribute('aria-label', `ダイス${i + 1}、出目${value}、${selected ? '護衛' : '財宝'}。クリックで配分を変更`);
    card.classList.toggle('is-guard', selected); card.querySelector('.die-role').textContent = `${selected ? '護衛' : '財宝'} · ${value}`;
    card.querySelectorAll('[data-pip]').forEach(dot => dot.classList.toggle('on', pips[value - 1].includes(Number(dot.dataset.pip))));
    card.querySelector('.reroll').disabled = !allocating || run.supplies < 1;
    card.querySelector('.reroll').setAttribute('aria-label', `ダイス${i + 1}を補給1で振り直す。残り${run.supplies}回`);
  });
  $('dice-tray').hidden = run.phase === 'between'; $('assignment').hidden = run.phase === 'between';
  $('zone-rule').hidden = run.phase === 'between'; $('zone-rule').textContent = `遺跡のボーナス：${zone.detail}（財宝のダイスが対象）`;
  $('routes').hidden = !['allocate'].includes(run.phase);
  for (const route of ['careful', 'bold']) { $(route).disabled = !allocating; $(route).setAttribute('aria-pressed', String(run.route === route)); }
  const plan = evaluate(run);
  $('forecast').hidden = run.phase !== 'allocate';
  $('odds').textContent = plan ? `${Math.round(plan.probability * 100)}%` : '—';
  $('reward').textContent = plan ? `財宝 +${plan.reward}` : '護衛を2個選ぼう';
  $('chance-grid').replaceChildren(...Array.from({ length: 36 }, (_, i) => { const cell = document.createElement('i'); cell.className = plan && Math.floor(i / 6) + 1 + i % 6 + 1 + plan.danger <= plan.guard ? 'success' : ''; return cell; }));
  $('formula').textContent = plan ? `危険ダイス2個 + ${plan.danger} ≤ 護衛${plan.guard} で成功 · ${plan.count} / 36通り` : 'ダイスを選び直すと、成功率と財宝が変わります。';
  $('expected').textContent = plan ? `判定前のリスク：未確保${run.haul} · 期待増減 ${plan.expected >= 0 ? '+' : ''}${plan.expected.toFixed(1)}${plan.bonus ? ` · 遺跡ボーナス+${plan.bonus}獲得！` : ''}` : '';
  $('explore').hidden = run.phase !== 'allocate'; $('explore').disabled = !allocating || !plan;
  $('explore').textContent = busy ? '判定中…' : '③ この配分で探る →';
  $('resolution').hidden = !run.last || run.phase === 'allocate';
  if (run.last) {
    const last = run.last;
    $('outcome-label').textContent = last.passed ? 'ROOM CLEARED' : 'RETREAT';
    $('outcome-title').textContent = last.passed ? `突破！ 財宝 +${last.reward}` : `撤退。財宝 ${last.lost} を失った`;
    $('outcome-detail').textContent = `危険ダイス ${last.hazard.join(' + ')} + 危険${last.danger} = ${last.hazard[0] + last.hazard[1] + last.danger} ${last.passed ? '≤' : '>'} 護衛${last.guard}。${last.passed ? 'まだ未確保。帰還で確実に持ち帰ろう。' : '確保した財宝はそのまま。次の遺跡で立て直そう。'}`;
  }
  $('decision-actions').hidden = run.phase !== 'decision'; $('bank').textContent = `財宝 ${run.haul} を持ち帰る ✓`;
  $('continue').disabled = run.depth + 1 >= MAX_DEPTH; $('continue').textContent = run.depth + 1 >= MAX_DEPTH ? '最深部に到達！' : '奥へ（財宝 +6・危険 +1）→';
  $('next').hidden = run.phase !== 'between';
  $('result').hidden = !done;
  if (done) {
    $('result-label').textContent = expired ? 'TIME UP' : 'EXPEDITION COMPLETE';
    $('result-title').textContent = expired ? '時間切れ。旅はここまで。' : rankFor(run.score);
    $('result-detail').textContent = expired ? `30分に達したため終了しました。持ち帰り済み${run.score}。未完了の旅はベスト記録に保存しません。` : `8遠征で、財宝 ${run.score} を持ち帰った。帰還 ${run.history.filter(e => e.reason === 'bank').length} 回 / 撤退 ${run.history.filter(e => e.reason === 'bust').length} 回。`;
    $('history').replaceChildren(...run.history.map(entry => { const item = document.createElement('span'); item.textContent = `${entry.expedition}回目 ${entry.reason === 'bust' ? '撤退' : `+${entry.amount}`}`; return item; }));
  }
}
$('start').addEventListener('click', begin); $('next').addEventListener('click', begin); $('explore').addEventListener('click', explore);
$('bank').addEventListener('click', bank); $('continue').addEventListener('click', onward); $('again').addEventListener('click', reset);
for (const route of ['careful', 'bold']) $(route).addEventListener('click', () => act(() => { run = setRoute(run, route); announcePlan(); }));
document.addEventListener('keydown', event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (!['1', '2', '3', '4', 'c', 'v', 'e', 'b', 'n'].includes(key)) return;
  event.preventDefault();
  if (key >= '1' && key <= '4' && run.phase === 'allocate') act(() => { run = toggleGuard(run, Number(key) - 1); announcePlan(); });
  else if ((key === 'c' || key === 'v') && run.phase === 'allocate') act(() => { run = setRoute(run, key === 'c' ? 'careful' : 'bold'); announcePlan(); });
  else if (key === 'e') explore(); else if (key === 'b') bank(); else if (key === 'n') { if (run.phase === 'decision') onward(); else begin(); }
});
const session = createGameSession({ onExpire() {
  clearTimeout(pending); pending = null; busy = false; expired = true;
  $('status').textContent = '30分に達したため終了。未確保の財宝は持ち帰れません。新しい旅に挑戦できます。'; render();
} });
render();
