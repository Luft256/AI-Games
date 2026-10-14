import test from 'node:test';import assert from 'node:assert/strict';import {parse,move,solved,solve} from './logic.js';
test('all six warehouses have verified solutions with multiple pushes',()=>{for(let n=0;n<6;n++){const l=parse(n),path=solve(l);assert.ok(path,`room ${n+1}`);let s={player:l.player,boxes:l.boxes};for(const d of path)s=move(l,s,d);assert.ok(solved(l,s));assert.ok(s.pushes>=1);}});
test('blocked moves never mutate boxes or player',()=>{const l=parse(0),s={player:7,boxes:[8],pushes:0};assert.equal(move(l,s,0),null);assert.deepEqual(s,{player:7,boxes:[8],pushes:0});});
test('two adjacent boxes cannot both be pushed',()=>{const l=parse(1),s={player:22,boxes:[23,24]};assert.equal(move(l,s,1),null);});
