import test from 'node:test';
import assert from 'node:assert/strict';
import { LanternEngine, LANTERNS, sampleLantern } from '../dist/engine.js';

test('three independent lanterns play while the rest queue once in FIFO order', () => {
  const engine = new LanternEngine();
  const results = LANTERNS.map(l => engine.triggerLantern(l.id));
  assert.deepEqual(results.map(r => r.status), ['started', 'started', 'started', 'queued', 'queued', 'queued', 'queued', 'queued', 'queued']);
  assert.equal(engine.triggerLantern('plum').status, 'busy');
  assert.equal(engine.triggerLantern('lotus').status, 'busy');
  assert.equal(engine.triggerLantern('unknown').status, 'invalid');
  engine.update(8.2);
  assert.deepEqual(engine.getState().active.map(a => a.id), ['koi', 'palace', 'lotus']);
  assert.deepEqual(engine.getState().queue, ['landscape', 'blossom', 'bamboo', 'ruyi', 'moon']);
  assert.equal(engine.getState().active.find(a => a.id === 'lotus').age, 0);
  for (let i = 0; i < 400; i++) {
    engine.update(0.1);
    assert.ok(engine.getState().active.length <= 3);
  }
  assert.equal(engine.getState().completedCount, 9);
  assert.equal(engine.getState().active.length, 0);
  assert.equal(engine.getState().queue.length, 0);
  assert.equal(engine.triggerLantern('plum').status, 'started');
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

test('long ticks and small ticks consume the same queued choreography', () => {
  const a = new LanternEngine(), b = new LanternEngine();
  LANTERNS.forEach(l => { a.triggerLantern(l.id); b.triggerLantern(l.id); });
  a.update(17);
  for (let i = 0; i < 170; i++) b.update(0.1);
  const first = a.getState(), second = b.getState();
  assert.deepEqual(first.queue, second.queue);
  assert.equal(first.completedCount, second.completedCount);
  assert.deepEqual(first.active.map(v => v.id), second.active.map(v => v.id));
  first.active.forEach((v, i) => assert.ok(Math.abs(v.age - second.active[i].age) < 1e-7));
});

test('each lantern lights immediately, lifts, dissolves, then restores its source', () => {
  for (const config of LANTERNS) {
    const initial = sampleLantern(config, 0);
    assert.equal(initial.phase, 'illuminating');
    assert.ok(initial.glow > 0.65);
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

test('reset clears active and queued work without changing chosen speed or pause', () => {
  const engine = new LanternEngine();
  LANTERNS.forEach(l => engine.triggerLantern(l.id));
  engine.update(2);
  engine.setPaused(true);
  engine.setSpeed(1.5);
  const state = engine.reset();
  assert.equal(state.active.length, 0);
  assert.equal(state.queue.length, 0);
  assert.equal(state.elapsed, 0);
  assert.equal(state.paused, true);
  assert.equal(state.speed, 1.5);
  assert.equal(engine.triggerLantern('lotus').status, 'started');
});

test('state snapshots cannot mutate the running queue or timeline', () => {
  const engine = new LanternEngine();
  LANTERNS.slice(0, 4).forEach(l => engine.triggerLantern(l.id));
  const snapshot = engine.getState();
  snapshot.active[0].age = 100;
  snapshot.queue.length = 0;
  assert.equal(engine.getFrame('plum').age, 0);
  assert.equal(engine.getState().queue.length, 1);
});
