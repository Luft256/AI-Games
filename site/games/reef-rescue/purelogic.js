export const HABITATS = [5,6,9,10];
export const FORECASTS = [[5,6],[9,10],[5,9],[6,10],[5,10],[6,9],[5,6],[9,10],[5,9],[6,10],[5,10],[6,9]];
export function neighbors(i) { return [i-4,i+4,i%4?i-1:-1,i%4<3?i+1:-1].filter(n=>n>=0&&n<16); }
export function createState() { return {turn:0,water:Array(16).fill(0),walls:Array(16).fill(0),hp:HABITATS.map(()=>3),ended:false}; }
export function forecast(state) { return (FORECASTS[state.turn]||[]).map(i=>({i,amount:state.turn%3===2?4:3})); }
export function advance(state,tool,index) {
 if(state.ended||!['pump','wall','wait'].includes(tool)||!Number.isInteger(index)||index<0||index>15) return state;
 if(tool==='wall'&&state.walls[index]>0)return state;
 const next={...state,water:[...state.water],walls:[...state.walls],hp:[...state.hp]};
 if(tool==='pump'){next.water[index]=Math.max(0,next.water[index]-2);for(const n of neighbors(index))next.water[n]=Math.max(0,next.water[n]-1);}
 if(tool==='wall')next.walls[index]=3;
 for(const {i,amount} of forecast(state))next.water[i]=Math.min(4,next.water[i]+Math.max(0,amount-(next.walls[i]>0?2:0)));
 next.hp=next.hp.map((hp,h)=>Math.max(0,hp-(next.water[HABITATS[h]]>=3?1:0)));
 next.water=next.water.map(w=>Math.max(0,w-1));next.walls=next.walls.map(w=>Math.max(0,w-1));next.turn++;
 next.ended=next.turn===12||next.hp.every(h=>h===0);return next;
}
export const survivors=s=>s.hp.filter(h=>h>0).length;
export const won=s=>s.ended&&s.turn===12&&survivors(s)>=3;
