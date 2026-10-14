export const SYMBOLS=['●','▲','■','✦'];export const CODES=Array.from({length:64},(_,i)=>[Math.floor(i/16),Math.floor(i/4)%4,i%4]);
export function feedback(secret,guess){let exact=0,countsS=Array(4).fill(0),countsG=Array(4).fill(0);for(let i=0;i<3;i++){if(secret[i]===guess[i])exact++;countsS[secret[i]]++;countsG[guess[i]]++;}return{exact,near:countsS.reduce((n,c,i)=>n+Math.min(c,countsG[i]),0)-exact};}
export function candidates(history){return CODES.filter(code=>history.every(h=>{const f=feedback(code,h.guess);return f.exact===h.exact&&f.near===h.near;}));}
export function createState(seed=0){return{seed,case:0,history:[],score:0,solved:false,ended:false};}
export const secret=s=>CODES[((s.case*13+s.seed*17)%64+64)%64];
export function probe(s,guess){if(s.ended||s.solved||!Array.isArray(guess)||guess.length!==3||guess.some(n=>!Number.isInteger(n)||n<0||n>3))return s;let f=feedback(secret(s),guess),history=[...s.history,{guess:[...guess],...f}],solved=f.exact===3;return{...s,history,solved,score:s.score+(solved?(6-history.length)*10:0),ended:(solved&&s.case===4)||(!solved&&history.length===5)};}
export function nextCase(s){return s.solved&&!s.ended?{...s,case:s.case+1,solved:false,history:[]}:s;}
export const won=s=>s.ended&&s.solved&&s.case===4;
