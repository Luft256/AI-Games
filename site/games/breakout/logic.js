export const WIDTH=800,HEIGHT=520;
export const PALETTE=['#ff9d6c','#f5bb6d','#ded97d','#b5f36e','#83c9ad'];
export function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
export function createGame(){const bricks=[];for(let row=0;row<5;row++)for(let col=0;col<9;col++)bricks.push({x:44+col*80,y:68+row*33,w:72,h:23,row,alive:true,points:(5-row)*10});const s={paddle:{x:344,y:474,w:112,h:14},ball:{x:400,y:464,r:8,vx:0,vy:0},bricks,score:0,lives:3,result:null,serving:true};return s;}
export function movePaddle(s,x){s.paddle.x=clamp(x,12,WIDTH-12-s.paddle.w);if(s.serving){s.ball.x=s.paddle.x+s.paddle.w/2;s.ball.y=s.paddle.y-s.ball.r-2;}}
export function launch(s){if(s.result||!s.serving)return;s.serving=false;s.ball.vx=125;s.ball.vy=-325;}
export function circleRect(ball,rect){const x=clamp(ball.x,rect.x,rect.x+rect.w),y=clamp(ball.y,rect.y,rect.y+rect.h);return (ball.x-x)**2+(ball.y-y)**2<=ball.r**2;}
export function advance(s,dt){const events=[];if(s.serving||s.result)return events;const substeps=Math.ceil(Math.max(0,Math.min(dt,.05))/(1/240));if(!substeps)return events;const delta=Math.min(dt,.05)/substeps;
for(let i=0;i<substeps;i++){
 const b=s.ball,oldX=b.x,oldY=b.y;b.x+=b.vx*delta;b.y+=b.vy*delta;
 if(b.x-b.r<12){b.x=12+b.r;b.vx=Math.abs(b.vx);}if(b.x+b.r>WIDTH-12){b.x=WIDTH-12-b.r;b.vx=-Math.abs(b.vx);}if(b.y-b.r<12){b.y=12+b.r;b.vy=Math.abs(b.vy);}
 if(b.vy>0&&oldY+b.r<=s.paddle.y+3&&circleRect(b,s.paddle)){const angle=clamp((b.x-(s.paddle.x+s.paddle.w/2))/(s.paddle.w/2),-1,1)*1.08;const speed=Math.min(560,Math.hypot(b.vx,b.vy)+4);b.vx=Math.sin(angle)*speed;b.vy=-Math.cos(angle)*speed;b.y=s.paddle.y-b.r-.01;events.push({type:'paddle',x:b.x,y:b.y});}
 for(const brick of s.bricks){if(!brick.alive||!circleRect(b,brick))continue;brick.alive=false;s.score+=brick.points;
 if(oldX+b.r<=brick.x||oldX-b.r>=brick.x+brick.w){b.vx=-b.vx;b.x=oldX;}else {b.vy=-b.vy;b.y=oldY;}
 const speed=Math.hypot(b.vx,b.vy),scale=Math.min(560,speed+3)/speed;b.vx*=scale;b.vy*=scale;events.push({type:'brick',x:brick.x+brick.w/2,y:brick.y+brick.h/2,row:brick.row});
 if(s.bricks.every(item=>!item.alive)){s.result='win';return events;}break;
 }
 if(b.y-b.r>HEIGHT){s.lives--;events.push({type:'miss'});if(s.lives<=0){s.result='over';return events;}s.serving=true;b.vx=0;b.vy=0;movePaddle(s,s.paddle.x);return events;}
}return events;}
