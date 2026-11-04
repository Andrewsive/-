import test from 'node:test';
import assert from 'node:assert/strict';
import {LANTERNS} from '../dist/engine.js';
import {LanternResonance} from '../dist/resonance.js';

const item=(index,sequence=1,phase='ascending')=>({
  id:LANTERNS[index].id,sequence,frame:{phase,x:LANTERNS[index].x,y:LANTERNS[index].y-50,scale:.9}
});
const state=(elapsed,active)=>({elapsed,active});

test('only adjacent rising lanterns create a resonance',()=>{
  const resonance=new LanternResonance();
  assert.equal(resonance.sample(state(1,[item(0),item(2)])).length,0);
  assert.equal(resonance.sample(state(1.1,[item(0,2),item(1,2)])).length,1);
  assert.equal(resonance.sample(state(1.2,[item(3,1,'illuminating'),item(4)])).length,1);
});

test('all nine rising lanterns create all eight adjacent pair effects',()=>{
  const resonance=new LanternResonance();
  const pairs=resonance.sample(state(2,LANTERNS.map((_,i)=>item(i))));
  assert.equal(pairs.length,8);
  assert.deepEqual(pairs.map(x=>x.id),LANTERNS.slice(0,-1).map((l,i)=>`${l.id}-${LANTERNS[i+1].id}`));
});

test('shared neighbor creates two effects and leaving ascent fades instead of cutting',()=>{
  const resonance=new LanternResonance();
  assert.equal(resonance.sample(state(1,[item(0),item(1),item(2)])).length,2);
  const full=resonance.sample(state(1.5,[item(0),item(1),item(2)]));
  resonance.sample(state(1.7,[item(0,1,'dissolving'),item(1),item(2)]));
  const fading=resonance.sample(state(2,[item(0,1,'dissolving'),item(1),item(2)]));
  assert.equal(fading.length,2);
  assert.ok(fading[0].strength<full[0].strength);
  assert.equal(resonance.sample(state(2.5,[item(1),item(2)])).length,1);
});

test('one burst per run, new sequence can resonate again, and reset clears memory',()=>{
  const resonance=new LanternResonance();
  assert.equal(resonance.sample(state(1,[item(0),item(1)])).length,1);
  assert.equal(resonance.sample(state(5,[item(0),item(1)])).length,0);
  assert.equal(resonance.sample(state(5.1,[item(0),item(1)])).length,0);
  assert.equal(resonance.sample(state(6,[item(0,2),item(1,2)])).length,1);
  resonance.reset();
  assert.equal(resonance.sample(state(0,[item(0,2),item(1,2)])).length,1);
  assert.equal(resonance.sample(state(.3,[item(0,2),item(1,2)]))[0].strength>0,true);
});

test('a frozen timeline produces an identical sample',()=>{
  const resonance=new LanternResonance();
  resonance.sample(state(2,[item(4),item(5)]));
  const first=resonance.sample(state(2.4,[item(4),item(5)]));
  const second=resonance.sample(state(2.4,[item(4),item(5)]));
  assert.deepEqual(second,first);
});
