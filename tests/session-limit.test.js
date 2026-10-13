import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_SESSION_MS,createSessionClock} from '../site/shared/session-limit.js';
test('clock starts on play, expires at exactly thirty minutes, and cannot extend on resume', () => {
  let time = 100; const clock=createSessionClock({now:()=>time});
  time+=10_000_000; assert.equal(clock.state,'idle'); assert.equal(clock.remaining(),MAX_SESSION_MS);
  assert.equal(clock.start(),true); time+=MAX_SESSION_MS-1;
  assert.equal(clock.start(),true); assert.equal(clock.remaining(),1);
  time+=1; assert.equal(clock.check(),false); assert.equal(clock.state,'expired');
  assert.equal(clock.remaining(),0); assert.equal(clock.start(),false); assert.equal(clock.finish(),false);
});
test('a suspended tab expires on the next check rather than receiving extra time', () => {
  let time=0;const clock=createSessionClock({now:()=>time});clock.start();
  time+=MAX_SESSION_MS+60_000;assert.equal(clock.check(),false);assert.equal(clock.remaining(),0);
});
test('a natural finish freezes its countdown and reset creates a separate round', () => {
  let time=0;const clock=createSessionClock({now:()=>time});clock.start();time=1200;
  assert.equal(clock.finish(),true);const remaining=clock.remaining();
  time+=MAX_SESSION_MS*2;assert.equal(clock.check(),true);assert.equal(clock.remaining(),remaining);assert.equal(clock.start(),false);
  clock.reset();assert.equal(clock.state,'idle');assert.equal(clock.remaining(),MAX_SESSION_MS);assert.equal(clock.start(),true);
  time+=MAX_SESSION_MS;assert.equal(clock.finish(),false);
  clock.reset();assert.equal(clock.start(),true);
});
test('limits longer than thirty minutes and invalid limits are rejected', () => {
  for(const limitMs of [MAX_SESSION_MS+1,0,-1,NaN,Infinity])assert.throws(()=>createSessionClock({limitMs}),RangeError);
  assert.equal(createSessionClock({limitMs:60_000}).remaining(),60_000);
});

test('finish samples time atomically and an ended idle round cannot be resumed', () => {
  let time=0;const clock=createSessionClock({limitMs:3,now:()=>time++});
  clock.start();assert.equal(clock.finish(),true);assert.equal(clock.remaining(),1);
  const idle=createSessionClock();assert.equal(idle.finish(),true);assert.equal(idle.state,'finished');assert.equal(idle.start(),false);
});
