export const DIRECTIONS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
// Every guard follows a visible, repeating route. No random puzzle generation.
export const LEVELS = [
  { name: '静かな入口', hint: 'まずは鍵、宝石、出口の順。寄り道の金貨も回収しよう。', par: 20,
    map: ['#########','#S..K...#','#.###.#.#','#...o.#.#','###.#.#.#','#o..V..E#','#########'], guards: [] },
  { name: '巡回の足音', hint: '赤い線は「次の手」の危険。待つと巡回だけが進みます。', par: 26,
    map: ['#########','#S..#..K#','#.#.#.#.#','#o#...#.#','#.#.#.#.#','#...V.oE#','#########'],
    guards: [{ path: [[3,3],[4,3],[5,3],[4,3]], facing: 'right' }] },
  { name: '反響する廊下', hint: 'ノイズを使うと、使用した手を含めて3手だけ視界が止まります。接触には注意。', par: 32,
    map: ['#########','#S..o..K#','#.#####.#','#...V...#','#.#####.#','#o.....E#','#########'],
    guards: [{ path: [[4,3],[5,3],[6,3],[5,3]], facing: 'right' }] },
  { name: '交差する視線', hint: '2人の巡回をまとめて予測。金貨は帰り道でも拾えます。', par: 31,
    map: ['###########','#S..o....K#','#.##...##.#','#....V....#','#.##...##.#','#o.......E#','###########'],
    guards: [{ path:[[3,3],[4,3],[5,3],[4,3]],facing:'right' },{ path:[[7,3],[8,3],[9,3],[8,3]],facing:'right' }] },
  { name: '金庫の迂回路', hint: 'ノイズは1回だけ。壁の裏で待って、安全な窓を作ろう。', par: 39,
    map: ['###########','#S..#o...K#','#.#.#.##..#','#.#...V...#','#.###.###.#','#o.......E#','###########'],
    guards: [{path:[[5,3],[6,3],[7,3],[8,3],[7,3],[6,3]],facing:'right'}, {path:[[8,1],[9,1],[9,2],[8,2]],facing:'right'}] },
  { name: '最後のヴォールト', hint: '最後の宝石へ。6つの金庫を抜けて、今夜の仕事を終えよう。', par: 48,
    map: ['###########','#S.o#....K#','#.#.#.#...#','#.#...#...#','#...V...#.#','#.###.#.#.#','#o....#..E#','###########'],
    guards: [{path:[[4,4],[5,4],[6,4],[5,4]],facing:'right'}, {path:[[7,2],[7,3],[8,3],[9,3],[9,2],[9,1],[8,1],[7,1]],facing:'down'}] }
];
export function tile(level, x, y) { return level.map[y]?.[x] ?? '#'; }
export function locate(level, symbol) {
  for(let y=0;y<level.map.length;y++) for(let x=0;x<level.map[y].length;x++) if(tile(level,x,y)===symbol) return [x,y];
  return null;
}
export function initialState(level) {
  return { player: locate(level,'S'), turn:0, moves:0, key:false, vault:false, loot:[], noise:0, usedNoise:false, outcome:'playing' };
}
export function guardState(guard, turn) {
  const index = turn % guard.path.length;
  const position = guard.path[index];
  const next = guard.path[(index+1)%guard.path.length];
  let facing = guard.facing;
  if(next[0]>position[0]) facing='right'; else if(next[0]<position[0]) facing='left';
  else if(next[1]>position[1]) facing='down'; else if(next[1]<position[1]) facing='up';
  return { position, facing, next };
}
export function vision(level, position, facing) {
  const [dx,dy]=DIRECTIONS[facing]; const cells=[];
  for(let i=1;i<=3;i++){const p=[position[0]+dx*i,position[1]+dy*i];if(tile(level,...p)==='#') break;cells.push(p);}
  return cells;
}
export function hazards(level, turn, noisy=false) {
  return level.guards.flatMap(guard=>{ const g=guardState(guard,turn);return [g.position,...(noisy?[]:vision(level,g.position,g.facing))]; });
}
export function forecast(level,state) { return hazards(level,state.turn+1,state.noise>0); }
export function step(level,state,action) {
  if(state.outcome!=='playing') return state;
  if(action==='noise' && state.usedNoise) return state;
  if(!DIRECTIONS[action] && !['wait','noise'].includes(action)) return state;
  let player=[...state.player];
  if(DIRECTIONS[action]) {const [dx,dy]=DIRECTIONS[action];player=[player[0]+dx,player[1]+dy];if(tile(level,...player)==='#') return state;}
  const noise=action==='noise'?2:Math.max(0,state.noise-1);
  const next={...state,player,turn:state.turn+1,moves:state.moves+1,loot:[...state.loot],noise,usedNoise:state.usedNoise||action==='noise'};
  const danger=hazards(level,next.turn,action==='noise'||state.noise>0);
  if(danger.some(p=>p[0]===player[0]&&p[1]===player[1])) {next.outcome='caught';next.caughtBy=level.guards.some(g=>{const p=guardState(g,next.turn).position;return p[0]===player[0]&&p[1]===player[1];})?'contact':'sight';return next;}
  const cell=tile(level,...player);
  if(cell==='K') next.key=true;
  if(cell==='V'&&next.key) next.vault=true;
  const id=player.join(',');if(cell==='o'&&!next.loot.includes(id))next.loot.push(id);
  if(cell==='E'&&next.key&&next.vault)next.outcome='clear';
  return next;
}
export function lootCount(level) { return level.map.join('').split('o').length-1; }
export function medal(level,state) { if(state.outcome!=='clear')return 0;return state.loot.length===lootCount(level)?state.moves<=level.par?3:2:1; }
