import test from 'node:test';
import assert from 'node:assert/strict';
import { LanternEngine, LANTERNS, sampleLantern } from '../dist/engine.js';

test('all nine lanterns respond immediately and finish independently', () => {
  const engine = new LanternEngine();
  const results = LANTERNS.map(l => engine.triggerLantern(l.id));
  assert.ok(results.every(result => result.status === 'started'));
  assert.equal(engine.getState().active.length, 9);
  for (const lantern of LANTERNS) {
    assert.equal(engine.getFrame(lantern.id).age, 0);
    assert.equal(engine.triggerLantern(lantern.id).status, 'busy');
  }
  assert.equal(engine.triggerLantern('unknown').status, 'invalid');
  engine.update(7.7);
  assert.equal(engine.getState().completedCount, 1);
  assert.equal(engine.getFrame('ruyi'), null);
  assert.equal(engine.getState().active.length, 8);
  assert.equal(engine.triggerLantern('ruyi').status, 'started');
  assert.equal(engine.getState().active.length, 9);
  assert.equal(engine.getFrame('ruyi').age, 0);
  assert.equal(engine.getFrame('lotus').age, 7.7);
  engine.update(10);
  assert.equal(engine.getState().completedCount, 10);
  assert.equal(engine.getState().active.length, 0);
  assert.ok(LANTERNS.every(lantern => engine.triggerLantern(lantern.id).status === 'started'));
  assert.equal(engine.getState().active.length, 9);
});

test('pause freezes choreography and speed changes affect subsequent time only', () => {
  const engine = new LanternEngine();
  engine.triggerLantern('lotus');
  engine.update(1);
  engine.setPaused(true);
  const frozen = engine.getFrame('lotus');
  engine.update(20);
  assert.deepEqual(engine.getFrame('lotus'), frozen);
  engine.setSpeed(2);
  engine.setPaused(false);
  engine.update(1);
  assert.equal(engine.getFrame('lotus').age, 3);
  assert.equal(engine.setSpeed(50), 2);
  assert.equal(engine.setSpeed(-4), 0.5);
});

test('long ticks and small ticks preserve the same independent choreography', () => {
  const a = new LanternEngine(), b = new LanternEngine();
  LANTERNS.forEach(l => { a.triggerLantern(l.id); b.triggerLantern(l.id); });
  a.update(8.4);
  for (let i = 0; i < 84; i++) b.update(0.1);
  const first = a.getState(), second = b.getState();
  assert.equal(first.completedCount, 5);
  assert.equal(first.active.length, 4);
  assert.equal(first.completedCount, second.completedCount);
  assert.deepEqual(first.active.map(v => v.id), second.active.map(v => v.id));
  first.active.forEach((v, i) => assert.ok(Math.abs(v.age - second.active[i].age) < 1e-7));
});

test('each lantern lights immediately, lifts, dissolves, then restores its source', () => {
  for (const config of LANTERNS) {
    const initial = sampleLantern(config, 0);
    assert.equal(initial.phase, 'illuminating');
    assert.ok(initial.glow > (config.id === 'landscape' ? 0.3 : 0.65));
    assert.equal(initial.x, config.x);
    assert.equal(initial.y, config.y);
    const flight = sampleLantern(config, config.duration * 0.5);
    assert.equal(flight.phase, 'ascending');
    assert.ok(flight.y < config.y - 15);
    const ending = sampleLantern(config, config.duration);
    assert.equal(ending.opacity, 0);
    assert.equal(ending.returnOpacity, 1);
    assert.equal(ending.phase, 'idle');
  }
});

test('visible trajectories stay under roof and keep clear of original calligraphy', () => {
  for (const config of LANTERNS) {
    for (let t = 0; t <= config.duration; t += 0.015) {
      const frame = sampleLantern(config, t);
      assert.ok(frame.x - 48 * frame.scale > 80);
      assert.ok(frame.x + 48 * frame.scale < 1380);
      assert.ok(frame.y - 48 * frame.scale > 580);
      assert.ok(frame.y + 40 * frame.scale < 850);
      if (config.x > 760) assert.ok(frame.y - 48 * frame.scale >= 700);
      else assert.ok(frame.x + 48 * frame.scale < 770);
    }
  }
});

test('reset clears all nine timelines without changing chosen speed or pause', () => {
  const engine = new LanternEngine();
  LANTERNS.forEach(l => engine.triggerLantern(l.id));
  engine.update(2);
  engine.setPaused(true);
  engine.setSpeed(1.5);
  const state = engine.reset();
  assert.equal(state.active.length, 0);
  assert.equal(state.elapsed, 0);
  assert.equal(state.paused, true);
  assert.equal(state.speed, 1.5);
  assert.equal(engine.triggerLantern('lotus').status, 'started');
});

test('state snapshots cannot mutate independent running timelines', () => {
  const engine = new LanternEngine();
  LANTERNS.forEach(l => engine.triggerLantern(l.id));
  const snapshot = engine.getState();
  snapshot.active[0].age = 100;
  snapshot.active[0].frame.x = -100;
  snapshot.active.length = 0;
  assert.equal(engine.getFrame('plum').age, 0);
  assert.equal(engine.getFrame('plum').x, LANTERNS[0].x);
  assert.equal(engine.getState().active.length, 9);
});

test('sample replay restarts only the landscape timeline', () => {
  const engine = new LanternEngine();
  engine.triggerLantern('landscape');
  engine.triggerLantern('lotus');
  engine.update(3);
  const lotusAge = engine.getFrame('lotus').age;
  assert.equal(engine.restartLantern('landscape').status, 'started');
  assert.equal(engine.getFrame('landscape').age, 0);
  assert.equal(engine.getFrame('lotus').age, lotusAge);
  assert.equal(engine.getState().active.length, 2);
});
