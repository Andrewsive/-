/**
 * Sensor-independent lantern choreography. Coordinates refer to the supplied
 * 1448 × 1086 architectural photograph. All times are seconds; angles radians.
 */
const entries = [
  ['plum', '梅枝灯', '春信先归', 160, 806, 8.2, 181, 636, 19, 'petals'],
  ['koi', '锦鲤灯', '年年有余', 294, 805, 8.8, 316, 654, -20, 'fish'],
  ['palace', '宫灯', '华灯映福', 426, 800, 8.5, 406, 636, 17, 'facets'],
  ['lotus', '莲影灯', '清和如意', 557, 807, 9.2, 575, 650, -19, 'lotus'],
  ['landscape', '山水灯', '山河长安', 708, 805, 8.9, 682, 642, 12, 'landscape'],
  ['blossom', '花信灯', '一枝迎春', 833, 808, 7.8, 817, 746, 11, 'petals'],
  ['bamboo', '竹影灯', '节节平安', 953, 807, 8.3, 936, 750, -9, 'wind'],
  ['ruyi', '如意灯', '万事顺遂', 1067, 808, 7.6, 1084, 746, 10, 'ruyi'],
  ['moon', '月白灯', '长乐未央', 1168, 807, 8.6, 1189, 745, -10, 'moon'],
];

export const LANTERNS = Object.freeze(entries.map((row, index) => {
  const [id, name, blessing, x, y, duration, endX, endY, drift, effect] = row;
  return Object.freeze({
    id, type: id, name, label: name, blessing, x, y, duration, effect,
    color: '#f7ca73', accent: '#b95232', triggerRadius: 42,
    seed: index * 1.618 + 0.4,
    path: Object.freeze({
      startX: x, startY: y, endX, endY, drift,
      controlX1: x + drift * 1.4, controlY1: y - (y - endY) * 0.25,
      controlX2: endX - drift * 1.1, controlY2: endY + (y - endY) * 0.22,
    }),
  });
}));

const byId = new Map(LANTERNS.map(lantern => [lantern.id, lantern]));
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const cubic = (a, b, c, d, t) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

/** An immutable pose which can be consumed by Canvas, SVG, or a projector. */
export function sampleLantern(configOrId, age = 0) {
  const config = typeof configOrId === 'string' ? byId.get(configOrId) : configOrId;
  if (!config) return null;
  const duration = config.duration;
  const time = clamp(Number.isFinite(age) ? age : 0, 0, duration);
  const liftAt = 0.65;
  const dissolveAt = duration - 1.45;
  const returnAt = duration - 0.55;
  const motionProgress = smooth((time - liftAt) / (dissolveAt - liftAt));
  const dissolve = smooth((time - dissolveAt) / 1.1);
  const returnOpacity = smooth((time - returnAt) / (duration - returnAt));
  const p = config.path;
  const wave = Math.sin(motionProgress * Math.PI) * Math.sin(motionProgress * Math.PI * 2.2 + config.seed);
  const x = cubic(p.startX, p.controlX1, p.controlX2, p.endX, motionProgress) + wave * 4;
  const y = cubic(p.startY, p.controlY1, p.controlY2, p.endY, motionProgress) - dissolve * 6;
  const inflation = Math.sin(clamp(time / liftAt) * Math.PI) * 0.035;
  const scale = (1 + inflation - 0.38 * motionProgress) * (1 - dissolve * 0.82);
  const ignition = Math.sin(clamp(time / liftAt) * Math.PI);
  const glow = (0.78 + ignition * 0.75 + 0.07 * Math.sin(time * 2.7 + config.seed)) * (1 - dissolve);
  const phase = time >= duration ? 'idle' : time >= returnAt ? 'returning' : time >= dissolveAt ? 'dissolving' : time >= liftAt ? 'ascending' : 'illuminating';
  return {
    id: config.id, age: time, duration, progress: time / duration,
    phase, x, y, scale,
    rotation: Math.sin(time * 1.3 + config.seed) * 0.035 * Math.sin(motionProgress * Math.PI) + (config.id === 'palace' ? Math.sin(time * 0.9) * 0.08 * motionProgress : 0),
    opacity: 1 - dissolve, glow, illumination: 1 + glow,
    motionProgress, dissolve, returnOpacity,
    ringProgress: clamp(time / 1.6),
  };
}

/**
 * One hardware signal maps to triggerLantern(id). The engine has no knowledge
 * of DOM events, pointer locations, WebSockets, serial ports, or renderers.
 */
export class LanternEngine {
  constructor({ onChange } = {}) {
    this.onChange = typeof onChange === 'function' ? onChange : () => {};
    this.active = new Map();
    this.paused = false;
    this.speed = 1;
    this.elapsed = 0;
    this.completedCount = 0;
    this.sequence = 0;
  }

  triggerLantern(id) {
    if (!byId.has(id)) return { status: 'invalid', id };
    if (this.active.has(id)) return { status: 'busy', id };
    this._start(id);
    this._notify('started', id);
    return { status: 'started', id };
  }

  _start(id) {
    this.active.set(id, { id, age: 0, startedAt: this.elapsed, sequence: ++this.sequence });
  }

  /** Every lantern owns its timeline, with no shared concurrency limit. */
  update(deltaSeconds) {
    if (this.paused || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return this.getState();
    const step = deltaSeconds * this.speed;
    const before = [...this.active.values()].map(a => `${a.id}:${sampleLantern(a.id, a.age).phase}`).join('|');
    let changed = false;
    this.elapsed += step;
    for (const active of this.active.values()) {
      active.age += step;
      if (active.age >= byId.get(active.id).duration - 1e-8) {
        this.active.delete(active.id);
        this.completedCount++;
        changed = true;
      }
    }
    const after = [...this.active.values()].map(a => `${a.id}:${sampleLantern(a.id, a.age).phase}`).join('|');
    if (changed || before !== after) this._notify('phase');
    return this.getState();
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    this._notify(this.paused ? 'paused' : 'resumed');
    return this.paused;
  }

  setSpeed(speed) {
    if (Number.isFinite(Number(speed))) this.speed = clamp(Number(speed), 0.5, 2);
    this._notify('speed');
    return this.speed;
  }

  reset() {
    this.active.clear();
    this.elapsed = 0;
    this.completedCount = 0;
    this.sequence = 0;
    this._notify('reset');
    return this.getState();
  }

  getFrame(activeOrId) {
    const active = typeof activeOrId === 'string' ? this.active.get(activeOrId) : activeOrId;
    return active ? sampleLantern(active.id, active.age) : null;
  }

  getState() {
    return {
      active: [...this.active.values()].map(active => {
        const config = byId.get(active.id);
        return { ...active, duration: config.duration, config, frame: sampleLantern(config, active.age) };
      }),
      paused: this.paused, speed: this.speed,
      elapsed: this.elapsed, completedCount: this.completedCount,
    };
  }

  _notify(type, id) { this.onChange(this.getState(), { type, id }); }
}
