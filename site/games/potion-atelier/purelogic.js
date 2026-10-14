export const COLORS=['透明','紅','青','金'];export const INGREDIENTS=['赤実','青石','葉','火花'];
export const RECIPES=[[0,1],[1,0],[0,3,2],[1,3,0],[2,0,3],[0,2,1],[1,2,3],[2,1,0]];
export function transform(mix,id){const {color:c,power:p}=mix;const outputs=[{color:(c+1)%4,power:p+1},{color:(c*2+1)%4,power:p+2},{color:(c+3)%4,power:p-1},{color:(c+p)%4,power:p*2}];return outputs[id]?{color:outputs[id].color,power:Math.max(0,Math.min(8,outputs[id].power))}:mix;}
export const evaluate=recipe=>recipe.reduce(transform,{color:0,power:0});export const ORDERS=RECIPES.map(evaluate);
export function createState(){return{turn:0,score:0,stock:[7,7,7,6],recipe:[],mix:{color:0,power:0},ended:false};}
export function add(s,id){if(s.ended||!Number.isInteger(id)||id<0||id>3||s.stock[id]<=0||s.recipe.length>=3)return s;const stock=[...s.stock];stock[id]--;return{...s,stock,recipe:[...s.recipe,id],mix:transform(s.mix,id)};}
export function undo(s){if(s.ended||!s.recipe.length)return s;const recipe=s.recipe.slice(0,-1),stock=[...s.stock];stock[s.recipe.at(-1)]++;return{...s,stock,recipe,mix:evaluate(recipe)};}
export const matches=s=>s.recipe.length>0&&s.mix.color===ORDERS[s.turn]?.color&&s.mix.power===ORDERS[s.turn]?.power;
export function deliver(s,skip=false){if(s.ended||(!skip&&!s.recipe.length))return s;return{...s,turn:s.turn+1,score:s.score+(!skip&&matches(s)?1:0),mix:{color:0,power:0},recipe:[],ended:s.turn===7};}
export const won=s=>s.ended&&s.score>=6;
