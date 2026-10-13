import test from 'node:test';
import assert from 'node:assert/strict';
import {createSnake,turn,step,placeFood,SIZE} from './logic.js';
test('new snake starts safely and moves without growing',()=>{const s=createSnake(()=>0);for(let i=0;i<5;i++)assert.equal(step(s),null);assert.equal(s.snake.length,3);assert.deepEqual(s.snake[0],{x:14,y:10});});
test('rejects reversal and multiple turns within one tick',()=>{const s=createSnake();assert.equal(turn(s,'left'),false);assert.equal(turn(s,'up'),true);assert.equal(turn(s,'left'),false);step(s);assert.equal(s.direction,'up');});
test('eating grows and scores, food avoids the body',()=>{const s=createSnake();s.food={x:10,y:10};step(s,()=>0);assert.equal(s.score,10);assert.equal(s.snake.length,4);assert.ok(!s.snake.some(p=>p.x===s.food.x&&p.y===s.food.y));});
test('vacating tail is safe but body and walls are not',()=>{const s=createSnake();s.snake=[{x:1,y:1},{x:1,y:2},{x:0,y:2},{x:0,y:1}];s.direction='left';s.food={x:8,y:8};assert.equal(step(s),null);assert.equal(step(s),'over');const b=createSnake();b.snake=[{x:1,y:1},{x:2,y:1},{x:2,y:2}];b.direction='right';assert.equal(step(b),'over');});
test('full board wins without retrying random placement',()=>{const s=createSnake();s.snake=[];for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)s.snake.push({x,y});placeFood(s);assert.equal(s.food,null);assert.equal(s.result,'win');});
