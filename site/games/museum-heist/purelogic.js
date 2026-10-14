export const TYPES=['像','絵','器'];export const ICONS=['♜','▧','♧'];
export function offers(s){return[0,1,2].map(i=>({type:(s.turn+i)%3,value:2+(s.turn*3+i*2)%5,min:1+(s.turn+i)%3}));}
export const intent=s=>({choice:s.turn%3,bid:1+s.turn%4});
export function score(collection){const counts=TYPES.map((_,i)=>collection.filter(a=>a.type===i).length);return collection.reduce((n,a)=>n+a.value,0)+Math.min(...counts)*5+counts.reduce((n,c)=>n+Math.floor(c/2)*3,0);}
export function createState(){return{turn:0,money:16,collection:[],ended:false,last:''};}
export function auction(s,choice,bid){if(s.ended||!Number.isInteger(choice)||choice<-1||choice>2||!Number.isInteger(bid)||bid<0||bid>s.money)return s;let n={...s,turn:s.turn+1,collection:[...s.collection]},o=offers(s)[choice],r=intent(s);if(choice===-1)n.last='今回は見送り。予算を温存しました。';else if(bid<o.min)n.last=`最低${o.min}コインに届かず、落札なし。コインは使いません。`;else if(choice===r.choice&&bid<=r.bid)n.last=`相手の${r.bid}コイン以下のため、${TYPES[o.type]}は相手へ。コインは使いません。`;else{n.money-=bid;n.collection.push(o);n.last=`${TYPES[o.type]}（価値${o.value}）を${bid}コインで落札。`;}n.ended=n.turn===8;return n;}
export const won=s=>s.ended&&score(s.collection)>=30;
