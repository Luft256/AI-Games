import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, initialState, step, hazards, forecast, tile, vision, guardState, medal, lootCount } from './logic.js';
const actions={U:'up',R:'right',D:'down',L:'left',W:'wait',N:'noise'};
// Independently found shortest full-loot routes prove all six curated boards.
export const SOLUTIONS=['RRRRDDLLDDLLRRRRRR','DDDDRRRRRRUUUUDDDDLLLRRR','RRRRRRLLLLLLDDWRRNRLLLDDRRRRRR','RRRRRRRRLLLDLNDDDLLLLRRRRRRRR','RLDDDDRRRRUWUUURRRRDLULLLDWNDRLDDRRRR','RRDUDDRRUURRDRURLLLLDDLWDULDLLDDRRRRUWNURRDDRR'];
for(const [index,level] of LEVELS.entries())test(`Heist ${index+1}: gold route collects key, vault, both coins and reaches exit`,()=>{
 let state=initialState(level);for(const char of SOLUTIONS[index]){const next=step(level,state,actions[char]);assert.notEqual(next,state,`Blocked action ${char} on turn ${state.turn}`);assert.notEqual(next.outcome,'caught',`Caught at ${next.player}, turn ${next.turn}`);state=next;}
 assert.equal(state.outcome,'clear');assert.equal(state.key,true);assert.equal(state.vault,true);assert.equal(state.loot.length,lootCount(level));assert.equal(medal(level,state),3);assert.equal(step(level,state,'wait'),state);
});
test('All patrol routes stay on floors and form adjacent closed paths',()=>{for(const l of LEVELS)for(const g of l.guards)for(let i=0;i<g.path.length;i++){assert.notEqual(tile(l,...g.path[i]),'#');const next=g.path[(i+1)%g.path.length];assert.equal(Math.abs(g.path[i][0]-next[0])+Math.abs(g.path[i][1]-next[1]),1);}});
test('Walls block movement without advancing patrol or using noise',()=>{const s=initialState(LEVELS[0]);assert.equal(step(LEVELS[0],s,'up'),s);assert.equal(step(LEVELS[0],s,'left'),s);});
test('Normal-move preview exactly matches detection hazards next turn',()=>{for(const l of LEVELS)for(let turn=0;turn<24;turn++){for(const noise of [0,1,2])assert.deepEqual(forecast(l,{turn,noise}),hazards(l,turn+1,noise>0));}});
test('Sight stops at a wall and cannot see around a corner',()=>{assert.deepEqual(vision(LEVELS[0],[1,1],'down'),[[1,2],[1,3]]);assert.deepEqual(vision(LEVELS[0],[1,1],'right'),[[2,1],[3,1],[4,1]]);});
test('Patrol waits, pulse blocks sight for precisely three turns and contact stays dangerous',()=>{
 const l={map:['########','#S.....#','#..K.VE#','########'],guards:[{path:[[4,1],[5,1]],facing:'right'}]};let s=initialState(l);
 s=step(l,s,'noise');assert.equal(s.noise,2);assert.equal(s.usedNoise,true);assert.deepEqual(guardState(l.guards[0],s.turn).position,[5,1]);
 assert.equal(step(l,s,'noise'),s);s=step(l,s,'right');assert.equal(s.noise,1);s=step(l,s,'right');assert.equal(s.noise,0);assert.equal(s.outcome,'playing');s=step(l,s,'right');assert.equal(s.outcome,'caught');
 const collision={...initialState(l),player:[4,1]};assert.equal(step(l,collision,'right').outcome,'caught');
});
test('Key is required to open the vault; both are required for an exit',()=>{const l={map:['########','#SV.EK.#','########'],guards:[]};let s=initialState(l);s=step(l,s,'right');assert.equal(s.vault,false);s=step(l,s,'right');s=step(l,s,'right');assert.equal(s.outcome,'playing');s=step(l,s,'right');assert.equal(s.key,true);s=step(l,s,'left');s=step(l,s,'left');s=step(l,s,'left');assert.equal(s.vault,true);s=step(l,s,'right');s=step(l,s,'right');assert.equal(s.outcome,'clear');});
test('Unfinished/caught maps award no medal; medals require clear and optional loot',()=>{const l=LEVELS[0],s=initialState(l);assert.equal(medal(l,s),0);assert.equal(medal(l,{...s,outcome:'caught'}),0);assert.equal(medal(l,{...s,outcome:'clear'}),1);assert.equal(medal(l,{...s,outcome:'clear',loot:['a','b'],moves:l.par+1}),2);});
test('Heists 3–5 require the one-use noise: normal movement/wait alone cannot reach a clear',()=>{
 for(const level of LEVELS.slice(2,5)){
  const queue=[initialState(level)],seen=new Set();let cursor=0,canClear=false;
  while(cursor<queue.length){const state=queue[cursor++];if(state.outcome==='clear'){canClear=true;break;}
   for(const action of ['up','right','down','left','wait']){const next=step(level,state,action);if(next===state||next.outcome==='caught')continue;
    // All authored patrol periods divide 24; inventory and position fully
    // describe reachability. Loot is optional and has no effect on access.
    const key=[next.player,next.turn%24,next.key,next.vault].join('|');if(seen.has(key))continue;seen.add(key);queue.push(next);
   }
  }
  assert.equal(canClear,false,`${level.name}: pulse should make a real tactical difference`);
 }
});
