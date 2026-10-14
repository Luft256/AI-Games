import test from 'node:test';import assert from 'node:assert/strict';import {makeRoom,trace,reflect,minimumRotations} from './logic.js';
test('all six authored rooms have a reflected winning path',()=>{for(let i=0;i<6;i++){const r=makeRoom(i);assert.equal(trace(r,r.mirrors.map(m=>m.solution)).hit,true,`room ${i+1}`);assert.equal(trace(r,r.mirrors.map((m,j)=>m.solution^(j%2===0?1:0))).hit,false);}});
test('mirror reflection reverses predictably',()=>{for(let d=0;d<4;d++)for(let m=0;m<2;m++)assert.equal(reflect(reflect(d,m),m),d);});
test('every orientation terminates even with internal reflection cycles',()=>{for(let n=0;n<6;n++){const r=makeRoom(n);for(let mask=0;mask<2**r.mirrors.length;mask++){const t=trace(r,r.mirrors.map((m,i)=>(mask>>i)&1));assert.ok(t.points.length<=160);}}});

test('minimum rotation targets include all winning configurations',()=>{for(let n=0;n<6;n++){const r=makeRoom(n),o=r.mirrors.map((m,i)=>m.solution^(i%2===0?1:0));assert.equal(minimumRotations(r,o),[2,2,2,3,3,4][n]);assert.equal(minimumRotations(r,r.mirrors.map(m=>m.solution)),0);}});
