export const PLANETS=[{name:'アトラス',x:50,y:89},{name:'ファーン',x:22,y:66},{name:'エンバー',x:78,y:66},{name:'リレー',x:50,y:47},{name:'フロスト',x:22,y:27},{name:'ダスク',x:78,y:27},{name:'クラウン',x:50,y:8}];
export const EDGES=[[0,1,2],[0,2,3],[1,3,2],[2,3,2],[1,4,3],[3,4,2],[2,5,3],[3,5,2],[4,6,2],[5,6,2],[3,6,3]];
export const CONTRACTS=[{name:'近郊の生命',needs:[1],to:0,reward:5},{name:'鉱物の標本',needs:[2],to:0,reward:6},{name:'通信の地図',needs:[1,3],to:3,reward:7},{name:'古代の鉱脈',needs:[2,5],to:3,reward:9},{name:'氷の境界',needs:[3,4],to:3,reward:8},{name:'遠い星の記録',needs:[5,6],to:0,reward:15},{name:'星門の両岸',needs:[4,6],to:6,reward:11}];
export function createState(){return{phase:'planning',contracts:[],done:[],visited:[0],at:0,fuel:12,turn:0,ended:false,last:''};}
export function select(s,id){if(s.ended||s.phase!=='planning'||!Number.isInteger(id)||id<0||id>=CONTRACTS.length)return s;if(s.contracts.includes(id))return{...s,contracts:s.contracts.filter(c=>c!==id)};return s.contracts.length<2?{...s,contracts:[...s.contracts,id]}:s;}
export function launch(s){return s.phase==='planning'&&s.contracts.length===2&&!s.ended?{...s,phase:'flying'}:s;}
export function cost(s,to){const e=EDGES.find(([a,b])=>(a===s.at&&b===to)||(b===s.at&&a===to));return e?.[2]??Infinity;}
export function canMove(s,to){return s.phase==='flying'&&!s.ended&&Number.isInteger(to)&&to>=0&&to<7&&cost(s,to)<=s.fuel&&(to!==6||s.visited.includes(3));}
export const canRefuel=s=>s.phase==='flying'&&!s.ended&&[0,3].includes(s.at)&&s.fuel<14;
export function settle(n){const newly=n.contracts.filter(id=>!n.done.includes(id)&&CONTRACTS[id].to===n.at&&CONTRACTS[id].needs.every(p=>n.visited.includes(p)));n.done=[...n.done,...newly];if(newly.length)n.last+=' 契約達成：'+newly.map(id=>CONTRACTS[id].name).join('、')+'。';n.ended=(n.at===0&&n.done.length===2)||n.turn>=10||(!canRefuel(n)&&!PLANETS.some((_,id)=>canMove(n,id)));if(n.ended)n.phase='finished';return n;}
export function move(s,to){if(!canMove(s,to))return s;return settle({...s,at:to,turn:s.turn+1,fuel:s.fuel-cost(s,to),visited:s.visited.includes(to)?[...s.visited]:[...s.visited,to],done:[...s.done],last:`${PLANETS[s.at].name}→${PLANETS[to].name}：燃料−${cost(s,to)}。`});}
export function refuel(s){if(!canRefuel(s))return s;const fuel=Math.min(14,s.fuel+8);return settle({...s,turn:s.turn+1,fuel,done:[...s.done],last:`${PLANETS[s.at].name}で補給：燃料${s.fuel}→${fuel}。`});}
export const won=s=>s.ended&&s.at===0&&s.done.length===2;
export const score=s=>won(s)?s.contracts.reduce((n,id)=>n+CONTRACTS[id].reward,0)+s.fuel+(10-s.turn)*2:0;
