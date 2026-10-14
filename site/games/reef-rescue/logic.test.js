import test from 'node:test';import assert from 'node:assert/strict';import {createState,advance,neighbors,won} from './purelogic.js';
test('edges do not wrap and pumping drains a cross',()=>{assert.deepEqual(neighbors(3),[7,2]);let s=createState();s.water[0]=3;s.water[1]=2;s.water[4]=2;const n=advance(s,'pump',0);assert.deepEqual(n.water.slice(0,2),[0,0]);assert.equal(n.water[4],0);assert.equal(s.water[0],3);});
test('wall absorbs forecast rain, ages, and cannot be stacked',()=>{let s=advance(createState(),'wall',5);assert.equal(s.hp[0],3);assert.equal(s.walls[5],2);assert.equal(advance(s,'wall',5),s);});
test('neglect loses habitats and natural rounds stop',()=>{let s=createState();for(let i=0;i<12;i++)s=advance(s,'wait',0);assert(s.ended);assert.equal(won(s),false);assert.equal(advance(s,'pump',5),s);});
test('invalid actions preserve state',()=>{const s=createState();assert.equal(advance(s,'wall',99),s);assert.equal(advance(s,'fish',1),s);});
test('forecast wall scheduling can rescue all four habitats',()=>{let s=createState();for(const i of [5,9,6,10,9,6,5,9,10,6,5,9])s=advance(s,'wall',i);assert(won(s));assert.equal(s.hp.filter(h=>h>0).length,4);});
