export const dirs=[[0,-1],[1,0],[0,1],[-1,0],[0,0]];
const paths=[[[3,0],[3,1],[3,2],[3,3],[3,4],[3,5]],[[4,0],[3,0],[3,1],[3,2],[3,3],[4,3],[4,4],[4,5]],[[3,0],[4,0],[4,1],[4,2],[3,2],[3,3],[3,4],[4,4],[4,5]],[[4,0],[4,1],[3,1],[3,2],[3,3],[4,3],[4,4],[3,4],[3,5]],[[3,0],[4,0],[4,1],[4,2],[3,2],[3,3],[3,4],[4,4],[4,5]]];
export const witnesses=[[2,4,2,2,4],[2,4,4,2,2,4,4],[2,4,4,4,2,2,4,4],[2,2,2,0,0,4],[2,4,4,4,2,2,4,2,3,4]];
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
export function puzzle(n){const path=paths[n],plates={A:[1,1],B:[1,3]};if(n===4)plates.C=[0,4];const gates={};for(const[x,y]of path){if(y===2)gates[y*5+x]=n===3?'B':'A';if(y===4)gates[y*5+x]=n===3?'A':'B';if(n===4&&y===5)gates[y*5+x]='C';}return{start:path[0],goal:path.at(-1),own:path,ghostStart:[1,0],plates,gates,ghostWalls:n%2?[[0,2]]:[]};}
export function initial(p){return{phase:'record',route:[],ghost:[...p.ghostStart],player:[...p.start],turn:0,blocked:false};}
export function recordStep(p,s,d){if(s.phase!=='record'||s.route.length>=12)return null;const[dx,dy]=dirs[d],n=[s.ghost[0]+dx,s.ghost[1]+dy],valid=n[0]>=0&&n[0]<=1&&n[1]>=0&&n[1]<6&&!p.ghostWalls.some(a=>same(a,n)),ghost=valid?n:[...s.ghost];return{...s,ghost,route:[...s.route,ghost],blocked:!valid};}
export function startReplay(p,s){return s.route.length?{...s,phase:'play',ghost:[...p.ghostStart],player:[...p.start],turn:0,blocked:false}:null;}
export function activePlate(p,ghost){return Object.entries(p.plates).find(([,a])=>same(a,ghost))?.[0]||null;}
export function replayStep(p,s,d){if(s.phase!=='play'||s.turn>=40)return null;const ghost=s.route[s.turn%s.route.length],[dx,dy]=dirs[d],next=[s.player[0]+dx,s.player[1]+dy],gate=p.gates[next[1]*5+next[0]],valid=p.own.some(a=>same(a,next))&&(!gate||same(next,s.player)||activePlate(p,ghost)===gate);return{...s,ghost,player:valid?next:[...s.player],turn:s.turn+1,blocked:!valid};}
export function solved(p,s){return s.phase==='play'&&same(s.player,p.goal)&&s.turn<=40;}
export function makeRoute(p,actions){let s=initial(p);for(const d of actions)s=recordStep(p,s,d);return s.route;}
export function solvePlayer(p,route){if(!route.length)return null;const start=startReplay(p,{...initial(p),route}),queue=[[start,[]]],seen=new Set();for(let i=0;i<queue.length;i++){const[s,path]=queue[i];if(solved(p,s))return path;if(path.length>=40)continue;for(let d=0;d<5;d++){const n=replayStep(p,s,d),key=`${n.player}|${n.turn%route.length}`;if(seen.has(key))continue;seen.add(key);queue.push([n,[...path,d]]);}}return null;}
