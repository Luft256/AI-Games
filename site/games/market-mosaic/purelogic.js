export const SHAPES=[[[0,0],[1,0]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,1]]];export const NAMES=['花','食','本'];
export function createState(){return{board:Array(25).fill(-1),turn:0,score:0,rows:[],ended:false};}
export function offers(s){return [0,1,2].map(i=>({color:(s.turn+i)%3,shape:(s.turn*2+i)%3}));}
export function cells(shape,rotation,anchor){let points=SHAPES[shape].map(p=>[...p]);for(let n=0;n<rotation%4;n++)points=points.map(([x,y])=>[-y,x]);const minX=Math.min(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1]));return points.map(([x,y])=>[x-minX+anchor%5,y-minY+Math.floor(anchor/5)]);}
export function canPlace(s,offer,rotation,anchor){if(s.ended||!offer||!Number.isInteger(anchor)||anchor<0||anchor>24)return false;return cells(offer.shape,rotation,anchor).every(([x,y])=>x>=0&&x<5&&y>=0&&y<5&&s.board[y*5+x]===-1);}
export function place(s,choice,rotation,anchor){const offer=offers(s)[choice];if(!canPlace(s,offer,rotation,anchor))return s;const n={...s,board:[...s.board],rows:[...s.rows],turn:s.turn+1},indices=cells(offer.shape,rotation,anchor).map(([x,y])=>y*5+x);let bonus=0;for(const i of indices)for(const j of[i-5,i+5,i%5?i-1:-1,i%5<4?i+1:-1])if(j>=0&&j<25&&s.board[j]===offer.color)bonus+=2;indices.forEach(i=>n.board[i]=offer.color);n.score+=indices.length+bonus;for(let r=0;r<5;r++)if(!n.rows.includes(r)&&n.board.slice(r*5,r*5+5).every(c=>c!==-1)){n.rows.push(r);n.score+=4;}n.ended=n.turn===12;return n;}
export function skip(s){return s.ended?s:{...s,turn:s.turn+1,ended:s.turn+1===12};}
export const won=s=>s.ended&&s.score>=45;
