import test from 'node:test';
import assert from 'node:assert/strict';
import {LANTERNS,sampleLantern} from '../dist/engine.js';

const config=LANTERNS.find(l=>l.id==='landscape');

test('landscape lantern has four continuous stages and an immediate layered wake',()=>{
  const idle=sampleLantern(config,0),early=sampleLantern(config,.2),wake=sampleLantern(config,.9);
  assert.equal(idle.phase,'illuminating');
  assert.ok(early.lightCore>idle.lightCore+.15);
  assert.ok(early.patternReveal>0);
  assert.ok(wake.y<config.y-4);
  assert.equal(sampleLantern(config,1).phase,'ascending');
  assert.equal(sampleLantern(config,5.7).phase,'dissolving');
  assert.equal(sampleLantern(config,8).phase,'idle');
});

test('landscape ascent follows a curved eased path with uniform scale',()=>{
  const first=sampleLantern(config,1),middle=sampleLantern(config,3.2),late=sampleLantern(config,5.45);
  assert.ok(first.y>middle.y&&middle.y>late.y);
  assert.ok(middle.x!==config.x+(config.path.endX-config.x)*.5);
  assert.ok(middle.scale<first.scale&&late.scale<middle.scale);
  assert.ok(Math.abs(middle.rotation)<.05);
  assert.equal('scaleX' in middle,false);
  assert.equal('scaleY' in middle,false);
});

test('glow fades before the silk body and the source returns softly',()=>{
  const a=sampleLantern(config,5.8),b=sampleLantern(config,6.45),c=sampleLantern(config,7.35),end=sampleLantern(config,8);
  assert.ok(b.externalGlow<a.externalGlow);
  assert.ok(b.bodyOpacity>b.externalGlow);
  assert.ok(c.bodyOpacity>0&&c.returnOpacity>0);
  assert.equal(end.opacity,0);
  assert.equal(end.returnOpacity,1);
});

test('refined landscape trajectory remains inside the wall and clear of calligraphy',()=>{
  for(let t=0;t<=8;t+=.01){const f=sampleLantern(config,t);assert.ok(f.y-48*f.scale>580);assert.ok(f.y+40*f.scale<850);assert.ok(f.x+48*f.scale<770);}
});
